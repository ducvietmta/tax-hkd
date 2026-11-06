// Root-cause regressions. Synthetic labels exercise routing; no live model score is claimed.
const fs=require('node:fs'),assert=require('node:assert/strict');
const load=require('./lib/load_local_ts.cjs')();
const planning=load('worker/src/decision/retrievalPlan.ts'),scope=load('shared/taxScope.ts'),understand=load('worker/src/decision/understandQuery.ts'),retrieval=load('worker/src/retriever.ts');
const {resolveCalculations}=load('worker/src/decision/arithmetic.ts');
const oldFetch=global.fetch;global.fetch=()=>{throw Error('NETWORK_DISABLED');};
const frame={tax_period:{years:[2026]},tax_intent:{primary:{value:'OTHER_TAX'},secondary:[]},income_type:[],semantic:{policyFocus:'MULTIPLE',topic:'OTHER',subjectContext:'INDIVIDUAL_ACTIVITY'}};
const catalog=[{ref_id:'opaque-A',policy_focus:['PIT_RELIEF'],applies_from_year:2026,applies_to_year:2027},{ref_id:'opaque-B',subject_contexts:['INDIVIDUAL_ACTIVITY'],topics:['REGISTRATION'],applies_from_year:2026,applies_to_year:2027},{ref_id:'opaque-C',required:false,topics:['OTHER'],applies_from_year:2026,applies_to_year:2027}];
assert.deepEqual(planning.selectPolicyEvidence(frame,catalog),[],'Umbrella policy and subject facets must not make unrelated sources mandatory');
assert.deepEqual(planning.selectPolicyCandidates(frame,catalog).map(r=>r.ref_id),['opaque-C']);
assert.deepEqual(planning.selectPolicyEvidence({...frame,semantic:{...frame.semantic,policyFocus:'PIT_RELIEF'}},catalog),['opaque-A']);
assert.deepEqual(planning.selectPolicyEvidence({...frame,tax_period:{years:[2025]}},catalog),[]);
assert.deepEqual(planning.selectPolicyEvidence({...frame,semantic:{...frame.semantic,topic:'REGISTRATION',subjectContext:'HOUSEHOLD_FORM'}},catalog),[]);
const constrained=[{ref_id:'opaque-procedure',policy_focus:['PIT_RELIEF'],required_intents:['PROCEDURE_HOWTO'],applies_from_year:2026,applies_to_year:2027}];
const relief={...frame,semantic:{...frame.semantic,policyFocus:'PIT_RELIEF'}};
assert.deepEqual(planning.selectPolicyEvidence(relief,constrained),[],'Policy alone must not pin procedural sources');
assert.deepEqual(planning.selectPolicyEvidence({...relief,tax_intent:{primary:{value:'OTHER_TAX'},secondary:['PROCEDURE_HOWTO']}},constrained),['opaque-procedure']);
assert.deepEqual(planning.selectPolicyEvidence({...frame,tax_intent:{primary:{value:'PROCEDURE_HOWTO'},secondary:[]}},constrained),[],'Procedure alone must not activate an unrelated policy');
const outputs=[];
for(const [topic,focus,revenueContext] of [['TAX_AMOUNT','both','ACTUAL_YEAR'],['PLATFORM_WITHHOLDING','pit','ACTUAL_YEAR'],['REVENUE_TIMING','both','ACTUAL_YEAR'],['REVENUE_THRESHOLD','pit','PROJECTED']]){
 const query='NQ43 NQ204 doanh thu kinh doanh va khoan tax',s={...scope.resolveAnswerScope([],query,new Date('2026-10-30T05:00:00Z')),years:[2026]};
 const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'TAX_CALCULATION',secondaryIntents:['PLATFORM_WITHHOLDING','RELIEF_REDUCTION'],incomeTypes:['AFFILIATE_COMMISSION'],topic,subjectContext:'INDIVIDUAL_ACTIVITY',revenueContext,taxFocus:focus,answerPurpose:'OTHER',policyFocus:'MULTIPLE',calculationShape:'SINGLE'};
 const f=understand.understandClassifiedQuery(query,s,[],semantic),plan=planning.buildRetrievalPlan(f),hits=retrieval.retrieve(query,8,s,plan),ctx=retrieval.buildReviewContext(hits.results,query,9000,16000,s);
 assert.deepEqual(ctx.missingRequiredRefs,[],topic);assert(ctx.text.length<=16800);for(const ref of ['16.97','16.154','16.155','16.173'])assert(!plan.must_include_refs.includes(ref));
 outputs.push({topic,required:plan.must_include_refs,missing:ctx.missingRequiredRefs,contextLength:ctx.text.length});
}
// A source/excerpt limited to one side of a period comparison remains usable for that side.
const compareQuery='So sánh nghĩa vụ bán hàng năm 2025 và 2026 với cùng doanh thu';
const s=scope.resolveAnswerScope([],compareQuery,new Date('2026-10-30T05:00:00Z'));
const comparisonFrame=understand.understandClassifiedQuery(compareQuery,s,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'COMPARE_PERIODS',secondaryIntents:['TAX_CALCULATION'],incomeTypes:['GOODS_SALES'],topic:'TAX_AMOUNT',taxFocus:'both',answerPurpose:'OTHER',revenueContext:'ACTUAL_YEAR'});
const hits=retrieval.retrieve(compareQuery,8,s,planning.buildRetrievalPlan(comparisonFrame)),ctx=retrieval.buildReviewContext(hits.results,compareQuery,9000,18000,s);
assert.deepEqual(ctx.missingRequiredRefs,[]);assert(ctx.includedRefs.includes('16.54')&&ctx.includedRefs.includes('16.77'));
const source=load('worker/src/ragEngine.ts').CANONICAL_CHUNKS.find(c=>c.ref_id==='16.77');assert(ctx.passages.some(p=>p.ref_id==='16.77'&&p.text===source.context_passage));
// Arithmetic comparisons have no tax thresholds, methods or case IDs in code.
for(const [a,b] of [['7319','11413'],['11413','7319'],['7319','7319'],['(7319-14000)','-1'],['1/3','0.333333333333333333333333']]){
 const marker='[[COMPARE:'+JSON.stringify({left:{label:'Phương án A',expression:a},right:{label:'Phương án B',expression:b},unit:'VND',evidence_ids:['E1']})+']]';
 const r=resolveCalculations(marker,['E1']);assert.deepEqual(r.issues,[]);assert.equal(r.comparisons.length,1);assert(!r.text.includes('[[COMPARE:'));
 const swapped=resolveCalculations('[[COMPARE:'+JSON.stringify({left:{label:'Phương án B',expression:b},right:{label:'Phương án A',expression:a},unit:'VND',evidence_ids:['E1']})+']]', ['E1']);
 assert.equal(swapped.comparisons[0].relation,{LT:'GT',GT:'LT',EQ:'EQ'}[r.comparisons[0].relation]);
}
const invalid=resolveCalculations('[[COMPARE:'+JSON.stringify({left:{label:'A',expression:'1'},right:{label:'B',expression:'2'},unit:'VND',evidence_ids:['invented']})+']]', ['E1']);assert(invalid.issues.includes('CALCULATION_EVIDENCE_REQUIRED'));
const calc=resolveCalculations('[[CALC:{"expression":"7319+11413","unit":"VND","evidence_ids":["E1"]}]]',['E1']);assert.equal(calc.records[0].numerator,'18732');
fs.mkdirSync('outputs/systematic-fixes-2026-11-02',{recursive:true});fs.writeFileSync('outputs/systematic-fixes-2026-11-02/context-after.json',JSON.stringify(outputs,null,2));
global.fetch=oldFetch;console.log(JSON.stringify({passed:true,contextReproductions:outputs,mixedPeriodPacking:'PASS',exactComparisons:'PASS',networkCalls:0}));
