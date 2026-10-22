/** Reproducible pipeline fault injection, never a live provider/legal accuracy test. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(process.env.TAX_TEST_SOURCE_ROOT||'.'),baseline=!!process.env.TAX_TEST_SOURCE_ROOT,cache=new Map();
// Auth is outside this audit: isolate billing with a synthetic verified user.
cache.set(path.resolve(root,'worker/src/firebaseAuth.ts'),{verifiedFirebasePhone:async()=> '0900000000'});
function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.relative(root,path.resolve(path.dirname(file),id+(id.endsWith('.json')?'':'.ts')))),m,m.exports);cache.set(file,m.exports);return m.exports;}
const native=require('./fixtures/jev_native.cjs'),{JevDecisionProvider}=load('worker/src/decision/jevProvider.ts');
const originalFetch=global.fetch,originalCaches=global.caches,results=[];
const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic:'OTHER',revenueContext:'UNSPECIFIED',taxFocus:'unspecified',calculationShape:'UNSPECIFIED'};
const save=(id,kind,question,expected,actual,pass,mode)=>{results.push({id,kind,question,expected,actual,pass,mode});if(!baseline)assert(pass,`${id}: ${JSON.stringify(actual).slice(0,200)}`);};
(async()=>{try{
 let calls=0;
 global.fetch=async(_url,init)=>{calls++;return calls===1?new Response('',{status:503}):Response.json(native(JSON.parse(init.body),'IN_SCOPE',semantic));};
 let p=new JevDecisionProvider('fixture',undefined,2000),q='Tôi ôm lô Taobao bán lại, cần khai thuế thế nào?';
 let value=await p.classifyTaxRelevance(q);save('B01','recovery',q,'IN_SCOPE after one transient HTTP failure',{value,calls},value==='IN_SCOPE'&&calls===2,'mock HTTP 503; real classifier');
 let repairedKeys=[];calls=0;
 global.fetch=async(_url,init)=>{const input=JSON.parse(init.body),reply=native(input,'IN_SCOPE',semantic);calls++;if(input.questions.tax_focus){if(!repairedKeys.length&&Object.keys(input.questions).length>1){reply.answers.tax_focus={type:'choice',choice:'both',confidence:'0.99'};repairedKeys.push('invalid');}else repairedKeys.push(...Object.keys(input.questions));}return Response.json(reply);};
 p=new JevDecisionProvider('fixture');q='Làm lại CCCD có cần cập nhật đăng ký thuế không?';value=await p.classifyBusiness(q);
 save('B02','recovery',q,'Recover only the malformed field; valid siblings unchanged',{classified:!!value,repairedKeys},!!value&&repairedKeys.includes('tax_focus'),'malformed typed field; real classifier');
 global.fetch=async(_url,init)=>Response.json(native(JSON.parse(init.body),'IN_SCOPE',semantic));
 p=new JevDecisionProvider('fixture');q='Hướng dẫn đủ các bước kê khai và chứng từ cho một người bán hàng online năm 2026.';
 const request={id:'R1',intent:'OTHER_TAX',tax_focus:'unspecified',period:{years:[2026]},assumptions:[]};
 const packet={requests:[request],passages:[{id:'E1',ref_id:'16.1',text:'Bằng chứng kiểm thử'}],claims:Array.from({length:17},(_,i)=>({id:'C'+(i+1),kind:'CLAIM',text:'Đoạn kiểm thử '+i,evidence_ids:['E1'],ref_ids:['16.1'],request_ids:['R1'],mapping:'PROPOSED'}))};
 value=await p.reviewAnswer(q,packet.claims.map(c=>c.text).join('\n\n'),'Bằng chứng kiểm thử',[],semantic,packet);
 save('B03','review_capacity',q,'All 17 claims reviewed, no silent truncation',{issues:value,reviewed:Object.keys(p.lastReviewClaims).length},Array.isArray(value)&&!value.length&&Object.keys(p.lastReviewClaims).length===17,'mock positive reviewer; real structural review');
 p=new JevDecisionProvider('fixture');q='Xin hướng dẫn chi tiết hồ sơ và các bước khai bổ sung nhiều kỳ.';value=await p.reviewAnswer(q,'x'.repeat(12001),'Bằng chứng');
 save('B04','review_diagnostic',q,'Explicit REVIEW_ANSWER_LIMIT, never misreported as legal rejection',{issues:value,code:p.failureCode},value===null&&p.failureCode==='REVIEW_ANSWER_LIMIT','oversized generated draft; real budget gate');
 global.fetch=async()=>Response.json({answers:{scope:{type:'choice',choice:'OUT_OF_SCOPE',confidence:.2}}});
 p=new JevDecisionProvider('fixture');q='Bán nước mía vỉa hè ít tiền thì kê khai sao?';value=await p.classifyTaxRelevance(q);
 save('B05','scope_uncertainty',q,'UNCERTAIN clarification instead of confident out-of-scope rejection',value,value==='UNCERTAIN','injected low-confidence scope label, not a live model observation');

 // Full handleChat path, with mock generation/review and real retrieval/gates.
 const {handleChat}=load('worker/src/routeChat.ts'),pending=[];
 global.caches={default:{match:async()=>undefined,put:async()=>{}}};
 const cases=[
 ['S01','Năm 2026 xây dựng không bao thầu nguyên vật liệu dùng tỷ lệ nào?','Nếu áp phương pháp tỷ lệ trên doanh thu, xây dựng không bao thầu nguyên vật liệu thuộc nhóm dịch vụ: tỷ lệ gốc GTGT 5%, TNCN 2%; còn phải xét điều kiện và phương pháp áp dụng.',t=>t.includes('5%')&&t.includes('2%')&&!t.includes('Tỷ lệ 3%')],
 ['S02','Năm 2026 cho thuê nhà áp ngưỡng nào?','Phải áp dụng ngưỡng của kỳ 2026, không lấy ngưỡng 100 triệu của năm cũ để kết luận nghĩa vụ hiện tại. Cần xác định doanh thu và loại hoạt động trước khi tính.',t=>t.includes('không lấy ngưỡng 100 triệu')&&!t.includes('120 triệu đồng/năm')],
 ['S03','So sánh năm 2025 và 2026, mỗi năm bán được 1.300 triệu; không thay số liệu.','Giữ doanh thu 1.300 triệu đồng cho mỗi năm. Phải xác định chính sách riêng của năm 2025 và năm 2026; không đổi dữ kiện thành ví dụ 300 triệu.',t=>t.includes('1.300 triệu đồng')&&!t.includes('Với doanh thu bán hàng 300 triệu')],
 ['S04','Năm 2026 đã có CCCD, bán Shopee có cần đăng ký 888 nữa không?','Không cần đăng ký mã mới chỉ vì thêm sàn; phải đối chiếu đăng ký thuế hiện có. CCCD là thông tin định danh, không tự chứng minh mọi thủ tục đăng ký đã hoàn tất.',t=>t.includes('phải đối chiếu đăng ký thuế hiện có')&&!t.includes('CÓ, hoạt động kinh doanh trên sàn')],
 ['S05','Năm 2026 nông sản tự trồng đã chế biến thành sản phẩm khác rồi bán Shopee có chắc miễn thuế không?','Chưa thể kết luận miễn toàn bộ. Cần phân biệt sản phẩm chưa chế biến hoặc sơ chế thông thường với chế biến thành sản phẩm khác, rồi đối chiếu các điều kiện miễn của từng sắc thuế.',t=>t.includes('Chưa thể kết luận miễn toàn bộ')&&!t.includes('hoàn toàn được miễn thuế')],
 ];
 for(const [id,question,draft,check]of cases){
  global.fetch=async(url,init)=>{
   const input=JSON.parse(init.body);
   if(String(url).includes('systemone'))return Response.json(native(input,'IN_SCOPE',{...semantic,primaryIntent:question.includes('So sánh')?'COMPARE_PERIODS':'OTHER_TAX',...(question.includes('So sánh')?{taxYears:[2026]}:{})}));
   assert.equal(String(url),'https://api.meta.ai/v1/responses','Never send a probe over the network');
   if(input.instructions?.includes('CHỈ SỬA ĐOẠN'))return new Response('',{status:503});
   const requests=JSON.parse(input.instructions.match(/YÊU CẦU CẦN GIẢI QUYẾT: (\[[^\n]+\])/)?.[1]||'[]');
   const evidence=[...input.instructions.matchAll(/evidence_id=(E\d+)/g)].map(m=>m[1]);
   return Response.json({output:[{type:'message',content:[{text:draft+(evidence.length&&requests.length?` [[E:${evidence.join(',')};R:${requests.map(r=>r.id).join(',')}]]`:'')}]}]});
  };
  const response=await handleChat(new Request('https://test.local/api/chat',{method:'POST',headers:{'Content-Type':'application/json','X-Internal-Caller':'mcp'},body:JSON.stringify({message:question})}),{FPT_AI_KEY:'fixture',MUSE_API_KEY:'fixture',DECISION_MODE:'enforce'}, {waitUntil:p=>pending.push(p)},new Headers());
  const body=await response.json();await Promise.allSettled(pending.splice(0));
  save(id,'wording_preservation',question,draft,{response:body.response,source:body.source,review:body.answerReview||body.answer_review},check(body.response||''),'real handleChat; supplied model draft + mock legal reviewer');
 }
 // Real generation loop with injected semantic verdicts. Wording alone never
 // releases a draft; a conditional word cannot conceal a false conclusion.
 for(const scenario of ['repair_once','repair_twice','unavailable']){
  let generations=0,assessments=0;
  const question='Tôi mới lập kế hoạch kinh doanh, chưa có số chốt năm. Nghĩa vụ thuế cần xét thế nào?';
  const wrong='Nếu bạn chưa có số thực tế, bạn vẫn chắc chắn đã thuộc diện bắt buộc dùng hóa đơn ngay từ dự báo.';
  const corrected='Con số kế hoạch chỉ phục vụ dự báo. Cần đối chiếu số liệu ghi nhận thực tế và kỳ áp dụng trước khi kết luận nghĩa vụ.';
  const scopeSemantic={...semantic,topic:'REVENUE_THRESHOLD',answerPurpose:'CALCULATION',revenueContext:'PROJECTED'};
  global.fetch=async(url,init)=>{
   const input=JSON.parse(init.body);
   if(String(url).includes('systemone')){
    if(input.questions.request_alignment){
     assessments++;
     if(scenario==='unavailable')return new Response('',{status:503});
     const reply=native(input,'IN_SCOPE',scopeSemantic);
     if(scenario==='repair_twice'||assessments===1)reply.answers.fact_roles={type:'choice',choice:'CONTRADICTED',confidence:.99};
     return Response.json(reply);
    }
    return Response.json(native(input,'IN_SCOPE',scopeSemantic));
   }
   assert.equal(String(url),'https://api.meta.ai/v1/responses');
   generations++;
   return Response.json({output:[{type:'message',content:[{text:scenario==='unavailable'||generations>1?corrected:wrong}]}]});
  };
  const res=await handleChat(new Request('https://test.local/api/chat?nocache=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question})}),{FPT_AI_KEY:'fixture',MUSE_API_KEY:'fixture',DECISION_MODE:'audit'}, {waitUntil:p=>pending.push(p)},new Headers());
  const body=await res.json();await Promise.allSettled(pending.splice(0));
  assert(!String(body.response).includes(wrong));
  assert.equal(generations,scenario==='unavailable'?1:2);
  if(scenario==='repair_twice')assert(String(body.response).includes('chưa giữ đúng'));
  else assert(String(body.response).includes('Con số kế hoạch'));
  save('SEMANTIC_'+scenario,'semantic_scope_generation_loop',question,'Native semantic assessment governs bounded retry; no surface-word gate',{generations,assessments,response:body.response},true,'real handleChat; all providers mocked locally');
 }
 // Observed historical failure: a timing label must not erase all old law.
 {
  let generations=0;
  const question='Năm 2025 tôi bán hàng 280 triệu, giờ 2026 mới hỏi: nghĩa vụ năm đó thế nào?';
  const observed={...semantic,topic:'REVENUE_TIMING',primaryIntent:'OTHER_TAX',answerPurpose:'OTHER',incomeTypes:['GOODS_SALES'],calculationShape:'SINGLE'};
  global.fetch=async(url,init)=>{
   const input=JSON.parse(init.body);
   if(String(url).includes('systemone'))return Response.json(native(input,'IN_SCOPE',observed));
   assert.equal(String(url),'https://api.meta.ai/v1/responses');generations++;
   assert(input.instructions.includes('ref_id=16.54'));
   assert(!input.instructions.includes('ref_id=16.101'));
   return Response.json({output:[{type:'message',content:[{text:'Xét kỳ 2025 theo TT40: doanh thu bán hàng chịu thuế 280 triệu vượt 100 triệu. Theo tỷ lệ gốc, GTGT 2,8 triệu và TNCN 1,4 triệu, trước xét giảm GTGT và đối trừ số đã nộp có chứng từ.'}]}]});
  };
  const res=await handleChat(new Request('https://test.local/api/chat?nocache=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question})}),
   {FPT_AI_KEY:'fixture',MUSE_API_KEY:'fixture',DECISION_MODE:'audit',VECTORIZE_ENABLED:'1',AI:{run:async()=>({data:[[.1,.2]]})},VECTORIZE:{query:async()=>({matches:[{id:'16.101',score:.99},{id:'16.77',score:.98}]})}},
   {waitUntil:p=>pending.push(p)},new Headers());
  const body=await res.json();await Promise.allSettled(pending.splice(0));assert.equal(generations,1);
  assert(String(body.response).includes('2,8 triệu'));
  assert(body.retrieval.decision.sourceCoverage.provided.includes('16.54'),'Historical evidence is required whether supplied by metadata or recovered fallback');
  save('PERIOD_SOURCE_RECOVERY','historical_generation_reached',question,'Applicable historical evidence reaches generation despite observed timing classification',{generations,response:body.response},true,'real handleChat; all providers mocked');
 }
 // Reproduce the production conditions: neutral policy labels + dense search.
 // The source must be present in the actual generation prompt, not only BM25.
 {
  let sourceReachedModel=false;
  const question=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/tax-hkd-191.json'),'utf8')).cases.find(c=>c.id==='G163').input.message;
  const observed={...semantic,topic:'REVENUE_THRESHOLD',primaryIntent:'OTHER_TAX',answerPurpose:'OTHER',incomeTypes:['GOODS_SALES'],calculationShape:'COMPOSITE'};
  global.fetch=async(url,init)=>{
   const input=JSON.parse(init.body);
   if(String(url).includes('systemone'))return Response.json(native(input,'IN_SCOPE',observed));
   assert.equal(String(url),'https://api.meta.ai/v1/responses');
   sourceReachedModel=input.instructions.includes('ref_id=16.39');
   assert(sourceReachedModel,'The named source was lost before generation');
   return Response.json({output:[{type:'message',content:[{text:'Sau đối soát, tổng doanh thu là 10 tỷ đồng. Mức này đáp ứng tiêu chí doanh thu của NQ43; còn phải xác nhận cư trú và các điều kiện áp dụng.'}]}]});
  };
  const res=await handleChat(new Request('https://test.local/api/chat?nocache=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question})}),
    {FPT_AI_KEY:'fixture',MUSE_API_KEY:'fixture',DECISION_MODE:'audit',VECTORIZE_ENABLED:'1',AI:{run:async()=>({data:[[.1,.2]]})},VECTORIZE:{query:async()=>({matches:[{id:'16.60',score:.99},{id:'16.44',score:.98}]})}},
    {waitUntil:p=>pending.push(p)},new Headers());
  const body=await res.json();await Promise.allSettled(pending.splice(0));
  assert(sourceReachedModel);assert(String(body.response).includes('đáp ứng tiêu chí doanh thu'));
  save('DOCUMENT_REQUIRED_DENSE','full_pipeline_source_preservation',question,'Named source reaches the real generation prompt with neutral policy labels and dense search',{response:body.response,sourceReachedModel},true,'all external providers mocked; real vector fusion and context construction');
 }
 {
  let generations=0;
  const question='Tôi chỉ đăng ký thuế trực tiếp, chưa có giấy hộ. Tôi muốn bổ sung thêm ngành.';
  const subjectSemantic={...semantic,taxpayer:'HOUSEHOLD_BUSINESS',topic:'TAX_REGISTRATION_CHANGE',subjectContext:'INDIVIDUAL_ACTIVITY',registrationStatus:'DIRECT_TAX_ONLY',answerPurpose:'PROCEDURE'};
  global.fetch=async(url,init)=>{
   const input=JSON.parse(init.body);
   if(String(url).includes('systemone')){
    const reply=native(input,'IN_SCOPE',subjectSemantic);
    if(input.questions.request_alignment&&generations===1)reply.answers.subject_applicability={type:'choice',choice:'CONTRADICTED',confidence:.99};
    return Response.json(reply);
   }
   assert.equal(String(url),'https://api.meta.ai/v1/responses');generations++;
   assert(input.instructions.includes('ref_id=16.154'));
   assert(!/ref_id=16\.(?:7|155)\]/.test(input.instructions),'Household-only source must not enter an unregistered-person prompt');
   return Response.json({output:[{type:'message',content:[{text:generations===1?'Cá nhân kinh doanh tức là hộ đã đăng ký, nên bạn chỉ được một hộ và không được thêm hoạt động.':'Bạn đã xác nhận chỉ đăng ký thuế trực tiếp. Việc bổ sung ngành cần xét thủ tục thuế và tính chất hoạt động mới; không tự coi bạn đã có hộ hoặc dùng giới hạn số hộ làm giới hạn số ngành.'}]}]});
  };
  const res=await handleChat(new Request('https://test.local/api/chat?nocache=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question})}),{FPT_AI_KEY:'fixture',MUSE_API_KEY:'fixture',DECISION_MODE:'audit'}, {waitUntil:p=>pending.push(p)},new Headers());
  const body=await res.json();await Promise.allSettled(pending.splice(0));assert.equal(generations,2);
  assert(String(body.response).includes('không tự coi bạn đã có hộ'));
  save('SUBJECT_SCOPE_REPAIR','subject_registration_boundary',question,'Wrong household substitution is repaired based on native semantic verdict',{generations,response:body.response},true,'real handleChat; all providers mocked');
 }
 const billing=[];
 for(const scenario of ['pass','unavailable','partial','uncertain']){
  let credits=5,deductions=0;const logged=[];
  const db={prepare(sql){const statement={bind(...values){return {...statement,first:async()=>sql.startsWith('UPDATE users SET credits = credits - 1')?(credits>0?{credits:--credits}:null):sql.includes('FROM users')?{id:'synthetic-user',phone:'0900000000',credits,role:'user'}:sql.startsWith('SELECT credits')?{credits}:sql.includes('COUNT(*)')?{n:0}:null,run:async()=>{if(sql.startsWith('UPDATE users SET credits = credits + 1')){credits++;}if(sql.startsWith('UPDATE users SET credits = credits - 1')){credits--;deductions++;}if(sql.startsWith('INSERT INTO chat_logs'))logged.push(values[4]);return {};}};},run:async()=>({})};return statement;}};
  global.fetch=async(url,init)=>{
   const input=JSON.parse(init.body);
   if(String(url).includes('systemone')){
    if(input.questions.facts&&scenario==='unavailable')return new Response('',{status:503});
    const reply=native(input,scenario==='uncertain'?'UNCERTAIN':'IN_SCOPE',semantic);
    if(input.questions.facts&&scenario==='partial')reply.answers.coverage={type:'choice',choice:'INCOMPLETE',confidence:.99};
    return Response.json(reply);
   }
   assert.equal(String(url),'https://api.meta.ai/v1/responses');
   if(input.instructions?.includes('CHỈ SỬA ĐOẠN'))return new Response('',{status:503});
   const requests=JSON.parse(input.instructions.match(/YÊU CẦU CẦN GIẢI QUYẾT: (\[[^\n]+\])/)?.[1]||'[]');
   const es=[...input.instructions.matchAll(/evidence_id=(E\d+)/g)].map(m=>m[1]);
   return Response.json({output:[{type:'message',content:[{text:`Bạn cần đối chiếu kỳ kê khai và hồ sơ của hoạt động kinh doanh. [[E:${es.join(',')};R:${requests.map(r=>r.id).join(',')}]]`}]}]});
  };
  const res=await handleChat(new Request('https://test.local/api/chat?nocache=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Năm 2026 cần đối chiếu hồ sơ khai thuế như thế nào?'})}),{DB:db,FPT_AI_KEY:'fixture',MUSE_API_KEY:'fixture',DECISION_MODE:'enforce'}, {waitUntil:p=>pending.push(p)},new Headers());
  const body=await res.json();await Promise.allSettled(pending.splice(0));
  const expected=scenario==='pass'?1:0;
  if(!baseline){assert.equal(5-credits,expected,scenario+' net credit debit');assert(logged.every(value=>value===expected),scenario+' credits_used log');}
  billing.push({scenario,deductions,logged,remainingCredits:body.remainingCredits,source:body.source});
 }
 const facts=load('worker/src/decision/factExtractor.ts').extractTaxFacts('Chi phí kinh doanh 200 triệu đồng năm 2026, chưa biết doanh thu.');
 if(!baseline){
  assert.equal(facts.revenue_vnd,undefined,'An expense-only input is not revenue');
  const extract=load('worker/src/decision/factExtractor.ts').extractTaxFacts;
  const range=extract('Năm 2026 doanh thu trên 3 tỷ, thu nhập tính thuế hợp lệ 400 triệu.');
  assert.equal(range.revenue_vnd,undefined,'An open range must not become 3 billion plus one dong');
  assert.equal(range.revenue_lower_bound_vnd,3000000000);
  assert.equal(extract('Năm 2026 doanh thu 3 tỷ + 1 đồng.').revenue_vnd,3000000001);
  const {understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
  const frame=understandClassifiedQuery('Hóa đơn và thuế đã nộp năm 2026',{years:[2026],today:'2026-10-20',periodSource:'current_message'},[],semantic);
  const validate=load('worker/src/decision/answerValidator.ts').validateAnswer;
  const original='Cần đối chiếu giao dịch đầu năm 2026 theo Luật Quản lý thuế 38/2019/QH14 và quy định hóa đơn điện tử.';
  assert.equal(validate(original,frame).repairedText,original,'Never change a law name by string replacement');
  const text='Cần đối chiếu khoản đã giữ và chứng từ trước khi kết luận.';
  const paid={...frame,facts:{...frame.facts,tax_paid_vnd:5000000,shipping_cod_vnd:20000000}};
  assert.equal(validate(text,paid,{status:'ANSWERED',pit_after_relief_vnd:1000000,total_tax_payable_vnd:1000000,effective_revenue_vnd:2000000000}).repairedText,text,'Never append an invented PIT offset or blanket COD exemption');
  assert(!fs.readFileSync(path.join(root,'worker/src/routeChat.ts'),'utf8').includes('guardTaxAnswer'),'Legacy canned rewrite must stay disconnected from production');
 }
 const report={mode:baseline?'before':'after',model_calls_live:0,legal_answers_independently_certified:false,results,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,billing,expense_only_revenue: facts.revenue_vnd??null};
 fs.mkdirSync('outputs/pipeline-audit-2026-10-20',{recursive:true});fs.writeFileSync(`outputs/pipeline-audit-2026-10-20/${report.mode}.json`,JSON.stringify(report,null,2));console.log(`AUDIT ${report.mode}: ${report.passed}/10 contract checks passed; ${report.failed} failed. Mock providers, zero live API calls.`);
}finally{global.fetch=originalFetch;global.caches=originalCaches;}})().catch(e=>{console.error(e);process.exitCode=1;});
