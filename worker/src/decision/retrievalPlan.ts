/**
 * RETRIEVAL PLAN GENERATOR
 *
 * Xây dựng kế hoạch truy xuất cho RAG dựa trên TaxDecisionFrame,
 * thay thế các đoạn ghim mã ref_id thủ công rải rác trong code.
 * Module này KHÔNG import runtime (giữ tương thích test harness stub).
 */

import type { TaxDecisionFrame, RetrievalPlan } from './types';
import policyCatalog from '../kb/policyRetrievalIndex.json';
import chunkPeriods from '../kb/chunkMeta.json';
import { periodFits, type EffectiveInterval } from '../kb/periodApplicability';

interface PolicyEvidenceEntry {ref_id:string;policy_focus?:string[];eligibility_topics?:string[];revenue_contexts?:string[];topics?:string[];intents?:string[];subject_contexts?:string[];answer_purposes?:string[];income_types?:string[];tax_focuses?:string[];applies_from_year:number;applies_to_year:number|null;}
/** Pure metadata lookup: no document IDs, legal amounts or phrase matching. */
export function selectPolicyEvidence(frame:TaxDecisionFrame,catalog:PolicyEvidenceEntry[]=policyCatalog):string[]{
  const focus=frame.semantic?.policyFocus;
  const unspecified=!focus||focus==='UNSPECIFIED';
  // A multi-period question needs each period's evidence. Requiring one source
  // to govern every year discards both sides of a lawful comparison/transition.
  return catalog.filter(entry=>periodFits(entry,frame.tax_period))
    .filter(entry=>!entry.answer_purposes?.length||entry.answer_purposes.includes(frame.semantic?.answerPurpose||'OTHER'))
    .filter(entry=>!entry.income_types?.length||frame.income_type.some(t=>entry.income_types!.includes(t.value)))
    .filter(entry=>!entry.tax_focuses?.length||entry.tax_focuses.includes(frame.semantic?.taxFocus||'unspecified'))
    .filter(entry=>(!unspecified&&(focus==='MULTIPLE'||entry.policy_focus?.includes(focus)))||
      (unspecified&&frame.semantic?.answerPurpose==='ELIGIBILITY'&&entry.eligibility_topics?.includes(frame.semantic?.topic||''))||
      entry.revenue_contexts?.includes(frame.semantic?.revenueContext||'')||
      entry.topics?.includes(frame.semantic?.topic||'')||
      [frame.tax_intent?.primary.value,...(frame.tax_intent?.secondary||[])].some(intent=>!!intent&&entry.intents?.includes(intent))||
      entry.subject_contexts?.includes(frame.semantic?.subjectContext||''))
    .map(entry=>entry.ref_id);
}

export function buildRetrievalPlan(frame: TaxDecisionFrame): RetrievalPlan {
  const plan = topicRetrievalPlan(frame);
  const refs=selectPolicyEvidence(frame);
  return alignPlanPeriod({...plan,must_include_refs:[...new Set([...refs,...plan.must_include_refs])],
    ...(plan.allowed_refs?{allowed_refs:[...new Set([...refs,...plan.allowed_refs])]}:{})},frame.tax_period);
}

/** A semantic topic is a search hint, not permission to search only the wrong
 * legal period. If its entire source family is inapplicable, reopen lexical
 * search within the requested period instead of treating that as absent law. */
export function alignPlanPeriod(plan:RetrievalPlan,period:{years:number[];event_date?:string},catalog:Record<string,EffectiveInterval>=chunkPeriods):RetrievalPlan{
  const fits=(ref:string)=>!catalog[ref]||periodFits(catalog[ref],period);
  const must_include_refs=plan.must_include_refs.filter(fits);
  if(!plan.allowed_refs)return {...plan,must_include_refs};
  const allowed_refs=plan.allowed_refs.filter(fits);
  if(plan.allowed_refs.length&&!allowed_refs.length){
    const {allowed_refs:excluded,...rest}=plan;
    return {...rest,strategy:'ROUTE_FIRST',must_include_refs,period_fallback:true};
  }
  return {...plan,must_include_refs,allowed_refs};
}

