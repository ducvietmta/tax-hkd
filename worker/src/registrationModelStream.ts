/** Meta Responses SSE -> answer text only. Reasoning and tool events never reach UI. */
function responseText(response: any): string {
  return (response?.output || []).filter((item: any) => item.type === 'message')
    .flatMap((item: any) => item.content || []).filter((part: any) => part.type === 'output_text')
    .map((part: any) => typeof part.text === 'string' ? part.text : '').join('').trim();
}

export async function readRegistrationModelStream(response: Response, onDelta: (delta: string) => void): Promise<string> {
  if (!response.ok) throw new Error(`MODEL_HTTP_${response.status}`);
  if (!response.body) throw new Error('MODEL_EMPTY_STREAM');
  if (response.headers.get('content-type')?.includes('application/json')) {
    const json: any = await response.json();
    const text = responseText(json);
    if (json.status !== 'completed' || !text || text.length > 16000) throw new Error('MODEL_INCOMPLETE');
    onDelta(text); return text;
  }
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = '', data: string[] = [], text = '', finalText = '', completed = false;
  const dispatch = () => {
    if (!data.length || completed) { data = []; return; }
    const raw = data.join('\n'); data = [];
    if (raw.trim() === '[DONE]') {
      if (!completed) throw new Error('MODEL_MISSING_COMPLETION');
      return;
    }
    const event = JSON.parse(raw);
    if (event.type === 'error' || event.type === 'response.failed' || event.type === 'response.incomplete') throw new Error('MODEL_FAILED');
    if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
      if (text.length + event.delta.length > 16000) throw new Error('MODEL_OUTPUT_LIMIT');
      text += event.delta;
      if (event.delta) onDelta(event.delta);
    }
    if (event.type === 'response.completed') {
      if (event.response?.status !== 'completed') throw new Error('MODEL_INCOMPLETE');
      finalText = responseText(event.response) || text.trim();
      if (!finalText || finalText.length > 16000) throw new Error('MODEL_EMPTY');
      completed = true;
    }
  };
  const line = (raw: string) => {
    const value = raw.replace(/\r$/, '');
    if (!value) dispatch();
    else if (value.startsWith('data:')) data.push(value.slice(5).replace(/^ /, ''));
  };
  try {
    while (!completed) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      if (buffer.length > 131072) throw new Error('MODEL_EVENT_LIMIT');
      const lines = buffer.split('\n'); buffer = lines.pop() || '';
      for (const part of lines) { line(part); if (completed) break; }
      if (done) { if (buffer) line(buffer); dispatch(); break; }
    }
    if (!completed) throw new Error('MODEL_MISSING_COMPLETION');
    return finalText;
  } finally {
    try { await reader.cancel(); } catch { /* connection already closed */ }
    reader.releaseLock();
  }
}
