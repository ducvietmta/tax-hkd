import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const version='v2.11.0-architecture-integrity';
const sites=['https://tax-agent-worker.ducviet-mta.workers.dev','https://tax-hkd.pages.dev','https://thuehkd.com'];
const local=await fs.readFile('dist/index.html','utf8');
const asset=local.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];assert(asset);
const checks=await Promise.all(sites.map(async base=>{
 const res=await fetch(base+'/api/health',{signal:AbortSignal.timeout(15000)});
 const body=await res.json();assert.equal(res.status,200);assert.equal(body.pipelineVersion,version);
 // An empty message cannot reach any paid model even if the auth guard regresses.
 const spoof=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},body:JSON.stringify({message:''}),signal:AbortSignal.timeout(15000)});
 assert.equal(spoof.status,401,'HTTP headers cannot bypass web authentication');
 return {url:base,health:res.status,pipelineVersion:body.pipelineVersion,spoofedHeader:spoof.status};
}));
const frontend=await Promise.all(sites.slice(1).map(async base=>{
 const page=await fetch(base+'/?release=211',{cache:'no-store',signal:AbortSignal.timeout(15000)});
 const html=await page.text();assert(html.includes(asset),'Published HTML must point at the new frontend bundle');
 const js=await fetch(base+asset,{signal:AbortSignal.timeout(15000)});assert.equal(js.status,200);
 return {url:base,status:page.status,asset,assetStatus:js.status};
}));
const result={pipelineVersion:version,workerVersion:'3cc1769a-83bc-473b-96a7-25a93d4ec043',modelApiCalls:0,checks,frontend};
await fs.writeFile('outputs/architecture-audit-2026-10-21/release.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
