# DominoOS cloud backend implementation contract

Updated 13 November 2026 on `plan/cloud-backend`, existing [PR #5](https://github.com/Tasty-Kiwi/unfair-wknd-26/pull/5). Deadline: 14 November 2026, 20:00 Europe/Vilnius.

**Implemented locally and deployed only to approved staging.** The user explicitly replaced Better Auth with custom GitHub OAuth. This document reflects that approved deviation; the original three-model history and later implementation rounds remain in [the debate record](CLOUD_BACKEND_DESIGN_DEBATE.md). Exact code, model contributions and verification are in [CLOUD_BACKEND_IMPLEMENTATION.md](CLOUD_BACKEND_IMPLEMENTATION.md).

Acceptance: a user signs in with GitHub, saves a supply-chain workspace, reopens it in a fresh browser, and another user cannot retrieve or change it. The full local Worker/D1 journey passes. The new flow's real-provider/two-real-account staging repetition remains open; the earlier user-confirmed login used the former SDK.

## Repository baseline and invariants

- Same Worker name `domino-os`, same account, compatibility date and Vite ASSETS/SPA routing.
- `/landing`, the original simulator, guest builder and deterministic engine remain available without auth.
- `BuilderWorkspaceV1`, original guest storage key and 2 MiB local import/export boundary remain unchanged. Structural v1 parsing permits incomplete fields/drafts and preserves scenarios/validation context/positions/provenance.
- Cloud IDs stay separate from `document.id`; browser simulation and network-key semantics are unchanged.
- Current main (including PR #6 builder colors) was already integrated; this execution creates no branch/PR or merge.
- Production and previews stay cloud-disabled with no production D1. No force-push, production activation or paid upgrade.

## Authentication decision

Use a small custom GitHub authorization-code flow, not an authentication SDK. Only Web Crypto, fetch and D1 are needed. Existing GitHub app credentials/callbacks remain valid. No password hashing, email verification/reset, JWT, account linking, organizations or alternate providers.

AUTH_URL is a canonical HTTPS origin (HTTP allowed only on loopback). The Worker starts GitHub with ten-minute random state, a distinct HttpOnly browser nonce and S256 PKCE. The callback atomically consumes a matching state/browser record before code exchange. Provider endpoints/returns are fixed, upstream JSON is bounded and timed out, provider redirects are rejected and tokens/errors are never logged or reflected.

Identity is keyed by stable numeric GitHub ID and mapped to an internal user ID, never email/login/body data. Random one-day session cookies have only their SHA-256 hashes stored in D1. Cookies are host-only, HttpOnly, SameSite=Lax and Secure on HTTPS, with __Host- names. Every protected request checks D1; logout deletes the session. Atomic auth rate limits bound starts/callbacks to 10/20 per IP per minute.

## Worker and D1

`worker/index.ts` dispatches `/api` and `/api/*` to the API; other routes use ASSETS. Unknown API/navigation paths terminate in JSON 404. API responses are no-store.

Migration 0001 and 0002 remain unchanged. Additive `0003_github_oauth.sql` creates:

- github_identities: GitHub ID → unique internal owner ID/name.
- cloud_sessions: token hash, owner, expiry.
- oauth_attempts: hashed state/browser binding, verifier, expiry.
- oauth_limits: atomic minute counters.

It imports legacy GitHub account mappings with original user IDs, deduplicates identical rows and aborts on conflicts. Projects are untouched and old sessions require a fresh sign-in. Legacy tables are retained but never read by the runtime. No schema generator or migration-on-request remains.

Project storage is still one table: server UUID, verified owner, name, canonical workspace JSON, positive version and created/updated ISO timestamps. Existing owner/update/id and owner/create indexes support listing and limits. No normalized node/edge/scenario tables or separate services.

## Frozen API

`verifySession(request, env) -> Promise<{userId,name}|null>`

Project metadata: `{id,name,version,createdAt,updatedAt}`.

| Route | Contract |
| --- | --- |
| GET /api/health | public `{ok:true,cloudEnabled}` |
| GET /api/me | `{user:{id,name}}` or 401 |
| GET /api/projects | bounded `{projects:[metadata],nextOffset}`, no full workspaces |
| POST /api/projects | `{name,workspace}` → 201 `{project:metadata}` |
| GET /api/projects/:id | authorized `{project:{...metadata,workspace}}` |
| PUT /api/projects/:id | `{name,workspace,expectedVersion}` → saved metadata or 409 |
| POST /api/auth/sign-in/social | fixed GitHub start and same-origin return |
| GET /api/auth/callback/github | one-use state/PKCE code exchange |
| GET /api/auth/get-session | minimal user or null |
| POST /api/auth/sign-out | revoke and clear cookies |

Project errors: `{error:{code,message,...details},requestId}`. All queries bind the verified owner. Return the same 404 for absent/foreign IDs; prepared parameters prevent SQL injection. An owner/version-restricted UPDATE implements CAS; a stale save returns 409/currentVersion without auto-adopting it.

Single-statement insertion predicates enforce 20 projects/account and five successful creates/minute even under concurrency. Names are trimmed and bounded. Canonical workspace limit is 1,000,000 UTF-8 bytes; stream-counted request cap is 1,050,000 bytes (auth 16,384). Reject unsupported workspace versions, malformed JSON, invalid framing/Origin and oversize bodies before writing. Meaningful 400/401/403/404/405/409/413/415/429/500/503 responses reveal no secrets/stacks.

## UI and local/cloud lifecycle

Keep Sign in/out, My Projects, Save to cloud, Open and Save as New inside the existing builder. No new router/dashboard.

The public health probe gates controls. Explicitly disabled cloud has no sign-in/retry; failed or malformed health offers Retry cloud connection without reload or local-data replacement. Only the current probe may write state, duplicate probes are blocked and OAuth-return session intent survives a failed probe.

Local autosave stays independent. Cloud drafts are scoped per owner/project; binding/version metadata is outside workspace JSON. Acknowledgements apply to the sent snapshot only; later edits remain dirty. Failed/unknown writes retain local data and never show false success.

Open validates remote JSON, checks current edits, confirms replacement and only then persists/switches. Conflicts offer Keep working locally, Save as New or confirmed Open cloud version; no force overwrite/merge. Sign-out/account changes flush scoped work, restore guest mode, clear binding and reject stale responses. Refresh intentionally opens the device draft; My Projects explains reopening cloud work.

## Configuration and commands

Only server-side GitHub Client ID/Secret are required; no signing secret or VITE secret. AUTH_URL/CLOUD_ENABLED are fixed per environment. Use local/staging/production-separated D1 and GitHub apps/callbacks.

```sh
npm ci
npm run types:worker
npx wrangler d1 migrations apply DB --local --config wrangler.local.jsonc
npm run build
npm run dev
# Another terminal:
npm run dev:api
```

Browser origin/callback stays localhost:5173 through the /api proxy to 8787. Local guest mode works without credentials.

On the already-approved staging environment only:

```sh
npx wrangler d1 migrations apply DB --remote --config wrangler.staging.jsonc
npx wrangler deploy --config wrangler.staging.jsonc
```

Production provisioning, migration, secrets, deployment or merge requires separate explicit authorization. Review deployment-triggering pushes; existing branch previews keep cloud disabled/DB omitted. See [setup](GITHUB_AUTH_SETUP.md) and [staging evidence](STAGING_VERIFICATION.md).

## Parallel ownership and actual delivery

| Owner | Files / responsibilities |
| --- | --- |
| Hydrogen | custom worker/auth.ts and migration 0003 |
| Haiku | cloud health-retry hook/UI and four browser cases |
| Luna | auth configuration test update; its remaining test work was not completed |
| Coordinator | SDK/tooling removal, index/http/env/config/deps, security fixes, complete opaque-session/provider/migration/browser tests, documentation, CI/staging and PR integration |

Historical and current delegated task references and precise contributions are retained in the debate/implementation records. No test or code work is attributed to an agent that did not do it.

First vertical slice remains sign in → save current graph/scenario → sign out → fresh browser → same-account Open → other-account GET/PUT denied. The local built-Worker/D1 slice passes without API interception, using test-only opaque sessions; it does not substitute for real GitHub authentication.

## Tests and stop/go checkpoints

Final local checks: 102 unit tests, 40 Worker tests, 44 browser journeys, Worker/test-source typechecks, build and deployment dry run pass. No simulation or original journey was removed.

New OAuth tests cover successful mocked provider exchange, state/PKCE/browser binding/replay/expiry, malformed/duplicate/forged sessions, server revocation, hostile/oversized/compressed upstream JSON, provider timeout, secure cookies, stable GitHub identity and legacy ownership import/conflicts. Existing project security/CAS/quota/size/round-trip and frontend data-safety cases remain.

- Gate A: custom auth/session/migration verified locally; fresh real GitHub sign-in still required.
- Gate B: project owner/CAS/quota/validation tests pass.
- Gate C: real local Worker/D1 fresh-browser reopen with exact workspace/scenario/simulation and second-owner denial passes; repeat with two real accounts on staging.
- Gate D: complete local checks pass; hosted checks must match each pushed head.
- Gate E: update existing PR #5 and keep it open; do not merge or activate production automatically.

Halt rollout for broken ownership/session validation, destructive/ambiguous migration, lost local work, failed required checks or missing live proof. SDK removal is not a measured authenticated-endpoint performance result. Do not invent success, bypass auth or change billing.

P1 after P0: delete, list rename, cloud autosave and richer recovery. Deferred: email/password, teams/roles/sharing, revisions, collaboration, attachments, billing/notifications, additional services, normalized graph storage or simulation changes.
