# Security remediation — 2026-10-26

This change addresses the four source-backed leads from the 2026-10-26 audit.
The original audit remains a historical record of the previous working tree;
it is not a certification of the changed source or the deployed service.

## Guide purchases and concurrent spending

- `/api/user/credits/consume` now accepts only the two known guide products.
  The server owns their 10-credit price. A supplied legacy `amount` must equal
  that price; fractional, zero, negative, string, and unknown-product inputs fail.
- A transactional D1 batch admits a purchase only with sufficient funds and no
  valid existing entitlement, creates a unique pending receipt, debits the full
  price, completes the receipt, and reads the resulting state. A failure rolls
  back the entire batch. Repeated purchases return the existing entitlement
  without another debit. Chat reservations cannot interleave inside this batch.
- Session/profile accept only known completed, zero-money, full-price receipts
  with the expected purchase method. New receipts use `guide_purchase_v1`.
  Legitimate legacy `credits_consume` receipts for exactly -10 credits remain
  usable. Zero-price and unrelated-note/method receipts confer no entitlement.
- The client no longer reports purchase success on transport failure, nor
  updates a different account after an awaited purchase. The guide page ignores
  localStorage unlock claims; it uses session/purchase state instead.

No database migration is required. Existing transaction data is not rewritten.
Historical -10 legacy receipts cannot establish from these columns alone whether
the previous race undercharged them; reconciliation requires a separate owner
decision. Bundled guide content is not newly made confidential by this change.

D1 transaction semantics were checked against the
[official batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).

## Development AI bridge

Vite binds to `127.0.0.1` and no longer allows arbitrary Host names. Both bridge
routes enforce local socket addresses, an allowed loopback Host with the actual
listener port, a non-simple client header, and same-origin browser metadata.
Queries additionally require the exact local Origin. The gate runs before token
lookup and bridge invocation. Forwarded headers do not establish local authority.
The browser client sends the header; it is not a secret or a replacement for the
socket/Host/Origin checks. LAN/tunnel access to the private bridge is intentionally
unsupported. This is a local developer boundary, not OS-user authentication.

Production Worker routing and evidence/citation policy are unchanged.

## History across account transitions

HistoryModal mounts a separate session component keyed by authenticated identity.
Account changes discard list, selected details, and mutation state before the new
identity renders them. Requests have AbortControllers and response-commit guards;
closing, superseding, or unmounting a request invalidates its result even if a
transport ignores abort. Late results cannot recreate an old account's cache.
Deletion callbacks also avoid state/cache writes after their session unmounts.

## Validation

`scripts/test_security_remediation.cjs` is available as
`npm run test:security-remediation`. It exercises actual handlers and SQL using an
in-memory SQLite adapter with transactional D1 batch semantics, actual Vite
middleware with a fake bridge, the API client's failed transport, and actual
history/guide components in a deterministic hook lifecycle fixture.

Passing checks:

- Price/input tampering, insufficient balance, duplicate and competing purchases.
- Chat reservation before/after purchase; full rollback after completion failure.
- Legacy full-price receipt compatibility; rejection of free/unknown receipts.
- Bridge socket/Host/Origin/header admission; denied callers make no bridge call.
- Delayed account-A response after account-B login; no stale list/cache commit.
- Forged/old local guide unlock ignored; server entitlement accepted.
- Existing `scripts/test_security_hardening.cjs`: file authorization, duplicate
  webhook handling, rate admission and diagnostic checks.
- Full-project `tsc --noEmit -p tsconfig.json` passed. Vite configuration and
  `scripts/devBridgeAccess.ts` also passed a separate typecheck with the project's
  strict-null semantics, since the main tsconfig does not include Vite config.

Checks ran in a Linux mount/network/PID namespace and chroot with no external
network, an empty allowlisted environment, read-only source/toolchain, no host
home/credentials/sockets, dropped capabilities, UID/GID 65534, and scratch-only
writes. Resource limits: 70 CPU seconds, 90-second wall timeout, 8 GiB virtual
address space, 2 GiB data, 1 GiB Node heap, 64 processes, 128 files, 8 MiB file
size, 96 MiB scratch tmpfs, and no core dumps. Initial full-project typecheck
exceeded the smaller initial limit; the bounded memory allowance was increased.

The UI regression fixture models hooks and keyed remounts; it is not a full
browser layout/e2e test. SQLite batch fixtures are not remote D1 deployment tests.
No production data, real Firebase identity, token or paid provider was used.

Graphify incremental update completed: 3,043 nodes, 5,152 edges. JSON, HTML and
GRAPH_REPORT.md were regenerated; new purchase, history-session and bridge-gate
symbols were checked in the output. Graphify warned that its optional SQL parser
is not installed, so SQL files remain outside its symbol extraction; the SQL
regression fixtures above ran independently of Graphify. No LLM labeling or paid
API was used. No deployment was performed.
