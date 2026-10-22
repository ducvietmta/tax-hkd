const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),ts=require('typescript');
const load=(file,deps={})=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(id=>{assert(id in deps,`Unexpected import ${id}`);return deps[id];},m,m.exports);return m.exports;};
const {CANONICAL_CHUNKS:chunks}=load('worker/src/ragEngine.ts');
const meta=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
const docs=[...JSON.parse(fs.readFileSync('src/data/legalDocuments.json','utf8')),...JSON.parse(fs.readFileSync('worker/src/kb/sourceDocuments.json','utf8')).documents];
assert.equal(new Set(docs.map(d=>d.id)).size,docs.length,'No shadowing a catalogued source');
const ids=new Map(docs.map(d=>[d.id,d]));
const linked=chunks.filter(c=>meta[c.ref_id]?.source_links?.length);
assert.equal(linked.length,42);
const required='2 3 4 5 10 13 15 16 17 19 23 25 27 28 30 31 32 33 34 36 37 40 42 45 46 48 51 53 55 57 58 59 70 74 78 84 86 87 94 97 98'.split(' ').map(n=>'16.'+n);
required.push('16.156');
assert.deepEqual(linked.map(c=>c.ref_id).sort(),required.sort());
let count=0;
for(const chunk of linked){
 const m=meta[chunk.ref_id],review=m.source_link_review;
 assert.equal(m.id,chunk.id);assert.equal(review.content_sha256,crypto.createHash('sha256').update(chunk.text).digest('hex'),`Stale source review ${chunk.ref_id}`);
 assert.equal(review.coverage,'SCOPED_SUPPORT_NOT_EVERY_SENTENCE');
 assert.equal(review.status,'SOURCE_LINKED_SCOPED_NOT_FULL_LEGAL_CERTIFICATION');
 assert(review.checked_on&&review.limits);
 for(const link of m.source_links){
  assert(ids.has(link.doc_id));assert.equal(link.code,ids.get(link.doc_id).code);
  assert(link.locator&&link.scope&&link.source_type);
  if(link.source_url.startsWith('/documents/')){assert(!link.source_url.includes('..'));assert(fs.existsSync('public'+link.source_url));}
  else {const u=new URL(link.source_url);assert.equal(u.protocol,'https:');assert(['chinhphu.vn','vbpl.moj.gov.vn','iras.gov.sg'].some(host=>u.hostname===host||u.hostname.endsWith('.'+host)),u.hostname);}
  count++;
 }
}
const provenance=load('worker/src/kb/provenance.ts',{'./chunkMeta.json':{default:meta}});
for(const chunk of linked){const p=provenance.evidenceProvenance(chunk);assert.deepEqual(p.source_links,meta[chunk.ref_id].source_links);assert.equal(p.source_link_review.content_sha256,meta[chunk.ref_id].source_link_review.content_sha256);}
assert.equal(provenance.evidenceProvenance({...linked[0],id:'forged-source'}).source_links,undefined,'Never attach sources to a mismatched chunk identity');
assert(meta['16.94'].source_link_review.limits.includes('Chưa xác minh'));
assert(meta['16.55'].source_links.some(s=>s.doc_id==='TT-40-2021-TT-BTC'&&s.applies_to_year===2025));
assert(meta['16.97'].source_links.some(s=>s.doc_id==='NQ-198-2025-QH15'&&s.applies_from_year===2026));
assert(meta['16.98'].source_links.filter(s=>s.doc_id.startsWith('ND-')).every(s=>s.applies_to_year===2025));
console.log(`PASS: ${linked.length} scoped source bindings, ${count} document links, content hashes, historical boundaries and runtime provenance. No model/API calls.`);
