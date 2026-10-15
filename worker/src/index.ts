/**
 * ====================================================================
 * CLOUDFLARE WORKERS BACKEND - HỆ THỐNG THUẾ TMĐT & HKD 2026
 * ====================================================================
 * Stack:
 * - Runtime: Cloudflare Workers
 * - Database: Cloudflare D1 (SQLite)
 * - Storage: Cloudflare R2 (Ảnh & File hoá đơn/chứng từ)
 * - AI: Muse Spark 1.3 (Meta AI) / Knowledge Engine
 * - CDN & WAF: Cloudflare Edge
 */

import { RagChunk } from './ragEngine';
import { verifiedFirebasePhone } from './firebaseAuth';
import { retrieve, buildContext, analyzeAmounts } from './retriever';
import { resolveAnswerScope, scopeInstructions, intentInstructions, OUT_OF_SCOPE_RESPONSE } from './answerScope';
import { resolveTaxRelevance } from './taxRelevance';
import { matchPendingTopics } from './pendingTopics';
import { buildConversationRetrievalQuery, normalizeConversationHistory } from './conversation';
import { buildMuseRequest } from './museRequest';
import { guardTaxAnswer } from './taxAnswerGuard';
import { answerVerifiedBusinessTax } from './businessTaxAnswer';
import { answerPriorityTax } from './priorityTaxAnswer';
import { missingAnswerIntents, validateLegalCitations, canUseVerifiedAnswer } from './answerValidation';
import { answerVerifiedReliefEligibility } from './reliefEligibilityAnswer';
import { understandQuery, refineQueryWithL2 } from './decision/understandQuery';
import { QuyetDecisionProvider } from './decision/quyetProvider';
import { filterAndGateEvidence } from './decision/evidenceGate';
import { evaluateDecisionFrame, evaluateMultiYear } from './rules/evaluator';
import { renderDeterministicAnswer, renderMultiYearComparison } from './decision/render';
import { validateAnswer } from './decision/answerValidator';
import { buildRetrievalPlan } from './decision/retrievalPlan';
import { decide } from './decision/orchestrator';
import { CURRENT_RULESET_VERSION } from './rules/registry';
import { CANONICAL_CHUNKS } from './ragEngine';
import chunkMeta from './kb/chunkMeta.json';

let kbVersionPromise: Promise<string> | undefined;
function knowledgeVersion(): Promise<string> {
  if (!kbVersionPromise) {
    kbVersionPromise = crypto.subtle.digest('SHA-256', new TextEncoder().encode(
      JSON.stringify(CANONICAL_CHUNKS) + JSON.stringify(chunkMeta)
    )).then(bytes => Array.from(new Uint8Array(bytes)).slice(0, 12)
      .map(value => value.toString(16).padStart(2, '0')).join(''));
  }
  return kbVersionPromise;
}

export interface Env {
  DB: D1Database;
  STORAGE_BUCKET: R2Bucket;
  AI?: any;
  ENVIRONMENT?: string;
  CORS_ALLOW_ORIGIN?: string;
  MUSE_API_KEY?: string;
  FPT_AI_KEY?: string;
  DECISION_MODE?: string;
  DECISION_L2?: string;
  VIP_PHONE?: string;
  VIP_CREDITS?: string;
  SEPAY_API_KEY?: string;
  SEPAY_PATTERN?: string;
}