function topicRetrievalPlan(frame: TaxDecisionFrame): RetrievalPlan {
  const mustIncludeRefs: string[] = [];
  const boostKeywords: string[] = [];
  const years = frame.tax_period.years;
  const isHistorical = frame.tax_period.is_historical;
  const topic = frame.semantic?.topic;
  // Fiscal history must be resolved before topic-specific early returns. A
  // revenue/ownership label must not restrict a 2025 question to 2026 sources.
  if(isHistorical&&['TAX_AMOUNT','REVENUE_THRESHOLD','REVENUE_OWNERSHIP','REVENUE_COMPOSITION'].includes(topic||'')){
    const relief=years.includes(2025)&&(frame.facts.vat_relief_assumed||frame.tax_intent.primary.value==='RELIEF_REDUCTION'||frame.tax_intent.secondary.includes('RELIEF_REDUCTION'));
    return {
    strategy:'PINNED_REFS',semantic_topic:topic,must_include_refs:['16.54',...(relief?['16.50']:[])],
    allowed_refs:['16.54','16.60',...(relief?['16.50']:[])],filter_years:years,
    filter_taxpayer_types:[frame.taxpayer_type.value],boost_keywords:[],
  };}
  if(frame.semantic?.answerPurpose==='DEFINITION')return {
    strategy:'ROUTE_FIRST',semantic_topic:'CONCEPT_EXPLANATION',must_include_refs:[],
    filter_years:years,filter_taxpayer_types:[frame.taxpayer_type.value],boost_keywords:['khái niệm','định nghĩa'],
  };
  // Semantic families bound evidence; ranking within them stays query-driven.
  const operationalEvidence: Record<string,string[]> = {
    BUSINESS_SUSPENSION:['16.110','16.109'],
    TAX_REGISTRATION_CHANGE:['16.111','16.113','16.9','16.96','16.152'],
    TAX_STATUS_RESTORATION:['16.112','16.25','16.109','16.115'],
    TAX_PAYMENT_RECONCILIATION:['16.120','16.121','16.51','16.24','16.55','16.59','16.145','16.147','16.150','16.151'],
    TAX_EXTENSION:['16.123','16.146'],
    TAXPAYER_RIGHTS:['16.122','16.125','16.126','16.127','16.128','16.145','16.147','16.148','16.149','16.150','16.151','16.152','16.153'],
    ACCOUNTING_RETENTION:['16.124','16.52','16.71','16.127'],
    INVOICE_USAGE:['16.80','16.103','16.114','16.115','16.116','16.117','16.118','16.119','16.38','16.41','16.105',...Array.from({length:10},(_,i)=>`16.${129+i}`)],
  };
  if (!isHistorical && topic && operationalEvidence[topic]) {
    const refs=operationalEvidence[topic];
    return {strategy:'ROUTE_FIRST',semantic_topic:topic,allowed_refs:refs,
      must_include_refs:refs.length===1 ? refs.slice(0,1) : [],
      filter_years:years,filter_taxpayer_types:[frame.taxpayer_type.value],boost_keywords:[]};
  }
  // The semantic provider selects the lifecycle operation, not keyword rules.
  if (topic === 'BUSINESS_CESSATION' && !isHistorical) {
    return { strategy:'PINNED_REFS', semantic_topic:topic,
      allowed_refs:['16.109'], must_include_refs:['16.109'], filter_years:years,
      filter_taxpayer_types:[frame.taxpayer_type.value], boost_keywords:[] };
  }
  // PIT-only calculations still need the rate table, method/transition rule and
  // turnover allowance, but VAT-relief examples must not displace those rules.
  if (!isHistorical && topic === 'TAX_AMOUNT' && frame.semantic?.taxFocus === 'pit') {
    return { strategy:'PINNED_REFS', semantic_topic:topic,
      allowed_refs:['16.56','16.77','16.39','16.40','16.48','16.101','16.102','16.37','16.95','16.44','16.60','16.57','16.72'],
      must_include_refs:['16.56','16.77','16.39','16.40'], filter_years:years,
      filter_taxpayer_types:[frame.taxpayer_type.value],boost_keywords:[] };
  }
  if(!isHistorical&&topic==='TAX_AMOUNT'&&frame.semantic?.taxFocus==='vat'){
    return {strategy:'PINNED_REFS',semantic_topic:topic,
      allowed_refs:['16.104','16.77','16.50','16.44','16.37','16.101','16.99'],
      must_include_refs:frame.tax_intent.primary.value==='RELIEF_REDUCTION'?['16.50','16.104','16.77']:['16.104','16.77'],
      filter_years:years,filter_taxpayer_types:[frame.taxpayer_type.value],boost_keywords:[]};
  }
  if (topic === 'INVOICE_CORRECTION' && frame.semantic?.invoicePeriod === 'H1_2026' && years.length === 1 && years[0] === 2026) {
    return { strategy:'PINNED_REFS',semantic_topic:topic,allowed_refs:['16.106'],must_include_refs:['16.106'],filter_years:years,
      filter_taxpayer_types:[frame.taxpayer_type.value],boost_keywords:[] };
  }
  if(topic==='INVOICE_CORRECTION'&&frame.semantic?.invoicePeriod==='H2_2026'&&years.length===1&&years[0]===2026)return {
    strategy:'PINNED_REFS',semantic_topic:topic,allowed_refs:['16.103'],must_include_refs:['16.103'],
    filter_years:years,filter_taxpayer_types:[frame.taxpayer_type.value],boost_keywords:[],
  };
  // A transaction amount cannot establish annual thresholds. Supply the
  // method/base distinction even when the semantic topic is broader.
  if (topic === 'TAX_AMOUNT' && frame.semantic?.revenueContext === 'TRANSACTION') {
    return { strategy: 'PINNED_REFS', semantic_topic: 'VAT_METHOD_CLASSIFICATION',
      allowed_refs: ['16.104', '16.77', '16.31', '16.50'],
      must_include_refs: ['16.104', '16.77'], filter_years: years,
      filter_taxpayer_types: [frame.taxpayer_type.value], boost_keywords: [] };
  }
  const topicEvidence: Record<string, string[]> = {
    PLATFORM_WITHHOLDING:['16.35','16.42','16.95','16.48','16.57'],
    REFUND:['16.51','16.86','16.145','16.35','16.42'],
    REVENUE_COMPOSITION: ['16.32', '16.37', '16.72', '16.101', '16.102'],
    REVENUE_TIMING: ['16.101', '16.30', '16.37', '16.72', '16.43', '16.102','16.130','16.131','16.132','16.133','16.134'],
    REVENUE_OWNERSHIP: ['16.39', '16.75', '16.72', '16.8', '16.7', '16.9', '16.35', '16.37', '16.41', '16.105'],
    VAT_METHOD_CLASSIFICATION: ['16.104', '16.31', '16.50', '16.77', '16.16', '16.37'],
    BUSINESS_EXPENSES: ['16.102', '16.19', '16.52', '16.57', '16.56',...Array.from({length:6},(_,i)=>`16.${139+i}`)],
    INVOICE_CORRECTION: ['16.103', '16.106', '16.21', '16.18', '16.17', '16.42'],
    INVOICE_REGISTRATION: ['16.41', '16.105', '16.103', '16.80', '16.38', '16.58', '16.79', '16.24','16.138'],
    BUSINESS_REGISTRATION: ['16.107', '16.73', '16.20', '16.7', '16.8'],
    TAX_REGISTRATION: ['16.113', '16.96', '16.108', '16.64', '16.107', '16.65', '16.9', '16.25'],
    REGISTRATION_COMPARISON: ['16.108', '16.64', '16.107', '16.7'],
    REGISTRATION_REQUIREMENTS: ['16.108', '16.107', '16.64', '16.73', '16.20'],
    SYSTEM_REGISTRATION: ['16.100', '16.96', '16.12', '16.9', '16.108', '16.64', '16.65', '16.25', '16.41', '16.105', '16.58', '16.7', '16.8', '16.107', '16.29', '16.91', '16.38'],
    PORTAL_TROUBLESHOOTING: ['16.24', '16.55', '16.59', '16.105', '16.103', '16.106', '16.25', '16.100', '16.12', '16.9', '16.96', '16.41', '16.21','16.137'],
    TAX_SOFTWARE_SYSTEM: ['16.100', '16.12', '16.9', '16.55', '16.52', '16.40', '16.24', '16.96', '16.44', '16.71', '16.51', '16.41', '16.38', '16.105'],
    REVENUE_THRESHOLD: ['16.60', '16.72', '16.44', '16.23', '16.53', '16.41', '16.105', '16.38'],
  };
  if (topic && topicEvidence[topic]) {
    const refs = [...topicEvidence[topic]];
    // Với SYSTEM_REGISTRATION / PORTAL_TROUBLESHOOTING / TAX_SOFTWARE_SYSTEM:
    // để BM25/Route chọn các chunk khớp nhất trong tập allowed_refs thay vì luôn ghim cứng 2 chunk đầu nếu câu hỏi hỏi thủ tục khác.
    if (['SYSTEM_REGISTRATION', 'PORTAL_TROUBLESHOOTING', 'TAX_SOFTWARE_SYSTEM'].includes(topic)) {
      const dynamicPins: string[] = [];
      if (topic === 'SYSTEM_REGISTRATION') {
        if (frame.tax_intent.primary.value === 'TAX_ID_888') dynamicPins.push('16.100', '16.96');
        else if (frame.tax_intent.secondary.includes('E_INVOICE')) dynamicPins.push('16.41', '16.105');
        else if (frame.income_type.some(t => t.value === 'PROPERTY_RENTAL')) dynamicPins.push('16.108', '16.29');
        else dynamicPins.push('16.64', '16.108');
      } else if (topic === 'PORTAL_TROUBLESHOOTING') {
        if (frame.tax_intent.secondary.includes('E_INVOICE')) dynamicPins.push('16.103', '16.105', '16.24');
        else dynamicPins.push('16.24', '16.55');
      } else if (topic === 'TAX_SOFTWARE_SYSTEM') {
        if (frame.tax_intent.secondary.includes('ACCOUNTING_BOOKS')) dynamicPins.push('16.52', '16.71');
        else dynamicPins.push('16.100', '16.55');
      }
      return {
        strategy: 'ROUTE_FIRST',
        semantic_topic: topic,
        allowed_refs: refs,
        must_include_refs: dynamicPins,
        filter_years: years,
        filter_taxpayer_types: [frame.taxpayer_type.value],
        boost_keywords: [],
      };
    }
    // Câu hỏi đăng ký không liên quan affiliate: ưu tiên 16.7 (một cá nhân
    // một HKD) và 16.8 (mỗi người một HKD) ở vị trí ghim thay vì chunk
    // affiliate 16.73 gây nhiễu.
    if (topic === 'BUSINESS_REGISTRATION' && !frame.income_type.some((t) =>
        t.value === 'AFFILIATE_COMMISSION' || t.value === 'CONTENT_ADS')) {
      for (const ref of ['16.73','16.20']) {
        const index=refs.indexOf(ref); if(index!==-1) refs.splice(index,1);
      }
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
    if (topic === 'REVENUE_THRESHOLD' && frame.semantic?.revenueContext === 'PARTIAL_PERIOD') refs.unshift('16.101');
    if (topic === 'REVENUE_TIMING' && frame.income_type.some(x => x.value === 'WAGE_SALARY')) refs.push('16.93');
    return { strategy: 'PINNED_REFS', semantic_topic: topic, allowed_refs: refs,
      must_include_refs: refs.slice(0, topic === 'VAT_METHOD_CLASSIFICATION' || relief || ['BUSINESS_REGISTRATION', 'TAX_REGISTRATION', 'REGISTRATION_COMPARISON', 'REGISTRATION_REQUIREMENTS'].includes(topic) ? 3 : 2), filter_years: years,
      filter_taxpayer_types: [frame.taxpayer_type.value], boost_keywords: [] };
  }

  if (!isHistorical && (frame.tax_intent.primary.value === 'TAX_CALCULATION' ||
      frame.tax_intent.primary.value === 'RELIEF_REDUCTION')) {
    mustIncludeRefs.push('16.77');
    mustIncludeRefs.push('16.56');

  }

  // 1. Ghim các ref bắt buộc theo quy định thời kỳ
  if (isHistorical || years.includes(2025)) {
    mustIncludeRefs.push('16.54'); // Ngưỡng 100tr TT40
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
