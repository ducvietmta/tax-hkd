/**
 * Backward-compat shim: logic chuẩn nằm ở shared/taxScope.ts để frontend
 * không phải bundle code worker. Các module worker vẫn import từ './answerScope'.
 */
export * from '../../shared/taxScope';
export type { AnswerScope, ConversationTurn } from '../../shared/taxScope';