// CORS Helper
function handleCors(request: Request, env: Env): Headers {
  const headers = new Headers();
  const origin = request.headers.get('Origin');
  const configuredOrigin = env.CORS_ALLOW_ORIGIN || '*';

  if (configuredOrigin === '*') {
    headers.set('Access-Control-Allow-Origin', '*');
  } else if (origin) {
    try {
      const host = new URL(origin).hostname;
      if (
        host === 'tax-hkd.pages.dev' ||
        host.endsWith('.tax-hkd.pages.dev') ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        origin === configuredOrigin
      ) {
        headers.set('Access-Control-Allow-Origin', origin);
      } else {
        headers.set('Access-Control-Allow-Origin', configuredOrigin);
      }
    } catch {
      headers.set('Access-Control-Allow-Origin', configuredOrigin);
    }
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

function jsonResponse(data: any, status = 200, corsHeaders?: Headers): Response {
  const headers = corsHeaders ? new Headers(corsHeaders) : new Headers();
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = handleCors(request, env);

    // Xử lý Preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path.startsWith('/api/user/')) {
        const verifiedPhone = await verifiedFirebasePhone(request);
        if (!verifiedPhone) return jsonResponse({ success: false, error: 'Firebase sign-in required.' }, 401, corsHeaders);
        const requestedPhone = request.method === 'GET'
          ? url.searchParams.get('phone')
          : ((await request.clone().json().catch(() => ({}))) as { phone?: string }).phone;
        if (requestedPhone !== verifiedPhone) return jsonResponse({ success: false, error: 'Access denied.' }, 403, corsHeaders);
      }
      // 1. HEALTH CHECK & TEST AI (MUSE SPARK API CHUYÊN BIỆT - CHỈ NỘI BỘ MCP)
      if (path === '/api/test-ai') {
        if (request.headers.get('X-Internal-Caller') !== 'mcp') {
          return jsonResponse({ success: false, error: 'Forbidden: Endpoint này chỉ dành riêng cho kiểm thử nội bộ.' }, 403, corsHeaders);
        }
        try {
          const museKey = env.MUSE_API_KEY;
          if (!museKey) {
            return jsonResponse({ success: false, error: 'MUSE_API_KEY chưa được cấu hình.' }, 200, corsHeaders);
          }
          const testBody: any = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
          const testInstructions = testBody.instructions || 'Bạn là trợ lý AI.';
          const testMessage = testBody.message || 'Chào bạn, 1 + 1 bằng mấy?';
          const testRes = await Promise.race([
            fetch('https://api.meta.ai/v1/responses', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${museKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(buildMuseRequest(testInstructions, [], testMessage, false)),
            }),
            new Promise<Response>((_, rej) => setTimeout(() => rej(new Error('timeout')), 45000)),
          ]);
          if (!testRes.ok) {
            const errBody = await testRes.text();
            return jsonResponse({ success: false, status: testRes.status, error: errBody }, 200, corsHeaders);
          }
          const data = await testRes.json();
          return jsonResponse({ success: true, model: 'Muse Spark 1.3 (Meta AI)', res: data }, 200, corsHeaders);
        } catch (e: any) {
          return jsonResponse({ success: false, error: e.message }, 200, corsHeaders);
        }
      }

      if (path === '/api/test-quyet') {
        try {
          const key = env.FPT_AI_KEY;
          if (!key) return jsonResponse({ success: false, error: 'FPT_AI_KEY missing' }, 200, corsHeaders);
          const provider = new QuyetDecisionProvider(key);
          const start = Date.now();
          const res = await provider.classifyAll('Em bán hàng trên TikTok Shop doanh thu 1.5 tỷ nộp bao nhiêu?');
          return jsonResponse({ success: true, duration: Date.now() - start, res }, 200, corsHeaders);
        } catch (e: any) {
          return jsonResponse({ success: false, error: e.message, stack: e.stack }, 200, corsHeaders);
        }
      }

      if (path === '/' || path === '/api/health') {
        return jsonResponse(
          {
            status: 'ok',
            service: 'Cloudflare Workers API',
            platform: 'Cloudflare Edge (Pages + Workers + D1 + R2)',
            aiModel: 'Muse Spark 1.3 (Meta AI)',
            decisionModel: 'Quyet-1.0-Large (FPT Cloud AI)',
            hasMuse: !!env.MUSE_API_KEY,
            hasQuyet: !!env.FPT_AI_KEY,
            decisionMode: env.DECISION_MODE || 'shadow',
            timestamp: new Date().toISOString(),
          },
          200,
          corsHeaders
        );
      }

      // 0. OPENAPI SPECIFICATION DÀNH CHO CHATGPT CUSTOM GPTS (GET /openapi.json)
      if (path === '/openapi.json' || path === '/.well-known/openapi.json') {
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

      // 0b. MODEL CONTEXT PROTOCOL (MCP) HTTP ENDPOINT CHO CHATGPT & MCP CLIENTS (GET / POST /mcp & /api/mcp)
      if (path === '/mcp' || path === '/api/mcp') {
        if (request.method === 'GET') {
          return jsonResponse({
            status: 'ok',
            name: 'tax-qa-mcp',
            version: '1.0.0',
            description: 'Model Context Protocol (MCP) Server for Vietnam Tax Regulations 2026',
            transport: 'streamable-http',
            tools: ['ask_tax_ai']
          }, 200, corsHeaders);
        }

        if (request.method === 'POST') {
          const r: any = await request.json().catch(() => ({}));
          const rid = r.id;
          const method = r.method;
          const params = r.params || {};

          if (method === 'initialize') {
            return jsonResponse({
              jsonrpc: '2.0',
              id: rid,
              result: {
                protocolVersion: params?.protocolVersion || '2024-11-05',
                capabilities: { tools: { listChanged: false } },
                serverInfo: { name: 'tax-qa-mcp', version: '1.0.0' }
              }
            }, 200, corsHeaders);
          }

          if (method === 'notifications/initialized' || method === 'initialized') {
            return new Response(null, { status: 204, headers: corsHeaders });
          }

          if (method === 'ping') {
            return jsonResponse({ jsonrpc: '2.0', id: rid, result: {} }, 200, corsHeaders);
          }

          if (method === 'tools/list') {
            return jsonResponse({
              jsonrpc: '2.0',
              id: rid,
              result: {
                tools: [
                  {
                    name: 'ask_tax_ai',
                    description: 'Tư vấn và hỏi đáp luật thuế Hộ kinh doanh & TMĐT (TikTok Shop, Shopee...) tại Việt Nam theo quy định năm 2026. Trả về phân tích chi tiết, số thuế phải nộp, thuế suất và căn cứ pháp lý đối soát.',
                    inputSchema: {
                      type: 'object',
                      properties: {
                        question: {
                          type: 'string',
                          description: 'Nội dung câu hỏi về thuế (ví dụ: Bán hàng trên TikTok Shop doanh thu 600 triệu/năm nộp những thuế gì và bao nhiêu %?)'
                        },
                        history: {
                          type: 'array',
                          description: 'Lịch sử hội thoại nếu muốn câu trả lời theo ngữ cảnh giống web; bỏ trống để hỏi độc lập.',
                          items: {
                            type: 'object',
                            properties: { role: { type: 'string', enum: ['user', 'assistant'] }, content: { type: 'string' } },
                            required: ['role', 'content']
                          }
                        }
                      },
                      required: ['question']
                    }
                  }
                ]
              }
            }, 200, corsHeaders);
          }

          if (method === 'tools/call') {
            const toolName = params?.name;
            const toolArgs = params?.arguments || {};
            const question = (toolArgs.question || toolArgs.message || '').trim();

            if (!question) {
              return jsonResponse({
                jsonrpc: '2.0',
                id: rid,
                result: {
                  content: [{ type: 'text', text: 'Vui lòng cung cấp nội dung câu hỏi về thuế.' }],
                  isError: true
                }
              }, 200, corsHeaders);
            }

            if (question.length > 4000) {
              return jsonResponse({
                jsonrpc: '2.0',
                id: rid,
                result: {
                  content: [{ type: 'text', text: 'Nội dung câu hỏi quá dài (tối đa 4.000 ký tự).' }],
                  isError: true
                }
              }, 200, corsHeaders);
            }

            try {
              const chatRes = await this.fetch(
                new Request('https://internal/api/chat', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Caller': 'mcp'
                  },
                  body: JSON.stringify({ message: question, history: toolArgs.history || [] })
                }),
                env,
                ctx
              );

              const chatData: any = await chatRes.json();
              if (!chatRes.ok || !chatData.success) {
                return jsonResponse({
                  jsonrpc: '2.0',
                  id: rid,
                  result: {
                    content: [{ type: 'text', text: chatData.error || 'Lỗi khi xử lý câu hỏi tư vấn thuế.' }],
                    isError: true
                  }
                }, 200, corsHeaders);
              }

              return jsonResponse({
                jsonrpc: '2.0',
                id: rid,
                result: {
                  content: [{ type: 'text', text: chatData.response || 'Không tìm thấy câu trả lời phù hợp.' }],
                  structuredContent: {
                    answer: chatData.response,
                    citations: chatData.citations || [],
                    source: chatData.source,
                    retrieval: chatData.retrieval || null,
                  },
                  isError: false
                }
              }, 200, corsHeaders);
            } catch (callErr: any) {
              return jsonResponse({
                jsonrpc: '2.0',
                id: rid,
                result: {
                  content: [{ type: 'text', text: `Lỗi xử lý câu hỏi: ${callErr.message}` }],
                  isError: true
                }
              }, 200, corsHeaders);
            }
          }

          return jsonResponse({
            jsonrpc: '2.0',
            id: rid,
            error: { code: -32601, message: `Method '${method}' not found` }
          }, 200, corsHeaders);
        }
      }

      // Only a signed Firebase Phone Auth ID token may create a session.
      if (path === '/api/auth/session' && request.method === 'POST') {
        const phone = await verifiedFirebasePhone(request);
        if (!phone) {
          return jsonResponse({ success: false, error: 'Invalid Firebase session.' }, 401, corsHeaders);
        }

        const vipPhone = env.VIP_PHONE || '0943219594';
        const isVip = phone === vipPhone;
        const vipCredits = parseInt(env.VIP_CREDITS || '1000', 10);

        let userRecord: any = null;

        if (env.DB) {
          userRecord = await env.DB.prepare(`SELECT * FROM users WHERE phone = ?`).bind(phone).first();

          if (!userRecord) {
            // Tạo tài khoản mới
            const initialCredits = isVip ? vipCredits : 3;
            const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const role = isVip ? 'vip' : 'user';
            const name = isVip ? 'Tài khoản VIP Quản trị' : `Khách hàng ${phone.slice(-4)}`;

            await env.DB.prepare(
              `INSERT INTO users (id, phone, name, credits, role, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
            )
              .bind(newId, phone, name, initialCredits, role)
              .run();

            // Ghi nhận transaction khởi tạo
            await env.DB.prepare(
              `INSERT INTO transactions (id, user_phone, amount, credits, payment_method, status, notes)
               VALUES (?, ?, 0, ?, 'system_welcome', 'completed', ?)`
            )
              .bind(
                `tx_${Date.now()}`,
                phone,
                initialCredits,
                isVip ? 'Cấp 1.000 lượt hỏi VIP' : 'Tặng 3 lượt hỏi miễn phí khi đăng ký'
              )
              .run();

            userRecord = { id: newId, phone, name, credits: initialCredits, role };
          } else if (isVip && userRecord.credits < vipCredits) {
            // Nâng lượt hỏi cho VIP nếu đang thấp hơn
            await env.DB.prepare(`UPDATE users SET credits = ? WHERE phone = ?`).bind(vipCredits, phone).run();
            userRecord.credits = vipCredits;
          }
        } else {
          // Fallback nếu chưa kết nối D1
          userRecord = {
            phone,
            name: isVip ? 'Tài khoản VIP Quản trị' : `Khách hàng ${phone.slice(-4)}`,
            credits: isVip ? vipCredits : 3,
            role: isVip ? 'vip' : 'user',
          };
        }

        return jsonResponse(
          {
            success: true,
            user: userRecord,
          },
          200,
          corsHeaders
        );
      }

      // 4. USER PROFILE (GET /api/user/profile?phone=xxx)
      if (path === '/api/user/profile' && request.method === 'GET') {
        const phone = url.searchParams.get('phone');
        if (!phone) {
          return jsonResponse({ success: false, error: 'Thiếu tham số phone.' }, 400, corsHeaders);
        }

        let userRecord: any = null;
        let txList: any[] = [];
        let chatList: any[] = [];

        if (env.DB) {
          userRecord = await env.DB.prepare(`SELECT * FROM users WHERE phone = ?`).bind(phone).first();
          const txRes = await env.DB.prepare(
            `SELECT * FROM transactions WHERE user_phone = ? ORDER BY created_at DESC LIMIT 20`
          )
            .bind(phone)
            .all();
          txList = txRes.results || [];

          const chatRes = await env.DB.prepare(
            `SELECT id, message, response, source, created_at FROM chat_logs WHERE user_phone = ? ORDER BY created_at DESC LIMIT 30`
          )
            .bind(phone)
            .all();
          chatList = chatRes.results || [];
        }

        if (!userRecord) {
          return jsonResponse({ success: false, error: 'Không tìm thấy tài khoản.' }, 404, corsHeaders);
        }

        return jsonResponse(
          {
            success: true,
            user: { ...userRecord, transactions: txList, chatLogs: chatList },
          },
          200,
          corsHeaders
        );
      }

      // 4b. LỊCH SỬ CÂU HỎI & TRẢ LỜI CỦA KHÁCH HÀNG (GET / DELETE /api/user/chat-history)
      if (path === '/api/user/chat-history') {
        if (request.method === 'GET') {
          const phone = url.searchParams.get('phone');
          if (!phone) {
            return jsonResponse({ success: false, error: 'Thiếu tham số phone.' }, 400, corsHeaders);
          }
          let historyList: any[] = [];
          if (env.DB) {
            const chatRes = await env.DB.prepare(
              `SELECT id, message, response, source, created_at FROM chat_logs WHERE user_phone = ? ORDER BY created_at DESC LIMIT 50`
            )
              .bind(phone)
              .all();
            historyList = chatRes.results || [];
          }
          return jsonResponse({ success: true, history: historyList }, 200, corsHeaders);
        }

        if (request.method === 'DELETE') {
          const body: any = await request.json().catch(() => ({}));
          const phone = (body.phone || url.searchParams.get('phone') || '').trim();
          const id = body.id || url.searchParams.get('id');
          if (!phone) {
            return jsonResponse({ success: false, error: 'Thiếu tham số phone.' }, 400, corsHeaders);
          }
          if (env.DB) {
            if (id) {
              await env.DB.prepare(`DELETE FROM chat_logs WHERE id = ? AND user_phone = ?`).bind(id, phone).run();
            } else {
              await env.DB.prepare(`DELETE FROM chat_logs WHERE user_phone = ?`).bind(phone).run();
            }
          }
          return jsonResponse({ success: true, message: 'Đã xóa lịch sử câu hỏi.' }, 200, corsHeaders);
        }
      }

      // 5. TRỪ CREDIT KHI HỎI (POST /api/user/credits/consume)
      if (path === '/api/user/credits/consume' && request.method === 'POST') {
        const body: any = await request.json();
        const phone = (body.phone || '').trim();

        if (!phone) {
          return jsonResponse({ success: false, error: 'Vui lòng đăng nhập trước khi hỏi.' }, 401, corsHeaders);
        }

        if (env.DB) {
          const user: any = await env.DB.prepare(`SELECT credits FROM users WHERE phone = ?`).bind(phone).first();
          if (!user) {
            return jsonResponse({ success: false, error: 'Tài khoản không tồn tại.' }, 404, corsHeaders);
          }
          if (user.credits <= 0) {
            return jsonResponse({ success: false, error: 'Bạn đã hết lượt hỏi. Vui lòng nạp thêm.' }, 403, corsHeaders);
          }

          await env.DB.prepare(
            `UPDATE users SET credits = credits - 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`
          )
            .bind(phone)
            .run();

          return jsonResponse({ success: true, remainingCredits: user.credits - 1 }, 200, corsHeaders);
        }

        return jsonResponse({ success: true, remainingCredits: 99 }, 200, corsHeaders);
      }

      // 6. NẠP CREDIT (POST /api/user/credits/deposit)
      if (path === '/api/user/credits/deposit' && request.method === 'POST') {
        return jsonResponse({ success: false, error: 'Lượt hỏi chỉ được cộng sau khi xác nhận giao dịch ngân hàng.' }, 403, corsHeaders);
      }

      // 6b. SEPAY WEBHOOK TỰ ĐỘNG CỘNG LƯỢT (POST /api/payment/webhook)
      if (path === '/api/payment/webhook' && request.method === 'POST') {
        const webhookKey = env.SEPAY_API_KEY;
        if (!webhookKey || request.headers.get('Authorization') !== `Apikey ${webhookKey}`) {
          return jsonResponse({ success: false, error: 'Invalid payment webhook credentials.' }, 401, corsHeaders);
        }
        let body: any = null;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ success: false, error: 'Dữ liệu JSON không hợp lệ' }, 400, corsHeaders);
        }

        const transferType = String(body.transferType || body.type || 'in').toLowerCase();
        const transferAmount = Number(body.transferAmount || body.amount || 0);
        const content = String(body.content || body.description || '');
        const sepayId = String(body.id || body.referenceCode || Date.now());
        const accountNumber = String(body.accountNumber || '').replace(/\D/g, '');

        if (!/^\d+$/.test(sepayId) || accountNumber !== '9594180624') {
          return jsonResponse({ success: false, error: 'Payment account or transaction ID does not match.' }, 400, corsHeaders);
        }

        // Bỏ qua nếu không phải tiền vào tài khoản
        if (transferType !== 'in' || transferAmount <= 0) {
          return jsonResponse({ success: true, message: 'Bỏ qua giao dịch không phải tiền vào' }, 200, corsHeaders);
        }

        // Trích xuất số điện thoại khách hàng từ nội dung chuyển khoản:
        // Cú pháp chuẩn: TAX 0943219594 hoặc TAX0943219594 hoặc chứa số điện thoại VN 10 số
        const fullText = `${content} ${body.code || ''}`;
        const phoneMatch = fullText.match(/TAX\s*([0-9]{10})/i) ||
                           fullText.match(/(0[35789][0-9]{8})/);

        const targetPhone = phoneMatch ? phoneMatch[1] : null;

        if (!targetPhone) {
          console.warn('SePay webhook: Không tìm thấy số điện thoại hợp lệ trong nội dung:', content);
          return jsonResponse({
            success: false,
            error: 'Không trích xuất được số điện thoại khách hàng',
            content
          }, 200, corsHeaders);
        }

        // Tính số lượt hỏi tương ứng với số tiền nạp
        let creditsToAdd = 0;
        let packageName = 'Gói Tuỳ Chỉnh';

        if (transferAmount >= 249000) {
          creditsToAdd = 100;
          packageName = 'Gói Doanh Nhân (+100 lượt)';
        } else if (transferAmount >= 99000) {
          creditsToAdd = 30;
          packageName = 'Gói Chuyên Nghiệp (+30 lượt)';
        } else if (transferAmount >= 49000) {
          creditsToAdd = 10;
          packageName = 'Gói Cơ Bản (+10 lượt)';
        } else {
          creditsToAdd = Math.max(1, Math.floor(transferAmount / 5000));
          packageName = `Gói linh hoạt (+${creditsToAdd} lượt)`;
        }

        if (env.DB) {
          const txId = `sepay_${sepayId}`;

          // Kiểm tra Idempotency - không cộng trùng lặp nếu SePay gửi lại
          const existingTx = await env.DB.prepare(`SELECT id FROM transactions WHERE id = ?`).bind(txId).first();
          if (existingTx) {
            return jsonResponse({
              success: true,
              message: 'Giao dịch đã được ghi nhận trước đó',
              transactionId: txId
            }, 200, corsHeaders);
          }

          // Kiểm tra user trong DB
          const existingUser: any = await env.DB.prepare(`SELECT * FROM users WHERE phone = ?`).bind(targetPhone).first();

          if (existingUser) {
            await env.DB.prepare(
              `UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`
            ).bind(creditsToAdd, targetPhone).run();
          } else {
            const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await env.DB.prepare(
              `INSERT INTO users (id, phone, name, credits, role, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
            ).bind(newId, targetPhone, `Khách hàng ${targetPhone.slice(-4)}`, creditsToAdd + 3).run();
          }

          // Ghi nhận lịch sử giao dịch vào bảng transactions
          await env.DB.prepare(
            `INSERT INTO transactions (id, user_phone, amount, credits, payment_method, status, notes)
             VALUES (?, ?, ?, ?, 'sepay_mbbank', 'completed', ?)`
          ).bind(
            txId,
            targetPhone,
            transferAmount,
            creditsToAdd,
            `SePay MBBank 9594180624: ${packageName} (Mã GD: ${body.referenceCode || sepayId})`
          ).run();

          return jsonResponse({
            success: true,
            message: `Tự động cộng thành công ${creditsToAdd} lượt cho SĐT ${targetPhone}`,
            phone: targetPhone,
            creditsAdded: creditsToAdd,
            amount: transferAmount,
            transactionId: txId
          }, 200, corsHeaders);
        }

        return jsonResponse({ success: true, message: 'D1 database not bound' }, 200, corsHeaders);
      }

      // 6c. KIỂM TRA TRẠNG THÁI GIAO DỊCH TỰ ĐỘNG (GET /api/payment/check?phone=xxx)
      if (path === '/api/payment/check' && request.method === 'GET') {
        const phone = url.searchParams.get('phone');
        if (!phone) {
          return jsonResponse({ success: false, error: 'Thiếu tham số phone' }, 400, corsHeaders);
        }
        if (await verifiedFirebasePhone(request) !== phone) {
          return jsonResponse({ success: false, error: 'Access denied.' }, 403, corsHeaders);
        }

        if (env.DB) {
          const user: any = await env.DB.prepare(`SELECT phone, credits FROM users WHERE phone = ?`).bind(phone).first();
          const lastTx: any = await env.DB.prepare(
            `SELECT id, amount, credits, payment_method, status, created_at
             FROM transactions
             WHERE user_phone = ?
             ORDER BY created_at DESC LIMIT 1`
          ).bind(phone).first();

          return jsonResponse({
            success: true,
            phone,
            credits: user?.credits ?? 0,
            lastTransaction: lastTx || null
          }, 200, corsHeaders);
        }

        return jsonResponse({ success: true, phone, credits: 0 }, 200, corsHeaders);
      }

      // 7. TƯ VẤN THUẾ AI VỚI RAG KNOWLEDGE BASE ENGINE (POST /api/chat & POST /api/chatgpt/tax-qa)
      if ((path === '/api/chat' || path === '/api/chatgpt/tax-qa') && request.method === 'POST') {
        const body: any = await request.json().catch(() => ({}));
        const message = (body.message || body.question || '').trim();
        const { phone, fileKey } = body;

        const isInternal = request.headers.get('X-Internal-Caller') === 'mcp' || path === '/api/chatgpt/tax-qa';
        let verifiedPhone: string | null = null;

        // Bỏ lượt hỏi cho khách vãng lai: Yêu cầu đăng nhập tài khoản bằng số điện thoại đối với web client
        if (!isInternal) {
          verifiedPhone = await verifiedFirebasePhone(request);
          if (!verifiedPhone) {
            return jsonResponse(
              {
                success: false,
                error: 'Vui lòng đăng nhập bằng số điện thoại để đặt câu hỏi tư vấn thuế.',
                requireLogin: true,
              },
              401,
              corsHeaders
            );
          }
          if (phone && phone !== verifiedPhone) {
            return jsonResponse(
              {
                success: false,
                error: 'Thông tin xác thực tài khoản không khớp.',
                requireLogin: true,
              },
              403,
              corsHeaders
            );
          }
        }
        const activePhone = verifiedPhone || phone || '';

        if (fileKey) {
          return jsonResponse({
            success: false,
            error: 'Hệ thống chưa hỗ trợ đọc nội dung tệp đính kèm để tư vấn. Vui lòng nhập câu hỏi bằng văn bản.',
          }, 422, corsHeaders);
        }

        if (!message) {
          return jsonResponse({ success: false, error: 'Nội dung câu hỏi không được để trống.' }, 400, corsHeaders);
        }

        if (message.length > 4000) {
          return jsonResponse({ success: false, error: 'Nội dung câu hỏi quá dài (tối đa 4.000 ký tự).' }, 400, corsHeaders);
        }

        const history = normalizeConversationHistory(body.history);

        // Both transports return the same finalized answer; SSE only changes delivery.
        const respondWithAnswer = (payload: any, remainingCredits: number, cached = false): Response => {
          const answerPayload = {
            ...payload,
            remainingCredits,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            ...(cached ? { cached: true } : {}),
          };
          if (path === '/api/chatgpt/tax-qa') {
            return jsonResponse({
              success: true,
              answer: payload.response,
              legal_citations: payload.citations || [],
              evidence: (payload.retrieval?.evidence || []).map((e: any) => e.title),
              decision: payload.retrieval?.decision,
              source: payload.source,
            }, 200, corsHeaders);
          }
          if (!body.stream) return jsonResponse(answerPayload, 200, corsHeaders);
          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();
          const encoder = new TextEncoder();
          ctx.waitUntil((async () => {
            try {
              await writer.write(encoder.encode(`data: ${JSON.stringify({
                type: 'meta', source: payload.source, citations: payload.citations || [],
                retrieval: payload.retrieval, remainingCredits,
              })}\n\n`));
              const answer = payload.response || '';
              for (let i = 0; i < answer.length; i += 120) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'delta', delta: answer.slice(i, i + 120) })}\n\n`));
              }
              await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done', fullText: answer, remainingCredits })}\n\n`));
              await writer.write(encoder.encode('data: [DONE]\n\n'));
            } finally {
              await writer.close();
            }
          })());
          const headers = new Headers(corsHeaders);
          headers.set('Content-Type', 'text/event-stream; charset=utf-8');
          headers.set('Cache-Control', 'no-cache, no-transform');
          return new Response(readable, { status: 200, headers });
        };

        // --- BƯỚC 0: KIỂM TRA PHẠM VI HỎI ĐÁP (MỤC 1) ---
        const taxRelevance = await resolveTaxRelevance(message, history, env.FPT_AI_KEY);
        if (taxRelevance !== 'IN_SCOPE') {
          const outOfScopeResponse = {
            success: true,
            response: taxRelevance === 'OUT_OF_SCOPE' ? OUT_OF_SCOPE_RESPONSE
              : taxRelevance === 'UNCERTAIN'
                ? 'Bạn muốn hỏi vấn đề thuế nào trong tình huống này? Vui lòng nêu rõ để hệ thống tư vấn đúng trọng tâm.'
                : 'Hệ thống tạm thời chưa kiểm tra được phạm vi câu hỏi. Vui lòng thử lại sau ít phút.',
            source: taxRelevance === 'OUT_OF_SCOPE' ? 'out_of_scope'
              : taxRelevance === 'UNCERTAIN' ? 'scope_clarification' : 'scope_unavailable',
            citations: [],
            legal_citations: [],
          };
          return respondWithAnswer(outOfScopeResponse, 99);
        }

        // --- KIỂM TRA LƯỢT HỎI TRONG CLOUDFLARE D1 (TẦNG WORKER) ---
        let userRecord: { id: string; phone: string; credits: number; role?: string } | null = null;
        if (!isInternal && env.DB && activePhone) {
          userRecord = await env.DB.prepare(
            `SELECT id, phone, credits, role FROM users WHERE phone = ?`
          ).bind(activePhone).first();

          if (!userRecord) {
            return jsonResponse(
              {
                success: false,
                error: 'Tài khoản chưa được khởi tạo. Vui lòng đăng nhập lại.',
                requireLogin: true,
              },
              404,
              corsHeaders
            );
          }

          if (userRecord.credits <= 0) {
            return jsonResponse(
              {
                success: false,
                error: 'Bạn đã dùng hết lượt hỏi tư vấn. Vui lòng nạp thêm lượt để tiếp tục tra cứu.',
                requireDeposit: true,
                remainingCredits: 0,
              },
              403,
              corsHeaders
            );
          }
        }

        // Helper trừ 1 lượt nguyên tử khi trả lời thành công
        let deducted = false;
        let finalRemainingCredits = userRecord?.credits ?? 99;

        const deductCreditOnce = async (): Promise<number> => {
          if (deducted || isInternal || !env.DB || !activePhone || !userRecord) {
            return finalRemainingCredits;
          }
          deducted = true;
          try {
            await env.DB.prepare(
              `UPDATE users SET credits = credits - 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ? AND credits > 0`
            ).bind(activePhone).run();
            const fresh = await env.DB.prepare(`SELECT credits FROM users WHERE phone = ?`).bind(activePhone).first<{ credits: number }>();
            finalRemainingCredits = fresh ? fresh.credits : Math.max(0, userRecord.credits - 1);
          } catch (e: any) {
            console.error('[CREDIT_DEDUCT_ERR]', e?.message);
            finalRemainingCredits = Math.max(0, userRecord.credits - 1);
          }
          return finalRemainingCredits;
        };

        // --- GIỚI HẠN TỐC ĐỘ (best-effort theo IP, chống spam) ---
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (!isInternal) {
          const rlKey = new Request(`https://rl.internal/chat/${ip}/${Math.floor(Date.now() / 3600000)}`);
          const rlHit = await caches.default.match(rlKey);
          const count = rlHit ? parseInt((await rlHit.text()) || '0', 10) : 0;
          if (count >= 100) {
            return jsonResponse({ success: false, error: 'Bạn gửi câu hỏi quá nhanh, vui lòng thử lại sau ít phút.' }, 429, corsHeaders);
          }
          ctx.waitUntil(
            caches.default.put(rlKey, new Response(String(count + 1), { headers: { 'Cache-Control': 'max-age=3600' } }))
          );
        }

        // Định kỳ dọn dẹp log chat cũ hơn 90 ngày (opportunistic cleanup)
        if (env.DB && Math.random() < 0.05) {
          ctx.waitUntil(
            env.DB.prepare(`DELETE FROM chat_logs WHERE created_at < datetime('now', '-90 days')`)
              .run()
              .catch((e: any) => console.error('[CLEANUP_90D_ERR]', e?.message))
          );
          ctx.waitUntil(
            env.DB.prepare(`DELETE FROM answer_cache WHERE created_at < datetime('now', '-7 days')`)
              .run()
              .catch((e: any) => console.error('[ANSWER_CACHE_CLEANUP_ERR]', e?.message))
          );
          ctx.waitUntil(
            env.DB.prepare(`DELETE FROM decision_traces WHERE created_at < datetime('now', '-90 days')`)
              .run()
              .catch((e: any) => console.error('[DECISION_TRACE_CLEANUP_ERR]', e?.message))
          );
        }

        // Cache by the complete conversation context so both transports converge.
        const answerScope = resolveAnswerScope(history, message);
        const cacheable = !fileKey;
        const normMsg = message.trim().normalize('NFC').replace(/\s+/g, ' ');
        // Invalidate old answers when ruleset updates or relative periods expire
        const digest = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(`${CURRENT_RULESET_VERSION}|frame:1.7-semantic-scope|${await knowledgeVersion()}|${env.DECISION_MODE || 'shadow'}|${answerScope.today}|${normMsg}|${JSON.stringify(history)}`)
        );
        const hash = Array.from(new Uint8Array(digest)).slice(0, 12).map((x) => x.toString(16).padStart(2, '0')).join('');
        const cacheKey = new Request(`https://cache.internal/chat/${hash}`);
        if (cacheable) {
          let cached: any = null;
          if (env.DB) {
            const row = await env.DB.prepare('SELECT payload FROM answer_cache WHERE cache_key = ?')
              .bind(hash).first() as { payload: string } | null;
            if (row?.payload) cached = JSON.parse(row.payload);
          } else {
            const hit = await caches.default.match(cacheKey);
            if (hit) cached = await hit.json();
          }
          if (cached) {
            const remainingCredits = await deductCreditOnce();
            if (env.DB && activePhone) {
              ctx.waitUntil(
                env.DB.prepare(
                  `INSERT INTO chat_logs (id, user_phone, message, response, credits_used, source) VALUES (?, ?, ?, ?, 1, ?)`
                )
                  .bind(`chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, activePhone, message, cached.response, 'cache')
                  .run()
                  .catch(() => {})
              );
            }
            return respondWithAnswer(cached, remainingCredits, true);
          }
        }

        // Classify before retrieval so the frame controls the evidence path.
        const decisionMode = env.DECISION_MODE || 'shadow';
        const applyDecision = decisionMode === 'enforce';
        let decisionFrame = decisionMode !== 'off' ? understandQuery(message, answerScope, history) : null;
        if (decisionFrame && env.FPT_AI_KEY && env.DECISION_L2 !== 'off') {
          try {
            decisionFrame = await refineQueryWithL2(decisionFrame, message, new QuyetDecisionProvider(env.FPT_AI_KEY));
          } catch (e) {
            console.error('[L2_REFINEMENT_ERR]', e);
          }
        }
        const decisionPlan = decisionFrame ? buildRetrievalPlan(decisionFrame) : undefined;
        const retrievalPlan = applyDecision ? decisionPlan : undefined;
        const decisionEvaluation = decisionFrame?.facts.revenue_vnd && decisionFrame.tax_period.years.length === 1
          ? evaluateDecisionFrame(decisionFrame) : null;

        // --- BƯỚC 1: HYBRID RETRIEVAL (BM25 + decision plan + evidence gate) ---
        const retrievalQuery = buildConversationRetrievalQuery(history, message, answerScope.years);
        const retrieved = retrieve(retrievalQuery, 4, answerScope, retrievalPlan);
        const { routeId, usedFallback } = retrieved;
        const gated = decisionFrame ? filterAndGateEvidence(retrieved.results.map(r => r.chunk), decisionFrame) : null;
        const results = applyDecision && gated
          ? retrieved.results.filter(r => gated.passedChunks.includes(r.chunk))
          : retrieved.results;
        const relevantChunks: RagChunk[] = results.map((r) => r.chunk);
        const structuredDecision = decisionFrame && decisionPlan && gated
          ? decide(decisionFrame, decisionEvaluation, gated.evidenceItems, decisionPlan) : null;
        const matchedRoute = routeId ? { refs: relevantChunks.map((c) => c.ref_id).filter(Boolean) } : null;
        const { text: ragContextText, citations: retrievedCitations } = buildContext(results, retrievalQuery, 6500, answerScope);
        const canUseDecisionCalculation = applyDecision && decisionFrame && decisionEvaluation?.status === 'ANSWERED' &&
          decisionFrame.tax_period.years.length === 1 &&
          decisionFrame.facts.revenue_basis === 'ANNUAL' &&
          decisionFrame.residency.value === 'RESIDENT' &&
          ['HOUSEHOLD_BUSINESS', 'INDIVIDUAL_BUSINESS'].includes(decisionFrame.taxpayer_type.value) &&
          ['GOODS_SALES', 'SERVICE', 'FREELANCE_SERVICE', 'FOOD_SERVICE'].includes(decisionFrame.income_type[0]?.value || '') &&
          ['TAX_CALCULATION', 'RELIEF_REDUCTION', 'EXEMPTION_ELIGIBILITY'].includes(decisionFrame.tax_intent.primary.value) &&
          decisionFrame.tax_intent.secondary.every(intent => intent === 'RELIEF_REDUCTION') &&
          !decisionFrame.facts.multi_activities && !decisionFrame.facts.platform_fee_vnd &&
          !decisionFrame.facts.shipping_cod_vnd && !decisionFrame.missing_facts.some(fact => fact.blocking) &&
          !/(một cá nhân khác|người thứ hai|trường hợp thứ hai|so sánh|so với)/i.test(message) &&
          !(decisionFrame.facts.vat_relief_assumed && decisionFrame.tax_period.years[0] !== 2026) &&
          !(decisionFrame.tax_intent.primary.value === 'RELIEF_REDUCTION' &&
            /gtgt|204\/2025/i.test(message) && !decisionFrame.facts.vat_relief_assumed) &&
          /\b(?:năm|nam)\b/i.test(message);
        const renderedDecision = canUseDecisionCalculation
          ? renderDeterministicAnswer(decisionEvaluation!, decisionFrame!) : null;
        const verifiedTaxAnswer: { response: string; citations: string[]; ruleIds: string[] } | null = [
          renderedDecision ? { ...renderedDecision, ruleIds: decisionEvaluation!.rule_outcomes.map(outcome => outcome.rule_id) } : null,
          answerPriorityTax(message, answerScope),
          answerVerifiedReliefEligibility(message, answerScope),
          answerVerifiedBusinessTax(message, answerScope),
        ].find(answer => answer && canUseVerifiedAnswer(message, answer.response)) || null;
        let legalCitations = verifiedTaxAnswer?.citations || retrievedCitations;
        const decisionStatus = verifiedTaxAnswer && structuredDecision?.decision_status !== 'NEEDS_LEGAL_REVIEW'
          ? 'ANSWERABLE_VERIFIED' : structuredDecision?.decision_status || 'NO_BASIS';
        // Guard chủ đề PENDING: chèn disclaimer vào prompt, không để model chốt cứng
        const pendingTopics = matchPendingTopics(message);
        const pendingNotice = pendingTopics.length
          ? `CHỦ ĐỀ CHƯA XÁC MINH: ${pendingTopics.map((t) => t.disclaimer).join(' ')} Chỉ trình bày các cách hiểu có thể dựa trên trích lục, nêu rõ điểm chưa chắc chắn, KHÔNG chốt cứng một đáp án duy nhất.\n`
          : '';
        const retrievalTrace = {
          method: routeId ? 'BM25 và định tuyến câu hỏi' : 'BM25',
          period: { years: answerScope.years, source: answerScope.periodSource },
          pendingTopics: pendingTopics.map((t) => t.id),
          decision: decisionFrame ? {
            layer: decisionFrame.meta.layer,
            model: decisionFrame.meta.l2_used ? 'Quyet-1.0-Large (FPT Cloud AI)' : 'L1 Deterministic Rules',
            taxpayer: decisionFrame.taxpayer_type.value,
            intent: decisionFrame.tax_intent.primary.value,
            income: decisionFrame.income_type[0]?.value,
            revenueVnd: decisionFrame.facts.revenue_vnd,
            confidence: Math.round(decisionFrame.meta.confidence * 100) / 100,
            status: decisionStatus,
            risk: structuredDecision?.risk_level,
          } : undefined,
          evidence: relevantChunks.map((chunk) => ({
            title: (chunk.text.match(/^##\s*(?:16\.\d+\.\s*)?(.+)$/m)?.[1] || chunk.section)
              .replace(/[*`]/g, '').slice(0, 150),
            conditional: chunk.tier === 'VERIFIED_CONDITIONAL',
          })),
          excludedEvidence: gated?.evidenceItems.filter(item => item.evidence_relation === 'NOT_RELEVANT').map(item => item.ref_id) || [],
          ruleIds: decisionEvaluation?.rule_outcomes.map(outcome => outcome.rule_id) || verifiedTaxAnswer?.ruleIds || [],
        };

        const decisionPrefix = applyDecision && decisionFrame?.meta?.l2_used ? 'Quyet-1.0-Large + ' : '';
        let aiText = verifiedTaxAnswer?.response || '';
        let source = renderedDecision ? 'Decision Rules Engine (verified rules)' : verifiedTaxAnswer ? `${decisionPrefix}Tax Engine (verified rules)`
          : relevantChunks.length === 0
          ? 'Chưa tìm thấy căn cứ'
          : routeId ? `${decisionPrefix}RAG Hybrid (${routeId})` : `${decisionPrefix}RAG Hybrid (BM25)`;

        // --- BƯỚC 2: LLM GENERATION VỚI MUSE SPARK API (META AI) ---
        if (!aiText && ragContextText) {
          const systemPrompt = `Bạn là chuyên viên tư vấn thuế cho hộ kinh doanh & cá nhân kinh doanh tại Việt Nam.
${applyDecision && structuredDecision ? `QUYẾT ĐỊNH CÓ CẤU TRÚC: ${JSON.stringify({ status: structuredDecision.decision_status, risk: structuredDecision.risk_level, tax_period: decisionFrame!.tax_period.years, taxpayer: decisionFrame!.taxpayer_type.value, income_types: decisionFrame!.income_type.map(item => item.value), facts: decisionFrame!.facts, missing_facts: decisionFrame!.missing_facts, must_cover: structuredDecision.must_cover_intents, allowed_claims: structuredDecision.allowed_claims })}\n${canUseDecisionCalculation && decisionEvaluation ? `KẾT QUẢ RULES ENGINE (${decisionEvaluation.status}): ${decisionEvaluation.explanation}. Không tự thay phương pháp hoặc tỷ lệ tính thuế.` : ''}` : ''}
${scopeInstructions(answerScope)}
${intentInstructions(message)}
${usedFallback ? 'ĐỘ TIN CẬY TRÍCH LỤC THẤP: câu hỏi diễn đạt khác thường nên trích lục có thể chưa sát — chỉ kết luận khi có căn cứ rõ ràng trong trích lục, nếu không chắc hãy hỏi lại thay vì suy diễn.\n' : ''}\n${pendingNotice}
QUY TRÌNH SUY LUẬN (bắt buộc — thực hiện ngầm trước khi viết, không trình bày các bước này trong câu trả lời):
1. Xác định KỲ TÍNH THUẾ (năm nào) và LOẠI THU NHẬP từ câu hỏi và lịch sử hội thoại.
2. Từ mỗi đoạn trích lục, liệt kê ĐIỀU KIỆN ÁP DỤNG: đối tượng, ngưỡng doanh thu, thời gian hiệu lực.
3. Đối chiếu từng điều kiện với dữ kiện người dùng đã cung cấp.
4. Ưu tiên TRẢ LỜI CỤ THỂ thay vì hỏi lại: dùng dữ kiện đã có để đưa kết luận có điều kiện rõ ràng ("nếu... thì..."). Chỉ hỏi thêm khi thiếu dữ kiện mà không có nó thì không thể đưa ra hướng xử lý hữu ích nào. Không trả lời chung chung, vòng vo, né tránh kết luận. Tuyệt đối không đoán, không suy diễn thêm, không áp quy định năm này cho năm khác.
5. Chỉ khi đủ điều kiện mới kết luận. Trước khi chốt, TỰ KIỂM TRA: mọi con số, thuế suất, ngưỡng, thời hạn và tên văn bản trong câu trả lời đều phải xuất hiện trong phần trích lục — không bịa số, không bịa văn bản.

Dưới đây là thông tin quy định thuế trích lục:
--------------------------------------------------
${ragContextText}
--------------------------------------------------
${analyzeAmounts(message)}
QUY TẮC BẮT BUỘC (TUÂN THỦ TUYỆT ĐỐI):
1. TUYỆT ĐỐI KHÔNG đưa nội dung phân tích thô, mã mục hay tiêu đề chú thích của hệ thống RAG vào câu trả lời (không nhắc tới mã số ref_id như 16.xx, không sao chép nguyên văn cả đoạn văn dài của hệ thống).
2. Trả lời rõ ràng theo đúng dữ kiện người dùng cung cấp. Với câu hỏi nhiều ý, trả lời trực tiếp từng ý trước. Không tự mở rộng sang một vấn đề người dùng không hỏi nếu vấn đề đó không ảnh hưởng kết luận. Nếu thiếu một dữ kiện, nêu kết luận có điều kiện rõ ràng bằng chính dữ kiện đó; chỉ hỏi thêm khi không thể đưa ra hướng xử lý hữu ích.
3. Kết thúc câu trả lời bằng phần "Căn cứ pháp lý:" — mỗi dòng một văn bản theo dạng "Điều/Khoản, Tên văn bản số hiệu". Chỉ liệt kê văn bản có trong phần trích lục, không thêm văn bản ngoài.
4. Tuân thủ PHẠM VI CÂU TRẢ LỜI: câu hỏi không nêu năm được xét theo năm hiện tại. Không tự so sánh các năm hay hỏi lại năm đó. Không coi ngày ban hành công văn hướng dẫn là ngày một quy định mới bắt đầu áp dụng khi nguồn không nói vậy.
5. Trong câu trả lời, giải thích ngắn gọn vì sao kết luận áp dụng cho dữ kiện người dùng đưa ra; nêu điều kiện còn thiếu nếu có. Chỉ dựa trên ngữ cảnh đã truy xuất và không trình bày nội dung suy luận nội bộ. Khi người dùng hỏi "bao nhiêu %" / "bao nhiêu phần trăm", bắt buộc nêu con số % cụ thể từ trích lục và tính ra số tiền ví dụ — không được nói chung chung "theo tỷ lệ của ngành".
6. Viết như đang trò chuyện với một người kinh doanh: xưng "mình" và gọi người hỏi là "bạn". Mở đầu bằng câu trả lời trực tiếp, sau đó giải thích bằng từ ngữ đời thường, câu ngắn và ví dụ đơn giản nếu hữu ích. Tránh giọng công văn, lời mở đầu kiểu "Theo quy định của pháp luật hiện hành", tiêu đề học thuật và danh sách dài khi không cần thiết.
7. Nếu phải dùng thuật ngữ thuế, giải thích ngay bằng một câu dễ hiểu. Khi người dùng hỏi "chỉ cần khai cuối năm?", phân biệt thông báo doanh thu, tờ khai thuế định kỳ và quyết toán thuế; nêu mẫu và hạn nếu ngữ cảnh đã có. Nếu còn thiếu dữ kiện thật sự quan trọng, hỏi tối đa một câu ở cuối. Không vì muốn thân thiện mà làm nhẹ đi điều kiện áp dụng, con số hoặc mức độ chắc chắn của kết luận.
8. Đọc lịch sử hội thoại như một cuộc tư vấn liên tục. Câu hiện tại có thể chỉ là dữ kiện bạn vừa yêu cầu bổ sung (ví dụ "800 triệu/năm"). Khi đó, ghép dữ kiện mới với câu hỏi gốc và các câu trả lời trước để tư vấn tiếp, không coi nó là câu hỏi độc lập. Nếu thông tin mới sửa thông tin cũ, ưu tiên thông tin mới. Nếu người dùng chuyển sang chủ đề khác, trả lời theo chủ đề mới.
9. Trước khi viết câu trả lời, tự kiểm tra theo thứ tự: xác định kỳ áp dụng; phân loại từng khoản thu; liệt kê điều kiện, ngưỡng và ngoại lệ từ căn cứ đã truy xuất; đối chiếu từng điều kiện với dữ kiện người dùng; rồi mới kết luận và nêu bước cần làm. Nếu thiếu dữ kiện, trả lời phần có thể chốt bằng điều kiện rõ ràng. Chỉ xuất câu trả lời cuối cùng, không in quá trình kiểm tra nội bộ.
10. Nếu câu hỏi không liên quan đến thuế, hóa đơn, kê khai hay doanh thu của Hộ kinh doanh & cá nhân kinh doanh, CHỈ trả lời đúng nguyên văn: "Nội dung câu hỏi nằm ngoài phạm vi hỗ trợ tư vấn thuế của hệ thống. Vui lòng đặt câu hỏi liên quan đến chính sách thuế, mức thuế suất, hóa đơn điện tử hoặc kê khai thuế cho Hộ kinh doanh và Cá nhân kinh doanh." + xuống dòng "Căn cứ pháp lý:\nKhông áp dụng". Không sáng tạo thêm, không liệt kê văn bản.
11. Lệ phí môn bài: từ 01/01/2026 đã chấm dứt thu, nộp và không cần khai cho năm 2026 trở đi. Bảng mức của Nghị định 139/2016/NĐ-CP chỉ dùng để xét nghĩa vụ phát sinh từ năm 2025 trở về trước; tuyệt đối không áp cho năm hiện tại.
12. Nghị quyết 43/2026/QH16 (Giảm 30% thuế TNCN kỳ 2026–2027): Áp dụng giảm 30% số thuế TNCN phải nộp đối với thu nhập từ kinh doanh của cá nhân cư trú có doanh thu năm không quá 10 tỷ đồng. Khi tính số thuế năm 2026, phân biệt: (1) Thuế GTGT tính trên toàn bộ doanh thu, không trừ 1 tỷ và không giảm theo NQ43; nếu người dùng đã giả định hàng hóa đủ điều kiện giảm GTGT theo Nghị quyết 204/2025/QH15 và Nghị định 174/2025/NĐ-CP thì phải tính ngay mức tỷ lệ × 80%; (2) Doanh thu trên 1 tỷ đến đúng 3 tỷ có thể chọn phương pháp TNCN theo doanh thu hoặc thu nhập; doanh thu trên 3 tỷ đến 50 tỷ bắt buộc tính theo thu nhập tính thuế × 17%, tuyệt đối không dùng 0,5% trên doanh thu; (3) Sau đó mới xét giảm 30% TNCN theo NQ43. Không áp NQ43 cho GTGT, tiền lương, cá nhân không cư trú hoặc năm 2025. Giữ đúng ngành người dùng khẳng định; cụm "không bán lẻ" là phủ định, không phải dữ kiện ngành bán lẻ.
13. Mã số thuế 888 & Định danh CCCD: Khi trả lời về mã 888: LUÔN trích dẫn Công văn 311/TCT-DNNCN và Thông tư 86/2024/TT-BTC. Hậu tố 888 VẪN ĐƯỢC SỬ DỤNG trong năm 2026 để phân loại hoạt động TMĐT và kinh doanh trên nền tảng số (từ 01/07/2025, CCCD thay thế 10 số đầu làm định danh gốc, còn hậu tố 888 vẫn giữ để phân loại). Hộ/cá nhân kinh doanh trên sàn TMĐT (Shopee, TikTok Shop...), mạng xã hội BẮT BUỘC phải đăng ký trên Cổng TMĐT HKD (https://canhantmdt.gdt.gov.vn) để được cấp/gắn phân loại 888. TUYỆT ĐỐI KHÔNG trả lời "không bắt buộc đăng ký 888". Chỉ khi người dùng đã có mã 888 cũ thì mới không phải xin thêm mã 888 mới cho từng kênh bán lẻ. Nêu rõ 3 bước đăng ký theo CV 311: B1 truy cập canhantmdt.gdt.gov.vn, B2 đăng nhập VNeID mức 2, B3 hệ thống kiểm tra và hướng dẫn cấp/bổ sung 888. TUYỆT ĐỐI KHÔNG trích dẫn Luật Quản lý thuế 38/2019/QH14 (đã hết hiệu lực, thay bằng Luật 108/2025/QH15).
14. Tiếp thị liên kết (Affiliate): Không được mặc định ấn định thuế suất 5% TNCN cho mọi trường hợp. Phải phân biệt dịch vụ quảng cáo số (HKD), hoa hồng môi giới đại lý hay tiền lương tiền công khấu trừ 10%. Nếu chưa rõ thực tế, nêu điều kiện hoặc yêu cầu làm rõ, không chốt số thuế bừa bãi.
15. Đơn hoàn và chi phí sàn: Đơn hoàn hủy thực tế chỉ trừ khỏi doanh thu nếu chưa được trừ trong doanh thu gộp ban đầu (không trừ trùng). Phí sàn là chi phí kinh doanh, đối với phương pháp tính thuế theo tỷ lệ doanh thu thì không được trừ phí sàn khỏi doanh thu chịu thuế.`;

          // ƯU TIÊN 1: Gọi Muse Spark API (Meta AI) nếu có key
          const museKey = env.MUSE_API_KEY;
          if (museKey) {
            const modelRequest = buildMuseRequest(systemPrompt, history, message, false);
            for (let attempt = 1; attempt <= 2 && !aiText; attempt++) {
              try {
                const museRes = await fetch('https://api.meta.ai/v1/responses', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${museKey}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify(modelRequest),
                  signal: AbortSignal.timeout(45000),
                });
                if (museRes.ok) {
                  const museData: any = await museRes.json();
                  const msgOutput = (museData?.output || []).find((item: any) => item.type === 'message' && item.content);
                  const outText = msgOutput?.content?.[0]?.text?.trim();
                  if (outText && outText.length > 15) {
                    aiText = outText;
                    source = `Muse Spark 1.3 (Meta AI) + ${source}`;
                  } else {
                    console.warn('[MODEL_EMPTY]', JSON.stringify({ model: modelRequest.model, attempt, routeId, refs: relevantChunks.map(c => c.ref_id) }));
                  }
                  break;
                }
                const body = (await museRes.text()).slice(0, 300);
                console.warn('[MODEL_HTTP_ERROR]', JSON.stringify({ model: modelRequest.model, status: museRes.status, body, attempt, routeId, refs: relevantChunks.map(c => c.ref_id) }));
                // Transient errors (429 rate limit, 404 node-routing glitch, or 5xx server errors) will be retried on attempt 2
                if (museRes.status !== 429 && museRes.status !== 404 && museRes.status < 500) break;
              } catch (errMuse: any) {
                console.error('[MODEL_REQUEST_ERROR]', JSON.stringify({ model: modelRequest.model, error: errMuse?.name || 'Error', detail: errMuse?.message, attempt, routeId, refs: relevantChunks.map(c => c.ref_id) }));
              }
            }
          } else {
            console.warn('[MODEL_UNCONFIGURED]', JSON.stringify({ routeId, refs: relevantChunks.map(c => c.ref_id) }));
          }

          // ƯU TIÊN 2 (DỰ PHÒNG TỰ ĐỘNG): Fallback sang Cloudflare Workers AI khi Muse Spark lỗi hoặc không khả dụng
          if (!aiText && env.AI && ragContextText) {
            try {
              console.warn('[LLM_FALLBACK] Kích hoạt Cloudflare Workers AI làm dự phòng...');
              let fbRes: any = null;
              try {
                fbRes = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
                  messages: [
                    { role: 'system', content: systemPrompt },
                    ...history.map((h: any) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
                    { role: 'user', content: message },
                  ],
                  temperature: 0.1,
                  max_tokens: 1500,
                });
              } catch (err70b: any) {
                console.warn('[LLM_FALLBACK_70B_ERR] Thử Llama 3.1 8B:', err70b?.message);
                fbRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
                  messages: [
                    { role: 'system', content: systemPrompt },
                    ...history.map((h: any) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
                    { role: 'user', content: message },
                  ],
                  temperature: 0.1,
                  max_tokens: 1500,
                });
              }
              const fbText = fbRes?.response?.trim();
              if (fbText && fbText.length > 20) {
                aiText = fbText;
                source = `Workers AI Llama (Fallback) + ${source}`;
              }
            } catch (errAi: any) {
              console.error('[LLM_FALLBACK_ERR] Lỗi Workers AI fallback:', errAi?.message);
            }
          }
        }

        const proposedGuard = verifiedTaxAnswer
          ? { answer: aiText, reason: null }
          : guardTaxAnswer(message, answerScope, relevantChunks.map((chunk) => chunk.ref_id || ''), aiText || '');
        const guarded = proposedGuard.reason && !canUseVerifiedAnswer(message, proposedGuard.answer)
          ? { answer: aiText, reason: null } : proposedGuard;
        if (guarded.reason) {
          console.warn(`[ANSWER_GUARD] ${guarded.reason}: "${message}"`);
          aiText = guarded.answer;
          source = `verified-answer-guard (${guarded.reason}) + ${source}`;
        }

        // Nếu mô hình không khả dụng và không có answer guard, thử render từ Rules Engine
        let llmOk = !!aiText;
        if (!aiText) {
          if (decisionFrame && decisionFrame.facts.revenue_vnd) {
            if (decisionFrame.tax_period.years.length > 1) {
              const multiResults = evaluateMultiYear(decisionFrame);
              const rendered = renderMultiYearComparison(multiResults, decisionFrame);
              aiText = rendered.response;
              legalCitations = rendered.citations;
              source = 'Decision Rules Engine (Multi-Year Comparison)';
            } else {
              const evalResult = evaluateDecisionFrame(decisionFrame);
              if (evalResult.status === 'ANSWERED') {
                const rendered = renderDeterministicAnswer(evalResult, decisionFrame);
                aiText = rendered.response;
                legalCitations = rendered.citations;
                source = 'Decision Rules Engine (Deterministic Render)';
              }
            }
          }
          if (!aiText) {
            if (relevantChunks.length > 0) {
              aiText = 'Đã tìm thấy tài liệu liên quan, nhưng hệ thống Muse Spark AI hiện chưa thể tổng hợp câu trả lời lúc này. Vui lòng thử lại sau ít phút.';
            } else {
              aiText = `Mình chưa tìm thấy căn cứ đủ chắc cho câu hỏi này. Bạn cho mình biết thêm doanh thu năm, ngành nghề và bán trên kênh nào (sàn TMĐT, cửa hàng, dịch vụ) nhé. Nếu cần chắc chắn, bạn có thể đặt lịch tư vấn với chuyên viên.`;
            }
          }
        }

        const uncovered = missingAnswerIntents(message, aiText);
        if (uncovered.length) {
          console.warn('[INTENT_COVERAGE]', JSON.stringify({ missing: uncovered, routeId, refs: relevantChunks.map(c => c.ref_id) }));
          if (uncovered.includes('platform_withholding')) {
            aiText += '\n\nVề khoản nền tảng giữ lại: cần phân biệt phí dịch vụ với tiền thuế. Phí không tự giảm doanh thu gộp; chỉ xem xét là chi phí khi phương pháp tính theo thu nhập cho phép và có chứng từ hợp lệ. Khoản ghi “tax” chưa thể coi là TNCN đã nộp thay nếu chưa có chứng từ khấu trừ/nộp thuế và đối soát đúng loại thuế, kỳ và người nộp.';
          }
          if (uncovered.includes('vat_relief') && answerScope.years.every(y => y === 2026)) {
            aiText += '\n\nVề giảm GTGT: nếu hàng hóa/dịch vụ thực sự đủ điều kiện theo Nghị quyết 204/2025/QH15 và Nghị định 174/2025/NĐ-CP, mức tỷ lệ GTGT trên doanh thu được giảm 20% trong thời gian áp dụng; cần đối chiếu tỷ lệ gốc và doanh thu để ra số tiền.';
            legalCitations = [...legalCitations, 'Điều 1 Nghị quyết 204/2025/QH15', 'Điều 1 Nghị định 174/2025/NĐ-CP'];
          }
          if (uncovered.includes('pit')) {
            aiText += !/tính|tinh|bao nhiêu|bao nhieu|phương pháp|phuong phap|17\s*%|0[,.]5\s*%/i.test(message)
              ? '\n\nVề TNCN: cần đối chiếu đúng loại thu nhập, kỳ thuế và chứng từ đã nộp. Chỉ ghi nhận khoản TNCN đã nộp hợp lệ với nghĩa vụ TNCN tương ứng, không tự đối trừ sang GTGT hoặc nghĩa vụ khác.'
              : answerScope.years.every(y => y === 2026 || y === 2027)
              ? '\n\nVề TNCN: cần chọn phương pháp theo tổng doanh thu năm của cá nhân; trên 3 tỷ đến 50 tỷ đồng tính trên thu nhập tính thuế với thuế suất 17%. Nếu chưa có thu nhập tính thuế hợp lệ, chưa thể chốt số tiền TNCN.'
              : '\n\nVề TNCN: câu trả lời trên chưa xác định được phương pháp và số thuế cho kỳ bạn hỏi; cần đối chiếu doanh thu, loại thu nhập và chứng từ của đúng kỳ đó.';
            if (answerScope.years.every(y => y === 2026 || y === 2027)) legalCitations = [...legalCitations, 'Điều 7 Luật Thuế TNCN 109/2025/QH15'];
          }
          if (uncovered.includes('einvoice')) {
            aiText += '\n\nVề hóa đơn điện tử: cần xét doanh thu tính thuế GTGT lũy kế và tình trạng đăng ký hiện tại; chưa thể kết luận nghĩa vụ cụ thể chỉ từ phần trả lời trên.';
          }
        }

        // Dọn dẹp nếu model vẫn sinh ra thẻ suy luận sót lại
        aiText = aiText.replace(/(?:<thinking>|\[SUY_LUAN\])[\s\S]*?(?:<\/thinking>|\[\/SUY_LUAN\])/i, '').trim();
        // --- BƯỚC 3: ANSWER VALIDATOR (LEGAL COMPLIANCE GUARD) ---
        let validationPass = !applyDecision || !decisionFrame;
        let validationStatus = 'SKIPPED';
        if (decisionFrame) {
          const applicableEvaluation = canUseDecisionCalculation && decisionEvaluation?.status === 'ANSWERED'
            ? decisionEvaluation : undefined;
          const valReport = validateAnswer(aiText, decisionFrame, applicableEvaluation);
          validationStatus = valReport.status;
          if (valReport.repairedText) {
            aiText = valReport.repairedText;
          }
          if (applyDecision && valReport.status === 'DOWNGRADE') {
            if (canUseDecisionCalculation && decisionEvaluation) {
              const safeAnswer = renderDeterministicAnswer(decisionEvaluation, decisionFrame);
              aiText = safeAnswer.response;
              legalCitations = safeAnswer.citations;
              source = 'Decision Rules Engine (validator fallback)';
            } else {
              aiText = 'Mình chưa thể xác minh chắc chắn kết quả tính thuế từ tài liệu hiện có. Bạn vui lòng thử lại hoặc trao đổi với chuyên viên thuế.';
              legalCitations = [];
            }
          }
          if (applyDecision) validationPass = validateAnswer(aiText, decisionFrame,
            canUseDecisionCalculation && decisionEvaluation?.status === 'ANSWERED' ? decisionEvaluation : undefined).status === 'PASS';
          if (validationPass && validationStatus === 'REPAIR') validationStatus = 'PASS_AFTER_REPAIR';
        }
        const citationCheck = validateLegalCitations(message, aiText, legalCitations, answerScope);
        aiText = citationCheck.answer;
        legalCitations = citationCheck.citations;

        // Kiểm tra hậu kỳ đối với câu hỏi năm cũ (< 2026)
        let logD1Prefix = '';
        if (answerScope.years.some((y) => y < 2026)) {
          const normAi = aiText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
          const mentions1B = normAi.includes('1 ty') || aiText.includes('1 tỷ');
          const mentions100M = normAi.includes('100 trieu') || aiText.includes('100 triệu');
          if (mentions1B && !mentions100M) {
            console.warn(`[POST_CHECK_WARN] Năm < 2026 nhưng phản hồi nhắc 1 tỷ mà không nhắc 100 triệu: "${message}"`);
            logD1Prefix = '[WARN_THRESHOLD_MISMATCH] ';
          }
        }

        let canonicalPayload: any = {
          success: true,
          response: aiText,
          source,
          citations: legalCitations,
          retrieval: retrievalTrace,
          matchedRefs: matchedRoute?.refs || [],
        };
        if (cacheable && llmOk && validationPass && missingAnswerIntents(message, aiText).length === 0 &&
            !pendingTopics.length && (!applyDecision || ['ANSWERABLE_VERIFIED', 'ANSWERABLE_WITH_EVIDENCE', 'CONDITIONAL'].includes(decisionStatus))) {
          if (env.DB) {
            // The first completed answer wins even when web and MCP ask concurrently.
            await env.DB.prepare('INSERT OR IGNORE INTO answer_cache (cache_key, payload) VALUES (?, ?)')
              .bind(hash, JSON.stringify(canonicalPayload)).run();
            const row = await env.DB.prepare('SELECT payload FROM answer_cache WHERE cache_key = ?')
              .bind(hash).first() as { payload: string } | null;
            if (!row?.payload) throw new Error('Answer cache did not retain the canonical result');
            canonicalPayload = JSON.parse(row.payload);
          } else {
            await caches.default.put(cacheKey, new Response(JSON.stringify(canonicalPayload), {
              headers: { 'Cache-Control': 'max-age=86400', 'Content-Type': 'application/json' },
            }));
          }
        }
        aiText = canonicalPayload.response;
        source = canonicalPayload.source;

        if (env.DB && decisionFrame) {
          ctx.waitUntil(env.DB.prepare(
            `INSERT INTO decision_traces (id, mode, decision_status, layer, tax_years, rule_ids, evidence_refs, excluded_refs, validation_status, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            `dt_${crypto.randomUUID()}`, decisionMode, decisionStatus, decisionFrame.meta.layer,
            JSON.stringify(decisionFrame.tax_period.years), JSON.stringify(decisionEvaluation?.rule_outcomes.map(outcome => outcome.rule_id) || []),
            JSON.stringify(relevantChunks.map(chunk => chunk.ref_id).filter(Boolean)),
            JSON.stringify(gated?.evidenceItems.filter(item => item.evidence_relation === 'NOT_RELEVANT').map(item => item.ref_id) || []),
            validationStatus, source
          ).run().catch((error: any) => console.warn('[DECISION_TRACE_ERR]', error?.message)));
        }

        // --- BƯỚC 3: GHI LOG VÀO CLOUDFLARE D1 ---
        if (env.DB && activePhone) {
          ctx.waitUntil(
            env.DB.prepare(
              `INSERT INTO chat_logs (id, user_phone, message, response, credits_used, source)
               VALUES (?, ?, ?, ?, 1, ?)`
            )
              .bind(
                `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                activePhone,
                message,
                logD1Prefix ? `${logD1Prefix}${aiText}` : aiText,
                logD1Prefix ? `${logD1Prefix}${source}` : source
              )
              .run()
              .catch((e: any) => console.error('log error', e?.message))
          );
        }

        const remainingCredits = await deductCreditOnce();
        return respondWithAnswer(canonicalPayload, remainingCredits);
      }

      // 8. ĐẶT LỊCH TƯ VẤN (POST /api/consultations)
      if (path === '/api/consultations' && request.method === 'POST') {
        const body: any = await request.json();
        const { name, phone, email, platform, estimatedRevenue, notes } = body;

        if (!name || !phone) {
          return jsonResponse({ success: false, error: 'Vui lòng cung cấp họ tên và số điện thoại.' }, 400, corsHeaders);
        }

        if (env.DB) {
          const leadId = `lead_${Date.now()}`;
          await env.DB.prepare(
            `INSERT INTO consultation_leads (id, name, phone, email, platform, estimated_revenue, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(leadId, name, phone, email || '', platform || 'tiktok', estimatedRevenue || '1-3 tỷ', notes || '')
            .run();

          return jsonResponse(
            {
              success: true,
              message: 'Yêu cầu tư vấn đã được ghi nhận vào cơ sở dữ liệu Cloudflare D1.',
              leadId,
            },
            200,
            corsHeaders
          );
        }

        return jsonResponse({ success: true, message: 'Đã nhận thông tin tư vấn.' }, 200, corsHeaders);
      }

      // 9. CLOUDFLARE R2: UPLOAD FILE / ẢNH CHỨNG TỪ (POST /api/files/upload)
      if (path === '/api/files/upload' && request.method === 'POST') {
        if (!env.STORAGE_BUCKET) {
          return jsonResponse({ success: false, error: 'Cloudflare R2 Bucket chưa được cấu hình binding.' }, 500, corsHeaders);
        }

        const contentType = request.headers.get('Content-Type') || '';
        let fileBuffer: ArrayBuffer;
        let originalName = 'document.png';
        let mimeType = 'image/png';
        let userPhone = '';

        if (contentType.includes('multipart/form-data')) {
          const formData = await request.formData();
          const file = formData.get('file') as File;
          userPhone = (formData.get('phone') as string) || '';

          if (!file) {
            return jsonResponse({ success: false, error: 'Không tìm thấy file trong form data.' }, 400, corsHeaders);
          }

          fileBuffer = await file.arrayBuffer();
          originalName = file.name;
          mimeType = file.type || 'application/octet-stream';
        } else {
          // Upload binary stream trực tiếp
          fileBuffer = await request.arrayBuffer();
          originalName = request.headers.get('X-File-Name') || `upload_${Date.now()}.png`;
          mimeType = contentType || 'application/octet-stream';
          userPhone = request.headers.get('X-User-Phone') || '';
        }

        // Tạo key ngẫu nhiên an toàn trên R2
        const fileKey = `docs/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        // Lưu vào Cloudflare R2 Bucket
        await env.STORAGE_BUCKET.put(fileKey, fileBuffer, {
          httpMetadata: {
            contentType: mimeType,
          },
          customMetadata: {
            uploadedBy: userPhone,
            originalName: originalName,
          },
        });

        const publicUrl = `${url.origin}/api/files/${encodeURIComponent(fileKey)}`;

        // Lưu metadata vào Cloudflare D1
        if (env.DB) {
          const fileId = `file_${Date.now()}`;
          await env.DB.prepare(
            `INSERT INTO files (id, user_phone, file_key, original_name, mime_type, file_size, public_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(fileId, userPhone, fileKey, originalName, mimeType, fileBuffer.byteLength, publicUrl)
            .run();
        }

        return jsonResponse(
          {
            success: true,
            fileKey,
            originalName,
            fileSize: fileBuffer.byteLength,
            mimeType,
            publicUrl,
            message: 'Tải tài liệu lên Cloudflare R2 thành công.',
          },
          200,
          corsHeaders
        );
      }

      // 10. CLOUDFLARE R2: XEM / TẢI FILE (GET /api/files/:key)
      if (path.startsWith('/api/files/') && request.method === 'GET') {
        if (!env.STORAGE_BUCKET) {
          return jsonResponse({ success: false, error: 'Cloudflare R2 Bucket chưa kích hoạt.' }, 500, corsHeaders);
        }

        const key = decodeURIComponent(path.replace('/api/files/', ''));
        if (!key) {
          return jsonResponse({ success: false, error: 'Thiếu file key.' }, 400, corsHeaders);
        }

        const object = await env.STORAGE_BUCKET.get(key);
        if (!object) {
          return jsonResponse({ success: false, error: 'File không tồn tại trên Cloudflare R2.' }, 404, corsHeaders);
        }

        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache CDN Cloudflare 1 năm

        return new Response(object.body, { headers });
      }

      // 404 cho các route không tồn tại
      return jsonResponse({ success: false, error: `Không tìm thấy endpoint: ${path}` }, 404, corsHeaders);
    } catch (err: any) {
      return jsonResponse(
        {
          success: false,
          error: 'Lỗi máy chủ Cloudflare Workers',
          details: err.message,
        },
        500,
        corsHeaders
      );
    }
  },

  async scheduled(_controller: any, env: Env, _ctx: ExecutionContext): Promise<void> {
    if (env.DB) {
      try {
        const result = await env.DB.prepare(
          `DELETE FROM chat_logs WHERE created_at < datetime('now', '-90 days')`
        ).run();
        console.log(`[SCHEDULED_CLEANUP_90D] Cleaned old chat logs: ${result.meta?.changes ?? 0} rows deleted.`);
      } catch (err: any) {
        console.error('[SCHEDULED_CLEANUP_90D_ERR]', err?.message);
      }
    }
  },
};







