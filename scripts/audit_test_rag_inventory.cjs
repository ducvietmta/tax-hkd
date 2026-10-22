// Local inventory only. Candidate hits are not semantic or legal coverage.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
global.fetch=()=>{throw new Error('NETWORK_DISABLED');};
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return{default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>id.startsWith('node:')?require(id):load(path.resolve(path.dirname(file),id+(path.extname(id)?'':'.ts'))),m,m.exports);cache.set(file,m.exports);return m.exports;}
const raw=fs.readFileSync('rag_data/rag-kb-export-2026-10-12/chunks.jsonl','utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const kb=load('worker/src/ragEngine.ts').CANONICAL_CHUNKS;
const suite=JSON.parse(fs.readFileSync('tests/fixtures/tax-hkd-191.json','utf8'));
const retrieve=load('worker/src/retriever.ts').retrieve,resolve=load('worker/src/answerScope.ts').resolveAnswerScope;
const counts={};for(const c of raw)counts[c.tier||'UNSPECIFIED']=(counts[c.tier||'UNSPECIFIED']||0)+1;
const hits=new Map();
const rows=suite.cases.map(c=>{const q=c.input.message,scope=resolve(c.input.history||[],q,new Date('2026-10-19T05:00:00+07:00'));const refs=retrieve(q,4,scope).results.map(r=>r.chunk.ref_id);for(const ref of refs)hits.set(ref,(hits.get(ref)||0)+1);return{id:c.id,title:c.title,candidate_refs:refs};});
const untouched=kb.filter(c=>!hits.has(c.ref_id)).map(c=>({ref:c.ref_id,title:c.section}));
const result={run_at:new Date().toISOString(),api_calls:0,method:'Lexical top-4 candidates without model classification; NOT semantic coverage.',raw_records:raw.length,raw_tiers:counts,canonical_rules:kb.length,retained_tests:suite.cases.length,candidate_rule_count:hits.size,no_top4_candidate_count:untouched.length,no_top4_candidates:untouched,test_titles:suite.cases.map(c=>({id:c.id,title:c.title})),rows};
const out='outputs/test-rag-inventory-2026-10-19';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/inventory.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,rows:undefined,test_titles:undefined},null,2));
