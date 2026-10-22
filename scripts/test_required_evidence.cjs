/* End-to-end retrieval/fusion/context reproduction with no provider calls. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();function load(file){file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);cache.set(file,m.exports);return m.exports;}
global.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};
const scope=load('shared/taxScope.ts'),understand=load('worker/src/decision/understandQuery.ts'),planner=load('worker/src/decision/retrievalPlan.ts');
const retrieval=load('worker/src/retriever.ts'),vector=load('worker/src/vectorRetriever.ts');
const {retrieveSubrequests}=load('worker/src/decision/subrequests.ts');
const c=JSON.parse(fs.readFileSync('tests/fixtures/tax-hkd-191.json','utf8')).cases.find(c=>c.id==='G163');
const s=scope.resolveAnswerScope([],c.input.message,new Date('2026-10-21T12:00:00Z'));
// Labels observed in production, not the idealized classifier of earlier tests.
const frame=understand.understandClassifiedQuery(c.input.message,s,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['GOODS_SALES'],topic:'REVENUE_THRESHOLD',revenueContext:'UNSPECIFIED',taxFocus:'unspecified',answerPurpose:'OTHER',calculationShape:'COMPOSITE'});
const plan=planner.buildRetrievalPlan(frame),initial=retrieval.retrieve(c.input.message,4,s,plan);
const merged=vector.mergeVectorHits(initial.results,[{refId:'16.60',score:.99},{refId:'16.44',score:.97}],6,{query:c.input.message,years:s.years,pinnedRefs:plan.must_include_refs,allowedRefs:plan.allowed_refs});
const context=retrieval.buildContext(merged,c.input.message,9000,s);
const report={initialRefs:initial.results.map(r=>r.chunk.ref_id),mergedRefs:merged.map(r=>r.chunk.ref_id),contextRefs:context.includedRefs,planRequired:plan.must_include_refs,apiCalls:0};
fs.mkdirSync('outputs/required-evidence-fix-2026-10-21',{recursive:true});
fs.writeFileSync('outputs/required-evidence-fix-2026-10-21/latest.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
assert(initial.results.some(r=>r.chunk.ref_id==='16.39'),'Document named in the query is initially retrieved');
assert(context.includedRefs.includes('16.39'),'Required document must survive hybrid fusion and context construction even with neutral policy/intent labels');
assert.deepEqual(context.missingDocumentRefs,[]);
const synthetic=(ref,text,required)=>({chunk:{id:ref,ref_id:ref,file:'test',section:'test',tier:'VERIFIED',text},score:.001,viaRoute:false,required});
for(const ref of ['opaque-document','source-with-no-policy-name']){
 const hit=synthetic(ref,'Source conditions.', 'DOCUMENT_REFERENCE');
 for(const dense of [[],[{refId:'16.60',score:.99}]]){
  const m=vector.mergeVectorHits([hit],dense,1,{years:[2026],allowedRefs:['16.60']});
  assert.equal(m[0].chunk.ref_id,ref);assert.equal(m[0].required,'DOCUMENT_REFERENCE');
 }
}
const required=[synthetic('a','First conditions.','DOCUMENT_REFERENCE'),synthetic('b','Other conditions.','DOCUMENT_REFERENCE')];
assert.equal(vector.mergeVectorHits(required,[],1).length,2,'A generic top-K cap cannot erase required references');
assert.equal(vector.mergeVectorHits([synthetic('not-allowed','Other rule.','RETRIEVAL_PLAN')],[],1,{allowedRefs:[]}).length,0,'Only a document explicitly requested can override a broad semantic allow-list');
const historical=retrieval.retrieve('Bán hàng năm 2025',4,scope.resolveAnswerScope([],'Bán hàng năm 2025')).results.find(r=>r.chunk.ref_id==='16.54');
assert(historical);
assert.equal(vector.mergeVectorHits([{...historical,required:'DOCUMENT_REFERENCE'}],[],4,{years:[2026]}).length,0,'Required is not an exemption from period checks');
const missing=retrieval.buildContext([synthetic('too-large','Legal condition. '.repeat(1000),'DOCUMENT_REFERENCE')], '',30,s);
assert.deepEqual(missing.missingDocumentRefs,['too-large'],'Context exhaustion must be visible, not silently called missing law');
const requests=frame.requests.length?frame.requests:understand.buildSubrequests(frame);
const compound=retrieveSubrequests(c.input.message,{...frame,requests:[{...requests[0],id:'one'},{...requests[0],id:'two'}]},s,4);
assert(compound.results.some(r=>r.chunk.ref_id==='16.39'&&r.required==='DOCUMENT_REFERENCE'));
console.log('PASS required evidence survives all retrieval stages.');
