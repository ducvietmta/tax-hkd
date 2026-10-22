import fs from 'node:fs/promises';
const suite=JSON.parse(await fs.readFile('tests/fixtures/tax-hkd-191.json','utf8'));
const test=suite.cases.find(c=>c.id==='G163');
if(!test)throw Error('G163 not found');
const target='https://tax-hkd.pages.dev';
const health=await fetch(target+'/api/health',{signal:AbortSignal.timeout(15000)}).then(r=>r.json());
const start=Date.now();
// Send only this user-authorized question/history, never the expected answer.
const res=await fetch(target+'/api/chatgpt/tax-qa?nocache=1',{
 method:'POST',headers:{'Content-Type':'application/json','X-Test-Run':'user-requested-G163-'+Date.now()},
 body:JSON.stringify(test.input),signal:AbortSignal.timeout(150000),
});
const raw=await res.text();let response;try{response=JSON.parse(raw);}catch{response={raw};}
const result={testId:test.id,startedAt:new Date(start).toISOString(),elapsedMs:Date.now()-start,
 target,http:res.status,pipelineVersion:health.pipelineVersion,decisionMode:health.decisionMode,
 cacheBypassed:true,input:test.input,response};
const directory=process.argv[2]||'outputs/semantic-scope-fix-2026-10-21/g163-live';
await fs.mkdir(directory,{recursive:true});
await fs.writeFile(directory+'/result-'+start+'.json',JSON.stringify(result,null,2));
await fs.writeFile(directory+'/latest.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(!res.ok)process.exitCode=1;
