/* Offline source coverage, not a model accuracy score. No network permitted. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const cache=new Map();function load(file){file=path.resolve(file);if(!fs.existsSync(file))file+='.ts';if(cache.has(file))return cache.get(file);if(file.endsWith('.json')){const v=JSON.parse(fs.readFileSync(file,'utf8'));return {default:v,...v};}const m={exports:{}};cache.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>load(path.resolve(path.dirname(file),id)),m,m.exports);cache.set(file,m.exports);return m.exports;}
global.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};
const {resolveAnswerScope}=load('shared/taxScope.ts'),{understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {selectPolicyEvidence,buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts');
const {retrieve,buildContext}=load('worker/src/retriever.ts'),{mergeVectorHits}=load('worker/src/vectorRetriever.ts');
const {filterAndGateEvidence}=load('worker/src/decision/evidenceGate.ts');
const {CANONICAL_CHUNKS}=load('worker/src/ragEngine.ts');
let checks=0;const check=(ok,msg)=>{assert(ok,msg);checks++;};
function context(message,labels){
 const scope=resolveAnswerScope([],message,new Date('2026-10-22T06:00:00Z'));
 const f=understandClassifiedQuery(message,scope,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['GOODS_SALES'],topic:'OTHER',answerPurpose:'OTHER',taxFocus:'unspecified',revenueContext:'ACTUAL_YEAR',calculationShape:'SINGLE',...labels});
 const plan=buildRetrievalPlan(f),initial=retrieve(message,4,scope,plan);
 const gate=filterAndGateEvidence(initial.results.map(r=>r.chunk),f);
 const results=mergeVectorHits(initial.results.filter(r=>gate.passedChunks.includes(r.chunk)),[{refId:'16.66',score:.99},{refId:'16.60',score:.98}],4,{query:message,years:scope.years,pinnedRefs:plan.must_include_refs,allowedRefs:plan.allowed_refs});
 return buildContext(results,message,12000,scope);
}
const pit=['không quá 10 tỷ','30%','1 tỷ','17%','không đăng ký thuế cho hoạt động kinh doanh','PIT 5%','trạng thái thực nộp','Không tự trừ GTGT vào PIT'];
for(const income of ['AFFILIATE_COMMISSION','CONTENT_ADS'])for(const topic of ['OTHER','TAX_AMOUNT'])for(const focus of ['pit','unspecified']){
 const c=context('Năm 2026, khoản thù lao qua nền tảng là 1,37 tỷ, đã giữ 123 triệu: tính nghĩa vụ rồi đối chiếu số nộp thay thế nào?',{incomeTypes:[income],topic,taxFocus:focus,primaryIntent:'PLATFORM_WITHHOLDING'});
 for(const text of pit)check(c.text.includes(text),'Required substantive premise in hybrid context: '+text);
 check(!c.missingRequiredRefs.length,'No required evidence lost to top K, dense noise or budget');
}
for(const phrase of ['Doanh thu năm 2026 gồm hàng đã trả lại theo hồ sơ hợp lệ, cơ sở GTGT còn bao nhiêu?','Năm 2026 tôi giảm giá thương mại có hóa đơn cho khách mua đủ số lượng. Tính doanh thu chịu GTGT thế nào?']){
 const c=context(phrase,{topic:'REVENUE_COMPOSITION',taxFocus:'vat'});
 for(const text of ['Khoản2 Điều14','không tự lấy Điều5 NĐ68','phân phối hàng hóa gốc1%','khoản6(d)','không hồi tố TT91'])check(c.text.includes(text),'Separate VAT base and scoped invoice procedure: '+text);
 check(c.includedRefs.includes('16.156')&&!c.missingRequiredRefs.length,'VAT evidence survives fusion');
}
const cost=context('Năm 2026 doanh thu kinh doanh 4,17 tỷ, xác định chi phí được trừ và phương pháp ra sao?',{topic:'BUSINESS_EXPENSES',taxFocus:'pit'});
check(cost.text.includes('thu nhập ×17%')&&cost.text.includes('không hồi tố 17%'),'Expense evidence retains method and transition');
const relief=context('Năm 2026 cá nhân cư trú xét điều kiện giảm TNCN và có được lấy môn bài đối trừ không?',{topic:'REVENUE_OWNERSHIP',policyFocus:'PIT_RELIEF',taxFocus:'pit',primaryIntent:'RELIEF_REDUCTION'});
check(relief.text.includes('chấm dứt thu/nộp lệ phí môn bài')&&relief.text.includes('không xóa nợ cũ'),'Discontinued levy has its own primary source');
const old=context('Bán hàng năm 2025 có doanh thu 287 triệu; hỏi nghĩa vụ năm đó.',{topic:'TAX_AMOUNT',taxFocus:'pit'});
check(!old.includedRefs.some(r=>['16.39','16.40','16.56','16.77','16.95','16.156'].includes(r)),'Current rules never replace historical sources');
const goods=context('Năm 2026 bán hàng hóa, xác định nghĩa vụ đã nộp thay.',{primaryIntent:'PLATFORM_WITHHOLDING'});
check(!goods.includedRefs.includes('16.95'),'Affiliate-specific source requires the appropriate income label');
const base={tax_period:{years:[2031]},income_type:[{value:'opaque-income'}],tax_intent:{primary:{value:'opaque-intent'},secondary:[]},semantic:{topic:'OTHER',taxFocus:'opaque-focus'}};
const catalog=[{ref_id:'opaque-source',applies_from_year:2030,applies_to_year:2032,intents:['opaque-intent'],income_types:['opaque-income'],tax_focuses:['opaque-focus']}];
check(selectPolicyEvidence(base,catalog).includes('opaque-source'),'Generic intent activation, no legal IDs/phrases');
for(const f of [{...base,income_type:[{value:'another-income'}]},{...base,semantic:{...base.semantic,taxFocus:'other'}},{...base,tax_period:{years:[2029]}}])check(!selectPolicyEvidence(f,catalog).length,'Metadata constraints are conjunctive');
check(selectPolicyEvidence({...base,tax_intent:{primary:{value:'other'},secondary:['opaque-intent']}},catalog).length===1,'Secondary intent dependencies also work');
const scope=resolveAnswerScope([],'Năm 2026'),hit=(chunk,required='RETRIEVAL_PLAN')=>({chunk,score:1,viaRoute:false,required});
const c={id:'literal-test',ref_id:'literal-test',file:'test',section:'test',tier:'VERIFIED',text:'Original provision. Reviewed conditions with exception.',context_passage:'Reviewed conditions with exception.'};
check(buildContext([hit(c)],'',9000,scope).passages[0].text===c.context_passage,'Literal reviewed excerpt');
check(buildContext([hit({...c,context_passage:'Invented rule.'})],'',9000,scope).passages[0].text===c.text,'Invalid excerpt cannot inject law');
for(const years of [[2025],[2025,2026],[]]){
 const out=buildContext([hit({...c,context_passage_period:{applies_from_year:2026}})],'',9000,{...scope,years});
 check(out.passages[0].text===c.text,'Excerpt cannot erase an uncovered/unknown period');
}
const exhausted=buildContext([hit({...c,text:'An indivisible legal exception. '.repeat(300),context_passage:undefined,evidence_mode:'COMPLETE_RULE'})],'',20,scope);
check(exhausted.missingRequiredRefs.includes(c.ref_id),'Required omissions are observable, including non-document requirements');
for(const chunk of CANONICAL_CHUNKS.filter(c=>c.context_passage))check(chunk.text.includes(chunk.context_passage),'Every deployed excerpt belongs to canonical source');
const dir='outputs/rag-source-coverage-2026-10-22';fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(dir+'/source-coverage-tests.json',JSON.stringify({checks,apiCalls:0,scope:'Actual retrieval, evidence gate, hybrid fusion, literal excerpts, period checks and context budget; not production AI answer grading'},null,2));
console.log(`PASS ${checks} offline source coverage checks, zero external calls.`);
