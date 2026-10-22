const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);
 if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return{default:v,...v};}
 const m={exports:{}};cache.set(file,m.exports);
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+(id.endsWith('.json')?'':'.ts'))),m,m.exports);
 cache.set(file,m.exports);return m.exports;}
const {understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts');
const {resolveAnswerScope}=load('worker/src/answerScope.ts');
const {retrieve,buildContext}=load('worker/src/retriever.ts');
const {canUseVerifiedAnswer}=load('worker/src/answerValidation.ts');
const {mergeVectorHits}=load('worker/src/vectorRetriever.ts');
const {answerContract}=load('worker/src/decision/answerContract.ts');
const labels=load('worker/src/decision/labels.ts');
const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'REGISTRATION',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic:'BUSINESS_CESSATION'};
const cases=[
 'huỷ đăng ký cá nhân kinh doanh có dễ không',
 'Tôi đã đăng ký thuế trực tiếp, không có giấy hộ. Nay nghỉ affiliate hẳn cần làm gì?',
 'Tôi muốn thôi bán vĩnh viễn, thủ tục kết thúc nghĩa vụ kinh doanh thế nào?',
 'Dừng kinh doanh có làm mất mã thuế đang dùng cho tiền lương không?',
 'Đã nộp đơn nhưng còn nợ thuế, có chắc đóng xong sau 3 ngày không?',
];
for(const question of cases){
 const scope=resolveAnswerScope([],question),frame=understandClassifiedQuery(question,scope,[],semantic);
 assert.equal(frame.tax_intent.primary.value,'STATUS_CHANGE');
 const plan=buildRetrievalPlan(frame);assert.deepEqual(plan.allowed_refs,['16.109']);
 const hits=retrieve(question,6,scope,plan).results;assert(hits.length);assert(hits.every(h=>h.chunk.ref_id==='16.109'));
 const context=buildContext(hits,question,9000,scope);
 const fused=mergeVectorHits(hits,[{refId:'16.107',score:.99},{refId:'16.108',score:.98}],7,{years:scope.years,pinnedRefs:plan.must_include_refs,allowedRefs:plan.allowed_refs});
 assert.deepEqual(fused.map(h=>h.chunk.ref_id),['16.109'],'Dense fusion must not restore opening-registration evidence');
 for(const text of ['24/ĐKT','Khoản 4 Điều 28','03 ngày làm việc kể từ khi','không chấm dứt mã số thuế'])assert(context.text.includes(text));
 assert.equal(canUseVerifiedAnswer(question,'Hãy đăng ký hộ kinh doanh theo Điều 99.',undefined,semantic),false);
}
assert.equal(labels.resolveAbcCategory('BUSINESS_CESSATION','STATUS_CHANGE'),'A');
assert(answerContract(semantic).includes('không phải xin đăng ký mới'));
assert.deepEqual(mergeVectorHits([], [{refId:'16.107',score:.99}],7,{allowedRefs:[]}),[],'An empty allowlist allows no dense evidence');
// Negative lifecycle routes must keep their existing plans even if a quoted
// example contains the word "hủy". The typed semantic choice controls routing.
for(const topic of ['TAX_REGISTRATION','REGISTRATION_COMPARISON','INVOICE_CORRECTION','PORTAL_TROUBLESHOOTING']){
 const frame=understandClassifiedQuery('Tôi không muốn hủy kinh doanh; hỏi thủ tục khác',resolveAnswerScope([],''),[],{...semantic,topic});
 assert(!buildRetrievalPlan(frame).allowed_refs?.includes('16.109'));
}
const providerModule=load('worker/src/decision/jevProvider.ts');
const native=require('./fixtures/jev_native.cjs'),originalFetch=global.fetch;
let reviewInput;
global.fetch=async(_url,init)=>{
 const input=JSON.parse(init.body);
 if(input.questions.facts)reviewInput=input;
 return Response.json(native(input,'IN_SCOPE',semantic));
};
(async()=>{
 const provider=new providerModule.QuyetDecisionProvider('fixture');
 const classified=await provider.classifyBusiness(cases[0]);assert.equal(classified.topic,'BUSINESS_CESSATION');
 const frame=understandClassifiedQuery(cases[0],resolveAnswerScope([],cases[0]),[],classified);
 assert.equal(frame.tax_intent.primary.value,'STATUS_CHANGE');
 assert.deepEqual(await provider.reviewAnswer(cases[0],'Đáp án thử','Bằng chứng thử',[],classified),[]);
 assert(reviewInput.questions.cessation_scope);assert(reviewInput.questions.cessation_conditions);
 console.log('PASS: semantic cessation route, full evidence with deadlines and personal-ID scope, no opening template bypass, negative routes unchanged, native schema and procedural review (mocked provider).');
})().finally(()=>{global.fetch=originalFetch;}).catch(e=>{console.error(e);process.exitCode=1;});
