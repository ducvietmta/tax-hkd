// This is a code/retrieval gate, explicitly NOT the live semantic gold gate.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return{default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+(id.endsWith('.json')?'':'.ts'))),m,m.exports);return m.exports;}
const before=JSON.parse(fs.readFileSync('outputs/tests/offline-200/report.json','utf8'));
const summary={};for(const [suite,file]of [['121','outputs/testcases/tax-hkd-130-20261016/tax_hkd_121_active.json'],['70','outputs/testcases/tax-hkd-200-20261016/tax_hkd_70_new_adversarial.json']]){
 const gold=JSON.parse(fs.readFileSync(file,'utf8')),ids=new Set(gold.cases.map(c=>c.id)),rows=before.results.filter(r=>ids.has(r.id));
 assert.equal(rows.length,Number(suite));summary[suite]={total:rows.length,pass:rows.filter(r=>r.status==='PASS_OFFLINE').length,kind:'OFFLINE_COMPONENT_CHECKS'};
}
const docs=JSON.parse(fs.readFileSync('docs/96_cau_hoi_kiem_dinh_ABC_va_LEGAL.json','utf8'));
const scopeMod=load('worker/src/answerScope.ts'),retriever=load('worker/src/retriever.ts'),understand=load('worker/src/decision/understandQuery.ts'),planner=load('worker/src/decision/retrievalPlan.ts');
const rows=docs.cases.map(c=>{
 const scope=scopeMod.resolveAnswerScope([],c.question,new Date('2026-10-19T05:00:00+07:00'));
 const topic={A:'SYSTEM_REGISTRATION',B:'PORTAL_TROUBLESHOOTING',C:'TAX_SOFTWARE_SYSTEM'}[c.original_group];
 const frame=understand.understandClassifiedQuery(c.question,scope,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:topic||'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic});
 const found=retriever.retrieve(c.question,12,scope,planner.buildRetrievalPlan(frame)).results.map(r=>r.chunk.ref_id);
 return {id:c.id,expected:c.candidate_chunks,found,fixtureTopic:topic||null,status:!c.candidate_chunks.length?'UNSPECIFIED_EXPECTATION':c.candidate_chunks.some(ref=>found.includes(ref))?'PASS_OFFLINE':'FAIL_OFFLINE'};
});
summary['96']={total:rows.length,pass:rows.filter(r=>r.status==='PASS_OFFLINE').length,fail:rows.filter(r=>r.status==='FAIL_OFFLINE').length,unspecified:rows.filter(r=>r.status==='UNSPECIFIED_EXPECTATION').length,kind:'OFFLINE_SOURCE_CANDIDATES_ONLY_WITH_GOLD_GROUP_LABELS'};
fs.mkdirSync('outputs/request-claim-upgrade-2026-10-19',{recursive:true});
fs.writeFileSync('outputs/request-claim-upgrade-2026-10-19/offline-summary.json',JSON.stringify({runAt:new Date().toISOString(),apiCalls:0,summary,rows,liveGate:'NOT_RUN_PENDING_EXPORT_AUTHORIZATION'},null,2));
console.log(JSON.stringify(summary,null,2));
for(const row of rows.filter(r=>r.status==='FAIL_OFFLINE'))console.log(JSON.stringify(row));
if(summary['121'].pass!==121||summary['70'].pass<69||summary['96'].fail)process.exitCode=1;
