/**
 * kb:check — phát hiện lệch giữa nguồn KB (rag_data export + supplements)
 * và module biên dịch worker/src/ragEngine.ts mà runtime đang dùng.
 * Chạy trong CI trước deploy. Exit 1 kèm chi tiết khi lệch.
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);

// 1. Nguồn: export + supplements, lọc VERIFIED như build_rag_db.js.
const baseDir = path.join(ROOT, 'rag_data', 'rag-kb-export-2026-10-12');
const chunks = fs.readFileSync(path.join(baseDir, 'chunks.jsonl'), 'utf8')
  .split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
chunks.push(...JSON.parse(fs.readFileSync(path.join(ROOT, 'rag_data', 'semantic-topic-supplements.json'), 'utf8')));
const routes = JSON.parse(fs.readFileSync(path.join(baseDir, 'query-map.json'), 'utf8')).routes || [];
const srcChunks = chunks.filter((c) => ['VERIFIED', 'VERIFIED_CONDITIONAL'].includes(c.tier));

// 2. Biên dịch: worker/src/ragEngine.ts (không import ngoài).
const rgSrc = fs.readFileSync(path.join(ROOT, 'worker', 'src', 'ragEngine.ts'), 'utf8');
const js = ts.transpileModule(rgSrc, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', js)(mod, mod.exports);
const { CANONICAL_CHUNKS, QUERY_ROUTES } = mod.exports;

const errors = [];
if (CANONICAL_CHUNKS.length !== srcChunks.length) {
  errors.push(`chunk count: compiled=${CANONICAL_CHUNKS.length} source=${srcChunks.length}`);
}
const srcByRef = new Map(srcChunks.map((c) => [c.ref_id || c.id, sha(c.text)]));
const comByRef = new Map(CANONICAL_CHUNKS.map((c) => [c.ref_id || c.id, sha(c.text)]));
for (const [ref, h] of srcByRef) {
  if (!comByRef.has(ref)) errors.push(`missing compiled chunk: ${ref}`);
  else if (comByRef.get(ref) !== h) errors.push(`text drift: ${ref}`);
}
for (const ref of comByRef.keys()) {
  if (!srcByRef.has(ref)) errors.push(`stale compiled chunk (không còn trong export): ${ref}`);
}
if (QUERY_ROUTES.length !== routes.length) {
  errors.push(`route count: compiled=${QUERY_ROUTES.length} source=${routes.length}`);
} else {
  const srcRoutes = new Map(routes.map((r) => [r.id, (r.refs || []).join(',')]));
  for (const r of QUERY_ROUTES) {
    if (!srcRoutes.has(r.id)) errors.push(`stale compiled route: ${r.id}`);
    else if (srcRoutes.get(r.id) !== (r.refs || []).join(',')) errors.push(`route refs drift: ${r.id}`);
  }
}
// 3. chunkMeta phải bao phủ mọi ref đang phục vụ evidence gate.
const metaRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'worker', 'src', 'kb', 'chunkMeta.json'), 'utf8'));
const meta = metaRaw.default || metaRaw;
const policyIndex=JSON.parse(fs.readFileSync(path.join(ROOT,'worker/src/kb/policyRetrievalIndex.json'),'utf8'));
const expectedPolicyIndex=srcChunks.filter(c=>c.ref_id&&c.retrieval_facets).map(c=>({ref_id:c.ref_id,...c.retrieval_facets,
  applies_from_year:meta[c.ref_id]?.applies_from_year,applies_to_year:meta[c.ref_id]?.applies_to_year??null}));
if(JSON.stringify(policyIndex)!==JSON.stringify(expectedPolicyIndex))errors.push('policy retrieval index differs from source facets/period metadata');
for(const c of srcChunks){const compiled=CANONICAL_CHUNKS.find(row=>row.id===c.id);
  if(JSON.stringify(compiled?.retrieval_facets)!==JSON.stringify(c.retrieval_facets))errors.push(`retrieval facets drift: ${c.ref_id}`);
  if(JSON.stringify(compiled?.subject_scope)!==JSON.stringify(c.subject_scope))errors.push(`subject scope drift: ${c.ref_id}`);
  if(compiled?.context_passage!==c.context_passage)errors.push(`context excerpt drift: ${c.ref_id}`);
  if(JSON.stringify(compiled?.context_passage_period)!==JSON.stringify(c.context_passage_period))errors.push(`context excerpt period drift: ${c.ref_id}`);
  if(c.context_passage&&!c.text.includes(c.context_passage))errors.push(`context excerpt not part of canonical source: ${c.ref_id}`);
}
for (const c of CANONICAL_CHUNKS) {
  const key = c.ref_id || c.id;
  if (!meta[key]) errors.push(`chunkMeta thiếu: ${key}`);
}

if (errors.length) {
  console.error('KB DRIFT:\n- ' + errors.join('\n- '));
  console.error('\nChạy `npm run kb:build` để tái sinh worker/src/ragEngine.ts rồi commit.');
  process.exit(1);
}
console.log(`kb:check OK — ${CANONICAL_CHUNKS.length} chunks, ${QUERY_ROUTES.length} routes, meta phủ đủ.`);
