const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();let identity='+84912345678',limited=false;
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};new Function('require','module','exports',code)(id=>{
  if(id==='./firebaseAuth')return{verifiedFirebasePhone:async()=>identity};
  if(id==='./rateLimit')return{isChatRateLimited:async()=>limited};
  return load(path.resolve(path.dirname(file),id+'.ts'));
 },m,m.exports);cache.set(file,m.exports);return m.exports;
}
const {handleRegistrationAdvisor:handle}=load('worker/src/registrationAdvisor.ts');
const {readRegistrationModelStream:parse}=load('worker/src/registrationModelStream.ts');
const advisor=load('shared/registrationAdvisor.ts');
const {SUBJECT_SCOPE_POLICY}=load('worker/src/decision/registrationScope.ts');
const originalFetch=global.fetch;let credits=3,calls=[],pending=[];
const env={MUSE_API_KEY:'offline-fixture',DB:{prepare(sql){
 return {bind(phone){
  assert.equal(phone,identity);
  return {async first(){
   if(sql.includes('credits = credits - 1')){if(credits<=0)return null;return{credits:--credits};}
   if(sql.includes('credits = credits + 1'))return{credits:++credits};
   throw Error('Unexpected SQL: '+sql);
  }};
 }};
}}};
const ctx={waitUntil(p){pending.push(p);}},cors=new Headers();
const request=(extra={},method='POST')=>new Request('https://test.local/api/registration-guide/chat',{method,headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},...(method==='POST'?{body:JSON.stringify({message:'Ô này điền gì?',panelContext:{section:3,text:'III.4 · Ngành nghề kinh doanh'},...extra})}:{})});
const event=x=>'data: '+(typeof x==='string'?x:JSON.stringify(x))+'\n\n';
const final=text=>event({type:'response.completed',response:{status:'completed',output:[{type:'message',content:[{type:'output_text',text}]}]}});
const upstream=text=>new Response(text,{headers:{'Content-Type':'text/event-stream'}});
async function all(response){const text=await response.text();await Promise.all(pending);pending=[];return text.split('\n\n').filter(p=>p.startsWith('data: {')).map(p=>JSON.parse(p.slice(6)));}
async function main(){
 assert.deepEqual(advisor.registrationPanelContext({section:99,text:42}),{section:0,text:''});
 assert.equal(advisor.registrationPanelContext({section:3,text:'x'.repeat(9000)}).text.length,5000);
 global.fetch=async(url,init)=>{assert.equal(url,'https://api.meta.ai/v1/responses','No classifier/reviewer/other model call');calls.push(JSON.parse(init.body));return upstream(event({type:'response.output_text.delta',delta:'Ghi hoạt động thực tế.'})+final('Ghi hoạt động thực tế.'));};
 identity=null;assert.equal((await handle(request(),env,ctx,cors)).status,401);assert.equal(calls.length,0);identity='+84912345678';
 assert.equal((await handle(request({},'GET'),env,ctx,cors)).status,405);
 assert.equal((await handle(request({phone:'wrong'}),env,ctx,cors)).status,403);
 assert.equal((await handle(request({message:42}),env,ctx,cors)).status,400);
 assert.equal((await handle(request({message:'x'.repeat(64001)}),env,ctx,cors)).status,400);
 limited=true;assert.equal((await handle(request(),env,ctx,cors)).status,429);limited=false;
 credits=0;assert.equal((await handle(request(),env,ctx,cors)).status,403);credits=3;
 const response=await handle(request(),env,ctx,cors);assert.equal(response.headers.get('X-Assistant-Flow'),'registration-direct-v1');
 const events=await all(response);assert.equal(events.find(e=>e.type==='done').fullText,'Ghi hoạt động thực tế.');assert.equal(credits,2);assert.equal(calls.length,1);assert(calls[0].instructions.includes(SUBJECT_SCOPE_POLICY),'Independent advisor must preserve the same subject boundary without adding model calls');
 const call=calls[0];assert.equal(call.stream,true);assert.equal(call.reasoning.effort,'minimal');assert.equal(call.store,false);assert.equal(call.max_output_tokens,2600);
 assert.match(call.instructions,/03-ĐKT/);assert.match(call.input.at(-1).content[0].text,/III\.4/);assert.equal(call.input.at(-1).content[1].text,'Ô này điền gì?');
 assert(!events.some(e=>e.type==='progress'&&['classifying','reviewing','repairing'].includes(e.stage)));

 // A real delta must be readable before the model is allowed to complete.
 let finish;
 global.fetch=async()=>new Response(new ReadableStream({start(controller){
  controller.enqueue(new TextEncoder().encode(event({type:'response.output_text.delta',delta:'Bước đầu tiên: '})));
  finish=()=>{controller.enqueue(new TextEncoder().encode(final('Bước đầu tiên: mở tờ khai.')));controller.close();};
 }}),{headers:{'Content-Type':'text/event-stream'}});
 const streaming=await handle(request(),env,ctx,cors),reader=streaming.body.getReader();let received='';
 while(!received.includes('"type":"delta"'))received+=new TextDecoder().decode((await reader.read()).value);
 assert(!received.includes('"type":"done"'));finish();while(true){const next=await reader.read();if(next.done)break;received+=new TextDecoder().decode(next.value);}await Promise.all(pending);pending=[];
 assert(received.includes('"fullText":"Bước đầu tiên: mở tờ khai."'));assert.equal(credits,1);

 // An incomplete stream must refund and must never emit a successful completion.
 global.fetch=async()=>upstream(event({type:'response.output_text.delta',delta:'Đang trả lời dở'}));
 const incomplete=await all(await handle(request(),env,ctx,cors));assert(incomplete.some(e=>e.type==='error'));assert(!incomplete.some(e=>e.type==='done'));assert.equal(credits,1);
 const gate=await Promise.all([handle(request(),env,ctx,cors),handle(request(),env,ctx,cors)]);
 assert.deepEqual(gate.map(r=>r.status).sort(),[200,403]);await all(gate.find(r=>r.status===200));assert.equal(credits,1);

 // Cancelled downstream requests abort their provider call and refund once.
 let providerAborted=false;
 global.fetch=async(_url,init)=>new Response(new ReadableStream({start(controller){
  init.signal.addEventListener('abort',()=>{providerAborted=true;controller.error(new Error('cancelled'));},{once:true});
 }}),{headers:{'Content-Type':'text/event-stream'}});
 const cancelled=await handle(request(),env,ctx,cors);await cancelled.body.cancel();await Promise.all(pending);pending=[];assert(providerAborted);assert.equal(credits,1);

 for(const bad of [event('[DONE]'),event({type:'response.output_text.done',text:'Not completed'}),event({type:'response.failed'}),event({type:'response.incomplete'})])await assert.rejects(()=>parse(upstream(bad),()=>{}));
 let out='';const bytes=new TextEncoder().encode(event({type:'response.reasoning_summary_text.delta',delta:'private reasoning'})+event({type:'response.output_text.delta',delta:'Điền ngành nghề.'})+final('Điền ngành nghề.'));
 let offset=0;const chunked=new Response(new ReadableStream({pull(controller){if(offset>=bytes.length)return controller.close();controller.enqueue(bytes.slice(offset,++offset));}}),{headers:{'Content-Type':'text/event-stream'}});
 assert.equal(await parse(chunked,delta=>{out+=delta;}),'Điền ngành nghề.');assert.equal(out,'Điền ngành nghề.');
 console.log('PASS: isolated one-call advisor; auth/rate/atomic credits; live token delivery before completion; panel context; bounded input; strict terminal events; UTF-8; cancellation/refunds; no reasoning leak. Real API calls: 0.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{global.fetch=originalFetch;});
