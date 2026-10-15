const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../worker/src/ragEngine.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleRef = { exports: {} };
new Function('module', 'exports', compiled)(moduleRef, moduleRef.exports);
const chunks = moduleRef.exports.CANONICAL_CHUNKS;
const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, '../worker/src/kb/chunkMeta.json'), 'utf8'));
const validStatuses = new Set(['VERIFIED', 'VERIFIED_CONDITIONAL', 'PENDING', 'SUPERSEDED', 'EXPIRED', 'NOT_YET_EFFECTIVE']);

for (const chunk of chunks) {
  const key = chunk.ref_id || chunk.id;
  const meta = metadata[key];
  assert.ok(meta, `Missing metadata for ${key}`);
  assert.equal(meta.id, chunk.id, `Metadata points to another chunk: ${key}`);
  assert.ok(validStatuses.has(meta.legal_status), `Unknown legal status: ${key}`);
  assert.ok(Number.isInteger(meta.applies_from_year), `Missing effective year: ${key}`);
  assert.ok(meta.applies_to_year === null || meta.applies_to_year >= meta.applies_from_year,
    `Invalid effective interval: ${key}`);
  if (/2026/.test(chunk.section) && !/2022.?2025/.test(chunk.section)) {
    assert.ok(meta.applies_to_year === null || meta.applies_to_year >= 2026,
      `A chunk explicitly covering 2026 must not be filtered out for 2026: ${key}`);
  }
}
assert.deepEqual([metadata['16.50'].applies_from_year, metadata['16.50'].applies_to_year], [2025, 2026],
  'NQ204 applies across 2025–2026, not only historical years');
assert.equal(metadata['16.54'].applies_to_year, 2025, 'Historical threshold must remain historical');
console.log(`Chunk metadata coverage and effective dates passed (${chunks.length}/${chunks.length}).`);
