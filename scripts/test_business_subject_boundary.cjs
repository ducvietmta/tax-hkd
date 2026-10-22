const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();function load(file){file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);cache.set(file,m.exports);return m.exports;}
let calls=0;global.fetch=()=>{calls++;throw Error('NETWORK_FORBIDDEN');};
const {JevDecisionProvider}=load('worker/src/decision/jevProvider.ts'),{understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {resolveAnswerScope}=load('shared/taxScope.ts'),{buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts');
const {retrieve,buildContext}=load('worker/src/retriever.ts'),{filterAndGateEvidence,isSubjectCompatible}=load('worker/src/decision/evidenceGate.ts');
const {CANONICAL_CHUNKS}=load('worker/src/ragEngine.ts'),{answerContract}=load('worker/src/decision/answerContract.ts');
const {SUBJECT_SCOPE_POLICY}=load('worker/src/decision/registrationScope.ts'),{SCOPE_CHECKS,evaluateScopeAssessment}=load('worker/src/decision/scopeAssessment.ts');
const native=require('./fixtures/jev_native.cjs'),cases=JSON.parse(fs.readFileSync('tests/fixtures/business-subject-boundary.json','utf8')).cases;
const provider=new JevDecisionProvider('offline');const rows=[];let current;
provider.ask=async(state,questions)=>native({state,questions},'IN_SCOPE',current).answers;
async function main(){for(const c of cases){
 current={taxpayer:c.subjectContext==='HOUSEHOLD_FORM'?'HOUSEHOLD_BUSINESS':'INDIVIDUAL_BUSINESS',primaryIntent:'REGISTRATION',secondaryIntents:[],incomeTypes:['GOODS_SALES'],topic:c.topic,subjectContext:c.subjectContext,registrationStatus:c.registrationStatus,answerPurpose:c.answerPurpose||'PROCEDURE'};
 const classified=await provider.classifyBusiness(c.message,c.history||[]);
 assert(classified,c.id+' classification fixture must be valid');
 assert.equal(classified.subjectContext,c.subjectContext);
 assert.equal(classified.registrationStatus,c.registrationStatus==='UNKNOWN'?undefined:c.registrationStatus);
 const scope=resolveAnswerScope(c.history||[],c.message,new Date('2026-10-21T12:00:00Z'));
 // Deliberately inject an incorrect broad household label: it cannot certify form.
 const frame=understandClassifiedQuery(c.message,scope,c.history||[],{...classified,taxpayer:'HOUSEHOLD_BUSINESS'});
 if(c.subjectContext==='INDIVIDUAL_ACTIVITY')assert.equal(frame.taxpayer_type.value,'INDIVIDUAL_BUSINESS');
 const plan=buildRetrievalPlan(frame),found=retrieve(c.message,8,scope,plan);
 const passed=filterAndGateEvidence(found.results.map(r=>r.chunk),frame).passedChunks;
 const context=buildContext(found.results.filter(r=>passed.includes(r.chunk)),c.message,12000,scope,c.answerPurpose);
 assert(context.includedRefs.includes('16.154'),'Boundary source must reach context');
 const household=CANONICAL_CHUNKS.find(c=>c.ref_id==='16.7');
 if(c.subjectContext==='INDIVIDUAL_ACTIVITY'){
  assert(!isSubjectCompatible(household,frame));assert(!context.includedRefs.includes('16.7'));assert(!context.includedRefs.includes('16.155'));
 }
 if(c.subjectContext==='HOUSEHOLD_FORM'||c.subjectContext==='COMPARISON')assert(isSubjectCompatible(household,frame));
 assert(answerContract(classified).includes(SUBJECT_SCOPE_POLICY));
 rows.push({id:c.id,refs:context.includedRefs,registrationStatus:frame.semantic.registrationStatus||'UNKNOWN',passed:true});
}
const mixed=CANONICAL_CHUNKS.find(c=>c.ref_id==='16.108');
const directUnknown=understandClassifiedQuery('synthetic',{years:[2026],today:'2026-10-21',periodSource:'current_message'},[],{taxpayer:'HOUSEHOLD_BUSINESS',primaryIntent:'REGISTRATION',secondaryIntents:[],incomeTypes:['UNKNOWN'],registrationStatus:'DIRECT_TAX_ONLY'});
assert.equal(directUnknown.taxpayer_type.value,'INDIVIDUAL_BUSINESS');assert(!isSubjectCompatible(CANONICAL_CHUNKS.find(c=>c.ref_id==='16.7'),directUnknown));
assert(CANONICAL_CHUNKS.find(c=>c.ref_id==='16.154').text.includes('08-MST'));
assert(!mixed.text.includes('[MỞ THÊM ĐỊA ĐIỂM KINH DOANH]'));assert(!mixed.text.includes('[TẠM NGỪNG KINH DOANH]'));
assert(CANONICAL_CHUNKS.find(c=>c.ref_id==='16.155').text.includes('[MỞ THÊM ĐỊA ĐIỂM KINH DOANH]'));
const verdicts=Object.fromEntries(Object.keys(SCOPE_CHECKS).map(key=>[key,{type:'choice',choice:'SUPPORTED',confidence:.99}]));
verdicts.subject_applicability.choice='CONTRADICTED';assert(evaluateScopeAssessment(verdicts).issues.includes('subject_applicability'));
assert.equal(calls,0);fs.mkdirSync('outputs/business-subject-fix-2026-10-21',{recursive:true});
fs.writeFileSync('outputs/business-subject-fix-2026-10-21/offline.json',JSON.stringify({rows,apiCalls:calls,limitations:'Semantic labels and verdicts mocked; not a live-model accuracy score.'},null,2));
console.log('PASS eight subject/registration/history cases; source-scope separation; no keyword classification or provider calls.');}
main().catch(e=>{console.error(e);process.exitCode=1;});
