import type { Env } from './http';

/** Atomic admission; degrade gracefully on storage failure to prevent 503 blocking legitimate users. */
export class RateLimitUnavailable extends Error {
  constructor() {
    super('Bộ kiểm soát truy cập tạm thời không khả dụng. Vui lòng thử lại sau.');
    this.name = 'RateLimitUnavailable';
  }
}

export async function isChatRateLimited(
  ip: string,
  env: Env,
  ctx: ExecutionContext,
  verifiedIdentity?: string,
  maxPerHour = 300
): Promise<boolean> {
  if (!env.DB) return false;
  const identity = verifiedIdentity ? `account:${verifiedIdentity}` : `ip:${ip}`;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity));
  const scope = 'chat:v3:' + Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  try {
    const admitted = await env.DB.prepare(
      "INSERT INTO rate_limits(scope) SELECT ? WHERE (SELECT COUNT(*) FROM rate_limits WHERE scope=? AND created_at>datetime('now','-1 hour')) < ? RETURNING id"
    ).bind(scope, scope, maxPerHour).first();
    ctx.waitUntil(env.DB.prepare("DELETE FROM rate_limits WHERE created_at<datetime('now','-2 hours')").run().catch(() => {}));
    return !admitted;
  } catch (err) {
    console.warn('[RATE_LIMIT_DB_DEGRADE]', err);
    // Fail-open: Nếu D1 tạm thời bận hoặc lock, không chặn đứng dịch vụ trả về 503
    return false;
  }
}
