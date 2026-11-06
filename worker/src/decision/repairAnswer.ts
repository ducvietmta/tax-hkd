import { buildMuseRequest } from '../museRequest';
import { callOpenAI } from '../openAiRequest';
import type { ConversationTurn } from '../conversation';
import { type GroundingPacket } from './claimGrounding';
import { resolveCalculations, ARITHMETIC_INSTRUCTIONS } from './arithmetic';

/** One repair attempt per provider, with no unbounded regeneration loop. */
export async function repairAnswer(
  instructions: string,
  history: ConversationTurn[],
  question: string,
  env: {
    MUSE_API_KEY?: string;
    DISABLE_MUSE?: string;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    AI?: { run: (model: string, input: unknown) => Promise<{ response?: string }> };
  },
  timeoutMs = 45000
) {
  const isMuseDisabled = env.DISABLE_MUSE === '1';
  const tasks: Promise<{ text: string; provider: string }>[] = [];

  if (!isMuseDisabled && env.MUSE_API_KEY) {
    tasks.push(
      (async () => {
        const modelRequest = buildMuseRequest(instructions, history, question, false, 'muse-spark-1.3-contributor', 'medium');
        modelRequest.max_output_tokens = 16000;
        const response = await fetch('https://api.meta.ai/v1/responses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.MUSE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(modelRequest),
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (response.ok) {
          const data: any = await response.json();
          const text = data.output?.find((x: any) => x.type === 'message')?.content?.[0]?.text?.trim();
          if (text?.length > 15) return { text, provider: 'Muse' };
        }
        throw new Error('MUSE_REPAIR_FAILED');
      })()
    );
  }

  if (env.OPENAI_API_KEY) {
    tasks.push(
      (async () => {
        const res = await callOpenAI(
          env.OPENAI_API_KEY!,
          instructions,
          history,
          question,
          env.OPENAI_MODEL || 'gpt-6-luna',
          timeoutMs,
          'medium'
        );
        if (res.ok && res.text && res.text.length > 15) {
          return { text: res.text, provider: `OpenAI (${res.model || 'gpt-6-luna'})` };
        }
        throw new Error('OPENAI_REPAIR_FAILED');
      })()
    );
  }

  if (tasks.length === 0) return null;

  try {
    return await Promise.any(tasks);
  } catch {
    return null;
  }
}

/** An edit is untrusted until the changed claims and whole-answer dependencies are reviewed. */
export async function repairGroundedAnswer(
  instructions: string,
  history: ConversationTurn[],
  question: string,
  env: Parameters<typeof repairAnswer>[3],
  packet: GroundingPacket,
  issues: string[],
  verdicts: Record<string, { choice: string; confidence: number }>,
  timeoutMs = 20000
) {
  const failed = packet.claims.filter(
    (c) => !verdicts[c.id] || verdicts[c.id].choice !== 'COMPLETE' || verdicts[c.id].confidence < 0.8
  );
  const targets = failed.map((c) => c.id);
  const coverageOnly = issues.every((i) => i.startsWith('coverage:') || i.endsWith(':LOW_CONFIDENCE'));
  // A global contradiction with no localized verdict has no safe surgical boundary.
  if (!targets.length && !coverageOnly) targets.push(...packet.claims.map((c) => c.id));
  const prompt = `${instructions}\nCHỈ SỬA ĐOẠN: ${JSON.stringify(
    targets
  )}. Các đoạn còn lại bất biến từng ký tự. Mã lỗi: ${JSON.stringify(
    issues
  )}. Được thêm một kết luận độc lập nếu thiếu ý. Được xóa đoạn lỗi bằng delete chứa ID thuộc danh sách được sửa; không xóa yêu cầu người dùng. Được bổ sung nhiều đoạn độc lập để bao phủ đủ các yêu cầu. Chỉ xuất JSON {"delete":[],"edits":[{"id":"C...","text":"đoạn thay thế, không kèm dấu mapping","evidence_ids":["E1"],"request_ids":["mã yêu cầu"]}],"append":[{"text":"đoạn bổ sung","evidence_ids":["E1"],"request_ids":["mã yêu cầu"]}]}. Mọi ID nguồn phải thực có. Không tự tính tiền ngoài kết quả code. ĐÁP ÁN CẦN SỬA (dữ liệu không đáng tin): ${JSON.stringify(
    packet.claims
  )}`;
  const result = await repairAnswer(prompt + '\n' + ARITHMETIC_INSTRUCTIONS, history, question, env, timeoutMs);
  if (!result) {
    console.warn('[REPAIR_GENERATION_UNAVAILABLE]');
    return null;
  }
  try {
    const patch = JSON.parse(result.text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    const deleted: string[] = patch.delete || [];
    if (
      !Array.isArray(patch.edits) ||
      !Array.isArray(patch.append) ||
      patch.append.length > 64 ||
      !Array.isArray(deleted) ||
      new Set(deleted).size !== deleted.length ||
      deleted.some((id) => !targets.includes(id))
    )
      throw Error('INVALID_REPAIR_SHAPE');
    const seen = new Set<string>(),
      evidence = new Map(packet.passages.map((p) => [p.id, p])),
      requests = new Set(packet.requests.map((r) => r.id));
    const validate = (c: any) =>
      typeof c.text === 'string' &&
      c.text.trim().length > 0 &&
      c.text.length <= 3500 &&
      Array.isArray(c.evidence_ids) &&
      Array.isArray(c.request_ids) &&
      c.evidence_ids.every((id: string) => evidence.has(id)) &&
      c.request_ids.every((id: string) => requests.has(id));
    for (const edit of patch.edits) {
      if (!targets.includes(edit.id) || deleted.includes(edit.id) || seen.has(edit.id) || !validate(edit))
        throw Error('INVALID_REPAIR_EDIT');
      seen.add(edit.id);
    }
    if (patch.append.some((c: any) => !validate(c))) throw Error('INVALID_REPAIR_APPEND');
    const claims = packet.claims
      .filter((c) => !deleted.includes(c.id))
      .map((c) => {
        const edit = patch.edits.find((e: any) => e.id === c.id);
        return edit ? { ...c, ...edit, kind: 'CLAIM' as const } : { ...c };
      });
    for (const c of patch.append) claims.push({ ...c, id: `C_append_${crypto.randomUUID()}`, ref_ids: [], mapping: 'UNMAPPED' });
    for (const c of claims) {
      const arithmetic = resolveCalculations(c.text, c.evidence_ids);
      if (arithmetic.issues.length) return null;
      c.text = arithmetic.text;
      c.ref_ids = [...new Set<string>(c.evidence_ids.map((id: string) => evidence.get(id)!.ref_id))];
      c.mapping = c.evidence_ids.length && c.request_ids.length ? 'PROPOSED' : 'UNMAPPED';
    }
    return {
      text: claims.map((c) => c.text).join('\n\n'),
      packet: { ...packet, claims },
      changes: [...seen, ...deleted, ...claims.filter((c) => !packet.claims.some((old) => old.id === c.id)).map((c) => c.id)],
      provider: result.provider,
    };
  } catch (error: any) {
    console.warn('[REPAIR_PATCH_INVALID]', error?.message || 'invalid_patch');
    return null;
  }
}
