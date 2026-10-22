/** Shared release identity for health checks, answer caches and audit traces. */
export const PIPELINE_VERSION='v2.12.1-source-coverage';
export const ASSURANCE_CAPABILITIES={
  evidenceProvenance:'taxhkd-evidence-v1',
  claimReviewReuse:'SHA256_CONTEXT_BOUND',
  reviewedAnswerRelease:'ALL_CHECKS_PASS_OR_VERIFIED_PARTIAL',
  arithmeticIntegrity:true,
  formalVerification:false,
} as const;
