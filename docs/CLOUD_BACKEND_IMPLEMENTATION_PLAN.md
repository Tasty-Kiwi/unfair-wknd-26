# DominoOS cloud backend implementation plan

Status: **PLAN ONLY — implementation awaits approval.** Prepared 13 November 2026 after the required independent proposals, cross-examination, revised proposals, and an additional review of the user's email/password pivot. See [the discussion record](CLOUD_BACKEND_DESIGN_DEBATE.md).

Deadline: **14 November 2026, 20:00 Europe/Vilnius (18:00 UTC)**.

Acceptance: a user signs in, saves a supply-chain project to Cloudflare, and opens it in another browser; another user cannot read or overwrite it. This acceptance has **not** yet been demonstrated: no backend was implemented or deployed during planning.

## 1. Decision and approval boundary

Choose **Better Auth email/password authentication, database-backed sessions, and Cloudflare D1**, served by the existing `domino-os` Worker alongside its Vite assets. Keep local autosave and add explicit cloud create/list/open/update with optimistic concurrency. Simulation remains entirely in the browser.

This supersedes the original Clerk preference and the discussion's intermediate GitHub OAuth recommendation. The user confirmed that only the existing `workers.dev` URL is available, asked about Better Auth and email/password, and explicitly chose to defer email verification and password reset until after the hackathon. No OAuth apps, Clerk instance, SMTP provider, or owned domain are required by the selected P0.

Better Auth is a self-hosted authentication library. Its maintained hashing, session, cookie and CSRF implementation replaces neither with handwritten equivalents. We take responsibility for its configuration, migrations, runtime compatibility and updates. All three models conditionally accepted this change; none established that hashing fits this account's Worker CPU allowance.

**Hard gate:** benchmark the pinned library's actual bundled signup/login/wrong-password paths on an approved staging Worker in the actual Cloudflare account. Do not lower hashing security, introduce a production bypass, silently buy a plan, or switch providers if the gate fails. Stop and report the blocker. Keeping the public demo operational is a fallback, not completion of cloud-project acceptance.

Approval of this document authorizes only the work explicitly approved next. Creating databases, setting deployed secrets, applying remote migrations, pushing/merging a deployment-triggering branch, and deploying require their own applicable authorization. No such operations were performed for this plan.

## 2. Verified repository assessment

Remote `main`, local `main`, and the initial `origin/main` ref were verified at `0d7f2130251889871217ddddb6b0986f1855ebec`. The planning branch is `plan/cloud-backend`; it was created before any file edits. The working tree was clean initially. No `AGENTS.md` was found in the repository inventory.

| Contract | Observed implementation | Integration consequence |
| --- | --- | --- |
| `wrangler.jsonc` | `name: domino-os`, existing account ID, date `2026-11-12`, `workers_dev: true`, `previews: {}`, `./dist` SPA assets, logs and traces enabled; no entry point or DB | Preserve name/account/date/assets; introduce API dispatch and explicit preview isolation |
| `package.json` / lockfile | React 19, Vite 7, Zod 4, Vitest 4; installed Wrangler 4.161.0; npm scripts for tests/build/browser/dry run/deploy | Add pinned Better Auth; retain the existing checks and npm workflow |
| `vite.config.ts` | React and Tailwind plugins, `@` alias, tests limited to `src/tests/**/*.test.ts`; no API proxy | Add a small dev proxy and separate Worker test configuration |
| `src/main.tsx` | Lazy `/landing` versus `App`; no client router | No project URL/router required for cross-device My Projects |
| `src/App.tsx` | Builder is conditionally mounted from `builderOpen`; original simulator/import state remains in App memory | Cloud controls belong to the builder; preserve returning to the original simulator |
| `BuilderExperience.tsx` | Owns workspace and 500 ms autosave, local status, unreadable-storage protection, replace confirmation, import capture guard, `canvasSession` compiler reset | Integrate here through small hooks/components; preserve these guards |
| `types.ts` / `schema.ts` | Versioned workspace, structural Zod validation and duplicate node/edge/scenario checks | Reuse structural parsing server-side; accept incomplete drafts |
| `storage.ts` | Key `dominoos.builder.workspace.v1`; UTF-8 limit 2,097,152 bytes; parse/serialize and caught storage errors | Preserve file format, key and local limit; add separate cloud limits/context |
| `scenarios.ts` / `compiler.ts` | Validation keys and optional receipt relationship snapshots; document identity contributes to the network key | Never replace `document.id` with cloud ID or revalidate on the server |
| CI / Playwright | CI tests, builds, dry-runs deploy, then runs Chromium; browser suite starts Vite on 5173 or uses `DOMINO_BASE_URL` | Retain guest journeys; add runtime API and cloud journeys separately |

