/**
 * FACT EXTRACTOR - HỢP NHẤT TOÀN BỘ CÁC BỘ TRÍCH DỮ KIỆN SỐ VÀ TIỀN TỆ
 *
 * Hợp nhất logic từ:
 * - taxEngine.ts:435-565 (extractTaxFactsFromQuery)
 * - priorityTaxAnswer.ts:5-60 (exact, named, overThree, platformTax, etc.)
 * - businessTaxAnswer.ts:13-60 (extractVerifiedBusinessFacts, multi-activity matching)
 */

import type { TaxFactsFrame, MultiActivityItem } from './types';
import type { Residency, RevenueBasis } from './labels';

export const fold = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

export function parseVndFromDigits(s: string): number {
  return Number(s.replace(/[.,]/g, ''));
}

export function parseMoneyWithUnit(numStr: string, unit: string): number {
  const normNum = Number(numStr.replace(',', '.'));
  if (isNaN(normNum)) return 0;
  if (unit === 'ty') {
    return Math.round(normNum * 1_000_000_000);
  }
  // trieu / tr: "1.010 triệu" hoặc "1,200 triệu" (3 chữ số sau dấu phân cách) là hàng nghìn triệu (= tỷ)
  if (/^\d{1,3}[.,]\d{3}$/.test(numStr)) {
    return parseInt(numStr.replace(/[.,]/g, ''), 10) * 1_000_000;
  }
  return Math.round(normNum * 1_000_000);
}

export interface ExtractedAmount {
  raw: string;
  vnd: number;
  index: number;
  unit?: string;
  isPerMonth?: boolean;
}

/** Monetary syntax, independent of any tax threshold or question intent. */
function compositeAmounts(q:string):ExtractedAmount[]{
 return [...q.matchAll(/(\d+(?:[.,]\d+)?|mot)\s*(ty|trieu)\s*(?:dong\s*)?(?:(le|cong them|cong|them|\+|dung|chi co|chi hon|hon|tru|thieu|kem|bot|-)\s*)?(mot|\d+)\s*dong\b/g)]
  .map(m=>({raw:m[0],vnd:parseMoneyWithUnit(m[1]==='mot'?'1':m[1],m[2])+(/^(tru|thieu|kem|bot|-)$/.test(m[3]||'')?-1:1)*(m[4]==='mot'?1:Number(m[4])),index:m.index??0,unit:m[2]}));
}

/**
 * Spoken Vietnamese compound amounts that must stay ONE number:
 *   "1 tỷ 200 triệu" = 1.200.000.000; "1 tỷ 25 triệu" = 1.025.000.000;
 *   a bare suffix after "tỷ" is read as decimal digits of tỷ, matching everyday usage:
 *   "1 tỷ 2" / "1ty2" = 1,2 tỷ; "1 tỷ 25" = 1,25 tỷ; "1 tỷ 250" = 1,25 tỷ;
 *   "2 tỷ rưỡi" = 2,5 tỷ; "300 triệu rưỡi" = 300,5 triệu.
 * A bare suffix is only accepted when the leading number is an integer and the suffix is not
 * followed by another unit/counter (năm, tháng, đơn, %, ...), so "1 tỷ 2 năm" is not merged.
 */
function compoundAmounts(q:string):ExtractedAmount[]{
 const out:ExtractedAmount[]=[];
 const re=/(?<![\d.,])(\d+)\s*ty\s*(?:(\d{1,3})\s*(?:trieu|tr)\b|(ruoi)\b|(\d{1,3})(?![\d.,%])(?!\s*(?:trieu|tr\b|nghin|ngan|k\b|dong|d\b|ty|nam|thang|quy|ngay|lan|nguoi|don|hoat|nganh|cua|%)))/g;
 for(const m of q.matchAll(re)){
  const whole=Number(m[1])*1_000_000_000;
  const vnd=m[2]!==undefined?whole+Number(m[2])*1_000_000
   :m[3]?whole+500_000_000
   :whole+Number(m[4].padEnd(3,'0'))*1_000_000;
  out.push({raw:m[0],vnd,index:m.index??0,unit:'ty'});
 }
 for(const m of q.matchAll(/(?<![\d.,])(\d+)\s*trieu\s*ruoi\b/g))
  out.push({raw:m[0],vnd:Number(m[1])*1_000_000+500_000,index:m.index??0,unit:'trieu'});
 return out;
}

