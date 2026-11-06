import { CANONICAL_CHUNKS } from '../ragEngine';
import { retrieve, type Retrieved } from '../retriever';
import type { AnswerScope } from '../answerScope';
import type { RetrievalPlan, TaxDecisionFrame } from '../decision/types';
import { isSubjectCompatible } from '../decision/evidenceGate';
import { periodFits } from '../kb/periodApplicability';
import { evidenceProvenance } from '../kb/provenance';
import { validPacket, type UnderstandingPacket } from './recognizer';
import { isBlockedVerifiedRef } from './sourcePolicy';

export interface BridgeTrace {accepted_refs:string[];rejected:Array<{ref_id:string;reason:string}>}
/** Recognition is a small ranking hint, never a source, pin, or scope override. */
export function bridgeVerifiedCandidates(base:Retrieved[],packet:UnderstandingPacket,query:string,scope:AnswerScope,
  plan:RetrievalPlan,frame:TaxDecisionFrame,cap:number):{results:Retrieved[];trace:BridgeTrace}{
  const trace:BridgeTrace={accepted_refs:[],rejected:[]};
  if(!validPacket(packet,packet.recognition_version)||packet.status!=='MATCHED')return {results:base,trace};
  const allowed=plan.allowed_refs?new Set(plan.allowed_refs):null;
  const byRef=new Map(CANONICAL_CHUNKS.map(c=>[c.ref_id,c]));
  const expanded=retrieve(`${query}\n${packet.expansion_terms.join(' ')}`,cap,scope,plan).results;
  const peak=Math.max(1,...base.map(r=>r.score));
  const candidates=new Map(base.map(r=>[r.chunk.id,{...r}]));
  const suggested=new Set(packet.suggested_verified_card_ids);
  const extra=[...expanded,...packet.suggested_verified_card_ids.flatMap(ref=>{
    const chunk=byRef.get(ref);return chunk?[{chunk,score:peak*.4,viaRoute:false}]:[];
  })];
  for(const r of extra){
    const ref=r.chunk.ref_id||r.chunk.id,p=evidenceProvenance(r.chunk);
    const reason=isBlockedVerifiedRef(ref)?'QUARANTINED_SOURCE':!['VERIFIED','VERIFIED_CONDITIONAL'].includes(r.chunk.tier)||p.metadata_state!=='REGISTERED'?'UNTRUSTED':
      allowed&&!allowed.has(ref)?'OUTSIDE_PLAN':!periodFits(p,frame.tax_period)?'PERIOD_MISMATCH':
      !isSubjectCompatible(r.chunk,frame)?'SUBJECT_MISMATCH':null;
    if(reason){trace.rejected.push({ref_id:ref,reason});continue;}
    trace.accepted_refs.push(ref);
    if(!candidates.has(r.chunk.id))candidates.set(r.chunk.id,{chunk:r.chunk,score:Math.min(peak*.5,r.score),viaRoute:false});
  }
  for(const candidate of candidates.values()){
    // A case cannot create required evidence or reweight a required source.
    if(!candidate.required&&suggested.has(candidate.chunk.ref_id||'')&&trace.accepted_refs.includes(candidate.chunk.ref_id||''))candidate.score+=peak*.08;
  }
  trace.accepted_refs=[...new Set(trace.accepted_refs)];
  const values=[...candidates.values()],required=values.filter(r=>r.required);
  return {results:[...required,...values.filter(r=>!r.required).sort((a,b)=>b.score-a.score)].slice(0,Math.max(cap,required.length)),trace};
}
