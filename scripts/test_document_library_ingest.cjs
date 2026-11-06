const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),ts=require('typescript');
const docs=JSON.parse(fs.readFileSync('src/data/legalDocuments.json','utf8'));
const library=JSON.parse(fs.readFileSync('worker/src/data/documentLibrary.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('document_library/import-2026-10-26.json','utf8'));
const batch2=JSON.parse(fs.readFileSync('document_library/import-2026-10-26-batch2.json','utf8'));
assert.equal(library.length,docs.length);
assert.equal(manifest.imported,33);assert.equal(manifest.pending,1); // Historical batch 1.
assert.equal(batch2.imported,26);assert.equal(batch2.pending,0);
assert.equal(batch2.total_available,manifest.imported+batch2.imported);assert.deepEqual(batch2.catalog_without_markdown,[]);
const m={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('worker/src/documentLibrary.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(()=>({default:library}),m,m.exports);
const compact=s=>s.replace(/\s+/gu,' ').trim();
for(const entry of library){
 const source=fs.readFileSync(`document_library/${entry.id}.md`,'utf8').replace(/^\uFEFF/,'').trim();
 const doc=docs.find(d=>d.id===entry.id);assert(doc,entry.id);assert.equal(doc.code,entry.code);
 assert.equal(compact(entry.sections.map(s=>s.text).join('\n')),compact(source),'No missing source text: '+entry.id);
 assert.equal(entry.version,crypto.createHash('sha256').update(source).digest('hex').slice(0,16));
 assert.equal(new Set(entry.sections.map(s=>s.id)).size,entry.sections.length);
 for(const section of entry.sections){assert(section.text.trim());assert(m.exports.documentContext(entry,'explain',section.id),'Selectable section: '+entry.id+'/'+section.id);}
 if(source.length>80000)assert.equal(m.exports.documentContext(entry,'summary'),null,'No implicit full-document truncation');
}
for(const row of [...manifest.files,...batch2.files])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(row.destination)).digest('hex'),row.sha256,'Original preserved: '+row.id);
assert(m.exports.libraryDocument('NQ-204-2025-QH15'),'Batch 2 supplies body for previously pending NQ');
const large=m.exports.libraryDocument('TT-89-2026-TT-BTC');assert(large.sections.reduce((n,s)=>n+s.text.length,0)>1400000);
assert.equal(m.exports.documentContext(large,'summary'),null,'Large source requires explicit section selection');
assert(library.find(d=>d.id==='Luat-91-2015-QH13').sections.length>1);
assert.equal(m.exports.documentContext(library[0],'test','S999999'),null);
console.log('PASS: '+library.length+' catalog mappings, both batches preserve source hashes/text, bounded selectable sections including full TT89, stable versions, pending NQ resolved.');
