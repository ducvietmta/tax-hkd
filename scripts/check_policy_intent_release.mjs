import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const version='v2.11.2-policy-intent';
const sites=['https://tax-agent-worker.ducviet-mta.workers.dev','https://tax-hkd.pages.dev','https://thuehkd.com'];
const checks=await Promise.all(sites.map(async base=>{
 const r=await fetch(base+'/api/health',{signal:AbortSignal.timeout(15000)});
 const h=await r.json();assert.equal(r.status,200);assert.equal(h.pipelineVersion,version);assert.equal(h.decisionMode,'audit');
 const gate=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},body:JSON.stringify({message:''}),signal:AbortSignal.timeout(15000)});
 assert.equal(gate.status,401);
 return {url:base,status:r.status,pipelineVersion:h.pipelineVersion,decisionMode:h.decisionMode,spoofedHeader:gate.status};
}));
const result={version,workerVersion:process.argv[2]||null,checks,modelApiCalls:0,liveGoldSuiteRun:false};
await fs.writeFile('outputs/policy-intent-fix-2026-10-21/release.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
