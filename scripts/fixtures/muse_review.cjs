// Schema fixture only. Never used to determine law or verify live answers.
module.exports=payload=>({
 checks:Object.fromEntries(['facts','evidence','coverage','citations'].map(k=>[k,{status:'PASS',reason:'Fixture says this dimension is supported; live verification is separate.'}])),
 requests:payload.grounding.requests.map(r=>({id:r.id,status:'COMPLETE',reason:'Fixture covers requested explanation.'})),
 claims:payload.grounding.claims.map((c,i)=>{
  const id=c.evidence_ids[0]||payload.grounding.passages[0].id;
  const p=payload.grounding.passages.find(p=>p.id===id);
  return {id:c.id,request_ids:c.request_ids.length?c.request_ids:[payload.grounding.requests[0].id],status:'SUPPORTED',confidence:.97,role:i===0?'DIRECT_ANSWER':'SUPPORTING',role_confidence:.99,reason:'Fixture source witness supports a paraphrase rather than requiring an exact answer.',support:[{evidence_id:id,quote:p.text.slice(0,90)}]};
 })
});
