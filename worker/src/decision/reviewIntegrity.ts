import type { GroundedClaim, GroundingPacket } from './claimGrounding';
import { periodFits } from '../kb/periodApplicability';

export interface ClaimReviewIssue { claim_id:string; code:string }
/** Structural/period checks only. Passing never establishes legal support. */
export function auditGrounding(packet:GroundingPacket):ClaimReviewIssue[]{
  const issues:ClaimReviewIssue[]=[];
  const passages=new Map(packet.passages.map(p=>[p.id,p]));
  const requests=new Map(packet.requests.map(r=>[r.id,r]));
  const duplicatePassages=passages.size!==packet.passages.length;
  const duplicateRequests=requests.size!==packet.requests.length;
  const counts=new Map<string,number>();
  packet.claims.forEach(c=>counts.set(c.id,(counts.get(c.id)||0)+1));
  for(const claim of packet.claims){
    if(claim.kind==='CITATIONS')continue;
    const fail=(code:string)=>issues.push({claim_id:claim.id,code});
    if(duplicatePassages||duplicateRequests||counts.get(claim.id)!==1){fail('DUPLICATE_ID');continue;}
    if(claim.mapping!=='PROPOSED'||!claim.evidence_ids.length||!claim.request_ids.length){fail('UNMAPPED');continue;}
    if(claim.evidence_ids.some(id=>!passages.has(id))||claim.request_ids.some(id=>!requests.has(id))){fail('UNKNOWN_REFERENCE');continue;}
    const evidence=claim.evidence_ids.map(id=>passages.get(id)!);
    const expectedRefs=[...new Set(evidence.map(p=>p.ref_id))].sort();
    if(JSON.stringify([...new Set(claim.ref_ids)].sort())!==JSON.stringify(expectedRefs)){fail('SOURCE_ID_MISMATCH');continue;}
    const years=[...new Set(claim.request_ids.flatMap(id=>requests.get(id)!.period.years))];
    const fits=(p:typeof evidence[number],year:number)=>{
      // Legacy packets without provenance still require semantic review.
      const source=p.provenance;if(!source)return true;
      return Number.isInteger(source.applies_from_year)&&periodFits(source,{years:[year]});
    };
    if(evidence.some(p=>p.provenance&&(p.provenance.metadata_state!=='REGISTERED'||p.provenance.ref_id!==p.ref_id||
      !['VERIFIED','VERIFIED_CONDITIONAL'].includes(p.provenance.legal_status)))){fail('UNTRUSTED_SOURCE_METADATA');continue;}
    if(years.some(year=>!evidence.some(p=>fits(p,year)))||
      (years.length&&evidence.some(p=>!years.some(year=>fits(p,year))))){fail('PERIOD_MISMATCH');continue;}
    if(claim.request_ids.some(id=>{
      const period=requests.get(id)!.period;
      return !!period.event_date&&!evidence.some(p=>!p.provenance||periodFits(p.provenance,period));
    })){fail('EVENT_DATE_MISMATCH');continue;}
    if(evidence.some(p=>p.request_ids?.length&&!p.request_ids.some(id=>claim.request_ids.includes(id))))fail('REQUEST_SOURCE_MISMATCH');
  }
  return issues;
}

export interface PriorClaimReview {
  text:string; evidence_ids:string[]; request_ids?:string[]; context_key?:string;
  choice:string; confidence:number;
}
/** The digest covers actual evidence/facts/history, not merely reusable E1 IDs. */
export async function reviewContextKey(question:string,evidence:string,history:unknown,semantic:unknown,packet:GroundingPacket):Promise<string>{
  const value=JSON.stringify({schema:'taxhkd-review-v1',question,evidence,history,semantic,requests:packet.requests,passages:packet.passages});
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function canReuseClaimReview(claim:GroundedClaim,prior:PriorClaimReview|undefined,contextKey:string):boolean{
  return !!prior&&claim.mapping==='PROPOSED'&&prior.choice==='COMPLETE'&&prior.confidence>=.8&&
    prior.context_key===contextKey&&prior.text===claim.text&&
    JSON.stringify(prior.evidence_ids)===JSON.stringify(claim.evidence_ids)&&
    JSON.stringify(prior.request_ids)===JSON.stringify(claim.request_ids);
}
export function canReleaseReviewedAnswer(issues:string[]|null):boolean{return issues!==null&&issues.length===0;}