Executed against this checkout: **84 unit tests in 9 files passed; all 26 Chromium journeys passed; TypeScript/Vite build passed; Wrangler deployment dry run passed with no bindings**. Build emitted non-fatal upstream Zod annotation warnings. First browser attempts were blocked by the sandbox's local-port restriction, then a missing matching Chromium; after permission and installing Chromium into the ignored `.playwright-browsers` cache, the suite passed. These are local baseline results, not hosted CI, live authentication, D1 or deployed-backend proof.

The existing legacy JSON/CSV Dataset import and in-memory simulator state are distinct from builder workspace files. P0 saves **builder workspaces**, not arbitrary legacy datasets or exported simulation reports. Preserve existing public demo behavior and make the cloud action's scope clear.

## 3. Workspace persistence contract

Persist the complete canonical `BuilderWorkspaceV1`:

- `format: dominoos-builder-workspace`, `version: 1`.
- `document`: immutable document identity, name, raw `asOf`, business revision, ordered nodes and edges, positions and optional viewport.
- Node fields and BOM quantities remain raw strings, including blank/invalid/incomplete edits; nullable initial stock remains nullable.
- `scenarios`, `selectedScenarioId`, `workingScenario`, each scenario's `validatedNetworkKey`, optional `receiptSnapshots`.
- `source.origin` and `source.openedFromFile` unchanged.

Server calls `parseWorkspace` and canonical JSON serialization. Prefer the existing pure serializer if the Worker bundle/typecheck confirms it is suitable; its storage helpers must not access browser globals during module initialization. It currently validates and strips unrecognized keys, as does local export. **Preservation means all supported v1 fields and values, not byte-identical input formatting or a new unknown-key forward-compatibility promise.** Reject unsupported versions; do not migrate or change the file format in this project.

Do not call `compileGraph`, `parseScenario` against a compiled graph, or scenario revalidation to authorize saving. Structurally valid broken graphs, stale scenarios, missing references and incomplete fields remain saveable. Loading does not turn stale scenarios into validated ones. Existing browser validation still governs simulation.

Cloud project `id`, owner, saved version and timestamps live outside workspace JSON. `document.revision`, workspace format `version` and cloud row `version` are three different counters/contracts.

Cloud-specific limits:

| Item | P0 limit | Enforcement |
| --- | --- | --- |
| Canonical workspace JSON | 1,000,000 UTF-8 bytes | Client precheck and server after structural parsing |
| Project POST/PUT body | 1,050,000 bytes | Bounded stream reader before JSON parsing; early Content-Length rejection is only an optimization |
| Auth POST body | 16,384 bytes | Bounded reader before library handler; reconstruct the request correctly |
| Project name | Trimmed nonblank, at most 120 characters and 480 UTF-8 bytes | Shared request schema |
| Expected version | Positive safe integer | Shared request schema |

Do not trust Content-Length or count JavaScript code units. Cancel an over-limit stream. Reject unsupported content encoding. Check actual wire and canonical sizes separately. Use bound values, not JSON embedded in SQL text. D1's documented per-string/row ceiling is 2,000,000 bytes; the app's local 2 MiB ceiling is larger. The conservative cloud cap leaves metadata headroom. A cloud 413 leaves the original workspace and local/export limit intact. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

## 4. Authentication and security

