/**
 * Quan trắc retrieval: ghi route miss / fallback / cache hit để tìm lỗ hổng
 * coverage của KB. Chỉ lưu diagnostics (route, số lượng, kỳ) — KHÔNG lưu
 * nội dung câu hỏi hay SĐT. Best-effort, không bao giờ làm hỏng request.
 */

import type { Env } from './http';

export interface RetrievalStat {
  transport: 'web' | 'mcp' | 'chatgpt';
  routeId: string | null;
  usedFallback: boolean;
  cacheHit: boolean;
  hasPlan: boolean;
  resultCount: number;
  years: number[];
}

export function logRetrieval(env: Env, ctx: ExecutionContext, stat: RetrievalStat): void {
  if (!env.DB) return;
  try {
    ctx.waitUntil(
      env.DB.prepare(
        `INSERT INTO retrieval_stats (transport, route_id, used_fallback, cache_hit, has_plan, result_count, years)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        stat.transport,
        stat.routeId,
        stat.usedFallback ? 1 : 0,
        stat.cacheHit ? 1 : 0,
        stat.hasPlan ? 1 : 0,
        stat.resultCount,
        stat.years.join(','),
      ).run().catch((e: unknown) => console.error('[RETRIEVAL_STATS_ERR]', (e as Error)?.message))
    );
  } catch (e: unknown) {
    console.error('[RETRIEVAL_STATS_ERR]', (e as Error)?.message);
  }
}
