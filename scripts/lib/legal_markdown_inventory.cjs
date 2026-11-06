const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ARTICLE = /^\s*(?:#{1,6}\s*)?(?:Điều|Äiá»u)\s+(\d+[a-zđ]?)(?:\s*[.:]|\s|$)/iu;
const CLAUSE = /^\s*(\d+[a-z]?)\.\s+\S/iu;
const POINT = /^\s*([a-zđ])\)\s+\S/iu;

function sortProvisionIds(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true, sensitivity: 'base' }));
}

function extractMarkdownProvisions(markdown) {
  const provisions = [];
  let article = null;
  let clause = null;
  for (const rawLine of String(markdown || '').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const articleMatch = ARTICLE.exec(rawLine);
    if (articleMatch) {
      article = articleMatch[1].toLowerCase();
      clause = null;
      provisions.push(`article:${article}`);
      continue;
    }
    if (!article) continue;
    const clauseMatch = CLAUSE.exec(rawLine);
    if (clauseMatch) {
      clause = clauseMatch[1].toLowerCase();
      provisions.push(`article:${article}/clause:${clause}`);
      continue;
    }
    const pointMatch = POINT.exec(rawLine);
    if (pointMatch && clause) provisions.push(`article:${article}/clause:${clause}/point:${pointMatch[1].toLowerCase()}`);
  }
  return sortProvisionIds(provisions);
}

function buildMarkdownProvisionInventory(catalogDocuments, directory) {
  const catalog = new Map(catalogDocuments.map((doc) => [doc.id, doc]));
  const names = fs.readdirSync(directory).filter((name) => name.endsWith('.md') && name !== 'README.md').sort();
  const documents = names.map((name) => {
    const id = name.slice(0, -3);
    const doc = catalog.get(id);
    if (!doc) throw new Error(`Markdown legal source is absent from catalog: ${id}`);
    const markdown = fs.readFileSync(path.join(directory, name), 'utf8').replace(/^\uFEFF/, '');
    const provisions = extractMarkdownProvisions(markdown);
    return {
      doc_id: id,
      code: doc.code,
      category: doc.category,
      markdown_file: `document_library/${name}`,
      markdown_sha256: crypto.createHash('sha256').update(markdown, 'utf8').digest('hex'),
      extraction_status: provisions.some((id) => id.startsWith('article:')) ? 'MARKDOWN_STRUCTURE_EXTRACTED' : 'NO_ARTICLE_MARKERS',
      article_count: provisions.filter((id) => /^article:[^/]+$/.test(id)).length,
      clause_count: provisions.filter((id) => /\/clause:[^/]+$/.test(id)).length,
      point_count: provisions.filter((id) => /\/point:[^/]+$/.test(id)).length,
      expected_provisions: provisions,
    };
  });
  const missingMarkdown = catalogDocuments.filter((doc) => !names.includes(`${doc.id}.md`)).map((doc) => doc.id);
  return {
    schema: 'taxhkd-markdown-provision-inventory-v1',
    method: 'Deterministic line parser over document_library Markdown; extracted structure is measurable but not by itself an official legal certification.',
    summary: {
      markdown_documents: documents.length,
      catalog_documents: catalogDocuments.length,
      with_article_markers: documents.filter((doc) => doc.article_count > 0).length,
      without_article_markers: documents.filter((doc) => doc.article_count === 0).length,
      missing_markdown_count: missingMarkdown.length,
    },
    missing_markdown: missingMarkdown,
    documents,
  };
}

module.exports = { extractMarkdownProvisions, buildMarkdownProvisionInventory };
