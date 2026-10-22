/**
 * RULES EVALUATOR
 *
 * Đánh giá một TaxDecisionFrame bằng ruleset tương ứng với năm tính thuế.
 * Thay thế việc hardcode ngưỡng, tỷ lệ trong taxEngine.ts.
 */

import type { TaxDecisionFrame, RuleOutcome } from '../decision/types';
import type { TaxRuleset, CitationRef } from './types';
import { getRulesetForYear } from './registry';
import { auditEvaluation, unresolvedEvaluation } from './integrity';

const cite = (ref: CitationRef): string => [ref.point, ref.clause, ref.article, ref.name].filter(Boolean).join(' ');

export interface EvaluationResult {
  method?:'INCOME'|'REVENUE';
  activities?:Array<{id:string;revenue_vnd:number;allowance_vnd:number;vat_rate:number;vat_due_vnd:number;pit_rate:number;pit_before_relief_vnd:number}>;
  status: 'ANSWERED' | 'NEEDS_INFO' | 'NEEDS_LEGAL_REVIEW';
  ruleset_version: string;
  gross_revenue_vnd: number;
  effective_revenue_vnd: number;
  taxable_vat_revenue_vnd: number;
  vat_rate: number;
  vat_due_vnd: number;
  taxable_pit_revenue_vnd: number;
  pit_rate: number;
  pit_before_relief_vnd: number;
  pit_relief_vnd: number;
  pit_after_relief_vnd: number;
  total_tax_payable_vnd: number;
  rule_outcomes: RuleOutcome[];
  citations: string[];
  explanation: string;
}

