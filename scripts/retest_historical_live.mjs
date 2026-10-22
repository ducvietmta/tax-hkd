import fs from 'node:fs/promises';
const suite=JSON.parse(await fs.readFile('tests/fixtures/tax-hkd-191.json','utf8'));
const test=suite.cases.find(c=>c.id===(process.argv[2]||'G002'));
if(!test)throw Error('Unknown test');
const target='https://tax-hkd.pages.dev';
const health=await fetch(target+'/api/health',{signal:AbortSignal.timeout(15000)}).then(r=>r.json());
const start=Date.now();
const res=await fetch(target+'/api/chatgpt/tax-qa?nocache=1',{method:'POST',headers:{'Content-Type':'application/json','X-Test-Run':'historical-regression-'+start},body:JSON.stringify(test.input),signal:AbortSignal.timeout(150000)});
const raw=await res.text();let response;try{response=JSON.parse(raw);}catch{response={raw};}
const result={id:test.id,startedAt:new Date(start).toISOString(),elapsedMs:Date.now()-start,http:res.status,version:health.pipelineVersion,mode:health.decisionMode,input:test.input,response};
const dir='outputs/historical-evidence-fix-2026-10-21/live';await fs.mkdir(dir,{recursive:true});await fs.writeFile(`${dir}/${test.id}-${start}.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));if(!res.ok)process.exitCode=1;
