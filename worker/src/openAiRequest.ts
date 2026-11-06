import type { ConversationTurn } from './conversation';

export interface OpenAIResponse {
  ok: boolean;
  text?: string;
  model?: string;
  usage?: unknown;
  error?: string;
}

export function normalizeOpenAIModel(rawModel?: string): string {
  if (!rawModel) return 'gpt-6.1-terra';
  const trimmed = rawModel.trim();
  if (/^gpt-?6\.1-terra$/i.test(trimmed) || /^6\.1[- ]terra$/i.test(trimmed)) return 'gpt-6.1-terra';
  if (/^gpt-?5\.6-terra$/i.test(trimmed) || /^5\.6[- ]terra$/i.test(trimmed)) return 'gpt-5.6-terra';
  if (/^gpt-?6(\.0)?-luna$/i.test(trimmed) || /^6(\.0)?[- ]luna$/i.test(trimmed)) return 'gpt-6-luna';
  if (/^gpt-?5\.6-luna$/i.test(trimmed) || /^5\.6[- ]luna$/i.test(trimmed)) return 'gpt-5.6-luna';
  return trimmed;
}

export function isReasoningModel(model: string): boolean {
  const m = model.toLowerCase();
  return m.startsWith('gpt-6') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4');
}

export function buildOpenAIRequest(
  systemPrompt: string,
  history: ConversationTurn[],
  message: string,
  rawModel = 'gpt-6.1-terra',
  maxTokens = 8192,
  temperature?: number,
  reasoningEffort = 'low'
) {
  const model = normalizeOpenAIModel(rawModel);
  const reasoning = isReasoningModel(model);

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...history.map((turn) => ({
      role: (turn.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: turn.content,
    })),
    { role: 'user', content: message },
  ];

  const payload: Record<string, unknown> = {
    model,
    messages,
    max_completion_tokens: maxTokens,
  };

  if (reasoning) {
    payload.reasoning_effort = reasoningEffort;
  } else if (temperature !== undefined) {
    payload.temperature = temperature;
  }

  return payload;
}

export async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  history: ConversationTurn[],
  message: string,
  model = 'gpt-6.1-terra',
  timeoutMs = 50000,
  reasoningEffort = 'low'
): Promise<OpenAIResponse> {
  try {
    const payload = buildOpenAIRequest(systemPrompt, history, message, model, 8192, undefined, reasoningEffort);
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = (await res.text()).slice(0, 300);
      return { ok: false, error: `HTTP_${res.status}: ${errText}` };
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { ok: false, error: 'EMPTY_OUTPUT' };
    }

    return {
      ok: true,
      text: content,
      model: data.model || model,
      usage: data.usage,
    };
  } catch (err: any) {
    const name = err?.name || 'Error';
    return { ok: false, error: name === 'TimeoutError' || name === 'AbortError' ? 'TIMEOUT' : (err?.message || 'REQUEST_FAILED') };
  }
}

/** Streaming SSE support for real-time token delivery */
export async function callOpenAIStream(
  apiKey: string,
  systemPrompt: string,
  history: ConversationTurn[],
  message: string,
  model = 'gpt-6.1-terra',
  onDelta?: (delta: string) => void,
  timeoutMs = 60000,
  reasoningEffort = 'low',
  onReasoningSummary?: (delta: string) => void,
): Promise<OpenAIResponse> {
  if (onReasoningSummary && isReasoningModel(normalizeOpenAIModel(model))) {
    return callOpenAIResponsesSummaryStream(apiKey, systemPrompt, history, message, model, onDelta, timeoutMs, reasoningEffort, onReasoningSummary);
  }
  try {
    const payload = {
      ...buildOpenAIRequest(systemPrompt, history, message, model, 8192, undefined, reasoningEffort),
      stream: true,
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = (await res.text()).slice(0, 300);
      return { ok: false, error: `HTTP_${res.status}: ${errText}` };
    }

    if (!res.body) {
      return { ok: false, error: 'NO_RESPONSE_BODY' };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              onDelta?.(delta);
            }
          } catch {}
        }
      }
    }

    if (buffer.trim().startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
      try {
        const json = JSON.parse(buffer.trim().slice(6));
        const delta = json.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          onDelta?.(delta);
        }
      } catch {}
    }

    return {
      ok: true,
      text: fullText.trim(),
      model: normalizeOpenAIModel(model),
    };
  } catch (err: any) {
    const name = err?.name || 'Error';
    return { ok: false, error: name === 'TimeoutError' || name === 'AbortError' ? 'TIMEOUT' : (err?.message || 'REQUEST_FAILED') };
  }
}

