# Cloud backend implementation

13 November 2026. Branch: `plan/cloud-backend`. Existing PR: [#5](https://github.com/Tasty-Kiwi/unfair-wknd-26/pull/5). No new branch or PR, force-push, or PR merge.

The backend is implemented. **Local end-to-end persistence and owner isolation pass through the built Worker and actual local D1.** Real GitHub sign-in is user-verified. A fresh-browser, two-real-GitHub-account acceptance run on staging remains outstanding; do not describe local seeded-session tests as that live proof.

The latest user instruction excludes the copied email-login and CPU sections. The implementation therefore retains **GitHub OAuth**, with no password form, password hashing change, provider pivot, new timing benchmark or billing change. Earlier measurements and design disagreements remain historical in the original documents.

## Architecture actually implemented

- React/Vite builder and deterministic simulation run in the browser.
- One Cloudflare Worker serves `/api` and `/api/*`; existing ASSETS serve everything else, including `/landing`. Both bare and unknown API paths return JSON rather than SPA HTML. `run_worker_first` explicitly includes both patterns.
- Better Auth **1.7.22** and schema CLI `auth` **1.7.22** are pinned. GitHub is the only provider. Every project request calls the production database-backed session verifier; SDK configuration may be cached, identities/session lookup results are not.
- Cookies are host-only, HttpOnly, SameSite=Lax and Secure on HTTPS. Session cache and refresh are disabled; expiry is one day. Account linking is disabled and OAuth tokens are encrypted by Better Auth.
- The auth base URL is a canonical HTTPS origin, with HTTP allowed only on `localhost`, `127.0.0.1` or `[::1]`. Credentials, non-root paths, query strings and fragments are rejected.
- D1 stores auth state and complete, structurally valid v1 workspace JSON. No node/edge normalization or simulation changes.

Cloudflare routing was checked against its official [static-assets binding documentation](https://developers.cloudflare.com/workers/static-assets/binding/) and the installed Wrangler 4.161.0 schema/types. The runtime integration uses the installed Wrangler test harness and the real production Worker entry point.

## Genuine model contributions

A new independent three-round implementation discussion finished before coding. Its responses, corrections, disagreements and frozen ownership are appended to [the debate record](CLOUD_BACKEND_DESIGN_DEBATE.md). Actual implementation tasks:

| Model | Provider | Task reference | Actual contribution and reported checks |
| --- | --- | --- | --- |
| gpt-6-luna | codex | [Cloud implementation — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3Ac53175b5-5d74-4bb5-8adc-aab6877e6082) | Canonical auth-origin validator; shared use in auth construction/options; configuration and cookie/provider policy tests. Four owned files. Focused auth-config run: 9 passed. |
| claude-haiku-5-5 | claudeAgent | [Cloud implementation — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A5faaf735-5944-4bbd-8895-4b5daac78afa) | Rate-limit response mapping; same-project live-draft comparison; confirmed Open cloud version recovery; client regression and account-switch/expiry/conflict browser tests. Reported app/spec typechecks, 13 client tests and 10 mocked cloud journeys passed. |
| gemini-4-hydrogen | antigravity | [Cloud implementation — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A04932613-f12e-4217-a79b-601253b4793d) | Shared isolated Worker test factories; project framing, pagination, validation, incomplete-draft, corrupt-row and per-owner quota tests; configuration guard wiring. Refactored setup while retaining all eight original auth cases. Reported 28 Worker tests passed before its final helper typing adjustment; coordinator reran the final suite. |

Luna and Haiku reported matching executed-model IDs. Hydrogen's separate executed-model field was unavailable; the requested/configured ID is reported without fabricating an executed ID.

The coordinator reviewed all code, corrected a Node/Worker Response type mismatch, added test-source typechecking to CI, added Save as New and active-account-change browser tests, and implemented the real built-Worker/D1 browser journey. Dependencies and simulation code were unchanged in this execution. No agent committed or deployed independently.

## Database and migrations

`migrations/0001_auth.sql` contains Better Auth's `user`, `session`, `account`, `verification` and `rateLimit` tables. `migrations/0002_projects.sql` contains:

| Column | Purpose |
| --- | --- |
| id | Server-generated UUID, separate from workspace document ID |
| owner_id | Verified internal auth user ID |
| name | Trimmed project metadata, 1–120 characters |
| workspace_json | Canonical validated v1 JSON, at most 1,000,000 UTF-8 bytes |
| version | Positive integer, starts at 1 and increments atomically |
| created_at / updated_at | Server-generated ISO timestamps |

The owner/update/id index orders lists; the owner/create index supports creation bounds. A single `INSERT ... SELECT ... WHERE` enforces both fewer than 20 existing projects and fewer than five successful creations in the rolling minute. A single owner/version-restricted UPDATE implements CAS. No count-then-insert race.

Both migrations were already applied to approved staging. This execution changes neither migration nor schema. Never overwrite applied migrations: `npm run auth:generate` writes an ignored candidate at `.tmp/auth-schema.sql` for review and a new migration if necessary.

## API contract

Metadata is `{id,name,version,createdAt,updatedAt}`. The session adapter returns `{userId,name} | null`; identity comes only from Better Auth.

| Endpoint | Request / response |
| --- | --- |
| GET /api/health | Public: `{ok:true,cloudEnabled}` |
| GET /api/me | `{user:{id,name}}` or 401 |
| GET /api/projects | Bounded `limit`/`offset`; `{projects:[metadata],nextOffset}`, no workspaces |
| POST /api/projects | `{name,workspace}` → 201 `{project:metadata}` |
| GET /api/projects/:id | `{project:{...metadata,workspace}}` |
| PUT /api/projects/:id | `{name,workspace,expectedVersion}` → updated metadata or 409 |
| POST /api/auth/sign-in/social | GitHub-only start, fixed same-origin callback |
| GET /api/auth/callback/github | Better Auth state/PKCE validation and code exchange |
| GET /api/auth/get-session | Minimized user/session metadata; no raw token/email/IP |
| POST /api/auth/sign-out | Better Auth session revocation |

Project errors use `{error:{code,message,...details},requestId}`. Meaningful statuses include 400 invalid JSON/workspace/envelope, 401 unauthenticated, 403 origin rejection, 404 missing or other-owner row, 405 unsupported method with Allow, 409 version/quota conflict, 413 oversized input, 415 unsupported framing, 429 creation throttling, 500 safe internal error and 503 unconfigured/unavailable cloud.

Every project query binds the verified owner; SQL uses prepared/bound values. The server never authorizes from a body owner or URL user ID. Missing and foreign IDs are indistinguishable. Mutations require exact Origin and JSON content type. Streamed body limits apply even without Content-Length: 1,050,000 project bytes, 16,384 auth bytes. Only supported auth endpoints are exposed; there is no production test identity or password endpoint.

## Workspace and UI behavior

Structural `parseWorkspace` validation accepts incomplete drafts; saving never requires a successful compile or scenario revalidation. Known v1 fields survive canonical storage, including positions, raw drafts, named scenarios, validation keys, receipt snapshots and provenance. Unsupported versions are rejected. Unknown extension keys are stripped by the existing schema; no forward-compatibility promise is made.

The cloud row ID never replaces `document.id`. Opening validates the returned workspace before replacement. The same validated inputs still feed the existing browser simulation.

The UI has GitHub sign-in/out, My projects, Save to cloud, Open and Save as new project. Device autosave retains its existing guest key and 500 ms lifecycle; cloud editing uses owner/project-scoped local slots. Cloud binding/version metadata stays outside the exported workspace. Guests can build, simulate, save locally and import/export without cloud configuration or an API request on initial load.

Cloud saves acknowledge only the snapshot confirmed by the API; later edits stay dirty. Failed/unknown outcomes preserve the local workspace and show a failure/unconfirmed status. A 409 offers Keep working locally, Save as new project, or Open cloud version after confirmation. There is no force write or automatic merge. Cancel performs no replacement/persistence side effect.

Generation/abort guards reject stale completions. Account changes detach the old cloud project and restore the guest draft; sign-out preserves scoped drafts. Better Auth 429 responses without a custom code map to `rate_limited`, reading numeric Retry-After or X-Retry-After. Conflict response metadata is unchanged.

## Local setup and checks

Use separate local GitHub OAuth credentials with callback `http://localhost:5173/api/auth/callback/github`. Ignored `.dev.vars` supplies `BETTER_AUTH_SECRET` (random, at least 32 characters), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`. Never put these in VITE variables, localStorage, source or logs.

```sh
npm ci
npm run types:worker
npx wrangler d1 migrations apply DB --local --config wrangler.local.jsonc
npm run build
# Separate terminals; browser uses 5173, API runs on 8787:
npm run dev
npm run dev:api
```

The Vite /api proxy preserves the canonical 5173 browser origin. A direct mutation claiming 8787 as Origin is intentionally rejected. Guest mode needs no auth credentials.

Final local verification:

| Command | Result |
| --- | --- |
| npm test | 97 tests, 10 files passed |
| npm run typecheck:worker | Generated binding types and Worker TypeScript passed |
| npm run typecheck:tests | Browser and Worker test source TypeScript passed |
| npm run build | TypeScript/Vite passed; existing upstream Zod annotation warnings only |
| npm run test:worker | 28 tests, 5 files passed |
| npm run deploy:check | Production-config dry run passed, no DB binding/cloud disabled |
| npm run test:e2e | 39 Chromium journeys passed |

CI runs npm ci, unit/Worker/test-source typechecks, build, Worker tests, dry run, and Chromium journeys. Build precedes Worker/browser tests because they serve real dist assets. No checks/tests were removed or weakened.

### What the acceptance test actually proves

`tests/cloud-worker-journey.spec.ts` launches the **production Worker** and built ASSETS in Wrangler's local harness with an isolated real D1. It creates test-only signed database sessions, not a deployed authentication override. No API requests are intercepted.

The test creates a named receipt-delay scenario through the UI, saves through POST, checks the actual SQL row/owner/workspace, signs out and confirms old-cookie revocation. A separate browser context with no shared localStorage and a separate session for that user lists and reopens the project. Exported workspace equality verifies nodes, edges, positions, document identity, scenarios, validation context and provenance; visible simulation output matches. It updates through PUT and confirms version 2. A second owner receives 404 on GET/PUT and an empty list, and the original row stays at version 2.

Other tests cover invalid/expired sessions, owner spoofing, quota concurrency, CAS concurrency, 1 MB SQL binding/overflow preservation, raw streaming bounds, malformed requests, methods/routing, corrupt stored JSON, incomplete drafts, sign-out/save races, late Open, account changes, failed saves, conflict cancellation/remote/copy, and all original demo journeys.

This is genuine local persistence/authorization proof. It does not prove GitHub code exchange in those synthetic browser contexts. Real GitHub sign-in is separately user-verified.

## Approved staging and production boundary

Existing approved staging: `https://domino-os-staging.tasty-kiwi.workers.dev`, D1 `75faa40c-c80c-4fd6-ab27-6dc8f6cc66e4` (EEUR), config `wrangler.staging.jsonc`. Only these existing resources may be deployed/verified under the user's prior approval. Use the matching staging GitHub callback. Existing secrets stay on the Worker. The integrated app was deployed there as Worker version `53a398e6-45e7-4156-a148-02d0064c2b41`; all nine public/anonymous/OAuth-start checks passed and the production deployment/version remained unchanged.

```sh
# Existing reviewed migrations; apply only with staging authorization:
npx wrangler d1 migrations apply DB --remote --config wrangler.staging.jsonc
npm run build
npx wrangler deploy --config wrangler.staging.jsonc
```

Do not rerun schema migrations merely to test requests. No new resources, remote migration, production secret, paid upgrade or production deployment is part of this execution. Staging deployment/version and safe HTTP smoke results are recorded in [staging evidence](STAGING_VERIFICATION.md).

The checked-in production Worker name remains `domino-os`, compatibility date and static routing are preserved, cloud remains disabled and no production D1 is bound. Branch previews explicitly disable cloud and omit D1. A branch push can trigger the existing cloud-disabled preview, not an authorized production rollout.

## Remaining limitations and final acceptance

- Live staging save/reopen/logout and cross-owner denial with **two real GitHub accounts** still need a tester's authenticated sessions. The shared browser reached GitHub's login screen; no credentials/session were available to complete that check. No user passwords or session cookies were requested or exported.
- GitHub sign-in worked in the user's own test; its exact tested build was not recorded. This remains valid user evidence, not automated proof for every later build.
- There is no delete, list rename, cloud autosave, sharing, collaboration, revision history, email/password account or advanced recovery UI.
- Creation quotas are MVP resource bounds, not comprehensive abuse prevention across multiple GitHub accounts.
- No fresh timing/reliability benchmark is claimed. Historical observations are retained without being reinterpreted as a passed test.
- Production rollout requires separate authorization and environment configuration.

**Gate A:** GitHub auth implemented; local real-library/D1 session, expiry and logout checks pass; real sign-in user-verified. **Gate B:** project API/owner/CAS/quota/validation pass. **Gate C:** full local built-Worker cross-browser persistence and second-owner denial pass; the two-real-account staging repetition remains open. **Gate D:** complete local suite passes. **Gate E:** changes remain on PR #5, never automatically merged.
