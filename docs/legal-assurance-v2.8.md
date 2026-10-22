# TaxHKD v2.8: evidence provenance and review integrity

This release adds mechanical assurance to the existing RAG/decision pipeline.
It does not claim formal verification or independent certification of Vietnamese law.

## Runtime changes

- Evidence passages carry the original chunk identity, recorded review state and tax-year interval from `chunkMeta.json`.
- Claim mappings are checked for duplicate/unknown IDs, source-reference mismatches, incompatible tax periods and unrelated request bindings. These checks cannot be overridden by a positive model verdict.
- Review reuse requires an SHA-256 digest of the question, history, semantic frame, evidence text, requests and passages, plus matching claim text, evidence IDs and request IDs. Reusing an `E1` label is insufficient.
- A complete response requires every review check to pass. Incomplete/uncertain/low-confidence reviews cannot be promoted to PASS. Independently verified, structurally valid claims can still be returned as a clearly marked partial answer. Partial answers are not stored in the complete-answer cache.
- An unavailable reviewer remains unavailable; no deterministic arithmetic or document-name match silently substitutes for legal review.
- Missing revenue/year cannot become zero/2026. Monetary input precision, arithmetic conservation, VAT bases and multi-activity totals are checked before an engine result can be released.
- An explicitly elected income method cannot silently become turnover when taxable income is missing. Historical rulesets without an income rate cannot acquire a default 15% rate.
- Cache identity includes actual ruleset contents and recorded legal relations, not just version strings. Health exposes release/capability identifiers without making model calls.

## Offline graph

`npm run kb:graph` exports JSON-LD, a content-hash manifest, document impact indexes and an HTML report to `outputs/legal-assurance/`.

Nodes represent documents, knowledge chunks, configured rulesets, parameters, configured citations and sourced provision relations. `mentionsDocument` only means a document identifier appears in a chunk. `configuredCitation` only records an implementation binding. Neither proves legal support.

`legalRelations.json` contains explicitly sourced, provision-scoped relations. Never infer repeal/amendment from document rank, publication year, a title or an LLM suggestion. Document catalogue dates are not verified effective dates. A local file hash does not establish an official origin or validate a digital signature.

The initial source-checked relation links clause 2, article 1 of Decree 141/2026 to clause 5, article 8 of Decree 68/2026. The 2026 ruleset's invoice citation is corrected accordingly and versioned 1.0.2. No tax rates or monetary thresholds change in this release.

## Validation and operations

Run `npm run test:assurance`, `npm run test:request-claims`, `npm run test:decision`, `npm run test:upgrade:offline`, `npm run test:scope`, then `npm run build`.

The assurance suite exercises tampered evidence, period mismatches, stale review approvals, arithmetic invariants and VAT-base metamorphic properties with a fixed reproducible seed. Models are mocked. Existing offline gold suites remain offline; component passes do not establish end-to-end model accuracy.

Do not describe these tests as Catala/SMT proofs. Catala, an online graph database, document-signature verification, independent legal sign-off and a complete provision-level coverage map remain separate work. The report lists unmapped document mentions rather than silently upgrading their status.

After deployment, verify `/api/health` reports the current identifier in `buildInfo.ts`. Review `answer_grounding_traces` for mechanical integrity failures and partial-answer rates. A rollback must restore a known Worker version; do not relax review gates to suppress failures.

## v2.8.1: scoped links for the 41 gaps

The 41 previously unlinked chunks now carry 106 explicit source links in `chunkMeta.json`. Each link records document identity, locator, supported scope and an official/local source URL. The review is bound to a SHA-256 of the unchanged chunk text. `kb:sources:check` rejects stale text, unknown documents, missing local files and unsafe source URLs. The graph builder also rejects stale bindings rather than silently retaining a reviewed status.

`sourceDocuments.json` adds eight source identities outside the existing 59-document website catalogue: the VAT consolidated text, the Singapore treaty, the supplied CV7403 and historical/current business-licence-fee documents. External primary sources are explicitly external, not missing or fabricated local files. The graph includes 67 source documents in total.

Runtime evidence provenance and existing grounding traces include the scoped links. This adds no model call and does not expand the reviewer prompt, raise legal status, alter tax rules or certify every sentence. Historical links retain their year boundaries. Treaties retain the unresolved Vietnam filing-procedure limitation; software examples do not certify software behavior. The 41-gap queue is resolved as source linkage, not a full independent legal audit of all 150 chunks.

The dated migration script intentionally refuses to reapprove already linked records or changed review snapshots. Future text changes need a new source review; do not regenerate review hashes merely to make tests pass.
