// Imports a data package only after direct user authorization. Never deploys.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const assert=require('node:assert/strict');
const input=process.argv[2],apply=process.argv.includes('--apply');
if(!input)throw Error('Provide a directory containing the four reviewed package files.');
if(apply&&!process.argv.includes('--user-authorized'))throw Error('DIRECT_USER_AUTHORIZATION_REQUIRED');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const load=require('./lib/load_local_ts.cjs')();
const update=read(path.join(input,'case-recognition-update.json')),incoming=read(path.join(input,'case-recognition-reviews.json')),audit=read(path.join(input,'review-audit.json'));
assert.equal(update.schema,'taxhkd-case-recognition-update-v1');assert.equal(incoming.schema,'taxhkd-case-reviews-v1');
const base=read('rag_data/case-recognition/proposals.json'),previous=read('rag_data/case-recognition/reviews.json');
assert.equal(previous.decisions.length,0,'Refusing to overwrite existing imported reviews.');
const vocab=read('worker/src/recognition/vocabulary.json'),cards=load('worker/src/ragEngine.ts').CANONICAL_CHUNKS;
const cardMap=new Map(cards.map(c=>[c.ref_id,c]));
const rawText=fs.readFileSync('rag_data/rag-kb-export-2026-10-12/chunks.jsonl','utf8');
const cases=rawText.trim().split(/\r?\n/).map(JSON.parse).filter(c=>c.tier==='CASE_EVIDENCE'),caseMap=new Map(cases.map(c=>[c.id,c]));
assert.equal(base.corpus_hash,hash(rawText));assert.equal(base.vocabulary_hash,hash(vocab));
assert.equal(update.metadata.updated_data_sha256,hash(JSON.stringify(update.data).replace(/</g,'\\u003c')));
const baseMap=new Map(base.rows.map(r=>[r.case_id,r])),patchMap=new Map(update.patches.map(p=>[p.case_id,p]));
assert.equal(patchMap.size,update.patches.length);
for(const patch of update.patches){
 const old=baseMap.get(patch.case_id);assert(old,'Unknown patch');
 assert.equal(old.source_hash,patch.expected_source_hash);assert.equal(old.proposal_hash,patch.expected_proposal_hash);
 assert.equal(hash(patch.proposal),patch.new_proposal_hash);
}
const neutralizations=read('scripts/case_phrase_neutralizations.json'),changes=[];
for(const [group,v] of Object.entries(vocab))assert.equal(update.group_to_intent[group],v.intent);
const additions=Object.entries(update.phrase_catalog_additions).sort(([a],[b])=>{const [ag,ai]=a.split(':'),[bg,bi]=b.split(':');return ag.localeCompare(bg)||Number(ai)-Number(bi);});
for(const [id,p] of additions){
 const [group,offset]=id.split(':'),i=Number(offset);assert.equal(group,p.phrase_group);assert.equal(p.intent_id,update.group_to_intent[group]);
 if(!vocab[group])vocab[group]={intent:p.intent_id,phrases:[]};
 assert.equal(i,vocab[group].phrases.length,'Non-contiguous or conflicting phrase ID: '+id);
 const text=neutralizations[id]||p.text;
 assert.equal(typeof text,'string');assert(text.trim()&&text.length<180&&!/[\d%]|https?:\/\//i.test(text),'Unsafe phrase: '+id);
 vocab[group].phrases.push(text);if(text!==p.text)changes.push({phrase_id:id,original:p.text,neutral:text});
}
for(const id of Object.keys(neutralizations))assert(update.phrase_catalog_additions[id],'Unused neutralization: '+id);
const phraseMap=new Map(Object.entries(vocab).flatMap(([g,v])=>v.phrases.map((text,i)=>[g+':'+i,{text,intent:v.intent}])));
const rows=update.data.rows.map(row=>{
 const {title,original_text,...proposal}=row,{proposal_hash,...body}=proposal;
 assert(caseMap.has(row.case_id));assert.equal(row.source_hash,hash(caseMap.get(row.case_id)));
 assert.equal(original_text,caseMap.get(row.case_id).text);assert.equal(title,caseMap.get(row.case_id).section);
 assert.equal(proposal_hash,hash(body));
 const patch=patchMap.get(row.case_id),expected=patch?{...patch.proposal,proposal_hash:patch.new_proposal_hash}:baseMap.get(row.case_id);
 assert.deepEqual(proposal,expected,'Undeclared proposal change');
 assert.deepEqual(row.intent_ids,[...new Set(row.phrase_ids.map(id=>{assert(phraseMap.has(id));return phraseMap.get(id).intent;}))]);
 for(const candidate of row.candidate_cards){const card=cardMap.get(candidate.ref_id);assert(card&&['VERIFIED','VERIFIED_CONDITIONAL'].includes(card.tier));assert.equal(candidate.card_hash,hash(card.text));assert.deepEqual(update.data.cards[candidate.ref_id]?.text,card.text);}
 return proposal;
});
assert.equal(rows.length,cases.length);assert.equal(new Set(rows.map(p=>p.case_id)).size,cases.length);
const rowMap=new Map(rows.map(p=>[p.case_id,p])),seen=new Set(),counts={},auditMap=new Map(audit.decisions.map(d=>[d.case_id,d]));
for(const d of incoming.decisions){
 assert(!seen.has(d.case_id));seen.add(d.case_id);const p=rowMap.get(d.case_id);
 assert(p&&p.status!=='excluded_intro');assert.equal(p.proposal_hash,d.proposal_hash);
 assert(['approved','rejected'].includes(d.status));assert(d.reviewer?.trim()&&Number.isFinite(Date.parse(d.reviewed_at)));
 for(const k of ['case_id','proposal_hash','status','approved_phrase_ids','approved_card_ids','reviewer','reviewed_at'])assert.deepEqual(d[k],auditMap.get(d.case_id)?.[k]);
 assert(Array.isArray(d.approved_phrase_ids)&&Array.isArray(d.approved_card_ids));
 assert.equal(new Set(d.approved_phrase_ids).size,d.approved_phrase_ids.length);assert.equal(new Set(d.approved_card_ids).size,d.approved_card_ids.length);
 if(d.status==='approved'){
  assert(d.approved_phrase_ids.length>0&&d.approved_phrase_ids.length<=12);
  assert(d.approved_phrase_ids.every(id=>p.phrase_ids.includes(id)));
  assert(d.approved_card_ids.every(ref=>p.candidate_cards.some(c=>c.ref_id===ref)&&!update.blocked_card_ids.includes(ref)));
 }else assert.equal(d.approved_phrase_ids.length+d.approved_card_ids.length,0);
 counts[d.status]=(counts[d.status]||0)+1;
}
assert.equal(seen.size,rows.filter(r=>r.status!=='excluded_intro').length);
assert.deepEqual(update.blocked_card_ids,[...new Set(update.blocked_card_ids)]);
for(const ref of update.blocked_card_ids)assert(cardMap.has(ref));
const now=new Date().toISOString(),authorization={id:hash({package:hash(update),instruction:'cứ kích hoạt đi',date:'2026-10-24'}),source:'direct_user_message',instruction:'cứ kích hoạt đi',recorded_at:now,ai_review_provenance_preserved:true};
const policy={version:hash({blocked_verified_refs:update.blocked_card_ids}),blocked_verified_refs:update.blocked_card_ids};
const proposals={...base,vocabulary_hash:hash(vocab),rows};
const reviews={...incoming,activation_authorization:authorization};
const report={counts,cases:rows.length,descriptors:counts.approved,links:incoming.decisions.filter(d=>d.status==='approved').reduce((n,d)=>n+d.approved_card_ids.length,0),neutralized_phrases:changes.length,blocked_verified_refs:update.blocked_card_ids,source_texts_modified:false,canonical_cards_modified:false,applied:apply,production_enabled:false};
if(apply){
 const out='outputs/case-recognition-activation-2026-10-24',archive='rag_data/case-recognition/imports/2026-10-24';
 fs.mkdirSync(out+'/before',{recursive:true});fs.mkdirSync(archive,{recursive:true});
 const files=['worker/src/recognition/vocabulary.json','worker/src/recognition/sourcePolicy.json','rag_data/case-recognition/proposals.json','rag_data/case-recognition/reviews.json','worker/src/recognition/caseIndex.json'];
 const backups=files.map(p=>[p,fs.readFileSync(p)]);
 for(const [p,bytes] of backups)fs.writeFileSync(out+'/before/'+p.replaceAll('/','__'),bytes);
 const write=(p,data)=>fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n');
 try{
  write(files[0],vocab);write(files[1],policy);write(files[2],proposals);write(files[3],reviews);
  cp.execFileSync(process.execPath,['scripts/build_case_recognition.cjs','compile'],{stdio:'inherit'});
  write(archive+'/audit.json',audit);write(archive+'/resolutions.json',update.patches.map(p=>({case_id:p.case_id,resolution_record:p.resolution_record})));
  write(archive+'/manifest.json',{...report,activation_authorization:authorization,package_hashes:{update:hash(update),reviews:hash(incoming),audit:hash(audit)},neutralizations:changes,source_reviewers:[...new Set(incoming.decisions.map(d=>d.reviewer))],validation:'Structural checks only; no claim of legal revalidation or live accuracy.'});
  write(out+'/import.json',report);
 }catch(e){for(const [p,bytes] of backups)fs.writeFileSync(p,bytes);throw e;}
}
console.log(JSON.stringify(report,null,2));
