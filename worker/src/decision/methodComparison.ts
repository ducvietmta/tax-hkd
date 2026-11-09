import type { TaxDecisionFrame } from './types';
import { getRulesetForYear } from '../rules/registry';
/** Conditional comparison on the same basis. No sector or residency is invented. */
export function methodComparisonLedger(frame:TaxDecisionFrame){
 if(frame.semantic?.calculationShape!=='METHOD_COMPARISON'||frame.tax_period.years.length!==1||
   !['HOUSEHOLD_BUSINESS','INDIVIDUAL_BUSINESS'].includes(frame.taxpayer_type.value)||frame.residency.value==='NON_RESIDENT'||
   frame.facts.revenue_basis!=='ANNUAL'||frame.semantic.methodContext!=='UNSPECIFIED'&&frame.semantic.methodContext!==undefined||
   frame.facts.multi_activities?.length||frame.facts.duplicate_expense_vnd||frame.facts.refund_deducted_vnd||
   frame.income_type.some(t=>['WAGE_SALARY','PROPERTY_RENTAL','PLATFORM_OPERATOR'].includes(t.value)))return null;
 const year=frame.tax_period.years[0],r=getRulesetForYear(year),revenue=frame.facts.revenue_vnd,expense=frame.facts.reported_expense_vnd;
 if(year<r.tax_year_range[0]||year>r.tax_year_range[1]||revenue===undefined||expense===undefined||
   !Number.isSafeInteger(revenue)||!Number.isSafeInteger(expense)||expense<0||revenue<=r.thresholds.exemption_annual_vnd||
   revenue>(r.thresholds.income_method_mandatory_vnd||0)||r.pit_income_rates?.tier1_voluntary===undefined)return null;
 const taxableIncome=Math.max(0,revenue-expense),incomeRate=r.pit_income_rates.tier1_voluntary;
 const before=Math.round(taxableIncome*incomeRate),turnoverBase=revenue-r.thresholds.exemption_annual_vnd;
 const relief=r.relief_policies?.nq43_pit_reduction_rate||0;
 const after=(value:number)=>Math.round(value*(1-relief));
 const known=frame.income_type.length===1?{GOODS_SALES:'goods',MARKETPLACE_SALES:'goods',SERVICE:'service',FREELANCE_SERVICE:'service',FOOD_SERVICE:'food_service'}[frame.income_type[0].value as string]:undefined;
 const sectors=known?[known]:['goods','service','food_service'];
 const reliefApplies=!!relief&&revenue<=(r.thresholds.relief_max_revenue_vnd||0);
 const incomeComparable=reliefApplies?after(before):before;
 const conclusion=sectors.map(key=>{
   const turnoverBefore=Math.round(turnoverBase*r.rates[key].pit_rate);
   const turnoverComparable=reliefApplies?after(turnoverBefore):turnoverBefore;
   return {sector:key,income_amount:incomeComparable,turnover_amount:turnoverComparable,
     lower:incomeComparable<turnoverComparable?'INCOME':incomeComparable>turnoverComparable?'TURNOVER':'EQUAL',
     difference_vnd:Math.abs(incomeComparable-turnoverComparable)};
 });
 return {kind:'CONDITIONAL_METHOD_COMPARISON',year,revenue,expense,conclusion,
   conditions:['Phải là cá nhân cư trú thuộc diện được lựa chọn phương pháp trong kỳ và đủ điều kiện theo nguồn; chưa biết cư trú thì đây là phép tính có điều kiện.','Chi phí trong phép tính là giả định toàn bộ được trừ; không tự xác nhận hồ sơ.'],
   income:{base:taxableIncome,rate:incomeRate,before_relief:before},
   turnover:{base:turnoverBase,sector_known:!!known,examples:sectors.map(key=>({sector:key,description:r.rates[key].description,
     hypothetical:!known,rate:r.rates[key].pit_rate,before_relief:Math.round(turnoverBase*r.rates[key].pit_rate)}))},
   relief:relief&&revenue<=(r.thresholds.relief_max_revenue_vnd||0)?{
     rate:relief,residency:frame.residency.value,condition:'Chỉ khi là cá nhân cư trú và đáp ứng các điều kiện NQ43 của kỳ; không áp cho cá nhân không cư trú.',
     income_after:after(before),turnover_examples_after:sectors.map(key=>({sector:key,amount:after(Math.round(turnoverBase*r.rates[key].pit_rate))}))}:null,
   citations:[r.citations.pit_law,r.citations.exemption,r.citations.pit_relief].filter(Boolean),
 };
}

