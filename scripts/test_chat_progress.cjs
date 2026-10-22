const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const source=fs.readFileSync('worker/src/chatProgressStream.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const m={exports:{}};new Function('exports','module',code)(m.exports,m);
const stream=m.exports.streamChatProgress;
async function main(){
 const tasks=[],ctx={waitUntil:p=>tasks.push(p)},cors=new Headers({'Access-Control-Allow-Origin':'*'});
 let release,finished=false;
 const gate=new Promise(r=>release=r);
 const response=await stream(async notify=>{
   notify({stage:'classifying'});await gate;
   notify({stage:'reviewing'});finished=true;
   return Response.json({success:true,response:'Đáp án đã kiểm tra.',source:'test',remainingCredits:7});
 },ctx,cors);
 assert.equal(response.headers.get('Content-Type'),'text/event-stream; charset=utf-8');
 const reader=response.body.getReader();let first='';
 while(!first.includes('"type":"progress"'))first+=new TextDecoder().decode((await reader.read()).value);
 assert.match(first,/: connected/);assert.ok(first.indexOf('data: ')>=16384,'Initial SSE comment must cross intermediary sniffing buffers');assert.equal(response.headers.get('Content-Encoding'),'identity');
 assert.match(first,/"stage":"classifying"/);assert.equal(finished,false,'Must deliver progress before generation completes');
 assert.doesNotMatch(first,/delta|done|Đáp án/,'Never expose unreviewed drafts');
 release();let rest='';for(;;){const r=await reader.read();if(r.done)break;rest+=new TextDecoder().decode(r.value);}
 assert.ok(rest.indexOf('reviewing')<rest.indexOf('"type":"delta"'));
 assert.match(rest,/"type":"done","fullText":"Đáp án đã kiểm tra\."/);
 const denied=await stream(async()=>Response.json({success:false,requireDeposit:true},{status:403}),ctx,cors);
 assert.equal(denied.status,403);assert.equal((await denied.json()).requireDeposit,true);
 const broken=await stream(async notify=>{notify({stage:'generating'});throw Error('private internal draft');},ctx,cors);
 const err=await broken.text();assert.match(err,/"type":"error"/);assert.doesNotMatch(err,/private internal draft|"type":"done"/);
 const cancelled=await stream(async notify=>{notify({stage:'received'});await Promise.resolve();notify({stage:'reviewing'});return Response.json({success:true,response:'Xong'});},ctx,cors);
 await cancelled.body.cancel();await Promise.all(tasks);
 console.log('PASS: live progress before completion, validated answer only, HTTP preflight, SSE errors and cancellation.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
