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
  const base = [...relevantTurns, message].join(' ').slice(0, 2400);
  // Mặc định xét theo năm hiện tại khi câu hỏi không nêu năm (kể cả "năm ngoái/năm nay"):
  // giúp bộ lọc năm trong retrieve() ưu tiên chunk của năm hiện hành thay vì lẫn quy định năm cũ.
  const hasYear = /\b(19|20)\d{2}\b/.test(base) || /(n\u0103m|nam)\s+(ngo\u00e1i|ngoai|tr\u01b0\u1edbc|truoc|nay)/i.test(base);
  if (!hasYear) {
    return `${base} ${new Date().getFullYear()}`;
  }
  return base;
}
