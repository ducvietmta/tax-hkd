// Reproduce the live A11 semantic labels and packing path, not an ideal topic.
const assert=require('node:assert/strict'),load=require('./lib/load_local_ts.cjs')();
const {resolveAnswerScope}=load('shared/taxScope.ts');
const {understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts');
const {retrieveSubrequests}=load('worker/src/decision/subrequests.ts');
const {mergeVectorHits}=load('worker/src/vectorRetriever.ts');
const {quarantineCandidates}=load('worker/src/recognition/sourcePolicy.ts');
const {filterAndGateEvidence}=load('worker/src/decision/evidenceGate.ts');
const {buildReviewContext}=load('worker/src/retriever.ts');
const {answerContract}=load('worker/src/decision/answerContract.ts');
const questions=['Cá nhân cho thuê nhà muốn đăng ký mã số thuế để tự kê khai trực tiếp trên cổng thuế điện tử thì làm sao?',
 'Tôi có nhà cho thuê tại nhiều tỉnh và muốn tự đăng ký thuế trực tuyến. Cơ quan nào tiếp nhận?'];
for(const q of questions)for(const topic of ['OTHER','SYSTEM_REGISTRATION','TAX_REGISTRATION']){
 const scope=resolveAnswerScope([],q,new Date('2026-11-09T05:00:00Z'));
 const labels={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'REGISTRATION',secondaryIntents:['PROCEDURE_HOWTO'],incomeTypes:['PROPERTY_RENTAL'],topic,answerPurpose:'PROCEDURE',subjectContext:'INDIVIDUAL_ACTIVITY',registrationStatus:'UNKNOWN',revenueContext:'UNSPECIFIED',policyFocus:'UNSPECIFIED',taxFocus:'unspecified',calculationShape:'UNSPECIFIED',methodContext:'UNSPECIFIED'};
 const frame=understandClassifiedQuery(q,scope,[],labels),plan=buildRetrievalPlan(frame);
 assert(plan.must_include_refs.includes('16.108'),'Authority evidence must depend on intent/activity, not topic');
 const sub=retrieveSubrequests(q,frame,scope,8);
 const pins=[...new Set([...plan.must_include_refs,...sub.plans.flatMap(p=>[...p.plan.must_include_refs,...p.refs.slice(0,1)])])];
 const rows=mergeVectorHits(sub.results,[{refId:'16.100',score:.99},{refId:'16.24',score:.98},{refId:'16.29',score:.97}],7,{query:q,years:scope.years,pinnedRefs:pins,allowedRefs:[...new Set(sub.plans.flatMap(p=>p.refs))],rrfK:60,wBm25:1,wDense:.6,minScore:.35});
 const clean=quarantineCandidates(rows,plan.must_include_refs);assert(!clean.results.some(r=>r.chunk.ref_id==='16.24'));
 const gate=filterAndGateEvidence(clean.results.map(r=>r.chunk),frame);
 const overhead=answerContract(labels).length+600;
 const budget=Math.min(12000,Math.max(6500,14000-overhead-800));
 const ctx=buildReviewContext(clean.results.filter(r=>gate.passedChunks.includes(r.chunk)),q,budget,Math.max(budget,20000-overhead-800),scope);
 assert(ctx.passages.some(p=>p.ref_id==='16.108'),'Found evidence must reach model');
 for(const phrase of ['Điều 21','Thuế cơ sở nơi có bất động sản','lựa chọn một cơ quan'])assert(ctx.text.includes(phrase),phrase);
 assert(answerContract(labels).includes('BAO PHỦ THỦ TỤC'),'OTHER must retain procedural coverage');
 assert(!ctx.missingRequiredRefs.includes('16.108'));
}
// Same registration intent must not pin rental law for a non-rental activity.
const scope=resolveAnswerScope([],questions[0],new Date('2026-11-09T05:00:00Z'));
const other=understandClassifiedQuery('Bán hàng online đăng ký thuế thế nào?',scope,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'REGISTRATION',secondaryIntents:[],incomeTypes:['GOODS_SALES'],topic:'OTHER',answerPurpose:'PROCEDURE'});
assert(!buildRetrievalPlan(other).must_include_refs.includes('16.108'));
console.log('PASS: live OTHER labels, two subrequests, dense fusion, quarantine and production context budgets preserve rental registration law; non-rental scope stays separate.');
