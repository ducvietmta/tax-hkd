export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export function normalizeConversationHistory(input: unknown): ConversationTurn[] {
  if (!Array.isArray(input)) return [];
  const turns = input
    .filter((turn): turn is ConversationTurn =>
      turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string'
    )
    .map((turn) => ({ role: turn.role, content: turn.content.trim().slice(0, 1000) }))
    .filter((turn) => turn.content);
  return turns.length <= 20 ? turns : [...turns.slice(0, 2), ...turns.slice(-18)];
}

/** Retrieval needs the original topic as well as the latest facts supplied by the user. */
export function buildConversationRetrievalQuery(history: ConversationTurn[], message: string): string {
  const userTurns = history.filter((turn) => turn.role === 'user').map((turn) => turn.content);
  const relevantTurns = userTurns.length > 4
    ? [userTurns[0], ...userTurns.slice(-4)]
    : userTurns;
  return [...relevantTurns, message].join(' ').slice(0, 2400);
}
