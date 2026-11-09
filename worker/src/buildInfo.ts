/** Shared release identity for health checks, answer caches and audit traces. */
export const PIPELINE_VERSION='v2.17.17-registration-evidence';
export const ASSURANCE_CAPABILITIES={
  evidenceProvenance:'taxhkd-evidence-v1',
  claimReviewReuse:'SHA256_CONTEXT_BOUND',
  reviewedAnswerRelease:'REVIEWED_LLM_ONLY',
  arithmeticIntegrity:true,
  formalVerification:false,
} as const;
