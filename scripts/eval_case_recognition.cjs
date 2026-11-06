// Offline paired retrieval preflight. Never report it as live answer accuracy.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
global.fetch=()=>{throw Error('NETWORK_DISABLED');};
const load=require('./lib/load_local_ts.cjs')();
const {retrieve}=load('worker/src/retriever.ts'),{resolveAnswerScope}=load('worker/src/answerScope.ts');
const {caseRecognizer}=load('worker/src/recognition/recognizer.ts'),{trustedSource}=load('worker/src/recognition/trustedEvidence.ts');
const {CANONICAL_CHUNKS:cards}=load('worker/src/ragEngine.ts');
const dir=process.env.CASE_EVAL_OUTPUT||`outputs/case-recognition-eval/${caseRecognizer.version.slice(0,12)}`,hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const a=JSON.parse(fs.readFileSync('tests/fixtures/tax-hkd-191.json','utf8')).cases;
const b=JSON.parse(fs.readFileSync('outputs/prompt-replay-210-2026-10-22/questions-only.json','utf8'));
const cases=[...a,...b].map(c=>({id:c.id,input:c.input}));assert.equal(cases.length,401);assert.equal(new Set(cases.map(c=>c.id)).size,401);
fs.mkdirSync(dir,{recursive:true});
const manifest={schema:'taxhkd-recognition-eval-v1',count:cases.length,date:'2026-10-23',recognition_version:caseRecognizer.version,
 kb_hash:hash(JSON.stringify(cards)),cases:cases.map(c=>({id:c.id,input_hash:hash(JSON.stringify(c.input)),gold_verified_card_ids:null,gold_status:'REQUIRES_CARD_LEVEL_REVIEW'})),
 notes:['401 existing cases retained, no deleted cases restored.','No calibration or holdout claims: no human-approved links or card-level gold available.','Question-only inputs; gold answers not used to propose recognition links.']};
const manifestPath=dir+'/evaluation-manifest.json';
if(fs.existsSync(manifestPath)&&fs.readFileSync(manifestPath,'utf8')!==JSON.stringify(manifest,null,2))throw Error('FROZEN_MANIFEST_CHANGED: use a new output directory');
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2));
const raw=fs.readFileSync('rag_data/rag-kb-export-2026-10-12/chunks.jsonl','utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const evidenceCases=raw.filter(c=>c.tier==='CASE_EVIDENCE');
assert(evidenceCases.every(c=>trustedSource(c)===null));
const percentile=(xs,p)=>{const s=[...xs].sort((a,b)=>a-b);return s[Math.ceil(p*s.length)-1]??null;};
(async()=>{
 // Warm the lexical index, then alternate branch order for three paired runs.
 retrieve('tra soát thuế',8);
 const rows=[],timings={baseline:[],with_recognition:[],recognition:[]};let selected=0,untrusted=0;
 for(let run=0;run<3;run++)for(const c of cases){
  const q=c.input.message||c.input.question,scope=resolveAnswerScope(c.input.history||[],q,new Date('2026-10-23T05:00:00+07:00'));
  const execute=async enabled=>{const start=performance.now();let packet;
   if(enabled){const result=await caseRecognizer.recognize(q,JSON.stringify({history:c.input.history||[],years:scope.years,today:scope.today}));packet=result.packet;timings.recognition.push(result.duration_ms);}
   const refs=retrieve(q,8,scope).results;
   if(packet?.status==='MATCHED')throw Error('Approved cases now exist: run full planned bridge/classifier evaluation, not abstention-only preflight.');
   const ms=performance.now()-start;timings[enabled?'with_recognition':'baseline'].push(ms);return {refs:refs.map(r=>r.chunk.ref_id),tiers:refs.map(r=>r.chunk.tier),ms,status:packet?.status};
  };
  const order=run%2?[true,false]:[false,true],results={};for(const enabled of order)results[enabled?'after':'before']=await execute(enabled);
  assert.deepEqual(results.before.refs,results.after.refs,'Abstention changed candidates for '+c.id);
  selected+=results.after.tiers.length;untrusted+=results.after.tiers.filter(t=>!['VERIFIED','VERIFIED_CONDITIONAL'].includes(t)).length;
  rows.push({id:c.id,run,...results});
 }
 const index=JSON.parse(fs.readFileSync('worker/src/recognition/caseIndex.json','utf8'));
 const result={report_directory:dir,status:'NOT_RELEASE_ELIGIBLE',method:'Local lexical top-8 + actual empty-index abstention; not full production retrieval or answer generation.',
  cases:cases.length,paired_runs:3,comparisons:rows.length,unchanged_top8:rows.length,approved_descriptors:index.entries.length,
  safety:{raw_cases_rejected_as_evidence:evidenceCases.length,raw_cases_total:evidenceCases.length,selected_candidates:selected,unverified_candidates:untrusted},
  latency_ms:Object.fromEntries(Object.entries(timings).map(([k,x])=>[k,{p50:percentile(x,.5),p95:percentile(x,.95)}])),
  required_metrics:{verified_recall_at_4:null,verified_recall_at_6:null,verified_recall_at_8:null,final_citation_validity:null,live_answer_accuracy:null,production_latency_p50:null,production_latency_p95:null},
  blockers:['No human-approved recognition descriptors/links.','No reviewed card-level gold manifest for the 401 cases.','No B0/B1 live model run; offline candidate-tier checks are not final citation validity.'],
  network_calls:0,feature_state:'off',rows};
 fs.writeFileSync(dir+'/offline-evaluation.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,rows:undefined},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