function evaluateUncheckedFrame(frame: TaxDecisionFrame): EvaluationResult {
  const taxYear = frame.tax_period.years[0] || 2026;
  const ruleset: TaxRuleset = getRulesetForYear(taxYear);

  const grossRevenue = frame.facts.revenue_vnd || 0;
  let effectiveRevenue = grossRevenue;
  if (frame.facts.refund_deducted_vnd && frame.facts.refund_deducted_vnd > 0) {
    effectiveRevenue = Math.max(0, effectiveRevenue - frame.facts.refund_deducted_vnd);
  }

  // 1. Never apply a registered ruleset outside its effective tax years.
  if (taxYear < ruleset.tax_year_range[0] || taxYear > ruleset.tax_year_range[1]) {
    return {
      status: 'NEEDS_LEGAL_REVIEW',
      ruleset_version: ruleset.version,
      gross_revenue_vnd: grossRevenue,
      effective_revenue_vnd: effectiveRevenue,
      taxable_vat_revenue_vnd: 0,
      vat_rate: 0,
      vat_due_vnd: 0,
      taxable_pit_revenue_vnd: 0,
      pit_rate: 0,
      pit_before_relief_vnd: 0,
      pit_relief_vnd: 0,
      pit_after_relief_vnd: 0,
      total_tax_payable_vnd: 0,
      rule_outcomes: [],
      citations: [],
      explanation: `Chưa có bộ quy tắc đã xác minh cho kỳ tính thuế năm ${taxYear}.`,
    };
  }

  // A revenue-based PIT rate is never a substitute for the mandatory income
  // method.  Keep the VAT calculation available, but do not finalize PIT.
  const mandatoryIncomeThreshold = ruleset.thresholds.income_method_mandatory_vnd;
  if (mandatoryIncomeThreshold && effectiveRevenue > mandatoryIncomeThreshold &&
      (frame.facts.taxable_income_vnd === undefined ||
       !Number.isSafeInteger(frame.facts.taxable_income_vnd) ||
       frame.facts.taxable_income_vnd < 0)) {
    return {
      status: 'NEEDS_INFO', ruleset_version: ruleset.version,
      gross_revenue_vnd: grossRevenue, effective_revenue_vnd: effectiveRevenue,
      taxable_vat_revenue_vnd: effectiveRevenue, vat_rate: 0, vat_due_vnd: 0,
      taxable_pit_revenue_vnd: 0, pit_rate: 0, pit_before_relief_vnd: 0,
      pit_relief_vnd: 0, pit_after_relief_vnd: 0, total_tax_payable_vnd: 0,
      rule_outcomes: [], citations: [ruleset.citations.pit_law?.name || ruleset.citations.exemption.name],
      explanation: 'Doanh thu vượt ngưỡng áp dụng phương pháp tính TNCN theo thu nhập; cần thu nhập tính thuế hợp lệ trước khi chốt số thuế.',
    };
  }

  const exemptionThreshold = ruleset.thresholds.exemption_annual_vnd;
  const isResident = frame.residency.value === 'RESIDENT';

  if(effectiveRevenue>exemptionThreshold&&frame.facts.pit_method_elected==='INCOME'){
    if(ruleset.pit_income_rates?.tier1_voluntary===undefined)return unresolvedEvaluation('NEEDS_LEGAL_REVIEW','Chưa có quy tắc đã cấu hình cho phương pháp theo thu nhập được yêu cầu trong kỳ này.');
    if(frame.facts.taxable_income_vnd===undefined)return unresolvedEvaluation('NEEDS_INFO','Bạn chọn phương pháp theo thu nhập; cần thu nhập tính thuế hợp lệ, không tự đổi sang tỷ lệ trên doanh thu.');
  }

  // 2. Dưới hoặc bằng ngưỡng miễn thuế
  if (effectiveRevenue <= exemptionThreshold) {
    const outcome: RuleOutcome = {
      rule_id: `${ruleset.ruleset_id}.EXEMPTION`,
      ruleset_version: ruleset.version,
      outcome_code: 'EXEMPT',
      params_used: {
        threshold: { value: exemptionThreshold, param_ref: 'thresholds.exemption_annual_vnd' },
      },
      citations: [
        { doc_id: ruleset.citations.exemption.doc_id, article: ruleset.citations.exemption.article,
          clause: ruleset.citations.exemption.clause },
      ],
      status: 'ANSWERED',
    };

    return {
      status: 'ANSWERED',
      ruleset_version: ruleset.version,
      gross_revenue_vnd: grossRevenue,
      effective_revenue_vnd: effectiveRevenue,
      taxable_vat_revenue_vnd: 0,
      vat_rate: 0,
      vat_due_vnd: 0,
      taxable_pit_revenue_vnd: 0,
      pit_rate: 0,
      pit_before_relief_vnd: 0,
      pit_relief_vnd: 0,
      pit_after_relief_vnd: 0,
      total_tax_payable_vnd: 0,
      rule_outcomes: [outcome],
      citations: [cite(ruleset.citations.exemption)],
      explanation: `Doanh thu năm ${taxYear} từ ${exemptionThreshold >= 1e9 ? exemptionThreshold / 1e9 + ' tỷ' : exemptionThreshold / 1e6 + ' triệu'} đồng trở xuống thuộc diện không phải nộp thuế GTGT và thuế TNCN.`,
    };
  }

  if(frame.facts.multi_activities?.length){
    const activities=frame.facts.multi_activities;
    const valid=activities.every(a=>['goods','service'].includes(a.kind)&&Number.isSafeInteger(a.revenueVnd)&&a.revenueVnd>=0&&
      (a.vatRate===undefined||a.vatRate===ruleset.rates[a.kind].vat_rate)&&(a.pitRate===undefined||a.pitRate===ruleset.rates[a.kind].pit_rate))&&
      activities.reduce((n,a)=>n+a.revenueVnd,0)===effectiveRevenue&&!frame.facts.refund_deducted_vnd;
    if(valid){
      const base=evaluateDecisionFrame({...frame,income_type:[{value:activities[0].kind==='goods'?'GOODS_SALES':'SERVICE',source:'inferred',confidence:1}],facts:{...frame.facts,multi_activities:undefined}});
      if(base.status==='ANSWERED'){
        let allowance=taxYear>=2026?exemptionThreshold:0;
        const relief=frame.facts.vat_relief_assumed&&taxYear<=(ruleset.relief_policies?.nq204_vat_last_year||2026)?ruleset.relief_policies?.nq204_vat_reduction_rate||0:0;
        const rows=activities.map(a=>{const config=ruleset.rates[a.kind];return{id:a.id,revenue_vnd:a.revenueVnd,allowance_vnd:0,vat_rate:config.vat_rate*(1-relief),vat_due_vnd:0,pit_rate:config.pit_rate,pit_before_relief_vnd:0};});
        for(const row of [...rows].sort((a,b)=>b.pit_rate-a.pit_rate)){
          row.allowance_vnd=base.method==='INCOME'?0:Math.min(allowance,row.revenue_vnd);allowance-=row.allowance_vnd;
          row.vat_due_vnd=Math.round(row.revenue_vnd*row.vat_rate);
          row.pit_before_relief_vnd=Math.round((row.revenue_vnd-row.allowance_vnd)*row.pit_rate);
        }
        const vatDue=rows.reduce((n,a)=>n+a.vat_due_vnd,0);
        const before=base.method==='INCOME'?base.pit_before_relief_vnd:rows.reduce((n,a)=>n+a.pit_before_relief_vnd,0);
        const reliefAmount=isResident&&effectiveRevenue<=(ruleset.thresholds.relief_max_revenue_vnd||0)?Math.round(before*(ruleset.relief_policies?.nq43_pit_reduction_rate||0)):0;
        const after=before-reliefAmount,total=vatDue+after;
        const outcome={...base.rule_outcomes[0],rule_id:`${ruleset.ruleset_id}.MULTI_ACTIVITY_CALC`,amounts_vnd:{vat_due:vatDue,pit_before_relief:before,pit_relief:reliefAmount,pit_after_relief:after,total_payable:total}};
        return {...base,activities:rows,vat_due_vnd:vatDue,pit_before_relief_vnd:before,pit_relief_vnd:reliefAmount,pit_after_relief_vnd:after,total_tax_payable_vnd:total,rule_outcomes:[outcome],explanation:`Kết quả đa hoạt động bằng code: GTGT ${vatDue}; TNCN trước giảm ${before}; sau giảm ${after}.`};
      }
    }
  }
  // 3. Trên ngưỡng miễn thuế
  // Xác định ngành nghề chính
  const incomeType = frame.income_type[0]?.value || 'UNKNOWN';
  if (incomeType === 'UNKNOWN' || incomeType === 'AFFILIATE_COMMISSION' || incomeType === 'OTHER' ||
      frame.facts.revenue_basis !== 'ANNUAL' || frame.facts.multi_activities?.length) {
    return {
      status: 'NEEDS_INFO', ruleset_version: ruleset.version,
      gross_revenue_vnd: grossRevenue, effective_revenue_vnd: effectiveRevenue,
      taxable_vat_revenue_vnd: 0, vat_rate: 0, vat_due_vnd: 0,
      taxable_pit_revenue_vnd: 0, pit_rate: 0, pit_before_relief_vnd: 0,
      pit_relief_vnd: 0, pit_after_relief_vnd: 0, total_tax_payable_vnd: 0,
      rule_outcomes: [], citations: [],
      explanation: 'Cần xác định ngành và doanh thu năm theo từng hoạt động trước khi chốt tỷ lệ thuế.',
    };
  }
  let sectorKey = 'goods';
  if (incomeType === 'FOOD_SERVICE') sectorKey = 'food_service';
  else if (incomeType === 'SERVICE' || incomeType === 'FREELANCE_SERVICE') sectorKey = 'service';
  else if (incomeType === 'PROPERTY_RENTAL') sectorKey = 'property_rental';

  const rateConfig = ruleset.rates[sectorKey] || ruleset.rates.goods;
  let vatRate = frame.facts.vat_rate_explicit ?? rateConfig.vat_rate;
  let pitRate = rateConfig.pit_rate;

  // Giảm thuế VAT theo NQ 204 nếu có
  const nq204Rate = ruleset.relief_policies?.nq204_vat_reduction_rate ?? 0;
  const vatReliefApplies = !!frame.facts.vat_relief_assumed && !!nq204Rate &&
    taxYear <= (ruleset.relief_policies?.nq204_vat_last_year || 2026);
  if (vatReliefApplies) {
    vatRate = Math.round(vatRate * (1 - nq204Rate) * 1e6) / 1e6;
  }

  // Phương pháp tính thuế TNCN (Doanh thu hay Thu nhập)
  const isIncomeMethodMandatory =
    ruleset.thresholds.income_method_mandatory_vnd &&
    effectiveRevenue > ruleset.thresholds.income_method_mandatory_vnd;
  const isVoluntaryIncomeMethod =
    !isIncomeMethodMandatory &&
    frame.facts.pit_method_elected === 'INCOME' &&
    frame.facts.taxable_income_vnd !== undefined &&
    Number.isSafeInteger(frame.facts.taxable_income_vnd) &&
    frame.facts.taxable_income_vnd >= 0;

  let pitBeforeRelief = 0;
  let taxablePitRevenue = effectiveRevenue;

  if (isIncomeMethodMandatory) {
    const incomeRate = effectiveRevenue > (ruleset.thresholds.income_method_tier2_vnd || Number.MAX_SAFE_INTEGER)
      ? ruleset.pit_income_rates?.tier3_high
      : ruleset.pit_income_rates?.tier2_mandatory;
    if (incomeRate === undefined) throw new Error('Missing income-method PIT rate in ruleset');
    pitRate = incomeRate;
    pitBeforeRelief = Math.round(frame.facts.taxable_income_vnd! * incomeRate);
    taxablePitRevenue = frame.facts.taxable_income_vnd!;
  } else if (isVoluntaryIncomeMethod) {
    const voluntaryRate = ruleset.pit_income_rates!.tier1_voluntary!;
    pitRate = voluntaryRate;
    taxablePitRevenue = frame.facts.taxable_income_vnd!;
    pitBeforeRelief = Math.round(taxablePitRevenue * voluntaryRate);
  } else if (taxYear >= 2026) {
    // Năm 2026: Thuế TNCN tính trên phần doanh thu vượt 1 tỷ đồng (Luật 109/2025/QH15)
    taxablePitRevenue = Math.max(0, effectiveRevenue - exemptionThreshold);
    pitBeforeRelief = Math.round(taxablePitRevenue * pitRate);
  } else {
    // Năm 2025: Thuế tính trên toàn bộ doanh thu (Thông tư 40/2021/TT-BTC)
    taxablePitRevenue = effectiveRevenue;
    pitBeforeRelief = Math.round(effectiveRevenue * pitRate);
  }

  const vatDue = Math.round(effectiveRevenue * vatRate);

  // Áp dụng giảm 30% TNCN theo NQ 43/2026/QH16 nếu đủ điều kiện
  let pitRelief = 0;
  const reliefRate = ruleset.relief_policies?.nq43_pit_reduction_rate || 0;
  const maxReliefRevenue = ruleset.thresholds.relief_max_revenue_vnd || 10_000_000_000;

  if (isResident && effectiveRevenue <= maxReliefRevenue && reliefRate > 0) {
    pitRelief = Math.round(pitBeforeRelief * reliefRate);
  }

  const pitAfterRelief = Math.max(0, pitBeforeRelief - pitRelief);
  const totalTaxPayable = vatDue + pitAfterRelief;

  const focus = frame.semantic?.taxFocus;
  const supportingRefs = [ruleset.citations.exemption,
    ...(focus !== 'pit' ? [ruleset.citations.vat_rates] : []),
    ...(focus !== 'vat' ? [ruleset.citations.pit_law || ruleset.citations.amendment] : [])];
  const citations: string[] = supportingRefs.map(cite);
  if (focus !== 'vat' && pitRelief > 0 && ruleset.citations.pit_relief) {
    supportingRefs.push(ruleset.citations.pit_relief);
    citations.push(cite(ruleset.citations.pit_relief));
  }
  if (focus !== 'pit' && vatReliefApplies && ruleset.citations.vat_relief) {
    supportingRefs.push(ruleset.citations.vat_relief);
    citations.push(cite(ruleset.citations.vat_relief));
  }

  const outcome: RuleOutcome = {
    rule_id: `${ruleset.ruleset_id}.TURNOVER_CALC`,
    ruleset_version: ruleset.version,
    outcome_code: 'TAX_CALCULATED',
    amounts_vnd: {
      vat_due: vatDue,
      pit_before_relief: pitBeforeRelief,
      pit_relief: pitRelief,
      pit_after_relief: pitAfterRelief,
      total_payable: totalTaxPayable,
    },
    params_used: {
      vat_rate: { value: vatRate, param_ref: frame.facts.vat_rate_explicit !== undefined ? 'user.vat_rate_explicit' : `rates.${sectorKey}.vat_rate` },
      pit_rate: { value: pitRate, param_ref: `rates.${sectorKey}.pit_rate` },
    },
    citations: supportingRefs.map(ref => ({ doc_id: ref.doc_id, article: ref.article, clause: ref.clause, point: ref.point })),
    status: 'ANSWERED',
  };

  return {
    status: 'ANSWERED',
    method:isIncomeMethodMandatory||isVoluntaryIncomeMethod?'INCOME':'REVENUE',
    ruleset_version: ruleset.version,
    gross_revenue_vnd: grossRevenue,
    effective_revenue_vnd: effectiveRevenue,
    taxable_vat_revenue_vnd: effectiveRevenue,
    vat_rate: vatRate,
    vat_due_vnd: vatDue,
    taxable_pit_revenue_vnd: taxablePitRevenue,
    pit_rate: pitRate,
    pit_before_relief_vnd: pitBeforeRelief,
    pit_relief_vnd: pitRelief,
    pit_after_relief_vnd: pitAfterRelief,
    total_tax_payable_vnd: totalTaxPayable,
    rule_outcomes: [outcome],
    citations,
    explanation: `Tổng thuế phải nộp: ${totalTaxPayable.toLocaleString('vi-VN')} đ (GTGT: ${vatDue.toLocaleString('vi-VN')} đ, TNCN: ${pitAfterRelief.toLocaleString('vi-VN')} đ).`,
  };
}

