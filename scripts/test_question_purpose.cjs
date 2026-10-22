const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+(id.endsWith('.json')?'':'.ts'))),m,m.exports);cache.set(file,m.exports);return m.exports;}
cache.set(path.resolve('worker/src/firebaseAuth.ts'),{verifiedFirebasePhone:async()=> 'offline-user'});
const native=require('./fixtures/jev_native.cjs'),reviewFixture=require('./fixtures/muse_review.cjs');
const {JevDecisionProvider}=load('worker/src/decision/jevProvider.ts');
const understand=load('worker/src/decision/understandQuery.ts'),sub=load('worker/src/decision/subrequests.ts');
const {buildContext}=load('worker/src/retriever.ts'),{answerContract}=load('worker/src/decision/answerContract.ts'),{handleChat}=load('worker/src/routeChat.ts');
const originalFetch=global.fetch,originalCaches=global.caches;
const labels={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'TAX_CALCULATION',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic:'TAX_AMOUNT',revenueContext:'UNSPECIFIED',taxFocus:'unspecified',answerPurpose:'DEFINITION',calculationShape:'UNSPECIFIED'};
const scope={years:[2026],today:'2026-10-21',periodSource:'current_message'};
const question='Cá nhân kinh doanh là gì';
const explanation='Hiểu đơn giản, khi một cá nhân tự bán hàng hoặc cung cấp dịch vụ trong hoạt động kinh doanh, người đó là cá nhân kinh doanh. Đây là cách nhận diện người có hoạt động kinh doanh để quản lý thuế.\n\nCách gọi này không tự cho biết họ đã đăng ký hộ hay được miễn đăng ký hộ. Một hộ cũng có thể do một người thành lập; vì vậy không thể phân biệt chỉ bằng việc làm một mình hay cùng gia đình.';
const responseText=text=>Response.json({output:[{type:'message',content:[{text}]}]});
(async()=>{try{
 global.fetch=async(_url,init)=>Response.json(native(JSON.parse(init.body),'IN_SCOPE',labels));
 const semantic=await new JevDecisionProvider('fixture').classifyBusiness(question);
 assert.equal(semantic.answerPurpose,'DEFINITION');assert.equal(semantic.topic,'CONCEPT_EXPLANATION');assert.equal(semantic.primaryIntent,'LEGAL_TEXT_LOOKUP');
 assert(answerContract(semantic).includes('tổng hợp nhiều đoạn nguồn'));
 const retrieval=[];
 for(const q of [question,'Hiểu thế nào là một cá nhân có hoạt động kinh doanh?','Giải thích khái niệm cá nhân kinh doanh giúp tôi.']){
  const frame=understand.understandClassifiedQuery(q,scope,[],semantic),found=sub.retrieveSubrequests(q,frame,scope,8),context=buildContext(found.results,q,9000,scope,'DEFINITION');
  assert.equal(frame.tax_intent.primary.value,'LEGAL_TEXT_LOOKUP');
  const passage=context.passages.find(p=>p.ref_id==='16.108');assert(passage);
  assert(passage.text.includes('Cá nhân kinh doanh là cá nhân có hoạt động sản xuất'));
  assert(passage.text.includes('Khoản 1 Điều 82'),'Keep evidence for explanations, not a memorized sentence');
  assert(passage.text.includes('Khoản 1 Điều 85'),'Keep evidence distinguishing registration paths');
  retrieval.push({question:q,refs:context.includedRefs});
 }
 const pending=[];global.caches={default:{match:async()=>undefined,put:async()=>{}}};
 const outputs=[];
 for(const mode of ['accepted_paraphrase','unmapped_explanation','invalid_mapping','unmapped_bad_witness','review_unavailable','contradicted','coverage_missing','invented_witness','unknown_source','missing_claim','low_confidence']){
  let generationCalls=0,reviewCalls=0,repairs=0;
  global.fetch=async(url,init)=>{
   const input=JSON.parse(init.body);
   if(String(url).includes('systemone')){
    assert(!input.questions.facts,'Concept review must read evidence, not use old classification confidence gate');
    return Response.json(native(input,'IN_SCOPE',labels));
   }
   assert.equal(String(url),'https://api.meta.ai/v1/responses','No live network calls allowed');
   if(input.instructions.includes('MUSE_GROUNDED_REVIEW_V1')){
    reviewCalls++;
    if(mode==='review_unavailable')return new Response('',{status:503});
    const payload=JSON.parse(input.input.at(-1).content[0].text),report=reviewFixture(payload);
    if(mode==='contradicted'){report.claims[0].status='CONTRADICTED';report.checks.evidence.status='FAIL';}
    if(mode==='coverage_missing'){report.requests[0].status='INCOMPLETE';report.checks.coverage.status='FAIL';}
    if(mode==='invented_witness')report.claims[0].support[0].quote='This quotation was invented and does not exist in the evidence.';
    if(mode==='unmapped_bad_witness')report.claims[1].support[0].quote='Invented support that is not in the retrieved source.';
    if(mode==='unknown_source')report.claims[0].support[0].evidence_id='E999';
    if(mode==='missing_claim')report.claims.pop();
    if(mode==='low_confidence')report.claims[0].confidence=.5;
    return responseText(JSON.stringify(report));
   }
   if(input.instructions.includes('CHỈ SỬA ĐOẠN')){repairs++;return new Response('',{status:503});}
   generationCalls++;
   assert(input.instructions.includes('RAG là dữ liệu/căn cứ, không phải đáp án cố định'));
   const rs=JSON.parse(input.instructions.match(/YÊU CẦU CẦN GIẢI QUYẾT: (\[[^\n]+\])/)?.[1]||'[]');
   const evidence=[...input.instructions.matchAll(/evidence_id=(E\d+); ref_id=([^\]\s]+)/g)],chosen=evidence.find(m=>m[2]==='16.108');assert(chosen);
   return responseText(explanation.split('\n\n').map((p,i)=>i===1&&['unmapped_explanation','unmapped_bad_witness'].includes(mode)?p:p+` [[E:${i===1&&mode==='invalid_mapping'?'E999':chosen[1]};R:${rs[0].id}]]`).join('\n\n'));
  };
  const response=await handleChat(new Request('https://test.local/api/chat?nocache=1',{method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},body:JSON.stringify({message:question})}),{FPT_AI_KEY:'fixture',MUSE_API_KEY:'fixture',DECISION_MODE:'enforce'},{waitUntil:p=>pending.push(p)},new Headers());
  const b=await response.json();await Promise.allSettled(pending.splice(0));
  assert.equal(generationCalls,1);assert.equal(reviewCalls,1);
  assert.equal(b.retrieval.sourceDefinitionVerification,undefined,'No source quotation bypass');
  if(['accepted_paraphrase','unmapped_explanation'].includes(mode)){
   assert.equal(b.response,explanation,'Preserve generated explanation and supported distinctions');
   assert.equal(b.retrieval.answerReview.status,'PASS');assert.equal(repairs,0);
   if(mode==='unmapped_explanation'){assert.equal(b.retrieval.claimEvidence[1].mapping,'PROPOSED');assert.equal(b.retrieval.reviewRounds[0].report.mappingResolutions[0].claim_id,'C2');}
  }else{
   assert(!b.response.includes('Hiểu đơn giản'));
   assert.notEqual(b.source,'Verified partial answer');
   assert(!b.response.startsWith('Cá nhân kinh doanh là cá nhân có hoạt động sản xuất'),'No RAG definition replacement after failed model review');
  }
  outputs.push({mode,response:b.response,status:b.retrieval.answerReview.status,reviewer:b.retrieval.reviewRounds[0]?.provider});
 }
 fs.mkdirSync('outputs/generated-explanations-2026-10-21',{recursive:true});
 fs.writeFileSync('outputs/generated-explanations-2026-10-21/offline.json',JSON.stringify({live_model_calls:0,retrieval,outputs},null,2));
 console.log('PASS: three paraphrases, contextual RAG, generated explanation retained, separate evidence review, forged/missing/uncertain reviews rejected, no source-answer fallback. Mock models only.');
}finally{global.fetch=originalFetch;global.caches=originalCaches;}})().catch(e=>{console.error(e);process.exitCode=1;});
