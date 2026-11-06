const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const input=process.argv[2];if(!input)throw Error('Provide the reviewed JSON exported by the local review form.');
const target=path.resolve('rag_data/case-recognition/reviews.json');
if(path.resolve(input)===target)throw Error('Import a separate review export.');
const previous=fs.readFileSync(target,'utf8'),old=JSON.parse(previous),incoming=JSON.parse(fs.readFileSync(input,'utf8').replace(/^\uFEFF/,''));
if(incoming.schema!=='taxhkd-case-reviews-v1'||!Array.isArray(incoming.decisions)||!incoming.decisions.length)throw Error('INVALID_REVIEW_EXPORT');
const merged=new Map(old.decisions.map(d=>[d.case_id,d]));
const decisionKey=d=>JSON.stringify({case_id:d.case_id,proposal_hash:d.proposal_hash,status:d.status,reviewer:d.reviewer,
 phrases:[...(d.approved_phrase_ids||[])].sort(),cards:[...(d.approved_card_ids||[])].sort()});
for(const d of incoming.decisions){
 const existing=merged.get(d.case_id);
 if(existing){if(decisionKey(existing)!==decisionKey(d))throw Error('CONFLICTING_REVIEW: '+d.case_id);continue;}
 merged.set(d.case_id,d);
}
const priorIndex=fs.readFileSync('worker/src/recognition/caseIndex.json');
try{
 fs.writeFileSync(target,JSON.stringify({...old,schema:incoming.schema,decisions:[...merged.values()]},null,2)+'\n');
 cp.execFileSync(process.execPath,['scripts/build_case_recognition.cjs','compile'],{stdio:'inherit'});
}catch(error){fs.writeFileSync(target,previous);fs.writeFileSync('worker/src/recognition/caseIndex.json',priorIndex);throw error;}
console.log(JSON.stringify({imported:incoming.decisions.length,total:merged.size,feature_enabled:false}));
