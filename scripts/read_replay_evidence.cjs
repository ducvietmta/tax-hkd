const fs=require('fs'),d='outputs/prompt-replay-210-2026-10-22/prompts/';
for(const id of process.argv.slice(2)){const p=JSON.parse(fs.readFileSync(d+id+'.json','utf8'));const s=p.requests[0]?.instructions||'';const a=s.lastIndexOf('BẰNG CHỨNG:');const b=s.lastIndexOf('HỢP ĐỒNG NGUỒN:');console.log('\n'+id+'\n'+s.slice(a,b));}
