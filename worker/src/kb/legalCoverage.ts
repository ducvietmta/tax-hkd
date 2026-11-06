import ledger from './legalCoverageLedger.json';

export type LegalCoverageStatus = 'FULL' | 'PARTIAL' | 'MISSING' | 'UNMEASURED';

export function legalCoverageSummary() {
  return {
    corpus_complete: ledger.corpus_complete,
    ledger_sha256: ledger.ledger_sha256,
    ...ledger.summary,
  };
}

export function legalCoverageDocuments() {
  return ledger.documents.map((doc) => ({
    doc_id: doc.doc_id,
    code: doc.code,
    category: doc.category,
    coverage_status: doc.coverage_status as LegalCoverageStatus,
    coverage_percent: doc.coverage_percent,
    source_registered: doc.source_registered,
    provenance_registry_registered: doc.provenance_registry_registered,
    local_markdown_registered: doc.local_markdown_registered,
    linked_chunk_count: doc.linked_chunk_count,
    observed_provision_count: doc.observed_provisions.length,
    expected_provision_count: doc.expected_provision_count,
  }));
}

export function legalCorpusGuardInstruction(): string {
  if (ledger.corpus_complete) {
    return '[KIỂM KÊ KHO PHÁP LÝ] Danh mục Nghị định/Thông tư đã đạt kiểm kê đầy đủ theo manifest và checksum nguồn.';
  }
  const measured = ledger.summary.FULL + ledger.summary.PARTIAL + ledger.summary.MISSING;
  return `[KIỂM KÊ KHO PHÁP LÝ] Kho hiện chưa được chứng nhận bao phủ toàn bộ Nghị định/Thông tư (${ledger.summary.FULL}/${ledger.summary.normative_documents} văn bản đạt FULL; ${measured} văn bản có mẫu số kiểm kê). Không được nói đã rà soát hoặc có đủ mọi điều, khoản, điểm. Chỉ kết luận trong phạm vi bằng chứng của lượt này; nếu người dùng yêu cầu kiểm tra toàn bộ, phải nêu giới hạn kho và văn bản/phần còn cần đối chiếu.`;
}
