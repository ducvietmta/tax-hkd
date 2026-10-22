import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const version='v2.11.5-business-subject';
const checks=await Promise.all(['https://tax-agent-worker.ducviet-mta.workers.dev','https://tax-hkd.pages.dev','https://thuehkd.com'].map(async url=>{
 const res=await fetch(url+'/api/health',{signal:AbortSignal.timeout(15000)});const health=await res.json();assert.equal(res.status,200);assert.equal(health.pipelineVersion,version);assert.equal(health.decisionMode,'audit');
 const gate=await fetch(url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},body:JSON.stringify({message:''}),signal:AbortSignal.timeout(15000)});assert.equal(gate.status,401);
 return {url,pipelineVersion:health.pipelineVersion,decisionMode:health.decisionMode,spoofedHeader:gate.status};
}));
const result={version,workerVersion:process.argv[2]||null,checks};await fs.writeFile('outputs/business-subject-fix-2026-10-21/release.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
