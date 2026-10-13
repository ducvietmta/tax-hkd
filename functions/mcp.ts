// Cloudflare Pages Function Proxy cho MCP Endpoint
const WORKER_ORIGIN = 'https://tax-agent-worker.ducviet-mta.workers.dev';

export const onRequest: PagesFunction = async ({ request }) => {
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL('/mcp' + incomingUrl.search, WORKER_ORIGIN);
  const upstream = await fetch(new Request(targetUrl, request));
  const response = new Response(upstream.body, upstream);
  response.headers.set('X-API-Proxy', 'mcp-v1');
  return response;
};
