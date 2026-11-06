import type { AnswerScope } from '../answerScope';
import type { RetrievalPlan, TaxDecisionFrame } from '../decision/types';
import type { RecognitionPacket } from './recognizer';

export interface BridgeTrace {
  accepted_refs: string[];
  rejected: Array<{ ref_id: string; reason: string }>;
}

export function bridgeVerifiedCandidates<T>(
  results: T[],
  _packet: RecognitionPacket,
  _query: string,
  _scope: AnswerScope,
  _plan: RetrievalPlan,
  _frame: TaxDecisionFrame | null,
  _limit: number,
): { results: T[]; trace: BridgeTrace } {
  return {
    results,
    trace: {
      accepted_refs: [],
      rejected: [],
    },
  };
}
