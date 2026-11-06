# Case recognition for TAX-HKD

Reactivation (26 October 2026): the user explicitly requested production mode
`on`. Set `CASE_RECOGNITION_MODE=on` with
`STRICT_VERIFIED_EVIDENCE_ENABLED=1`. Strict source mode now independently
requires semantic answer review even when `DECISION_MODE=audit`; reviewer
failure cannot release an answer. The active local preflight and isolated route
tests validate source boundaries, not live legal answer accuracy. Verify the
deployed configuration through `/api/health`.

Production activation (24 October 2026): the user explicitly instructed activation
of the supplied AI review package. The import retains the AI reviewer identity and
records direct authorization separately. It does not relabel AI work as a human
semantic review. Configured flags are now `on` and `1`; confirm live state with
`/api/health`. 829 descriptors and 978 links are compiled, 95 cases rejected and
11 intros excluded. No vector backfill is part of activation. Full live recall,
accuracy and final citation validity across 401 questions remain unmeasured. The
user authorized activation without waiting for that evaluation; no improvement
is claimed.

The package importer validates source/proposal/card hashes before applying changes,
retains all 250 resolution records and the original AI audit, and records 52 explicit
neutralizations. No digits, rates, URLs or raw case body may enter runtime expansion
terms. `sourcePolicy.json` quarantines card `16.24`; both recognition and the strict
evidence gate honor the quarantine. Original canonical text and citation-validity
metadata remain unchanged. Activation artifacts are in
`outputs/case-recognition-activation-2026-10-24/`.

Live health confirms `v2.17.1-case-recognition`, mode `on`, strict `true` and 829
descriptors. Deployment version is `fe6268af-0665-4d2f-9217-b8adbb011bd0`.
43 new tests, the 191-question offline suite, TypeScript and deployment passed.
Live smoke answers were still refused: payment review had low confidence and a
registration answer failed `UNMAPPED_CITATION`. These are observed limitations,
not successful answer-quality results. No full 401-question live metric is claimed.
See `activation.html` / `activation.json` for exact observations and rollback.

Run `node scripts/eval_case_recognition_active.cjs` for the active-data local
preflight. It uses fixed semantic fixtures, not live classification or answer
accuracy. The old abstention-only evaluation intentionally refuses active matches.

## Data boundary

`rag_data/rag-kb-export-2026-10-12/chunks.jsonl` is unchanged by this feature.
The current inventory contains 935 `CASE_EVIDENCE` records, including 11 intros.
The initial proposal builder accounted for all 935: 924 pending and 11 excluded
intros. Initially 749 records had a proposed neutral phrase. The imported package
supplies additional phrases and decisions; the builder itself never approves them.

Only reviewed phrase IDs and reviewed case→canonical bindings are compiled into
`worker/src/recognition/caseIndex.json`. No case body, title, social URL, personal
detail, tax rate, threshold or legal conclusion is shipped in that index.
Phrases come from a closed, neutral vocabulary, not arbitrary model output.

Recognition uses a separate lexical index and emits a closed understanding packet.
It never changes the question's facts, dates, taxpayer classification, allowed
source scope or required evidence. The bridge gives compatible verified candidates
a bounded ranking bonus; it cannot pin a case-derived source. Mandatory evidence
is preserved. Dense retrieval still reads the existing verified index.

## Flags and release behavior

| Flag | Default | Behavior |
|---|---|---|
| `CASE_RECOGNITION_MODE` | `off` | `off`, `shadow`, or `on` |
| `STRICT_VERIFIED_EVIDENCE_ENABLED` | `0` | `1` requires verified identity/provenance and final claim/citation review |

`on` without strict mode is rejected as a configuration combination: recognition
stays off and logs `CASE_RECOGNITION_CONFIG_INVALID`. Shadow computes diagnostics
without changing the selected evidence. Rollback recognition to `off` while keeping
strict mode on. Flag and data versions are included in answer cache keys.

Strict mode requires semantic review even when existing `DECISION_MODE=audit`.
It does not turn on unrelated rules-engine enforcement. It checks registered
source identity/content/tier, subject and period before context construction, and
checks provenance plus every claim mapping after generation/repair. CITATIONS and
CONTEXT do not bypass structural checks. Missing review, missing provenance,
case references, unsupported documents/URLs or unmapped citations block release.
The original citation-validity policy remains in force; approving a recognition
link does not certify law or extend a source's effective dates.

Cache entries carry an internal proof, rechecked against current sources and the
answer on each strict cache hit. Old/malformed proofs become misses. Proofs and
rejected draft text are not included in strict API responses. Web JSON, SSE,
ChatGPT and MCP share the same handler/gate. The cache-bypass header is forwarded
by MCP only for authenticated private test callers.

## Human review

1. Run `npm run kb:cases:propose` to produce proposals and the local review page:
   `outputs/case-recognition-implementation-2026-10-23/review.html`.
2. Open that page. Read the original situation and each proposed verified card.
   Select only neutral phrases that describe the situation and relevant card links.
   Leave ambiguous cases pending. An approved descriptor may have no linked card;
   it then supplies phrase expansion only. Intro records cannot be approved.
