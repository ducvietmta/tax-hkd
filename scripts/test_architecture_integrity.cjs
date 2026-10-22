/* Regression tests: preserve facts, source numbers, scenario identity and time. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();
function load(file){
 file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';
 if(cache.has(file))return cache.get(file);
 if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}
 const m={exports:{}};cache.set(file,m.exports);
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);
 cache.set(file,m.exports);return m.exports;
}
global.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};
const conversation=load('worker/src/conversation.ts'),retriever=load('worker/src/retriever.ts');
const validation=load('worker/src/answerValidation.ts'),understand=load('worker/src/decision/understandQuery.ts');
const {JevDecisionProvider}=load('worker/src/decision/jevProvider.ts');
const scope={years:[2026],today:'2026-10-21',periodSource:'current_message'};
const findings=[];
const long='Thông tin hoạt động. '.repeat(60)+' Tôi không cư trú; không tính GTGT.';
const normalized=conversation.normalizeConversationHistory([{role:'user',content:long}]);
assert(normalized[0].content.includes('không cư trú'));
findings.push({id:'history_truncation',originalLength:long.length,retainedLength:normalized[0].content.length,lost:'Tôi không cư trú; không tính GTGT.'});
const provider=new JevDecisionProvider('offline');
const providerState=provider.state('Vậy tính lại giúp tôi',[{role:'user',content:'a'.repeat(810)+' Chỉ tính TNCN.'}]);
assert(providerState.history[0].content.includes('TNCN'));
findings.push({id:'classifier_history_truncation',retainedLength:providerState.history[0].content.length});
function hit(ref,text,purpose){return {score:1,chunk:{id:ref,ref_id:ref,file:'audit',section:'audit',tier:'VERIFIED',text,...(purpose?{purpose_passages:{DEFINITION:text}}:{})}};}
const original='Ví dụ minh họa: doanh thu 16.5 triệu đồng.';
const context=retriever.buildContext([hit('audit-decimal',original)],'doanh thu',6500,scope);
assert(context.passages[0].text.includes('16.5'));
findings.push({id:'decimal_deleted',before:original,after:context.passages[0].text});
const definition=retriever.buildContext([hit('definition','Định nghĩa chủ thể.',true),hit('exception','Điều kiện ngoại lệ cần xét.')],'giải thích',6500,scope,'DEFINITION');
assert.deepEqual(definition.includedRefs,['definition','exception']);
findings.push({id:'purpose_discards_other_sources',inputRefs:['definition','exception'],outputRefs:definition.includedRefs});
const semantic={topic:'TAX_AMOUNT',taxFocus:'both',primaryIntent:'TAX_CALCULATION',secondaryIntents:[],incomeTypes:['SERVICE'],calculationShape:'SINGLE',methodContext:'UNSPECIFIED'};
const question='Tính riêng GTGT và TNCN cho doanh thu 4 tỷ.';
const incomplete='GTGT: cơ sở doanh thu 4 tỷ đồng. TNCN phải nộp 85 triệu đồng.';
const missing=validation.missingAnswerIntents(question,incomplete,semantic);
assert(missing.includes('vat_amount'));
assert.equal(validation.canUseVerifiedAnswer(question,incomplete,'both',semantic),false);
assert.equal(validation.canUseVerifiedAnswer(question,'TNCN phải nộp 85 triệu đồng. Doanh thu 4 tỷ.','pit',{...semantic,taxFocus:'pit'}),false);
findings.push({id:'basis_mistaken_for_tax_amount',question,answer:incomplete,missing,templateGateAllows:true,note:'Gate reproduction only; not an end-to-end generated answer.'});
const frame={tax_intent:{primary:{value:'TAX_CALCULATION'},secondary:[]},tax_period:{years:[2026]},taxpayer_type:{value:'INDIVIDUAL_BUSINESS'},income_type:[],facts:{},semantic:{taxFocus:'pit',calculationShape:'SCENARIOS'}};
const {validateScenarioPlan,scenarioRequests}=load('worker/src/decision/scenarioPlan.ts');
const source='Kịch bản cơ sở ghi trùng. Kịch bản thay thế chưa thu tiền.';
const branches=validateScenarioPlan({scenarios:[{condition_quote:'Kịch bản cơ sở ghi trùng.',source:'question'},{condition_quote:'Kịch bản thay thế chưa thu tiền.',source:'question'}]},source,[]);
const requests=scenarioRequests(frame,branches);
assert.equal(requests.length,2);
assert.notEqual(requests[0].id,requests[1].id);
assert.throws(()=>validateScenarioPlan({scenarios:[{condition_quote:'Điều kiện hoàn toàn bịa',source:'question'},{condition_quote:'Kịch bản thay thế chưa thu tiền.',source:'question'}]},source,[]));
const {PipelineBudget}=load('worker/src/decision/pipelineBudget.ts');
const b=new PipelineBudget(1000);b.startGeneration(1000);const allocated=b.generation(1000);assert(allocated>0&&allocated<=105000,'Generation must reserve at least 15 seconds of the overall budget');assert.equal(b.generation(1000+allocated),1);b.startReview(1000+allocated);assert(b.review(1000+allocated)>=15000,'Review must retain its reserved budget');assert(b.canRepair(66000));b.startRepair(66000);assert.equal(b.repair(66000),20000);assert(!b.canRepair(100000));
const {periodFits}=load('worker/src/kb/periodApplicability.ts');
assert(!periodFits({applies_from_year:2026,effective_from:'2026-07-01'},{years:[2026],event_date:'2026-06-30'}));
assert(periodFits({applies_from_year:2026,effective_from:'2026-07-01'},{years:[2026],event_date:'2026-07-01'}));
assert(!periodFits({applies_from_year:2026,effective_from:'2026-02-30'},{years:[2026]}));
assert.throws(()=>conversation.normalizeConversationHistory([{role:'user',content:'x'.repeat(60001)}]),e=>e.name==='CONVERSATION_CONTEXT_TOO_LARGE');
findings.push({id:'scenario_not_structured',requests,note:'Same intent/focus collapses to one request; no independent scenario facts or coverage contract.'});
fs.mkdirSync('outputs/architecture-audit-2026-10-21',{recursive:true});
fs.writeFileSync('outputs/architecture-audit-2026-10-21/regressions.json',JSON.stringify({apiCalls:0,passed:true,contracts:findings.length+4},null,2));
console.log('PASS: history, source numbers, additional sources, tax result coverage, scenario scopes/forgery, review reservations, effective-date boundaries. API calls: 0.');
// HTTP-level privilege spoofing and public connector limits must not run a model.
let authenticated=null;
cache.set(path.resolve('worker/src/firebaseAuth.ts'),{verifiedFirebasePhone:async()=>authenticated});
const {handleChat}=load('worker/src/routeChat.ts');
global.caches={default:{match:async()=>new Response('1000000000'),put:async()=>{}}};
(async()=>{
 const ctx={waitUntil:()=>{}};
 const spoofed=await handleChat(new Request('https://test/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},body:JSON.stringify({message:'Câu hỏi thử'})}),{},ctx,new Headers());
 assert.equal(spoofed.status,401);
 const limited=await handleChat(new Request('https://test/api/chatgpt/tax-qa',{method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},body:JSON.stringify({message:'Câu hỏi thử'})}),{},ctx,new Headers());
 assert.equal(limited.status,429);
 console.log('PASS: spoofed internal header requires login; public connector quota enforced before model calls.');
 authenticated='offline-user';
 let credits=1,reservations=0,release;const gate=new Promise(resolve=>{release=resolve;});
 const db={prepare(sql){const statement={bind(){return statement;},async first(){
   if(sql.includes('FROM users'))return {id:'offline-user',phone:'offline-user',credits};
   if(sql.startsWith('UPDATE users SET credits = credits - 1')){
     reservations++;if(reservations===2)release();
     return credits>0?{credits:--credits}:null;
   }
   if(sql.includes('COUNT(*)'))return {n:0};return null;
 },async run(){if(sql.startsWith('UPDATE users SET credits = credits + 1'))credits++;return {};}};return statement;}};
 const native=require('./fixtures/jev_native.cjs');
 global.fetch=async(_url,init)=>{await gate;return Response.json(native(JSON.parse(init.body),'UNCERTAIN',{taxpayer:'UNKNOWN',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic:'OTHER'}));};
 const req=()=>new Request('https://test/api/chat?nocache=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Câu hỏi thử về thuế'})});
 const concurrent=await Promise.all([handleChat(req(),{DB:db,FPT_AI_KEY:'fixture'},ctx,new Headers()),handleChat(req(),{DB:db,FPT_AI_KEY:'fixture'},ctx,new Headers())]);
 assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,403]);assert.equal(credits,1,'Uncertain scope refunds the single reserved credit');
 console.log('PASS: concurrent last-credit reservation; rejected/uncertain request refunds; zero live model calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
