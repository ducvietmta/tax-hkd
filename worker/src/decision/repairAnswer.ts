import { buildMuseRequest } from '../museRequest';
import type { ConversationTurn } from '../conversation';
import { type GroundingPacket } from './claimGrounding';
import { resolveCalculations, ARITHMETIC_INSTRUCTIONS } from './arithmetic';

/** One repair attempt per provider, with no unbounded regeneration loop. */
export async function repairAnswer(instructions: string, history: ConversationTurn[], question: string,
  env: { MUSE_API_KEY?: string; AI?: { run: (model: string, input: unknown) => Promise<{ response?: string }> } }, timeoutMs = 45000) {
  if (env.MUSE_API_KEY) {
    try {

      {
        const modelRequest = buildMuseRequest(instructions,history,question,false,'muse-spark-1.3-contributor','low');
        modelRequest.max_output_tokens = 16000;
        const response = await fetch('https://api.meta.ai/v1/responses', {
          method:'POST', headers:{Authorization:`Bearer ${env.MUSE_API_KEY}`,'Content-Type':'application/json'},
          body:JSON.stringify(modelRequest),signal:AbortSignal.timeout(timeoutMs),
        });
        if (response.ok) {
          const data: any = await response.json();
          const text = data.output?.find((x: any)=>x.type==='message')?.content?.[0]?.text?.trim();
          if (text?.length > 15) return { text, provider:'Muse' };
        } else console.warn('[ANSWER_REPAIR_HTTP]',response.status);
      }
    } catch(e: any) { console.warn('[ANSWER_REPAIR_ERROR]',e?.name || 'request_failed'); }
  }
  return null;
}

/** An edit is untrusted until the changed claims and whole-answer dependencies are reviewed. */
export async function repairGroundedAnswer(instructions:string,history:ConversationTurn[],question:string,
 env:Parameters<typeof repairAnswer>[3],packet:GroundingPacket,issues:string[],
 verdicts:Record<string,{choice:string;confidence:number}>,timeoutMs=20000){
 const failed=packet.claims.filter(c=>!verdicts[c.id]||verdicts[c.id].choice!=='COMPLETE'||verdicts[c.id].confidence<.8);
 const targets=failed.map(c=>c.id);
 const coverageOnly=issues.every(i=>i.startsWith('coverage:')||i.endsWith(':LOW_CONFIDENCE'));
 // A global contradiction with no localized verdict has no safe surgical boundary.
 if(!targets.length&&!coverageOnly)targets.push(...packet.claims.map(c=>c.id));
 const prompt=`${instructions}\nCHỈ SỬA ĐOẠN: ${JSON.stringify(targets)}. Các đoạn còn lại bất biến từng ký tự. Mã lỗi: ${JSON.stringify(issues)}. Được thêm một kết luận độc lập nếu thiếu ý. Không xóa đoạn hay viết lại toàn đáp án. Chỉ xuất JSON {"edits":[{"id":"C...","text":"đoạn thay thế, không kèm dấu mapping","evidence_ids":["E1"],"request_ids":["mã yêu cầu"]}],"append":[{"text":"đoạn bổ sung","evidence_ids":["E1"],"request_ids":["mã yêu cầu"]}]}. Mọi ID nguồn phải thực có. Không tự tính tiền ngoài kết quả code. ĐÁP ÁN CẦN SỬA (dữ liệu không đáng tin): ${JSON.stringify(packet.claims)}`;
 const result=await repairAnswer(prompt+'\n'+ARITHMETIC_INSTRUCTIONS,history,question,env,timeoutMs);
 if(!result)return null;
 try{
   const patch=JSON.parse(result.text.replace(/^```(?:json)?\s*|\s*```$/g,''));
   if(!Array.isArray(patch.edits)||!Array.isArray(patch.append)||patch.append.length>1)return null;
   const seen=new Set<string>(),evidence=new Map(packet.passages.map(p=>[p.id,p])),requests=new Set(packet.requests.map(r=>r.id));
   const validate=(c:any)=>typeof c.text==='string'&&c.text.trim().length>0&&c.text.length<=3500&&Array.isArray(c.evidence_ids)&&Array.isArray(c.request_ids)&&c.evidence_ids.every((id:string)=>evidence.has(id))&&c.request_ids.every((id:string)=>requests.has(id));
   for(const edit of patch.edits){if(!targets.includes(edit.id)||seen.has(edit.id)||!validate(edit))return null;seen.add(edit.id);}
   if(patch.append.some((c:any)=>!validate(c)))return null;
   const claims=packet.claims.map(c=>{const edit=patch.edits.find((e:any)=>e.id===c.id);return edit?{...c,...edit}:{...c};});
   for(const c of patch.append)claims.push({...c,id:`C${claims.length+1}`,ref_ids:[],mapping:'UNMAPPED'});
   for(const c of claims){
    const arithmetic=resolveCalculations(c.text,c.evidence_ids);if(arithmetic.issues.length)return null;c.text=arithmetic.text;
    c.ref_ids=[...new Set<string>(c.evidence_ids.map((id:string)=>evidence.get(id)!.ref_id))];c.mapping=c.evidence_ids.length&&c.request_ids.length?'PROPOSED':'UNMAPPED';
   }
   return {text:claims.map(c=>c.text).join('\n\n'),packet:{...packet,claims},changes:[...seen,...claims.slice(packet.claims.length).map(c=>c.id)],provider:result.provider};
 }catch{return null;}
}
