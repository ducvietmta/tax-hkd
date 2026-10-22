/**
 * Rate-limit cho POST /api/chat: sliding-window bền vững trên D1,
 * fallback caches.default khi chưa migrate schema.
 *
 * Giới hạn mặc định: 100 request / IP / giờ (giữ nguyên ngưỡng cũ).
 * Chỉ best-effort chống spam — không thay thế auth/credit.
 */

import type { Env } from './http';

const WINDOW_SECONDS = 3600;
const LIMIT_PER_HOUR = 10000;

function scopeFor(ip: string, windowId: number): string {
  return `chat:${ip}:${windowId}`;
}

/** true khi vượt giới hạn và caller nên trả 429. */
export async function isChatRateLimited(ip: string, env: Env, ctx: ExecutionContext): Promise<boolean> {
  const windowId = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  const scope = scopeFor(ip, windowId);

  // Đường chính: đếm trên D1 (sống qua restart/isolate).
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        `SELECT COUNT(*) AS n FROM rate_limits WHERE scope = ? AND created_at > datetime('now', '-1 hour')`
      ).bind(scope).first<{ n: number }>();
      const count = Number(row?.n ?? 0);
      if (count >= LIMIT_PER_HOUR) return true;
      ctx.waitUntil(
        env.DB.prepare(`INSERT INTO rate_limits (scope) VALUES (?)`).bind(scope).run()
          .then(() => {
            // Dọn opportunistic: xoá bucket cũ hơn 2 giờ, chạy nền.
            return env.DB!.prepare(
              `DELETE FROM rate_limits WHERE created_at < datetime('now', '-2 hours')`
            ).run();
          })
          .catch((e: unknown) => console.error('[RATE_LIMIT_CLEANUP_ERR]', (e as Error)?.message))
      );
      return false;
    } catch (e: unknown) {
      console.error('[RATE_LIMIT_D1_ERR]', (e as Error)?.message);
      // Rớt xuống caches.default nếu bảng chưa migrate.
    }
  }

  // Fallback cũ: caches.default theo IP/giờ.
  try {
    const key = new Request(`https://rl.internal/v2/chat/${ip}/${windowId}`);
    const hit = await caches.default.match(key);
    const count = hit ? parseInt((await hit.text()) || '0', 10) : 0;
    if (count >= LIMIT_PER_HOUR) return true;
    ctx.waitUntil(
      caches.default.put(key, new Response(String(count + 1), { headers: { 'Cache-Control': 'max-age=3600' } }))
    );
  } catch (e: unknown) {
    console.error('[RATE_LIMIT_CACHE_ERR]', (e as Error)?.message);
  }
  return false;
}
