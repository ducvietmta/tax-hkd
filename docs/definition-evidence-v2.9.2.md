# Definition evidence correction — 2026-10-21

## Observed production failure

Two direct synthetic requests reproduced a blocked answer after v2.9.1. Classification correctly selected DEFINITION / CONCEPT_EXPLANATION / LEGAL_TEXT_LOOKUP. The generated draft went beyond the question, confused sales revenue with profit in an example, and cited a household registration provision for a personal tax subject. Review rejection was appropriate. Repair did not produce an accepted candidate.

The previous offline test demonstrated routing and release safety, but its mocked definition did not establish that live generation would produce that definition.

## Changes

- Supplement 16.108 now begins with a direct explanation of the business individual and a scoped explanation of resident individuals under Article 4(1), Decree 68/2026. The source is the Tax Department explanation published on the Government policy portal: https://xaydungchinhsach.chinhphu.vn/chinh-sach-thue-gia-tri-gia-tang-thue-thu-nhap-ca-nhan-cac-khoan-thue-khac-119260316093129828.htm . No revenue threshold is copied from the historical article; this change concerns the subject definition only. Existing registration text remains intact. Metadata records the additional source, review date and new content hash.
- Generation uses a short definition policy for the semantic DEFINITION purpose. Calculation policy remains unchanged for calculation requests. Examples are optional and unsupported consequences are excluded.
- Coverage review assesses the requested definition rather than requiring registration procedures. Claim verification still requires source support; relevant boundaries and prerequisites are not automatically irrelevant.
- The regression test checks the actual source passage reaching generation, purpose-specific policy and coverage instructions, and continued rejection of irrelevant partial answers.

## Follow-up from live checks: v2.9.3 / v2.9.4

Live v2.9.2 still retained a supporting revenue-boundary fragment when the definition was uncertain. v2.9.3 prevented fragment-only release and introduced curated `purpose_passages`. A passage is used only when it is a literal substring of the already period-gated canonical source. In v2.9.4, definition review separately classifies each claim as DIRECT_ANSWER, SUPPORTING or UNRELATED. A failed whole-answer review may retain a core definition only when that exact claim passes independent source verification at >=0.8, its direct-answer role passes at >=0.8, mechanical grounding passes, and whole-answer coverage passes at >=0.7. No confidence threshold is lowered. Unapproved supplementary prose and automatically extracted citations are not attached to this core.

The original question on v2.9.4 returned an actual verified definition instead of refusal. Review recorded DIRECT_ANSWER confidence 1, claim verification 0.82 and coverage 0.97. The whole draft remained PARTIAL_VERIFIED because citation confidence was 0.31, so the response retained the core definition only. This is not a claim that all original prose or citations passed.

## Exact quotation assurance, v2.9.7

Further uncached live requests showed that generated paraphrases and even literal source text could receive COMPLETE with confidence below the generic 0.8 per-claim threshold. v2.9.5 added a bounded simplification attempt; v2.9.6 offered a curated literal definition as the second review candidate. Neither alone resolved inconsistent confidence. Those failures are retained in the diagnostic outputs.

v2.9.7 adds a distinct assurance path restricted to a single exact source quotation answering one definition request. The canonical chunk and metadata identities must match; the whole source content hash must match its recorded review; the excerpt must be the curated DEFINITION passage and a literal substring of the source; source status, review date, source URLs and period bounds must be present and valid. Mechanical grounding must pass. Independent review must classify the quote DIRECT_ANSWER at >=0.8 and facts FAITHFUL, evidence SUPPORTED and coverage COMPLETE, each at >=0.8. The per-claim label must still be COMPLETE. This path does not use its uncalibrated confidence as an additional fidelity test because fidelity is established by exact source equality and hashing. Generated additions, uncertain or contrary semantic judgments, supporting fragments, uncertain citations, calculations and applicability inferences are excluded. Output remains PARTIAL_VERIFIED with an explicit `sourceDefinitionVerification` audit record; the entire draft is not marked PASS.

This is a deliberate separate assurance rule, not a claim that confidence calibration is solved. Future expansion requires reviewed source excerpts; arbitrary retrieved text cannot activate it.

## Limits and evidence

Offline tests cannot certify model output. Own synthetic live requests and their complete response diagnostics are retained in `outputs/definition-diagnostic-2026-10-21`. No community cases or independent gold test suites were sent to providers. No review confidence threshold was lowered and enforce remains enabled.
