import fs from 'node:fs';
import crypto from 'node:crypto';
import operationalEntries from '../rag_data/expansion-2026-10-19.mjs';
import depthEntries from '../rag_data/expansion-depth-2026-10-19.mjs';
const entries=[...operationalEntries,...depthEntries];
const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const sourcesPath='rag_data/rag-kb-export-2026-10-12/chunks.jsonl';
const base=fs.readFileSync(sourcesPath,'utf8').split(/\r?\n/).filter(s=>s.trim()).map(JSON.parse);
const supplementsPath='rag_data/semantic-topic-supplements.json';
const supplements=JSON.parse(fs.readFileSync(supplementsPath,'utf8'));
const metadataPath='worker/src/kb/chunkMeta.json';
const meta=JSON.parse(fs.readFileSync(metadataPath,'utf8'));
const added=[];
for(const {review,...chunk} of entries){
 if(base.some(c=>c.ref_id===chunk.ref_id&&['VERIFIED','VERIFIED_CONDITIONAL'].includes(c.tier)))throw Error(`Existing canonical ref ${chunk.ref_id}`);
 const i=supplements.findIndex(c=>c.ref_id===chunk.ref_id);
 if(i<0)supplements.push(chunk);else supplements[i]=chunk;
 const sourceUrls=[...review.source_urls];
 if(chunk.text.includes('Luật Quản lý thuế 108/2025'))sourceUrls.push('https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/108-qh15.signed.pdf');
 meta[chunk.ref_id]={id:chunk.id,ref_id:chunk.ref_id,section:chunk.section,tier:chunk.tier,legal_status:chunk.tier,
 applies_from_year:Number(review.effective_from_date.slice(0,4)),applies_to_year:review.effective_to_date?Number(review.effective_to_date.slice(0,4)):null,
 effective_from_date:review.effective_from_date,...(review.effective_to_date?{effective_to_date:review.effective_to_date}:{}),
 content_reviewed_at:'2026-10-19',content_sha256:sha(chunk.text),reviewed_source_urls:[...new Set(sourceUrls)]};
 added.push({ref_id:chunk.ref_id,title:chunk.section,...review,content_sha256:sha(chunk.text)});
}
const superseded=base.find(c=>c.id==='KB/16E-va-lo-hong-p0.md#1103');
const resolved=base.find(c=>c.id==='KB/16C-dang-ky-thue-va-xu-phat.md#1085');
if(resolved && resolved.tier!=='DEPRECATED'){
 resolved.tier='DEPRECATED';
 resolved.text='[SUPERSEDED 2026-10-19] Đã đối chiếu Điều 52–53 bản gốc Luật 108/2025/QH15; xem quy tắc 16.153. Đây là ghi nhận khoảng trống cũ, không phải hạn chế hiện tại.\n'+resolved.text;
}
// Six records are headings/change notes/control instructions, not missing legal answers.
const controlIds=[1007,1057,1076,1088,1095,1104];
for(const c of base)if(controlIds.some(n=>c.id.endsWith('#'+n))&&c.tier==='UNLABELED_CANONICAL')c.tier='CONTROL';
// This seventh unlabeled record contains genuine unresolved questions; retain them.
const unresolved=base.find(c=>c.id==='KB/16D-da-nguon-pham-vi-nguong.md#1094');
if(unresolved?.tier==='UNLABELED_CANONICAL')unresolved.tier='PENDING';
if(superseded&&superseded.tier!=='DEPRECATED'){
 superseded.tier='DEPRECATED';
 superseded.text='[SUPERSEDED 2026-10-19] Khoảng trống thủ tục đã được bổ sung tại mục 16.80 (Điều 6 Thông tư 91/2026/TT-BTC). Nội dung bên dưới chỉ là lịch sử, không dùng làm căn cứ hiện hành.\n'+superseded.text;
 fs.writeFileSync(sourcesPath,base.map(c=>JSON.stringify(c)).join('\n')+'\n');
}
fs.writeFileSync(supplementsPath,JSON.stringify(supplements,null,2)+'\n');
fs.writeFileSync(metadataPath,JSON.stringify(meta,null,2)+'\n');
fs.writeFileSync(sourcesPath,base.map(c=>JSON.stringify(c)).join('\n')+'\n');
const esc=v=>v==null?'NULL':"'"+String(v).replace(/'/g,"''")+"'";
const sql=entries.map(c=>'INSERT OR REPLACE INTO rag_chunks (id,file,section,ref_id,tier,text) VALUES ('+[c.id,c.file,c.section,c.ref_id,c.tier,c.text].map(esc).join(',')+');');
sql.push(`UPDATE rag_chunks SET tier='DEPRECATED', text=${esc(superseded.text)} WHERE id=${esc(superseded.id)};`);
sql.push(`UPDATE rag_chunks SET tier='DEPRECATED', text=${esc(resolved.text)} WHERE id=${esc(resolved.id)};`);
for(const c of base.filter(c=>controlIds.some(n=>c.id.endsWith('#'+n))||c.id===unresolved.id))sql.push(`UPDATE rag_chunks SET tier=${esc(c.tier)} WHERE id=${esc(c.id)};`);
fs.writeFileSync('d1/migrations/20261019_operational_rag_expansion.sql',sql.join('\n')+'\n');
fs.mkdirSync('outputs/rag-expansion-2026-10-19',{recursive:true});
fs.writeFileSync('rag_data/expansion-review-2026-10-19.json',JSON.stringify({as_of:'2026-10-19',scope:`${entries.length} source-backed operational and detailed rules; corpus inventory is not independent certification of every case`,added,
 superseded:[superseded.id,resolved.id],structural_corrections:{control_records:controlIds.length,pending_record:unresolved.id},limits:['CASE_EVIDENCE records remain unverified; lexical candidate matches do not establish legal coverage.','No blanket promotion of PENDING/SPLIT, no invention of new NQ43 filing procedures.','Local scanned sources were visually read at the pages recorded; existence of other PDF files is not verification.']},null,2));
console.log(JSON.stringify({added:added.length,canonical:base.concat(supplements).filter(c=>['VERIFIED','VERIFIED_CONDITIONAL'].includes(c.tier)).length}));
