/**
 * Health, OpenAPI spec, và diagnostics nội bộ (test-ai/test-quyet).
 */

import { buildMuseRequest } from './museRequest';
import { QuyetDecisionProvider } from './decision/quyetProvider';
import { CANONICAL_CHUNKS } from './ragEngine';
import { vectorSearch } from './vectorRetriever';
import { jsonResponse, type Env } from './http';

export function handleHealth(env: Env, corsHeaders: Headers): Response {
  return jsonResponse(
    {
      status: 'ok',
      service: 'Cloudflare Workers API',
      platform: 'Cloudflare Edge (Pages + Workers + D1 + R2 + Vectorize)',
      aiModel: 'Muse Spark 1.3 (Meta AI)',
      decisionModel: 'Quyet-1.0-Large (FPT Cloud AI)',
      hasMuse: !!env.MUSE_API_KEY,
      hasQuyet: !!env.FPT_AI_KEY,
      vectorizeEnabled: env.VECTORIZE_ENABLED === '1' && !!env.VECTORIZE && !!env.AI,
      decisionMode: env.DECISION_MODE || 'enforce',
      timestamp: new Date().toISOString(),
    },
    200, corsHeaders
  );
}

export function handleOpenApi(corsHeaders: Headers): Response {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Trợ Lý Thuế TMĐT & Hộ Kinh Doanh Việt Nam 2026',
      description: 'API hỗ trợ tra cứu chính sách thuế, thuế suất, phương pháp tính thuế và thủ tục khai thuế cho Hộ kinh doanh, Cá nhân kinh doanh, bán hàng trên các sàn TMĐT (TikTok Shop, Shopee, Lazada...) tại Việt Nam theo quy định năm 2026.',
      version: '1.0.0'
    },
    servers: [{ url: 'https://tax-hkd.pages.dev', description: 'Cloudflare Edge Production Server' }],
    paths: {
      '/api/chatgpt/tax-qa': {
        post: {
          operationId: 'askTaxAdvisor',
          summary: 'Hỏi đáp và tra cứu luật thuế HKD & TMĐT',
          description: 'Gửi câu hỏi về thuế để nhận phân tích chi tiết kèm trích lục văn bản pháp luật căn cứ (Nghị định 141/2026, Nghị định 252/2026, Thông tư 40/2021...).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    question: {
                      type: 'string',
                      description: 'Câu hỏi về thuế của người dùng (ví dụ: Bán hàng trên TikTok Shop doanh thu 600 triệu/năm nộp những thuế gì và bao nhiêu %?)'
                    }
                  },
                  required: ['question']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Kết quả tư vấn thuế kèm căn cứ đối soát',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      answer: { type: 'string', description: 'Nội dung câu trả lời tư vấn thuế chi tiết' },
                      legal_citations: { type: 'array', items: { type: 'string' }, description: 'Danh sách văn bản luật căn cứ' },
                      evidence: { type: 'array', items: { type: 'string' }, description: 'Trích lục quy định đối chiếu' },
                      source: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  return jsonResponse(spec, 200, corsHeaders);
}

