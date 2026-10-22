const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);
 if(file.endsWith('.json')){const value=JSON.parse(fs.readFileSync(file,'utf8'));return{default:value,...value};}
 const module={exports:{}};cache.set(file,module.exports);
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+(id.endsWith('.json')?'':'.ts'))),module,module.exports);
 cache.set(file,module.exports);return module.exports;}
const {REGISTRATION_SCOPE_POLICY:policy}=load('worker/src/decision/registrationScope.ts');
const {answerContract}=load('worker/src/decision/answerContract.ts');
const {QuyetDecisionProvider}=load('worker/src/decision/jevProvider.ts');
const {understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts');
const {resolveAnswerScope}=load('worker/src/answerScope.ts');
const native=require('./fixtures/jev_native.cjs');
const base={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'REGISTRATION',secondaryIntents:[],incomeTypes:['GOODS_SALES']};
const cases=[
 ['Tôi bán rau ngoài chợ thu nhập vài ba trăm nghìn/tháng có cần đăng ký cá nhân kinh doanh không','TAX_REGISTRATION'],
 ['Tôi bán đồ ăn tại nhà, lãi rất ít; có phải đăng ký cá nhân kinh doanh không','TAX_REGISTRATION'],
 ['Tôi đã có giấy hộ; có phải đăng ký thuế riêng nữa không','TAX_REGISTRATION'],
 ['Tôi có quầy cố định ở chợ, cần đăng ký hộ kinh doanh không','BUSINESS_REGISTRATION'],
 ['Đăng ký cá nhân kinh doanh và đăng ký hộ khác nhau thế nào','REGISTRATION_COMPARISON'],
];
let current,reviewComplete=true,classifierInput,reviewInput;
const original=global.fetch;
global.fetch=async(_url,init)=>{
 const input=JSON.parse(init.body);
 if(input.questions.facts)reviewInput=input;else if(input.questions.business_registration)classifierInput=input;
 const reply=native(input,'IN_SCOPE',current);
 if(input.questions.facts&&!reviewComplete)reply.answers.coverage.choice='INCOMPLETE';
 return Response.json(reply);
};
(async()=>{
 const provider=new QuyetDecisionProvider('fixture');
 for(const [question,topic] of cases){
  current={...base,topic};const semantic=await provider.classifyBusiness(question);assert.equal(semantic.topic,topic);
  assert.match(classifierInput.questions.business_registration.criteria.TAX_REGISTRATION,/Cách gọi đăng ký cá nhân kinh doanh/);
  const scope=resolveAnswerScope([],question),frame=understandClassifiedQuery(question,scope,[],semantic),plan=buildRetrievalPlan(frame);
  assert(plan.must_include_refs.includes(topic==='BUSINESS_REGISTRATION'?'16.107':'16.108'));
  assert(answerContract(semantic).includes(policy));
  assert.deepEqual(await provider.reviewAnswer(question,'Đáp án có điều kiện','Nguồn đối chiếu',[],semantic),[]);
  assert(reviewInput.questions.coverage.instructions.includes(policy));
 }
 // Wrong topic still receives the procedure/fact coverage requirement.
 assert(answerContract({...base,topic:'REVENUE_THRESHOLD'}).includes(policy));
 reviewComplete=false;
 const issues=await provider.reviewAnswer(cases[0][0],'Thu nhập nhỏ nên được miễn đăng ký hộ; bán ở chợ là bán rong.','Nguồn đối chiếu',[],{...base,topic:'BUSINESS_REGISTRATION'});
 assert(issues.some(issue=>issue.startsWith('coverage:')),'Incomplete procedure coverage must propagate as a review failure');
 console.log('PASS: registration classification instructions, source routing, generation/review scope and failed-coverage propagation. Model decisions mocked; no live accuracy claim or API calls.');
})().finally(()=>{global.fetch=original;}).catch(error=>{console.error(error);process.exitCode=1;});
