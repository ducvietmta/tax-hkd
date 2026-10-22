const fs=require('node:fs'),cp=require('node:child_process');
const dir='outputs/grounded-recovery-2026-10-22';fs.mkdirSync(dir,{recursive:true});
const names=['test:grounded-calculation','kb:check','test:source-routing','test:required-evidence','test:period-evidence','test:business-subject','test:pipeline-audit','test:architecture','test:assurance','test:offline:191','test:decision'];
const rows=[];
for(const name of names){const file=dir+'/'+name.replaceAll(':','-')+'.log',fd=fs.openSync(file,'w');const r=cp.spawnSync('cmd.exe',['/d','/s','/c','npm run '+name],{stdio:['ignore',fd,fd],timeout:180000});fs.closeSync(fd);rows.push({suite:name,status:r.status,log:file});console.log(name,r.status===0?'PASS':'FAIL');if(r.status!==0)console.log(fs.readFileSync(file,'utf8').split('\n').slice(-20).join('\n'));}
const r=cp.spawnSync(process.execPath,['--max-old-space-size=6144','node_modules/typescript/bin/tsc','--noEmit','-p','tsconfig.json'],{encoding:'utf8',timeout:180000});rows.push({suite:'typecheck',status:r.status});if(r.status!==0)console.log(r.stdout,r.stderr);
fs.writeFileSync(dir+'/checks.json',JSON.stringify({apiCalls:0,rows},null,2));process.exitCode=rows.some(r=>r.status!==0)?1:0;console.log('typecheck',r.status===0?'PASS':'FAIL');
