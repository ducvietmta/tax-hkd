import type { Env } from './http';

export async function hasMcpTestAccess(request: Request, env: Env): Promise<boolean> {
  const configuredSecret = (env as unknown as Record<string, unknown>)?.MCP_TEST_SECRET;
  if (typeof configuredSecret !== 'string' || !configuredSecret.trim()) {
    return false;
  }
  const provided = request.headers.get('X-MCP-Test-Secret') || '';
  return provided === configuredSecret.trim();
}