/**
 * Đánh giá đa năm khi câu hỏi so sánh giữa nhiều kỳ thuế (ví dụ 2025 vs 2026)
 */
export function evaluateMultiYear(
  frame: TaxDecisionFrame
): Record<number, EvaluationResult> {
  const results: Record<number, EvaluationResult> = {};
  const years = frame.tax_period.years;

  for (const year of years) {
    const singleYearFrame: TaxDecisionFrame = {
      ...frame,
      tax_period: {
        ...frame.tax_period,
        years: [year],
        is_historical: year < 2026,
      },
    };
    results[year] = evaluateDecisionFrame(singleYearFrame);
  }

  return results;
}

/** No missing year/revenue may silently become 2026/zero and an exemption. */
export function evaluateDecisionFrame(frame:TaxDecisionFrame):EvaluationResult{
  if(frame.tax_period.years.length!==1||!Number.isInteger(frame.tax_period.years[0]))return unresolvedEvaluation('NEEDS_LEGAL_REVIEW','Cần xác định riêng một kỳ tính thuế trước khi áp dụng bộ quy tắc.');
  if(frame.facts.revenue_vnd===undefined)return unresolvedEvaluation('NEEDS_INFO','Chưa có doanh thu để tính; không coi thiếu dữ kiện là doanh thu bằng không.');
  const money=[frame.facts.revenue_vnd,frame.facts.refund_deducted_vnd,frame.facts.taxable_income_vnd,
    ...(frame.facts.multi_activities||[]).map(item=>item.revenueVnd)].filter(value=>value!==undefined);
  if(money.some(value=>!Number.isSafeInteger(value)||value! < 0))return unresolvedEvaluation('NEEDS_INFO','Số tiền cần là số nguyên đồng không âm, trong phạm vi tính toán chính xác.');
  const rate=frame.facts.vat_rate_explicit;
  if(rate!==undefined&&(!Number.isFinite(rate)||rate<0||rate>1))return unresolvedEvaluation('NEEDS_INFO','Cần xác định lại tỷ lệ GTGT hợp lệ.');
  const result=evaluateUncheckedFrame(frame),issues=auditEvaluation(frame,result);
  if(issues.length){
    console.warn('[CALCULATION_INTEGRITY]',JSON.stringify({issues}));
    return unresolvedEvaluation('NEEDS_LEGAL_REVIEW','Kết quả chưa vượt qua kiểm tra tính nhất quán; không phát hành số thuế cuối cùng.');
  }
  return result;
}

