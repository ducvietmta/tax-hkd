// End-to-end route tests with isolated auth/storage/provider fixtures. No network.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const overrides=new Map([
 [path.resolve('worker/src/firebaseAuth.ts'),{verifiedFirebasePhone:async()=> 'test-user'}],
 [path.resolve('worker/src/rateLimit.ts'),{isChatRateLimited:async()=>false}],
]);
const load=require('./lib/load_local_ts.cjs')(overrides),native=require('./fixtures/jev_native.cjs');
const {handleChat}=load('worker/src/routeChat.ts');
const {handleMcp}=load('worker/src/routesMcp.ts');
let draft='Nội dung giả lập để kiểm tra luồng nguồn.',failReview=false,modelCalls=0,reviewCalls=0;
let primaryTimeout=false,validMuseFallback=false,museReviewCalls=0,elapsed=0;
const realNow=Date.now;Date.now=()=>realNow()+elapsed;
const reviewFixture=require('./fixtures/muse_review.cjs'),traces=[];
const captured=[],pending=[],rows=new Map(),ctx={waitUntil:p=>pending.push(p)};
const db={prepare(sql){const statement={values:[],bind(...v){return {...statement,values:v};},async first(){
 if(sql.includes('FROM users'))return {id:'test-user',phone:'test-user',credits:100};
 if(sql.startsWith('SELECT credits')||sql.startsWith('UPDATE users'))return {credits:99};
 if(sql.includes('SELECT payload FROM answer_cache'))return rows.has(this.values[0])?{payload:rows.get(this.values[0])}:null;
 return null;
 },async run(){if(sql.startsWith('INSERT OR IGNORE INTO answer_cache')&&!rows.has(this.values[0]))rows.set(this.values[0],this.values[1]);if(sql.startsWith('INSERT INTO answer_grounding_traces'))traces.push(JSON.parse(this.values[2]));return {};}};return statement;}};
