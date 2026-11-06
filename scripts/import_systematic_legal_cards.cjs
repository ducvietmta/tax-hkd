// Import reviewed source excerpts, never generated answers or test cases.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const manifest=read(process.argv[2]||'rag_data/legal-card-review-2026-11-02.json');
assert.equal(manifest.reviewer_type,'AI');
const chunks=read('rag_data/semantic-topic-supplements.json'),meta=read('worker/src/kb/chunkMeta.json'),library=read('worker/src/data/documentLibrary.json');
for(const r of manifest.cards){
 const source=fs.readFileSync(r.source_file,'utf8');assert.equal(sha(fs.readFileSync(r.source_file)),r.source_sha256);assert.equal(sha(fs.readFileSync(r.official_pdf)),r.official_pdf_sha256);
 assert.equal(r.quotes.length,r.quote_sha256.length);r.quotes.forEach((quote,i)=>{assert(source.includes(quote),'Excerpt not in source');assert.equal(sha(quote),r.quote_sha256[i]);});
 const batch=manifest.reviewed_on,sourcePath='KB/legal-cards-'+batch;
 const id=sourcePath+'#'+r.ref_id,limits='Chỉ phạm vi HKD/CNKD và phân định liên quan. '+r.limits+' Kiểm duyệt AI theo đoạn nguồn, đã đối chiếu ảnh trang PDF chính thức; không chứng nhận toàn văn hoặc kiểm duyệt con người.';
 const text=r.summary+'\n[GIỚI HẠN] '+limits+'\n[THỜI KỲ] '+r.effective_from+'; đọc đúng quy tắc áp dụng cả kỳ nếu nguồn có quy định riêng.\n[NGUỒN] '+r.code+'; '+r.locator+'\n[TRÍCH NGUYÊN VĂN THEO TỪNG ĐOẠN]\n'+r.quotes.join('\n\n')+'\nNguồn chính thức: '+r.official_url+(r.crosscheck_url?'\nĐối chiếu thêm: '+r.crosscheck_url:'');
 const chunk={id,ref_id:r.ref_id,file:sourcePath,section:r.ref_id+'. '+r.title,tier:'VERIFIED_CONDITIONAL',evidence_mode:'COMPLETE_RULE',subject_scope:['INDIVIDUAL_ACTIVITY','HOUSEHOLD_FORM','COMPARISON'],retrieval_facets:r.facets,text};
 const prev=chunks.findIndex(c=>c.ref_id===r.ref_id);if(prev>=0){assert.equal(chunks[prev].id,id,'Ref collision');chunks[prev]=chunk;}else chunks.push(chunk);
 const doc=library.find(d=>d.id===r.doc_id);assert(doc);
 const articles=[...r.locator.matchAll(/Điều\s*(\d+)/gu)].map(m=>m[1]);const sections=doc.sections.filter(s=>articles.some(a=>new RegExp('^Điều\\s+'+a+'(?:\\.|\\s|$)','u').test(s.title))).map(s=>s.id);
 meta[r.ref_id]={id,ref_id:r.ref_id,section:chunk.section,tier:chunk.tier,legal_status:chunk.tier,applies_from_year:r.from,applies_to_year:r.to??null,effective_from:r.effective_from,content_reviewed_at:manifest.reviewed_on,content_sha256:sha(text),source_document_sha256:r.source_sha256,official_pdf_sha256:r.official_pdf_sha256,reviewer_type:'AI',source_sections:sections,source_link_review:{checked_on:manifest.reviewed_on,content_sha256:sha(text),status:'SOURCE_LINKED_SCOPED_NOT_FULL_LEGAL_CERTIFICATION',coverage:'SCOPED_SUPPORT_NOT_EVERY_SENTENCE',limits},source_links:[{doc_id:r.doc_id,code:r.code,locator:r.locator,scope:limits,source_url:r.official_url,source_type:r.source_type||'USER_MARKDOWN_OFFICIAL_PDF_CROSSCHECKED',applies_from_year:r.from,...(r.to?{applies_to_year:r.to}:{})}]};
}
fs.writeFileSync('rag_data/semantic-topic-supplements.json',JSON.stringify(chunks,null,2)+'\n');fs.writeFileSync('worker/src/kb/chunkMeta.json',JSON.stringify(meta,null,2)+'\n');
console.log(JSON.stringify({imported:manifest.cards.length,refs:manifest.cards.map(r=>r.ref_id),legalAnswersGenerated:0}));
