# Generated explanations — 2026-10-21

User requirement: AI must synthesize and explain fully; retrieved knowledge is evidence, not a ready-made response.

## Implementation

- Removed the exact-source quotation assurance module, source excerpt repair candidate, and definition-core answer cropping introduced during v2.9.x debugging. A failed review cannot return the definition from RAG as a substitute.
- Expanded concept context back to the definition, subject distinction and registration relationship. These are input passages only. The model receives a purpose-specific contract to explain, connect sources and use clearly hypothetical examples when useful, without inventing obligations.
- For semantically classified DEFINITION requests, generation is followed by a distinct Muse evidence-review call. JEV still performs scope/business classification. Other legal/tax answer routes retain their existing review path.
- The reviewer reads the question, history, every claim, every subrequest, period and source passages. It returns structured global checks, request coverage, per-claim support, reasoning for each verdict and literal evidence witnesses. The answer itself may be a paraphrase or a synthesis.
- Code checks exact ID sets, schema, source witnesses against their actual passages, original mappings, provenance/period integrity and per-claim confidence. Missing/forged witnesses, incomplete review, contradictions, uncovered requests and provider failures cannot approve the answer. An approved generated explanation remains intact, including supported supplementary paragraphs.
- v2.10.1 distinguishes absent mapping markers from invalid/forged markers. A missing marker can be resolved only after the separate reviewer provides valid source quotations, known request IDs, a supported verdict and sufficient confidence. Code re-runs all grounding/period checks on the proposed mapping, adopts it only when the complete review passes, and records the mapping resolution. Text is never replaced by source text. An invalid E999 marker is not silently repaired or laundered through this path.
- One bounded model edit and a fresh review remain available for actual problems. No source-answer bypass remains. Reports are persisted in grounding audit traces.
- v2.10.2 makes tone subordinate to legal accuracy and completeness. Plain-language explanations must preserve legal meaning and scope; neither generation nor review may excuse an unsupported gloss because it sounds easy to understand. Hypothetical examples are permitted and labelled; fabricated amounts are not required when the user supplied none.

## Limits

The reviewer uses the same model provider in a separate call; this is not independent-provider consensus or a proof of legal correctness. Confidence is model-reported, not calibrated legal assurance. The four global checks are categorical PASS/FAIL/UNVERIFIABLE; their legacy adapter confidence of 1 encodes that categorical result, not an estimated probability. Per-claim confidence remains explicit and must meet 0.8. The model cannot certify a claim merely by copying an evidence ID; a real source witness and the semantic review are required.

## Validation

`test:question-purpose` mocks both providers and proves that a generated two-paragraph explanation is retained verbatim, while unavailable/contradictory/incomplete reviews, invented quotations, unknown sources, omitted claims and low-confidence claims do not release it or substitute a stored answer. Existing decision, pipeline, provenance/arithmetic and KB sync suites also run locally. Live synthetic requests and release metadata are saved in `outputs/generated-explanations-2026-10-21`. Independent gold suites and community cases are not sent to APIs.