/**
 * Trích xuất toàn bộ các số tiền xuất hiện trong câu hỏi
 */
export function extractAllAmounts(text: string): ExtractedAmount[] {
  const q = fold(text);
  const results: ExtractedAmount[] = [];

  // Keep the complete amount before shorter unit matches at the same position.
  results.push(...compositeAmounts(q));
  results.push(...compoundAmounts(q));

  // 1. Số đầy đủ hàng nghìn: "1.010.000.000 dong", "500.000.000", "1,000,000,001"
  const exactMatches = q.matchAll(/(?<!\d)(\d{1,3}(?:[.,]\d{3}){2,})(?!\d)\s*(?:dong|d)?/g);
  for (const m of exactMatches) {
    const val = parseVndFromDigits(m[1]);
    if (val > 0) {
      results.push({
        raw: m[0],
        vnd: val,
        index: m.index ?? 0,
      });
    }
  }

  // 2. Viết tắt tỷ / triệu / tr: "1,01 ty", "300 trieu", "400tr", "50tr"
  const namedMatches = q.matchAll(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/g);
  for (const m of namedMatches) {
    const val = parseMoneyWithUnit(m[1], m[2]);
    if (val > 0) {
      const isPerMonth = /\/(?:thang|moithang)\b|m[ỗ]i thang|hang thang/.test(
        q.slice((m.index ?? 0), Math.min(q.length, (m.index ?? 0) + m[0].length + 15))
      );
      results.push({
        raw: m[0],
        vnd: val,
        index: m.index ?? 0,
        unit: m[2],
        isPerMonth,
      });
    }
  }

  // Loại bỏ các khoản tiền trùng lặp/chồng lấn: giữ khớp xuất hiện trước (composite/compound
  // được push trước), bỏ mọi khớp ngắn hơn nằm trong span đã nhận.
  const accepted: ExtractedAmount[] = [];
  for (const item of results) {
    const start = item.index, end = item.index + item.raw.length;
    if (accepted.some(a => start < a.index + a.raw.length && a.index < end)) continue;
    accepted.push(item);
  }
  return accepted.sort((a, b) => a.index - b.index);
}

/** First amount token that starts right after a label (≤25 non-digit chars between). */
function amountAfterLabel(q: string, amounts: ExtractedAmount[], label: RegExp, gapReject?: RegExp): ExtractedAmount | undefined {
  const re = new RegExp(label.source, 'g');
  for (const m of q.matchAll(re)) {
    const end = (m.index ?? 0) + m[0].length;
    const next = amounts.find(a => a.index >= end);
    if (!next) continue;
    const gap = q.slice(end, next.index);
    // Any digit in the gap means the nearest number is unitless/percent (e.g. "chiếm 5%"):
    // never guess a unit for it.
    if (gap.length <= 25 && !/\d/.test(gap) && !(gapReject && gapReject.test(gap))) return next;
  }
  return undefined;
}

/** Last amount token that ends right before a label ("800 triệu bán hàng"). */
function amountBeforeLabel(q: string, amounts: ExtractedAmount[], label: RegExp): ExtractedAmount | undefined {
  const re = new RegExp(label.source, 'g');
  for (const m of q.matchAll(re)) {
    const start = m.index ?? 0;
    const prev = [...amounts].reverse().find(a => a.index + a.raw.length <= start);
    if (!prev) continue;
    const gap = q.slice(prev.index + prev.raw.length, start);
    if (gap.length <= 25 && !/\d/.test(gap)) return prev;
  }
  return undefined;
}

/**
 * Xác định tình trạng cư trú
 */
