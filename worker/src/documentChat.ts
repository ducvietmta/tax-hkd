import { libraryDocument,documentContext,documentInstructions } from './documentLibrary';
import { normalizeConversationHistory } from './conversation';
import { verifiedFirebasePhone } from './firebaseAuth';
import { jsonResponse, type Env } from './http';
import { isChatRateLimited } from './rateLimit';
import { readRegistrationModelStream } from './registrationModelStream';

const SOURCE = 'Trợ lý tài liệu · Muse Spark 1.3';

async function readBody(request: Request): Promise<any> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('EMPTY_BODY');
  const decoder = new TextDecoder(); let total = 0, text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 64000) throw new Error('BODY_LIMIT');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { try { await reader.cancel(); } catch {} reader.releaseLock(); }
}

/** Deliberately independent of routeChat: auth -> credit -> one streaming model call. */
export async function handleDocumentChat(request: Request, env: Env, ctx: ExecutionContext, cors: Headers): Promise<Response> {
  if(request.method==='GET'){
    const doc=libraryDocument(new URL(request.url).searchParams.get('documentId')||'');
    const sourceId=new URL(request.url).searchParams.get('sectionId');
    if(sourceId){const section=doc?.sections.find(s=>s.id===sourceId);return section?jsonResponse(section,200,cors):jsonResponse({error:'Không tìm thấy mục nguồn.'},404,cors);}
    return jsonResponse({ready:!!doc,version:doc?.version,sections:doc?.sections.map(s=>({id:s.id,title:s.title}))||[]},200,cors);
  }
  if (request.method !== 'POST') return jsonResponse({ success: false, error: 'Method not allowed.' }, 405, cors);
  const startedAt = Date.now();
  const phone = await verifiedFirebasePhone(request);
  if (!phone) return jsonResponse({ success: false, requireLogin: true, error: 'Vui lòng đăng nhập để trao đổi với trợ lý tài liệu.' }, 401, cors);
  let body: any;
  try { body = await readBody(request); }
  catch { return jsonResponse({ success: false, error: 'Nội dung gửi không hợp lệ hoặc quá dài.' }, 400, cors); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonResponse({ success: false, error: 'Nội dung gửi không hợp lệ.' }, 400, cors);
  if (body.phone && body.phone !== phone) return jsonResponse({ success: false, requireLogin: true, error: 'Thông tin xác thực không khớp.' }, 403, cors);
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > 2000 || body.fileKey) return jsonResponse({ success: false, error: 'Nhập câu hỏi bằng văn bản, tối đa 2.000 ký tự.' }, 400, cors);
  const doc=libraryDocument(typeof body.documentId==='string'?body.documentId:'');
  if(!doc)return jsonResponse({success:false,error:'Tài liệu này chưa được bổ sung nội dung Markdown cho trợ lý.'},409,cors);
  if(body.documentVersion!==doc.version)return jsonResponse({success:false,error:'Nội dung tài liệu đã đổi. Vui lòng mở hội thoại mới.'},409,cors);
  const context=documentContext(doc,message,body.sectionId);
  if(!context)return jsonResponse({success:false,error:'Tài liệu dài. Hãy chọn mục cần giải thích để giữ đầy đủ nội dung và ngoại lệ.'},422,cors);
  if ((!env.MUSE_API_KEY && !env.OPENAI_API_KEY) || !env.DB) return jsonResponse({ success: false, error: 'Trợ lý tài liệu tạm thời chưa sẵn sàng. Vui lòng thử lại.' }, 503, cors);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (await isChatRateLimited(ip, env, ctx, phone)) return jsonResponse({ success: false, error: 'Bạn gửi quá nhanh, vui lòng thử lại sau.' }, 429, cors);

  // Reserve atomically, preventing concurrent requests spending the same last credit.
  const reserved = await env.DB.prepare(`UPDATE users SET credits = credits - 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ? AND credits > 0 RETURNING credits`)
    .bind(phone).first<{ credits: number }>();
  if (!reserved) return jsonResponse({ success: false, requireDeposit: true, remainingCredits: 0, error: 'Bạn chưa có lượt hỏi. Vui lòng kiểm tra tài khoản.' }, 403, cors);

  let history;
  try { history = normalizeConversationHistory(body.history); }
  catch {
    await env.DB.prepare('UPDATE users SET credits = credits + 1 WHERE phone = ?').bind(phone).run();
    return jsonResponse({success:false,error:'Hội thoại quá dài. Vui lòng mở cuộc trò chuyện mới.'},413,cors);
  }
  const panelMessage=JSON.stringify({document:{id:doc.id,title:doc.title,version:doc.version},scope:context.scope,sections:context.sections});
  const input = [
    ...history.map(turn => ({ role: turn.role, content: [{ type: turn.role === 'assistant' ? 'output_text' : 'input_text', text: turn.content }] })),
    { role: 'user', content: [{ type: 'input_text', text: panelMessage }, { type: 'input_text', text: message }] },
  ];

  const abort = new AbortController();
  let controller!: ReadableStreamDefaultController<Uint8Array>, closed = false, consumed = false;
  let firstTextMs: number | null = null;
  const encoder = new TextEncoder();
  let heartbeat:ReturnType<typeof setInterval>|undefined;
  const send = (event: unknown) => { if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)); };
  const stream = new ReadableStream<Uint8Array>({
    start(value) { controller = value; },
    cancel() { closed = true; abort.abort();if(heartbeat)clearInterval(heartbeat); },
  });
  const onDisconnect = () => abort.abort();
  request.signal.addEventListener('abort', onDisconnect, { once: true });
  if (request.signal.aborted) abort.abort();
  const timer = setTimeout(() => abort.abort(), 90000);
  const task = (async () => {
    try {
      controller.enqueue(encoder.encode(`: document-reader ${' '.repeat(16384)}\n\n`));
      heartbeat=setInterval(()=>{if(!closed)controller.enqueue(encoder.encode(': keepalive\n\n'));},10000);
      send({ type: 'meta', source: SOURCE, remainingCredits: reserved.credits });
      send({ type: 'progress', stage: 'received' });
      send({ type: 'status', status: 'generating' });

      let answer = '';
      {
        const upstream = await fetch('https://api.meta.ai/v1/responses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.MUSE_API_KEY}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify({ model: 'muse-spark-1.3-contributor', instructions: documentInstructions(), input,
            reasoning: { effort: 'minimal' }, max_output_tokens: 5000, stream: true, store: false }),
          signal: abort.signal,
        });
        answer = await readRegistrationModelStream(upstream, delta => {
          if (firstTextMs === null) firstTextMs = Date.now() - startedAt;
          send({ type: 'delta', delta });
        });
      }
      if (closed || abort.signal.aborted) throw new Error('REQUEST_CANCELLED');
      const ids=new Set(context.sections.map(s=>s.id));
      if([...answer.matchAll(/\[(S\d+)\]/g)].some(match=>!ids.has(match[1])))throw Error('INVALID_DOCUMENT_SOURCE');
      consumed = true;
      send({ type: 'done', fullText: answer, remainingCredits: reserved.credits });
      if (!closed) controller.enqueue(encoder.encode('data: [DONE]\n\n'));
    } catch (error: unknown) {
      // Failures/cancellation never consume a completed-question credit.
      let creditRestored = false;
      try {
        const refunded = await env.DB.prepare(`UPDATE users SET credits = credits + 1, updated_at = CURRENT_TIMESTAMP WHERE phone = ? RETURNING credits`)
          .bind(phone).first<{ credits: number }>();
        if (refunded) { creditRestored = true; send({ type: 'meta', remainingCredits: refunded.credits }); }
      } catch { console.error('[DOCUMENT_CREDIT_REFUND_FAILED]'); }
      console.warn('[DOCUMENT_ADVISOR_FAILED]', error instanceof Error ? error.name : 'Error');
      send({ type: 'error', error: creditRestored ? 'Hướng dẫn bị gián đoạn. Lượt hỏi đã được hoàn lại; bạn có thể thử lại.' : 'Hướng dẫn bị gián đoạn. Chưa xác nhận được hoàn lượt; vui lòng kiểm tra số dư hoặc liên hệ hỗ trợ.' });
    } finally {
      clearTimeout(timer);
      if(heartbeat)clearInterval(heartbeat);
      request.signal.removeEventListener('abort', onDisconnect);
      console.log('[DOCUMENT_ADVISOR_TIMING]', JSON.stringify({ firstTextMs, totalMs: Date.now() - startedAt, completed: consumed, documentId:doc.id,version:doc.version }));
      if (!closed) { closed = true; controller.close(); }
    }
  })();
  ctx.waitUntil(task);
  const headers = new Headers(cors);
  headers.set('Content-Type', 'text/event-stream; charset=utf-8');
  headers.set('Cache-Control', 'no-store, no-transform');
  headers.set('Content-Encoding', 'identity');
  headers.set('X-Accel-Buffering', 'no');
  headers.set('X-Assistant-Flow', 'document-chat-v1');
  headers.set('Server-Timing', `preflight;dur=${Date.now() - startedAt}`);
  return new Response(stream, { headers });
}
