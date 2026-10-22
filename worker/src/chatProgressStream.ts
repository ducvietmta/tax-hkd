import type { ChatProgress } from '../../shared/chatProgress';

/** Open SSE at the first real milestone, preserving preflight HTTP errors. */
export function streamChatProgress(
  run: (notify: (progress: ChatProgress) => void) => Promise<Response>,
  ctx: Pick<ExecutionContext, 'waitUntil'>,
  cors: Headers,
): Promise<Response> {
  return new Promise(resolve => {
    const startedAt = Date.now();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    let started = false, closed = false;
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(value) { controller = value; },
      cancel() { closed = true; },
    });
    const headers = new Headers(cors);
    headers.set('Content-Type', 'text/event-stream; charset=utf-8');
    headers.set('Cache-Control', 'no-cache, no-transform');
    headers.set('Content-Encoding', 'identity');
    headers.set('X-Accel-Buffering', 'no');
    const send = (event: unknown) => {
      if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    };
    const finish = () => { if (!closed) { closed = true; controller.close(); } };
    const task = (async () => {
      try {
        const result = await run(progress => {
          if (!started) {
            headers.set('Server-Timing', `preflight;dur=${Date.now() - startedAt}`);
            started = true; resolve(new Response(stream, { headers }));
            // SSE comment padding flushes small initial events through buffering intermediaries.
            if (!closed) controller.enqueue(encoder.encode(`: connected ${' '.repeat(16384)}\n\n`));
          }
          send({ type: 'progress', stage: progress.stage });
        });
        if (!started) { resolve(result); finish(); return; }
        const payload: any = await result.json();
        if (!result.ok || !payload.success || typeof payload.response !== 'string' || !payload.response.trim()) {
          send({type:'error', error:payload.error || 'Không thể hoàn tất câu trả lời.'});
          return;
        }
        send({ type:'meta', source:payload.source, citations:payload.citations || [], retrieval:payload.retrieval, remainingCredits:payload.remainingCredits });
        // Only the validated final answer is delivered, identical to JSON/MCP.
        for (let i=0; i<payload.response.length; i+=120) send({type:'delta',delta:payload.response.slice(i,i+120)});
        send({type:'done',fullText:payload.response,remainingCredits:payload.remainingCredits});
        if (!closed) controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch {
        if (!started) resolve(new Response(JSON.stringify({success:false,error:'Không thể kết nối dịch vụ trả lời.'}),{status:503,headers: {...Object.fromEntries(cors), 'Content-Type':'application/json'}}));
        else send({type:'error',error:'Quá trình trả lời bị gián đoạn. Vui lòng thử lại.'});
      } finally { finish(); }
    })();
    ctx.waitUntil(task);
  });
}
