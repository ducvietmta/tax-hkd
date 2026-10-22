import fs from 'node:fs/promises';
const cases={
 original:'huỷ đăng ký cá nhân kinh doanh có dễ không',
 direct:'Tôi là cá nhân kinh doanh affiliate, chỉ đăng ký thuế trực tiếp, không có giấy hộ. Tôi muốn nghỉ hẳn trong tháng 10/2026. Cần nộp mẫu gì, ở đâu, có chắc xong trong 3 ngày từ lúc nộp đơn không? Mã thuế cá nhân để công ty khấu trừ lương còn dùng được không?',
};
const id=process.argv[2]||'original';if(!cases[id])throw Error('Unknown case');
const start=Date.now();
const response=await fetch('https://tax-hkd.pages.dev/api/chatgpt/tax-qa?nocache=1',{
 method:'POST',headers:{'Content-Type':'application/json','X-Test-Run':`business-cessation-${id}`},
 body:JSON.stringify({message:cases[id]}),signal:AbortSignal.timeout(75000),
});
const value=await response.json();
await fs.mkdir('outputs/cessation-review',{recursive:true});
await fs.writeFile(`outputs/cessation-review/${id}-live.json`,JSON.stringify({http:response.status,elapsedMs:Date.now()-start,...value},null,2));
console.log(JSON.stringify({http:response.status,elapsedMs:Date.now()-start,answer:value.answer||value.response,source:value.source,decision:value.decision,error:value.error}));
if(!response.ok)process.exitCode=1;
