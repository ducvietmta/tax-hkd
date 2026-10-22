import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const version='v2.12.1-source-coverage';
const checks=await Promise.all(['https://tax-agent-worker.ducviet-mta.workers.dev','https://tax-hkd.pages.dev','https://thuehkd.com'].map(async base=>{
 const r=await fetch(base+'/api/health',{signal:AbortSignal.timeout(15000)}),h=await r.json();assert.equal(r.status,200);assert.equal(h.pipelineVersion,version);assert.equal(h.decisionMode,'audit');
 const gate=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},body:JSON.stringify({message:''}),signal:AbortSignal.timeout(15000)});assert.equal(gate.status,401);
 return {url:base,status:r.status,pipelineVersion:h.pipelineVersion,decisionMode:h.decisionMode,spoofedHeader:gate.status};
}));
const result={version,workerVersion:process.argv[2]||null,checks};await fs.writeFile('outputs/rag-source-coverage-2026-10-22/release.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
