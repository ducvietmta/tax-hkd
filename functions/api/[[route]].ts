// Keep Pages on the same /api/* origin while the Worker owns API logic and secrets.
const WORKER_ORIGIN = 'https://tax-agent-worker.ducviet-mta.workers.dev';

export const onRequest: PagesFunction = async ({ request }) => {
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, WORKER_ORIGIN);
  const upstream = await fetch(new Request(targetUrl, request));
  const response = new Response(upstream.body, upstream);
  response.headers.set('X-API-Proxy', 'worker-v1');
  return response;
};
