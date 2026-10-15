import type { ConversationTurn } from './conversation';

/** Keep instructions separate from user content and replay turns with their real roles. */
export function buildMuseRequest(
  instructions: string,
  history: ConversationTurn[],
  message: string,
  stream: boolean,
  model = 'muse-spark-1.3-contributor',
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
    reasoning: stream ? { effort: 'high', summary: 'concise' } : { effort: 'medium' },
    max_output_tokens: 32000,
    stream,
  };
}
