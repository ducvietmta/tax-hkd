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

const {validateAnswer}=load('worker/src/decision/answerValidator.ts');
for(const text of ['TNCN 17 % = 85 triệu đồng.','Không áp dụng 0,5%; thuế suất 17%.'])assert.equal(validateAnswer(text,{},undefined).status,'PASS');
const {periodFits}=load('worker/src/kb/periodApplicability.ts');const meta=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
assert(!periodFits(meta['16.106'],{years:[2026],event_date:'2026-07-01'}));assert(!periodFits(meta['16.103'],{years:[2026],event_date:'2026-06-30'}));
const {matchPendingTopics}=load('worker/src/pendingTopics.ts');assert.equal(matchPendingTopics('Cho thuê nhà doanh thu 1 tỷ').length,0);
const {parseGroundedAnswer}=load('worker/src/decision/claimGrounding.ts');const {MuseEvidenceReviewer}=load('worker/src/decision/museEvidenceReviewer.ts');const {JevDecisionProvider}=load('worker/src/decision/jevProvider.ts');
(async()=>{
const passages=[{id:'E1',ref_id:'r',text:'Nguồn dữ liệu đầy đủ'}],requests=[{id:'R1',period:{years:[2026]}}];
const packet=parseGroundedAnswer('Chào bạn.\n\nKết luận [[E:E1;R:R1]]',passages,requests).packet;
let calls=0;
global.fetch=async(_url,options)=>{calls++;return Response.json({output:[{type:'message',content:[{text:JSON.stringify({checks:Object.fromEntries(['facts','evidence','coverage','citations'].map(k=>[k,{status:'PASS',reason:'ok'}])),requests:[{id:'R1',status:'COMPLETE',reason:'ok'}],claims:packet.claims.map((c,i)=>({id:c.id,status:i?'SUPPORTED':'NON_SUBSTANTIVE',request_ids:['R1'],confidence:.99,role:'SUPPORTING',role_confidence:.99,reason:'verified',support:i?[{evidence_id:'E1',quote:'Nguồn dữ liệu đầy đủ'}]:[]}))})}]}]})};
assert.deepEqual(await new MuseEvidenceReviewer('mock').reviewAnswer('q','answer','evidence',[],undefined,packet),[]);
const batches=[];global.fetch=async(_url,options)=>{calls++;const data=JSON.parse(options.body);batches.push(data);return Response.json({answers:Object.fromEntries(Object.entries(data.questions).map(([k,v])=>[k,{type:'choice',choice:Object.keys(v.criteria)[0],confidence:.99}]))})};
const questions=Object.fromEntries(Array.from({length:40},(_,i)=>['q'+i,{type:'choice',instructions:'instruction',criteria:{PASS:'ok'}}]));questions.evidence={type:'choice',instructions:'shared-review-policy',criteria:{PASS:'ok'}};
await new JevDecisionProvider('mock').ask({},questions);assert(batches.length===2);assert(batches.every(b=>b.state.review_policy==='shared-review-policy'));
console.log('PASS: no format-based downgrade; invoice date boundaries; rental warning scope; independently reviewed context; shared batch policy. Mock network only.');
})().catch(e=>{console.error(e);process.exitCode=1});
