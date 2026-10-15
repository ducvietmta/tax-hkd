import fs from 'fs';
import path from 'path';
import readline from 'readline';

const baseDir = path.resolve('rag_data/rag-kb-export-2026-10-12');
const chunksPath = path.join(baseDir, 'chunks.jsonl');
const queryMapPath = path.join(baseDir, 'query-map.json');

async function main() {
  console.log('🚀 Đang đọc RAG Knowledge Export...');

  // 1. Phân tích chunks.jsonl
  const rl = readline.createInterface({
    input: fs.createReadStream(chunksPath, { encoding: 'utf8' }),
  });

  const chunks = [];
  const tierCounts = {};

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const chunk = JSON.parse(line);
      chunks.push(chunk);
      tierCounts[chunk.tier] = (tierCounts[chunk.tier] || 0) + 1;
    } catch (e) {
      console.error('Lỗi parse dòng chunk:', e.message);
    }
  }

  const supplementsPath = path.resolve('rag_data/semantic-topic-supplements.json');
  if (fs.existsSync(supplementsPath)) chunks.push(...JSON.parse(fs.readFileSync(supplementsPath, 'utf8')));
  console.log(`✅ Đã đọc thành công ${chunks.length} chunks.`);
  console.log('📊 Thống kê Tier:', tierCounts);

  // 2. Phân tích query-map.json
  const queryMapRaw = fs.readFileSync(queryMapPath, 'utf8');
  const queryMapData = JSON.parse(queryMapRaw);
  const routes = queryMapData.routes || [];
  console.log(`✅ Đã đọc ${routes.length} canonical routes từ query-map.json.`);

  // 3. Tạo file D1 Schema: d1/rag_schema.sql
  const schemaSql = `
-- ====================================================================
-- CLOUDFLARE D1 RAG SCHEMA - HỆ THỐNG KHO TRI THỨC THUẾ 2026
-- ====================================================================

CREATE TABLE IF NOT EXISTS rag_chunks (
    id TEXT PRIMARY KEY,
    file TEXT NOT NULL,
    section TEXT,
    ref_id TEXT,
    tier TEXT NOT NULL,
    text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_ref ON rag_chunks(ref_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_tier ON rag_chunks(tier);

CREATE TABLE IF NOT EXISTS rag_query_map (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL,
    any_keywords TEXT NOT NULL,      -- JSON array
    context_keywords TEXT,          -- JSON array
    refs TEXT NOT NULL,              -- JSON array
    priority INTEGER NOT NULL DEFAULT 50
);

CREATE INDEX IF NOT EXISTS idx_rag_query_priority ON rag_query_map(priority);
`;

  fs.writeFileSync('d1/rag_schema.sql', schemaSql.trim(), 'utf8');
  console.log('💾 Đã ghi file schema: d1/rag_schema.sql');

  // 4. Sinh file SQL import data (chia batch để D1 execute an toàn)
  function escapeSql(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
  }

  let sqlStatements = [];
  sqlStatements.push('-- Nạp dữ liệu query map');
  for (let i = 0; i < routes.length; i++) {
    const r = routes[i];
    const anyJson = JSON.stringify(r.any || []);
    const ctxJson = r.context_any ? JSON.stringify(r.context_any) : 'NULL';
    const refsJson = JSON.stringify(r.refs || []);
    const prio = r.priority || 50;

    sqlStatements.push(
      `INSERT OR REPLACE INTO rag_query_map (id, route_id, any_keywords, context_keywords, refs, priority) VALUES (${escapeSql(r.id || `route_${i}`)}, ${escapeSql(r.id)}, ${escapeSql(anyJson)}, ${ctxJson === 'NULL' ? 'NULL' : escapeSql(ctxJson)}, ${escapeSql(refsJson)}, ${prio});`
    );
  }

  sqlStatements.push('\n-- Nạp chunks tri thức');
  for (const c of chunks) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO rag_chunks (id, file, section, ref_id, tier, text) VALUES (${escapeSql(c.id)}, ${escapeSql(c.file)}, ${escapeSql(c.section)}, ${escapeSql(c.ref_id)}, ${escapeSql(c.tier)}, ${escapeSql(c.text)});`
    );
  }

  const fullSql = sqlStatements.join('\n');
  fs.writeFileSync('d1/rag_data.sql', fullSql, 'utf8');
  console.log(`💾 Đã xuất file d1/rag_data.sql (${(fullSql.length / (1024 * 1024)).toFixed(2)} MB, ${sqlStatements.length} câu lệnh SQL)`);

  // 5. Tạo RAG Compiled Module cho Cloudflare Workers (Fast In-Memory Retrieval)
  // CONTROL là chỉ dẫn điều phối, không được dùng làm bằng chứng trả lời.
  const verifiedChunks = chunks.filter((c) =>
    ['VERIFIED', 'VERIFIED_CONDITIONAL'].includes(c.tier)
  );

  console.log(`📦 Đóng gói ${verifiedChunks.length} verified canonical chunks và routes cho Cloudflare Worker...`);

  const compiledCode = `/**
 * RAG KNOWLEDGE BASE ENGINE (Compiled for Cloudflare Workers Edge)
 * Generated at: ${new Date().toISOString()}
 * Chunks: ${verifiedChunks.length} verified | Routes: ${routes.length}
 */

