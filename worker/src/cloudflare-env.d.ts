/**
 * Ambient Cloudflare runtime types cho `tsc --noEmit`.
 * Dự án chưa phụ thuộc @cloudflare/workers-types nên khai báo tối thiểu
 * để typecheck worker/ và functions/ mà không cần `any` tràn lan.
 */

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta?: { changes?: number } }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface R2ObjectBody {
  body: ReadableStream;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream | string, options?: Record<string, unknown>): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/** Cloudflare mở rộng CacheStorage với cache mặc định (không có trong DOM lib). */
interface CacheStorage {
  readonly default: Cache;
}

interface PagesFunctionEnv {
  WORKER_ORIGIN?: string;
  [key: string]: unknown;
}

type PagesFunctionHandler = (context: {
  request: Request;
  env: PagesFunctionEnv;
  params: Record<string, string>;
}) => Promise<Response> | Response;

declare const PagesFunction: undefined;
type PagesFunction = PagesFunctionHandler;