export async function handleTestAi(request: Request, env: Env, corsHeaders: Headers, url: URL): Promise<Response> {
  if (request.headers.get('X-Internal-Caller') !== 'mcp') {
    return jsonResponse({ success: false, error: 'Forbidden: Endpoint này chỉ dành riêng cho kiểm thử nội bộ.' }, 403, corsHeaders);
  }
  try {
    const vectorizeAction = url.searchParams.get('vectorize');
    if (vectorizeAction === 'backfill') {
      if (!env.AI || !env.VECTORIZE) {
        return jsonResponse({ success: false, error: 'Thiếu binding AI hoặc VECTORIZE.' }, 500, corsHeaders);
      }
      const items = CANONICAL_CHUNKS.map((c) => ({
        id: String(c.ref_id || c.id),
        text: `${c.section || ''}\n${c.text.slice(0, 3500)}`.trim(),
        tier: c.tier,
      }));
      const batchSize = 25;
      const allVectors: Array<{ id: string; values: number[]; metadata: Record<string, string> }> = [];
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const emb = await env.AI.run('@cf/baai/bge-m3', { text: batch.map((b) => b.text) });
        const vectors = emb?.data;
        if (!Array.isArray(vectors) || vectors.length !== batch.length) {
          throw new Error(`Batch embedding failed at offset ${i}: ${JSON.stringify(emb).slice(0, 200)}`);
        }
        for (let idx = 0; idx < batch.length; idx++) {
          allVectors.push({
            id: batch[idx].id,
            values: vectors[idx],
            metadata: { tier: batch[idx].tier },
          });
        }
      }
      const mutation = await env.VECTORIZE.upsert(allVectors);
      return jsonResponse({ success: true, index: 'tax-kb-v1', upserted: allVectors.length, totalChunks: items.length, mutation }, 200, corsHeaders);
    }
    if (vectorizeAction === 'query') {
      const q = url.searchParams.get('q') || 'Ngưỡng doanh thu miễn thuế hộ kinh doanh năm 2026';
      const hits = await vectorSearch(q, env, 6);
      return jsonResponse({
        success: true,
        query: q,
        vectorizeEnabled: env.VECTORIZE_ENABLED === '1',
        hits,
      }, 200, corsHeaders);
    }
    const museKey = env.MUSE_API_KEY;
    if (!museKey) {
      return jsonResponse({ success: false, error: 'MUSE_API_KEY chưa được cấu hình.' }, 200, corsHeaders);
    }
    const probe = url.searchParams.get('probe');
    if (probe) {
      const targetUrl = probe.startsWith('http') ? probe : `https://api.meta.ai${probe}`;
      const probeRes = await fetch(targetUrl, {
        method: request.method,
        headers: {
          Authorization: `Bearer ${museKey}`,
          'Content-Type': 'application/json',
        },
        body: request.method === 'POST' ? await request.text() : undefined,
      });
      return jsonResponse({ probe, status: probeRes.status, body: await probeRes.text() }, 200, corsHeaders);
    }
    if (url.searchParams.get('models')) {
      const mRes = await fetch('https://api.meta.ai/v1/models', {
        headers: { Authorization: `Bearer ${museKey}` },
      });
      return jsonResponse({ status: mRes.status, body: await mRes.text() }, 200, corsHeaders);
    }
    const testBody: { instructions?: string; message?: string; model?: string } =
      request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const testInstructions = testBody.instructions || 'Bạn là trợ lý AI.';
    const testMessage = testBody.message || 'Chào bạn, 1 + 1 bằng mấy?';
    let testData: unknown = null;
    let lastErr: { status: number; body: string } | null = null;
    for (let attempt = 1; attempt <= 3 && !testData; attempt++) {
      if (attempt > 1) await new Promise(r => setTimeout(r, attempt * 250));
      const museModel = 'muse-spark-1.3-contributor';
      try {
        const testRes = await fetch('https://api.meta.ai/v1/responses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${museKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(buildMuseRequest(testInstructions, [], testMessage, false, testBody.model || museModel)),
          signal: AbortSignal.timeout(30000),
        });
        if (testRes.ok) {
          testData = await testRes.json();
          break;
        }
        lastErr = { status: testRes.status, body: (await testRes.text()).slice(0, 300) };
        if (testRes.status !== 429 && testRes.status !== 404 && testRes.status < 500) break;
      } catch (err: unknown) {
        lastErr = { status: 500, body: (err as Error).message };
      }
    }
    if (!testData) {
      return jsonResponse({ success: false, status: lastErr?.status || 500, error: lastErr?.body || 'Connection error' }, 200, corsHeaders);
    }
    return jsonResponse({ success: true, model: 'Muse Spark 1.3 (Meta AI)', res: testData }, 200, corsHeaders);
  } catch (e: unknown) {
    return jsonResponse({ success: false, error: (e as Error).message }, 200, corsHeaders);
  }
}

export async function handleTestQuyet(env: Env, corsHeaders: Headers, url: URL): Promise<Response> {
  try {
    const key = env.FPT_AI_KEY;
    if (!key) return jsonResponse({ success: false, error: 'FPT_AI_KEY missing' }, 200, corsHeaders);
    const provider = new QuyetDecisionProvider(key);
    const start = Date.now();
    const fixtures: Record<string, string> = {
      repair: 'Người bán gói dịch vụ sửa chữa có kèm phụ tùng miễn phí trên quảng cáo nhưng giá đã bao gồm phụ tùng. Tính nhóm nào?',
      negated: 'Tôi là cá nhân kinh doanh sửa chữa máy vi tính, không bán lẻ tạp hóa. Năm 2026 doanh thu 1,5 tỷ, hỏi điều kiện giảm GTGT và thuế TNCN.',
      mixed: 'Tôi làm affiliate có doanh thu hoa hồng TikTok 500 triệu và còn có lương ở công ty. Khoản tax 5 triệu giữ lại đã chắc là thuế nộp thay chưa, có được hoàn lại và có phải cộng lương không?',
    };
    const res = await provider.classifyBusiness(fixtures[url.searchParams.get('case') || '']
      || 'Em bán hàng trên TikTok Shop doanh thu 1.5 tỷ nộp bao nhiêu?');
    return jsonResponse({ success: !!res, duration: Date.now() - start, res, diagnostics: provider.businessDiagnostics }, 200, corsHeaders);
  } catch (e: unknown) {
    return jsonResponse({ success: false, error: (e as Error).message, stack: (e as Error).stack }, 200, corsHeaders);
  }
}
