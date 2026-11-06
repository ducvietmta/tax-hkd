const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const source=fs.readFileSync('worker/src/openAiRequest.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};new Function('exports','module',code)(mod.exports,mod);
const originalFetch=global.fetch;
const event=value=>'data: '+JSON.stringify(value)+'\r\n\r\n';
const complete=text=>({type:'response.completed',response:{status:'completed',model:'gpt-6-luna',output:[{type:'reasoning',content:[{text:'PRIVATE_REASONING'}],encrypted_content:'PRIVATE_ENCRYPTED'},{type:'message',content:[{type:'output_text',text}]}],usage:{output_tokens:25}}});
async function scenario(events){
 let wire,cancelled=false,offset=0,stream;const summaries=[],drafts=[];
 const bytes=new TextEncoder().encode(events.map(event).join(''));
 global.fetch=async(url,init)=>{wire={url,payload:JSON.parse(init.body)};stream=new ReadableStream({pull(c){if(offset===bytes.length){c.close();return;}c.enqueue(bytes.slice(offset,offset+3));offset=Math.min(bytes.length,offset+3);},cancel(){cancelled=true;}});return new Response(stream);};
 const result=await mod.exports.callOpenAIStream('offline-fixture','Private system instruction',[{role:'user',content:'Câu hỏi cũ'}],'Câu hỏi mới','gpt-6-luna',d=>drafts.push(d),60000,'low',d=>summaries.push(d));
 return{result,wire,summaries:summaries.join(''),drafts:drafts.join(''),cancelled,released:!stream.locked};
}
(async()=>{
 try{
  const r=await scenario([
   {type:'response.reasoning_text.delta',delta:'PRIVATE_REASONING'},
   {type:'response.reasoning_summary_text.delta',item_id:'r1',summary_index:0,delta:'Đối chiếu dữ kiện. '},
   {type:'response.reasoning_summary_text.delta',item_id:'r1',summary_index:0,delta:'Kiểm tra nguồn.'},
   {type:'response.reasoning_summary_text.done',item_id:'r1',summary_index:0,text:'Đối chiếu dữ kiện. Kiểm tra nguồn.'},
   {type:'response.output_text.delta',delta:'Bản nháp'},complete('Đáp án đầy đủ.')]);
  assert(r.result.ok);assert.equal(r.result.text,'Đáp án đầy đủ.');assert.equal(r.summaries,'Đối chiếu dữ kiện. Kiểm tra nguồn.');assert.equal(r.drafts,'Bản nháp');
  assert.equal(r.wire.url,'https://api.openai.com/v1/responses');assert.equal(r.wire.payload.reasoning.summary,'auto');assert.equal(r.wire.payload.reasoning.effort,'low');assert.equal(r.wire.payload.store,false);assert.equal(r.wire.payload.max_output_tokens,8192);
  assert.deepEqual(r.wire.payload.input,[{role:'user',content:'Câu hỏi cũ'},{role:'user',content:'Câu hỏi mới'}]);assert(!r.summaries.includes('PRIVATE'));assert(r.released);
  const unfinished=await scenario([{type:'response.output_text.delta',delta:'Partial'}]);assert.equal(unfinished.result.ok,false);
  for(const type of ['response.failed','response.incomplete','error'])assert.equal((await scenario([{type}])).result.ok,false);
  const doneOnly=await scenario([{type:'response.reasoning_summary_text.done',item_id:'r2',summary_index:0,text:'Tóm tắt công khai.'},complete('Xong.')]);assert.equal(doneOnly.summaries,'Tóm tắt công khai.');
  const bounded=await scenario([{type:'response.reasoning_summary_text.delta',item_id:'r3',summary_index:0,delta:'a'.repeat(13000)},complete('Xong.')]);assert.equal(bounded.summaries.length,12000);
  const empty=await scenario([complete('')]);assert.equal(empty.result.ok,false);
  console.log('PASS: public summaries only, UTF-8 split SSE, correct Responses payload/history, completion required, errors, bounded output and reader cleanup. API calls: 0.');
 }finally{global.fetch=originalFetch;}
})().catch(e=>{console.error(e);process.exitCode=1;});
