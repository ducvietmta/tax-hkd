const crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const embeddingText=c=>(c.section||'')+'\n'+c.text;
function buildVectorManifest(cards,metadata,policy){
 const blocked=new Set(policy.blocked_verified_refs);
 const entries=cards.filter(c=>!blocked.has(c.ref_id||c.id)).map(c=>{
  const id=c.ref_id||c.id,m=metadata[id];
  if(!m||m.id!==c.id||!['VERIFIED','VERIFIED_CONDITIONAL'].includes(c.tier)||!['VERIFIED','VERIFIED_CONDITIONAL'].includes(m.legal_status))throw Error('Unreviewed vector source '+id);
  return {id,sha256:hash(embeddingText(c)),tier:c.tier,from_year:m.applies_from_year,to_year:m.applies_to_year??null};
 });
 return {schema:'taxhkd-vector-manifest-v1',model:'@cf/baai/bge-m3',dimensions:1024,
  version:'tax-kb-bge-m3-'+hash(entries).slice(0,20),excluded_refs:[...blocked].sort(),entries};
}
module.exports={buildVectorManifest,embeddingText,hash};
