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
  // trieu / tr
  if (numStr.includes('.')) {
    const parts = numStr.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      return parseInt(parts.join(''), 10) * 1_000_000;
    }
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
 * Trích xuất toàn bộ các số tiền xuất hiện trong câu hỏi
 */
export function extractAllAmounts(text: string): ExtractedAmount[] {
  const q = fold(text);
  const results: ExtractedAmount[] = [];

  // Keep the complete amount before shorter unit matches at the same position.
  results.push(...compositeAmounts(q));

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

  // Loại bỏ các khoản tiền trùng lặp theo vị trí index
  const seenIndex = new Set<number>();
  return results
    .filter(item => {
      if (seenIndex.has(item.index)) return false;
      seenIndex.add(item.index);
      return true;
    })
    .sort((a, b) => a.index - b.index);
}

/**
 * Xác định tình trạng cư trú
 */
export function extractResidency(text: string): { residency: Residency; isResident: boolean | null } {
  const q = fold(text);
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

  // 3. Trích xuất đơn hoàn (refund) và chi phí
  let refundDeductedVnd: number | undefined;
  let platformFeeVnd: number | undefined;
  let shippingCodVnd: number | undefined;

  const refundMatch = q.match(/(?:don hoan|tra hang|hoan hang)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)?/);
  if (refundMatch) {
    refundDeductedVnd = parseMoneyWithUnit(refundMatch[1], refundMatch[2] || 'trieu');
  }

  const feeMatch = q.match(/(?:phi san|chi phi san|phi dich vu san)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)?/);
  if (feeMatch) {
    platformFeeVnd = parseMoneyWithUnit(feeMatch[1], feeMatch[2] || 'trieu');
  }

  const codMatch = q.match(/(?:ship|tien ship|cuoc van chuyen|thu ho|cod)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)?/);
  if (codMatch) {
    shippingCodVnd = parseMoneyWithUnit(codMatch[1], codMatch[2] || 'trieu');
  }

  // 4. Trích xuất thu nhập tính thuế / lợi nhuận và phân loại đại lượng đầu vào
  const pitMethodElected: 'REVENUE' | 'INCOME' | undefined =
    /chon phuong phap thu nhap|tinh theo thu nhap tinh thue|theo phuong phap thu nhap/.test(q)
      ? 'INCOME'
      : /chon phuong phap doanh thu|theo ty le % tren doanh thu/.test(q)
      ? 'REVENUE'
      : undefined;

  let taxPaidVnd: number | undefined;
  const paidMatch = q.match(/(?:da nop|da khau tru|da nop thay)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
  if (paidMatch) {
    taxPaidVnd = parseMoneyWithUnit(paidMatch[1], paidMatch[2]);
  }

  let unverifiedBankBalanceVnd: number | undefined;
  const bankMatch =
    q.match(/(?:tien mat|so du)(?:\s+con)?\s+trong tai khoan[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/) ||
    q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,25}(?:tien mat|so du)(?:\s+con)?\s+trong tai khoan/);
  if (bankMatch) {
    unverifiedBankBalanceVnd = parseMoneyWithUnit(bankMatch[1], bankMatch[2]);
  }

  let reportedExpenseVnd: number | undefined;
  const expMatch = q.match(/(?:chi phi(?:\s+bao)?|tong chi phi)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
  if (expMatch) {
    reportedExpenseVnd = parseMoneyWithUnit(expMatch[1], expMatch[2]);
  }

  let duplicateExpenseVnd: number | undefined;
  const dupMatch =
    q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,30}(?:ghi hai lan|trung lap|tinh trung)/) ||
    q.match(/(?:ghi hai lan|trung lap|tinh trung)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
  if (dupMatch) {
    duplicateExpenseVnd = parseMoneyWithUnit(dupMatch[1], dupMatch[2]);
  }

  let gmvVnd: number | undefined;
  const gmvMatch =
    q.match(/\bgmv\b[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/) ||
    q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,15}\bgmv\b/);
  if (gmvMatch) {
    gmvVnd = parseMoneyWithUnit(gmvMatch[1], gmvMatch[2]);
  }

  let taxableIncomeVnd: number | undefined;
  const incomeMatch = q.match(/(?:thu nhap tinh thue|loi nhuan)(?:\s+hop le)?[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b/);
  const hasUnverifiedOrDirtyCosts =
    /(?:khong|chua)\s+co\s+chung tu|co the coi|coi ngay|chi phi[^.!?]{0,40}(?:khong|chua)\s+hop le|ghi hai lan|trung lap|cho kiem chung tu|chua phai thu nhap tinh thue/.test(q);
  if (incomeMatch && !hasUnverifiedOrDirtyCosts) {
    taxableIncomeVnd = parseMoneyWithUnit(incomeMatch[1], incomeMatch[2]);
  }

  // 5. Kiểm tra nhiều ngành kết hợp (ví dụ: bán hàng 800tr + dịch vụ 350tr)
  const positiveActivityText = q.replace(/\b(?:khong|chua|chang)\s+(?:ban\s+le|ban\s+hang|kinh\s+doanh)\b(?:\s+(?:tap\s+hoa|hang\s+hoa))?/g, ' ');
  const hasGoodsKeyword = semanticIncomeTypes ? semanticIncomeTypes.some(x => ['GOODS_SALES', 'MARKETPLACE_SALES'].includes(x))
    : /\b(ban hang|ban le|shopee|hang hoa|thuong mai|tap hoa)\b/.test(positiveActivityText);
  const hasServiceKeyword = semanticIncomeTypes ? semanticIncomeTypes.some(x => ['SERVICE', 'FREELANCE_SERVICE', 'AFFILIATE_COMMISSION', 'CONTENT_ADS', 'FOOD_SERVICE'].includes(x))
    : /\b(dich vu|affiliate|tiktok|koc|hoa hong|sua chua)\b/.test(q);
  const allAmounts = extractAllAmounts(text);

  if (hasGoodsKeyword && hasServiceKeyword && allAmounts.length >= 2) {
    let revGoods: number | null = null;
    let revService: number | null = null;

    const goodsMatch = positiveActivityText.match(/(?:ban hang|ban le|shopee|hang hoa|tap hoa)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)?/) ||
      positiveActivityText.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,25}(?:ban hang|ban le|shopee|hang hoa|tap hoa)/);
    const serviceMatch = q.match(/(?:dich vu|affiliate|tiktok|koc|hoa hong|sua chua)[^\d]{0,25}(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)?/) ||
      q.match(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b[^\d]{0,25}(?:dich vu|affiliate|tiktok|koc|hoa hong|sua chua)/);

    if (goodsMatch && serviceMatch) {
      revGoods = parseMoneyWithUnit(goodsMatch[1], goodsMatch[2] || (goodsMatch[1].includes('.') ? 'trieu' : 'ty'));
      revService = parseMoneyWithUnit(serviceMatch[1], serviceMatch[2] || 'trieu');
    }

    if (revGoods && revService && revGoods > 0 && revService > 0) {
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
    const revExplicitRegex = /(?:doanh thu|tong doanh thu|ban duoc|tong thu|kiem duoc|hoa hong)(?:\s+nam\s+(?:19|20)\d{2})?[^\d]{0,25}(?:(\d{1,3}(?:[.,]\d{3}){2,})(?!\d)\s*(?:dong|d)?|(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr)\b)/g;
    const revCandidates = [...q.matchAll(revExplicitRegex)];
    const revMatch = revCandidates.find(m => !/bao nhieu|\btax\b|khau tru|giu lai|thu nhap tinh thue|\b(tren|vuot|hon)\b/.test(m[0]));
    if (revMatch) {
      if (revMatch[1]) {
        primaryRevenue = parseVndFromDigits(revMatch[1]);
      } else if (revMatch[2]) {
        primaryRevenue = parseMoneyWithUnit(revMatch[2], revMatch[3] || (Number(revMatch[2]) >= 10 ? 'trieu' : 'ty'));
      }
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
