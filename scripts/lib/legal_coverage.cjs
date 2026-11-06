const crypto = require('node:crypto');

const NORMATIVE_CATEGORIES = new Set(['Nghị định', 'Thông tư']);

function normalizeText(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'vi', { numeric: true, sensitivity: 'base' })
  );
}

/**
 * Extract only provision identifiers explicitly present in a locator. This is
 * deliberately conservative: prose such as "quy định về miễn thuế" is not
 * silently promoted to article-level coverage.
 */
function extractProvisionIds(locator) {
  const text = normalizeText(locator);
  if (!text) return [];
  const provisions = [];
  const articlePattern = /Điều\s+(\d+[a-z]?)/giu;
  const clausePattern = /khoản\s+(\d+[a-z]?)\s+(?:của\s+)?Điều\s+(\d+[a-z]?)/giu;
  const pointPattern = /điểm\s+([a-zđ])\s+(?:khoản\s+(\d+[a-z]?)\s+)?(?:của\s+)?Điều\s+(\d+[a-z]?)/giu;

  for (const match of text.matchAll(articlePattern)) provisions.push(`article:${match[1].toLowerCase()}`);
  for (const match of text.matchAll(clausePattern)) provisions.push(`article:${match[2].toLowerCase()}/clause:${match[1].toLowerCase()}`);
  for (const match of text.matchAll(pointPattern)) {
    const clause = match[2] ? `/clause:${match[2].toLowerCase()}` : '';
    provisions.push(`article:${match[3].toLowerCase()}${clause}/point:${match[1].toLowerCase()}`);
  }
  return uniqueSorted(provisions);
}

function assertTargets(catalogDocuments, targets) {
  if (targets?.schema !== 'taxhkd-legal-coverage-targets-v1' || !Array.isArray(targets.documents)) {
    throw new Error('Invalid legal coverage targets schema');
  }
  const normativeIds = catalogDocuments.filter((doc) => NORMATIVE_CATEGORIES.has(doc.category)).map((doc) => doc.id);
  const targetIds = targets.documents.map((doc) => doc.id);
  const duplicates = targetIds.filter((id, index) => targetIds.indexOf(id) !== index);
  const missing = normativeIds.filter((id) => !targetIds.includes(id));
  const stale = targetIds.filter((id) => !normativeIds.includes(id));
  if (duplicates.length || missing.length || stale.length) {
    throw new Error(`Legal coverage targets drift (duplicates=${uniqueSorted(duplicates).join(',') || '-'}; missing=${missing.join(',') || '-'}; stale=${stale.join(',') || '-'})`);
  }
}

function buildLegalCoverageLedger(catalogDocuments, sourceDocuments, chunkMeta, targets, markdownInventory) {
  assertTargets(catalogDocuments, targets);
  const registered = new Set((sourceDocuments.documents || []).map((doc) => doc.id));
  const targetById = new Map(targets.documents.map((target) => [target.id, target]));
  const markdownById = new Map((markdownInventory?.documents || []).map((doc) => [doc.doc_id, doc]));
  const linksByDocument = new Map();

  for (const [refId, meta] of Object.entries(chunkMeta.default || chunkMeta)) {
    for (const link of meta.source_links || []) {
      if (!link.doc_id) continue;
      if (!linksByDocument.has(link.doc_id)) linksByDocument.set(link.doc_id, []);
      linksByDocument.get(link.doc_id).push({ ref_id: refId, locator: normalizeText(link.locator) });
    }
  }

  const documents = catalogDocuments
    .filter((doc) => NORMATIVE_CATEGORIES.has(doc.category))
    .map((doc) => {
      const target = targetById.get(doc.id);
      const markdown = markdownById.get(doc.id);
      const links = linksByDocument.get(doc.id) || [];
      const locators = uniqueSorted(links.map((link) => link.locator));
      const observed = uniqueSorted(locators.flatMap(extractProvisionIds));
      const expected = Array.isArray(target.expected_provisions)
        ? uniqueSorted(target.expected_provisions.map(normalizeText))
        : Array.isArray(markdown?.expected_provisions) && markdown.expected_provisions.length
          ? uniqueSorted(markdown.expected_provisions.map(normalizeText)) : null;
      const inventoryVerified = target.inventory_status === 'VERIFIED_OFFICIAL_INVENTORY';
      const targetChecksumVerified = /^[a-f0-9]{64}$/i.test(target.source_sha256 || '');
      const markdownChecksumVerified = /^[a-f0-9]{64}$/i.test(markdown?.markdown_sha256 || '');
      const checksumVerified = inventoryVerified ? targetChecksumVerified : markdownChecksumVerified;
      const inventoryMeasurable = checksumVerified && expected && expected.length > 0;
      const coveredExpected = inventoryMeasurable ? expected.filter((id) => observed.includes(id)) : [];
      const coverageStatus = !inventoryMeasurable
        ? 'UNMEASURED'
        : inventoryVerified && coveredExpected.length === expected.length
          ? 'FULL'
          : coveredExpected.length > 0 ? 'PARTIAL' : 'MISSING';

      return {
        doc_id: doc.id,
        code: doc.code,
        category: doc.category,
        source_registered: registered.has(doc.id) || markdownChecksumVerified,
        provenance_registry_registered: registered.has(doc.id),
        local_markdown_registered: markdownChecksumVerified,
        linked_chunk_count: new Set(links.map((link) => link.ref_id)).size,
        linked_chunk_refs: uniqueSorted(links.map((link) => link.ref_id)),
        locators,
        observed_provisions: observed,
        expected_provision_count: expected?.length ?? null,
        covered_expected_count: inventoryMeasurable ? coveredExpected.length : null,
        coverage_percent: inventoryMeasurable ? Math.round((coveredExpected.length / expected.length) * 10000) / 100 : null,
        coverage_status: coverageStatus,
        inventory_status: inventoryVerified ? target.inventory_status : markdown?.extraction_status || target.inventory_status,
        inventory_basis: inventoryVerified ? 'VERIFIED_OFFICIAL_INVENTORY' : markdown?.markdown_file || null,
        markdown_structure: markdown ? { articles: markdown.article_count, clauses: markdown.clause_count, points: markdown.point_count } : null,
        source_sha256: checksumVerified ? (inventoryVerified ? target.source_sha256 : markdown.markdown_sha256).toLowerCase() : null,
      };
    })
    .sort((a, b) => a.doc_id.localeCompare(b.doc_id));

  const byStatus = Object.fromEntries(['FULL', 'PARTIAL', 'MISSING', 'UNMEASURED'].map((status) => [status, documents.filter((doc) => doc.coverage_status === status).length]));
  const stablePayload = JSON.stringify(documents);
  return {
    schema: 'taxhkd-legal-coverage-ledger-v1',
    policy: 'FULL requires a verified official provision inventory, a SHA-256 source checksum, and coverage of every expected provision.',
    corpus_complete: documents.length > 0 && documents.every((doc) => doc.coverage_status === 'FULL'),
    summary: {
      normative_documents: documents.length,
      source_registered: documents.filter((doc) => doc.source_registered).length,
      linked_to_reviewed_chunks: documents.filter((doc) => doc.linked_chunk_count > 0).length,
      ...byStatus,
    },
    ledger_sha256: crypto.createHash('sha256').update(stablePayload).digest('hex'),
    documents,
  };
}

module.exports = { NORMATIVE_CATEGORIES, extractProvisionIds, assertTargets, buildLegalCoverageLedger };
