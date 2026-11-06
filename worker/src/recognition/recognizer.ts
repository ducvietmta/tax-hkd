import indexData from './caseIndex.json';
import vocabulary from './vocabulary.json';
import { CANONICAL_CHUNKS } from '../ragEngine';
import { foldText } from '../utils/text';
import { isBlockedVerifiedRef } from './sourcePolicy';

export const RECOGNITION_POLICY_VERSION = 'case-recognition-v1';
export interface RecognitionConfig {mode:'off'|'shadow'|'on';strict:boolean;invalid:boolean}
export function recognitionConfig(env:{CASE_RECOGNITION_MODE?:string;STRICT_VERIFIED_EVIDENCE_ENABLED?:string}):RecognitionConfig {
  const requested=env.CASE_RECOGNITION_MODE||'off',strict=env.STRICT_VERIFIED_EVIDENCE_ENABLED==='1';
  const invalid=!['off','shadow','on'].includes(requested)||(requested==='on'&&!strict);
  return {mode:invalid?'off':requested as RecognitionConfig['mode'],strict,invalid};
}
export interface RecognitionEntry {
  case_id:string;source_hash:string;phrase_ids:string[];intent_ids:string[];
  links:Array<{ref_id:string;card_hash:string}>;
  review:{reviewer:string;reviewed_at:string;proposal_hash:string};
}
export interface RecognitionIndex {schema:string;version:string;corpus_hash:string;entries:RecognitionEntry[]}
export interface UnderstandingPacket {
  schema:'taxhkd-recognition-v1';recognition_version:string;
  status:'MATCHED'|'ABSTAIN'|'DISABLED'|'ERROR';
  matched_case_ids:string[];inferred_intents:string[];
  suggested_verified_card_ids:string[];expansion_terms:string[];
}
export interface RecognitionResult {
  packet:UnderstandingPacket;cache_hit:boolean;duration_ms:number;
  matches:Array<{case_id:string;score:number}>;reason?:string;
}
export const phraseCatalog=Object.fromEntries(Object.entries(vocabulary).flatMap(([group,row])=>
  row.phrases.map((phrase,i)=>[`${group}:${i}`,{phrase,intent:row.intent}])));