const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic:'OTHER',answerPurpose:'OTHER',revenueContext:'UNSPECIFIED',calculationShape:'UNSPECIFIED'};
global.caches={default:{match:async()=>null,put:async()=>{}}};
global.fetch=async(url,init)=>{
 const body=JSON.parse(init.body);
 if(String(url).includes('systemone')){
  if(body.questions.facts){reviewCalls++;if(primaryTimeout){elapsed+=25000;throw new DOMException('Fixture primary deadline','TimeoutError');}if(failReview)return Response.json({answers:{}});}
  return Response.json(native(body,'IN_SCOPE',semantic));
 }
 if(String(url)==='https://api.openai.com/v1/chat/completions'){
  modelCalls++;
  const instructions=body.messages.filter(message=>message.role==='system').map(message=>message.content).join('\n');
  captured.push(instructions);
  const requests=JSON.parse(instructions.match(/YÊU CẦU CẦN GIẢI QUYẾT: (\[[^\n]+\])/)?.[1]||'[]');
  const evidenceId=instructions.match(/evidence_id=(E\d+)/)?.[1];
  assert(requests.length&&evidenceId,'Non-streaming generation must receive the grounded request packet');
  const text=draft+` [[E:${evidenceId};R:${requests[0].id}]]`;
  if(body.stream)return new Response('data: '+JSON.stringify({choices:[{delta:{content:text}}]})+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
  return Response.json({choices:[{message:{content:text}}]});
 }
 if(String(url)==='https://api.openai.com/v1/responses'){
  modelCalls++;captured.push(body.instructions);
  const requests=JSON.parse(body.instructions.match(/YÊU CẦU CẦN GIẢI QUYẾT: (\[[^\n]+\])/)?.[1]||'[]');
  const evidenceId=body.instructions.match(/evidence_id=(E\d+)/)?.[1];
  const text=draft+` [[E:${evidenceId};R:${requests[0].id}]]`;
  const events=[{type:'response.reasoning_text.delta',delta:'PRIVATE_MODEL_REASONING'},
   {type:'response.reasoning_summary_text.delta',item_id:'r1',summary_index:0,delta:'Public model summary'},
   {type:'response.output_text.delta',delta:text},
   {type:'response.completed',response:{status:'completed',model:'gpt-6-luna',output:[{type:'message',content:[{type:'output_text',text}]}]}}];
  return new Response(events.map(e=>'data: '+JSON.stringify(e)+'\n\n').join(''),{headers:{'Content-Type':'text/event-stream'}});
 }
 if(String(url)!=='https://api.meta.ai/v1/responses')throw Error('UNEXPECTED_NETWORK: '+url);
 // Reviewer fallback is a mock failure, not a real outbound request.
 if(body.instructions?.includes('MUSE_GROUNDED_REVIEW')){museReviewCalls++;return validMuseFallback?Response.json({output:[{type:'message',content:[{text:JSON.stringify(reviewFixture(JSON.parse(body.input.at(-1).content[0].text)))}]}]}):Response.json({output:[]});}
 modelCalls++;captured.push(body.instructions);
 const requests=JSON.parse(body.instructions.match(/YÊU CẦU CẦN GIẢI QUYẾT: (\[[^\n]+\])/)?.[1]||'[]');
 const evidenceId=body.instructions.match(/evidence_id=(E\d+)/)?.[1];
 return Response.json({output:[{type:'message',content:[{text:draft+` [[E:${evidenceId};R:${requests[0].id}]]`}]}]});
};
const env={DB:db,MUSE_API_KEY:'fixture',FPT_AI_KEY:'fixture',DECISION_MODE:'audit',STRICT_VERIFIED_EVIDENCE_ENABLED:'1',CASE_RECOGNITION_MODE:'on'};
const question='Tôi cần tra soát khoản nộp trùng và tiền đã bị trừ năm 2026';
async function call(pathname='/api/chatgpt/tax-qa',opts={}){
 const req=new Request('https://test.local'+pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,...opts})});
 const response=await handleChat(req,env,ctx,new Headers());assert.equal(response.status,200);const body=await response.json();return body;
}
(async()=>{
 const log=console.log;console.log=()=>{};
 try{
 const first=await call();assert.equal(first.answer,draft,JSON.stringify(first));assert.equal(first.answerReview.status,'PASS');assert(reviewCalls>0,'strict must review even DECISION_MODE=audit');
 assert(!JSON.stringify(first).includes('_verifiedProof'));assert(captured.every(p=>!p.includes('CASE_EVIDENCE')&&!p.includes('matched_case_ids')));
 assert(captured[0].includes('Chunk tình huống không phải nguồn trích dẫn'));
 const callsBefore=modelCalls;const second=await call();assert.equal(second.answer,first.answer);assert.equal(modelCalls,callsBefore,'valid strict proof can hit cache');
 const web=await call('/api/chat');assert.equal(web.response,first.answer);assert(!JSON.stringify(web).includes('_verifiedProof'));
 const mcpResponse=await handleMcp(new Request('https://test.local/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'ask_tax_ai',arguments:{question}}})}),env,ctx,new Headers());
 const mcp=await mcpResponse.json();assert.equal(mcp.result.structuredContent.answer,first.answer);assert(!JSON.stringify(mcp).includes('_verifiedProof'));
 const stream=await handleChat(new Request('https://test.local/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,stream:true})}),env,ctx,new Headers());
 const wire=await stream.text();assert(wire.includes(draft));assert(!wire.includes('_verifiedProof'));
 rows.clear();
 const openAiStream=await handleChat(new Request('https://test.local/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,stream:true})}),{...env,MUSE_API_KEY:undefined,OPENAI_API_KEY:'fixture',OPENAI_MODEL:'gpt-6-luna'},ctx,new Headers());
 const openAiWire=await openAiStream.text();
 assert(openAiWire.includes('Public model summary'));assert(!openAiWire.includes('PRIVATE_MODEL_REASONING'));
 assert(openAiWire.indexOf('Public model summary')<openAiWire.indexOf('"type":"delta"'));
 assert(openAiWire.includes('"reset":true'));assert(openAiWire.includes(draft));
 assert(openAiWire.indexOf('"stage":"reviewing"')<openAiWire.indexOf('"type":"delta"'));
 // A primary consuming its full deadline must not starve the other reviewer.
 rows.clear();primaryTimeout=true;validMuseFallback=true;
 const fallbackBefore=museReviewCalls,recovered=await call();assert.equal(recovered.answer,draft);assert.equal(recovered.answerReview.status,'PASS');assert(museReviewCalls>fallbackBefore);
 await Promise.allSettled(pending);assert(traces.some(t=>t.reviewRounds.some(r=>r.failureCode==='TimeoutError'&&r.budgetMs===25000)&&t.reviewRounds.some(r=>r.provider==='Muse evidence reviewer'&&r.issues?.length===0)),'Persist primary timeout and independently successful fallback');
 // Generation-provider preferences must not remove an independent review fallback.
 rows.clear();
 const fallbackCount=museReviewCalls;
 const auditEnv={...env,DISABLE_MUSE:'1',OPENAI_API_KEY:'fixture',OPENAI_MODEL:'gpt-6-luna',STRICT_VERIFIED_EVIDENCE_ENABLED:'0',CASE_RECOGNITION_MODE:'shadow'};
 const streamRequest=()=>new Request('https://test.local/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,stream:true})});
 const recoveredAudit=await handleChat(streamRequest(),auditEnv,ctx,new Headers());
 const recoveredWire=await recoveredAudit.text();assert(recoveredWire.includes(draft));assert(museReviewCalls>fallbackCount);
 primaryTimeout=false;validMuseFallback=false;failReview=true;rows.clear();
 const failedAudit=await handleChat(streamRequest(),auditEnv,ctx,new Headers());
 assert(!(await failedAudit.text()).includes(draft),'Audit mode may not release an unreviewed draft');
 const failedMcpReviewBefore=reviewCalls;
 const failedMcp=await handleMcp(new Request('https://test.local/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'ask_tax_ai',arguments:{question}}})}),auditEnv,ctx,new Headers());
 const failedTool=await failedMcp.json();assert(reviewCalls>failedMcpReviewBefore,'MCP failure fixture must reach review rather than fail generation');assert.equal(failedTool.result.isError,true);assert(!JSON.stringify(failedTool).includes(draft));
 failReview=false;
 primaryTimeout=false;validMuseFallback=false;rows.clear();
 // Corrupt the stored answer, then remove provenance: both must become cache misses.
 for(const mutation of [p=>p.response='https://facebook.com/case',p=>delete p._verifiedProof.packet.passages[0].provenance]){
  for(const [key,value] of rows){const data=JSON.parse(value);mutation(data);rows.set(key,JSON.stringify(data));}
  const before=modelCalls,reply=await call();assert(modelCalls>before);assert.equal(reply.answer,draft);rows.clear();
 }
 // Both blocked prose and its trace must avoid publishing the rejected case text.
 draft='Căn cứ https://facebook.com/groups/case và KB/01-ke-khai-nop-thue.md#65';
 const blocked=await call();assert.equal(blocked.source,'Verified source gate blocked');assert.deepEqual(blocked.legal_citations,[]);assert(!JSON.stringify(blocked).includes('facebook.com/groups/case'));assert.equal(rows.size,0);
 draft='Căn cứ 999/2099/ND-CP xác định nghĩa vụ.';
 const forged=await call();assert.equal(forged.source,'Verified source gate blocked');assert.deepEqual(forged.legal_citations,[]);
 draft='Nội dung giả lập để kiểm tra luồng nguồn.';failReview=true;
 const unavailable=await call();assert.notEqual(unavailable.answer,draft);assert.deepEqual(unavailable.legal_citations,[]);assert.equal(rows.size,0);
 failReview=false;
 // Unknown legacy payload cannot bypass the new proof requirement.
 await call();for(const [key] of rows)rows.set(key,JSON.stringify({response:'legacy',citations:[]}));
 const legacyCalls=modelCalls;const regenerated=await call();assert.equal(regenerated.answer,draft);assert(modelCalls>legacyCalls);
 await Promise.allSettled(pending);
 const scenarios=['review enforced in audit mode','policy in generation prompt','raw case absent from generation','valid reviewed cache hit','web parity','MCP parity','SSE parity','OpenAI public summary before reviewed answer','primary timeout preserves verified fallback and diagnostics','fallback independent of generation provider','audit blocks unreviewed answers','tampered answer cache miss','missing provenance cache miss','case citation blocked and draft trace redacted','invented document blocked','review outage blocked','legacy cache miss'];
 const result={scenarios,checks:scenarios.length,passed:scenarios.length,network_calls:0,model_calls_mocked:modelCalls,review_calls_mocked:reviewCalls,limitations:'Provider fixtures exercise plumbing, not legal accuracy.'};
 fs.writeFileSync('outputs/case-recognition-implementation-2026-10-23/pipeline-tests.json',JSON.stringify(result,null,2));
 log(JSON.stringify(result));
 }finally{console.log=log;Date.now=realNow;}
})().catch(e=>{console.error(e);process.exitCode=1;});
