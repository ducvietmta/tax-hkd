const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const load=require('./lib/load_local_ts.cjs')(),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const review=JSON.parse(fs.readFileSync('rag_data/legal-card-review-2026-11-02.json','utf8')),meta=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
const cards=load('worker/src/ragEngine.ts').CANONICAL_CHUNKS,{trustedSource}=load('worker/src/recognition/trustedEvidence.ts'),{periodFits}=load('worker/src/kb/periodApplicability.ts');
for(const r of review.cards){
 const card=cards.find(c=>c.ref_id===r.ref_id),m=meta[r.ref_id];assert(card&&trustedSource(card));assert.equal(card.tier,'VERIFIED_CONDITIONAL');
 assert.equal(sha(fs.readFileSync(r.source_file)),r.source_sha256);assert.equal(sha(fs.readFileSync(r.official_pdf)),r.official_pdf_sha256);
 r.quotes.forEach((q,i)=>{assert(fs.readFileSync(r.source_file,'utf8').includes(q));assert(card.text.includes(q));assert.equal(sha(q),r.quote_sha256[i]);});
 assert.equal(sha(card.text),m.content_sha256);assert.equal(m.source_links[0].locator,r.locator);assert.equal(card.retrieval_facets.required,false);
 const before=new Date(Date.parse(r.effective_from)-86400000).toISOString().slice(0,10);assert(!periodFits(m,{years:[Number(before.slice(0,4))],event_date:before}));
}
const {resolveAnswerScope}=load('shared/taxScope.ts'),{understandClassifiedQuery}=load('worker/src/decision/understandQuery.ts'),{buildRetrievalPlan}=load('worker/src/decision/retrievalPlan.ts'),{retrieve,buildReviewContext}=load('worker/src/retriever.ts');
const probes=[
 ['Hộ đã có giấy chứng nhận thay đổi ngành nghề kinh doanh, nộp giấy đề nghị ở đâu, thời hạn đăng ký thay đổi bao lâu?','16.230',{topic:'BUSINESS_REGISTRATION',primaryIntent:'REGISTRATION'}],
 ['NĐ253 phân biệt tiền thù lao cung cấp dịch vụ của cá nhân không đăng ký kinh doanh không đăng ký thuế với thu nhập kinh doanh, Điều 8 và hiệu lực Điều 69','16.231',{topic:'TAX_AMOUNT',primaryIntent:'OTHER_TAX',incomeTypes:['FREELANCE_SERVICE']}],
 ['Máy tính tiền cuối ngày gửi dữ liệu cho cơ quan thuế, nhận mã rồi gửi hóa đơn cho người mua theo Điều 15','16.232',{topic:'TAX_SOFTWARE_SYSTEM',primaryIntent:'TAX_SOFTWARE_SYSTEM',secondaryIntents:['E_INVOICE']}],
];
for(const[q,ref,labels]of probes){
 const s=resolveAnswerScope([],q,new Date('2026-11-02T12:00:00+07:00'));const f=understandClassifiedQuery(q,s,[],{taxpayer:'INDIVIDUAL_BUSINESS',primaryIntent:'OTHER_TAX',secondaryIntents:[],incomeTypes:['UNKNOWN'],subjectContext:'INDIVIDUAL_ACTIVITY',taxFocus:'unspecified',answerPurpose:'OTHER',revenueContext:'UNSPECIFIED',...labels});
 const plan=buildRetrievalPlan(f),hits=retrieve(q,8,s,plan),context=buildReviewContext(hits.results,q,12000,18000,s);assert(context.includedRefs.includes(ref),ref+' missing from actual context');assert(!context.missingRequiredRefs.length);
}
console.log('PASS three source-bound legal cards, exact quotes/PDF hashes, conditional provenance, pre-effective exclusion and actual scoped retrieval. No live legal-answer accuracy claim.');
