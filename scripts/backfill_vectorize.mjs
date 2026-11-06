/** Maintenance CLI. No public admin endpoint; credentials stay in process memory. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {buildVectorManifest,embeddingText}=require('./lib/vector_manifest.cjs');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const load=require('./lib/load_local_ts.cjs')();
const cards=load(path.join(ROOT,'worker/src/ragEngine.ts')).CANONICAL_CHUNKS;
const manifest=buildVectorManifest(cards,read('worker/src/kb/chunkMeta.json'),read('worker/src/recognition/sourcePolicy.json'));
if(JSON.stringify(manifest)!==JSON.stringify(read('worker/src/kb/vectorManifest.json')))throw Error('Run npm run kb:build before vector maintenance.');
export const INDEX_VERSION=manifest.version;
const args=process.argv.slice(2),value=key=>args.find(a=>a.startsWith(key+'='))?.slice(key.length+1);
const index=value('--index')||process.env.VECTORIZE_INDEX||'tax-kb-v1';
let account=value('--account-id')||process.env.CLOUDFLARE_ACCOUNT_ID;
const mode=args.includes('--sync')?'sync':args.includes('--verify')?'verify':'plan';
const allowed=new Set(['--sync','--verify','--plan']);
for(const a of args)if(!allowed.has(a)&&!a.startsWith('--index=')&&!a.startsWith('--account-id='))throw Error('Unknown option');
const byId=new Map(cards.map(c=>[c.ref_id||c.id,c]));
const report={version:manifest.version,index,mode,eligible:manifest.entries.length,excluded:manifest.excluded_refs,upserted:0,verified:false};
const out=path.join(ROOT,'outputs/vector-sync-2026-10-26');
function save(){fs.mkdirSync(out,{recursive:true});const body=JSON.stringify(report,null,2)+'\n';fs.writeFileSync(path.join(out,'report.json'),body);fs.writeFileSync(path.join(out,`report-${mode}.json`),body);}
async function main(){
 if(mode==='plan'){console.log(JSON.stringify(report,null,2));return;}
 if(!account){
  try{
   const raw=execFileSync(process.execPath,[path.join(ROOT,'node_modules/wrangler/bin/wrangler.js'),'whoami','--json'],{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000});
   const accounts=JSON.parse(raw).accounts;
   if(!Array.isArray(accounts)||accounts.length!==1)throw Error('Account selection required');
   account=accounts[0].id;
  }catch{throw Error('Supply --account-id=<Cloudflare account ID> when the active account is ambiguous.');}
 }
 if(!/^[a-f0-9]{32}$/i.test(account))throw Error('Invalid Cloudflare account ID.');
 let token=process.env.CLOUDFLARE_API_TOKEN;
 if(!token){
  try{
   const raw=execFileSync(process.execPath,[path.join(ROOT,'node_modules/wrangler/bin/wrangler.js'),'auth','token','--json'],{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000});
   const auth=JSON.parse(raw);
   if(!['api_token','oauth'].includes(auth.type)||!auth.token)throw Error('Unsupported credentials');
   token=auth.token;
  }catch{throw Error('Cannot obtain supported Wrangler credentials; run wrangler login.');}
 }
 const api=async(route,body,isForm=false)=>{
  const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+route,{
   method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,...(body!==undefined&&!isForm?{'Content-Type':'application/json'}:{})},
   ...(body!==undefined?{body:isForm?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000),redirect:'error'});
  let data;try{data=await response.json();}catch{throw Error('Cloudflare returned non-JSON, HTTP '+response.status);}
  if(!response.ok||!data.success)throw Error('Cloudflare request failed: HTTP '+response.status+' codes '+(data.errors||[]).map(e=>e.code).join(','));
  return data.result;
 };
 const base='/vectorize/v2/indexes/'+encodeURIComponent(index);
 async function inspect(){
  const existing=new Map();
  const ids=[...manifest.entries.map(e=>e.id),...manifest.excluded_refs];
  for(let i=0;i<ids.length;i+=20){const rows=await api(base+'/get_by_ids',{ids:ids.slice(i,i+20)});for(const row of rows)existing.set(row.id,row);}
  const missing=[],stale=[];
  for(const entry of manifest.entries){const row=existing.get(entry.id);if(!row)missing.push(entry.id);
   else if(row.metadata?.sha256!==entry.sha256||row.metadata?.index_version!==manifest.version||row.values?.length!==manifest.dimensions)stale.push(entry.id);}
  return {existing,missing,stale,blockedPresent:manifest.excluded_refs.filter(id=>existing.has(id))};
 }
 let state=await inspect();report.before={missing:state.missing,stale:state.stale,blockedPresent:state.blockedPresent};
 if(mode==='sync'){
  const changed=new Set([...state.missing,...state.stale]);
  const entries=manifest.entries.filter(e=>changed.has(e.id));
  for(let i=0;i<entries.length;i+=8){
   const batch=entries.slice(i,i+8);
   const embedding=await api('/ai/run/'+manifest.model,{text:batch.map(e=>embeddingText(byId.get(e.id)))});
   if(embedding?.data?.length!==batch.length||embedding.data.some(v=>!Array.isArray(v)||v.length!==manifest.dimensions||v.some(n=>!Number.isFinite(n))))throw Error('Invalid embedding response');
   const rows=batch.map((e,j)=>({id:e.id,values:embedding.data[j],metadata:{sha256:e.sha256,index_version:manifest.version,tier:e.tier,from_year:String(e.from_year),to_year:e.to_year==null?'':String(e.to_year)}}));
   const form=new FormData();form.append('vectors',new File([rows.map(r=>JSON.stringify(r)).join('\n')+'\n'],'vectors.ndjson',{type:'application/x-ndjson'}));
   await api(base+'/upsert',form,true);report.upserted+=batch.length;save();console.log(`Upserted ${report.upserted}/${entries.length}`);
  }
  if(state.blockedPresent.length)await api(base+'/delete_by_ids',{ids:state.blockedPresent});
  // Upserts are asynchronous. Retry verification briefly without declaring success on enqueue.
  for(let attempt=0;attempt<6;attempt++){
   state=await inspect();if(!state.missing.length&&!state.stale.length&&!state.blockedPresent.length)break;
   console.log(`Awaiting index mutation: missing=${state.missing.length}, stale=${state.stale.length}`);
   if(attempt<5)await new Promise(resolve=>setTimeout(resolve,5000));
  }
 }
 report.after={missing:state.missing,stale:state.stale,blockedPresent:state.blockedPresent};
 report.verified=!state.missing.length&&!state.stale.length&&!state.blockedPresent.length;
 if(report.verified){
  report.queryProbes=[];
  for(const id of ['16.173','16.183','16.185','16.193']){
   const row=state.existing.get(id);
   const result=await api(base+'/query',{vector:row.values,topK:3,returnMetadata:'all'});
   const top=result.matches?.[0];
   report.queryProbes.push({source_ref:id,top_ref:top?.id,score:top?.score});
   if(top?.id!==id||top.metadata?.sha256!==row.metadata.sha256)throw Error('Indexed-vector query mismatch '+id);
  }
 }
 const info=await api(base+'/info');report.vectorCount=info.vectorCount;
 if(report.verified&&info.vectorCount!==manifest.entries.length)throw Error('Unexpected vector count after synchronization.');
 save();
 console.log(JSON.stringify({mode,version:report.version,upserted:report.upserted,verified:report.verified,vectorCount:report.vectorCount,...report.after},null,2));
 if(!report.verified)throw Error('Vector index is not synchronized with reviewed sources.');
}
main().catch(error=>{report.verified=false;report.error=error.message;save();console.error(error.message);process.exitCode=1;});
