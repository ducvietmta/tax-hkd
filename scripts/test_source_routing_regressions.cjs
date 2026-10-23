/* Local source/contract/calculation tests. Gold inputs never leave the machine. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const modules=new Map();function load(file){file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';if(modules.has(file))return modules.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}const m={exports:{}};modules.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);modules.set(file,m.exports);return m.exports;}
let network=0;global.fetch=()=>{network++;throw Error('NETWORK_FORBIDDEN');};
const suite=JSON.parse(fs.readFileSync('tests/fixtures/tax-hkd-191.json','utf8'));
const understand=load('worker/src/decision/understandQuery.ts'),scope=load('shared/taxScope.ts'),plan=load('worker/src/decision/retrievalPlan.ts'),r=load('worker/src/retriever.ts'),gate=load('worker/src/decision/evidenceGate.ts');
const {methodComparisonLedger,historicalCalculationLedger}=load('worker/src/decision/methodComparison.ts'),{calculationInstructions}=load('worker/src/decision/calculationContract.ts');
const {validateScenarioPlan}=load('worker/src/decision/scenarioPlan.ts'),{answerContract}=load('worker/src/decision/answerContract.ts');
const base={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],revenueContext:'UNSPECIFIED',taxFocus:'unspecified',calculationShape:'UNSPECIFIED',methodContext:'UNSPECIFIED'};
const rows=[];
function probe(message,semantic){
 const p=scope.resolveAnswerScope([],message,new Date('2026-10-21T05:00:00+07:00'));
 const f=understand.understandClassifiedQuery(message,p,[],{...base,...semantic}),routing=plan.buildRetrievalPlan(f),found=r.retrieve(message,6,p,routing);
 const allowed=new Set(gate.filterAndGateEvidence(found.results.map(h=>h.chunk),f).passedChunks.map(c=>c.id));
 const context=r.buildContext(found.results.filter(h=>allowed.has(h.chunk.id)),message,9000,p);
 return {frame:f,routing,context};
}
for (const message of [
 'Tôi đã có CCCD gắn chip và MST cũ 888, nay mở thêm gian hàng affiliate thì có bắt buộc phải xin mã số thuế mới không?',
 'Tôi đã đăng ký thuế, mở thêm một hoạt động kinh doanh có phải cấp mã thuế khác không?',
]) {
 const result=probe(message,{topic:'TAX_REGISTRATION',primaryIntent:'REGISTRATION',incomeTypes:['AFFILIATE_COMMISSION'],answerPurpose:'PROCEDURE'});
 for(const ref of ['16.113','16.96']) {
   assert(result.routing.must_include_refs.includes(ref),`Identity source not required: ${ref}`);
   assert(result.context.includedRefs.includes(ref),`Identity source missing from prompt: ${ref}`);
 }
}
for(const id of ['G002','G018','G070','G073','G127','G163']){
 const c=suite.cases.find(c=>c.id===id);
 const semantic=id==='G002'?{topic:'REVENUE_THRESHOLD',primaryIntent:'EXEMPTION_ELIGIBILITY'}:
  ['G018','G163'].includes(id)?{topic:'REVENUE_OWNERSHIP',primaryIntent:'EXEMPTION_ELIGIBILITY'}:
  id==='G073'?{topic:'TAX_AMOUNT',primaryIntent:'TAX_CALCULATION',taxFocus:'pit',calculationShape:'METHOD_COMPARISON'}:
  {topic:'INVOICE_CORRECTION',primaryIntent:'E_INVOICE',invoicePeriod:'MIXED_OR_UNKNOWN'};
 const x=probe(c.input.message,semantic),text=x.context.text;
 if(id==='G002'){
  assert.deepEqual(x.frame.tax_period.years,[2025]);assert(x.context.includedRefs.includes('16.54'));
  for(const s of ['100 triệu','1%','0,5%'])assert(text.includes(s),`Missing historical source ${s}`);
  assert(!x.context.includedRefs.includes('16.77'));assert(text.includes('toàn bộ doanh thu chịu thuế'));
  const h=historicalCalculationLedger(x.frame);assert(h);assert.equal(h.threshold,100000000);
  assert.equal(h.examples.find(e=>e.sector==='goods').vat_before_relief,2800000);
  assert.equal(h.examples.find(e=>e.sector==='goods').pit_before_credits,1400000);
  assert(calculationInstructions(x.frame,null).includes('LEDGER KỲ LỊCH SỬ'));
 }
 if(['G018','G163'].includes(id)){
  assert(x.context.includedRefs.includes('16.39'));assert(text.includes('không quá 10 tỷ đồng'));assert(text.includes('cá nhân cư trú'));
  assert(!answerContract({...base,...semantic}).includes('Hướng 1'));
 }
 if(['G070','G127'].includes(id)){
  assert(x.context.includedRefs.includes('16.103'));assert(text.includes('04/SS-HĐĐT'));
  assert(text.includes('[PHẠM VI KỲ KÊ KHAI]'));assert(text.includes('CHỈ quy định'));
  assert(text.includes('giảm ghi âm'));assert(text.includes('điểm b khoản 1 Điều 10'));
 }
 if(id==='G073'){
  assert.equal(x.frame.requests.length,2);assert(x.frame.requests.some(q=>q.id.startsWith('INCOME:')));assert(x.frame.requests.some(q=>q.id.startsWith('REVENUE:')));
  const ledger=methodComparisonLedger(x.frame);assert(ledger);
  assert.equal(ledger.income.before_relief,60000000);assert.equal(ledger.relief.income_after,42000000);
  assert.equal(ledger.turnover.base,1400000000);assert.equal(ledger.turnover.examples.find(e=>e.sector==='goods').before_relief,7000000);
  assert(ledger.turnover.examples.every(e=>e.hypothetical));assert.equal(ledger.relief.residency,'UNKNOWN');
  assert(calculationInstructions(x.frame,null).includes('LEDGER SO SÁNH'));
  assert.deepEqual(validateScenarioPlan({kind:'METHOD_COMPARISON',scenarios:[]},c.input.message,[]),[]);
  assert.equal(methodComparisonLedger({...x.frame,residency:{...x.frame.residency,value:'NON_RESIDENT'}}),null);
 }
 rows.push({id,kind:'OFFLINE_SOURCE_CONTRACT_ONLY',refs:x.context.includedRefs,requests:x.frame.requests.map(q=>q.id),passed:true});
}
for(const topic of ['TAX_AMOUNT','REVENUE_THRESHOLD','REVENUE_OWNERSHIP','REVENUE_COMPOSITION']){
 const x=probe('Tôi hỏi lại nghĩa vụ bán hàng năm 2024, tổng doanh thu 350 triệu.',{topic,primaryIntent:'TAX_CALCULATION'});
 assert(x.context.includedRefs.includes('16.54'));
}
const other=probe('Nếu được chọn cách tính TNCN, tôi muốn so sánh trên doanh thu năm 1,8 tỷ và chi phí 600 triệu.',{topic:'TAX_AMOUNT',primaryIntent:'TAX_CALCULATION',taxFocus:'pit',calculationShape:'METHOD_COMPARISON'});
assert.equal(methodComparisonLedger(other.frame).income.before_relief,180000000);
assert.equal(methodComparisonLedger(other.frame).relief.income_after,126000000);
const compact=probe('Doanh thu đủ hồ sơ, xét mốcNQ43còn vượt không?',{topic:'REVENUE_COMPOSITION',primaryIntent:'EXEMPTION_ELIGIBILITY'});
assert(compact.context.includedRefs.includes('16.39'),'An explicitly named compact policy must survive topic routing');
assert.equal(network,0);
fs.mkdirSync('outputs/source-routing-fix-2026-10-21',{recursive:true});
fs.writeFileSync('outputs/source-routing-fix-2026-10-21/offline.json',JSON.stringify({rows,apiCalls:0,limitations:'Models mocked/not called. Source coverage and calculations do not certify live answers.'},null,2));
console.log('PASS: six reported cases source/contract coverage; historical topic variants; method comparison ledgers and conditional examples; no new API calls.');
