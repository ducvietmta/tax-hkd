// Explicit opt-in collector/scorer for two isolated deployments. Never changes flags.
// collect requires approved descriptors, reviewed gold, and a private test token.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const action=process.argv[2],dir=process.env.CASE_EVAL_OUTPUT;
if(!['collect','score'].includes(action)||!dir)throw Error('Set CASE_EVAL_OUTPUT to a new evaluation directory and use collect or score.');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const cases=[...read('tests/fixtures/tax-hkd-191.json').cases,...read('outputs/prompt-replay-210-2026-10-22/questions-only.json')].map(c=>({id:c.id,input:c.input}));
const canonical=new Set(require('./lib/load_local_ts.cjs')()('worker/src/ragEngine.ts').CANONICAL_CHUNKS.map(c=>c.ref_id));
const gold=read(process.env.CASE_EVAL_GOLD||path.join(dir,'gold.json'));
if(!gold.review?.reviewer||!gold.review?.reviewed_at||gold.cases?.length!==401)throw Error('REVIEWED_CARD_LEVEL_GOLD_REQUIRED');
const goldMap=new Map(gold.cases.map(c=>[c.id,c]));assert.equal(goldMap.size,401);
for(const c of cases){const g=goldMap.get(c.id);if(!g||g.input_hash!==hash(c.input)||!Array.isArray(g.verified_refs)||g.verified_refs.some(ref=>!canonical.has(ref))||(!g.verified_refs.length&&!g.expected_abstain)||!['calibration','holdout'].includes(g.split))throw Error('INVALID_GOLD: '+c.id);}
const answersPath=path.join(dir,'answers.jsonl'),freezePath=path.join(dir,'freeze.json');
const pctl=(rows,p)=>{const s=[...rows].sort((a,b)=>a-b);return s[Math.ceil(s.length*p)-1]??null;};
async function collect(){
 if(fs.existsSync(answersPath)||fs.existsSync(freezePath))throw Error('Refusing to overwrite frozen or partial answers; use a new directory.');
 const endpoints={B0:process.env.CASE_EVAL_BASELINE_URL,B1:process.env.CASE_EVAL_CANDIDATE_URL};
 const token=process.env.CASE_EVAL_TOKEN;if(!token||token.length<32)throw Error('PRIVATE_TEST_TOKEN_REQUIRED');
 if(!endpoints.B0||!endpoints.B1||endpoints.B0===endpoints.B1)throw Error('TWO_ISOLATED_DEPLOYMENTS_REQUIRED');
 for(const u of Object.values(endpoints)){const parsed=new URL(u);if(parsed.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(parsed.hostname))throw Error('HTTPS_REQUIRED');}
 const health={};for(const branch of ['B0','B1']){
  const res=await fetch(new URL('/api/health',endpoints[branch]),{signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error('HEALTH_FAILED');health[branch]=await res.json();
  const r=health[branch].caseRecognition;if(!r?.strict||!r.approvedDescriptors||r.invalid||r.mode!==(branch==='B0'?'off':'on'))throw Error('UNREADY_EVALUATION_DEPLOYMENT: '+branch);
 }
 if(health.B0.pipelineVersion!==health.B1.pipelineVersion||health.B0.caseRecognition.version!==health.B1.caseRecognition.version||health.B0.caseRecognition.canonicalHash!==health.B1.caseRecognition.canonicalHash)throw Error('DEPLOYMENT_SNAPSHOT_MISMATCH');
 // Both indexes must already be verified separately. A health/version match alone
 // is insufficient to establish vector contents or metadata equality.
 const vectors=read(process.env.CASE_EVAL_VECTOR_SNAPSHOT||path.join(dir,'vector-snapshot.json'));
 if(!vectors.review?.reviewer||vectors.B0?.content_hash!==vectors.B1?.content_hash||!vectors.B0?.content_hash||vectors.canonical_hash!==health.B0.caseRecognition.canonicalHash)throw Error('MATCHING_REVIEWED_VECTOR_SNAPSHOTS_REQUIRED');
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'run.json'),JSON.stringify({started_at:new Date().toISOString(),health,input_hash:hash(cases),gold_hash:hash(gold),vectors_hash:hash(vectors),runs:3,concurrency:1,cache:'bypass authorized MCP test caller',sampling:'provider defaults; stochastic variation reported'},null,2));
 for(let run=0;run<3;run++)for(let i=0;i<cases.length;i++){
  const c=cases[i];for(const branch of (run+i)%2?['B1','B0']:['B0','B1']){
   const start=performance.now();let output=null,error=null,status=null;
   try{const response=await fetch(new URL('/mcp',endpoints[branch]),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,'X-Bypass-Cache':'1'},body:JSON.stringify({jsonrpc:'2.0',id:`${c.id}-${run}`,method:'tools/call',params:{name:'ask_tax_ai',arguments:{question:c.input.message||c.input.question,history:c.input.history||[]}}}),signal:AbortSignal.timeout(180000)});status=response.status;const body=await response.json();output=body.result?.structuredContent||null;if(!response.ok||!output)error='HTTP_OR_PROTOCOL_ERROR';}catch(e){error=e.name||'REQUEST_ERROR';}
   const row={id:c.id,run,branch,input_hash:hash(c.input),duration_ms:performance.now()-start,http_status:status,error,output};row.answer_hash=hash(row);
   fs.appendFileSync(answersPath,JSON.stringify(row)+'\n');console.log(`${run+1}/3 ${i+1}/401 ${branch} ${error||output?.answerReview?.status||'UNKNOWN'}`);
  }
 }
 fs.writeFileSync(freezePath,JSON.stringify({sha256:hash(fs.readFileSync(answersPath,'utf8')),rows:401*3*2,gold_hash:hash(gold),input_hash:hash(cases)},null,2));
 console.log('Answers frozen. Blind independent grades are required before score.');
}
function score(){
 const frozen=read(freezePath),raw=fs.readFileSync(answersPath,'utf8');assert.equal(hash(raw),frozen.sha256);assert.equal(hash(gold),frozen.gold_hash);assert.equal(hash(cases),frozen.input_hash);
 const rows=raw.trim().split('\n').map(JSON.parse);assert.equal(rows.length,2406);assert.equal(new Set(rows.map(r=>`${r.id}:${r.run}:${r.branch}`)).size,2406);
 const grades=read(process.env.CASE_EVAL_GRADES||path.join(dir,'grades.json'));if(!grades.review?.reviewer||grades.answer_freeze_sha256!==frozen.sha256)throw Error('INDEPENDENT_FROZEN_ANSWER_GRADES_REQUIRED');
 const byHash=new Map(grades.rows.map(r=>[r.answer_hash,r]));
 const stats={};for(const branch of ['B0','B1']){
  const selected=rows.filter(r=>r.branch===branch),recalls={4:[],6:[],8:[]};let valid=0,total=0,pass=0,blocked=0,errors=0;
  for(const r of selected){
   const grade=byHash.get(r.answer_hash);if(!grade||!['PASS','PARTIAL','FAIL','BLOCKED','ERROR'].includes(grade.grade))throw Error('MISSING_BLIND_GRADE: '+r.id);
   const output=r.output,trace=output?.retrieval?.caseRecognition,g=goldMap.get(r.id),refs=trace?.layerB?.selected_refs||[];
   const released=output?.answerReview?.status==='PASS';
   if(r.error)errors++;if(!released)blocked++;if(grade.grade==='PASS'&&released&&!r.error)pass++;
   if(g.verified_refs.length)for(const k of [4,6,8])recalls[k].push(g.verified_refs.filter(ref=>refs.slice(0,k).includes(ref)).length/g.verified_refs.length);
   const citations=output?.citations||[];total+=citations.length;
   if(trace?.final?.gate?.ok&&trace.final.gate.citation_refs.every(ref=>canonical.has(ref)))valid+=citations.length;
   if(released&&!trace?.final?.gate?.ok)throw Error('RELEASE_WITHOUT_SOURCE_GATE');
   if(/CASE_EVIDENCE|KB\/(?:0[1-9]|1[01])-|facebook\.com/i.test((output?.answer||'')+' '+citations.join(' ')))throw Error('CASE_LEAKAGE');
  }
  const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
  stats[branch]={samples:selected.length,pass,blocked,errors,accuracy:pass/selected.length,recall_at_k:Object.fromEntries(Object.entries(recalls).map(([k,a])=>[k,avg(a)])),citations:{valid,total,rate:total?valid/total:null},latency_ms:{p50:pctl(selected.map(r=>r.duration_ms),.5),p95:pctl(selected.map(r=>r.duration_ms),.95)}};
 }
 const b=stats.B0,a=stats.B1,reasons=[];
 if(a.citations.rate!==1||b.citations.rate!==1)reasons.push('CITATION_VALIDITY_NOT_ESTABLISHED_AT_100_PERCENT');
 if(a.accuracy<b.accuracy)reasons.push('ACCURACY_REGRESSION');
 for(const k of [4,6,8])if(a.recall_at_k[k]===null||a.recall_at_k[k]<b.recall_at_k[k])reasons.push('RECALL_REGRESSION_OR_MISSING_'+k);
 for(const p of ['p50','p95'])if(a.latency_ms[p]>b.latency_ms[p])reasons.push('LATENCY_REGRESSION_'+p);
 if(![4,6,8].some(k=>a.recall_at_k[k]>b.recall_at_k[k]))reasons.push('NO_MEASURED_RECALL_BENEFIT');
 const report={stats,numeric_gates_passed:reasons.length===0,release_eligible:false,reasons,feature_action:'No automatic deployment. Keep off on any failure; independent holdout/variance review is still required even if aggregate numeric gates pass.',limitations:['This summary does not establish statistical significance.','Gold split is preserved in the manifest; aggregate success is insufficient without holdout review.']};
 fs.writeFileSync(path.join(dir,'live-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
(action==='collect'?collect():Promise.resolve().then(score)).catch(e=>{console.error(e.message);process.exitCode=1;});
