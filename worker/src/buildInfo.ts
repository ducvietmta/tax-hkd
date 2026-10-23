/** Shared release identity for health checks, answer caches and audit traces. */
export const PIPELINE_VERSION='v2.14.1-directory-name-search';
export const ASSURANCE_CAPABILITIES={
  evidenceProvenance:'taxhkd-evidence-v1',
  claimReviewReuse:'SHA256_CONTEXT_BOUND',
  reviewedAnswerRelease:'REVIEWED_LLM_ONLY',
  arithmeticIntegrity:true,
  formalVerification:false,
} as const;
