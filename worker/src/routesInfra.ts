/**
 * Health, OpenAPI spec, và diagnostics nội bộ (test-ai/test-quyet).
 */

import { jsonResponse, type Env } from './http';
import { PIPELINE_VERSION, ASSURANCE_CAPABILITIES } from './buildInfo';
import { recognitionConfig, caseRecognizer } from './recognition/recognizer';
import recognitionIndex from './recognition/caseIndex.json';
import recognitionSourcePolicy from './recognition/sourcePolicy.json';
import { legalCoverageDocuments, legalCoverageSummary } from './kb/legalCoverage';

export function handleHealth(env: Env, corsHeaders: Headers): Response {
  return jsonResponse(
    {
      status: 'ok',
      pipelineVersion: PIPELINE_VERSION,
      assurance: ASSURANCE_CAPABILITIES,
      service: 'Cloudflare Workers API',
      platform: 'Cloudflare Edge (Pages + Workers + D1 + R2 + Vectorize)',
      aiModel: 'Muse Spark 1.3 (Meta AI)',
      generationEndpoint: 'https://api.meta.ai/v1/responses',
      decisionModel: env.JEV_API_KEY ? 'jev-latest (TypeSafe AI)' : 'Quyet-1.0-Large (FPT Cloud AI)',
      hasMuse: !!env.MUSE_API_KEY,
      hasQuyet: !!(env.JEV_API_KEY || env.FPT_AI_KEY),
      hasJev: !!env.JEV_API_KEY,
      vectorizeEnabled: env.VECTORIZE_ENABLED === '1' && !!env.VECTORIZE && !!env.AI,
      decisionMode: env.DECISION_MODE || 'enforce',
      caseRecognition: {...recognitionConfig(env),version:caseRecognizer.version,approvedDescriptors:recognitionIndex.entries.length,canonicalHash:recognitionIndex.canonical_hash,quarantinedVerifiedRefs:recognitionSourcePolicy.blocked_verified_refs},
      legalCorpusCoverage: legalCoverageSummary(),
      timestamp: new Date().toISOString(),
    },
    200, corsHeaders
  );
}

export function handleLegalCoverage(corsHeaders: Headers): Response {
  return jsonResponse({
    policy: 'FULL requires a verified official provision inventory, a SHA-256 source checksum, and coverage of every expected provision.',
    summary: legalCoverageSummary(),
    documents: legalCoverageDocuments(),
  }, 200, corsHeaders);
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

export async function handleTestAi(_request:Request,_env:Env,corsHeaders:Headers,_url:URL):Promise<Response>{return jsonResponse({success:false,error:'Not found.'},404,corsHeaders);}
export async function handleTestQuyet(_env:Env,corsHeaders:Headers,_url:URL):Promise<Response>{return jsonResponse({success:false,error:'Not found.'},404,corsHeaders);}
