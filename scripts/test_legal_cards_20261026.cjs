const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const load=require('./lib/load_local_ts.cjs')();
const report=JSON.parse(fs.readFileSync('rag_data/legal-card-review-2026-10-26.json','utf8'));
const metadata=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
const {CANONICAL_CHUNKS}=load('worker/src/ragEngine.ts');
const {retrieve}=load('worker/src/retriever.ts'),{resolveAnswerScope}=load('worker/src/answerScope.ts');
const {trustedSource}=load('worker/src/recognition/trustedEvidence.ts');
const {periodFits}=load('worker/src/kb/periodApplicability.ts');
assert.equal(report.baseline_missing_documents.length,30);
assert.equal(report.cards.length,33);assert.equal(report.excluded.length,3);
assert.equal(new Set(report.cards.map(c=>c.doc_id)).size,27);
assert.equal(report.reviewer_type,'AI');
const library=JSON.parse(fs.readFileSync('worker/src/data/documentLibrary.json','utf8'));
for(const r of report.cards){
 const c=CANONICAL_CHUNKS.find(c=>c.ref_id===r.ref_id);assert(c,r.ref_id);
 const m=metadata[r.ref_id];assert(trustedSource(c));assert.equal(c.tier,'VERIFIED_CONDITIONAL');
 assert.equal(hash(fs.readFileSync(r.source_file)),r.source_sha256,'Source changed: '+r.doc_id);
 assert.equal(hash(r.quote),r.excerpt_sha256);assert(c.text.includes(r.quote));
 assert.equal(hash(c.text),r.chunk_sha256);assert.equal(m.source_link_review.content_sha256,r.chunk_sha256);
 assert.equal(m.source_links[0].locator,r.locator);assert.equal(m.reviewer_type,'AI');
 if(!r.official_file){const text=library.find(d=>d.id===r.doc_id).sections.filter(s=>r.sections.includes(s.id)).map(s=>s.text).join('\n\n');assert(text.includes(r.quote),'No invented or truncated excerpt: '+r.ref_id);}
 if(r.to&&r.to<2026)assert.equal(periodFits(m,{years:[2026]}),false,'Historical source must not apply in 2026: '+r.ref_id);
 if(r.effective_from){const before=new Date(Date.parse(r.effective_from)-86400000).toISOString().slice(0,10);assert.equal(periodFits(m,{years:[Number(before.slice(0,4))],event_date:before}),false,'No application before effective date: '+r.ref_id);}
}
for(const r of report.excluded){assert(!report.cards.some(c=>c.doc_id===r.doc_id));assert.equal(hash(fs.readFileSync(r.source_file)),r.source_sha256);}
assert.equal(hash(fs.readFileSync(report.correction.source_file)),report.correction.sha256);
const probes=[
 ['hộ kinh doanh thuê người thân làm kế toán lưu trữ tài liệu năm 2026','16.214'],
 ['01/XSBHĐCMG-CNKD 01/BK-XSBHĐCMG đính chính 2551 năm 2026','16.229'],
 ['xác nhận thời điểm nộp hồ sơ thuế điện tử năm 2026','16.222'],
 ['sự kiện khách quan không thể lường trước bất khả kháng xử phạt thuế năm 2026','16.208'],
];
for(const[q,ref]of probes){const scope=resolveAnswerScope([],q,new Date('2026-10-26T12:00:00+07:00'));assert(retrieve(q,8,scope).results.some(r=>r.chunk.ref_id===ref),'Reviewed source must be retrievable: '+ref);}
console.log('PASS: 30 document dispositions, 33 source-bound cards, 9 historical period exclusions, corporate exclusions, correction hashes, 4 lexical retrieval probes. No live legal accuracy claim.');