export function extractResidency(text: string): { residency: Residency; isResident: boolean | null } {
  const q = fold(text);
  // Asking about / unsure of residency is not a statement of residency. Checked first so that
  // "cư trú hay không cư trú" is neither RESIDENT nor NON_RESIDENT.
  if (/\bcu tru\s+(?:hay|hoac)\s+(?:khong|phi)\b|\b(?:co|la)\s+(?:ca nhan\s+|nguoi\s+)?cu tru\s+(?:khong|chua|hay khong)\b|\b(?:khong|chua)\s+(?:biet|ro|chac|xac dinh)\b[^.!?]{0,40}\bcu tru\b|\bcu tru\b[^.!?]{0,20}\b(?:chua ro|khong ro|chua xac dinh)\b/.test(q)) {
    return { residency: 'UNKNOWN', isResident: null };
  }
  if (/\b(khong cu tru|phi cu tru)\b/.test(q)) {
    return { residency: 'NON_RESIDENT', isResident: false };
  }
  if (/\b(ca nhan cu tru|nguoi cu tru|toi cu tru|la cu tru|cu tru du dieu kien|cu tru)\b/.test(q)) {
    return { residency: 'RESIDENT', isResident: true };
  }
  // Missing residency remains unknown in both the label and calculation facts.
  return { residency: 'UNKNOWN', isResident: null };
}

/**
 * Trích xuất cấu trúc dữ kiện số TaxFactsFrame
 */
