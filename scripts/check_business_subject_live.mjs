import fs from 'node:fs/promises';
const {cases}=JSON.parse(await fs.readFile('tests/fixtures/business-subject-boundary.json','utf8'));
const id=process.argv[2];const c=cases.find(c=>c.id===id);if(!c)throw Error('Unknown subject test');
const target='https://tax-hkd.pages.dev';
const health=await fetch(target+'/api/health',{signal:AbortSignal.timeout(15000)}).then(r=>r.json());
if(health.pipelineVersion!=='v2.11.5-business-subject')throw Error('Production version mismatch');
const start=Date.now();
const res=await fetch(target+'/api/chatgpt/tax-qa?nocache=1',{method:'POST',headers:{'Content-Type':'application/json','X-Test-Run':'business-subject-'+id+'-'+start},body:JSON.stringify({message:c.message,history:c.history||[]}),signal:AbortSignal.timeout(150000)});
const body=await res.text();let response;try{response=JSON.parse(body);}catch{response={raw:body};}
const result={id,pipelineVersion:health.pipelineVersion,decisionMode:health.decisionMode,http:res.status,elapsedMs:Date.now()-start,cacheBypassed:true,input:{message:c.message,history:c.history||[]},response};
const dir='outputs/business-subject-fix-2026-10-21/live';await fs.mkdir(dir,{recursive:true});await fs.writeFile(dir+'/'+id+'-'+start+'.json',JSON.stringify(result,null,2));await fs.writeFile(dir+'/'+id+'-latest.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));if(!res.ok)process.exitCode=1;
