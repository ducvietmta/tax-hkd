export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface ContextMessage {
  sender: 'user' | 'ai';
  text: string;
  contextual?: boolean;
}

/** Keep the original question and the newest turns when a conversation grows long. */
export function selectConversationHistory(messages: ContextMessage[]): ConversationTurn[] {
  const turns = messages
    .filter((message) => message.contextual && message.text.trim())
    .map((message) => ({
      role: message.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: message.text.trim().slice(0, 1000),
    }));

  return turns.length <= 20 ? turns : [...turns.slice(0, 2), ...turns.slice(-18)];
}