/** Only the public summary event is forwarded. Raw reasoning and drafts stay private. */
async function callOpenAIResponsesSummaryStream(
  apiKey: string, systemPrompt: string, history: ConversationTurn[], message: string,
  rawModel: string, onDelta: ((delta: string) => void) | undefined, timeoutMs: number,
  reasoningEffort: string, onSummary: (delta: string) => void,
): Promise<OpenAIResponse> {
  const model = normalizeOpenAIModel(rawModel);
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({
        model, instructions: systemPrompt,
        input: [...history.map(turn => ({ role: turn.role === 'assistant' ? 'assistant' : 'user', content: turn.content })), { role: 'user', content: message }],
        reasoning: { effort: reasoningEffort, summary: 'auto' },
        max_output_tokens: 8192, stream: true, store: false,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { ok: false, error: `HTTP_${res.status}` };
    if (!res.body) return { ok: false, error: 'NO_RESPONSE_BODY' };
    const reader = res.body.getReader(), decoder = new TextDecoder();
    let buffer = '', data: string[] = [], text = '', completed = false, summaryLength = 0;
    let returnedModel = model, usage: unknown;
    const summaryParts = new Set<string>();
    const summary = (delta: string) => {
      const bounded = delta.slice(0, Math.max(0, 12000 - summaryLength));
      summaryLength += bounded.length;
      if (bounded) onSummary(bounded);
    };
    const dispatch = () => {
      if (!data.length) return;
      const raw = data.join('\n'); data = [];
      if (raw === '[DONE]') return;
      const event = JSON.parse(raw);
      if (event.type === 'error' || event.type === 'response.failed' || event.type === 'response.incomplete') throw new Error('OPENAI_RESPONSE_INCOMPLETE');
      if (event.type === 'response.reasoning_summary_text.delta' && typeof event.delta === 'string') {
        const key = `${event.item_id}:${event.summary_index}`;
        if (!summaryParts.has(key) && summaryParts.size) summary('\n\n');
        summaryParts.add(key); summary(event.delta);
      } else if (event.type === 'response.reasoning_summary_text.done' && typeof event.text === 'string') {
        const key = `${event.item_id}:${event.summary_index}`;
        if (!summaryParts.has(key)) {
          if (summaryParts.size) summary('\n\n');
          summaryParts.add(key); summary(event.text);
        }
      } else if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
        text += event.delta;
        onDelta?.(event.delta);
      } else if (event.type === 'response.completed') {
        if (event.response?.status && event.response.status !== 'completed') throw new Error('OPENAI_RESPONSE_INCOMPLETE');
        const finalText = (event.response?.output || []).filter((item: any) => item.type === 'message')
          .flatMap((item: any) => item.content || []).filter((part: any) => part.type === 'output_text' && typeof part.text === 'string')
          .map((part: any) => part.text).join('\n');
        if (finalText) text = finalText;
        returnedModel = event.response?.model || model; usage = event.response?.usage;
        completed = true;
      }
    };
    const line = (value: string) => {
      value = value.replace(/\r$/, '');
      if (!value) dispatch();
      else if (value.startsWith('data:')) data.push(value.slice(5).replace(/^ /, ''));
    };
    try {
      while (!completed) {
        const { done, value } = await reader.read();
        buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
        if (buffer.length > 1048576) throw new Error('OPENAI_STREAM_LIMIT');
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const value of lines) { line(value); if (completed) break; }
        if (done) { if (buffer) line(buffer); dispatch(); break; }
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    if (!completed) return { ok: false, error: 'OPENAI_STREAM_INCOMPLETE' };
    if (!text.trim()) return { ok: false, error: 'EMPTY_OUTPUT' };
    return { ok: true, text: text.trim(), model: returnedModel, usage };
  } catch (error: any) {
    return { ok: false, error: ['TimeoutError', 'AbortError'].includes(error?.name) ? 'TIMEOUT' : 'OPENAI_STREAM_FAILED' };
  }
}
