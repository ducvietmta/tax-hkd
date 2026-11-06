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

/**
 * Multi-activity turnover ledger: the single annual allowance is allocated
 * deterministically to the highest PIT rate first (the optimal legal use),
 * VAT stays per activity. Mirrors the evaluator so the LLM path and the
 * deterministic path never produce two different allocations.
 */
export function multiActivityLedger(frame:TaxDecisionFrame){
 const items=frame.facts.multi_activities;
 if(!items?.length||items.length<2||frame.tax_period.years.length!==1||
   !['HOUSEHOLD_BUSINESS','INDIVIDUAL_BUSINESS'].includes(frame.taxpayer_type.value)||
   frame.facts.revenue_basis!=='ANNUAL'||frame.facts.taxable_income_vnd!==undefined||
   ['PROJECTED','PARTIAL_PERIOD','TRANSACTION'].includes(frame.semantic?.revenueContext||''))return null;
 const year=frame.tax_period.years[0],r=getRulesetForYear(year);
 if(year<r.tax_year_range[0]||year>r.tax_year_range[1])return null;
 const kindKey:Record<string,string>={goods:'goods',service:'service',food_service:'food_service',rental:'property_rental',property_rental:'property_rental',production_transport:'production_transport',other:'other_business',other_business:'other_business'};
 const rows=[];
 for(const item of items){
   const key=kindKey[item.kind]; if(!key||!r.rates[key])return null;
   if(!Number.isSafeInteger(item.revenueVnd)||item.revenueVnd<0)return null;
   const vatRate=item.vatRate??r.rates[key].vat_rate, pitRate=item.pitRate??r.rates[key].pit_rate;
   if(vatRate!==r.rates[key].vat_rate||pitRate!==r.rates[key].pit_rate)return null;
   rows.push({id:item.id,kind:key,revenue_vnd:item.revenueVnd,vat_rate:vatRate,pit_rate:pitRate,allowance_vnd:0,vat_due_vnd:0,pit_before_relief_vnd:0});
 }
 const totalRevenue=rows.reduce((n,a)=>n+a.revenue_vnd,0);
 if(frame.facts.revenue_vnd!==undefined&&frame.facts.revenue_vnd!==totalRevenue)return null;
 const exemption=r.thresholds.exemption_annual_vnd;
 const vatRelief=frame.facts.vat_relief_assumed&&year<=(r.relief_policies?.nq204_vat_last_year||2026)?(r.relief_policies?.nq204_vat_reduction_rate||0):0;
 let allowance=year>=2026&&totalRevenue>exemption?exemption:0;
 for(const row of [...rows].sort((a,b)=>b.pit_rate-a.pit_rate)){
   row.allowance_vnd=Math.min(allowance,row.revenue_vnd); allowance-=row.allowance_vnd;
   row.vat_due_vnd=totalRevenue<=exemption&&year>=2026?0:Math.round(row.revenue_vnd*row.vat_rate*(1-vatRelief));
   row.pit_before_relief_vnd=totalRevenue<=exemption&&year>=2026?0:Math.round((row.revenue_vnd-row.allowance_vnd)*row.pit_rate);
 }
 const vatDue=rows.reduce((n,a)=>n+a.vat_due_vnd,0), before=rows.reduce((n,a)=>n+a.pit_before_relief_vnd,0);
 const reliefRate=r.relief_policies?.nq43_pit_reduction_rate||0;
 const reliefApplies=frame.residency.value==='RESIDENT'&&reliefRate>0&&totalRevenue<=(r.thresholds.relief_max_revenue_vnd||0);
 const reliefAmount=reliefApplies?Math.round(before*reliefRate):0;
 return {kind:'MULTI_ACTIVITY_LEDGER',year,total_revenue_vnd:totalRevenue,exemption_vnd:exemption,
   allocation_rule:'Phân bổ mức trừ một lần cho hoạt động có tỷ lệ TNCN cao hơn trước; GTGT tính riêng từng hoạt động, không dùng mức trừ.',
   rows,vat_due_vnd:vatDue,pit_before_relief_vnd:before,
   pit_relief_vnd:reliefAmount,pit_after_relief_vnd:before-reliefAmount,
   relief_condition:reliefApplies?'Đã áp giảm theo giả định cá nhân cư trú đủ điều kiện NQ43.':'Chưa áp giảm NQ43 (chưa xác nhận cư trú/điều kiện hoặc vượt trần doanh thu).',
   citations:[r.citations.pit_law,r.citations.exemption,r.citations.pit_relief].filter(Boolean)};
}
