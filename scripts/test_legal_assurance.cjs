const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return{default:v,...v};}const module={exports:{}};cache.set(file,module.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+(id.endsWith('.json')?'':'.ts'))),module,module.exports);cache.set(file,module.exports);return module.exports;}
const integrity=load('worker/src/decision/reviewIntegrity.ts'),grounding=load('worker/src/decision/claimGrounding.ts');
const {JevDecisionProvider}=load('worker/src/decision/jevProvider.ts');
const {understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {evaluateDecisionFrame}=load('worker/src/rules/evaluator.ts');
const {auditEvaluation}=load('worker/src/rules/integrity.ts');
const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'TAX_CALCULATION',secondaryIntents:['RELIEF_REDUCTION'],incomeTypes:['SERVICE'],topic:'TAX_AMOUNT',taxFocus:'both',revenueContext:'ACTUAL_YEAR'};
const question='Năm 2026 cá nhân cư trú dịch vụ doanh thu 4 tỷ, thu nhập tính thuế hợp lệ 500 triệu.';
const frame=understandClassifiedQuery(question,{years:[2026],today:'2026-10-20',periodSource:'current_message'},[],semantic);
const request={...frame.requests[0],id:'R1',period:{...frame.requests[0].period,years:[2026]}};
const source={schema:'taxhkd-evidence-v1',chunk_id:'source1',ref_id:'16.1',metadata_state:'REGISTERED',legal_status:'VERIFIED_CONDITIONAL',applies_from_year:2026,applies_to_year:2027};
const packet={requests:[request],passages:[{id:'E1',ref_id:'16.1',text:'Nguồn A',request_ids:['R1'],provenance:source}],claims:[{id:'C1',kind:'CLAIM',text:'Kết luận A',mapping:'PROPOSED',evidence_ids:['E1'],ref_ids:['16.1'],request_ids:['R1']}]};
const clone=value=>JSON.parse(JSON.stringify(value));
(async()=>{
 assert.deepEqual(integrity.auditGrounding(packet),[]);
 for(const [change,code]of [
  [p=>p.claims[0].evidence_ids=['E999'],'UNKNOWN_REFERENCE'],
  [p=>p.claims[0].ref_ids=['16.2'],'SOURCE_ID_MISMATCH'],
  [p=>p.passages.push(clone(p.passages[0])),'DUPLICATE_ID'],
  [p=>p.passages[0].provenance.applies_to_year=2025,'PERIOD_MISMATCH'],
  [p=>p.passages[0].provenance.legal_status='SUPERSEDED','UNTRUSTED_SOURCE_METADATA'],
  [p=>p.passages[0].request_ids=['R2'],'REQUEST_SOURCE_MISMATCH'],
  [p=>p.claims[0].mapping='UNMAPPED','UNMAPPED'],
 ]){const bad=clone(packet);change(bad);assert(integrity.auditGrounding(bad).some(i=>i.code===code),code);assert.equal(grounding.verifiedClaimSubset(bad,{C1:{choice:'COMPLETE',confidence:1}}),'');}
 for(const issues of [null,['coverage:INCOMPLETE'],['citations:INCOMPLETE'],['evidence:UNCERTAIN'],['claim_C1:LOW_CONFIDENCE']])assert.equal(integrity.canReleaseReviewedAnswer(issues),false);
 assert(integrity.canReleaseReviewedAnswer([]));
 const key=await integrity.reviewContextKey(question,'Nguồn A',[],semantic,packet);
 const prior={...packet.claims[0],choice:'COMPLETE',confidence:1,context_key:key};
 assert(integrity.canReuseClaimReview(packet.claims[0],prior,key));
 for(const changed of [{...packet,requests:[{...request,period:{...request.period,years:[2025]}}]},{...packet,passages:[{...packet.passages[0],text:'Nguồn B'}]}])assert.notEqual(await integrity.reviewContextKey(question,'Nguồn A',[],semantic,changed),key);
 assert.notEqual(await integrity.reviewContextKey(question+' sửa dữ kiện','Nguồn A',[],semantic,packet),key);
 assert(!integrity.canReuseClaimReview(packet.claims[0],{...prior,request_ids:['R2']},key));
 // Even an overly positive model cannot certify mechanically invalid evidence.
 const native=require('./fixtures/jev_native.cjs'),original=global.fetch;let asked;
 global.fetch=async(_url,init)=>{const input=JSON.parse(init.body);asked=input.questions;return Response.json(native(input,'IN_SCOPE',semantic));};
 try{
  const reviewer=new JevDecisionProvider('fixture');
  assert.deepEqual(await reviewer.reviewAnswer(question,'Kết luận A','Nguồn A',[],semantic,packet),[]);
  const signed={...prior,context_key:reviewer.lastReviewContextKey};
  await reviewer.reviewAnswer(question,'Kết luận A','Nguồn A',[],semantic,packet,{C1:signed});assert(!asked.claim_C1);
  await reviewer.reviewAnswer(question,'Kết luận A','Nguồn B',[],semantic,packet,{C1:signed});assert(asked.claim_C1,'Changed evidence requires fresh claim review');
  const bad=clone(packet);bad.passages[0].provenance.applies_to_year=2025;
  const issues=await reviewer.reviewAnswer(question,'Kết luận A','Nguồn A',[],semantic,bad);assert(issues.includes('claim_C1:INCOMPLETE'));assert.equal(reviewer.lastReviewClaims.C1.choice,'INCOMPLETE');
 }finally{global.fetch=original;}
 let samples=0,seed=20261020;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 const boundaries=[0,1,99999999,100000000,100000001,999999999,1000000000,1000000001,2999999999,3000000000,3000000001,9999999999,10000000000,10000000001,49999999999,50000000000,50000000001];
 for(let i=0;i<12000;i++){
  const revenue=i<boundaries.length?boundaries[i]:random()*20;
  const year=[2025,2026,2027][i%3],resident=i%2===0;
  const input={...frame,tax_period:{...frame.tax_period,years:[year]},residency:{...frame.residency,value:resident?'RESIDENT':'NON_RESIDENT'},facts:{...frame.facts,revenue_vnd:revenue,refund_deducted_vnd:0,taxable_income_vnd:Math.floor(revenue/4),vat_relief_assumed:i%4===0,multi_activities:undefined}};
  const result=evaluateDecisionFrame(input);assert.equal(result.status,'ANSWERED');assert.deepEqual(auditEvaluation(input,result),[]);
  assert(result.pit_after_relief_vnd<=result.pit_before_relief_vnd);
  if(!resident||year===2025||revenue>10000000000)assert.equal(result.pit_relief_vnd,0);
  const varied=evaluateDecisionFrame({...input,facts:{...input.facts,taxable_income_vnd:Math.floor(revenue/8)}});
  assert.equal(varied.vat_due_vnd,result.vat_due_vnd,'PIT income must not change VAT revenue basis');samples++;
 }
 for(const value of [undefined,-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.notEqual(evaluateDecisionFrame({...frame,facts:{...frame.facts,revenue_vnd:value}}).status,'ANSWERED');
 assert.notEqual(evaluateDecisionFrame({...frame,tax_period:{...frame.tax_period,years:[]}}).status,'ANSWERED');
 assert.notEqual(evaluateDecisionFrame({...frame,tax_period:{...frame.tax_period,years:[2028]}}).status,'ANSWERED');
 assert.equal(evaluateDecisionFrame({...frame,facts:{...frame.facts,revenue_vnd:1500000000,pit_method_elected:'INCOME',taxable_income_vnd:undefined}}).status,'NEEDS_INFO','Do not silently switch an elected income method to turnover');
 assert.equal(evaluateDecisionFrame({...frame,tax_period:{...frame.tax_period,years:[2025]},facts:{...frame.facts,revenue_vnd:1500000000,pit_method_elected:'INCOME',taxable_income_vnd:300000000}}).status,'NEEDS_LEGAL_REVIEW','A missing historical income rate must not become a default 15%');
 const result=evaluateDecisionFrame(frame);assert(auditEvaluation(frame,{...result,total_tax_payable_vnd:result.total_tax_payable_vnd+1}).includes('TOTAL_CONSERVATION'));
 const ruleset=JSON.parse(fs.readFileSync('worker/src/rules/rulesets/hkd_2026.json','utf8'));
 const relation=JSON.parse(fs.readFileSync('worker/src/kb/legalRelations.json','utf8')).relations[0];
 for(const [configured,expected]of [[ruleset.citations.e_invoice,relation.target],[ruleset.citations.e_invoice_amendment,relation.source]]){
  assert.equal(configured.doc_id,expected.doc_id);assert.equal(configured.article,expected.article);assert.equal(configured.clause,expected.clause);
 }
 const summary={schema:'taxhkd-assurance-tests-v1',arithmetic_samples:samples,metamorphic_vat_checks:samples,live_api_calls:0,formal_proof:false,legal_accuracy_certified:false};
 fs.mkdirSync('outputs/legal-assurance',{recursive:true});fs.writeFileSync('outputs/legal-assurance/tests.json',JSON.stringify(summary,null,2));
 console.log('PASS: provenance/period tampering, fail-closed release, context-bound claim reuse, '+samples+' arithmetic invariant samples and '+samples+' independent VAT-base perturbations. Model mocked; not a proof of legal correctness.');
})().catch(error=>{console.error(error);process.exitCode=1;});
