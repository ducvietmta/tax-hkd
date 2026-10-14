/**
 * RETRIEVAL PLAN GENERATOR
 *
 * Xây dựng kế hoạch truy xuất cho RAG dựa trên TaxDecisionFrame,
 * thay thế các đoạn ghim mã ref_id thủ công rải rác trong code.
 */

import type { TaxDecisionFrame, RetrievalPlan } from './types';

export function buildRetrievalPlan(frame: TaxDecisionFrame): RetrievalPlan {
  const mustIncludeRefs: string[] = [];
  const boostKeywords: string[] = [];
  const years = frame.tax_period.years;
  const isHistorical = frame.tax_period.is_historical;

  if (!isHistorical && (frame.tax_intent.primary.value === 'TAX_CALCULATION' ||
      frame.tax_intent.primary.value === 'RELIEF_REDUCTION')) {
    mustIncludeRefs.push('16.77');
  }

  // 1. Ghim các ref bắt buộc theo quy định thời kỳ
  if (isHistorical || years.includes(2025)) {
    mustIncludeRefs.push('16.54'); // Ngưỡng 100tr TT40
  }

  // 2. Doanh thu trên 3 tỷ (phương pháp 17%)
  if (frame.facts.revenue_vnd && frame.facts.revenue_vnd > 3_000_000_000) {
    mustIncludeRefs.push('16.99');
    if (frame.income_type.some(item => item.value === 'MARKETPLACE_SALES')) mustIncludeRefs.push('16.57');
  }

  // 3. Ưu đãi giảm thuế (NQ 43 / NQ 204)
  if (
    frame.tax_intent.primary.value === 'RELIEF_REDUCTION' ||
    frame.tax_intent.secondary.includes('RELIEF_REDUCTION') ||
    frame.facts.vat_relief_assumed
  ) {
    mustIncludeRefs.push('16.99', '16.50');
  }

  // 4. Hóa đơn điện tử máy tính tiền / hạn 30 ngày
  if (frame.tax_intent.primary.value === 'E_INVOICE' || frame.tax_intent.secondary.includes('E_INVOICE')) {
    mustIncludeRefs.push('16.41');
  }

  // 5. Mã số thuế 888
  if (frame.tax_intent.primary.value === 'TAX_ID_888') {
    mustIncludeRefs.push('16.96', '16.100');
  }

  // 6. Keywords bổ trợ
  if (frame.income_type.some((t) => t.value === 'MARKETPLACE_SALES')) {
    boostKeywords.push('sàn thương mại điện tử', 'khấu trừ nộp thay');
  }
  if (frame.income_type.some((t) => t.value === 'AFFILIATE_COMMISSION')) {
    boostKeywords.push('tiếp thị liên kết', 'hoa hồng đại lý');
  }

  return {
    strategy: mustIncludeRefs.length > 0 ? 'PINNED_REFS' : 'ROUTE_FIRST',
    must_include_refs: [...new Set(mustIncludeRefs)],
    filter_years: years,
    filter_taxpayer_types: [frame.taxpayer_type.value],
    boost_keywords: boostKeywords,
  };
}
