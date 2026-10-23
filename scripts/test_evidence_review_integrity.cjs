/* Offline behavior checks: citation integrity and evidence routing invariance. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const modules=new Map();
function load(file){
 file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';
 if(modules.has(file))return modules.get(file);
 if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}
 const m={exports:{}};modules.set(file,m.exports);
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);
 modules.set(file,m.exports);return m.exports;
}
let network=0;global.fetch=()=>{network++;throw Error('NETWORK_FORBIDDEN');};
const {validateLegalCitations}=load('worker/src/answerValidation.ts');
const {buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts');
const {understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {resolveAnswerScope}=load('shared/taxScope.ts');
const {JevDecisionProvider}=load('worker/src/decision/jevProvider.ts');
const {PROCEDURAL_EVIDENCE_POLICY}=load('worker/src/decision/proceduralEvidencePolicy.ts');
const {answerContract}=load('worker/src/decision/answerContract.ts');
const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'TAX_CALCULATION',secondaryIntents:[],incomeTypes:['MARKETPLACE_SALES'],topic:'TAX_AMOUNT',revenueContext:'ACTUAL',taxFocus:'both',calculationShape:'SINGLE',methodContext:'UNSPECIFIED'};
const scope=resolveAnswerScope([],'Nghĩa vụ năm 2026',new Date('2026-10-23T00:00:00Z'));
for(const answer of [
 'Thời hạn 30 ngày theo Điều 9 Nghị định 141/2026/NĐ-CP.',
 'Áp dụng Luật Quản lý thuế 38/2019/QH14.\n\nCăn cứ pháp lý:\n- Luật Quản lý thuế 38/2019/QH14',
 'Nội dung chưa có nguồn.\n\nCăn cứ pháp lý:\n- Điều 2 Nghị định 999/2099/NĐ-CP',
]){
 const checked=validateLegalCitations('Hóa đơn điện tử doanh thu 1 tỷ',answer,[],scope,[{text:'Luật 108/2025/QH15; Khoản 2 Điều 1 Nghị định 141/2026/NĐ-CP'}],semantic);
 assert.equal(checked.answer,answer,'A source check must not rewrite or remove a claim before review');
 assert(!checked.citations.some(c=>c.includes('999/2099')));
}
const frame=understandClassifiedQuery('Doanh thu bán hàng năm 2026, hãy tính thuế.',scope,[],semantic);
const baseline=buildRetrievalPlan(frame);
for(const topic of ['TAX_AMOUNT','REVENUE_THRESHOLD','PLATFORM_WITHHOLDING',undefined]){
 const contextual={...frame,semantic:{...frame.semantic,topic}};
 const expected=buildRetrievalPlan(contextual);
 for(const amount of [0,100000000,1000000001,1010000000,1500000000,2999999999,3000000000,3000000001,10000000000,50000000001]){
  const actual=buildRetrievalPlan({...contextual,facts:{...contextual.facts,revenue_vnd:amount}});
  assert.deepEqual(actual,expected,'Evidence families must not change at embedded revenue cutoffs');
 }
}
assert(baseline.must_include_refs.includes('16.99'),'Method evidence must be available regardless of amount');
(async()=>{
 for(const topic of ['SYSTEM_REGISTRATION','PORTAL_TROUBLESHOOTING','TAX_REGISTRATION','REGISTRATION_REQUIREMENTS','TAX_AMOUNT']){
  const procedure={...semantic,topic,primaryIntent:'REGISTRATION',answerPurpose:'PROCEDURE'};
  assert(answerContract(procedure).includes(PROCEDURAL_EVIDENCE_POLICY));
  for(const citationVerdict of ['COMPLETE','INCOMPLETE']){
   const reviewer=new JevDecisionProvider('OFFLINE_DUMMY');
   reviewer.ask=async(state,questions)=>{
    assert(questions.evidence.instructions.includes(PROCEDURAL_EVIDENCE_POLICY));
    assert(questions.citations.instructions.includes(PROCEDURAL_EVIDENCE_POLICY));
    return Object.fromEntries(Object.keys(questions).map(key=>[key,{type:'choice',confidence:.99,choice:key==='citations'?citationVerdict:({facts:'FAITHFUL',evidence:'SUPPORTED',missing_fact:'NONE',safe_fact:'NONE'}[key]||'COMPLETE')}]));
   };
   const issues=await reviewer.reviewAnswer('Hướng dẫn nhập hồ sơ.','Chọn mục đăng ký, kiểm tra thông tin rồi tiếp tục.','Tài liệu hướng dẫn: chọn mục đăng ký, kiểm tra thông tin rồi tiếp tục.',[],procedure);
   assert(Array.isArray(issues));
   assert.equal(issues.some(i=>i.startsWith('citations:')),citationVerdict==='INCOMPLETE','Allow manual evidence but preserve rejection of incorrect explicit citations');
  }
 }
 for(const coverage of ['COMPLETE','INCOMPLETE']){
  const reviewer=new JevDecisionProvider('OFFLINE_DUMMY');
  reviewer.ask=async(state,questions)=>Object.fromEntries(Object.keys(questions).map(key=>[key,{type:'choice',confidence:.99,choice:key==='coverage'?coverage:({facts:'FAITHFUL',evidence:'SUPPORTED',missing_fact:'NONE',safe_fact:'NONE'}[key]||'COMPLETE')}]));
  const issues=await reviewer.reviewAnswer('Tính riêng từng sắc thuế.','Cách trình bày tự do, không yêu cầu từ khóa cố định.','Bằng chứng kiểm thử.',[],semantic);
  assert(Array.isArray(issues),'Reviewer result must be available');
  assert.equal(issues.some(i=>i.includes('coverage:INCOMPLETE')),coverage==='INCOMPLETE');
 }
 assert.equal(network,0);
 console.log('PASS: immutable citation prose, amount-independent evidence, semantic completeness verdicts; API calls: 0.');
})().catch(e=>{console.error(e);process.exitCode=1;});
