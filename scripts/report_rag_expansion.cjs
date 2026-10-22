// Keep the original report URL in sync with the full local inventory report.
const fs=require('node:fs'),crypto=require('node:crypto');
require('./audit_case_coverage.cjs');
const all=fs.readFileSync('rag_data/rag-kb-export-2026-10-12/chunks.jsonl','utf8').split(/\r?\n/).filter(s=>s.trim()).map(JSON.parse).concat(JSON.parse(fs.readFileSync('rag_data/semantic-topic-supplements.json','utf8')));
const counts={};for(const c of all)counts[c.tier]=(counts[c.tier]||0)+1;
const review=JSON.parse(fs.readFileSync('rag_data/expansion-review-2026-10-19.json','utf8'));
const summary={as_of:'2026-10-19',total:all.length,counts,canonical:counts.VERIFIED+counts.VERIFIED_CONDITIONAL,added:review.added.length,case_records:counts.CASE_EVIDENCE,
 legal_review_scope:'Only curated additions verified against listed primary sources; case search candidates are not coverage verdicts.',
 inventory:all.map(c=>({id:c.id,ref_id:c.ref_id||null,title:c.section,tier:c.tier,content_sha256:crypto.createHash('sha256').update(c.text).digest('hex'),reviewed_this_batch:review.added.some(r=>r.ref_id===c.ref_id)}))};
fs.writeFileSync('outputs/rag-expansion-2026-10-19/inventory.json',JSON.stringify(summary,null,2));
fs.copyFileSync('outputs/rag-complete-review-2026-10-19/report.html','outputs/rag-expansion-2026-10-19/report.html');
fs.copyFileSync('outputs/rag-expansion-2026-10-19/offline-tests.json','outputs/rag-complete-review-2026-10-19/offline-tests.json');
console.log(JSON.stringify({total:summary.total,canonical:summary.canonical,added:summary.added,caseRecords:summary.case_records}));
