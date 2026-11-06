const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildLegalCoverageLedger, extractProvisionIds } = require('./lib/legal_coverage.cjs');
const { buildMarkdownProvisionInventory, extractMarkdownProvisions } = require('./lib/legal_markdown_inventory.cjs');

const ROOT = path.join(__dirname, '..');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
assert.deepEqual(
  extractProvisionIds('Điểm a khoản 2 Điều 5; khoản 3 Điều 7; Điều 9'),
  ['article:5', 'article:5/clause:2', 'article:5/clause:2/point:a', 'article:7', 'article:7/clause:3', 'article:9']
);
assert.deepEqual(extractMarkdownProvisions('Điều 5. Tên\n1. Nội dung\na) Chi tiết'), ['article:5', 'article:5/clause:1', 'article:5/clause:1/point:a']);
const catalog = read('src/data/legalDocuments.json');
const markdownInventory = buildMarkdownProvisionInventory(catalog, path.join(ROOT, 'document_library'));
assert.deepEqual(read('rag_data/legal-markdown-provision-inventory.json'), markdownInventory, 'Markdown inventory is stale; run npm run kb:coverage');
assert.equal(markdownInventory.summary.markdown_documents, catalog.length);
assert.equal(markdownInventory.summary.missing_markdown_count, 0);
const expected = buildLegalCoverageLedger(
  catalog,
  read('worker/src/kb/sourceDocuments.json'),
  read('worker/src/kb/chunkMeta.json'),
  read('rag_data/legal-coverage-targets.json'),
  markdownInventory
);
const saved = read('worker/src/kb/legalCoverageLedger.json');
assert.deepEqual(saved, expected, 'legalCoverageLedger.json is stale; run npm run kb:coverage');
assert.equal(saved.summary.normative_documents, catalog.filter(doc=>['Nghị định','Thông tư'].includes(doc.category)).length);
assert.equal(saved.corpus_complete, saved.summary.FULL === saved.summary.normative_documents);
for (const doc of saved.documents) {
  if (doc.coverage_status === 'FULL') {
    assert.ok(doc.expected_provision_count > 0, `${doc.doc_id} cannot be FULL without an inventory`);
    assert.equal(doc.covered_expected_count, doc.expected_provision_count);
    assert.match(doc.source_sha256, /^[a-f0-9]{64}$/);
  }
}
console.log(`legal coverage check OK — ${markdownInventory.summary.markdown_documents} Markdown documents; ${saved.summary.normative_documents} normative documents; FULL=${saved.summary.FULL}; PARTIAL=${saved.summary.PARTIAL}; MISSING=${saved.summary.MISSING}; UNMEASURED=${saved.summary.UNMEASURED}`);
