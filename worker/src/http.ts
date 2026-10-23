/**
 * HTTP helpers dùng chung cho Worker router và các route modules.
 * Tách khỏi index.ts để god-handler chỉ còn điều phối.
 */

export interface Env {
  DB: D1Database;
  STORAGE_BUCKET: R2Bucket;
  AI?: { run: (model: string, input: unknown) => Promise<{ response?: string; data?: number[][]; shape?: number[] }> };
  /** Bật dense retrieval khi đã nạp Vectorize index. Mặc định tắt. */
  VECTORIZE_ENABLED?: string;
  VECTORIZE?: {
    query(vector: number[], opts?: { topK?: number }): Promise<{ matches: Array<{ id: string; score: number }> }>;
    upsert(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, string> }>): Promise<unknown>;
  };
  ENVIRONMENT?: string;
  CORS_ALLOW_ORIGIN?: string;
  MUSE_API_KEY?: string;
  MUSE_MODEL?: string;
  JEV_API_KEY?: string;
  FPT_AI_KEY?: string;
  DECISION_ENDPOINT?: string;
  DECISION_MODEL?: string;
  DECISION_MODE?: string;
  DECISION_L2?: string;
  VIP_PHONE?: string;
  VIP_CREDITS?: string;
  SEPAY_API_KEY?: string;
  SEPAY_PATTERN?: string;
}

export function handleCors(request: Request, env: Env): Headers {
  const headers = new Headers();
  const origin = request.headers.get('Origin');
  const configuredOrigin = env.CORS_ALLOW_ORIGIN || '*';

  if (configuredOrigin === '*') {
    headers.set('Access-Control-Allow-Origin', '*');
  } else if (origin) {
    try {
      const host = new URL(origin).hostname;
      if (
        host === 'tax-hkd.pages.dev' ||
        host.endsWith('.tax-hkd.pages.dev') ||
        host === 'thuehkd.com' ||
        host.endsWith('.thuehkd.com') ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        origin === configuredOrigin
      ) {
        headers.set('Access-Control-Allow-Origin', origin);
      } else {
        headers.set('Access-Control-Allow-Origin', configuredOrigin);
      }
    } catch {
      headers.set('Access-Control-Allow-Origin', configuredOrigin);
    }
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

export function jsonResponse(data: unknown, status = 200, corsHeaders?: Headers): Response {
  const headers = corsHeaders ? new Headers(corsHeaders) : new Headers();
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { status, headers });
}
