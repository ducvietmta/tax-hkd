const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return{default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+(id.endsWith('.json')?'':'.ts'))),m,m.exports);cache.set(file,m.exports);return m.exports;}
const kb=load('worker/src/ragEngine.ts'),retriever=load('worker/src/retriever.ts'),planner=load('worker/src/decision/retrievalPlan.ts'),understand=load('worker/src/decision/understandQuery.ts'),scope=load('worker/src/answerScope.ts'),validation=load('worker/src/answerValidation.ts'),dense=load('worker/src/vectorRetriever.ts');
const cases=[...require('../tests/fixtures/rag-expansion-2026-10-19.json'),...require('../tests/fixtures/rag-depth-2026-10-19.json')];
const report=[];
for(const c of cases){
 const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'PROCEDURE_HOWTO',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic:c.topic};
 const answerScope=scope.resolveAnswerScope([],c.question),frame=understand.understandClassifiedQuery(c.question,answerScope,[],semantic),plan=planner.buildRetrievalPlan(frame);
 const hits=retriever.retrieve(c.question,6,answerScope,plan).results,refs=hits.map(h=>h.chunk.ref_id);
 assert(refs.includes(c.ref),`Missing ${c.ref} for ${c.question}: ${refs}`);
 const context=retriever.buildContext(hits,c.question,12000,answerScope);
 const chunk=kb.CANONICAL_CHUNKS.find(x=>x.ref_id===c.ref);assert(chunk);
 for(const text of c.must)assert(chunk.text.toLowerCase().includes(text.toLowerCase()),`${c.ref} missing condition ${text}`);
 assert(context.includedRefs.includes(c.ref),`Snippet dropped ${c.ref}`);
 const fusion=dense.mergeVectorHits(hits,[{refId:'16.107',score:.99}],8,{allowedRefs:plan.allowed_refs,pinnedRefs:plan.must_include_refs});
 assert(fusion.every(x=>plan.allowed_refs.includes(x.chunk.ref_id)),'Dense leaked outside evidence family');
 if(c.topic!=='INVOICE_REGISTRATION')assert(!validation.canUseVerifiedAnswer(c.question,'Hãy đăng ký hộ kinh doanh mới',undefined,semantic));
 report.push({ref:c.ref,topic:c.topic,refs,provided:context.includedRefs,status:'PASS_OFFLINE'});
}
const metadata=load('worker/src/kb/chunkMeta.json');for(const c of cases){const m=metadata[c.ref];assert(m.content_sha256&&m.reviewed_source_urls.length&&m.effective_from_date);}
assert.equal(metadata['16.123'].effective_to_date,'2026-12-30');
assert.equal(new Set(kb.CANONICAL_CHUNKS.map(c=>c.ref_id)).size,kb.CANONICAL_CHUNKS.length,'Duplicate canonical refs');
const provider=load('worker/src/decision/jevProvider.ts'),native=require('./fixtures/jev_native.cjs');
const originalFetch=global.fetch;let business;
global.fetch=async(_u,init)=>Response.json(native(JSON.parse(init.body),'IN_SCOPE',business));
(async()=>{for(const topic of [...new Set(cases.map(c=>c.topic))].filter(t=>t!=='INVOICE_REGISTRATION')){
 business={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic};
 const p=new provider.QuyetDecisionProvider('fixture');assert.equal((await p.classifyBusiness('fixture')).topic,topic);
}fs.writeFileSync('outputs/rag-expansion-2026-10-19/offline-tests.json',JSON.stringify({count:report.length,apiCalls:0,modelCallsMocked:true,cases:report},null,2));console.log(`PASS ${report.length} new operational source/retrieval regressions, native schema and dense bounds; model calls mocked.`);})().finally(()=>global.fetch=originalFetch).catch(e=>{console.error(e);process.exitCode=1;});
