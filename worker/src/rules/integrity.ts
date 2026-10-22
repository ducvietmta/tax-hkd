import type { EvaluationResult } from './evaluator';
import type { TaxDecisionFrame } from '../decision/types';

const MONEY_FIELDS=['gross_revenue_vnd','effective_revenue_vnd','taxable_vat_revenue_vnd','vat_due_vnd','taxable_pit_revenue_vnd','pit_before_relief_vnd','pit_relief_vnd','pit_after_relief_vnd','total_tax_payable_vnd'] as const;
/** Arithmetic conservation is checked independently of the chosen legal rate. */
export function auditEvaluation(frame:TaxDecisionFrame,result:EvaluationResult):string[]{
  if(result.status!=='ANSWERED')return [];
  const issues:string[]=[];
  for(const key of MONEY_FIELDS)if(!Number.isSafeInteger(result[key])||result[key]<0)issues.push(`INVALID_MONEY:${key}`);
  if(![result.vat_rate,result.pit_rate].every(rate=>Number.isFinite(rate)&&rate>=0&&rate<=1))issues.push('INVALID_RATE');
  if(result.pit_before_relief_vnd!==result.pit_relief_vnd+result.pit_after_relief_vnd)issues.push('PIT_CONSERVATION');
  if(result.total_tax_payable_vnd!==result.vat_due_vnd+result.pit_after_relief_vnd)issues.push('TOTAL_CONSERVATION');
  const expectedRevenue=Math.max(0,(frame.facts.revenue_vnd??0)-(frame.facts.refund_deducted_vnd??0));
  if(result.effective_revenue_vnd!==expectedRevenue)issues.push('REVENUE_RECONCILIATION');
  if(result.activities?.length){
    const rows=result.activities;
    if(rows.reduce((sum,row)=>sum+row.revenue_vnd,0)!==result.effective_revenue_vnd)issues.push('ACTIVITY_REVENUE_SUM');
    if(rows.reduce((sum,row)=>sum+row.vat_due_vnd,0)!==result.vat_due_vnd)issues.push('ACTIVITY_VAT_SUM');
    if(rows.some(row=>row.allowance_vnd<0||row.allowance_vnd>row.revenue_vnd||!Number.isSafeInteger(row.allowance_vnd)))issues.push('ACTIVITY_ALLOWANCE');
    if(result.method==='REVENUE'&&rows.reduce((sum,row)=>sum+row.pit_before_relief_vnd,0)!==result.pit_before_relief_vnd)issues.push('ACTIVITY_PIT_SUM');
  }else if(Math.round(result.taxable_vat_revenue_vnd*result.vat_rate)!==result.vat_due_vnd)issues.push('VAT_BASE_RECONCILIATION');
  return issues;
}
export function unresolvedEvaluation(status:'NEEDS_INFO'|'NEEDS_LEGAL_REVIEW',explanation:string):EvaluationResult{
  return {status,explanation,ruleset_version:'UNRESOLVED',gross_revenue_vnd:0,effective_revenue_vnd:0,
    taxable_vat_revenue_vnd:0,vat_rate:0,vat_due_vnd:0,taxable_pit_revenue_vnd:0,pit_rate:0,
    pit_before_relief_vnd:0,pit_relief_vnd:0,pit_after_relief_vnd:0,total_tax_payable_vnd:0,
    rule_outcomes:[],citations:[]};
}
