/**
 * Dense retrieval OPT-IN qua Vectorize + Workers AI (mặc định TẮT).
 * Bật khi KB vượt vài trăm chunk hoặc cần bắt paraphrase mà BM25 trượt:
 *   1. Tạo index trên dashboard (dimension 1024, metric cosine).
 *   2. Chạy `node scripts/backfill_vectorize.mjs` để nạp vectors.
 *   3. Mở binding trong worker/wrangler.toml + đặt VECTORIZE_ENABLED=1.
 *
 * Thiết kế an toàn: mọi lỗi → null (rớt về BM25). mergeVectorHits CHỈ
 * thêm chunk còn thiếu vào cuối, không bao giờ xáo trộn thứ tự BM25/pin.
 */

import { getChunksByRefs, type RagChunk } from './ragEngine';
import type { Env } from './http';

export interface VectorHit {
  refId: string;
  score: number;
}

/** null khi tắt / chưa cấu hình / lỗi — caller rớt về BM25 thuần. */
export async function vectorSearch(query: string, env: Env, topK = 6): Promise<VectorHit[] | null> {
  try {
    if (env.VECTORIZE_ENABLED !== '1' || !env.VECTORIZE || !env.AI) return null;
    const text = query.slice(0, 1500).trim();
    if (!text) return null;
    const embedding: unknown = await env.AI.run('@cf/baai/bge-m3', { text: [text] });
    const vector = (embedding as { data?: number[][] })?.data?.[0];
    if (!Array.isArray(vector) || !vector.length) return null;
    const res = await env.VECTORIZE.query(vector, { topK });
    const matches = (res as { matches?: Array<{ id?: string; score?: number }> })?.matches || [];
    const hits: VectorHit[] = [];
    for (const m of matches) {
      if (typeof m.id === 'string' && typeof m.score === 'number' && m.score >= 0.45) {
        hits.push({ refId: m.id, score: m.score });
      }
    }
    return hits.length ? hits : null;
  } catch (e: unknown) {
    console.warn('[VECTOR_SEARCH_ERR]', (e as Error)?.message);
    return null;
  }
}

export interface ScoredChunk {
  chunk: RagChunk;
  score: number;
  viaRoute: boolean;
}

/** Thêm chunk vector còn thiếu vào cuối danh sách, giữ nguyên thứ tự cũ. */
export function mergeVectorHits(results: ScoredChunk[], hits: VectorHit[], cap: number): ScoredChunk[] {
  const seen = new Set(results.map((r) => r.chunk.ref_id));
  const merged = [...results];
  for (const hit of hits) {
    if (merged.length >= cap) break;
    if (!hit.refId || seen.has(hit.refId)) continue;
    const chunk = getChunksByRefs([hit.refId])[0];
    if (!chunk) continue;
    seen.add(hit.refId);
    merged.push({ chunk, score: hit.score, viaRoute: false });
  }
  return merged;
}
