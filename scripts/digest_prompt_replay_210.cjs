const fs=require('fs'),d='outputs/prompt-replay-210-2026-10-22';
const a=JSON.parse(fs.readFileSync(d+'/capture-manifest.json')).cases.map(c=>{const p=JSON.parse(fs.readFileSync(d+'/prompts/'+c.id+'.json'));const s=p.requests[0]?.instructions||'';const pos=Math.max(s.lastIndexOf('SỐ THUẾ DO CODE TÍNH'),s.lastIndexOf('LEDGER '));return {id:c.id,refs:c.refs,noLedger:s.includes('CHƯA CÓ LEDGER THUẾ'),ledger:pos>=0?s.slice(pos):null,captured:c.captured};});
fs.writeFileSync(d+'/prompt-digest.json',JSON.stringify(a,null,2));
console.log(a.map(x=>x.id+' '+(x.captured?(x.noLedger?'NO_LEDGER':x.ledger?'LEDGER':'NO_CALC_CONTRACT'):'CODE_ANSWER')+' '+x.refs.join(',')).join('\n'));
