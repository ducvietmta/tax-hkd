import fs from 'node:fs/promises';
const fixtures=JSON.parse(await fs.readFile('tests/fixtures/scenario-recovery.json','utf8'));
const id=process.argv[2]||'original';
if(!['original','variant','knownTransition'].includes(id))throw Error('Unknown synthetic test');
const start=Date.now();
const response=await fetch('https://tax-hkd.pages.dev/api/chatgpt/tax-qa?nocache=1',{
 method:'POST',headers:{'Content-Type':'application/json','X-Test-Run':`answer-recovery-${id}`},
 body:JSON.stringify({message:fixtures[id]}),signal:AbortSignal.timeout(150000),
});
const value=await response.json();
await fs.mkdir('outputs/answer-recovery',{recursive:true});
await fs.writeFile(`outputs/answer-recovery/${id}-live-final.json`,JSON.stringify({http:response.status,elapsedMs:Date.now()-start,...value},null,2));
console.log(JSON.stringify({http:response.status,elapsedMs:Date.now()-start,answer:value.answer||value.response,source:value.source,review:value.decision?.answerReview||value.retrieval?.answerReview,timings:value.decision?.timings||value.retrieval?.timings,error:value.error}));
if(!response.ok)process.exitCode=1;
