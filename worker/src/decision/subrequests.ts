import type { TaxDecisionFrame, TaxSubrequest } from './types';
import type { AnswerScope } from '../answerScope';
import { buildRetrievalPlan } from './retrievalPlan';
import { retrieve, type Retrieved } from '../retriever';
import { filterAndGateEvidence } from './evidenceGate';
import { buildSubrequests } from './understandQuery';
import { reciprocalRankScore } from '../vectorRetriever';

/** Decompose trusted semantic labels, never match a question string or case ID. */
export {buildSubrequests};

const intentTopic: Record<string,string>={E_INVOICE:'INVOICE_REGISTRATION',PLATFORM_WITHHOLDING:'PLATFORM_WITHHOLDING',REFUND:'REFUND',ACCOUNTING_BOOKS:'ACCOUNTING_RETENTION'};
const focusNames={vat:'GTGT',pit:'TNCN',unspecified:''};
export function frameForRequest(frame: TaxDecisionFrame,request: TaxSubrequest): TaxDecisionFrame {
  const secondary=request.intent!==frame.tax_intent.primary.value;
  return {...frame,tax_period:request.period,facts:request.facts,
    tax_intent:{primary:{...frame.tax_intent.primary,value:request.intent},secondary:[]},
    semantic:{...frame.semantic,taxFocus:request.tax_focus,
      ...(secondary&&intentTopic[request.intent]?{topic:intentTopic[request.intent]}:{})}};
}

/** RRF across independent plans with one surviving anchor per request. */
export function retrieveSubrequests(query: string,frame: TaxDecisionFrame,scope: AnswerScope,topK=6){
  const requests=frame.requests?.length?frame.requests:buildSubrequests(frame);
  const links: Record<string,string[]>={};
  const ranked=new Map<string,{result:Retrieved;score:number}>();
  const anchors: string[]=[];
  const plans=requests.map(request=>{
    const narrowed=frameForRequest(frame,request),plan=buildRetrievalPlan(narrowed);
    const scopedQuery=`${query}\nYêu cầu đang đối chiếu: ${request.intent} ${focusNames[request.tax_focus]}`;
    const retrieved=retrieve(scopedQuery,topK,scope,plan);
    const allowed=new Set(filterAndGateEvidence(retrieved.results.map(r=>r.chunk),narrowed).passedChunks.map(c=>c.id));
    const hits=retrieved.results.filter(r=>allowed.has(r.chunk.id));
    hits.forEach((result,index)=>{
      const ref=result.chunk.ref_id||result.chunk.id;
      links[ref]=[...new Set([...(links[ref]||[]),request.id])];
      const previous=ranked.get(ref);
      ranked.set(ref,{result,score:(previous?.score||0)+reciprocalRankScore(index+1)});
    });
    for(const hit of hits.filter(hit=>hit.required))anchors.push(hit.chunk.ref_id||hit.chunk.id);
    if(hits[0])anchors.push(hits[0].chunk.ref_id||hits[0].chunk.id);
    return {request_id:request.id,plan,refs:hits.map(r=>r.chunk.ref_id||r.chunk.id),routeId:retrieved.routeId,usedFallback:retrieved.usedFallback};
  });
  const selected=[...new Set(anchors)];
  for(const [ref] of [...ranked].sort((a,b)=>b[1].score-a[1].score))if(!selected.includes(ref))selected.push(ref);
  const cap=Math.max(topK,selected.filter(ref=>anchors.includes(ref)).length);
  return {results:selected.slice(0,cap).map(ref=>({...ranked.get(ref)!.result,score:ranked.get(ref)!.score})),
    routeId:plans[0]?.routeId||null,usedFallback:plans.every(p=>p.usedFallback),requests,links,plans};
}
