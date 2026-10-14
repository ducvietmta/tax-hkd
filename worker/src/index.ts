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
import { resolveAnswerScope, scopeInstructions, intentInstructions, isOutOfScope, OUT_OF_SCOPE_RESPONSE } from './answerScope';
import { matchPendingTopics } from './pendingTopics';
import { buildConversationRetrievalQuery, normalizeConversationHistory } from './conversation';
import { buildMuseRequest } from './museRequest';
import { guardTaxAnswer } from './taxAnswerGuard';
import { answerVerifiedBusinessTax } from './businessTaxAnswer';

export interface Env {
  DB: D1Database;
  STORAGE_BUCKET: R2Bucket;
  AI?: any;
  ENVIRONMENT?: string;
  CORS_ALLOW_ORIGIN?: string;
  MUSE_API_KEY?: string;
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
      // 1. HEALTH CHECK & TEST AI (MUSE SPARK API CHUYÊN BIỆT)
      if (path === '/api/test-ai') {
        try {
          const museKey = env.MUSE_API_KEY;
          if (!museKey) {
            return jsonResponse({ success: false, error: 'MUSE_API_KEY chưa được cấu hình.' }, 200, corsHeaders);
          }
          const testRes = await Promise.race([
            fetch('https://api.meta.ai/v1/responses', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${museKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(buildMuseRequest('Bạn là trợ lý AI.', [], 'Chào bạn, 1 + 1 bằng mấy?', false)),
            }),
            new Promise<Response>((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000)),
          ]);
          if (!testRes.ok) {
            return jsonResponse({ success: false, error: `Muse API HTTP error: ${testRes.status}` }, 200, corsHeaders);
          }
          const data = await testRes.json();
          return jsonResponse({ success: true, model: 'Muse Spark 1.3 (Meta AI)', res: data }, 200, corsHeaders);
        } catch (e: any) {
          return jsonResponse({ success: false, error: e.message }, 200, corsHeaders);
        }
      }

