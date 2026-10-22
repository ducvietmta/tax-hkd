/** Preserve complete turns. Reject oversized context rather than changing facts. */
export interface HistoryTurn { role: 'user' | 'assistant'; content: string }
export const MAX_HISTORY_CHARACTERS = 60000;
export function completeHistory(input: unknown): HistoryTurn[] {
  if (!Array.isArray(input)) return [];
  const turns = input.filter((t): t is HistoryTurn => !!t &&
    (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
    .map(t => ({ role: t.role, content: t.content.trim() })).filter(t => t.content);
  if (turns.reduce((n,t)=>n+t.content.length,0)>MAX_HISTORY_CHARACTERS || turns.length>100)
    throw Object.assign(new Error('Hội thoại quá dài. Vui lòng mở cuộc trò chuyện mới và giữ lại các dữ kiện cần dùng.'),{name:'CONVERSATION_CONTEXT_TOO_LARGE'});
  return turns;
}
