/* Local fault injection. No external classifier, generation or reviewer calls. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();cache.set(path.resolve('worker/src/firebaseAuth.ts'),{verifiedFirebasePhone:async()=> '0900000000'});
function load(file){file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);cache.set(file,m.exports);return m.exports;}
const {exactArithmetic,resolveCalculations}=load('worker/src/decision/arithmetic.ts');
let checks=0;const check=(x,msg)=>{assert(x,msg);checks++;};
for(let i=1;i<=60;i++){const a=7919*i+1,b=123*i,r=exactArithmetic(`(${a}-${b})*17/100`);check(r.n*100n===BigInt(a-b)*17n*r.d,'Exact rational arithmetic, arbitrary amounts');}
for(const [expr,n,d]of [['1000000001',1000000001n,1n],['0.1+0.2',3n,10n],['-(10+2)*5%',-3n,5n],['1/3',1n,3n],['123456789*70%',864197523n,10n]]){const r=exactArithmetic(expr);check(r.n===n&&r.d===d,expr);}
for(const expr of ['1/0','1e8','Math.max(1,2)','process.exit()','1;2','1..2','1 2','2**4','()','('.repeat(26)+'1'+')'.repeat(26),'9'.repeat(601),'9007199254740992']){assert.throws(()=>exactArithmetic(expr));checks++;}
const marker=(expression,ids=['E1'])=>'[[CALC:'+JSON.stringify({expression,unit:'VND',evidence_ids:ids})+']]';
check(resolveCalculations(marker('10/4'),['E1']).text==='2,5 đồng');
check(resolveCalculations(marker('1/3'),['E1']).text==='0,33333333… đồng','Repeating fractions are explicitly approximate');
for(const text of [marker('2*3',['FAKE']),marker('1/0'),'[[CALC:broken]]',Array.from({length:49},()=>marker('1')).join(' ')])check(resolveCalculations(text,['E1']).issues.length>0);
const {extractAllAmounts}=load('worker/src/decision/factExtractor.ts');
for(const [q,expected]of [['hơn 100 triệu đúng 1 đồng',100000001],['27 triệu lẻ 3 đồng',27000003],['hơn một tỷ chỉ có 1 đồng',1000000001],['7,2 tỷ cộng 9 đồng',7200000009],['27 triệu thiếu 11 đồng',26999989]])check(extractAllAmounts(q)[0]?.vnd===expected,q);
const {resolveAnswerScope}=load('shared/taxScope.ts'),{understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts'),{retrieve,buildContext}=load('worker/src/retriever.ts'),{filterAndGateEvidence}=load('worker/src/decision/evidenceGate.ts');
const {selectPolicyEvidence}=load('worker/src/decision/retrievalPlan.ts');
const opaqueCatalog=[{ref_id:'old',topics:['REVENUE_TIMING'],applies_from_year:2008,applies_to_year:2009},{ref_id:'new',topics:['REVENUE_TIMING'],applies_from_year:2010,applies_to_year:null}];
check(JSON.stringify(selectPolicyEvidence({tax_period:{years:[2009,2010]},semantic:{topic:'REVENUE_TIMING'}},opaqueCatalog))===JSON.stringify(['old','new']),'Period overlap is generic; keep both sides, no tax IDs or years in runtime');
check(JSON.stringify(selectPolicyEvidence({tax_period:{years:[2011]},semantic:{topic:'REVENUE_TIMING'}},opaqueCatalog))===JSON.stringify(['new']),'An irrelevant old source remains excluded');
for(const [message,topic,income,required]of [
 ['Hóa đơn lập đầu năm, nay tháng 10/2026 mới phát hiện sai giá, sửa thế nào?','INVOICE_CORRECTION',['GOODS_SALES'],['CHUYỂN TIẾP KHI XỬ LÝ','Điều 24']],
 ['Tháng 10/2026 người mua trả lại hàng đã giao, ai xuất hóa đơn?','INVOICE_CORRECTION',['GOODS_SALES'],['TRẢ HÀNG KHÁC LỖI GỐC','người mua lập']],
 ['Tôi sửa máy và bán hàng, tính GTGT năm 2026 thế nào?','TAX_AMOUNT',['SERVICE','GOODS_SALES'],['PHÂN NHÓM GTGT CHI TIẾT','máy vi tính','phương tiện vận tải','cao nhất']],
 ['Tiền khách bồi thường vi phạm hợp đồng có tính doanh thu TNCN năm 2026 không?','REVENUE_COMPOSITION',['GOODS_SALES'],['BỒI THƯỜNG LIÊN QUAN KINH DOANH']],
 ['Dự kiến kinh doanh năm 2027, ngưỡng miễn theo luật hiện hành ra sao?','REVENUE_THRESHOLD',['GOODS_SALES'],['HIỆU LỰC KHÔNG ĐỒNG NGHĨA HẾT NĂM']],
 ['Đơn bán hàng phát sinh năm 2025, năm 2026 mới thu tiền, thuộc kỳ nào?','REVENUE_TIMING',['GOODS_SALES'],['THỜI ĐIỂM DOANH THU LỊCH SỬ']],
 ['Hai cửa hàng năm 2026 dùng hóa đơn ghi mã nào?','INVOICE_REGISTRATION',['GOODS_SALES'],['NHIỀU ĐỊA ĐIỂM TRÊN HÓA ĐƠN']],
 ['Affiliate không ký hợp đồng lao động, chưa đăng ký gì, tiền nhận thuộc loại nào?','PLATFORM_WITHHOLDING',['AFFILIATE_COMMISSION'],['không đăng ký thuế cho hoạt động kinh doanh','Không có HĐLĐ chưa đủ chốt kinh doanh','Điều 8']],
]){
 const scope=resolveAnswerScope([],message,new Date('2026-10-22T05:00:00Z'));
 const f=understandClassifiedQuery(message,scope,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:income,topic,answerPurpose:'OTHER',revenueContext:'ACTUAL_YEAR',taxFocus:'unspecified',calculationShape:'SINGLE'});
 const found=retrieve(message,6,scope,buildRetrievalPlan(f)),gate=filterAndGateEvidence(found.results.map(h=>h.chunk),f);
 const context=buildContext(found.results.filter(h=>gate.passedChunks.includes(h.chunk)),message,9000,scope);
 for(const s of required)check(context.text.includes(s),`Canonical evidence must survive retrieval/gating/context: ${s}`);
}
const native=require('./fixtures/jev_native.cjs'),{handleChat}=load('worker/src/routeChat.ts');
const savedFetch=global.fetch,savedCaches=global.caches,savedLog=console.log,events=[],rows=[];
console.log=(...a)=>events.push(a.join(' '));console.warn=console.log;console.error=console.log;
global.caches={default:{match:async()=>undefined,put:async()=>{}}};
const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'TAX_CALCULATION',secondaryIntents:[],incomeTypes:['SERVICE'],topic:'TAX_AMOUNT',answerPurpose:'CALCULATION',revenueContext:'ACTUAL_YEAR',taxFocus:'pit',calculationShape:'SINGLE',methodContext:'UNSPECIFIED'};
(async()=>{try{
for(const scenario of ['valid','invalid_then_valid','always_invalid','wrong_premise']){
 let generation=0,assessments=0,reviewSawRendered=false;const pending=[];
 global.fetch=async(url,init)=>{const body=JSON.parse(init.body);
  if(String(url).includes('systemone')){if(body.questions.request_alignment){assessments++;reviewSawRendered=JSON.stringify(body).includes('7.140.000 đồng');const reply=native(body,'IN_SCOPE',semantic);if(scenario==='wrong_premise')reply.answers.fact_roles={type:'choice',choice:'CONTRADICTED',confidence:.99};return Response.json(reply);}return Response.json(native(body,'IN_SCOPE',semantic));}
  assert.equal(String(url),'https://api.meta.ai/v1/responses','No real network allowed');generation++;
  const ids=[...body.instructions.matchAll(/evidence_id=(E\d+)/g)].map(m=>m[1]);check(ids.length>0,'Real evidence passage IDs');
  const requests=JSON.parse(body.instructions.match(/YÊU CẦU CẦN GIẢI QUYẾT: (\[[^\n]+\])/)?.[1]||'[]');
  const invalid=scenario==='always_invalid'||scenario==='invalid_then_valid'&&generation===1;
  const draft='Số thuế của nhánh giả định từ thu nhập hợp lệ, trước khi xét điều kiện giảm: '+marker('42000000*17/100',invalid?['FAKE']:[ids[0]])+` [[E:${ids[0]};R:${requests.map(r=>r.id).join(',')}]]`;
  check(body.instructions.includes('[[CALC:'),'Generic arithmetic tool reaches generation, without an engine ledger');
  return Response.json({output:[{type:'message',content:[{text:draft}]}]});
 };
 const res=await handleChat(new Request('https://test.local/api/chat?nocache=1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Tính một nhánh giả định theo thu nhập hợp lệ 42 triệu, tỷ lệ 17%; doanh thu thực tế năm 2026 là 3,8 tỷ, chưa xác định phương pháp đang áp dụng.'})}),{FPT_AI_KEY:'offline',MUSE_API_KEY:'offline',DECISION_MODE:'audit'},{waitUntil:p=>pending.push(p)},new Headers());
 const b=await res.json();await Promise.allSettled(pending);check(!String(b.response).includes('[[CALC:'),'Internal calculation markers never leak');
 if(scenario==='valid'||scenario==='invalid_then_valid'){check(b.response.includes('7.140.000 đồng'));check(reviewSawRendered,'Semantic assessor sees computed text');check(generation===(scenario==='valid'?1:2));}
 else{check(generation===2,'At most two generation attempts');check(!b.response.includes('7.140.000 đồng'),'Correct arithmetic cannot bypass rejected legal/factual premises');}
 rows.push({scenario,generation,assessments,response:b.response,source:b.source});
}
const report={checks,apiCalls:0,scope:'Arithmetic/parser/security + real handleChat with mocked generation and semantic verdicts; not a live legal accuracy benchmark',rows};
fs.mkdirSync('outputs/grounded-recovery-2026-10-22',{recursive:true});fs.writeFileSync('outputs/grounded-recovery-2026-10-22/arithmetic-tests.json',JSON.stringify(report,null,2));savedLog(`PASS ${checks} checks and ${rows.length} full pipeline fault scenarios, zero external API calls.`);
}finally{global.fetch=savedFetch;global.caches=savedCaches;console.log=savedLog;}})().catch(e=>{savedLog(e.stack);process.exitCode=1;});
