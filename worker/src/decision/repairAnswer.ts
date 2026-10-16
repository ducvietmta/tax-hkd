import { buildMuseRequest } from '../museRequest';
import type { ConversationTurn } from '../conversation';

/** One repair attempt per provider, with no unbounded regeneration loop. */
export async function repairAnswer(instructions: string, history: ConversationTurn[], question: string,
  env: { MUSE_API_KEY?: string; AI?: { run: (model: string, input: unknown) => Promise<{ response?: string }> } }) {
  if (env.MUSE_API_KEY) {
    try {
      const response = await fetch('https://api.meta.ai/v1/responses', {
        method:'POST', headers:{Authorization:`Bearer ${env.MUSE_API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify(buildMuseRequest(instructions,history,question,false,'muse-spark-1.3-contributor','high')),signal:AbortSignal.timeout(45000),
      });
      if (response.ok) {
        const data: any = await response.json();
        const text = data.output?.find((x: any)=>x.type==='message')?.content?.[0]?.text?.trim();
        if (text?.length > 15) return { text, provider:'Muse' };
      } else console.warn('[ANSWER_REPAIR_HTTP]',response.status);
    } catch(e: any) { console.warn('[ANSWER_REPAIR_ERROR]',e?.name || 'request_failed'); }
  }
  return null;
}
