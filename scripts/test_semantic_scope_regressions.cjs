/* Offline only. Inject native verdicts; do not claim live model accuracy. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const modules=new Map();function load(file){file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';if(modules.has(file))return modules.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}const m={exports:{}};modules.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);modules.set(file,m.exports);return m.exports;}
let apiCalls=0;global.fetch=()=>{apiCalls++;throw Error('NETWORK_FORBIDDEN');};
const {understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts'),{resolveAnswerScope}=load('shared/taxScope.ts');
const {buildRetrievalPlan,selectPolicyEvidence}=load('worker/src/decision/retrievalPlan.ts'),{retrieve,buildContext}=load('worker/src/retriever.ts');
const {answerContract}=load('worker/src/decision/answerContract.ts'),{canUseVerifiedAnswer}=load('worker/src/answerValidation.ts');
const {evaluateScopeAssessment,SCOPE_CHECKS}=load('worker/src/decision/scopeAssessment.ts');
const {JevDecisionProvider}=load('worker/src/decision/jevProvider.ts');
const suite=JSON.parse(fs.readFileSync('tests/fixtures/tax-hkd-191.json','utf8'));
const base={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'EXEMPTION_ELIGIBILITY',secondaryIntents:[],incomeTypes:['UNKNOWN'],answerPurpose:'ELIGIBILITY',revenueContext:'UNSPECIFIED',taxFocus:'unspecified',calculationShape:'COMPOSITE',methodContext:'UNSPECIFIED'};
const rows=[];
function probe(message,sem){const scope=resolveAnswerScope([],message,new Date('2026-10-21T05:00:00+07:00'));const frame=understandClassifiedQuery(message,scope,[],sem);const plan=buildRetrievalPlan(frame);const found=retrieve(message,6,scope,plan);return {frame,plan,context:buildContext(found.results,message,9000,scope)};}
for(const topic of ['REVENUE_THRESHOLD','REVENUE_OWNERSHIP','REVENUE_COMPOSITION','TAX_AMOUNT']){
 for(const primaryIntent of ['EXEMPTION_ELIGIBILITY','RELIEF_REDUCTION','OTHER_TAX']){
  const sem={...base,topic,primaryIntent,policyFocus:'PIT_RELIEF'};
  const x=probe(suite.cases.find(c=>c.id==='G163').input.message,sem);
  assert(x.context.includedRefs.includes('16.39'));
  assert(x.context.text.includes('[RANH GIỚI CHÍNH SÁCH]'));
  assert(!canUseVerifiedAnswer('question','Fixed answer mentioning NQ43',undefined,sem,true));
  // Replace the entire catalog with arbitrary refs/labels: no source ID is coded.
  const f={...x.frame,semantic:{...x.frame.semantic,policyFocus:'A_NEW_POLICY'}};
  assert.deepEqual(selectPolicyEvidence(f,[{ref_id:'new-ref',policy_focus:['A_NEW_POLICY'],applies_from_year:2026,applies_to_year:2028}]),['new-ref']);
  assert.deepEqual(selectPolicyEvidence(f,[{ref_id:'future',policy_focus:['A_NEW_POLICY'],applies_from_year:2027,applies_to_year:null}]),[]);
  rows.push({topic,primaryIntent,passed:true});
 }
}
for(const topic of ['REVENUE_THRESHOLD','REVENUE_OWNERSHIP']){
 const x=probe(suite.cases.find(c=>c.id==='G018').input.message,{...base,topic});
 assert(x.context.includedRefs.includes('16.39'));assert(x.plan.must_include_refs.includes('16.60'));
 assert(!answerContract({...base,topic}).includes('10 tỷ'));
}
for(const revenueContext of ['PROJECTED','PARTIAL_PERIOD']){
 const sem={...base,topic:'REVENUE_THRESHOLD',revenueContext};
 const x=probe(suite.cases.find(c=>c.id==='G034').input.message,sem);
 assert(x.context.text.includes('[VAI TRÒ SỐ LIỆU]'));
 assert(!canUseVerifiedAnswer('question','Any fixed wording',undefined,sem,true));
}
const native=()=>Object.fromEntries(Object.keys(SCOPE_CHECKS).map(key=>[key,{type:'choice',choice:'SUPPORTED',confidence:.99}]));
assert.equal(evaluateScopeAssessment(native()).status,'PASS');
for(const key of Object.keys(SCOPE_CHECKS)){
 for(const choice of ['CONTRADICTED','INCOMPLETE']){
  const decisions=native();decisions[key]={type:'choice',choice,confidence:.99};
  assert.deepEqual(evaluateScopeAssessment(decisions).issues,[key]);
 }
 const uncertain=native();uncertain[key].confidence=.3;assert.equal(evaluateScopeAssessment(uncertain).status,'UNAVAILABLE');
 const malformed=native();malformed[key].choice='MADE_UP';assert.equal(evaluateScopeAssessment(malformed).status,'UNAVAILABLE');
}
assert.equal(evaluateScopeAssessment(null).status,'UNAVAILABLE');
async function main(){
 const provider=new JevDecisionProvider('offline');let verdicts=native(),captured;
 provider.ask=async(state,questions)=>{captured={state,questions};return verdicts;};
 const question='Chỉ có số ước lượng; nghĩa vụ cuối kỳ thế nào?';
 for(const answer of ['Dữ kiện hiện tại chỉ phục vụ lập kế hoạch, chưa xác nhận kết quả cả năm.','Chưa có số chốt kỳ nên cần đối chiếu sổ thực tế trước khi kết luận.']){
  const result=await provider.assessAnswerScope(question,answer,'Nguồn có điều kiện theo kỳ.',[],base);
  assert.equal(result.status,'PASS');assert.equal(captured.state.answer,answer);
 }
 verdicts=native();verdicts.fact_roles={type:'choice',choice:'CONTRADICTED',confidence:.99};
 assert.equal((await provider.assessAnswerScope(question,'Nếu chưa đủ dữ liệu, nhưng bạn đã chắc chắn có nghĩa vụ ngay.','Nguồn có điều kiện theo kỳ.',[],base)).status,'REPAIR');
 // A negation/conditional word cannot override a negative semantic verdict.
 assert(!fs.readFileSync('worker/src/answerValidation.ts','utf8').includes('answerScopeIssues'));
 const checker=fs.readFileSync('worker/src/decision/scopeAssessment.ts','utf8');
 assert(!checker.includes('RegExp'));assert(!checker.includes('.test('));assert(!checker.includes('16.39'));assert(!checker.includes('10 tỷ'));
 assert.equal(apiCalls,0);
 fs.mkdirSync('outputs/semantic-scope-fix-2026-10-21',{recursive:true});
 fs.writeFileSync('outputs/semantic-scope-fix-2026-10-21/offline.json',JSON.stringify({rows,apiCalls,passed:true,limitations:'Native semantic verdicts mocked. Tests establish plumbing and scope handling, not live LLM accuracy.'},null,2));
 console.log('PASS metadata-driven routing; source boundaries; native semantic verdicts, uncertainty and malformed responses; no answer-keyword gate; zero API calls.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
