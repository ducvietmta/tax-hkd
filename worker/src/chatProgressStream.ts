import type { ChatProgress } from '../../shared/chatProgress';

export type ChatStreamEvent = ChatProgress | { type: 'delta'; delta: string } | { type: 'reasoning_summary'; delta: string; reset?: boolean };

/** Open SSE at the first real milestone, preserving preflight HTTP errors. */
export function streamChatProgress(
  run: (notify: (progress: ChatStreamEvent) => void) => Promise<Response>,
  ctx: Pick<ExecutionContext, 'waitUntil'>,
  cors: Headers,
  heartbeatMs = 10000,
): Promise<Response> {
  return new Promise(resolve => {
    const startedAt = Date.now();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    let started = false, closed = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(value) { controller = value; },
      cancel() { closed = true; if (heartbeat) clearInterval(heartbeat); },
    });
    const headers = new Headers(cors);
    headers.set('Content-Type', 'text/event-stream; charset=utf-8');
    headers.set('Cache-Control', 'no-cache, no-transform');
    headers.set('Content-Encoding', 'identity');
    headers.set('X-Accel-Buffering', 'no');
    const send = (event: unknown) => {
      if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    };
    const finish = () => { if (heartbeat) clearInterval(heartbeat); if (!closed) { closed = true; controller.close(); } };
    const task = (async () => {
      try {
        let streamedAnyDelta = false;
        const result = await run(progress => {
          if (!started) {
            headers.set('Server-Timing', `preflight;dur=${Date.now() - startedAt}`);
            started = true; resolve(new Response(stream, { headers }));
            heartbeat = setInterval(() => { if (!closed) controller.enqueue(encoder.encode(': keepalive\n\n')); }, heartbeatMs);
            // SSE comment padding flushes small initial events through buffering intermediaries.
            if (!closed) controller.enqueue(encoder.encode(`: connected ${' '.repeat(16384)}\n\n`));
          }
          if ('type' in progress && progress.type === 'reasoning_summary') {
            send({ type: 'reasoning_summary', delta: progress.delta, reset: progress.reset === true });
          } else if ('type' in progress && progress.type === 'delta') {
            send({ type: 'delta', delta: progress.delta });
            streamedAnyDelta = true;
          } else if ('stage' in progress) {
            send({ type: 'progress', stage: progress.stage });
          }
        });
        if (!started) { resolve(result); finish(); return; }
        const payload: any = await result.json();
        const fullAnswer = typeof payload.response === 'string'
          ? payload.response
          : (typeof payload.answer === 'string' ? payload.answer : '');

        if (!result.ok || !payload.success || !fullAnswer.trim()) {
          send({ type: 'error', error: payload.error || 'Không thể hoàn tất câu trả lời.' });
          return;
        }
        send({
          type: 'meta',
          source: payload.source,
          citations: payload.citations || payload.legal_citations || [],
          retrieval: payload.retrieval,
          remainingCredits: payload.remainingCredits,
        });
        
        if (!streamedAnyDelta) {
          // Stream the validated answer smoothly over SSE with natural token pacing
          const chunkSize = 24;
          for (let i = 0; i < fullAnswer.length; i += chunkSize) {
            if (closed) break;
            send({ type: 'delta', delta: fullAnswer.slice(i, i + chunkSize) });
            await new Promise(r => setTimeout(r, 16));
          }
        }
        
        send({ type: 'done', fullText: fullAnswer, remainingCredits: payload.remainingCredits });
        if (!closed) controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch {
        if (!started) resolve(new Response(JSON.stringify({ success: false, error: 'Không thể kết nối dịch vụ trả lời.' }), { status: 503, headers: { ...Object.fromEntries(cors), 'Content-Type': 'application/json' } }));
        else send({ type: 'error', error: 'Quá trình trả lời bị gián đoạn. Vui lòng thử lại.' });
      } finally { finish(); }
    })();
    ctx.waitUntil(task);
  });
}
