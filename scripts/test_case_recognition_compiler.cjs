// Synthetic approvals are confined to a fresh test directory, never the real registry.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve('outputs/case-recognition-implementation-2026-10-23/compiler-fixture-'+Date.now());
const realIndexBefore=fs.readFileSync('worker/src/recognition/caseIndex.json','utf8');
const write=(p,v)=>{p=path.join(root,p);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof v==='string'?v:JSON.stringify(v,null,2));};
write('worker/src/recognition/vocabulary.json',fs.readFileSync('worker/src/recognition/vocabulary.json','utf8'));
write('worker/src/kb/chunkMeta.json',{});
const card={id:'verified-test',ref_id:'16.1',file:'KB/verified',section:'Tra soát nộp trùng',tier:'VERIFIED',text:'tra soát nộp trùng'};
const corpus=[{id:'KB/01-test.md#1',file:'KB/01-test.md',section:'Tra soát khoản nộp trùng',tier:'CASE_EVIDENCE',ref_id:null,text:'Tình huống thử nghiệm, không phải dữ liệu sản xuất.'}];
write('worker/src/ragEngine.ts','export const CANONICAL_CHUNKS='+JSON.stringify([card])+';');
write('rag_data/rag-kb-export-2026-10-12/chunks.jsonl',corpus.map(c=>JSON.stringify(c)).join('\n'));
const run=mode=>cp.spawnSync(process.execPath,[path.resolve('scripts/build_case_recognition.cjs'),mode],{encoding:'utf8',env:{...process.env,CASE_RECOGNITION_ROOT:root}});
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
assert.equal(run('propose').status,0);assert.equal(run('compile').status,0);
assert.equal(read('worker/src/recognition/caseIndex.json').entries.length,0,'proposal cannot auto approve');
const proposal=read('rag_data/case-recognition/proposals.json').rows[0];
const decision={case_id:proposal.case_id,proposal_hash:proposal.proposal_hash,status:'approved',approved_phrase_ids:proposal.phrase_ids,approved_card_ids:['16.1'],reviewer:'TEST_FIXTURE_ONLY',reviewed_at:'2026-10-23T00:00:00Z'};
write('rag_data/case-recognition/reviews.json',{schema:'taxhkd-case-reviews-v1',decisions:[decision]});
assert.equal(run('compile').status,0);assert.equal(read('worker/src/recognition/caseIndex.json').entries.length,1);
assert.equal(run('check').status,0);
for(const mutation of [d=>d.reviewer='',d=>d.proposal_hash='0'.repeat(64),d=>d.approved_phrase_ids=['untrusted:freeform'],d=>d.approved_card_ids=['case-id']]){
 const bad=structuredClone(decision);mutation(bad);write('rag_data/case-recognition/reviews.json',{schema:'taxhkd-case-reviews-v1',decisions:[bad]});assert.notEqual(run('compile').status,0);
}
write('rag_data/case-recognition/reviews.json',{schema:'taxhkd-case-reviews-v1',decisions:[decision]});
write('worker/src/ragEngine.ts','export const CANONICAL_CHUNKS='+JSON.stringify([{...card,text:card.text+' changed'}])+';');
assert.notEqual(run('compile').status,0,'stale card invalidates approved link');
// A metadata-only corpus update can reuse reviews only after source-level validation.
write('worker/src/ragEngine.ts','export const CANONICAL_CHUNKS='+JSON.stringify([card])+';');
write('rag_data/rag-kb-export-2026-10-12/chunks.jsonl',[...corpus,{id:'metadata-only',tier:'META',text:'Index metadata changed'}].map(c=>JSON.stringify(c)).join('\n'));
assert.notEqual(run('check').status,0);
assert.equal(run('refresh-corpus').status,0);
assert.equal(run('check').status,0);
assert.deepEqual(read('rag_data/case-recognition/reviews.json').decisions,[decision]);
const proposalsBefore=fs.readFileSync(path.join(root,'rag_data/case-recognition/proposals.json'),'utf8');
write('rag_data/rag-kb-export-2026-10-12/chunks.jsonl',corpus.map(c=>JSON.stringify({...c,text:'Changed case content'})).join('\n'));
assert.notEqual(run('refresh-corpus').status,0,'Changing a case must not carry old approvals');
assert.equal(fs.readFileSync(path.join(root,'rag_data/case-recognition/proposals.json'),'utf8'),proposalsBefore,'Rejected refresh may not mutate proposals');
assert.equal(fs.readFileSync('worker/src/recognition/caseIndex.json','utf8'),realIndexBefore,'production approval registry untouched');
console.log('PASS 10 compiler review-boundary scenarios in isolated synthetic corpus; real approvals untouched.');
