const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();function load(file){file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);cache.set(file,m.exports);return m.exports;}
global.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};
const {resolveAnswerScope}=load('shared/taxScope.ts'),{understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {buildRetrievalPlan,alignPlanPeriod}=load('worker/src/decision/retrievalPlan.ts');
const {retrieve,buildContext}=load('worker/src/retriever.ts'),{mergeVectorHits}=load('worker/src/vectorRetriever.ts');
const {filterAndGateEvidence}=load('worker/src/decision/evidenceGate.ts');
const {retrieveSubrequests}=load('worker/src/decision/subrequests.ts');
const cases=[
 'Năm 2025 tôi bán hàng 280 triệu, giờ 2026 mới hỏi: nghĩa vụ năm đó thế nào?',
 'Tổng tiền bán hàng năm 2024 của tôi là 350 triệu. Bây giờ hỏi lại phải đóng thuế thế nào?',
 'Doanh thu bán hàng cả năm 2023 là 90 triệu. Tôi cần biết nghĩa vụ cho năm đó.',
];
const rows=[];
for(const message of cases)for(const topic of ['REVENUE_TIMING','REVENUE_THRESHOLD','TAX_AMOUNT','OTHER','REVENUE_OWNERSHIP','REVENUE_COMPOSITION']){
 const scope=resolveAnswerScope([],message,new Date('2026-10-21T12:00:00Z'));
 const frame=understandClassifiedQuery(message,scope,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['GOODS_SALES'],topic,answerPurpose:'OTHER',taxFocus:'unspecified',revenueContext:'UNSPECIFIED',calculationShape:'SINGLE'});
 const plan=buildRetrievalPlan(frame),initial=retrieve(message,4,scope,plan);
 const merged=mergeVectorHits(initial.results,[{refId:'16.101',score:.99},{refId:'16.77',score:.98}],6,{years:scope.years,allowedRefs:plan.allowed_refs,pinnedRefs:plan.must_include_refs});
 const passed=filterAndGateEvidence(merged.map(r=>r.chunk),frame).passedChunks;
 const context=buildContext(merged.filter(r=>passed.includes(r.chunk)),message,9000,scope);
 assert(context.includedRefs.includes('16.54'),`${topic}/${scope.years}: historical tax source missing`);
 for(const s of ['100 triệu','1%','0,5%'])assert(context.text.includes(s));
 assert(!context.includedRefs.includes('16.77'));assert(!context.includedRefs.includes('16.101'));
 if(topic==='REVENUE_TIMING')assert(plan.period_fallback||plan.must_include_refs.includes('16.54'),'Applicable metadata or period recovery must preserve the historical source');
 const requests=[...frame.requests,{...frame.requests[0],id:'another-request'}];
 const sub=retrieveSubrequests(message,{...frame,requests},scope,6);
 assert(sub.results.some(r=>r.chunk.ref_id==='16.54'));
 rows.push({years:scope.years,topic,periodFallback:!!plan.period_fallback,refs:context.includedRefs});
}
// Opaque source IDs prove recovery is a period invariant, not a tax-case patch.
const p={strategy:'PINNED_REFS',must_include_refs:['new-law'],allowed_refs:['new-law'],filter_years:[2018],boost_keywords:[]};
const recovered=alignPlanPeriod(p,{years:[2018]},{'new-law':{applies_from_year:2020}});
assert.equal(recovered.allowed_refs,undefined);assert.deepEqual(recovered.must_include_refs,[]);assert(recovered.period_fallback);
assert.deepEqual(alignPlanPeriod(p,{years:[2021]},{'new-law':{applies_from_year:2020}}),p);
assert.deepEqual(alignPlanPeriod({...p,allowed_refs:[]},{years:[2018]},{}).allowed_refs,[],'An intentional empty allow-list stays empty');
assert.equal(alignPlanPeriod(p,{years:[2026],event_date:'2026-02-01'},{'new-law':{effective_from:'2026-07-01'}}).period_fallback,true);
fs.mkdirSync('outputs/historical-evidence-fix-2026-10-21',{recursive:true});
fs.writeFileSync('outputs/historical-evidence-fix-2026-10-21/offline.json',JSON.stringify({rows,apiCalls:0,scope:'Retrieval/fusion/gating/context only; not live answer scoring'},null,2));
console.log(`PASS ${rows.length} historical wording/topic combinations, fusion/subrequests, opaque IDs and date boundary; zero API calls.`);
