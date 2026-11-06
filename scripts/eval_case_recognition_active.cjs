// Active-data preflight. Fixed semantic fixture: not live classification or accuracy.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
global.fetch=()=>{throw Error('NETWORK_DISABLED');};
const load=require('./lib/load_local_ts.cjs')();
const {caseRecognizer,validPacket,phraseCatalog}=load('worker/src/recognition/recognizer.ts');
const {retrieve}=load('worker/src/retriever.ts'),{resolveAnswerScope}=load('worker/src/answerScope.ts');
const {understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts'),{buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts');
const {bridgeVerifiedCandidates}=load('worker/src/recognition/bridge.ts'),{trustedSource}=load('worker/src/recognition/trustedEvidence.ts');
const {CANONICAL_CHUNKS:cards}=load('worker/src/ragEngine.ts');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),index=read('worker/src/recognition/caseIndex.json');
const cases=[...read('tests/fixtures/tax-hkd-191.json').cases,...read('outputs/prompt-replay-210-2026-10-22/questions-only.json')];
assert.equal(cases.length,401);assert.equal(new Set(cases.map(c=>c.id)).size,401);assert(index.entries.length>0);
const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic:'OTHER',answerPurpose:'OTHER',revenueContext:'UNSPECIFIED'};
const pct=(a,p)=>{const v=[...a].sort((x,y)=>x-y);return v[Math.ceil(v.length*p)-1]??null;};
(async()=>{
 const out='outputs/case-recognition-activation-2026-10-24';fs.mkdirSync(out,{recursive:true});
 await caseRecognizer.recognize('tiền đã bị trừ nộp trùng tra soát','warmup');retrieve('tra soát thuế',8);
 const rows=[],before=[],after=[],uncached=[],cached=[];let matched=0,changed=0;
 for(let run=0;run<3;run++)for(const c of cases){
  const q=c.input.message||c.input.question,history=c.input.history||[];
  const scope=resolveAnswerScope(history,q,new Date('2026-10-24T05:00:00+07:00'));
  const frame=understandClassifiedQuery(q,scope,history,semantic),plan=buildRetrievalPlan(frame),context=JSON.stringify({history,years:scope.years,today:scope.today});
  let b,a,result,trace;
  const base=()=>{const start=performance.now();b=retrieve(q,8,scope,plan).results;before.push(performance.now()-start);};
  const candidate=async()=>{const start=performance.now();result=await caseRecognizer.recognize(q,context);const base=retrieve(q,8,scope,plan).results;const bridged=bridgeVerifiedCandidates(base,result.packet,q,scope,plan,frame,8);a=bridged.results;trace=bridged.trace;after.push(performance.now()-start);};
  if((run+rows.length)%2){await candidate();base();}else{base();await candidate();}
  assert(validPacket(result.packet,index.version));assert(result.packet.expansion_terms.every(p=>!/[\d%]|https?:\/\//i.test(p)));
  assert(result.packet.expansion_terms.every(p=>Object.values(phraseCatalog).some(x=>x.phrase===p)));
  const chosen=a.filter(r=>trustedSource(r.chunk,frame));assert(chosen.every(r=>['VERIFIED','VERIFIED_CONDITIONAL'].includes(r.chunk.tier)));
  assert(!chosen.some(r=>r.chunk.ref_id==='16.24'));
  if(result.packet.status==='MATCHED')matched++;
  const old=b.map(r=>r.chunk.ref_id),refs=a.map(r=>r.chunk.ref_id);if(JSON.stringify(old)!==JSON.stringify(refs))changed++;
  (result.cache_hit?cached:uncached).push(result.duration_ms);
  rows.push({id:c.id,run,status:result.packet.status,reason:result.reason,case_ids:result.packet.matched_case_ids,suggested_refs:result.packet.suggested_verified_card_ids,before_refs:old,after_refs:refs,after_trusted_refs:chosen.map(r=>r.chunk.ref_id),trace});
 }
 const raw=fs.readFileSync('rag_data/rag-kb-export-2026-10-12/chunks.jsonl','utf8').trim().split(/\r?\n/).map(JSON.parse).filter(c=>c.tier==='CASE_EVIDENCE');assert(raw.every(c=>trustedSource(c)===null));
 const report={recognition_version:index.version,approved_descriptors:index.entries.length,cases:401,runs:3,comparisons:rows.length,matched,changed_top8:changed,raw_cases_rejected:raw.length,latency_ms:Object.fromEntries(Object.entries({baseline_lexical:before,recognition_and_bridge:after,recognition_uncached:uncached,recognition_cached:cached}).map(([k,v])=>[k,{samples:v.length,p50:pct(v,.5),p95:pct(v,.95)}])),required_metrics:{recall_at_k:null,answer_accuracy:null,final_live_citation_validity:null,production_latency:null},method:'Local lexical retrieval + active recognition/bridge. Same generic semantic fixture for all inputs; no vector search or model calls. Timings include local CPU and cannot substitute for end-to-end production latency.',input_hash:crypto.createHash('sha256').update(JSON.stringify(cases.map(c=>({id:c.id,input:c.input})))).digest('hex'),network_calls:0,rows};
 fs.writeFileSync(out+'/active-preflight.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
