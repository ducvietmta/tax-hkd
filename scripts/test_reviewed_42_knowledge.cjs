// Knowledge-only audit regressions; no supplied answer is imported as legal evidence.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const load=require('./lib/load_local_ts.cjs')(),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(fs.readFileSync('rag_data/legal-card-review-2026-11-04.json','utf8'));
const reviews=manifest.cards.filter(r=>['16.239','16.240','16.241'].includes(r.ref_id));
const {CANONICAL_CHUNKS:cards}=load('worker/src/ragEngine.ts'),meta=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
const {trustedSource}=load('worker/src/recognition/trustedEvidence.ts'),{periodFits}=load('worker/src/kb/periodApplicability.ts');
assert.equal(reviews.length,3);assert.equal(cards.length,new Set(cards.map(c=>c.ref_id)).size);
for(const r of reviews){
 const c=cards.find(c=>c.ref_id===r.ref_id);assert(c&&trustedSource(c));assert.equal(c.tier,'VERIFIED_CONDITIONAL');
 assert.equal(hash(fs.readFileSync(r.source_file)),r.source_sha256);assert.equal(hash(fs.readFileSync(r.official_pdf)),r.official_pdf_sha256);
 r.quotes.forEach((q,i)=>{assert(fs.readFileSync(r.source_file,'utf8').includes(q));assert(c.text.includes(q));assert.equal(hash(q),r.quote_sha256[i]);});
 assert.equal(hash(c.text),meta[r.ref_id].source_link_review.content_sha256);assert.equal(c.retrieval_facets.required,false);
 const before=new Date(Date.parse(r.effective_from)-86400000).toISOString().slice(0,10);assert(!periodFits(meta[r.ref_id],{years:[Number(before.slice(0,4))],event_date:before}));
 assert(!c.text.includes('TAX-ADD-'),'Dataset identifiers never become legal content');
}
const {resolveAnswerScope}=load('shared/taxScope.ts'),{understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts');
const {buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts'),{retrieve,buildReviewContext}=load('worker/src/retriever.ts');
const probes=[
 ['Điều kiện miễn thuế thu nhập cá nhân trực tiếp sản xuất nông nghiệp, quyền thuê đất trực tiếp tham gia lao động và cư trú xã giáp ranh năm 2026','16.239','TAX_AMOUNT','pit'],
 ['Nông sản tự sản xuất chỉ qua sơ chế thông thường xay nghiền bảo quản lạnh, chưa chế biến sản phẩm khác và GTGT năm 2026','16.240','TAX_AMOUNT','vat'],
 ['Hộ ở địa bàn khó khăn miễn phí dịch vụ hóa đơn điện tử thời gian 12 tháng từ khi sử dụng, danh mục địa bàn ưu đãi đầu tư năm 2026','16.241','INVOICE_REGISTRATION','unspecified'],
];
const result=[];
for(const [q,ref,topic,taxFocus] of probes){
 const scope=resolveAnswerScope([],q,new Date('2026-11-04T12:00:00+07:00'));
 const frame=understandClassifiedQuery(q,scope,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],topic,taxFocus,subjectContext:'INDIVIDUAL_ACTIVITY',answerPurpose:'OTHER',policyFocus:'UNSPECIFIED'});
 const plan=buildRetrievalPlan(frame),hits=retrieve(q,8,scope,plan),ctx=buildReviewContext(hits.results,q,10000,20000,scope);
 assert(hits.results.some(r=>r.chunk.ref_id===ref),'Missing from search '+ref);assert(ctx.includedRefs.includes(ref),'Missing from actual context '+ref);assert(!ctx.missingRequiredRefs.length);
 result.push({ref,contextLength:ctx.text.length});
}
console.log(JSON.stringify({passed:true,newCards:3,sourceHashes:'PASS',effectiveDateBoundaries:'PASS',actualContext:result,networkCalls:0,limits:'Source/retrieval checks only; no claim that 42 AI answers are verified.'}));
