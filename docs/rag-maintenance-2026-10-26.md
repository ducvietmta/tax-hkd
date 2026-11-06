# RAG maintenance 26 October 2026

The canonical corpus contains 193 cards. The vector manifest deliberately includes
192: source policy quarantines 16.24. Case-recognition chunks are never embedding
sources. `kb:build` generates `worker/src/kb/vectorManifest.json`; `kb:check`
rejects stale manifests and query routes that reference non-canonical cards.

`scripts/backfill_vectorize.mjs --plan` is local and does not obtain credentials.
For remote maintenance, pass `--sync --account-id=<account>` or use `--verify`.
When the existing Wrangler login has exactly one account, it is selected
automatically; ambiguous accounts require an explicit ID. `preworker:deploy`
runs the remote verification and refuses deployment if the index is stale.
The CLI uses an existing environment API token or captures `wrangler auth token
--json` in memory. It does not write or print credentials. It sends full reviewed
card text to Workers AI, checks 1024-dimensional embeddings, upserts NDJSON through
the authenticated Cloudflare API and verifies every ID, source SHA256 and index
version after asynchronous processing. It also removes explicitly quarantined
IDs. Retry `--verify` if Vectorize has not finished processing. Reports are saved
under `outputs/vector-sync-2026-10-26/`. No public administrative route was added.

Vector-cache identity now comes from the manifest's content/period fingerprint.
Three routes were repaired: BONUS and BONUS_EINVOICE use the verified revenue,
classification and conditional invoice-boundary cards; RENTAL_RATE_MIXED uses
16.29 and 16.79 instead of the non-serving PENDING card 16.92. This repairs source
navigation without claiming that the unresolved legal question is settled.

The source-coverage regression suite now uses `buildReviewContext`, as production
does, preserving tests that detect an omitted required passage when even the
maximum budget is exhausted. The registration-parity fixture distinguishes
direct tax registration (identifier reconciliation) from household comparison.

## Legal-source review and retained limits

Reviewed official-source searches on 26 October 2026 for NQ43 implementation,
bonus/invoice thresholds and mixed rental/business revenue. These searches did
not establish a new final implementing instrument or a definitive rule for all
mixed-threshold situations. This is a limit of this review, not proof that no
such instrument exists. No draft, search snippet or taxpayer question was
promoted to a verified rule.

- NQ43 official record: https://vanban.chinhphu.vn/?classid=1&docid=219330&pageid=27160
- Government publication discussing implementation and draft proposals:
  https://baochinhphu.vn/trien-khai-chinh-sach-giam-thue-tncn-tiep-suc-kinh-te-ca-the-102261002093851566.htm
- Mixed rental/accommodation official response:
  https://chinhsachonline.chinhphu.vn/cach-tinh-thue-voi-ca-nhan-vua-kinh-doanh-luu-tru-vua-cho-thue-nha-91540.htm

Keep 16.78's procedure caveat, 16.79's special-revenue boundary and 16.122's
limits on complaint procedure. Detailed complaint forms, authority and deadlines
require a separately verified, current procedural source. Existing free-form
citations were not automatically relabeled as structured source reviews.
