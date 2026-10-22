// User authorized these three synthetic prompts only, 20/10/2026.
import fs from 'node:fs/promises';
const base='https://registration-industry-multi-tax-agent-worker.ducviet-mta.workers.dev';
const prompts=['trồng lúa','tiếp thị liên kết','trồng lúa và tiếp thị liên kết'];
const results=await Promise.all(prompts.map(async activity=>{
  const start=Date.now();
  try{
    const response=await fetch(base+'/api/registration-guide/industry',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({activity,clarifications:[]}),signal:AbortSignal.timeout(35000),
    });
    const body=await response.text();let result;try{result=JSON.parse(body);}catch{result={error:'Non-JSON response'};}
    return {activity,http:response.status,durationMs:Date.now()-start,result};
  }catch(error){return {activity,durationMs:Date.now()-start,error:error.name};}
}));
const out='outputs/registration-multi-2026-10-20';await fs.mkdir(out,{recursive:true});
await fs.writeFile(out+'/three-live.json',JSON.stringify({testedAt:new Date().toISOString(),base,results},null,2));
console.log(JSON.stringify(results,null,2));
