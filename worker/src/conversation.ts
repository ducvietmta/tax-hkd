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

export function isContextualFollowUp(message: string): boolean {
  const f = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  return f.length < 160 && !/\b(cau hoi moi|chuyen chu de|hoi viec khac)\b/.test(f) &&
    /^(con\b|vay\b|the\b|neu\b|dung\b|vang\b|nam\b|ky\b|\d|doanh thu\b|thu nhap\b|em (co|chua|da)\b|toi (co|chua|da)\b)/.test(f);
}

/** Retrieve the active topic; preserve short follow-ups without mixing unrelated questions. */
export function buildConversationRetrievalQuery(history: ConversationTurn[], message: string, periodYears?: number[]): string {
  const userTurns = history.filter((turn) => turn.role === 'user').map((turn) => turn.content);
  const relevantTurns: string[] = [];
  if (isContextualFollowUp(message)) {
    for (const turn of userTurns.slice().reverse()) {
      relevantTurns.unshift(turn);
      if (!isContextualFollowUp(turn) || relevantTurns.length >= 4) break;
    }
  }
  // Reserve space for the current request; long histories used to truncate it entirely.
  const current = message.slice(0, 1600);
  const context = relevantTurns.map(turn => {
    const scoped = periodYears === undefined ? turn : turn.replace(/\b(?:19|20)\d{2}\b/g, year =>
      periodYears.includes(Number(year)) ? year : '');
    return scoped.slice(0, 200);
  });
  return [current, ...context].join(' ');
}