/** Historical calculations stay conditional on the sector/taxable goods and
 * residency. The current year does not select the tax threshold. */
export function historicalCalculationLedger(frame:TaxDecisionFrame){
 if(frame.tax_period.years.length!==1||frame.tax_period.years[0]>=2026||frame.facts.revenue_basis!=='ANNUAL'||
   !['HOUSEHOLD_BUSINESS','INDIVIDUAL_BUSINESS'].includes(frame.taxpayer_type.value)||
   ['PROJECTED','PARTIAL_PERIOD','TRANSACTION'].includes(frame.semantic?.revenueContext||'')||
   frame.facts.multi_activities?.length||frame.residency.value==='NON_RESIDENT'||
   frame.income_type.some(t=>!['GOODS_SALES','MARKETPLACE_SALES','SERVICE','FREELANCE_SERVICE','FOOD_SERVICE','UNKNOWN'].includes(t.value)))return null;
 const year=frame.tax_period.years[0],rules=getRulesetForYear(year),gross=frame.facts.revenue_vnd;
 if(year<rules.tax_year_range[0]||year>rules.tax_year_range[1]||gross===undefined||!Number.isSafeInteger(gross)||gross<0)return null;
 const refund=frame.facts.refund_deducted_vnd||0;if(!Number.isSafeInteger(refund)||refund<0||refund>gross)return null;
 const revenue=gross-refund,threshold=rules.thresholds.exemption_annual_vnd;
 const known=frame.income_type.length===1?{GOODS_SALES:'goods',MARKETPLACE_SALES:'goods',SERVICE:'service',FREELANCE_SERVICE:'service',FOOD_SERVICE:'food_service'}[frame.income_type[0].value as string]:undefined;
 const sectors=known?[known]:['goods','service','food_service'];
 return {kind:'CONDITIONAL_HISTORICAL_CALCULATION',year,gross_revenue:gross,revenue,threshold,residency:frame.residency.value,
   conditions:['Áp dụng quy định của kỳ lịch sử; xác định hàng hóa/dịch vụ chịu thuế và cá nhân cư trú theo nguồn.','Số GTGT theo tỷ lệ gốc, chưa xét điều kiện giảm GTGT từng giai đoạn; số thuế trước đối trừ đã nộp/nộp thay có chứng từ.'],
   examples:sectors.map(key=>({sector:key,description:rules.rates[key].description,hypothetical:!known,
     taxable_base:revenue<=threshold?0:revenue,vat_rate:rules.rates[key].vat_rate,pit_rate:rules.rates[key].pit_rate,
     vat_before_relief:Math.round((revenue<=threshold?0:revenue)*rules.rates[key].vat_rate),
     pit_before_credits:Math.round((revenue<=threshold?0:revenue)*rules.rates[key].pit_rate)})),
   citations:[rules.citations.exemption,rules.citations.vat_rates,rules.citations.pit_rates].filter(Boolean),
 };
}

