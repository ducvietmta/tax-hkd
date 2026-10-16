/**
 * RETRIEVAL PLAN GENERATOR
 *
 * Xây dựng kế hoạch truy xuất cho RAG dựa trên TaxDecisionFrame,
 * thay thế các đoạn ghim mã ref_id thủ công rải rác trong code.
 * legacyPinRefs: single source of truth cho các quy tắc ghim dự phòng
 * của đường legacy (không có decision plan). retriever.ts chỉ áp dụng
 * theo đúng thứ tự này, không định nghĩa lại regex/ref ở nơi khác.
 * Module này KHÔNG import runtime (giữ tương thích test harness stub).
 */

import type { TaxDecisionFrame, RetrievalPlan } from './types';

function foldLegacy(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9%\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Một ref được ghim lên đầu, giữ nguyên bonus điểm như logic cũ. */
export interface LegacyPin {
  ref: string;
  bonus: number;
}

/**
 * Thứ tự ghim legacy (front-to-back) cho câu hỏi không có decision frame.
 * Tái hiện chính xác thứ tự unshift cũ trong retriever: 16.77, 16.99,
 * 16.100, 16.96, 16.60, 16.95, 16.51, 16.54 (chỉ các ref đủ điều kiện).
 */
export function legacyPinRefs(query: string, scope: { years: number[]; today: string }): LegacyPin[] {
  const normalizedQuery = foldLegacy(query);
  const currentYear = Number(String(scope.today).slice(0, 4)) || new Date().getFullYear();
  const asksCurrentYear = scope.years.includes(currentYear);
  const historicalOnly = scope.years.length > 0 && scope.years.every((year) => year < 2026);
  const asksAboutAffiliate = /\b(affiliate|tiep thi lien ket|hoa hong|koc|kol)\b/.test(normalizedQuery);
  const asksRefund = /\b(hoan thue|nop thua|lay lai tien thue)\b/.test(normalizedQuery) ||
    (/\bthue\b/.test(normalizedQuery) && /\b(hoan lai|hoan tien|lay lai)\b/.test(normalizedQuery));

  const asks888Registration =
    /dang ky.*888|888.*(nhu the nao|cach|huong dan|thu tuc|lam sao)|(da co mst 10 so|co can dang ky 888)/.test(normalizedQuery);
  const asksPercentageRate = /bao nhieu\s*(phan tram|%)/.test(normalizedQuery) ||
    (/\b(thue suat|ty le)\b/.test(normalizedQuery) && /\b(bao nhieu|may %)\b/.test(normalizedQuery));
  const mentionsSector = /\b(hang hoa|tap hoa|dich vu|an uong|van tai|xay dung|phan phoi|cat toc|spa|nha hang|quan an|ca phe)\b/.test(normalizedQuery);
  const asksTaxCalculation2026 =
    !historicalOnly &&
    (/\b(1[,.]01\s*ty|1010\s*trieu|1[,.]5\s*ty|1500\s*trieu|1[.]000[.]000[.]001|tinh thue|nop thue|phai nop|nq43|30%)\b/.test(normalizedQuery) ||
      (asksPercentageRate && mentionsSector) ||
      (normalizedQuery.includes('doanh thu') && /\b(ty|trieu)\b/.test(normalizedQuery)));

  const pins: LegacyPin[] = [];
  if (asksPercentageRate && mentionsSector) pins.push({ ref: '16.77', bonus: 2 });
  if (asksTaxCalculation2026) pins.push({ ref: '16.99', bonus: 1.2 });
  if (asks888Registration) pins.push({ ref: '16.100', bonus: 3 });
  if (!historicalOnly && (/\b888\b/.test(normalizedQuery) ||
      (asksAboutAffiliate && /\b(1 ty|mot ty)\b/.test(normalizedQuery)))) pins.push({ ref: '16.96', bonus: 2 });
  if (asksCurrentYear && (
      (normalizedQuery.includes('doanh thu') && /\b(nop thue|mien thue|gtgt|tncn)\b/.test(normalizedQuery)) ||
      (asksRefund && asksAboutAffiliate && /\b\d+\s*(trieu|ty)\b/.test(normalizedQuery))
    )) pins.push({ ref: '16.60', bonus: 1 });
  if (asksAboutAffiliate && !historicalOnly) pins.push({ ref: '16.95', bonus: 1 });
  if (asksRefund) pins.push({ ref: '16.51', bonus: 1 });
  if (historicalOnly && /\bdoanh thu\b/.test(normalizedQuery)) pins.push({ ref: '16.54', bonus: 1 });
  return pins;
}

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
    // Câu hỏi đăng ký không liên quan affiliate: ưu tiên 16.7 (một cá nhân
    // một HKD) và 16.8 (mỗi người một HKD) ở vị trí ghim thay vì chunk
    // affiliate 16.73 gây nhiễu.
    if (topic === 'BUSINESS_REGISTRATION' && !frame.income_type.some((t) =>
        t.value === 'AFFILIATE_COMMISSION' || t.value === 'CONTENT_ADS')) {
      const i7 = refs.indexOf('16.7');
      if (i7 > 1) { refs.splice(i7, 1); refs.splice(1, 0, '16.7'); }
      const i8 = refs.indexOf('16.8');
      if (i8 > 2) { refs.splice(i8, 1); refs.splice(2, 0, '16.8'); }
    }
    // Topic and intent are complementary, not mutually exclusive routes.
    // Keep the relief rule ahead of ownership evidence for per-person limits.
    const relief = frame.tax_intent.primary.value === 'RELIEF_REDUCTION' || frame.tax_intent.secondary.includes('RELIEF_REDUCTION');
    const calc = frame.tax_intent.primary.value === 'TAX_CALCULATION' || frame.tax_intent.secondary.includes('TAX_CALCULATION') || topic === 'TAX_AMOUNT';
    const refund = frame.tax_intent.primary.value === 'REFUND' || frame.tax_intent.secondary.includes('REFUND');
    if (!isHistorical && relief && ['REVENUE_OWNERSHIP', 'REVENUE_THRESHOLD'].includes(topic)) refs.unshift('16.39');
    if (!isHistorical && relief && !refs.includes('16.50')) refs.push('16.50', '16.99');
    if (!isHistorical && calc && !refs.includes('16.77')) refs.push('16.77', '16.99', '16.56');
    if (!isHistorical && refund && !refs.includes('16.51')) refs.push('16.51', '16.95');
    if (frame.facts?.revenue_vnd && frame.facts.revenue_vnd >= 3_000_000_000 && !refs.includes('16.99')) refs.unshift('16.99');
    if (topic === 'REVENUE_THRESHOLD' && frame.semantic?.revenueContext === 'PARTIAL_PERIOD') refs.unshift('16.101');
    if (topic === 'REVENUE_TIMING' && frame.income_type.some(x => x.value === 'WAGE_SALARY')) refs.push('16.93');
    return { strategy: 'PINNED_REFS', semantic_topic: topic, allowed_refs: refs,
      must_include_refs: refs.slice(0, topic === 'VAT_METHOD_CLASSIFICATION' || relief || topic === 'BUSINESS_REGISTRATION' ? 3 : 2), filter_years: years,
      filter_taxpayer_types: [frame.taxpayer_type.value], boost_keywords: [] };
  }

  if (!isHistorical && (frame.tax_intent.primary.value === 'TAX_CALCULATION' ||
      frame.tax_intent.primary.value === 'RELIEF_REDUCTION')) {
    mustIncludeRefs.push('16.77');
    if (frame.facts?.revenue_vnd && frame.facts.revenue_vnd > 1_000_000_000 && frame.facts.revenue_vnd <= 3_000_000_000) {
      mustIncludeRefs.push('16.56');
    }
  }

  // 1. Ghim các ref bắt buộc theo quy định thời kỳ
  if (isHistorical || years.includes(2025)) {
    mustIncludeRefs.push('16.54'); // Ngưỡng 100tr TT40
  }

  // 2. Doanh thu trên 3 tỷ (phương pháp 17%)
  if (frame.facts?.revenue_vnd && frame.facts.revenue_vnd > 3_000_000_000) {
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
