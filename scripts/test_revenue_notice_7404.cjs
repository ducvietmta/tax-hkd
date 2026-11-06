/* Evidence must survive route -> semantic plan -> retrieval -> context, in period. */
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
global.fetch=()=>{throw Error('NETWORK_FORBIDDEN')};
const {matchRoute,CANONICAL_CHUNKS}=load('worker/src/ragEngine.ts');
const {retrieve,buildContext}=load('worker/src/retriever.ts');
const {resolveAnswerScope}=load('worker/src/answerScope.ts');
const {understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts');
const {trustedSource}=load('worker/src/recognition/trustedEvidence.ts');
const {periodFits}=load('worker/src/kb/periodApplicability.ts');
const meta=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
const ref='16.173',card=CANONICAL_CHUNKS.find(c=>c.ref_id===ref);
assert(trustedSource(card));
assert(periodFits(meta[ref],{years:[2026]}));
assert(!periodFits(meta[ref],{years:[2025]}));
assert(!periodFits(meta[ref],{years:[2027]}),'2027 filing deadline must not imply guidance for 2027 revenue');
const questions=[
 'Chỉ thông báo doanh thu năm 2026 nhưng nộp chậm hoặc không nộp có bị phạt không?',
 'Cham nop thong bao doanh thu nam 2026 co bi phat khong?',
 'Nộp trễ 01/TKN-CNKD năm 2026 có thuế tài nguyên có được miễn phạt không?',
 'Công văn 7404/CT-PC quy định thế nào về chậm thông báo doanh thu năm 2026?',
];
for(const q of questions){
 assert(matchRoute(q).refs.includes(ref),'Route missed '+q);
 const scope=resolveAnswerScope([],q,new Date('2026-10-26'));
 const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'PENALTY',secondaryIntents:[],incomeTypes:['BUSINESS_GENERAL'],topic:'OTHER',answerPurpose:'OTHER'};
 const frame=understandClassifiedQuery(q,scope,[],semantic),plan=buildRetrievalPlan(frame);
 assert(plan.must_include_refs.includes(ref),'Penalty evidence absent from plan');
 const results=retrieve(q,6,scope,plan).results;
 assert(results.some(r=>r.chunk.ref_id===ref),'Missing from top6: '+q);
 const context=buildContext(results,q,14000,scope);
 assert(context.includedRefs.includes(ref),'Missing from packed context');
}
assert.match(card.text,/bắt đầu hoạt động.*trong 06 tháng đầu năm/);
assert.match(card.text,/không phát sinh các nghĩa vụ thuế/);
assert.match(card.text,/vẫn có trách nhiệm thực hiện thông báo doanh thu/);
assert.match(card.text,/sự cố kỹ thuật này được thông báo trên Cổng/);
assert.match(card.text,/31\/7\/2026/);assert.match(card.text,/31\/01\/2027/);
assert.match(card.text,/chưa kiểm tra dịch chuyển hạn do ngày nghỉ/);
assert.equal(meta[ref].original_source_status,'USER_SUPPLIED_DOCX_READ');
console.log('PASS: revenue notice routes, penalty retrieval/context, period boundaries and scoped source caveat.');
