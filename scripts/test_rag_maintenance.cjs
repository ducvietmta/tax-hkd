const fs=require('node:fs'),assert=require('node:assert/strict');
const load=require('./lib/load_local_ts.cjs')();
const {buildVectorManifest,embeddingText}=require('./lib/vector_manifest.cjs');
const {CANONICAL_CHUNKS:cards,QUERY_ROUTES:routes}=load('worker/src/ragEngine.ts');
const metadata=JSON.parse(fs.readFileSync('worker/src/kb/chunkMeta.json','utf8'));
const policy=JSON.parse(fs.readFileSync('worker/src/recognition/sourcePolicy.json','utf8'));
const manifest=buildVectorManifest(cards,metadata,policy);
assert.deepEqual(manifest,JSON.parse(fs.readFileSync('worker/src/kb/vectorManifest.json','utf8')));
const reviewedBatch={cards:fs.readdirSync('rag_data').filter(name=>/^legal-card-review-\d{4}-\d{2}-\d{2}\.json$/.test(name)).flatMap(name=>JSON.parse(fs.readFileSync('rag_data/'+name,'utf8')).cards)};
assert.equal(new Set(reviewedBatch.cards.map(card=>card.ref_id)).size,reviewedBatch.cards.length);
assert.equal(manifest.entries.length,192+reviewedBatch.cards.length);assert(!manifest.entries.some(e=>e.id==='16.24'));
assert.equal(new Set(manifest.entries.map(e=>e.id)).size,manifest.entries.length);
const changed=cards.map(c=>c.ref_id==='16.185'?{...c,text:c.text+'\nChanged exception after character 4000.'}:c);
assert.notEqual(buildVectorManifest(changed,metadata,policy).version,manifest.version,'Tail conditions must change embedding/cache identity');
assert(embeddingText(cards.find(c=>c.ref_id==='16.185')).endsWith(cards.find(c=>c.ref_id==='16.185').text));
assert.notEqual(buildVectorManifest(cards,{...metadata,'16.185':{...metadata['16.185'],applies_to_year:2026}},policy).version,manifest.version,'Period changes invalidate identity');
assert.throws(()=>buildVectorManifest(cards.map(c=>c.ref_id==='16.185'?{...c,tier:'CASE_EVIDENCE'}:c),metadata,policy),/Unreviewed vector source/);
assert.equal(load('worker/src/vectorRetriever.ts').VECTORIZE_INDEX_VERSION,manifest.version);
const refs=new Set(cards.map(c=>c.ref_id));
for(const r of routes)for(const ref of r.refs)assert(refs.has(ref),`Dangling route ${r.id}: ${ref}`);
for(const id of ['BONUS','BONUS_EINVOICE','RENTAL_RATE_MIXED']){
 const r=routes.find(r=>r.id===id);assert(r.refs.includes('16.79'),'Unresolved threshold boundary must stay retrievable');
 assert(!r.refs.includes('16.47')&&!r.refs.includes('16.92'));
}
const importer=fs.readFileSync('scripts/backfill_vectorize.mjs','utf8');
assert(!importer.includes('/api/test-ai'),'Do not restore the removed public maintenance endpoint');
assert(JSON.parse(fs.readFileSync('package.json','utf8')).scripts['preworker:deploy'].includes('kb:vectors:check'),'Deployment must reject a stale remote index');
console.log('PASS: reviewed-only vectors, full-text/period cache identity, route integrity, and existing maintenance boundary.');