Use one reviewed stable `better-auth` version with its React client (`better-auth/react`) and direct `database: env.DB`. Direct D1 support is documented since 1.5; no Drizzle, `better-auth-cloudflare`, JWT plugin or KV is needed. Pin the matching development `auth` CLI in the lockfile. Check package engines against CI's Node 22 and the repository's stated minimum before choosing the release. [D1 support](https://better-auth.com/blog/1-5), [Workers guide](https://better-auth.com/docs/guides/cloudflare)

Construct auth using explicit request environment/binding configuration, not mutable global request state. Pass a fixed `baseURL` and exact `trustedOrigins`; never derive trust from arbitrary Host, Origin or forwarded headers. Retain the current compatibility date; current Cloudflare docs enable Node compatibility for dates from `2026-08-04`, including this project's date. Verify installed Wrangler/workerd behavior rather than adding flags or upgrading dates speculatively. [Compatibility rules](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-compatibility-flag)

P0 auth configuration choices, to verify against installed types:

- Built-in email/password enabled; minimum 12, maximum 128 characters; unchanged library hashing parameters.
- `requireEmailVerification: false`; no email-sending hooks; `emailVerified` remains false.
- `autoSignIn: false`: signup returns a generic acknowledgement and the UI moves to Sign in. Do not automatically submit a synthetic signup user ID to the API or treat signup success as authentication.
- No social providers, account linking, email changes, user deletion, reset or verification routes exposed.
- Session lifetime 86,400 seconds; `disableSessionRefresh: true`; cookie cache disabled; no secondary session store. Test actual expiry and response headers.
- Database-backed auth rate limiting enabled explicitly in development/test and production. Initial rules: sign-in 10 attempts/minute/IP, signup 5/minute/IP; global auth ceiling 100/minute/IP. Review thresholds in the staging venue/NAT test without removing protection. These are cost/abuse controls, not a guarantee against distributed attacks.
- Use only platform-supplied `CF-Connecting-IP` on Cloudflare ingress. Do not trust arbitrary `X-Forwarded-For`; local tests supply a known test address without introducing an identity bypass.

Forward only this method/path allowlist to `auth.handler`:

| Method | Path | Responsibility |
| --- | --- | --- |
| POST | `/api/auth/sign-up/email` | Library signup; bounded body, Origin, persistent limiter, password hashing |
| POST | `/api/auth/sign-in/email` | Library login and session cookie |
| POST | `/api/auth/sign-out` | Library session revocation and cookie removal |
| GET | `/api/auth/get-session` | Minimal client session status; test response exposes no credential material |

All other auth paths return application JSON 404; wrong methods return JSON 405. Preserve library Set-Cookie and rate-limit headers. Never proxy application project requests through a server-side signup/login call: library `auth.api` calls bypass its HTTP limiter. For projects, call `auth.api.getSession({ headers: request.headers })` on **every protected request**, with cookie caching disabled, and derive owner solely from `session.user.id`. Missing/forged/expired/revoked session returns 401. No bearer JWT fallback or caller-provided identity. [Sessions](https://better-auth.com/docs/concepts/session-management), [rate limiting](https://better-auth.com/docs/concepts/rate-limit)

Cookie and request controls:

- Production cookie must be Secure, HttpOnly, SameSite=Lax and host-only (no Domain attribute or cross-subdomain cookies). Verify browser behavior, including clearing the same cookie on logout.
- Retain library CSRF/Origin checks. Project mutations additionally require exact same-origin Origin and JSON Content-Type; reject missing/cross-site/null Origin with 403 and unsupported media type with 415. GETs never modify project contents.
- Same-origin fetch with browser credentials; no wildcard CORS or credentialed cross-origin access. Private API responses use `Cache-Control: private, no-store` and are never inserted into a public Worker cache.
- Use `crypto.randomUUID()` for project IDs. Prepared statements everywhere. Every project SELECT/UPDATE restricts the verified owner. Unknown and foreign IDs have the same 404 body.
- No passwords, cookies, session tokens, hashes, request bodies, secret values or workspace payloads in logs/traces. Record request ID, route, status and timing only. Sanitize exception messages.

No-verification/recovery boundary, chosen by the user: an email is an **unverified login identifier**, not proof of mailbox ownership. Someone can register an address they do not own; no email-based linking, recovery or trust is allowed. Forgetting a password means losing access to that account's cloud projects. Signup must disclose this, and the existing workspace export remains available. Suggested concise copy: “Email verification and password reset are unavailable in this hackathon version. Keep your password and export a backup.”

Current library docs describe generic duplicate-email signup responses with `autoSignIn:false`; two agents disputed this. Verify the pinned HTTP behavior, including timing and error shape, and report any remaining enumeration exposure. Do not promise complete enumeration resistance. Generic invalid-credentials login messages are required. [Email/password behavior](https://better-auth.com/docs/authentication/email-password)

The earlier Workers password-resolution issue is **closed**, not evidence of a current broken release. Nonetheless, inspect the selected bundle and benchmark signup, valid login, wrong password, unknown email, and limited requests. Workers Free documents 10 ms CPU/request; Paid has a different allowance. Account plan and hash CPU are unknown. No weakening hashes or unauthorized spending. [Closed issue](https://github.com/better-auth/better-auth/issues/9649), [Worker limits](https://developers.cloudflare.com/workers/platform/limits/)

## 5. Worker architecture and routing

Use a small module Worker under `worker/`, with native Request/Response handlers. No routing framework is needed for these routes. Proposed configuration fragment, **not an applied edit**:

```jsonc
{
  "name": "domino-os",
  "main": "worker/index.ts",
  "compatibility_date": "2026-11-12",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api", "/api/*"]
  }
}
```

Keep existing account ID, `workers_dev`, observability and deployment commands. Dispatch exact known API routes before anything else. Bare `/api`, `/api/`, malformed/extra path segments and unknown API routes return JSON 404, including with `Sec-Fetch-Mode: navigate` or `Accept: text/html`. Do not pass any API miss/error to ASSETS. Use 405 plus Allow for wrong methods on known routes. No HEAD/OPTIONS shortcut should create a write; define their 405 response and test HEAD's no-body HTTP semantics. Non-API requests may fall back to `env.ASSETS.fetch(request)`; retain `/landing`, `/`, asset serving and SPA behavior.

Array Worker-first routing is documented and avoids the SPA navigation-to-HTML trap without running the Worker first for all static assets. [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/), [ASSETS API](https://developers.cloudflare.com/workers/static-assets/binding/), [fetch handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/)

## 6. D1 schema and migrations

One database per deployed environment. Production has six application tables, **not six databases**:

| Table | Justification |
| --- | --- |
| `user` | Better Auth's stable account identity and unverified email metadata |
| `session` | Expiring/revocable library sessions |
| `account` | Credential account/password hash storage managed by the library |
| `verification` | Core library schema; retain generated contract even though P0 sends no verification/reset emails |
| `rateLimit` | Shared auth-attempt limits across Worker isolates |
| `projects` | Private versioned workspace persistence |

Wrangler also maintains its own migration ledger. These additional auth tables are the deliberate cost of replacing managed Clerk identity with self-hosted Better Auth. No duplicate profile table, custom credentials schema or node/edge normalization.

Migration order: `migrations/0001_auth.sql` from the pinned SDK/CLI including database rate limits, then `migrations/0002_projects.sql`:

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
  workspace_json TEXT NOT NULL
    CHECK(length(CAST(workspace_json AS BLOB)) <= 1000000),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX projects_owner_updated
  ON projects(owner_id, updated_at DESC, id);
```

Keep auth-generated identifiers/types/indexes intact. P0 has no user deletion; omit a handwritten dependency on its generated table naming in the projects migration. A future account-deletion feature must explicitly handle project retention/deletion. Timestamp strings are server-generated UTC ISO dates, not client clocks.

Schema generation is an early gate: the CLI cannot directly import a live request's D1 binding. Use a generation-only configuration with the same auth options and an empty local SQLite connection supported by the selected SDK (for example Node's `DatabaseSync`, with its version/flag checked). It emits SQL; review it, apply with Wrangler to fresh local D1, and prove the real native D1 runtime can signup/login/rate-limit. A local Wrangler proxy for generation is another tooling option if supported; do not claim it is already working. No runtime migration endpoint, request-time schema creation or remote `auth migrate`. [Schema/CLI guidance](https://better-auth.com/docs/concepts/database), [CLI options](https://better-auth.com/docs/concepts/cli), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)

## 7. Shared API specification — freeze before parallel implementation

All application responses are JSON; errors use `{ "error": { "code": "...", "message": "..." }, "requestId": "..." }`. Times are UTC strings. Project metadata is `{ id, name, version, createdAt, updatedAt }`; no owner or auth credential fields are required in responses.

| Method/path | Input | Success | Access |
| --- | --- | --- | --- |
| GET `/api/health` | None | 200 `{ ok: true, cloudEnabled: boolean }` | Public liveness only, no DB/secrets diagnostics |
| GET `/api/me` | Session cookie | 200 `{ user: { id, name } }` | 401 without valid session |
| GET `/api/projects?limit=50&offset=0` | Bounded integers: limit 1..50, offset 0..10000 | 200 `{ projects: ProjectMetadata[], nextOffset: number|null }` | Owner metadata only |
| POST `/api/projects` | `{ name, workspace }` | 201 `{ project: ProjectMetadata }`, Location header | Owner from session; server UUID, version 1 |
| GET `/api/projects/:id` | UUID path | 200 `{ project: { ...ProjectMetadata, workspace } }` | Owner only; else 404 |
| PUT `/api/projects/:id` | `{ name, workspace, expectedVersion }` | 200 `{ project: ProjectMetadata }` | Owner and version must match |

List order is `updated_at DESC, id ASC`; fetch limit+1 metadata records to determine nextOffset. Offset pagination can shift during edits; acceptable for P0 with refresh, not a snapshot guarantee. No full workspaces in list responses. Strictly validate envelope keys so a forged `owner_id`/`userId` is rejected with 400 and cannot affect ownership. Workspace nested unknown-key handling stays consistent with the current schema.

PUT uses one atomic statement:

```sql
UPDATE projects
SET name = ?, workspace_json = ?, version = version + 1, updated_at = ?
WHERE id = ? AND owner_id = ? AND version = ?;
```

On one changed row, return that save's version `expectedVersion + 1` and its server timestamp; do not SELECT a later concurrent workspace as if this request saved it. On zero changes, owner-restricted SELECT of version/timestamp: no row means 404; owner row means 409 with `currentVersion` and `updatedAt`. No unconditional update or retry using the returned version. D1 does the comparison, not a read-then-write in JavaScript. [Bound D1 statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)

| Error | Meaning / client action |
| --- | --- |
| 400 | Malformed JSON, invalid envelope/name/version, unsupported workspace format/version, invalid workspace structure |
| 401 | Missing/invalid/expired/revoked session; retain local work and request sign-in |
| 403 / 415 | Origin rejected / content type rejected |
| 404 / 405 | Missing or foreign project / unsupported method |
| 409 | `version_conflict`; preserve local edits and require a deliberate resolution |
| 413 | `payload_too_large`; include safe numeric limits, suggest local export |
| 429 | Auth attempt limit; respect the library retry header and show retry feedback |
| 500 | Unexpected internal error; safe message, request ID, no stack |
| 503 | Cloud feature unconfigured/disabled or service unavailable; guest/local path continues |

Do not transparently retry POST after a timeout: the server might have committed before the response was lost. Explain that save confirmation was not received, refresh My Projects to check, and allow an explicit new copy. A timed-out PUT may similarly have succeeded; keep the old client version/dirty state and let a later GET/409 reconcile. Request aborts do not prove server rollback.

## 8. Frontend and local/cloud state

Add one lazy account/projects area using existing Button/Dialog/Alert primitives. Preserve Build and Simulate modes. Signed out: Sign in / Create account, Continue locally, existing device save and export. No full dashboard or route library. Cloud UI failure must not unmount the builder or delay the public app behind an auth-loading screen.

Account form: email, password, plus required library signup name supplied as a neutral `DominoOS user` default (no profile feature). Use email/new-password/current-password autocomplete correctly, allow paste/password managers, accessible labels and busy/error announcements. Clear password values after completion/closing; never persist them. Signup acknowledgement leads to a separate Sign in form. No reset/verification UI pretending to work.

My Projects: metadata list, explicit Open, Save current as new project, Save to cloud, Save as new/copy, Sign out. Initial project name comes from `document.name` or `Untitled project` in a required editable name input; it is cloud metadata and does not rewrite the document. First complete the vertical slice before list polish.

Keep two independent status channels:

- Device: existing saving/saved/error behavior.
- Cloud: local only; unsaved cloud changes; saving; saved to cloud with version/time; failed/unconfirmed; conflict. A local save is never cloud confirmation.

Store cloud context outside v1: `{ ownerId, projectId, version, name, acknowledgedSnapshot }`. Track workspace changes including scenario changes, viewport and positions, not `document.revision` alone. Use canonical serialized equality against the acknowledged snapshot; do not promise a clean cloud state for edits made during a save.

### Guest and account isolation

Preserve `dominoos.builder.workspace.v1` as the guest device draft. A cloud project uses an owner/project-scoped key such as `dominoos.builder.cloud-draft.v1:<ownerId>:<projectId>` through a small Storage facade passed to the existing storage helpers; maintain the same 500 ms autosave behavior and v1 validation. Before adopting a newly created cloud ID, synchronously save the latest draft into its scoped slot; the existing guest draft remains recoverable.

Cloud metadata/recovery descriptors are separate, owner-tagged records. No passwords, cookies or session tokens in localStorage. P0 does not automatically bind cloud IDs after reload: startup shows the guest draft; after authentication, My Projects offers explicit recovery of that owner's saved local cloud draft versus fetching the remote workspace. A recovered draft is cloud-dirty until a fresh owner-authorized GET establishes the current version; never overwrite remote using an unverified cached version.

Cancel pending autosave timers before changing storage context. Each timer captures both its workspace and its original target slot; it must never write an account workspace into the guest key or another account's slot after a transition.

Changing accounts invalidates cloud context and pending requests; B never automatically opens A's cached cloud workspace. Sign-out first flushes A's local cloud draft, clears cloud state/requests, calls the real library sign-out, and restores the guest workspace. Do not delete local records. If logout cannot reach the server, stop cloud requests locally, report that server sign-out is unconfirmed, and do not claim its session was revoked. Explicit re-entry into cloud features must recheck the server session. Local storage is device data, not encrypted account storage; backend privacy is enforced by sessions and D1 owner queries.

If the final local flush fails, do not discard that workspace while restoring guest state. Retain a detached recovery snapshot, surface the storage error and offer the existing JSON export before dismissing it. Session revocation can proceed independently; the recovery snapshot must never become B's active project. Keep the unload warning until that data is exported/persisted or the user explicitly discards it.

### Open and race safety

1. Capture owner, active context, operation sequence and edit generation. Confirm replacement when meaningful local work or unsaved cloud changes exist, even if already autosaved locally.
2. Flush current draft to its context slot. If backup persistence fails, block replacement until the user exports or explicitly accepts discarding the current draft. Do not overwrite an unreadable saved draft automatically.
3. Fetch target, require JSON and validate the envelope/workspace before any replacement.
4. Recheck identity/context/operation/edit generations immediately before applying. If any changed, cancel/stay or ask again; never apply an old response over new edits.
5. If a divergent scoped local draft already exists for the target, offer recovering it or explicitly replacing it with fetched data. No background autosave may overwrite that draft before the decision.
6. Apply through the existing replacement lifecycle: increment `canvasSession`, reset selection/compare/view, preserve workspace source/document IDs/scenarios, and establish cloud ID/version/acknowledged snapshot.

One cloud save in flight per active context; disable duplicate submissions. Saves capture a snapshot plus owner/context/version. Success acknowledges that snapshot only; later edits remain dirty. Project/account changes invalidate all older completions with operation generations and AbortController. The same guards apply to lists, opens, account callbacks and errors. Cross-tab edits may still conflict, so D1 CAS remains authoritative.

409 P0 choices: **Keep editing locally** (default), **Save as new project**, or **Open cloud version** through the same confirmed/backup-safe Open flow. No force overwrite, auto-merge or automatic adoption of `currentVersion`. Haiku preferred deferring the third action; reuse of the required safe Open flow is the coordinator's bounded choice.

## 9. Development, configuration and deployment

Keep Vite guest development unchanged. Add `/api` proxy to a separately running local Wrangler Worker on 8787; preserve the browser-visible Origin and configure `BETTER_AUTH_URL`/trustedOrigins for 5173. No Cloudflare Vite plugin before the deadline: the official integration is supported but would alter the established dev/build/test path. Built-assets `wrangler dev --local` is the integration fallback. [Local development](https://developers.cloudflare.com/workers/local-development/), [Vite integration](https://developers.cloudflare.com/workers/vite-plugin/get-started/)

| Environment | D1 / auth | Rule |
| --- | --- | --- |
| Local | Local D1 state, local-only development secret | `--local`, `remote:false`, shared persist directory; no Cloudflare login needed for local data |
| Test | Fresh temporary D1 plus test-only verifier entry or real library test accounts | No production IDs/secrets; no test identity switch in deployed code |
| Staging | Dedicated `domino-os-staging` Worker and D1 via `env.staging` | Separate secret and URL, synthetic accounts/projects only |
| Production | Existing top-level `domino-os` Worker plus `domino-os-projects` D1 | Explicit approval, remote migrations before deployment |
| Branch previews | Explicit `previews.d1_databases: []`, preview `CLOUD_ENABLED:false`, no usable auth config | Guest only; verify actual resolved config/bindings before any preview upload |

Do not assume empty `previews:{}` or `preview_database_id` isolates branch builds. Current docs provide `previews.d1_databases`; shared database IDs share data. Named staging does not retarget automatic branch previews. Assert removal of production DB and disabled auth in resolved configuration; if removal cannot be proved, stop preview deployment until separately isolated. [Preview isolation](https://developers.cloudflare.com/workers/previews/resources/)

Required configuration:

| Setting | Type / supplier |
| --- | --- |
| `DB` | D1 binding with explicit per-environment database ID; Cloudflare release owner creates after approval |
| `BETTER_AUTH_SECRET` | High-entropy secret, at least 32 characters; distinct local/staging/production values, library-supported generation; secret store only |
| `BETTER_AUTH_URL` | Public fixed browser-facing origin: production `https://domino-os.tasty-kiwi.workers.dev`, local 5173 or direct 8787, staging actual URL |
| `CLOUD_ENABLED` | Explicit feature availability; false never bypasses auth, only refuses cloud endpoints |
| Trusted origins | Exact environment-specific origins derived from reviewed config, not wildcard siblings |
| Cloudflare build/deploy credential | Existing deployment system's credential; release owner verifies it can deploy and perform separately authorized migrations |

No frontend secret or publishable key is needed. Existing `.env*` and `.dev.vars*` ignore rules protect local configuration. Examples contain names/placeholders only. Do not run a provisioning CLI wizard during planning or let missing resource IDs trigger automatic provisioning during implementation.

**Planned local commands** (scripts/files below do not exist yet):

```sh
npm ci
# One-time after approval: add reviewed exact better-auth and matching auth CLI versions.
# auth:generate uses local pinned CLI, shared auth options, generation-only SQLite config.
npm run auth:generate
npx wrangler d1 migrations apply DB --local --env staging --persist-to .wrangler/state
npx wrangler types
npm run build
# Terminal A: frontend guest/HMR plus same-origin API proxy
npm run dev
# Terminal B: local API, local D1 only
npx wrangler dev --local --env staging --port 8787 --persist-to .wrangler/state
# Built-assets integration alternative: use 8787 directly, with auth URL set to 8787.
```

The generation script should invoke the pinned `auth generate --config scripts/auth-schema.ts --output migrations/0001_auth.sql` against an empty supported SQLite connection, not a production database. Node SQLite/version/CLI loading is a proof item in Gate A, not a command claimed to work already. Review generated SQL before applying. A rerun must not overwrite reviewed migration history.

**Planned verification commands:**

```sh
npm test
npm run test:worker
npm run build
npm run deploy:check
npm run test:e2e
# Against a separately started built local Worker with isolated data:
DOMINO_BASE_URL=http://localhost:8787 npm run test:e2e
```

Use Wrangler's installed `createTestHarness()` for isolated workerd/D1 integration from Vitest; its API exists in installed 4.161.0. Keep existing Vite tests intact and add a separate `vitest.worker.config.ts`/script. Test-only identity adapters belong under tests and a test-specific entry/config, never runtime environment flags. Exercise the real auth HTTP handler separately. [Test harness](https://developers.cloudflare.com/workers/testing/test-harness/get-started/)

**Remote commands — reference only, do not run without approval**:

```sh
# Verify authenticated account and permissions first.
npx wrangler whoami
npx wrangler d1 create domino-os-projects
npx wrangler d1 create domino-os-projects-staging
# Bind the returned IDs explicitly, then configure each environment.
npx wrangler secret put BETTER_AUTH_SECRET --env staging
npx wrangler d1 migrations apply DB --remote --env staging
npm run build
npx wrangler deploy --env staging
# After staging gates and separate production approval:
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler d1 migrations apply DB --remote
npm run deploy
```

`secret put` itself changes a deployed Worker version; coordinate it as a deployment action. Set nonsecret URL/availability variables consistently in config. Existing Workers Builds should continue `npm run build` and `npx wrangler deploy`; explicitly arrange approved migrations beforehand. Do not add remote migrations or deployment credentials to the verification-only GitHub CI job. Confirm dashboard configuration/current build triggers before pushing or merging. This plan verified repository deployment config, not the live dashboard state. Database migrations/data do not roll back with Worker code.

## 10. Three-developer ownership and sequence

Freeze section 7 plus the `verifySession(request, env) -> {userId,name}|null` interface and canonical serializer/limits **before parallel edits**. Developer A owns shared contract files; B and C review them immediately. Integrate short patches at each gate rather than maintaining incompatible branches.

| Owner | Exclusive implementation files / responsibility | Dependencies |
| --- | --- | --- |
| A — backend/integration | `worker/index.ts`, `worker/projects.ts`, `worker/http.ts`, `src/lib/cloud/contracts.ts`, `migrations/0002_projects.sql`, `wrangler.jsonc`, `vite.config.ts`, Worker tsconfig/types, `vitest.worker.config.ts`, backend tests, CI, package.json/lockfile | B's verifier/auth-handler interface; C's client contract review |
| B — authentication | `worker/auth.ts`, shared auth options, `scripts/auth-schema.ts`, `migrations/0001_auth.sql`, `src/lib/auth-client.ts`, `src/components/account/AccountControls.tsx`, real-auth HTTP tests | A integrates B's dependency/script/type requests; approved staging resources for CPU gate |
| C — product integration | `src/lib/cloud/client.ts`, `src/lib/cloud/drafts.ts`, cloud save-state hook, project dialog, BuilderExperience integration, relevant CSS, frontend/browser tests, README/config examples | Frozen API; B's account controls/client interface |

`BuilderExperience.tsx` has one editor (C). `App.tsx`/`main.tsx` need changes only if C demonstrates a minimal lazy integration need; C owns them. Existing schema/storage/compiler/scenario/simulation files stay unchanged unless a proven packaging need requires a reviewed narrow edit. C can provide a Storage facade without changing the fixed-key storage functions. B does not edit package.json concurrently: send exact dependency/script requirements to A. No independent developer silently deploys, edits main or alters resource bindings.

### First vertical slice, before polishing My Projects

1. A wires API/static routing and local D1; B proves SDK schema, signup/login/session/logout and the persistent limiter. C builds account form plus a minimal save/open control against the frozen contract.
2. Create an account, sign in, open the existing builder with nodes and a named scenario, save its current workspace as a cloud project, record returned ID/version.
3. Sign out; verify server session revocation and preserved guest/account-local drafts.
4. Sign in again in a **fresh browser context with no shared localStorage**, list/open the same project, and assert nodes, raw draft values, positions, viewport, scenarios and validation/provenance context.
5. Use a second account: its list excludes the project; direct GET/PUT of the known ID return 404 and leave the first account's row unchanged.

Only then complete update/conflict/error states and list usability. No project-list polish before this slice works.

## 11. Strict verification and evidence

| Requirement | Repeatable automated proof | Live proof after approval |
| --- | --- | --- |
| 1. Unauthenticated endpoints | All project endpoints + `/api/me` return 401 without session | Fresh private browser |
| 2. Valid create/list | Real handler auth tests and test-adapter D1 tests; metadata-only list | Account A creates/lists |
| 3–4. Cross-owner read/write | Known A ID requested by B gives same 404 as missing; check A row unchanged | Two independent real accounts |
| 5. Invalid/expired credentials | Forged opaque session cookie, expired/deleted row, sign-out cookie replay -> 401; bearer/userId alone never authenticates | Sign out then retry old session in controlled smoke |
| 6. Forged identity | Envelope owner fields rejected; query/body identity cannot replace verifier identity | Direct negative HTTP request, synthetic data |
| 7–8. Invalid/versioned workspace | Malformed JSON, format/version mismatch, duplicate keys, invalid structure rejected; incomplete raw drafts accepted | Import/save representative draft |
| 9. Size limits | Canonical 1,000,000 boundary and +1, wire 1,050,000/+1, Unicode, absent/false Content-Length, chunked/cancelled body; no project write after rejection | Maximum-size synthetic save in staging |
| 10. Full restore | Equality of supported v1 fields, old files without snapshots, same-ID/same-revision changed payload resets compiler | Fresh-browser reopen and simulation |
| 11. CAS | Two concurrent PUTs at v1: exactly one 200 v2, one 409; A/B ownership failure stays 404 | Two tabs/devices, verify no lost update |
| 12. Failure/timeout | Offline, abort, invalid server response, 500/503, response lost after commit; local content remains, no false saved badge | Disconnect while editing/saving |
| 13. Logout/account switch | Owner-scoped autosave, revocation, failed logout message, stale open/save/session completion ignored | A -> guest -> B -> A |
| 14. Public demo | Auth config missing/API offline/script failure; landing/demo/build/simulate/import/export remain usable | Production URL signed out |
| 15. Existing regressions | All 84 baseline unit tests and all 26 browser journeys plus build/dry run retained | Production demo walkthrough |

Additional real-library auth tests: password bounds, invalid-credentials error, stored value is a library password hash, cookies carry correct flags, no credential-bearing response/log, duplicate signup behavior, Origin/CSRF failures, auth allowlist, database-backed 429 across separate instances/concurrent requests, correct rate-limit short circuit before hashing, no resets/linking/email-change access. Test NAT behavior so a small group can sign in during a venue demo. Avoid claiming an exact distributed-attempt bound unless measured.

Use a factory-injected **test-only** verifier for repeatable owner/API tests against real local D1; do not mock D1 CAS/SQL as the only authorization proof. Also run real Better Auth signup/session/revocation through HTTP with an isolated database. Mocks prove application authorization logic, not live password/cookie security. Test deployed routing with navigation headers against built assets, not Vite's proxy alone. Run the 1 MB bound-parameter save rather than inferring it from SQL text limits.

Live staging gate uses two real accounts controlled by testers, synthetic workspaces, another browser/device, actual hashing CPU logs, denied cross-owner attempts, expiry/logout and network failure. Record Worker version, migration state, account plan, sample count, CPU p50/p95/max and any limit errors; 20 representative attempts plus a limited concurrent burst is an initial check, not a load/security audit. Production smoke repeats the acceptance with fresh synthetic accounts and public guest journeys after explicit deployment approval. If credentials/authorization are absent, leave live acceptance unverified; never replace it with mocked claims.

## 12. Effort, checkpoints and deferred work

Planning allowance: **30–44 person-hours, approximately 14–20 focused elapsed hours with three developers**, including integration and verification. Estimates are uncertain: Luna's revised estimate was 20–30 person-hours, Haiku around 30 with a pessimistic viability assessment, and Hydrogen proposed roughly 18 elapsed hours. External setup/approval waits are additional. Near 16:05 Vilnius on 13 November there were about 28 hours until the user deadline; this is a tight conditional plan, not a delivery guarantee.

| Gate | Stop/go evidence |
| --- | --- |
| 0 — before implementation | User approves this plan and email/password/no-recovery boundary; freeze API/file ownership |
| A — first 2–3 focused hours | Pinned package engines/bundle, six-table schema and fresh local migrations, real auth HTTP login/logout/session/rate-limit tests; identify account plan and approve any staging resource operations |
| B — before full cloud UI, target T+4h | Approved staging signup/login/wrong-password CPU under actual plan, shared limiter and cookies pass; no hash weakening/unauthorized plan upgrade; preview isolation proven |
| C — target T+8h | First vertical slice works in fresh contexts, second-user isolation passes |
| D — target T+12–16h | Update CAS, size/error/recovery/async guards, full baseline and cloud suites pass; review complete diff |
| Release freeze — 14 Nov 16:00 Vilnius | Staging acceptance green, production configuration/migrations/deploy explicitly authorized; leave four hours for production smoke/fallback |
| Final acceptance | Production same-project cross-browser open and denied second-user GET/PUT observed; guest demo still works |

A failed gate stops cloud rollout and triggers a concrete report. Ship the working local demo if necessary, but report the cloud acceptance criterion as unmet. No spontaneous provider migration, handwritten crypto, reduced hash cost or deadline-driven auth bypass. Existing preview/production data must not be used for destructive tests.

P1 only after P0: delete project, list rename, automatic cloud autosave, richer conflict comparison/merge UI. Deferred beyond this hackathon: verification and password recovery/email delivery (explicit user choice), OAuth, teams/roles/sharing/templates, real-time collaboration, revision history, attachments, billing/notifications, additional services, normalized node tables and simulation changes. Verification/recovery becomes a prerequisite before promoting this limited account product for broader use.

Remaining disagreements: auth hashing feasibility is unmeasured; rate thresholds trade venue NAT access against abuse protection; Haiku was substantially more pessimistic about scope and preferred fewer conflict actions; models differed on auth schema tooling and whether to pivot providers at a failed gate. Coordinator resolution: narrow safe Open reuse, explicit CPU/schema gates, bounded persistent limiting, and **stop/review rather than automatic provider pivot**. See the full decision history in the debate document.
