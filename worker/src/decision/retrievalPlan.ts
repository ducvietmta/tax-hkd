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
  const topic = frame.semantic?.topic;
  if (topic === 'INVOICE_CORRECTION' && frame.semantic?.invoicePeriod === 'H1_2026' && years.length === 1 && years[0] === 2026) {
    return { strategy:'PINNED_REFS',semantic_topic:topic,allowed_refs:['16.106'],must_include_refs:['16.106'],filter_years:years,
      filter_taxpayer_types:[frame.taxpayer_type.value],boost_keywords:[] };
  }
  // A transaction amount cannot establish annual thresholds. Supply the
  // method/base distinction even when the semantic topic is broader.
  if (topic === 'TAX_AMOUNT' && frame.semantic?.revenueContext === 'TRANSACTION') {
    return { strategy: 'PINNED_REFS', semantic_topic: 'VAT_METHOD_CLASSIFICATION',
      allowed_refs: ['16.104', '16.77', '16.31', '16.50'],
      must_include_refs: ['16.104', '16.77'], filter_years: years,
      filter_taxpayer_types: [frame.taxpayer_type.value], boost_keywords: [] };
  }
  const topicEvidence: Record<string, string[]> = {
    REVENUE_COMPOSITION: ['16.32', '16.37', '16.72', '16.101', '16.102'],
    REVENUE_TIMING: ['16.101', '16.30', '16.37', '16.72', '16.43', '16.102'],
    REVENUE_OWNERSHIP: ['16.75', '16.72', '16.8', '16.7', '16.9', '16.35', '16.37', '16.41', '16.105'],
    VAT_METHOD_CLASSIFICATION: ['16.104', '16.31', '16.50', '16.77', '16.16', '16.37'],
    BUSINESS_EXPENSES: ['16.102', '16.19', '16.52', '16.57', '16.56'],
    INVOICE_CORRECTION: ['16.106', '16.103', '16.21', '16.18', '16.17', '16.42'],
    INVOICE_REGISTRATION: ['16.41', '16.105', '16.38', '16.58', '16.79', '16.24'],
    BUSINESS_REGISTRATION: ['16.107', '16.73', '16.20', '16.7', '16.8'],
    REVENUE_THRESHOLD: ['16.60', '16.72', '16.44', '16.23', '16.53', '16.41', '16.105', '16.38'],
  };
  if (topic && topicEvidence[topic]) {
    const refs = [...topicEvidence[topic]];
    // Topic and intent are complementary, not mutually exclusive routes.
    // Keep the relief rule ahead of ownership evidence for per-person limits.
    const relief = frame.tax_intent.primary.value === 'RELIEF_REDUCTION' || frame.tax_intent.secondary.includes('RELIEF_REDUCTION');
    if (!isHistorical && relief && ['REVENUE_OWNERSHIP', 'REVENUE_THRESHOLD'].includes(topic)) refs.unshift('16.39');
    if (topic === 'REVENUE_THRESHOLD' && frame.semantic?.revenueContext === 'PARTIAL_PERIOD') refs.unshift('16.101');
    if (topic === 'REVENUE_TIMING' && frame.income_type.some(x => x.value === 'WAGE_SALARY')) refs.push('16.93');
    return { strategy: 'PINNED_REFS', semantic_topic: topic, allowed_refs: refs,
      must_include_refs: refs.slice(0, topic === 'VAT_METHOD_CLASSIFICATION' || relief ? 3 : 2), filter_years: years,
      filter_taxpayer_types: [frame.taxpayer_type.value], boost_keywords: [] };
  }

  if (!isHistorical && (frame.tax_intent.primary.value === 'TAX_CALCULATION' ||
      frame.tax_intent.primary.value === 'RELIEF_REDUCTION')) {
    mustIncludeRefs.push('16.77');
    if (frame.facts.revenue_vnd && frame.facts.revenue_vnd > 1_000_000_000 && frame.facts.revenue_vnd <= 3_000_000_000) {
      mustIncludeRefs.push('16.56');
    }
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
