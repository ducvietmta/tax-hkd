const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return{default:v,...v};}
 const m={exports:{}};new Function('require','module','exports','setTimeout',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id+(id.endsWith('.json')?'':'.ts'))),m,m.exports,(cb,ms)=>{const timer=setTimeout(cb,ms);if(ms>=1000)timer.unref();return timer;});cache.set(file,m.exports);return m.exports;}
const fixture=require('../tests/fixtures/scenario-recovery.json');
const policy=load('worker/src/decision/answerPolicy.ts');
const pending=load('worker/src/pendingTopics.ts');
const contract=load('worker/src/decision/answerContract.ts');
const validation=load('worker/src/answerValidation.ts');
const retrieval=load('worker/src/retriever.ts'),kb=load('worker/src/ragEngine.ts'),scopeModule=load('worker/src/answerScope.ts');
const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'TAX_CALCULATION',secondaryIntents:['RELIEF_REDUCTION'],incomeTypes:['SERVICE','GOODS_SALES','AFFILIATE_COMMISSION'],topic:'TAX_AMOUNT',taxFocus:'pit',revenueContext:'ACTUAL_YEAR',calculationShape:'SCENARIOS'};
assert.deepEqual(pending.matchPendingTopics(fixture.original),[],'Unrelated amount+aggregation must not activate rental disclaimer');
assert(pending.matchPendingTopics('Cho thuê nhà và kinh doanh khác, cộng ngưỡng 1 tỷ').length);
assert(!contract.answerContract(semantic).includes('giả định hàng hóa 1%'));
assert(policy.GROUNDED_ANSWER_POLICY.includes('Không suy chi phí lớn'));
assert(policy.reviewRepairGuidance(['method_applicability:INCOMPLETE','coverage:INCOMPLETE']).includes('năm bắt đầu'));
assert(policy.reviewClarification('CURRENT_METHOD').includes('bắt đầu từ năm nào'));
assert.equal(policy.reviewClarification('OTHER_EVIDENCE'),null,'Do not invent a user question for missing legal sources');
assert.equal(policy.reviewClarification('UNTRUSTED_TEXT'),null);
const table=kb.CANONICAL_CHUNKS.find(c=>c.ref_id==='16.77');
const context=retrieval.buildContext([{chunk:table,score:1},...['16.56','16.39','16.40'].map(ref=>({chunk:kb.CANONICAL_CHUNKS.find(c=>c.ref_id===ref),score:1}))],fixture.original,12000,scopeModule.resolveAnswerScope([],fixture.original));
assert(context.text.includes('| Phân phối, cung cấp hàng hoá | 0,5% |'));
assert(context.text.includes('| Dịch vụ, xây dựng không bao thầu nguyên vật liệu | 2% |'));
assert(context.text.includes('từ năm tiếp theo'),'Rate table must retain governing method/transition rule');
assert(context.text.includes('×15%')&&context.text.includes('×17%'),'Short method rule retains ALL income brackets even with a legacy file name');
assert(context.includedRefs.includes('16.56')&&context.includedRefs.includes('16.77'));
assert.equal(validation.canUseVerifiedAnswer('Tính TNCN năm 2026', 'TNCN 101,15 triệu', 'pit', {...semantic,calculationShape:'SINGLE',methodContext:'TURNOVER_ACTIVE'}),false,'Active method must not be overwritten by a simple revenue template');
assert.equal(validation.canUseVerifiedAnswer('Tính TNCN năm 2026', 'TNCN 101,15 triệu', 'pit',semantic),false,'Single-total template must not certify multiple scenarios');
const worker=load('worker/src/index.ts').default;
const native=require('./fixtures/quyet_native.cjs');
const originalFetch=global.fetch,originalCaches=global.caches;
global.caches={default:{match:async()=>undefined,put:async()=>{}}};
let calls=[],reviews=0,mode='repair';
const correct='Mình tách hai kịch bản. Doanh thu là 3 tỷ hoặc 3,2 tỷ; chi phí hợp lệ 2,35 tỷ. Không tính GMV thành doanh thu của bạn. Chưa rõ phương pháp hiện tại và năm bắt đầu nên chưa chốt chuyển ngay trong kỳ. Nếu được áp dụng phương pháp thu nhập: kịch bản đầu 650 triệu × 15% = 97,5 triệu, sau giảm là 68,25 triệu; kịch bản sau 850 triệu × 17% = 144,5 triệu, sau giảm 101,15 triệu. Đây là các số có điều kiện. Nếu đang theo tỷ lệ doanh thu và hết năm mới vượt ngưỡng thì phải kiểm nhánh chuyển từ năm sau. Chưa đủ tỷ lệ của từng hoạt động để chốt cách có lợi nhất. Tax 20 triệu chưa rõ loại nên chưa đối trừ. Bạn đang áp dụng phương pháp nào, bắt đầu năm nào?';
const factText='Các khoản được xác nhận gồm 2,2 tỷ sửa máy, 600 triệu bán linh kiện và 200 triệu hoa hồng; tổng là 3 tỷ đồng.';
global.fetch=async(url,init)=>{
 const input=JSON.parse(init.body);
 if(input.questions){const result=native(input,'IN_SCOPE',semantic);
   if(input.questions.facts){reviews++;assert(input.questions.method_applicability&&input.questions.method_comparison&&input.questions.scenario_coverage&&input.questions.missing_fact);
     if(mode==='confidence')result.answers.evidence.confidence=.4;
     else if(mode==='rate'){result.answers.income_rate_tier={type:'choice',choice:'CONTRADICTED',confidence:.4};result.answers.missing_fact.choice='CURRENT_METHOD';}
     else if(mode==='blocked'||mode==='partial'||mode==='noFact'||reviews===1){result.answers.evidence.choice='CONTRADICTED';result.answers.method_applicability.choice='INCOMPLETE';result.answers.missing_fact.choice=mode==='noFact'?'OTHER_EVIDENCE':'CURRENT_METHOD';}
     if(mode==='partial'){assert.equal(input.questions.safe_fact.criteria.P1,factText);result.answers.safe_fact={type:'choice',choice:'P1',confidence:.99};}}
   if(input.questions.facts&&result.answers.evidence.choice==='CONTRADICTED')for(const key of Object.keys(input.questions).filter(k=>k.startsWith('claim_'))){
     const claim=input.state.grounding?.claims.find(c=>`claim_${c.id}`===key);
     result.answers[key]={type:'choice',choice:mode==='partial'&&claim?.text===factText?'COMPLETE':'CONTRADICTED',confidence:.99};
   }
   return Response.json(result);}
 calls.push(input);assert(!input.instructions.includes('bắt buộc tính ngay thu nhập tính thuế'));assert(!input.instructions.includes('giả định hàng hóa 1% GTGT'));
 if(mode==='unavailable')return new Response('fixture unavailable',{status:503});
 if(input.instructions.includes('CHỈ SỬA ĐOẠN:')){
   const ids=JSON.parse(input.instructions.match(/CHỈ SỬA ĐOẠN: (\[[^\n]*?\])/)[1]);
   const evidence=[...new Set([...input.instructions.matchAll(/evidence_id=(E\d+)/g)].map(m=>m[1]))];
   const requests=[...new Set([...input.instructions.matchAll(/"id":"([A-Z_]+:(?:pit|vat|unspecified))"/g)].map(m=>m[1]))];
   return Response.json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({edits:ids.map(id=>({id,text:correct,evidence_ids:evidence,request_ids:requests})),append:[]})}]}]});
 }
 return Response.json({output:[{type:'message',content:[{type:'output_text',text:mode==='partial'?`Phần tài chính bị bác: bắt buộc chuyển ngay sang 17%.\n\n${factText}`:calls.length===1&&mode!=='confidence'?'Doanh thu 3,2 tỷ nên bắt buộc chuyển ngay sang 17%; có chi phí lớn thì phương pháp thu nhập có lợi hơn.':correct}]}]});
};
async function run(message){calls=[];reviews=0;return(await worker.fetch(new Request('https://test/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},body:JSON.stringify({message})}),{FPT_AI_KEY:'fixture',MUSE_API_KEY:'fixture',DECISION_MODE:'enforce'},{waitUntil(){}},new Headers())).json();}
(async()=>{
 let value=await run(fixture.original);assert(value.response.includes('3,2 tỷ'));assert(!value.response.includes('Mình chưa xác minh'));assert.equal(calls.length,2);assert(calls[1].instructions.includes('năm bắt đầu'));assert.equal(value.retrieval.answerReview.status,'PASS');
 mode='blocked';value=await run(fixture.variant);assert.equal(value.source,'Needs clarification (review recovery)');assert.equal(value.retrieval.answerReview.status,'NEEDS_CLARIFICATION');assert.equal(value.retrieval.decision.status,'NEEDS_INFO');assert(value.response.includes('bắt đầu từ năm nào'));assert(!/144,5|101,15|bắt buộc chuyển ngay/.test(value.response),'Never leak rejected financial draft');assert.equal(calls.length,2);
 mode='noFact';value=await run(fixture.knownTransition);assert(value.response.includes('Mình chưa xác minh'),'Hard rejection without a known missing fact remains closed');
 mode='confidence';value=await run(fixture.original);assert.equal(calls.length,1,'Do not regenerate a substantively accepted answer to change reviewer confidence');assert(value.response.includes('3,2 tỷ'));
 mode='rate';value=await run(fixture.original);assert.equal(value.source,'Needs clarification (review recovery)');assert(value.retrieval.answerReview.issues.includes('income_rate_tier:CONTRADICTED'),'Low confidence cannot erase a contradiction and release a wrong rate');
 mode='unavailable';value=await run(fixture.original);assert.equal(value.source,'system_connection_error');assert.equal(reviews,0,'Provider failure must not render a single extracted amount as the whole multi-scenario answer');assert(value.diagnostic_code);
 mode='partial';value=await run(fixture.original);assert.equal(value.source,'Needs clarification (review recovery)');assert(value.response.includes(factText));assert(value.response.includes('bắt đầu từ năm nào'));assert(!value.response.includes('bắt buộc chuyển ngay'));assert.equal(value.retrieval.answerReview.partialFactsReturned,true);
 console.log('PASS: grounded prompt and actionable repair; no false rental warning; full pipeline repairs; rejected draft never leaks; typed missing-fact question; fail-closed without safe recovery. Model calls are mocked.');
})().finally(()=>{global.fetch=originalFetch;global.caches=originalCaches;}).catch(e=>{console.error(e);process.exitCode=1;});
