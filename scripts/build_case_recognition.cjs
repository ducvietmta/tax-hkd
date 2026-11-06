// propose never approves. compile requires an explicit review bound to exact proposals.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const load=require('./lib/load_local_ts.cjs')();
const ROOT=path.resolve(process.env.CASE_RECOGNITION_ROOT||path.join(__dirname,'..')),dir=path.join(ROOT,'rag_data/case-recognition');
const rawPath=path.join(ROOT,'rag_data/rag-kb-export-2026-10-12/chunks.jsonl');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const raw=fs.readFileSync(rawPath,'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const cases=raw.filter(c=>c.tier==='CASE_EVIDENCE');
const cards=load(path.join(ROOT,'worker/src/ragEngine.ts')).CANONICAL_CHUNKS;
const vocabulary=read(path.join(ROOT,'worker/src/recognition/vocabulary.json'));
const policyPath=path.join(ROOT,'worker/src/recognition/sourcePolicy.json');
const sourcePolicy=fs.existsSync(policyPath)?read(policyPath):{version:'fixture',blocked_verified_refs:[]};
const phrases=Object.fromEntries(Object.entries(vocabulary).flatMap(([group,v])=>v.phrases.map((p,i)=>[group+':'+i,{phrase:p,intent:v.intent}])));
const fold=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();
const proposalPath=path.join(dir,'proposals.json'),reviewPath=path.join(dir,'reviews.json');
const mode=process.argv[2]||'check';
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
function proposalHash(p){const {proposal_hash,...body}=p;return hash(body);}
if(mode==='propose'){
 const rows=cases.map(c=>{
  // Source prose remains in the original corpus/review UI, never in runtime descriptors.
  const situation=c.text.match(/\*\*Tình huống:?\*\*:?\s*([^\n]+)/u)?.[1]||'';
  const text=fold(c.section+' '+situation);
  const phrase_ids=Object.entries(phrases).filter(([,v])=>(' '+text+' ').includes(' '+fold(v.phrase)+' ')).map(([id])=>id).slice(0,12);
  const candidate_cards=cards.filter(k=>['VERIFIED','VERIFIED_CONDITIONAL'].includes(k.tier)).map(k=>({
   ref_id:k.ref_id,card_hash:hash(k.text),score:phrase_ids.reduce((n,id)=>n+(fold(k.section).includes(fold(phrases[id].phrase))?3:fold(k.text).includes(fold(phrases[id].phrase))?1:0),0)
  })).filter(k=>k.score>0).sort((a,b)=>b.score-a.score||a.ref_id.localeCompare(b.ref_id)).slice(0,5);
  const p={case_id:c.id,source_hash:hash(c),status:c.section==='intro'?'excluded_intro':'pending',
   reason:c.section==='intro'?'INTRO_NOT_A_SCENARIO':!phrase_ids.length?'NO_NEUTRAL_DESCRIPTOR':!candidate_cards.length?'NO_CARD_CANDIDATE':'HUMAN_REVIEW_REQUIRED',
   phrase_ids,intent_ids:[...new Set(phrase_ids.map(id=>phrases[id].intent))],candidate_cards};
  return {...p,proposal_hash:proposalHash(p)};
 });
 // Explicitly preserve prior human decisions; recompilation rejects stale proposals.
 write(proposalPath,{schema:'taxhkd-case-proposals-v1',corpus_hash:hash(fs.readFileSync(rawPath,'utf8')),vocabulary_hash:hash(vocabulary),rows});
 if(!fs.existsSync(reviewPath))write(reviewPath,{schema:'taxhkd-case-reviews-v1',decisions:[]});
 console.log(JSON.stringify({proposals:rows.length,excluded:rows.filter(r=>r.status==='excluded_intro').length,with_phrases:rows.filter(r=>r.phrase_ids.length).length,pending:rows.filter(r=>r.status==='pending').length,approved_by_this_command:0}));
}else if(mode==='compile'||mode==='check'||mode==='refresh-corpus'){
 const p=read(proposalPath),reviews=read(reviewPath),caseMap=new Map(cases.map(c=>[c.id,c])),cardMap=new Map(cards.map(c=>[c.ref_id,c]));
 if(p.schema!=='taxhkd-case-proposals-v1'||reviews.schema!=='taxhkd-case-reviews-v1'||(mode!=='refresh-corpus'&&p.corpus_hash!==hash(fs.readFileSync(rawPath,'utf8')))||p.vocabulary_hash!==hash(vocabulary))throw Error('STALE_CORPUS_OR_VOCABULARY');
 if(p.rows.length!==cases.length||new Set(p.rows.map(r=>r.case_id)).size!==cases.length)throw Error('INCOMPLETE_CASE_INVENTORY');
 const decisions=new Map();for(const d of reviews.decisions){if(decisions.has(d.case_id)||!['approved','rejected'].includes(d.status)||!d.reviewer?.trim()||!Number.isFinite(Date.parse(d.reviewed_at)))throw Error('INVALID_HUMAN_REVIEW');decisions.set(d.case_id,d);}
 const entries=[],dispositions=[];
 for(const row of p.rows){
  const source=caseMap.get(row.case_id);
  if(!source||row.source_hash!==hash(source)||row.proposal_hash!==proposalHash(row))throw Error('STALE_CASE_PROPOSAL: '+row.case_id);
  if(row.phrase_ids.some(id=>!phrases[id])||JSON.stringify(row.intent_ids)!==JSON.stringify([...new Set(row.phrase_ids.map(id=>phrases[id].intent))]))throw Error('INVALID_DESCRIPTOR');
  const review=decisions.get(row.case_id);
  if(review&&(review.proposal_hash!==row.proposal_hash||row.status==='excluded_intro'))throw Error('STALE_OR_EXCLUDED_REVIEW: '+row.case_id);
  dispositions.push({case_id:row.case_id,status:review?.status||row.status,reason:row.reason});
  if(review?.status!=='approved')continue;
  const selectedPhrases=review.approved_phrase_ids;
  if(!Array.isArray(selectedPhrases)||!selectedPhrases.length||selectedPhrases.length>12||new Set(selectedPhrases).size!==selectedPhrases.length||selectedPhrases.some(id=>!row.phrase_ids.includes(id)||/[\d%]|https?:\/\//i.test(phrases[id]?.phrase||''))||!Array.isArray(review.approved_card_ids)||new Set(review.approved_card_ids).size!==review.approved_card_ids.length)throw Error('EMPTY_OR_INVALID_APPROVAL');
  const links=review.approved_card_ids.map(ref=>{
   const card=cardMap.get(ref),candidate=row.candidate_cards.find(c=>c.ref_id===ref);
   if(!card||!candidate||sourcePolicy.blocked_verified_refs.includes(ref)||!['VERIFIED','VERIFIED_CONDITIONAL'].includes(card.tier)||candidate.card_hash!==hash(card.text))throw Error('UNTRUSTED_OR_STALE_LINK: '+ref);
   return {ref_id:ref,card_hash:candidate.card_hash};
  });
  entries.push({case_id:row.case_id,source_hash:row.source_hash,phrase_ids:selectedPhrases,intent_ids:[...new Set(selectedPhrases.map(id=>phrases[id].intent))],links,
   review:{reviewer:review.reviewer,reviewed_at:review.reviewed_at,proposal_hash:row.proposal_hash,activation_authorization_id:reviews.activation_authorization?.id}});
 }
 if([...decisions.keys()].some(id=>!caseMap.has(id)))throw Error('UNKNOWN_REVIEW_CASE');
 // Refresh only after every case, descriptor, prior review and approved card hash
 // has passed the same compiler checks. Never approve or regenerate proposals here.
 if(mode==='refresh-corpus'){p.corpus_hash=hash(fs.readFileSync(rawPath,'utf8'));write(proposalPath,p);}
 const canonical_hash=hash({cards,metadata:read(path.join(ROOT,'worker/src/kb/chunkMeta.json'))});
 const payload={schema:'taxhkd-recognition-index-v1',version:hash({corpus:p.corpus_hash,vocabulary:p.vocabulary_hash,canonical_hash,sourcePolicy,entries}),corpus_hash:p.corpus_hash,canonical_hash,entries};
 const output=path.join(ROOT,'worker/src/recognition/caseIndex.json');
 if(mode==='compile'||mode==='refresh-corpus')write(output,payload);else if(JSON.stringify(read(output))!==JSON.stringify(payload))throw Error('INDEX_NOT_COMPILED');
 write(path.join(ROOT,'outputs/case-recognition-implementation-2026-10-23/dispositions.json'),{total:cases.length,activated:entries.length,dispositions});
 console.log(JSON.stringify({mode,total:cases.length,activated:entries.length,pending:dispositions.filter(d=>d.status==='pending').length,version:payload.version}));
}else throw Error('Use propose, compile, refresh-corpus or check');
