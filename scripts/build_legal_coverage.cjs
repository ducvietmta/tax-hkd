const fs = require('node:fs');
const path = require('node:path');
const { buildLegalCoverageLedger } = require('./lib/legal_coverage.cjs');
const { buildMarkdownProvisionInventory } = require('./lib/legal_markdown_inventory.cjs');

const ROOT = path.join(__dirname, '..');
const read = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const catalog = read('src/data/legalDocuments.json');
const markdownInventory = buildMarkdownProvisionInventory(catalog, path.join(ROOT, 'document_library'));
fs.writeFileSync(path.join(ROOT, 'rag_data', 'legal-markdown-provision-inventory.json'), `${JSON.stringify(markdownInventory, null, 2)}\n`, 'utf8');
const ledger = buildLegalCoverageLedger(
  catalog,
  read('worker/src/kb/sourceDocuments.json'),
  read('worker/src/kb/chunkMeta.json'),
  read('rag_data/legal-coverage-targets.json'),
  markdownInventory
);
fs.writeFileSync(path.join(ROOT, 'worker/src/kb/legalCoverageLedger.json'), `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
console.log(`Markdown inventory: ${markdownInventory.summary.markdown_documents} documents; article markers=${markdownInventory.summary.with_article_markers}`);
console.log(`legal coverage ledger: ${ledger.summary.normative_documents} documents; FULL=${ledger.summary.FULL}; PARTIAL=${ledger.summary.PARTIAL}; MISSING=${ledger.summary.MISSING}; UNMEASURED=${ledger.summary.UNMEASURED}`);
