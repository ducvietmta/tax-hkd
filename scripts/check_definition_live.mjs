import fs from 'node:fs/promises';
const question=process.argv[2]||'Cá nhân kinh doanh là gì';
const tag=process.argv[3]||'after';
if(!['after','paraphrase','household'].includes(tag))throw Error('Unknown output tag');
const start=Date.now();
const r=await fetch('https://tax-hkd.pages.dev/api/chat?nocache=1',{
 method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},
 body:JSON.stringify({message:question}),signal:AbortSignal.timeout(150000),
});
const b=await r.json();
await fs.mkdir('outputs/definition-diagnostic-2026-10-21',{recursive:true});
await fs.writeFile(`outputs/definition-diagnostic-2026-10-21/live-${tag}.json`,JSON.stringify({question,http:r.status,elapsedMs:Date.now()-start,...b},null,2));
console.log(JSON.stringify({question,http:r.status,answer:b.response,source:b.source,review:b.retrieval?.answerReview,rounds:b.retrieval?.reviewRounds,claims:b.retrieval?.claimEvidence,timings:b.retrieval?.timings}));
if(!r.ok||b.retrieval?.answerReview?.status!=='PASS'||b.retrieval?.sourceDefinitionVerification)process.exitCode=1;
