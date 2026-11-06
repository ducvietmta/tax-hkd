// Source/period/retrieval checks for signed ND398. No external model calls.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const load=require('./lib/load_local_ts.cjs')(),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const review=JSON.parse(fs.readFileSync('rag_data/legal-card-review-2026-11-04.json','utf8'));
review.cards=review.cards.filter(card=>card.doc_id==='ND-398-2026-ND-CP');
const {CANONICAL_CHUNKS:cards}=load('worker/src/ragEngine.ts'),meta=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
const {periodFits}=load('worker/src/kb/periodApplicability.ts'),{trustedSource}=load('worker/src/recognition/trustedEvidence.ts');
assert.equal(review.cards.length,6);assert.equal(new Set(cards.map(c=>c.ref_id)).size,cards.length);
for(const r of review.cards){
 const c=cards.find(c=>c.ref_id===r.ref_id),m=meta[r.ref_id];assert(c&&trustedSource(c));
 assert.equal(hash(fs.readFileSync(r.official_pdf)),r.official_pdf_sha256);assert.equal(hash(fs.readFileSync(r.source_file)),r.source_sha256);
 r.quotes.forEach((q,i)=>{assert(c.text.includes(q));assert(fs.readFileSync(r.source_file,'utf8').includes(q));assert.equal(hash(q),r.quote_sha256[i]);});
 assert.equal(m.content_sha256,hash(c.text));assert.equal(m.source_link_review.content_sha256,hash(c.text));
 for(const year of [2026,2027])assert(periodFits(m,{years:[year]}));
 for(const year of [2025,2028])assert(!periodFits(m,{years:[year]}));
 assert(!periodFits(m,{years:[2026],event_date:'2026-10-28'}));assert(periodFits(m,{years:[2026],event_date:'2026-10-29'}));
 assert.equal(m.source_links[0].doc_id,'ND-398-2026-ND-CP');assert.equal(c.retrieval_facets.required,false);
}
for(const r of review.source_updates){assert.equal(hash(cards.find(c=>c.ref_id===r.ref_id).text),r.after_sha256);}
assert(!cards.find(c=>c.ref_id==='16.39').text.includes('Thủ tục kê khai (PENDING)'));
assert(!periodFits(meta['16.78'],{years:[2026],event_date:'2026-10-28'}),'Updated procedure gate must respect decree effective date');
const {resolveAnswerScope}=load('shared/taxScope.ts'),{understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {buildRetrievalPlan,selectPolicyCandidates}=load('worker/src/decision/retrievalPlan.ts'),{retrieve,buildReviewContext}=load('worker/src/retriever.ts');
const probes=[
 ['Điều kiện giảm 30% thuế thu nhập cá nhân toàn bộ hoạt động kinh doanh không phân biệt phương pháp theo Nghị định 398 năm 2027','16.233','TAX_AMOUNT'],
 ['Cá nhân kinh doanh tự kê khai giảm thuế theo Mẫu số 01 Nghị định 398 nộp kèm hồ sơ quý hay 6 tháng năm 2026','16.234','TAX_AMOUNT'],
 ['Tổ chức khấu trừ khai thay nộp thay giảm thuế Mẫu số 02 theo Nghị định 398 tháng quý lần phát sinh năm 2026','16.235','PLATFORM_WITHHOLDING'],
 ['Tổng doanh thu thực tế vượt 10 tỷ Mẫu số 03 thu hồi số thuế đã giảm tiền chậm nộp đến hạn kỳ vượt ngưỡng NĐ398 năm 2026','16.236','REVENUE_THRESHOLD'],
 ['Đã kê khai nhưng chưa giảm thuế NĐ398 khai điều chỉnh bổ sung hoàn trả kiêm bù trừ thu ngân sách cuối năm 2026','16.237','REFUND'],
 ['Thanh tra kiểm tra kiểm toán làm tăng giảm số TNCN phải nộp điều chỉnh số được giảm theo NĐ398 năm 2026','16.238','TAXPAYER_RIGHTS'],
];
const results=[];
for(const [query,ref,topic] of probes){
 const scope=resolveAnswerScope([],query,new Date('2026-11-04T10:00:00+07:00'));
 const semantic={taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'RELIEF_REDUCTION',secondaryIntents:[],incomeTypes:['GOODS_SALES'],topic,subjectContext:'INDIVIDUAL_ACTIVITY',taxFocus:'pit',answerPurpose:'OTHER',revenueContext:'ACTUAL_YEAR',policyFocus:'PIT_RELIEF'};
 const frame=understandClassifiedQuery(query,scope,[],semantic),plan=buildRetrievalPlan(frame),hits=retrieve(query,8,scope,plan),context=buildReviewContext(hits.results,query,12000,18000,scope);
 assert(hits.results.some(r=>r.chunk.ref_id===ref),'Not retrieved: '+ref);
 assert(context.includedRefs.includes(ref),'Not in generation/review context: '+ref+' '+context.includedRefs.join(','));
 assert(!context.missingRequiredRefs.length,'Required source missing: '+ref);
 assert(!selectPolicyCandidates({...frame,semantic:{...frame.semantic,taxFocus:'vat'}}).some(r=>review.cards.some(c=>c.ref_id===r.ref_id)));
 results.push({ref,year:scope.years,contextLength:context.text.length});
}
// Replay the semantic shape observed on production: a procedural request inside
// a broad tax-amount topic must retain its procedure gate in the actual context.
const combined='Theo Nghị định 398, tự kê khai giảm 30% TNCN kỳ 2026–2027 dùng mẫu nào và nộp kèm hồ sơ nào, phân biệt với tổ chức khấu trừ khai thay nộp thay?';
const combinedScope=resolveAnswerScope([],combined,new Date('2026-11-04T10:00:00+07:00'));
const combinedFrame=understandClassifiedQuery(combined,combinedScope,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'RELIEF_REDUCTION',secondaryIntents:['LEGAL_TEXT_LOOKUP','PROCEDURE_HOWTO','DECLARATION_FILING'],incomeTypes:['UNKNOWN'],topic:'TAX_AMOUNT',taxFocus:'pit',subjectContext:'INDIVIDUAL_ACTIVITY',answerPurpose:'OTHER',policyFocus:'PIT_RELIEF'});
const combinedPlan=buildRetrievalPlan(combinedFrame),combinedHits=retrieve(combined,8,combinedScope,combinedPlan),combinedContext=buildReviewContext(combinedHits.results,combined,7000,16000,combinedScope);
assert(combinedPlan.must_include_refs.includes('16.78'));
assert(combinedContext.includedRefs.includes('16.78'),'Procedure source must reach generation even when optional form cards are crowded out');
assert(combinedContext.text.includes('Mẫu số 01')&&combinedContext.text.includes('Mẫu số 02'));
assert(!combinedContext.missingRequiredRefs.length);
console.log(JSON.stringify({passed:true,cards:6,periodBoundaries:'PASS',sourceHashes:'PASS',provenance:'PASS',retrievalAndContext:results,networkCalls:0}));