export function extractTaxFacts(text: string, _defaultYear = 2026, semanticIncomeTypes?: readonly string[]): TaxFactsFrame {
  const q = fold(text);
  const { isResident } = extractResidency(text);

  // 1. Xác định kỳ doanh thu (Revenue Basis)
  let revenueBasis: RevenueBasis = 'ANNUAL';
  if (/\/(?:thang|moithang)\b|m[ỗ]i thang|hang thang|1 thang/.test(q)) {
    revenueBasis = 'MONTHLY';
  } else if (/\/(?:quy)\b|m[ỗ]i quy|hang quy|1 quy/.test(q)) {
    revenueBasis = 'QUARTERLY';
  }

  // 2. Preserve a one-dong boundary exactly; never round it back to billions.
  let specialRevenue: number | undefined;
  const composite = compositeAmounts(q)[0];
  const revenueRange=q.match(/\b(?:tong\s+)?doanh thu(?:\s+nam\s+(?:19|20)\d{2})?\s+(?:da\s+)?(?:tren|vuot|hon)\s+(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
  const revenueLowerBound=revenueRange?parseMoneyWithUnit(revenueRange[1],revenueRange[2]):undefined;
  if (composite) {
    specialRevenue = composite.vnd;
  }

  // 3. Trích xuất đơn hoàn (refund) và chi phí — dùng chung bộ tách số tiền để
  // "60.000.000 đồng" không bị đọc thành "60.000" × triệu, và "5%" không thành 5 triệu.
  const amountTokens = extractAllAmounts(text);
  const refundDeductedVnd: number | undefined =
    amountAfterLabel(q, amountTokens, /(?:don hoan|tra hang|hoan hang)/)?.vnd;
  const platformFeeVnd: number | undefined =
    amountAfterLabel(q, amountTokens, /(?:phi san|chi phi san|phi dich vu san)/)?.vnd;
  const shippingCodVnd: number | undefined =
    amountAfterLabel(q, amountTokens, /(?:\bship|tien ship|cuoc van chuyen|thu ho|\bcod\b)/)?.vnd;

  // 4. Trích xuất thu nhập tính thuế / lợi nhuận và phân loại đại lượng đầu vào
  const pitMethodElected: 'REVENUE' | 'INCOME' | undefined =
    /chon phuong phap thu nhap|tinh theo thu nhap tinh thue|theo phuong phap thu nhap/.test(q)
      ? 'INCOME'
      : /chon phuong phap doanh thu|theo ty le % tren doanh thu/.test(q)
      ? 'REVENUE'
      : undefined;

  const taxPaidVnd: number | undefined =
    amountAfterLabel(q, amountTokens, /(?:da nop|da khau tru|da nop thay)/)?.vnd;

  const bankLabel = /(?:tien mat|so du)(?:\s+con)?\s+trong tai khoan/;
  const unverifiedBankBalanceVnd: number | undefined =
    (amountAfterLabel(q, amountTokens, bankLabel) || amountBeforeLabel(q, amountTokens, bankLabel))?.vnd;

  const reportedExpenseVnd: number | undefined =
    amountAfterLabel(q, amountTokens, /(?:chi phi(?:\s+bao)?|tong chi phi)/)?.vnd;

  const dupLabel = /(?:ghi hai lan|trung lap|tinh trung)/;
  const duplicateExpenseVnd: number | undefined =
    (amountBeforeLabel(q, amountTokens, dupLabel) || amountAfterLabel(q, amountTokens, dupLabel))?.vnd;

  const gmvLabel = /\bgmv\b/;
  const gmvVnd: number | undefined =
    (amountAfterLabel(q, amountTokens, gmvLabel) || amountBeforeLabel(q, amountTokens, gmvLabel))?.vnd;

  let taxableIncomeVnd: number | undefined;
  const incomeTok = amountAfterLabel(q, amountTokens, /(?:thu nhap tinh thue|loi nhuan)(?:\s+hop le)?/);
  const hasUnverifiedOrDirtyCosts =
    /(?:khong|chua)\s+co\s+chung tu|co the coi|coi ngay|chi phi[^.!?]{0,40}(?:khong|chua)\s+hop le|ghi hai lan|trung lap|cho kiem chung tu|chua phai thu nhap tinh thue/.test(q);
  if (incomeTok && !hasUnverifiedOrDirtyCosts) {
    taxableIncomeVnd = incomeTok.vnd;
  }

  // 5. Kiểm tra nhiều ngành kết hợp (ví dụ: bán hàng 800tr + dịch vụ 350tr)
  // Length-preserving mask so token indexes stay aligned with q.
  const positiveActivityText = q.replace(/\b(?:khong|chua|chang)\s+(?:ban\s+le|ban\s+hang|kinh\s+doanh)\b(?:\s+(?:tap\s+hoa|hang\s+hoa))?/g, s => ' '.repeat(s.length));
  const hasGoodsKeyword = semanticIncomeTypes ? semanticIncomeTypes.some(x => ['GOODS_SALES', 'MARKETPLACE_SALES'].includes(x))
    : /\b(ban hang|ban le|shopee|hang hoa|thuong mai|tap hoa)\b/.test(positiveActivityText);
  const hasServiceKeyword = semanticIncomeTypes ? semanticIncomeTypes.some(x => ['SERVICE', 'FREELANCE_SERVICE', 'AFFILIATE_COMMISSION', 'CONTENT_ADS', 'FOOD_SERVICE'].includes(x))
    : /\b(dich vu|affiliate|tiktok|koc|hoa hong|sua chua)\b/.test(q);
  const allAmounts = amountTokens;

  if (hasGoodsKeyword && hasServiceKeyword && allAmounts.length >= 2) {
    const goodsLabel = /(?:ban hang|ban le|shopee|hang hoa|tap hoa)/;
    const serviceLabel = /(?:dich vu|affiliate|tiktok|koc|hoa hong|sua chua)/;
    const goodsTok = amountAfterLabel(positiveActivityText, allAmounts, goodsLabel) || amountBeforeLabel(positiveActivityText, allAmounts, goodsLabel);
    const serviceTok = amountAfterLabel(q, allAmounts, serviceLabel) || amountBeforeLabel(q, allAmounts, serviceLabel);

    // One figure can never be both the goods and the service revenue
    // ("bán hàng trên tiktok 1,5 tỷ" is ONE activity, not 1,5 tỷ + 1,5 tỷ).
    const nonRevenueRoles = new Set([refundDeductedVnd, platformFeeVnd, shippingCodVnd].filter((v): v is number => v !== undefined));
    if (goodsTok && serviceTok && goodsTok.index !== serviceTok.index &&
        !nonRevenueRoles.has(goodsTok.vnd) && !nonRevenueRoles.has(serviceTok.vnd)) {
      const revGoods = goodsTok.vnd, revService = serviceTok.vnd;
      const multiActivities: MultiActivityItem[] = [
        { id: 'goods', kind: 'goods', revenueVnd: revGoods, vatRate: 0.01, pitRate: 0.005 },
        { id: 'service', kind: 'service', revenueVnd: revService, vatRate: 0.05, pitRate: 0.02 },
      ];
      return {
        revenue_vnd: revGoods + revService,
        revenue_basis: revenueBasis,
        is_resident: isResident,
        activity_type: 'multi',
        multi_activities: multiActivities,
        refund_deducted_vnd: refundDeductedVnd,
        platform_fee_vnd: platformFeeVnd,
        shipping_cod_vnd: shippingCodVnd,
        taxable_income_vnd: taxableIncomeVnd,
        pit_method_elected: pitMethodElected,
        tax_paid_vnd: taxPaidVnd,
        unverified_bank_balance_vnd: unverifiedBankBalanceVnd,
        reported_expense_vnd: reportedExpenseVnd,
        duplicate_expense_vnd: duplicateExpenseVnd,
        gmv_vnd: gmvVnd,
      };
    }
  }

  // 6. Doanh thu đơn lẻ
  // Lọc ra các số tiền không phải là đơn hoàn, phí sàn, tiền ship, thu nhập tính thuế, số dư TK, GMV, chi phí hay thuế đã nộp
  let primaryRevenue: number | undefined = specialRevenue;
  if (!primaryRevenue && allAmounts.length > 0) {
    // Ưu tiên số tiền gắn liền với từ khóa "doanh thu", "ban duoc", "tong thu", "hoa hong" (loại trừ thu nhập tính thuế)
    const revTok = amountAfterLabel(q, allAmounts,
      /(?:doanh thu|tong doanh thu|ban duoc|tong thu|kiem duoc|hoa hong)(?:\s+(?:ca\s+)?nam\s+(?:19|20)\d{2})?/,
      /bao nhieu|\btax\b|khau tru|giu lai|thu nhap tinh thue|\b(tren|vuot|hon)\b/);
    if (revTok) {
      primaryRevenue = revTok.vnd;
    } else {
      const nonRevenueValues = new Set(
        [
          taxableIncomeVnd,
          refundDeductedVnd,
          platformFeeVnd,
          shippingCodVnd,
          taxPaidVnd,
          unverifiedBankBalanceVnd,
          reportedExpenseVnd,
          duplicateExpenseVnd,
          gmvVnd,
          revenueLowerBound,
        ].filter((v): v is number => v !== undefined)
      );
      const nonTaxableIncome = allAmounts.filter(a => !nonRevenueValues.has(a.vnd));
      // Never promote an expense, balance or GMV to revenue just because it is the only number.
      primaryRevenue = nonTaxableIncome.length > 0 ? nonTaxableIncome[0].vnd : undefined;
    }
  }

  // 7. Giả định giảm thuế VAT (NQ 204/2025 hoặc NĐ 174/2025)
  const vatReliefAssumed =
    !/khong (?:duoc|du dieu kien) giam (?:thue )?gtgt/.test(q) &&
    /(du dieu kien|thuoc dien|duoc giam|gia dinh)[^.!?]{0,90}(20\s*%|gtgt)|(?:hang hoa|mat hang)[^.!?]{0,90}(du dieu kien|duoc giam)/.test(q);
  // Numeric extraction only: never infer a business sector from this number.
  const explicitRates = [...q.matchAll(/(?:ty\s*le\s*(?:thue\s*)?gtgt(?:\s*[a-z]+){0,8}|gtgt\s*goc)\s*(\d+(?:[.,]\d+)?)\s*%/g)]
    .map(m => Number(m[1].replace(',', '.')) / 100);
  const vatRateExplicit = explicitRates.length === 1 && [0.01, 0.02, 0.03, 0.05].includes(explicitRates[0]) ? explicitRates[0] : undefined;

  return {
    revenue_vnd: primaryRevenue,
    revenue_lower_bound_vnd:revenueLowerBound,
    revenue_basis: revenueBasis,
    is_resident: isResident,
    taxable_income_vnd: taxableIncomeVnd,
    pit_method_elected: pitMethodElected,
    tax_paid_vnd: taxPaidVnd,
    unverified_bank_balance_vnd: unverifiedBankBalanceVnd,
    reported_expense_vnd: reportedExpenseVnd,
    duplicate_expense_vnd: duplicateExpenseVnd,
    gmv_vnd: gmvVnd,
    refund_deducted_vnd: refundDeductedVnd,
    platform_fee_vnd: platformFeeVnd,
    shipping_cod_vnd: shippingCodVnd,
    vat_relief_assumed: vatReliefAssumed,
    vat_rate_explicit: vatRateExplicit,
  };
}
