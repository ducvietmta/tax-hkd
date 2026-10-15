// Keep Pages on the same /api/* origin while the Worker owns API logic and secrets.
// WORKER_ORIGIN cấu hình bằng Pages env var (Settings > Environment variables);
// fallback giữ domain hiện tại để không vỡ deploy cũ.
const FALLBACK_WORKER_ORIGIN = 'https://tax-agent-worker.ducviet-mta.workers.dev';

export const onRequest: PagesFunction = async ({ request, env }) => {
  const workerOrigin = (env?.WORKER_ORIGIN as string) || FALLBACK_WORKER_ORIGIN;
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, workerOrigin);
  const upstream = await fetch(new Request(targetUrl, request));
  const response = new Response(upstream.body, upstream);
  response.headers.set('X-API-Proxy', 'worker-v1');
  return response;
};
