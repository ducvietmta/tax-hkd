export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export { completeHistory as normalizeConversationHistory } from '../../shared/conversationHistory';

export function isContextualFollowUp(message: string): boolean {
  const f = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  return f.length < 160 && !/\b(cau hoi moi|chuyen chu de|hoi viec khac)\b/.test(f) &&
    /^(con\b|vay\b|the\b|neu\b|dung\b|vang\b|doi\b|giu\b|nam\b|ky\b|\d|doanh thu\b|thu nhap\b|em (co|chua|da)\b|toi (co|chua|da)\b)/.test(f);
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