3. Enter the actual reviewer's name and export decisions. No bulk approval or
   automatic reviewer identity is supplied. Keep the export; page selections are
   in memory and are lost if the page is reloaded before export.
4. Import the exported file, preserving existing non-conflicting decisions:

   ```powershell
   node scripts/import_case_recognition_reviews.cjs 'C:/path/to/case-recognition-reviews.json'
   npm run kb:cases:check
   npm run test:case-recognition
   ```

The compiler validates the corpus/vocabulary/proposal hashes and each approved
card's current content hash. Stale or conflicting reviews fail instead of being
silently carried forward. Imports roll back review/index files on validation error.
Changing a proposal requires a new review. Source text and tier must not be edited
to make an approval pass. `preworker:deploy` runs the compiler consistency check;
run it manually too if using Wrangler directly.

## Diagnostics

`CASE_RECOGNITION_TRACE` records a request ID, mode/version, A's case IDs/scores,
intent/phrase IDs, proposed cards, cache/latency; B's accepted/rejected/selected
refs and context refs; and the final gate plus claim→evidence→card mappings.
New diagnostics omit raw cases, raw question text and personal information.
`CASE_RECOGNITION_CACHE` records successful cache revalidation. The existing
application's other logs are outside this feature's telemetry changes.

The warm recognition budget is 20 ms, with a 256-entry, five-minute packet cache.
Budget exhaustion or recognition errors cause abstention and verified-only
retrieval. Cache identity preserves amounts, negation, history and date context.
BM25 thresholds/bonuses are conservative initial parameters, not calibrated
probabilities; human-reviewed evaluation must precede enabling the feature.

## Tests and evaluation

```powershell
npm run test:case-recognition
npm run test:offline:191
npm run kb:cases:check
npx --no-install tsc --noEmit
npm run eval:case-recognition
```

The offline evaluation freezes all 401 existing question inputs, runs three paired
retrieval passes, checks abstention parity and rejects every raw case as evidence.
Its default output is `outputs/case-recognition-eval/<index-version-prefix>/`.
With zero approved descriptors it deliberately reports `NOT_RELEASE_ELIGIBLE` and
leaves legal recall, final citation validity, live accuracy and production latency
as null. Candidate-tier purity and mocked reviewer tests are not these metrics.

The live collector is prepared for two **isolated** deployments with matching
code, reviewed recognition data, canonical metadata and separately verified vector
snapshots: B0 strict/on with recognition off; B1 strict/on with recognition on.
Do not backfill production to manufacture a comparable baseline. Record P0
production separately, so adding the missing 19 vectors is not attributed to A.

`scripts/eval_case_recognition_live.cjs collect` requires:

- `CASE_EVAL_OUTPUT`: a new directory; partial/frozen runs cannot be overwritten.
- `CASE_EVAL_BASELINE_URL`, `CASE_EVAL_CANDIDATE_URL`: distinct isolated deployments.
- `CASE_EVAL_TOKEN`: existing private MCP test token, supplied as an environment
  variable, never in a command argument or report.
- `CASE_EVAL_GOLD`: JSON `{review:{reviewer,reviewed_at}, cases:[{id,input_hash,
  verified_refs,expected_abstain,split}]}` covering all 401 IDs. Hash inputs as
  SHA-256 of `JSON.stringify(input)`. Split is `calibration` or `holdout`; near
  duplicates must stay together. Review gold independently of answer collection.
- `CASE_EVAL_VECTOR_SNAPSHOT`: JSON with `review.reviewer`, `canonical_hash`, and
  equal `B0.content_hash`/`B1.content_hash` from an actual vector-content audit.

Collection runs the full pipeline, three samples per question and branch, with
alternating branch order and cache bypass. It freezes raw answers/hashes before
grading. The independent grade file contains `review.reviewer`,
`answer_freeze_sha256` and `rows:[{answer_hash,grade}]`, where grade is PASS,
PARTIAL, FAIL, BLOCKED or ERROR. Run `score` with `CASE_EVAL_GRADES` after grading.
Blocked/error responses never count as PASS. Scoring reports recall@4/6/8,
valid citations, accuracy and end-to-end p50/p95. All raw timings and source traces
are retained for holdout, topic, cold/warm and variance analysis.

Any citation failure, lower recall/accuracy or worse required latency metric keeps
recognition off. Even aggregate numerical success does not automatically deploy:
review paired changes, holdout results, corpus/test overlap and variance first.

## Existing regression limits

The existing `test_transport_parity.cjs` fixture fails on the atomic rate-limit
storage interface, including when run with the saved pre-change chat handler.
The new isolated pipeline tests cover web/MCP/SSE/cache paths without depending on
that stale storage fixture. `test_semantic_scope_regressions.cjs` also fails its
literal `[RANH GIỚI CHÍNH SÁCH]` assertion in the current canonical data; its
retriever/canonical modules were not modified by this feature. These failures were
not hidden by editing tax content or weakening assertions. Keep them in the release
review; the feature remains disabled.
