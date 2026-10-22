import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const endpoint='https://tax-hkd.pages.dev/api/registration-guide/industry';
const results=[];
for(const test of [
 {name:'computer repair',activity:'Tôi chỉ sửa chữa máy vi tính cho khách và thu tiền công sửa chữa, không bán riêng linh kiện.',expected:'9510'},
 {name:'ambiguous online',activity:'Tôi kinh doanh online.',expected:'clarify'},
]){
 const start=Date.now();
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Registration-Probe':'industry-smoke'},body:JSON.stringify({activity:test.activity,clarifications:[]}),signal:AbortSignal.timeout(30000)});
 const value=await response.json();
 const record={name:test.name,http:response.status,elapsedMs:Date.now()-start,...value};results.push(record);console.log(JSON.stringify(record));
 await fs.mkdir('outputs/registration-industry',{recursive:true});
 await fs.writeFile('outputs/registration-industry/live.json',JSON.stringify(results,null,2));
 assert.equal(response.status,200);
 if(test.expected==='clarify')assert.equal(value.status,'clarify');else {assert.equal(value.status,'suggested');assert.equal(value.code,test.expected);}
}
console.log('PASS: production semantic selection and clarification. Two live calls.');
