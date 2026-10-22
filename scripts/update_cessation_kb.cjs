const fs=require('node:fs'),crypto=require('node:crypto');
const sourcePath='rag_data/business-cessation-source.json';
const chunk=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
const path='rag_data/semantic-topic-supplements.json';
const chunks=JSON.parse(fs.readFileSync(path,'utf8'));
const i=chunks.findIndex(c=>c.ref_id===chunk.ref_id);
if(i<0)chunks.push(chunk);else chunks[i]=chunk;
fs.writeFileSync(path,JSON.stringify(chunks,null,2)+'\n');
const metaPath='worker/src/kb/chunkMeta.json',meta=JSON.parse(fs.readFileSync(metaPath,'utf8'));
meta[chunk.ref_id]={id:chunk.id,ref_id:chunk.ref_id,section:chunk.section,tier:chunk.tier,
  legal_status:chunk.tier,applies_from_year:2026,applies_to_year:null,effective_from_date:'2026-07-01',
  content_reviewed_at:'2026-10-18',content_sha256:crypto.createHash('sha256').update(chunk.text).digest('hex'),
  reviewed_source_urls:['https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/7/90-btc.signed.pdf']};
fs.writeFileSync(metaPath,JSON.stringify(meta,null,2)+'\n');
const esc=v=>"'"+v.replace(/'/g,"''")+"'";
fs.writeFileSync('d1/migrations/20261018_business_cessation_evidence.sql',
 'INSERT OR REPLACE INTO rag_chunks (id,file,section,ref_id,tier,text) VALUES ('+
 [chunk.id,chunk.file,chunk.section,chunk.ref_id,chunk.tier,chunk.text].map(esc).join(',')+');\n');