export interface RagChunk {
  id: string;
  file: string;
  section: string;
  ref_id: string | null;
  tier: string;
  text: string;
}

export interface QueryRoute {
  id: string;
  any: string[];
  context_any?: string[];
  expand?: string[];
  not?: string[];
  refs: string[];
  priority: number;
}

export const QUERY_ROUTES: QueryRoute[] = ${JSON.stringify(routes, null, 2)};

export const CANONICAL_CHUNKS: RagChunk[] = ${JSON.stringify(verifiedChunks, null, 2)};

/**
 * 1. Định tuyến nhanh qua Query Map
 */
export function matchRoute(query: string): QueryRoute | null {
  const q = query.toLowerCase();
  let bestRoute: QueryRoute | null = null;
  let highestPriority = -1;

  for (const route of QUERY_ROUTES) {
    const hasAny = route.any.some((kw) => q.includes(kw.toLowerCase()));
    if (!hasAny) continue;

    if (route.context_any && route.context_any.length > 0) {
      const hasContext = route.context_any.some((kw) => q.includes(kw.toLowerCase()));
      if (!hasContext) continue;
    }

    if (route.priority > highestPriority) {
      highestPriority = route.priority;
      bestRoute = route;
    }
  }

  return bestRoute;
}

/**
 * 2. Tìm chunks theo Canonical ref_id
 */
export function getChunksByRefs(refs: string[]): RagChunk[] {
  const set = new Set(refs);
  return CANONICAL_CHUNKS.filter((c) => c.ref_id && set.has(c.ref_id));
}

/**
 * 3. Tìm kiếm từ khóa ngữ nghĩa trong tập Verified Chunks
 */
export function searchKnowledgeBase(query: string, limit = 4): RagChunk[] {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\\s]/gi, ' ')
    .split(/\\s+/)
    .filter((w) => w.length >= 2);

  if (words.length === 0) return [];

  const scored = CANONICAL_CHUNKS.map((chunk) => {
    const textLower = chunk.text.toLowerCase();
    const sectionLower = (chunk.section || '').toLowerCase();
    let score = 0;

    for (const w of words) {
      if (sectionLower.includes(w)) score += 5; // Trọng số cao nếu khớp tiêu đề
      if (textLower.includes(w)) score += 1;
    }

    // Ưu tiên cao hơn cho VERIFIED so với VERIFIED_CONDITIONAL
    if (chunk.tier === 'VERIFIED') score *= 1.2;

    return { chunk, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.chunk);
}
`;

  fs.writeFileSync('worker/src/ragEngine.ts', compiledCode, 'utf8');
  console.log('✅ Đã tạo engine RAG Cloudflare Worker: worker/src/ragEngine.ts');
}

main().catch(console.error);
