/**
 * ====================================================================
 * CLOUDFLARE WORKERS BACKEND - HỆ THỐNG THUẾ TMĐT & HKD 2026
 * ====================================================================
 * Stack:
 * - Runtime: Cloudflare Workers
 * - Database: Cloudflare D1 (SQLite)
 * - Storage: Cloudflare R2 (Ảnh & File hoá đơn/chứng từ)
 * - AI: Cloudflare Workers AI (Llama 3.1) / Knowledge Engine
 * - CDN & WAF: Cloudflare Edge
 */

import { RagChunk } from './ragEngine';
import { verifiedFirebasePhone } from './firebaseAuth';
import { retrieve, buildContext, fold, analyzeAmounts } from './retriever';
import { buildConversationRetrievalQuery, normalizeConversationHistory } from './conversation';

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
  const origin = request.headers.get('Origin') || '*';
  headers.set('Access-Control-Allow-Origin', origin);
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
      // 1. HEALTH CHECK & TEST AI
      if (path === '/api/test-ai') {
        try {
          if (!env.AI) {
            return jsonResponse({ error: 'env.AI is undefined' }, 200, corsHeaders);
          }
          let res: any = null;
          try {
            res = await env.AI.run('@cf/qwen/qwen2.5-7b-instruct', {
              prompt: 'Chào bạn, trả lời bằng tiếng Việt: 1 + 1 bằng mấy?',
              max_tokens: 50,
            });
          } catch {
            res = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
              prompt: 'Chào bạn, trả lời bằng tiếng Việt: 1 + 1 bằng mấy?',
              max_tokens: 50,
            });
          }
          return jsonResponse({ success: true, res }, 200, corsHeaders);
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
            hasAI: !!env.AI,
            timestamp: new Date().toISOString(),
          },
          200,
          corsHeaders
        );
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

      // 7. TƯ VẤN THUẾ AI VỚI RAG KNOWLEDGE BASE ENGINE (POST /api/chat)
      if (path === '/api/chat' && request.method === 'POST') {
        const body: any = await request.json();
        const { message, phone, fileKey } = body;
        if (phone && await verifiedFirebasePhone(request) !== phone) {
          return jsonResponse({ success: false, error: 'Access denied.' }, 403, corsHeaders);
        }

        if (fileKey) {
          return jsonResponse({
            success: false,
            error: 'Hệ thống chưa hỗ trợ đọc nội dung tệp đính kèm để tư vấn. Vui lòng nhập câu hỏi bằng văn bản.',
          }, 422, corsHeaders);
        }

        if (!message || !message.trim()) {
          return jsonResponse({ success: false, error: 'Nội dung câu hỏi không được để trống.' }, 400, corsHeaders);
        }

        // --- GIỚI HẠN TỐC ĐỘ (best-effort theo IP, chống spam khách vãng lai) ---
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (!phone) {
          const rlKey = new Request(`https://rl.internal/chat/${ip}/${Math.floor(Date.now() / 3600000)}`);
          const rlHit = await caches.default.match(rlKey);
          const count = rlHit ? parseInt((await rlHit.text()) || '0', 10) : 0;
          if (count >= 20) {
            return jsonResponse({ success: false, error: 'Bạn hỏi hơi nhiều trong 1 giờ, vui lòng đăng nhập hoặc thử lại sau nhé.' }, 429, corsHeaders);
          }
          ctx.waitUntil(
            caches.default.put(rlKey, new Response(String(count + 1), { headers: { 'Cache-Control': 'max-age=3600' } }))
          );
        }

        // --- CACHE câu trả lời (câu hỏi giống nhau, không kèm file/lịch sử) ---
        const history = normalizeConversationHistory(body.history);
        const cacheable = !fileKey && history.length === 0 && !body.stream;
        const normMsg = fold(message).slice(0, 400);
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`v11|${normMsg}`));
        const hash = Array.from(new Uint8Array(digest)).slice(0, 12).map((x) => x.toString(16).padStart(2, '0')).join('');
        const cacheKey = new Request(`https://cache.internal/chat/${hash}`);
        if (cacheable) {
          const hit = await caches.default.match(cacheKey);
          if (hit) {
            const cached: any = await hit.json();
            if (env.DB && phone) {
              ctx.waitUntil(
                env.DB.prepare(
                  `INSERT INTO chat_logs (id, user_phone, message, response, credits_used, source) VALUES (?, ?, ?, ?, 1, ?)`
                )
                  .bind(`chat_${Date.now()}`, phone, message, cached.response, 'cache')
                  .run()
              );
            }
            return jsonResponse({ ...cached, cached: true }, 200, corsHeaders);
          }
        }

        // --- BƯỚC 1: HYBRID RETRIEVAL (BM25 + route boost) ---
        const retrievalQuery = buildConversationRetrievalQuery(history, message);
        const { results, routeId } = retrieve(retrievalQuery, 4);
        const relevantChunks: RagChunk[] = results.map((r) => r.chunk);
        const matchedRoute = routeId ? { refs: relevantChunks.map((c) => c.ref_id).filter(Boolean) } : null;
        const { text: ragContextText, citations: legalCitations } = buildContext(results, retrievalQuery);
        const retrievalTrace = {
          method: routeId ? 'BM25 và định tuyến câu hỏi' : 'BM25',
          evidence: relevantChunks.map((chunk) => ({
            title: (chunk.text.match(/^##\s*(?:16\.\d+\.\s*)?(.+)$/m)?.[1] || chunk.section)
              .replace(/[*`]/g, '').slice(0, 150),
            conditional: chunk.tier === 'VERIFIED_CONDITIONAL',
          })),
        };

        let aiText = '';
        let source = relevantChunks.length === 0
          ? 'Chưa tìm thấy căn cứ'
          : routeId ? `RAG Hybrid (${routeId})` : 'RAG Hybrid (BM25)';

        // --- BƯỚC 2: LLM GENERATION VỚI MUSE SPARK API (META AI) + FALLBACK WORKERS AI ---
        if (ragContextText) {
          const systemPrompt = `Bạn hỗ trợ tra cứu thuế cho hộ kinh doanh & cá nhân kinh doanh tại Việt Nam. Xác định năm/kỳ áp dụng trước khi kết luận.
Dưới đây là thông tin quy định thuế trích lục:
--------------------------------------------------
${ragContextText}
--------------------------------------------------
${analyzeAmounts(message)}
QUY TẮC BẮT BUỘC (TUÂN THỦ TUYỆT ĐỐI):
1. TUYỆT ĐỐI KHÔNG đưa nội dung phân tích thô, mã mục hay tiêu đề chú thích của hệ thống RAG vào câu trả lời (không nhắc tới mã số ref_id như 16.xx, không sao chép nguyên văn cả đoạn văn dài của hệ thống).
2. Trả lời rõ ràng theo đúng dữ kiện người dùng cung cấp. Với câu hỏi nhiều ý, trả lời trực tiếp từng ý trước. Nếu thiếu một dữ kiện, nêu kết luận có điều kiện rõ ràng bằng chính dữ kiện đó; chỉ hỏi thêm khi không thể đưa ra hướng xử lý hữu ích.
3. Không tự tạo dòng "Căn cứ" hoặc thêm tên văn bản ngoài ngữ cảnh. Giao diện sẽ hiển thị riêng những trích dẫn được truy xuất.
4. Không áp một ngưỡng hoặc quy định của năm 2026 cho năm khác. Nếu năm hoặc loại thu nhập chưa rõ, nói rõ điều kiện tương ứng thay vì tự đoán. Không coi ngày ban hành công văn hướng dẫn là ngày một quy định mới bắt đầu áp dụng khi nguồn không nói vậy.
5. Trong câu trả lời, giải thích ngắn gọn vì sao kết luận áp dụng cho dữ kiện người dùng đưa ra; nêu điều kiện còn thiếu nếu có. Chỉ dựa trên ngữ cảnh đã truy xuất và không trình bày nội dung suy luận nội bộ.
6. Viết như đang trò chuyện với một người kinh doanh: xưng "mình" và gọi người hỏi là "bạn". Mở đầu bằng câu trả lời trực tiếp, sau đó giải thích bằng từ ngữ đời thường, câu ngắn và ví dụ đơn giản nếu hữu ích. Tránh giọng công văn, lời mở đầu kiểu "Theo quy định của pháp luật hiện hành", tiêu đề học thuật và danh sách dài khi không cần thiết.
7. Nếu phải dùng thuật ngữ thuế, giải thích ngay bằng một câu dễ hiểu. Khi người dùng hỏi "chỉ cần khai cuối năm?", phân biệt thông báo doanh thu, tờ khai thuế định kỳ và quyết toán thuế; nêu mẫu và hạn nếu ngữ cảnh đã có. Nếu còn thiếu dữ kiện thật sự quan trọng, hỏi tối đa một câu ở cuối. Không vì muốn thân thiện mà làm nhẹ đi điều kiện áp dụng, con số hoặc mức độ chắc chắn của kết luận.
8. Đọc lịch sử hội thoại như một cuộc tư vấn liên tục. Câu hiện tại có thể chỉ là dữ kiện bạn vừa yêu cầu bổ sung (ví dụ "800 triệu/năm"). Khi đó, ghép dữ kiện mới với câu hỏi gốc và các câu trả lời trước để tư vấn tiếp, không coi nó là câu hỏi độc lập. Nếu thông tin mới sửa thông tin cũ, ưu tiên thông tin mới. Nếu người dùng chuyển sang chủ đề khác, trả lời theo chủ đề mới.`;

          // ƯU TIÊN 1: Gọi Muse Spark API (Meta AI) nếu có key
          const museKey = env.MUSE_API_KEY;
          if (museKey) {
            try {
              // Ghép ngữ cảnh đàm thoại cho input của Muse
              const musePrompt = `${systemPrompt}\n\n[LỊCH SỬ HỘI THOẠI]:\n${history.map((h) => `${h.role === 'user' ? 'Khách' : 'Chuyên viên'}: ${h.content}`).join('\n')}\n\n[CÂU HỎI HIỆN TẠI]: ${message}`;

              // --- NẾU CLIENT YÊU CẦU STREAMING (body.stream === true) ---
              if (body.stream) {
                const museStreamRes = await Promise.race([
                  fetch('https://api.meta.ai/v1/responses', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${museKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      model: 'muse-spark-1.3-contributor',
                      input: [{ role: 'user', content: [{ type: 'input_text', text: musePrompt }] }],
                      reasoning: { effort: 'high', summary: 'concise' },
                      stream: true,
                    }),
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
                        // Gửi metadata ban đầu (citations, sources)
                        const metaEvent = `data: ${JSON.stringify({
                          type: 'meta',
                          source: `Muse Spark 1.3 (Meta AI - High Reasoning) + ${source}`,
                          citations: legalCitations,
                          retrieval: retrievalTrace,
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

                        // Gửi sự kiện kết thúc
                        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done', fullText: fullGeneratedText })}\n\n`));
                        await writer.write(encoder.encode('data: [DONE]\n\n'));

                        // Ghi log vào D1 ở background
                        if (env.DB && phone && fullGeneratedText) {
                          await env.DB.prepare(
                            `INSERT INTO chat_logs (id, user_phone, message, response, credits_used, source) VALUES (?, ?, ?, ?, 1, ?)`
                          )
                            .bind(`chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, phone, message, fullGeneratedText, `Muse Spark 1.3 (Stream)`)
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
              }

              // --- NẾU KHÔNG DÙNG STREAM: GỌI BLOCKING THƯỜNG ---
              const museRes = await Promise.race([
                fetch('https://api.meta.ai/v1/responses', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${museKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'muse-spark-1.3-contributor',
                    input: [
                      {
                        role: 'user',
                        content: [{ type: 'input_text', text: musePrompt }],
                      },
                    ],
                    reasoning: { effort: 'high' },
                    stream: false,
                  }),
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
                console.warn('Muse API response status:', museRes.status);
              }
            } catch (errMuse: any) {
              console.error('Lỗi gọi Muse API:', errMuse?.message);
            }
          }

          // ƯU TIÊN 2 (FALLBACK): Nếu Muse bận hoặc timeout, gọi Cloudflare Workers AI
          if (!aiText && env.AI) {
            const messages = [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }];
            const models = ['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/qwen/qwen2.5-7b-instruct', '@cf/meta/llama-3.2-3b-instruct'];
            for (const model of models) {
              try {
                const aiResult: any = await Promise.race([
                  env.AI.run(model, { messages, max_tokens: 450, temperature: 0.2 }),
                  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 20000)),
                ]);
                const out = (aiResult?.response || '').trim();
                if (out.length > 15) {
                  aiText = out;
                  source = `${model.split('/').pop()} + ${source}`;
                  break;
                }
              } catch (e: any) {
                console.error(`Lỗi fallback model ${model}:`, e?.message);
              }
            }
          }
        }

        // Nếu mô hình không khả dụng, không biến một đoạn truy xuất thành kết luận pháp lý.
        let llmOk = !!aiText;
        if (!aiText) {
          if (relevantChunks.length > 0) {
            aiText = 'Đã tìm thấy tài liệu liên quan, nhưng hệ thống hiện chưa thể tổng hợp câu trả lời. Vui lòng thử lại sau.';
          } else {
            aiText = `Mình chưa tìm thấy căn cứ đủ chắc cho câu hỏi này. Bạn cho mình biết thêm doanh thu năm, ngành nghề và bán trên kênh nào (sàn TMĐT, cửa hàng, dịch vụ) nhé. Nếu cần chắc chắn, bạn có thể đặt lịch tư vấn với chuyên viên.`;
          }
        }


        // Dọn dẹp nếu model vẫn sinh ra thẻ suy luận sót lại
        aiText = aiText.replace(/(?:<thinking>|\[SUY_LUAN\])[\s\S]*?(?:<\/thinking>|\[\/SUY_LUAN\])/i, '').trim();

        // --- BƯỚC 3: GHI LOG VÀO CLOUDFLARE D1 ---
        if (env.DB && phone) {
          ctx.waitUntil(
            env.DB.prepare(
              `INSERT INTO chat_logs (id, user_phone, message, response, credits_used, source)
               VALUES (?, ?, ?, ?, 1, ?)`
            )
              .bind(`chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, phone, message, aiText, source)
              .run()
              .catch((e: any) => console.error('log error', e?.message))
          );
        }

        // Nếu client yêu cầu Stream mà không dùng được Muse Stream trực tiếp, stream fallback qua SSE
        if (body.stream) {
          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();
          const encoder = new TextEncoder();
          ctx.waitUntil(
            (async () => {
              try {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'meta', source, citations: legalCitations, retrieval: retrievalTrace })}\n\n`));
                const words = aiText.split(' ');
                for (let i = 0; i < words.length; i += 3) {
                  const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'delta', delta: chunk })}\n\n`));
                  await new Promise((r) => setTimeout(r, 25));
                }
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done', fullText: aiText })}\n\n`));
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

        const payload = {
          success: true,
          response: aiText,
          source,
          citations: legalCitations,
          retrieval: retrievalTrace,
          matchedRefs: matchedRoute?.refs || [],
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
};