/** Conditional 2026 turnover/rental/multi-activity ledger when residency or scenario branching prevents a single unconditional ledger. */
export function conditionalTurnoverLedger(frame: TaxDecisionFrame) {
  if (
    frame.tax_period.years.length !== 1 ||
    frame.tax_period.years[0] < 2026 ||
    frame.facts.revenue_basis !== 'ANNUAL' ||
    ['PROJECTED', 'PARTIAL_PERIOD', 'TRANSACTION'].includes(frame.semantic?.revenueContext || '') ||
    frame.residency.value === 'NON_RESIDENT'
  ) {
    return null;
  }
  const year = frame.tax_period.years[0];
  const r = getRulesetForYear(year);
  const revenue = frame.facts.revenue_vnd;
  if (revenue === undefined || !Number.isSafeInteger(revenue) || revenue <= 0) {
    return null;
  }
  if (revenue <= r.thresholds.exemption_annual_vnd) {
    if (
      frame.facts.tax_paid_vnd !== undefined ||
      frame.tax_intent.primary.value === 'REFUND' ||
      frame.tax_intent.secondary.includes('REFUND') ||
      frame.tax_intent.primary.value === 'PLATFORM_WITHHOLDING' ||
      frame.tax_intent.secondary.includes('PLATFORM_WITHHOLDING')
    ) {
      return {
        kind: 'CONDITIONAL_EXEMPT_REFUND_LEDGER',
        year,
        revenue_vnd: revenue,
        threshold_vnd: r.thresholds.exemption_annual_vnd,
        vat_business_due_vnd: 0,
        pit_business_due_vnd: 0,
        tax_retained_or_paid_vnd: frame.facts.tax_paid_vnd ?? null,
        conclusion: `Nếu bạn là cá nhân cư trú và ${revenue.toLocaleString('vi-VN')} đồng là toàn bộ doanh thu hoạt động kinh doanh cả năm ${year} (không quá ngưỡng 1 tỷ đồng/năm), thì thuế TNCN từ hoạt động kinh doanh phải nộp bằng 0 đồng (TNCN kinh doanh = 0 đồng) và thuế GTGT kinh doanh phải nộp bằng 0 đồng (không nhân tỷ lệ 5% trên 600 triệu khi tổng doanh thu cả năm <= 1 tỷ đồng).`,
        refund_conditions: [
          'Phải xác minh khoản tiền nền tảng giữ lại (như 10%) là phí dịch vụ sàn, thuế GTGT/TNCN kinh doanh nộp thay hay khấu trừ 10% TNCN từ tiền lương, tiền công (theo điểm c khoản 2 Điều 8 Nghị định 253/2026/NĐ-CP nếu chưa đăng ký kinh doanh/đăng ký thuế kinh doanh; nếu là tiền lương, tiền công thì áp chế độ quyết toán tiền lương, tiền công riêng).',
          'Chỉ sau khi có chứng từ khấu trừ/nộp thay hợp lệ và đối chiếu khớp đúng người nộp thuế, kỳ tính thuế, loại thuế và số tiền đã thực nộp vào ngân sách nhà nước lớn hơn nghĩa vụ thuế phải nộp mới thực hiện thủ tục hoàn thuế/bù trừ khoản nộp thừa theo Điều 29–31 Nghị định 252/2026/NĐ-CP; không hứa hoàn tự động ngay toàn bộ.',
        ],
      };
    }
    return null;
  }
  const reliefRate = r.relief_policies?.nq43_pit_reduction_rate || 0.3;
  const eligibleNq43 = revenue <= (r.thresholds.relief_max_revenue_vnd || 10_000_000_000);

  if (frame.income_type.some(t => t.value === 'PROPERTY_RENTAL')) {
    const vatRate = r.rates.property_rental?.vat_rate ?? 0.05;
    const pitRate = r.rates.property_rental?.pit_rate ?? 0.05;
    const vatBefore = Math.round(revenue * vatRate);
    const pitBase = Math.max(0, revenue - r.thresholds.exemption_annual_vnd);
    const pitBefore = Math.round(pitBase * pitRate);
    const pitAfter = eligibleNq43 ? Math.round(pitBefore * (1 - reliefRate)) : pitBefore;
    return {
      kind: 'CONDITIONAL_PROPERTY_RENTAL_LEDGER',
      year,
      revenue_vnd: revenue,
      threshold_vnd: r.thresholds.exemption_annual_vnd,
      single_year_branch: {
        condition: 'Nếu toàn bộ số tiền này là doanh thu cho thuê tài sản của đúng 01 năm tính thuế (năm dương lịch 2026)',
        vat_base_vnd: revenue,
        vat_rate: vatRate,
        vat_due_before_relief_vnd: vatBefore,
        vat_note: 'GTGT tính trên toàn bộ doanh thu cho thuê chịu thuế (không trừ 1 tỷ đồng)',
        pit_base_after_1b_deduction_vnd: pitBase,
        pit_rate: pitRate,
        pit_before_relief_vnd: pitBefore,
        pit_after_nq43_30pct_relief_vnd: eligibleNq43 ? pitAfter : null,
        nq43_condition: 'Giảm 30% TNCN theo NQ 43/2026/QH16 và NĐ 398/2026/NĐ-CP chỉ áp dụng khi là cá nhân cư trú và tổng doanh thu kinh doanh năm <= 10 tỷ đồng',
      },
      multi_year_prepaid_branch: {
        condition: 'Nếu là tiền thuê nhận trước của nhiều năm',
        rule: 'Phải xác định/phân bổ doanh thu theo từng năm tính thuế (12 tháng dương lịch) để xét ngưỡng 1 tỷ đồng/năm và tính thuế cho từng năm; không lấy tổng tiền nhận trước của nhiều năm trừ 1 tỷ một lần như doanh thu của một năm đơn lẻ.',
      },
    };
  }

  if (frame.facts.multi_activities && frame.facts.multi_activities.length >= 2) {
    const acts = frame.facts.multi_activities.map(a => {
      const rateEntry = r.rates[a.kind] || r.rates.other;
      const vatBefore = Math.round(a.revenueVnd * rateEntry.vat_rate);
      return {
        id: a.id,
        kind: a.kind,
        description: rateEntry.description,
        revenue_vnd: a.revenueVnd,
        vat_rate: rateEntry.vat_rate,
        pit_rate: rateEntry.pit_rate,
        vat_before_relief_vnd: vatBefore,
        vat_after_nq204_20pct_relief_vnd: Math.round(vatBefore * 0.8),
      };
    });
    const sortedOptimal = [...acts].sort((a, b) => b.pit_rate - a.pit_rate);
    let remOpt = r.thresholds.exemption_annual_vnd;
    const optimalBreakdown = sortedOptimal.map(a => {
      const ded = Math.min(a.revenue_vnd, remOpt);
      remOpt -= ded;
      const pitTaxable = a.revenue_vnd - ded;
      const pitBefore = Math.round(pitTaxable * a.pit_rate);
      return {
        id: a.id,
        kind: a.kind,
        pit_rate: a.pit_rate,
        deduction_allocated_vnd: ded,
        pit_taxable_revenue_vnd: pitTaxable,
        pit_before_relief_vnd: pitBefore,
        pit_after_nq43_30pct_relief_vnd: eligibleNq43 ? Math.round(pitBefore * (1 - reliefRate)) : pitBefore,
      };
    });
    const sortedReverse = [...acts].sort((a, b) => a.pit_rate - b.pit_rate);
    let remRev = r.thresholds.exemption_annual_vnd;
    const reverseBreakdown = sortedReverse.map(a => {
      const ded = Math.min(a.revenue_vnd, remRev);
      remRev -= ded;
      const pitTaxable = a.revenue_vnd - ded;
      const pitBefore = Math.round(pitTaxable * a.pit_rate);
      return {
        id: a.id,
        kind: a.kind,
        pit_rate: a.pit_rate,
        deduction_allocated_vnd: ded,
        pit_taxable_revenue_vnd: pitTaxable,
        pit_before_relief_vnd: pitBefore,
        pit_after_nq43_30pct_relief_vnd: eligibleNq43 ? Math.round(pitBefore * (1 - reliefRate)) : pitBefore,
      };
    });
    const totalVatBefore = acts.reduce((s, a) => s + a.vat_before_relief_vnd, 0);
    const totalVatAfterNq204 = acts.reduce((s, a) => s + a.vat_after_nq204_20pct_relief_vnd, 0);
    const totalPitOptBefore = optimalBreakdown.reduce((s, a) => s + a.pit_before_relief_vnd, 0);
    const totalPitOptAfter = optimalBreakdown.reduce((s, a) => s + a.pit_after_nq43_30pct_relief_vnd, 0);
    const totalPitRevBefore = reverseBreakdown.reduce((s, a) => s + a.pit_before_relief_vnd, 0);
    const totalPitRevAfter = reverseBreakdown.reduce((s, a) => s + a.pit_after_nq43_30pct_relief_vnd, 0);
    return {
      kind: 'CONDITIONAL_MULTI_ACTIVITY_TURNOVER_LEDGER',
      year,
      total_revenue_vnd: revenue,
      threshold_vnd: r.thresholds.exemption_annual_vnd,
      activities: acts,
      vat_total_before_relief_vnd: totalVatBefore,
      vat_total_after_nq204_20pct_relief_vnd: totalVatAfterNq204,
      pit_optimal_allocation: {
        rule: 'Ưu tiên trừ mức 1 tỷ đồng vào ngành/hoạt động có thuế suất TNCN cao hơn trước (Khoản 3 Điều 4 NĐ 68/2026 sửa bởi NĐ 141/2026)',
        breakdown: optimalBreakdown,
        pit_total_before_relief_vnd: totalPitOptBefore,
        pit_total_after_nq43_30pct_relief_vnd: totalPitOptAfter,
      },
      pit_alternative_allocation: {
        rule: 'Nếu trừ mức 1 tỷ đồng vào ngành có thuế suất thấp hơn trước',
        breakdown: reverseBreakdown,
        pit_total_before_relief_vnd: totalPitRevBefore,
        pit_total_after_nq43_30pct_relief_vnd: totalPitRevAfter,
      },
      conditions: [
        'Tổng doanh thu từ trên 1 tỷ đến 3 tỷ đồng/năm được lựa chọn phương pháp tỷ lệ % trên doanh thu hoặc phương pháp thu nhập tính thuế (15% trên thu nhập tính thuế)',
        'Thuế GTGT tính trên toàn bộ doanh thu chịu thuế của từng ngành (không được trừ 1 tỷ đồng); giảm 20% mức tỷ lệ % GTGT theo NQ 204/2025/QH15 & NĐ 174/2025/NĐ-CP nếu hàng hóa, dịch vụ không thuộc Phụ lục I, II, III NĐ 174/2025/NĐ-CP',
        'Giảm 30% thuế TNCN theo NQ 43/2026/QH16 & NĐ 398/2026/NĐ-CP áp dụng cho cá nhân cư trú có tổng doanh thu kinh doanh năm <= 10 tỷ đồng',
      ],
    };
  }

  if (revenue <= (r.thresholds.income_method_mandatory_vnd || 3_000_000_000)) {
    const known = frame.income_type.length === 1
      ? { GOODS_SALES: 'goods', MARKETPLACE_SALES: 'goods', SERVICE: 'service', FREELANCE_SERVICE: 'service', FOOD_SERVICE: 'food_service' }[frame.income_type[0].value as string]
      : undefined;
    if (!known) return null;
    const rateEntry = r.rates[known];
    const vatBefore = Math.round(revenue * rateEntry.vat_rate);
    const vatAfterNq204 = Math.round(vatBefore * 0.8);
    const pitBase = Math.max(0, revenue - r.thresholds.exemption_annual_vnd);
    const pitBefore = Math.round(pitBase * rateEntry.pit_rate);
    const pitAfter = eligibleNq43 ? Math.round(pitBefore * (1 - reliefRate)) : pitBefore;
    return {
      kind: 'CONDITIONAL_TURNOVER_LEDGER',
      year,
      sector: known,
      description: rateEntry.description,
      revenue_vnd: revenue,
      threshold_vnd: r.thresholds.exemption_annual_vnd,
      vat_base_vnd: revenue,
      vat_rate: rateEntry.vat_rate,
      vat_due_before_relief_vnd: vatBefore,
      vat_due_after_nq204_20pct_relief_vnd: vatAfterNq204,
      pit_base_after_1b_deduction_vnd: pitBase,
      pit_rate: rateEntry.pit_rate,
      pit_before_relief_vnd: pitBefore,
      pit_after_nq43_30pct_relief_vnd: eligibleNq43 ? pitAfter : null,
      conditions: [
        'Doanh thu năm trên 1 tỷ đến 3 tỷ đồng được chọn phương pháp tỷ lệ % trên doanh thu hoặc phương pháp thu nhập tính thuế (15% thu nhập tính thuế)',
        'GTGT tính trên toàn bộ doanh thu chịu thuế (không trừ 1 tỷ đồng); giảm 20% mức tỷ lệ GTGT theo NQ 204/2025 & NĐ 174/2025 nếu đủ điều kiện',
        'Giảm 30% TNCN theo NQ 43/2026 & NĐ 398/2026 áp dụng khi là cá nhân cư trú có doanh thu kinh doanh năm <= 10 tỷ đồng',
      ],
    };
  }
  return null;
}

