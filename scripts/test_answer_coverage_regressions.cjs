const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const load=require('./lib/load_local_ts.cjs')();
const {resolveAnswerScope}=load('shared/taxScope.ts'),{understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts'),{retrieve,buildReviewContext}=load('worker/src/retriever.ts');
const {filterAndGateEvidence}=load('worker/src/decision/evidenceGate.ts');
const {calculationCoverageIssues,calculationInstructions}=load('worker/src/decision/calculationContract.ts');
const {multiActivityLedger}=load('worker/src/decision/methodComparison.ts');
const base={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],topic:'SYSTEM_REGISTRATION',answerPurpose:'PROCEDURE',revenueContext:'ACTUAL_YEAR',taxFocus:'unspecified',calculationShape:'SINGLE'};
for(const [question,income,expected]of [
 ['Cá nhân cho thuê nhà muốn đăng ký mã số thuế để tự kê khai trực tiếp trên cổng thuế điện tử thì làm sao?',['PROPERTY_RENTAL'],['Điều 21','nhiều bất động sản','lựa chọn một cơ quan']],
 ['Tôi có nhà cho thuê ở hai tỉnh, đăng ký thuế trực tuyến tại đâu?',['PROPERTY_RENTAL'],['Điều 21','nhiều bất động sản','lựa chọn một cơ quan']],
 ['Hướng dẫn chi tiết từng bước bấm nút đăng ký tài khoản giao dịch thuế điện tử lần đầu trên trang thuedientu.gdt.gov.vn?',['UNKNOWN'],['Điều 8','Điều 13','không bắt buộc','01/ĐK-TĐT']],
 ['Cá nhân ngoài diện được cấp định danh điện tử mở tài khoản thuế bằng cách nào?',['UNKNOWN'],['không bắt buộc','01/ĐK-TĐT']],
]){
 const scope=resolveAnswerScope([],question,new Date('2026-11-09T05:00:00Z'));
 const frame=understandClassifiedQuery(question,scope,[],{...base,incomeTypes:income});
 const result=retrieve(question,8,scope,buildRetrievalPlan(frame));
 const gate=filterAndGateEvidence(result.results.map(r=>r.chunk),frame);
 const context=buildReviewContext(result.results.filter(r=>gate.passedChunks.includes(r.chunk)),question,12000,scope);
 for(const phrase of expected)assert(context.text.includes(phrase),`Missing source rule: ${phrase}`);
 assert(!context.passages.some(p=>p.ref_id==='16.24'),'Quarantine must remain active');
}
const q='Cá nhân cư trú năm 2026 bán tạp hóa 800 triệu và vận tải 500 triệu, tính thuế TNCN theo doanh thu và giảm NQ43.';
const scope=resolveAnswerScope([],q,new Date('2026-11-09T05:00:00Z'));
const frame=understandClassifiedQuery(q,scope,[],{...base,topic:'TAX_AMOUNT',answerPurpose:'CALCULATION',primaryIntent:'TAX_CALCULATION',incomeTypes:['GOODS_SALES','SERVICE'],taxFocus:'pit',calculationShape:'MULTI_ACTIVITY'});
frame.residency.value='RESIDENT';frame.facts.revenue_basis='ANNUAL';
for(const [goods,transport]of [[800e6,500e6],[900e6,450e6],[750e6,600e6]]){
 frame.facts.revenue_vnd=goods+transport;
 frame.facts.multi_activities=[{id:'g',kind:'goods',revenueVnd:goods},{id:'t',kind:'production_transport',revenueVnd:transport}];
 const ledger=multiActivityLedger(frame);assert(ledger);
 const before=Math.round((goods+transport-1e9)*.005),after=Math.round(before*.7);
 assert.equal(ledger.pit_before_relief_vnd,before);assert.equal(ledger.pit_after_relief_vnd,after);
 assert.deepEqual(calculationCoverageIssues('Ưu tiên trừ vào vận tải trước, phần còn lại trừ vào hàng hóa.',frame),['CALCULATION_TOTALS_MISSING']);
 assert.deepEqual(calculationCoverageIssues(`Thuế trước giảm ${before.toLocaleString('vi-VN')} đồng.`,frame),['CALCULATION_TOTALS_MISSING']);
 assert.deepEqual(calculationCoverageIssues(`Trước giảm ${before/1e6} triệu; sau giảm ${(after/1e6).toString().replace('.',',')} triệu đồng.`,frame),[]);
 assert(calculationInstructions(frame,null).includes('pit_before_relief_vnd'));
}
const review=JSON.parse(fs.readFileSync('rag_data/legal-card-review-2026-11-09.json','utf8')).cards[0];
const raw=fs.readFileSync(review.source_file);assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),review.source_sha256);
review.quotes.forEach((q,i)=>{assert(raw.toString('utf8').includes(q));assert.equal(crypto.createHash('sha256').update(q).digest('hex'),review.quote_sha256[i]);});
console.log('PASS: procedural source coverage, quarantine, generated ledger totals across varying inputs, source hashes. Offline only; live AI answers not measured.');