const phraseIdsByText=new Map(Object.entries(phraseCatalog).map(([id,p])=>[p.phrase,id]));
const allowedIntents=new Set(Object.values(phraseCatalog).map(p=>p.intent));
export function expansionPhraseIds(packet:UnderstandingPacket):string[]{return packet.expansion_terms.map(p=>phraseIdsByText.get(p)!).filter(Boolean);}
export async function sha256(text:string):Promise<string>{
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
const STOP=new Set('la va cua cho co khong cac mot khi thi voi toi minh ban duoc phai'.split(' '));
function terms(text:string):string[]{
  const all=foldText(text).split(' ').filter(Boolean),out=all.filter(t=>!STOP.has(t));
  for(let i=0;i+1<all.length;i++)if(!STOP.has(all[i])||!STOP.has(all[i+1]))out.push(all[i]+'_'+all[i+1]);
  return out;
}
export function emptyPacket(version:string,status:UnderstandingPacket['status']='ABSTAIN'):UnderstandingPacket {
  return {schema:'taxhkd-recognition-v1',recognition_version:version,status,matched_case_ids:[],inferred_intents:[],suggested_verified_card_ids:[],expansion_terms:[]};
}
/** Closed packet schema: arbitrary case prose cannot become query expansion. */
export function validPacket(value:unknown,version:string):value is UnderstandingPacket {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const p=value as UnderstandingPacket,keys=Object.keys(emptyPacket(version));
  if(Object.keys(p).length!==keys.length||Object.keys(p).some(k=>!keys.includes(k)))return false;
  if(p.schema!=='taxhkd-recognition-v1'||p.recognition_version!==version||!['MATCHED','ABSTAIN','DISABLED','ERROR'].includes(p.status))return false;
  const fields=[['matched_case_ids',5],['inferred_intents',3],['suggested_verified_card_ids',8],['expansion_terms',8]] as const;
  if(fields.some(([k,max])=>!Array.isArray(p[k])||p[k].length>max||p[k].some(x=>typeof x!=='string')||new Set(p[k]).size!==p[k].length))return false;
  return p.inferred_intents.every(x=>allowedIntents.has(x))&&p.expansion_terms.every(x=>phraseIdsByText.has(x)&&!/[\d%]|https?:\/\//i.test(x))&&
    p.suggested_verified_card_ids.every(x=>/^16\.\d+$/.test(x)&&!isBlockedVerifiedRef(x))&&
    (p.status==='MATCHED'?p.matched_case_ids.length>0:fields.every(([k])=>!p[k].length));
}

/** Dependency injection is for tests; production uses the compiled, reviewed index only. */
export function createRecognizer(data:RecognitionIndex,cards=CANONICAL_CHUNKS){
  let prepared:Promise<Array<{entry:RecognitionEntry;tf:Map<string,number>;len:number}>>|undefined;
  const cache=new Map<string,{at:number;result:RecognitionResult}>();
  const cardMap=new Map(cards.filter(c=>['VERIFIED','VERIFIED_CONDITIONAL'].includes(c.tier)).map(c=>[c.ref_id||c.id,c]));
  const prepare=()=>prepared||=(async()=>{
    if(data.schema!=='taxhkd-recognition-index-v1'||!data.version||!Array.isArray(data.entries))throw Error('INVALID_INDEX');
    const hashes=new Map(await Promise.all([...cardMap].map(async([id,c])=>[id,await sha256(c.text)] as const)));
    const seen=new Set<string>();
    return data.entries.map(entry=>{
      if(seen.has(entry.case_id)||!/^KB\/(?:0[1-9]|1[01])-[^#]+#.+$/.test(entry.case_id)||
        !/^[a-f0-9]{64}$/.test(entry.source_hash)||!entry.review?.reviewer?.trim()||
        !Number.isFinite(Date.parse(entry.review.reviewed_at))||!/^[a-f0-9]{64}$/.test(entry.review.proposal_hash)||
        !entry.phrase_ids.length||entry.phrase_ids.some(id=>!phraseCatalog[id]||/[\d%]|https?:\/\//i.test(phraseCatalog[id].phrase))||
        entry.intent_ids.some(id=>!allowedIntents.has(id)))throw Error('UNREVIEWED_OR_INVALID_ENTRY');
      seen.add(entry.case_id);
      // One stale binding quarantines this descriptor, including expansion terms.
      if(entry.links.some(l=>isBlockedVerifiedRef(l.ref_id)||hashes.get(l.ref_id)!==l.card_hash))return null;
      const toks=terms(entry.phrase_ids.map(id=>phraseCatalog[id].phrase).join(' ')),tf=new Map<string,number>();
      toks.forEach(t=>tf.set(t,(tf.get(t)||0)+1));
      return {entry,tf,len:toks.length};
    }).filter((r):r is NonNullable<typeof r>=>r!==null);
  })();
  return {
    version:data.version,
    async recognize(query:string,contextKey:string,enabled=true):Promise<RecognitionResult>{
      const start=performance.now();
      const result=(status:UnderstandingPacket['status'],reason?:string):RecognitionResult=>({packet:emptyPacket(data.version,status),cache_hit:false,duration_ms:performance.now()-start,matches:[],...(reason?{reason}:{})});
      if(!enabled)return result('DISABLED');
      if(!data.entries.length)return result('ABSTAIN','NO_APPROVED_DESCRIPTORS');
      try{
        // Keep numbers, negation and history; never cache by a lossy template.
        const key=await sha256(JSON.stringify([data.version,query.normalize('NFC').trim(),contextKey]));
        const cached=cache.get(key);
        if(cached&&Date.now()-cached.at<300000){cache.delete(key);cache.set(key,cached);return {...structuredClone(cached.result),cache_hit:true,duration_ms:performance.now()-start};}
        const rows=await prepare(),q=[...new Set(terms(query))],df=new Map<string,number>();
        rows.forEach(r=>r.tf.forEach((_,t)=>df.set(t,(df.get(t)||0)+1)));
        const avg=rows.reduce((s,r)=>s+r.len,0)/Math.max(rows.length,1);
        const scored=rows.map(r=>{
          let score=0,matched=0;
          for(const t of q){const f=r.tf.get(t)||0;if(!f)continue;matched++;
            score+=Math.log(1+(rows.length-(df.get(t)||0)+.5)/((df.get(t)||0)+.5))*f*2.4/(f+1.4*(.25+.75*r.len/avg));}
          return {r,score,matched};
        }).filter(x=>x.matched>=2&&x.score>=1).sort((a,b)=>b.score-a.score||a.r.entry.case_id.localeCompare(b.r.entry.case_id));
        const top=scored[0]?.score||0;
        const selected=scored.filter(s=>s.score>=top*.65).slice(0,5);
        if(performance.now()-start>20)return result('ABSTAIN','RECOGNITION_BUDGET');
        if(!selected.length)return result('ABSTAIN','LOW_SIMILARITY');
        const entries=selected.map(s=>s.r.entry);
        const packet:UnderstandingPacket={...emptyPacket(data.version,'MATCHED'),
          matched_case_ids:entries.map(e=>e.case_id),
          inferred_intents:[...new Set(entries.flatMap(e=>e.intent_ids))].slice(0,3),
          suggested_verified_card_ids:[...new Set(entries.flatMap(e=>e.links.map(l=>l.ref_id)))].slice(0,8),
          expansion_terms:[...new Set(entries.flatMap(e=>e.phrase_ids.map(id=>phraseCatalog[id].phrase)))].slice(0,8)};
        if(!validPacket(packet,data.version))return result('ERROR','INVALID_PACKET');
        const value:RecognitionResult={packet,cache_hit:false,duration_ms:performance.now()-start,matches:selected.map(s=>({case_id:s.r.entry.case_id,score:s.score}))};
        if(cache.size>=256)cache.delete(cache.keys().next().value!);
        cache.set(key,{at:Date.now(),result:structuredClone(value)});return value;
      }catch{return result('ERROR','INVALID_RECOGNITION_INDEX');}
    }
  };
}
export const caseRecognizer=createRecognizer(indexData as RecognitionIndex);
