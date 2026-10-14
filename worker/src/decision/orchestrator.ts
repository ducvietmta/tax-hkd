import type { EvaluationResult } from '../rules/evaluator';
import type { EvidenceItem, RetrievalPlan, StructuredDecision, TaxDecisionFrame } from './types';

export function decide(
  frame: TaxDecisionFrame,
  evaluation: EvaluationResult | null,
  evidence: EvidenceItem[],
  retrievalPlan: RetrievalPlan,
): StructuredDecision {
  const blockingFact = frame.missing_facts.find(fact => fact.blocking);
  const revenue = frame.facts.revenue_vnd;
  const uncertainResidency = frame.residency.value === 'UNKNOWN' && revenue !== undefined &&
    frame.tax_period.years.some(year => year >= 2026) && revenue > 1_000_000_000;
  const applicable = evidence.filter(item => item.evidence_relation !== 'NOT_RELEVANT');
  const hasVerified = applicable.some(item => item.legal_status === 'VERIFIED');
  const hasConditional = applicable.some(item => item.evidence_relation === 'CONDITIONAL_SUPPORT');

  const decision_status: StructuredDecision['decision_status'] =
    evaluation?.status === 'NEEDS_LEGAL_REVIEW' ? 'NEEDS_LEGAL_REVIEW'
    : blockingFact || evaluation?.status === 'NEEDS_INFO' ? 'NEEDS_INFO'
    : evaluation?.status === 'ANSWERED' && !uncertainResidency ? 'ANSWERABLE_VERIFIED'
    : uncertainResidency || hasConditional ? 'CONDITIONAL'
    : hasVerified ? 'ANSWERABLE_WITH_EVIDENCE'
    : 'NO_BASIS';

  const nearBoundary = revenue !== undefined && [1_000_000_000, 3_000_000_000, 10_000_000_000]
    .some(boundary => Math.abs(revenue - boundary) <= 1);
  const risk_level: StructuredDecision['risk_level'] =
    decision_status === 'NEEDS_LEGAL_REVIEW' ? 'CRITICAL'
    : nearBoundary || frame.tax_period.is_historical ? 'HIGH'
    : decision_status === 'CONDITIONAL' || decision_status === 'NEEDS_INFO' ? 'MEDIUM'
    : 'LOW';

  const verifiedOutcome = decision_status === 'ANSWERABLE_VERIFIED' ? evaluation : null;
  return {
    schema_version: '1.0', frame, decision_status, risk_level,
    rule_outcomes: verifiedOutcome?.rule_outcomes || [], evidence,
    retrieval_plan: retrievalPlan,
    allowed_claims: {
      numbers_vnd: verifiedOutcome ? [verifiedOutcome.effective_revenue_vnd,
        verifiedOutcome.vat_due_vnd, verifiedOutcome.pit_after_relief_vnd,
        verifiedOutcome.total_tax_payable_vnd] : [],
      rates: verifiedOutcome ? [verifiedOutcome.vat_rate, verifiedOutcome.pit_rate] : [],
      years: frame.tax_period.years,
      documents: verifiedOutcome?.rule_outcomes.flatMap(outcome => outcome.citations.map(citation => citation.doc_id)) || [],
    },
    forbidden_claims: [],
    must_cover_intents: [frame.tax_intent.primary.value, ...frame.tax_intent.secondary],
    conflicts: [],
    ...(blockingFact ? { ask_user: { question: blockingFact.ask, reason_fact_id: blockingFact.id } } : {}),
  };
}
