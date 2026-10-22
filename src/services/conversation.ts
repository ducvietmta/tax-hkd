export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

import { completeHistory } from '../../shared/conversationHistory';
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
      content: message.text.trim(),
    }));

  return completeHistory(turns);
}