/**
 * Multi-activity turnover ledger: the single annual allowance is allocated
 * deterministically to the highest PIT rate first (the optimal legal use),
 * VAT stays per activity. Mirrors the evaluator so the LLM path and the
 * deterministic path never produce two different allocations.
 */
export function multiActivityLedger(frame: TaxDecisionFrame) {
  const items = frame.facts.multi_activities;
  if (
    !items?.length ||
    items.length < 2 ||
    frame.tax_period.years.length !== 1 ||
    !['HOUSEHOLD_BUSINESS', 'INDIVIDUAL_BUSINESS'].includes(frame.taxpayer_type.value) ||
    frame.facts.revenue_basis !== 'ANNUAL' ||
    frame.facts.taxable_income_vnd !== undefined ||
    ['PROJECTED', 'PARTIAL_PERIOD', 'TRANSACTION'].includes(frame.semantic?.revenueContext || '')
  )
    return null;
  const year = frame.tax_period.years[0],
    r = getRulesetForYear(year);
  if (year < r.tax_year_range[0] || year > r.tax_year_range[1]) return null;
  const kindKey: Record<string, string> = {
    goods: 'goods',
    service: 'service',
    food_service: 'food_service',
    rental: 'property_rental',
    property_rental: 'property_rental',
    production_transport: 'production_transport',
    manufacturing: 'manufacturing',
    other: 'other_business',
    other_business: 'other_business',
  };
  const rows = [];
  for (const item of items) {
    const key = kindKey[item.kind];
    if (!key || !r.rates[key]) return null;
    if (!Number.isSafeInteger(item.revenueVnd) || item.revenueVnd < 0) return null;
    const vatRate = item.vatRate ?? r.rates[key].vat_rate,
      pitRate = item.pitRate ?? r.rates[key].pit_rate;
    if (vatRate !== r.rates[key].vat_rate || pitRate !== r.rates[key].pit_rate) return null;
    rows.push({
      id: item.id,
      kind: key,
      revenue_vnd: item.revenueVnd,
      vat_rate: vatRate,
      pit_rate: pitRate,
      allowance_vnd: 0,
      vat_due_vnd: 0,
      pit_before_relief_vnd: 0,
    });
  }
  const totalRevenue = rows.reduce((n, a) => n + a.revenue_vnd, 0);
  if (frame.facts.revenue_vnd !== undefined && frame.facts.revenue_vnd !== totalRevenue) return null;
  const exemption = r.thresholds.exemption_annual_vnd;
  const vatRelief =
    frame.facts.vat_relief_assumed && year <= (r.relief_policies?.nq204_vat_last_year || 2026)
      ? r.relief_policies?.nq204_vat_reduction_rate || 0
      : 0;
  let allowance = year >= 2026 && totalRevenue > exemption ? exemption : 0;
  for (const row of [...rows].sort((a, b) => b.pit_rate - a.pit_rate)) {
    row.allowance_vnd = Math.min(allowance, row.revenue_vnd);
    allowance -= row.allowance_vnd;
    row.vat_due_vnd =
      totalRevenue <= exemption && year >= 2026
        ? 0
        : Math.round(row.revenue_vnd * row.vat_rate * (1 - vatRelief));
    row.pit_before_relief_vnd =
      totalRevenue <= exemption && year >= 2026
        ? 0
        : Math.round((row.revenue_vnd - row.allowance_vnd) * row.pit_rate);
  }
  const vatDue = rows.reduce((n, a) => n + a.vat_due_vnd, 0),
    before = rows.reduce((n, a) => n + a.pit_before_relief_vnd, 0);
  const reliefRate = r.relief_policies?.nq43_pit_reduction_rate || 0;
  const reliefApplies =
    frame.residency.value === 'RESIDENT' &&
    reliefRate > 0 &&
    totalRevenue <= (r.thresholds.relief_max_revenue_vnd || 0);
  const reliefAmount = reliefApplies ? Math.round(before * reliefRate) : 0;
  return {
    kind: 'MULTI_ACTIVITY_LEDGER',
    year,
    total_revenue_vnd: totalRevenue,
    exemption_vnd: exemption,
    allocation_rule:
      'Phân bổ mức trừ một lần cho hoạt động có tỷ lệ TNCN cao hơn trước; GTGT tính riêng từng hoạt động, không dùng mức trừ.',
    rows,
    vat_due_vnd: vatDue,
    pit_before_relief_vnd: before,
    pit_relief_vnd: reliefAmount,
    pit_after_relief_vnd: before - reliefAmount,
    pit_after_if_eligible_vnd: frame.residency.value !== 'NON_RESIDENT' && reliefRate > 0 && totalRevenue <= (r.thresholds.relief_max_revenue_vnd || 0)
      ? before - Math.round(before * reliefRate) : undefined,
    relief_condition: reliefApplies
      ? 'Đã áp giảm theo giả định cá nhân cư trú đủ điều kiện NQ43.'
      : 'Chưa áp giảm NQ43 (chưa xác nhận cư trú/điều kiện hoặc vượt trần doanh thu).',
    citations: [r.citations.pit_law, r.citations.exemption, r.citations.pit_relief].filter(Boolean),
  };
}