      if (path === '/' || path === '/api/health') {
        return jsonResponse(
          {
            status: 'ok',
            service: 'Cloudflare Workers API',
            platform: 'Cloudflare Edge (Pages + Workers + D1 + R2)',
            aiModel: 'Muse Spark 1.3 (Meta AI)',
            hasMuse: !!env.MUSE_API_KEY,
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

              const isOOS = chatData.source === 'out_of_scope';
              const hasCitations = Array.isArray(chatData.citations) && chatData.citations.length > 0;
              // Model đã tuyên bố không có căn cứ → không gắn footer dù retrieval có trả chunks
              const noLegalGround = /căn cứ pháp lý:\s*không áp dụng/i.test(chatData.response || '') ||
                /can cu phap ly:\s*khong ap dung/i.test(chatData.response || '');
              const parts = [chatData.response || 'Không tìm thấy câu trả lời phù hợp.'];
              // Chỉ gắn footer đối soát khi có citations thật — không bịa căn cứ cho câu ngoài phạm vi
              if (!isOOS && !noLegalGround && hasCitations) {
                parts.push(
                  '',
                  '----------------------------------------',
                  '📊 CĂN CỨ PHÁP LÝ & ĐỐI SOÁT LUẬT THUẾ 2026:',
                  `• Căn cứ trích dẫn: ${chatData.citations.join(', ')}`,
                  `• Nguồn: ${chatData.source || 'RAG Knowledge Engine'}`
                );
              }
              const text = parts.join('\n');

              return jsonResponse({
                jsonrpc: '2.0',
                id: rid,
                result: {
                  content: [{ type: 'text', text }],
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

        // --- BƯỚC 0: KIỂM TRA PHẠM VI HỎI ĐÁP (MỤC 1) ---
        if (isOutOfScope(message, history)) {
          const outOfScopeResponse = {
            success: true,
            response: 'Nội dung câu hỏi nằm ngoài phạm vi hỗ trợ tư vấn thuế của hệ thống. Vui lòng đặt câu hỏi liên quan đến chính sách thuế, mức thuế suất, hóa đơn điện tử hoặc kê khai thuế cho Hộ kinh doanh và Cá nhân kinh doanh.\n\nCăn cứ pháp lý:\nKhông áp dụng',
            source: 'out_of_scope',
            citations: [],
            legal_citations: [],
          };
          if (path === '/api/chatgpt/tax-qa') {
            return jsonResponse(
              {
                success: true,
                answer: outOfScopeResponse.response,
                legal_citations: [],
                evidence: [],
                source: 'out_of_scope',
              },
              200,
              corsHeaders
            );
          }
          return jsonResponse(outOfScopeResponse, 200, corsHeaders);
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
              `UPDATE users SET credits = credits - 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`
            ).bind(activePhone).run();
            finalRemainingCredits = Math.max(0, userRecord.credits - 1);
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
        }

        // --- CACHE câu trả lời (câu hỏi giống nhau, không kèm file/lịch sử) ---
        const answerScope = resolveAnswerScope(history, message);
        const cacheable = !fileKey && history.length === 0 && !body.stream;
        const normMsg = message.trim().normalize('NFC');
        // Invalidate old answers; relative periods must also expire when the local date changes.
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`v30|${answerScope.today}|${normMsg}`));
        const hash = Array.from(new Uint8Array(digest)).slice(0, 12).map((x) => x.toString(16).padStart(2, '0')).join('');
        const cacheKey = new Request(`https://cache.internal/chat/${hash}`);
        if (cacheable) {
          const hit = await caches.default.match(cacheKey);
          if (hit) {
            const cached: any = await hit.json();
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
            return jsonResponse({ ...cached, cached: true, remainingCredits }, 200, corsHeaders);
          }
        }

        // --- BƯỚC 1: HYBRID RETRIEVAL (BM25 + route boost) ---
        const retrievalQuery = buildConversationRetrievalQuery(history, message, answerScope.years);
        const { results, routeId, usedFallback } = retrieve(retrievalQuery, 4, answerScope);
        const relevantChunks: RagChunk[] = results.map((r) => r.chunk);
        const matchedRoute = routeId ? { refs: relevantChunks.map((c) => c.ref_id).filter(Boolean) } : null;
        const { text: ragContextText, citations: retrievedCitations } = buildContext(results, retrievalQuery, 6500, answerScope);
        const verifiedTaxAnswer = answerVerifiedBusinessTax(message, answerScope);
        const legalCitations = verifiedTaxAnswer?.citations || retrievedCitations;
        // Guard chủ đề PENDING: chèn disclaimer vào prompt, không để model chốt cứng
        const pendingTopics = matchPendingTopics(message);
        const pendingNotice = pendingTopics.length
          ? `CHỦ ĐỀ CHƯA XÁC MINH: ${pendingTopics.map((t) => t.disclaimer).join(' ')} Chỉ trình bày các cách hiểu có thể dựa trên trích lục, nêu rõ điểm chưa chắc chắn, KHÔNG chốt cứng một đáp án duy nhất.\n`
          : '';
        const retrievalTrace = {
          method: routeId ? 'BM25 và định tuyến câu hỏi' : 'BM25',
          period: { years: answerScope.years, source: answerScope.periodSource },
          ruleIds: verifiedTaxAnswer?.ruleIds || [],
          pendingTopics: pendingTopics.map((t) => t.id),
          evidence: relevantChunks.map((chunk) => ({
            title: (chunk.text.match(/^##\s*(?:16\.\d+\.\s*)?(.+)$/m)?.[1] || chunk.section)
              .replace(/[*`]/g, '').slice(0, 150),
            conditional: chunk.tier === 'VERIFIED_CONDITIONAL',
          })),
        };

        let aiText = verifiedTaxAnswer?.response || '';
        let source = verifiedTaxAnswer ? 'Tax Engine (verified rules)'
          : relevantChunks.length === 0
          ? 'Chưa tìm thấy căn cứ'
          : routeId ? `RAG Hybrid (${routeId})` : 'RAG Hybrid (BM25)';

        // --- BƯỚC 2: LLM GENERATION VỚI MUSE SPARK API (META AI) ---
        if (!aiText && ragContextText) {
          const systemPrompt = `Bạn là chuyên viên tư vấn thuế cho hộ kinh doanh & cá nhân kinh doanh tại Việt Nam.
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
12. Nghị quyết 43/2026/QH16 (Giảm 30% thuế TNCN kỳ 2026–2027): Áp dụng giảm 30% số thuế TNCN phải nộp đối với thu nhập từ kinh doanh của cá nhân cư trú có doanh thu năm không quá 10 tỷ đồng. Khi tính số thuế năm 2026, phân biệt: (1) Thuế GTGT tính trên toàn bộ doanh thu, không trừ 1 tỷ và không giảm theo NQ43; nếu người dùng hỏi giảm GTGT thì xét riêng Nghị quyết 204/2025/QH15 và Nghị định 174/2025/NĐ-CP theo điều kiện hàng hóa/dịch vụ, thời gian và hóa đơn; (2) Thuế TNCN trước ưu đãi tính trên phần doanh thu vượt 1 tỷ đồng; (3) Mức giảm 30% TNCN theo NQ43 và số thuế TNCN sau giảm. Không áp NQ43 cho GTGT, tiền lương, cá nhân không cư trú hoặc năm 2025. Giữ đúng ngành người dùng khẳng định; cụm "không bán lẻ" là phủ định, không phải dữ kiện ngành bán lẻ.
13. Mã số thuế 888 & Định danh CCCD: Theo Thông tư 86/2024/TT-BTC, từ 01/07/2025 số định danh cá nhân (CCCD 12 số) được sử dụng thay thế cho mã số thuế khi thông tin đã đồng bộ. HKD mở thêm kênh hoặc có MST cũ đuôi 888 KHÔNG bắt buộc phải nộp hồ sơ xin cấp mã 888 mới riêng cho từng kênh bán hàng.
14. Tiếp thị liên kết (Affiliate): Không được mặc định ấn định thuế suất 5% TNCN cho mọi trường hợp. Phải phân biệt dịch vụ quảng cáo số (HKD), hoa hồng môi giới đại lý hay tiền lương tiền công khấu trừ 10%. Nếu chưa rõ thực tế, nêu điều kiện hoặc yêu cầu làm rõ, không chốt số thuế bừa bãi.
15. Đơn hoàn và chi phí sàn: Đơn hoàn hủy thực tế chỉ trừ khỏi doanh thu nếu chưa được trừ trong doanh thu gộp ban đầu (không trừ trùng). Phí sàn là chi phí kinh doanh, đối với phương pháp tính thuế theo tỷ lệ doanh thu thì không được trừ phí sàn khỏi doanh thu chịu thuế.`;

          // ƯU TIÊN 1: Gọi Muse Spark API (Meta AI) nếu có key
          const museKey = env.MUSE_API_KEY;
          if (museKey) {
            try {
              const museInput = buildMuseRequest(systemPrompt, history, message, !!body.stream);

              // --- NẾU CLIENT YÊU CẦU STREAMING (body.stream === true) ---
              if (body.stream) {
                const museStreamRes = await Promise.race([
                  fetch('https://api.meta.ai/v1/responses', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${museKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(museInput),
                  }),
                  new Promise<Response>((_, rej) => setTimeout(() => rej(new Error('timeout')), 45000)),
                ]);

                if (museStreamRes.ok && museStreamRes.body) {
                  const { readable, writable } = new TransformStream();
                  const writer = writable.getWriter();
                  const encoder = new TextEncoder();
                  const reader = museStreamRes.body.getReader();
                  const decoder = new TextDecoder();

                  ctx.waitUntil(
                    (async () => {
                      let fullGeneratedText = '';
                      let fullReasoningSummary = '';
                      try {
                        // Gửi metadata ban đầu (citations, sources, remainingCredits)
                        const remainingCredits = await deductCreditOnce();
                        const metaEvent = `data: ${JSON.stringify({
                          type: 'meta',
                          source: `Muse Spark 1.3 (Meta AI - High Reasoning) + ${source}`,
                          citations: legalCitations,
                          retrieval: retrievalTrace,
                          remainingCredits,
                        })}\n\n`;
                        await writer.write(encoder.encode(metaEvent));
                        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: 'generating' })}\n\n`));

                        let buffer = '';
                        while (true) {
                          const { done, value } = await reader.read();
                          if (done) break;
                          buffer += decoder.decode(value, { stream: true });
                          const lines = buffer.split('\n');
                          buffer = lines.pop() || '';
                          for (const rawLine of lines) {
                            const line = rawLine.trim();
                            if (line.startsWith('data: ')) {
                              const raw = line.slice(6).trim();
                              if (raw === '[DONE]') continue;
                              try {
                                const parsed = JSON.parse(raw);
                                if (parsed.type === 'response.output_item.added' && parsed.item?.type === 'reasoning') {
                                  const thinkEvent = `data: ${JSON.stringify({ type: 'thinking', status: 'in_progress' })}\n\n`;
                                  await writer.write(encoder.encode(thinkEvent));
                                } else if (parsed.type === 'response.reasoning_summary_text.delta' && typeof parsed.delta === 'string') {
                                  fullReasoningSummary += parsed.delta;
                                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'reasoning_summary', delta: parsed.delta })}\n\n`));
                                } else if (parsed.type === 'response.output_item.done' && parsed.item?.type === 'reasoning' && !fullReasoningSummary) {
                                  const summary = (parsed.item.summary || [])
                                    .map((part: { text?: string }) => part.text || '')
                                    .join('');
                                  if (summary) {
                                    fullReasoningSummary = summary;
                                    await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'reasoning_summary', delta: summary })}\n\n`));
                                  }
                                } else if (parsed.type === 'response.output_text.delta' && typeof parsed.delta === 'string') {
                                  fullGeneratedText += parsed.delta;
                                  const textEvent = `data: ${JSON.stringify({ type: 'delta', delta: parsed.delta })}\n\n`;
                                  await writer.write(encoder.encode(textEvent));
                                }
                              } catch {}
                            }
                          }
                        }

                        // Gửi sự kiện kết thúc kèm remainingCredits
                        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done', fullText: fullGeneratedText, remainingCredits })}\n\n`));
                        await writer.write(encoder.encode('data: [DONE]\n\n'));

                        // Ghi log vào D1 ở background
                        if (env.DB && activePhone && fullGeneratedText) {
                          await env.DB.prepare(
                            `INSERT INTO chat_logs (id, user_phone, message, response, credits_used, source) VALUES (?, ?, ?, ?, 1, ?)`
                          )
                            .bind(`chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, activePhone, message, fullGeneratedText, `Muse Spark 1.3 (Stream)`)
                            .run()
                            .catch(() => {});
                        }
                      } catch (errStream: any) {
                        console.error('Stream error:', errStream?.message);
                      } finally {
                        await writer.close();
                      }
                    })()
                  );

                  const streamHeaders = new Headers(corsHeaders);
                  streamHeaders.set('Content-Type', 'text/event-stream; charset=utf-8');
                  streamHeaders.set('Cache-Control', 'no-cache, no-transform');
                  streamHeaders.set('Connection', 'keep-alive');
                  return new Response(readable, { status: 200, headers: streamHeaders });
                }
                if (!museStreamRes.ok) {
                  console.warn('Muse stream API error:', museStreamRes.status, (await museStreamRes.text()).slice(0, 300));
                }
              }

              // --- NẾU KHÔNG DÙNG STREAM: GỌI BLOCKING THƯỜNG ---
              const museRes = await Promise.race([
                fetch('https://api.meta.ai/v1/responses', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${museKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(buildMuseRequest(systemPrompt, history, message, false)),
                }),
                new Promise<Response>((_, rej) => setTimeout(() => rej(new Error('timeout')), 45000)),
              ]);

              if (museRes.ok) {
                const museData: any = await museRes.json();
                const msgOutput = (museData?.output || []).find((item: any) => item.type === 'message' && item.content);
                const outText = msgOutput?.content?.[0]?.text?.trim();
                if (outText && outText.length > 15) {
                  aiText = outText;
                  source = `Muse Spark 1.3 (Meta AI) + ${source}`;
                }
              } else {
                console.warn('Muse API error:', museRes.status, (await museRes.text()).slice(0, 300));
              }
            } catch (errMuse: any) {
              console.error('Lỗi gọi Muse API:', errMuse?.message);
            }
          }
        }

        const guarded = verifiedTaxAnswer
          ? { answer: aiText, reason: null }
          : guardTaxAnswer(message, answerScope, relevantChunks.map((chunk) => chunk.ref_id || ''), aiText || '');
        if (guarded.reason) {
          console.warn(`[ANSWER_GUARD] ${guarded.reason}: "${message}"`);
          aiText = guarded.answer;
          source = `verified-answer-guard (${guarded.reason}) + ${source}`;
        }

        // Nếu mô hình không khả dụng và không có answer guard, không biến một đoạn truy xuất thành kết luận pháp lý.
        let llmOk = !!aiText;
        if (!aiText) {
          if (relevantChunks.length > 0) {
            aiText = 'Đã tìm thấy tài liệu liên quan, nhưng hệ thống Muse Spark AI hiện chưa thể tổng hợp câu trả lời lúc này. Vui lòng thử lại sau ít phút.';
          } else {
            aiText = `Mình chưa tìm thấy căn cứ đủ chắc cho câu hỏi này. Bạn cho mình biết thêm doanh thu năm, ngành nghề và bán trên kênh nào (sàn TMĐT, cửa hàng, dịch vụ) nhé. Nếu cần chắc chắn, bạn có thể đặt lịch tư vấn với chuyên viên.`;
          }
        }

        // Dọn dẹp nếu model vẫn sinh ra thẻ suy luận sót lại
        aiText = aiText.replace(/(?:<thinking>|\[SUY_LUAN\])[\s\S]*?(?:<\/thinking>|\[\/SUY_LUAN\])/i, '').trim();

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

        // Nếu client yêu cầu Stream mà không dùng được Muse Stream trực tiếp, stream fallback qua SSE
        if (body.stream) {
          const remainingCredits = await deductCreditOnce();
          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();
          const encoder = new TextEncoder();
          ctx.waitUntil(
            (async () => {
              try {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'meta', source, citations: legalCitations, retrieval: retrievalTrace, remainingCredits })}\n\n`));
                const words = aiText.split(' ');
                for (let i = 0; i < words.length; i += 3) {
                  const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'delta', delta: chunk })}\n\n`));
                  await new Promise((r) => setTimeout(r, 25));
                }
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done', fullText: aiText, remainingCredits })}\n\n`));
                await writer.write(encoder.encode('data: [DONE]\n\n'));
              } finally {
                await writer.close();
              }
            })()
          );
          const streamHeaders = new Headers(corsHeaders);
          streamHeaders.set('Content-Type', 'text/event-stream; charset=utf-8');
          streamHeaders.set('Cache-Control', 'no-cache, no-transform');
          streamHeaders.set('Connection', 'keep-alive');
          return new Response(readable, { status: 200, headers: streamHeaders });
        }

        const remainingCredits = await deductCreditOnce();
        const payload = {
          success: true,
          response: aiText,
          source,
          citations: legalCitations,
          retrieval: retrievalTrace,
          matchedRefs: matchedRoute?.refs || [],
          remainingCredits,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };

        if (cacheable && llmOk) {
          ctx.waitUntil(
            caches.default.put(
              cacheKey,
              new Response(JSON.stringify(payload), { headers: { 'Cache-Control': 'max-age=86400', 'Content-Type': 'application/json' } })
            )
          );
        }

        if (path === '/api/chatgpt/tax-qa') {
          return jsonResponse(
            {
              success: true,
              answer: aiText,
              legal_citations: legalCitations,
              evidence: (retrievalTrace.evidence || []).map((e: any) => e.title),
              source,
            },
            200,
            corsHeaders
          );
        }

        return jsonResponse(payload, 200, corsHeaders);
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







