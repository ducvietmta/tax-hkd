// Keep Pages on the same /api/* origin while the Worker owns API logic and secrets.
// WORKER_ORIGIN cấu hình bằng Pages env var (Settings > Environment variables);
// fallback giữ domain hiện tại để không vỡ deploy cũ.
const FALLBACK_WORKER_ORIGIN = 'https://tax-agent-worker.ducviet-mta.workers.dev';

export const onRequest: PagesFunction = async ({ request, env }) => {
  const envObj = (env || {}) as {
    WORKER_ORIGIN?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
  };
  const workerOrigin = envObj.WORKER_ORIGIN || FALLBACK_WORKER_ORIGIN;
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, workerOrigin);

  try {
    const upstream = await fetch(new Request(targetUrl, request));
    // Nếu upstream trả về phản hồi hợp lệ (kể cả 4xx của ứng dụng)
    if (upstream.ok || (upstream.status < 500 && upstream.status !== 404)) {
      const response = new Response(upstream.body, upstream);
      response.headers.set('X-API-Proxy', 'worker-v1');
      return response;
    }

    // Nếu upstream bị lỗi 5xx máy chủ và đây là gọi chat, kích hoạt Edge Fallback với OpenAI
    if (incomingUrl.pathname === '/api/chat' && envObj.OPENAI_API_KEY && request.method === 'POST') {
      const edgeRes = await handleEdgeFallback(request, envObj.OPENAI_API_KEY, envObj.OPENAI_MODEL);
      if (edgeRes) return edgeRes;
    }

    const response = new Response(upstream.body, upstream);
    response.headers.set('X-API-Proxy', 'worker-v1');
    return response;
  } catch (err: any) {
    // Nếu kết nối tới upstream sập hoàn toàn
    if (incomingUrl.pathname === '/api/chat' && envObj.OPENAI_API_KEY && request.method === 'POST') {
      const edgeRes = await handleEdgeFallback(request, envObj.OPENAI_API_KEY, envObj.OPENAI_MODEL);
      if (edgeRes) return edgeRes;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Máy chủ xử lý đang bận hoặc gián đoạn kết nối, vui lòng thử lại sau ít giây.',
        detail: err?.message,
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};

async function handleEdgeFallback(request: Request, apiKey: string, rawModel = 'gpt-6.1-terra'): Promise<Response | null> {
  try {
    const cloned = request.clone();
    const body: any = await cloned.json().catch(() => null);
    if (!body || !body.message) return null;

    let modelName = (rawModel || 'gpt-6.1-terra').trim();
    if (/^gpt-?6\.1-terra$/i.test(modelName) || /^6\.1[- ]terra$/i.test(modelName)) modelName = 'gpt-6.1-terra';
    if (/^gpt-?6(\.0)?-luna$/i.test(modelName)) modelName = 'gpt-6-luna';

    const isReasoning = modelName.startsWith('gpt-6') || modelName.startsWith('o1') || modelName.startsWith('o3');

    const message = body.message;
    const history = body.history || [];

    const messages = [
      {
        role: 'system',
        content:
          'Bạn là chuyên viên tư vấn thuế Hộ kinh doanh & Thương mại điện tử hàng đầu tại Việt Nam (thuehkd.com). Hãy trả lời chính xác, căn cứ theo Luật Quản lý thuế số 38/2019/QH14, Thông tư 40/2021/TT-BTC, Nghị định 126/2020/NĐ-CP và các quy định hiện hành. Nêu rõ ngưỡng doanh thu 100 triệu đồng/năm, các mức thuế suất (PP trực tiếp: Thương mại/hàng hóa: GTGT 1% + TNCN 0,5%; Dịch vụ: GTGT 5% + TNCN 2%;...), thủ tục đăng ký thuế (Mẫu 03-ĐKT-TCT), thời hạn nộp thuế. Giọng điệu chuyên nghiệp, rõ ràng, ân cần.',
      },
      ...history.map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const payload: Record<string, unknown> = {
      model: modelName,
      messages,
      max_completion_tokens: 4096,
    };
    if (isReasoning) {
      payload.reasoning_effort = 'low';
    } else {
      payload.temperature = 0.2;
    }

    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });

    if (!openAiRes.ok) return null;
    const data: any = await openAiRes.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) return null;

    if (body.stream || request.headers.get('Accept')?.includes('text/event-stream')) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'meta', source: `OpenAI Edge (${data.model || modelName})`, citations: ['Luật Quản lý thuế 38/2019/QH14', 'Thông tư 40/2021/TT-BTC'] })}\n\n`));
          for (let i = 0; i < answer.length; i += 24) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', delta: answer.slice(i, i + 24) })}\n\n`));
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                fullText: answer,
                source: `OpenAI Edge (${data.model || modelName})`,
                citations: ['Luật Quản lý thuế 38/2019/QH14', 'Thông tư 40/2021/TT-BTC'],
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'X-Edge-Provider': 'openai',
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: answer,
        source: `OpenAI Edge (${data.model || modelName})`,
        citations: ['Luật Quản lý thuế 38/2019/QH14', 'Thông tư 40/2021/TT-BTC'],
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Edge-Provider': 'openai',
        },
      }
    );
  } catch (e) {
    console.warn('[EDGE_FALLBACK_ERROR]', e);
    return null;
  }
}
