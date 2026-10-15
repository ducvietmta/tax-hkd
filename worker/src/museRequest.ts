import type { ConversationTurn } from './conversation';

/** Keep instructions separate from user content and replay turns with their real roles. */
export function buildMuseRequest(
  instructions: string,
  history: ConversationTurn[],
  message: string,
  stream: boolean,
  model = 'muse-spark-1.2-contributor',
) {
  return {
    model,
    instructions,
    input: [
      ...history.map((turn) => ({
        role: turn.role,
        content: [{
          type: turn.role === 'assistant' ? 'output_text' : 'input_text',
          text: turn.content,
        }],
      })),
      { role: 'user', content: [{ type: 'input_text', text: message }] },
    ],
    reasoning: stream ? { effort: 'high', summary: 'concise' } : { effort: 'high' },
    // This covers internal reasoning and the visible answer. Muse recommends
    // keeping temperature at its default rather than lowering it.
    max_output_tokens: 8192,
    stream,
  };
}
