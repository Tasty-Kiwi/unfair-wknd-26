# DominoOS cloud backend implementation plan

Status: **Staging deployed; real GitHub sign-in user-verified; project acceptance and Free CPU tail remain under verification.** The email/password CPU gate failed; the approved isolated probe was deleted and cleanup confirmed. The user then explicitly chose GitHub authentication. Better Auth now disables password endpoints and uses GitHub OAuth with database-backed sessions. Local verification: 91 unit tests, 12 Worker/runtime tests and 32 Chromium journeys pass; typecheck/build/dry-run pass. Remote D1 creation/migrations and unauthenticated API/OAuth-start checks are verified. The user subsequently confirmed real GitHub sign-in worked during testing. Browser logout, authenticated cross-browser saving, live second-account isolation and the Free-plan CPU gate remain unverified. [CPU evidence](AUTH_CPU_CHECK.md), [GitHub setup/runbook](GITHUB_AUTH_SETUP.md). The original discussion remains historical in [the discussion record](CLOUD_BACKEND_DESIGN_DEBATE.md).

PR #5 re-review follow-up: the review targeted the documentation-only commit `3ce7839`. At the user's request, implementation continues on the same `plan/cloud-backend` branch and PR #5; the local implementation commits previously held on `feat/cloud-projects` were advanced onto that branch without a new merge commit. No PR was merged. The current change includes the Worker API, D1 migrations, GitHub sign-in, quota/throttling and simple project controls. The runtime concern remains open: the latest staging sample exceeds Free's request CPU allowance, and real-account acceptance is not established. See [staging measurements](STAGING_VERIFICATION.md).

Review changes: pin Better Auth and its CLI to **1.7.22**; check the actual account plan before project UI work; cap each account at **20 projects**, with at most **5 successful creations per minute**; keep the interface to Sign in, My Projects, Save to Cloud and Open Project, plus Sign out. GitHub handles account registration and recovery; DominoOS has no password form. Conflicts offer only Keep working locally and Save as new project. Estimates are not acceptance gates.

The user requested this implementation split: **Gemini 4 Hydrogen — backend architecture; Claude Haiku 5.5 — simple UI design; GPT-6 Luna — verification and integration.** The coordinator owns shared configuration, dependencies and the feasibility/release gates. No repeat of the architecture debate is needed.

Deadline: **14 November 2026, 20:00 Europe/Vilnius (18:00 UTC)**.

Acceptance: a user signs in, saves a supply-chain project to Cloudflare, and opens it in another browser; another user cannot read or overwrite it. This full acceptance has **not** yet been demonstrated. Implementation and an isolated staging deployment now exist, and the user confirmed real GitHub sign-in worked. Cross-browser project restoration and live second-account isolation remain open.

## 1. Decision and approval boundary

Choose **Better Auth GitHub OAuth authentication, database-backed sessions, and Cloudflare D1**, served by the existing `domino-os` Worker alongside its Vite assets. Keep local autosave and add explicit cloud create/list/open/update with optimistic concurrency. Simulation remains entirely in the browser.

This supersedes Clerk and the later email/password proposal. Only `workers.dev` is available and the user requires Workers Free. The default password path measured well above Free's 10 ms budget. The user's later instruction, “If email and password doesn't work, let's just do GitHub auth then,” authorizes this provider pivot. No owned domain, password form, password hashing or email service is required. A GitHub OAuth application and its server credentials are required.

Better Auth manages OAuth state, code exchange, sessions, cookies and CSRF checks. Project ownership remains the stable internal `session.user.id`; GitHub email is not an authorization key. Account linking is disabled. Simulation remains in the browser.

**Hard gate:** prove real GitHub login/logout, private project save/load, cookies, and deployed CPU on an explicitly approved isolated Worker/D1 setup in this Free account. Removing password hashing removes the measured bottleneck; it does not establish that all OAuth/project request paths fit 10 ms. No paid upgrade, auth bypass, weakened hashing or further provider switch without user direction. The public demo remaining available is not completion of cloud-project acceptance.

Approval of this document authorizes only the work explicitly approved next. Creating databases, setting deployed secrets, applying remote migrations, pushing/merging a deployment-triggering branch, and deploying require their own applicable authorization. The later user approval covered only the isolated CPU probe, its generated secret, telemetry reads and deletion; those operations are complete. The user subsequently approved staging creation, migrations, secrets and deployment; these have now been performed for `domino-os-staging` only. Production remains unchanged and unapproved. See [staging evidence](STAGING_VERIFICATION.md).

## 2. Verified repository assessment

Remote `main`, local `main`, and the initial `origin/main` ref were verified at `0d7f2130251889871217ddddb6b0986f1855ebec`. The branch is `plan/cloud-backend`; it was created before any file edits. Implementation was temporarily isolated on `feat/cloud-projects`, then returned to the original PR branch following the user's re-review instruction. The working tree was clean initially. No `AGENTS.md` was found in the repository inventory.

Implementation follow-up: commit `7756bc1` contains the backend/UI/tests. Merge `ce8568a` integrates `origin/main` at `907ba400d0ae6ece4694bb36e02181deef84b1b5` (PR #6). Integrated local checks passed: 91 unit tests, 12 Worker tests, 32 Chromium journeys, Worker typecheck, build and deployment dry run. CI now builds assets before Worker routing tests; schema generation writes an ignored candidate rather than overwriting migration history. A subsequent startup-only auth initialization change passed typecheck/unit/Worker checks and was deployed only to approved staging; see [current staging evidence](STAGING_VERIFICATION.md).

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

Pin **`better-auth@1.7.22`** and the generation CLI **`auth@1.7.22`**, direct `database: env.DB`. The official changelog and installed types were checked; do not substitute older tutorial code. No custom OAuth/session implementation, Drizzle, KV or JWT plugin. [Workers guide](https://better-auth.com/docs/guides/cloudflare), [GitHub provider](https://better-auth.com/docs/authentication/github)

Configure auth from the request environment using a fixed `BETTER_AUTH_URL`, a high-entropy `BETTER_AUTH_SECRET`, and server-only `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`. Exact trusted origin, host-only cookies, production Secure + HttpOnly + SameSite=Lax. Current compatibility date is preserved and generated runtime types are used.

- Email/password is disabled; signup, login/password, reset, email verification, email changes and deletion routes are not exposed.
- GitHub's default identity scopes are `read:user` and `user:email`, confirmed in installed provider source. Do not request repository or organization access. The provider fetches private email metadata when needed; no guessed email fallback or email-based ownership.
- GitHub provider handles authorization-code exchange. Better Auth generates state/code verifier, validates the callback and creates the D1 session. Application code does not construct OAuth state or accept arbitrary provider tokens.
- Session lifetime 86,400 seconds, refresh disabled, cookie cache disabled. `auth.api.getSession({ headers })` runs on every protected request. Revoked/expired/forged cookies yield 401; no production test identity mode.
- Encrypt provider tokens at rest using the library option; disable explicit and implicit account linking. No GitHub API actions beyond sign-in.
- Database-backed rate limiter: global 100 requests/minute/IP; OAuth starts 10/minute/IP; callbacks 20/minute/IP. Use only Cloudflare's `CF-Connecting-IP`. Test venue/NAT behavior without disabling abuse controls.
- Missing DB, URL, secret or GitHub credentials yields 503; health reports cloud disabled. Guest editing does not depend on GitHub or D1. Provider/network failures leave the current workspace intact and do not create a fake session.

Expose only:

| Method | Path | Responsibility |
| --- | --- | --- |
| POST | `/api/auth/sign-in/social` | Bounded JSON, exact same-origin Origin, provider restricted to GitHub, fixed safe return URLs; library OAuth start |
| GET | `/api/auth/callback/github` | Cross-site navigation allowed; library state validation/code exchange; safe same-origin return |
| POST | `/api/auth/sign-out` | Library session revocation and cookie clearing; exact Origin |
| GET | `/api/auth/get-session` | Minimal session status with credential fields removed |

The sign-in envelope rejects arbitrary scopes, `idToken`, `accessToken`, other providers and arbitrary return URLs. The fixed success URL is `/?builder=1`; errors return `/?builder=1&authError=1`. Callback GET must not require a same-origin Origin header: navigation comes from GitHub. OAuth state checking remains mandatory. Unknown auth paths return JSON 404; wrong methods 405. Preserve library Set-Cookie and limiter headers.

Project mutations additionally require exact same-origin Origin and JSON Content-Type. No permissive CORS. All private responses use `Cache-Control: private, no-store`. Every project query includes the authenticated owner; foreign IDs and missing IDs both return 404. Prepared statements and server-generated UUIDs only. No passwords, cookies, OAuth codes/state values, tokens, secret values or workspace data in application logs; no raw stack traces to clients.

Local runtime tests prove state URL creation, callback rejection, database session verification/revocation and project authorization/CAS/limits. They use test-only seeded D1 sessions, a maintained signed-cookie helper, and test OAuth credentials. They **do not** prove a real GitHub authorization or production cookie/CPU behavior. See section 11 and the runbook for remaining live checks.

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
| `user` | Better Auth's stable internal user identity and GitHub profile metadata |
| `session` | Expiring/revocable library sessions |
| `account` | GitHub provider account identity and encrypted OAuth tokens managed by the library |
| `verification` | Core library schema, including OAuth state; no verification/reset emails |
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

Project creation is bounded without a billing/quota subsystem: **20 projects per verified account**, and **5 successful creations in a rolling minute**. Enforce both predicates inside the same `INSERT ... SELECT ... WHERE` statement, with owner-bound counts, so concurrent requests cannot pass a separate count-then-insert check. Return `409 project_limit_reached` or `429 creation_rate_limited` without a write; distinguish these from version conflicts. A person can still use multiple GitHub accounts, so this is a demo resource bound rather than comprehensive abuse prevention.

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

Add one lazy account/projects area using existing Button/Dialog/Alert primitives. Preserve Build and Simulate modes. Signed out: Sign in with GitHub, Continue locally, existing device save and export. No full dashboard or route library. Cloud UI failure must not unmount the builder or delay the public app behind an auth-loading screen.

Account entry is one **Sign in with GitHub** button, with busy/error feedback. Persist the current local draft before navigating away. If persistence fails, stay in the builder and offer the existing export. On return `/?builder=1`, reopen the builder and fetch `/api/me`; do not automatically replace its guest workspace or bind a cached project. No password inputs, signup toggle or account recovery UI.

My Projects: metadata list, explicit Open, Save current as new project, Save to cloud, Save as new/copy, Sign out. Initial project name comes from `document.name` or `Untitled project` in a required editable name input; it is cloud metadata and does not rewrite the document. First complete the vertical slice before list polish.

Keep two independent status channels:

- Device: existing saving/saved/error behavior.
- Cloud: local only; unsaved cloud changes; saving; saved to cloud with version/time; failed/unconfirmed; conflict. A local save is never cloud confirmation.

Store cloud context outside v1: `{ ownerId, projectId, version, name, acknowledgedSnapshot }`. Track workspace changes including scenario changes, viewport and positions, not `document.revision` alone. Use canonical serialized equality against the acknowledged snapshot; do not promise a clean cloud state for edits made during a save.

### Guest and account isolation

Preserve `dominoos.builder.workspace.v1` as the guest device draft. A cloud project uses an owner/project-scoped key such as `dominoos.builder.cloud-draft.v1:<ownerId>:<projectId>` through a small Storage facade passed to the existing storage helpers; maintain the same 500 ms autosave behavior and v1 validation. Before adopting a newly created cloud ID, synchronously save the latest draft into its scoped slot; the existing guest draft remains recoverable.

Cloud metadata/recovery descriptors are separate, owner-tagged records. No passwords, cookies or session tokens in localStorage. P0 does not automatically bind cloud IDs after reload: startup shows the guest draft; after authentication, My Projects offers explicit Open from the server. A differing saved device copy must be confirmed before replacement; no automatic recovery or adoption of a cached version. Rich recovery UI is deferred.

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

409 P0 choices: **Keep working locally** (default) or **Save as new project**. No force overwrite, auto-merge, automatic adoption of `currentVersion`, conflict comparison or recovery dashboard. Opening a project retains a simple replacement confirmation and the existing local/export fallback; richer recovery choices follow only after the cross-browser acceptance test works.

## 9. Development, configuration and deployment

Keep Vite guest development unchanged. Add `/api` proxy to a separately running local Wrangler Worker on 8787; preserve the browser-visible Origin and configure `BETTER_AUTH_URL`/trustedOrigins for 5173. No Cloudflare Vite plugin before the deadline: the official integration is supported but would alter the established dev/build/test path. Built-assets `wrangler dev --local` is the integration fallback. [Local development](https://developers.cloudflare.com/workers/local-development/), [Vite integration](https://developers.cloudflare.com/workers/vite-plugin/get-started/)

| Environment | D1 / auth | Rule |
| --- | --- | --- |
| Local | Local D1 state, local-only development secret | `--local`, `remote:false`, shared persist directory; no Cloudflare login needed for local data |
| Test | Fresh temporary D1 plus test-only verifier entry or real library test accounts | No production IDs/secrets; no test identity switch in deployed code |
| Staging | Prepared `wrangler.staging.jsonc`, `domino-os-staging` Worker and D1; placeholder ID until approved creation | Separate secret and URL, synthetic accounts/projects only |
| Production | Existing top-level `domino-os` Worker plus `domino-os-projects` D1 | Explicit approval, remote migrations before deployment |
| Branch previews | Explicit `previews.d1_databases: []`, preview `CLOUD_ENABLED:false`, no usable auth config | Guest only; verify actual resolved config/bindings before any preview upload |

Do not assume empty `previews:{}` or `preview_database_id` isolates branch builds. Current docs provide `previews.d1_databases`; shared database IDs share data. Named staging does not retarget automatic branch previews. Assert removal of production DB and disabled auth in resolved configuration; if removal cannot be proved, stop preview deployment until separately isolated. [Preview isolation](https://developers.cloudflare.com/workers/previews/resources/)

Required configuration:

| Setting | Type / supplier |
| --- | --- |
| `DB` | D1 binding with explicit per-environment database ID; Cloudflare release owner creates after approval |
| `BETTER_AUTH_SECRET` | High-entropy secret, at least 32 characters; distinct local/staging/production values, library-supported generation; secret store only |
| `BETTER_AUTH_URL` | Public fixed browser-facing origin: production `https://domino-os.tasty-kiwi.workers.dev`, local 5173 or direct 8787, staging actual URL |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth app credentials; server-only, supplied securely by app owner; environment-specific callback registration |
| `CLOUD_ENABLED` | Explicit feature availability; false never bypasses auth, only refuses cloud endpoints |
| Trusted origins | Exact environment-specific origins derived from reviewed config, not wildcard siblings |
| Cloudflare build/deploy credential | Existing deployment system's credential; release owner verifies it can deploy and perform separately authorized migrations |

No frontend secret or publishable key is needed. Existing `.env*` and `.dev.vars*` ignore rules protect local configuration. Examples contain names/placeholders only. Do not run a provisioning CLI wizard during planning or let missing resource IDs trigger automatic provisioning during implementation.

**Local commands** (implemented scripts; actual GitHub credentials are needed only for live login):

```sh
npm ci
npm run types:worker
npx wrangler d1 migrations apply DB --local --config wrangler.local.jsonc
npm run build
# Terminal A
npm run dev
# Terminal B
npm run dev:api
```

Use ignored `.dev.vars` for local credentials and the fixed browser-facing origin `http://localhost:5173`. The GitHub callback is `http://localhost:5173/api/auth/callback/github`, forwarded by Vite to 8787. Never deploy `wrangler.local.jsonc` or its placeholder database ID. [GitHub setup](GITHUB_AUTH_SETUP.md)

`migrations/0001_auth.sql` was generated by the pinned CLI against an empty SQLite connection; `0002_projects.sql` adds the project table. Both have applied locally and to the approved staging D1. `npm run auth:generate` now writes only a candidate `.tmp/auth-schema.sql`, leaving applied migrations untouched. Review differences and add a new migration for future schema changes.

**Verification commands:**

```sh
npm test
npm run types:worker
npm run typecheck:worker
npm run build
npm run test:worker
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
npx wrangler d1 create domino-os-staging
# Bind the returned IDs explicitly, then configure each environment.
npx wrangler secret put BETTER_AUTH_SECRET --config wrangler.staging.jsonc
npx wrangler secret put GITHUB_CLIENT_ID --config wrangler.staging.jsonc
npx wrangler secret put GITHUB_CLIENT_SECRET --config wrangler.staging.jsonc
npx wrangler d1 migrations apply DB --remote --config wrangler.staging.jsonc
npm run build
npx wrangler deploy --config wrangler.staging.jsonc
# After staging gates and separate production approval:
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler d1 migrations apply DB --remote
npm run deploy
```

`secret put` itself changes a deployed Worker version; coordinate it as a deployment action. Set nonsecret URL/availability variables consistently in config. Existing Workers Builds should continue `npm run build` and `npx wrangler deploy`; explicitly arrange approved migrations beforehand. Do not add remote migrations or deployment credentials to the verification-only GitHub CI job. Confirm dashboard configuration/current build triggers before pushing or merging. This plan verified repository deployment config, not the live dashboard state. Database migrations/data do not roll back with Worker code.

## 10. Three-developer ownership and sequence

Freeze section 7 plus the `verifySession(request, env) -> {userId,name}|null` interface and canonical serializer/limits **before parallel edits**. Developer A owns shared contract files; B and C review them immediately. Integrate short patches at each gate rather than maintaining incompatible branches.

| Owner | Exclusive implementation files / responsibility | Dependencies |
| --- | --- | --- |
| A — backend/integration | `worker/index.ts`, `worker/projects.ts`, `worker/http.ts`, `src/lib/cloud/contracts.ts`, `migrations/0002_projects.sql`, `wrangler.jsonc`, `vite.config.ts`, Worker tsconfig/types, `vitest.worker.config.ts`, backend tests, CI, package.json/lockfile | B's verifier/auth-handler interface; C's client contract review |
| B — authentication | `worker/auth.ts`, shared auth options, `scripts/auth-schema.ts`, `migrations/0001_auth.sql`, `src/lib/cloud/client.ts` (C implements the shared client), `src/components/account/AccountControls.tsx`, real-auth HTTP tests | A integrates B's dependency/script/type requests; approved staging resources for CPU gate |
| C — product integration | `src/lib/cloud/client.ts`, `src/lib/cloud/drafts.ts`, cloud save-state hook, project dialog, BuilderExperience integration, relevant CSS, frontend/browser tests, README/config examples | Frozen API; B's account controls/client interface |

`BuilderExperience.tsx` has one editor (C). `App.tsx`/`main.tsx` need changes only if C demonstrates a minimal lazy integration need; C owns them. Existing schema/storage/compiler/scenario/simulation files stay unchanged unless a proven packaging need requires a reviewed narrow edit. The storage helpers accept an optional key while preserving their original guest-key default and JSON format. B does not edit package.json concurrently: send exact dependency/script requirements to A. No independent developer silently deploys, edits main or alters resource bindings.

### First vertical slice, before polishing My Projects

1. A wires API/static routing and local D1; B proves SDK schema, GitHub login/session/logout and the persistent limiter. C builds the GitHub entry plus a minimal save/open control against the frozen contract.
2. Sign in with GitHub, open the existing builder with nodes and a named scenario, save its current workspace as a cloud project, record returned ID/version.
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

Additional real-library auth tests: GitHub-only authorization URL/scopes and state, unknown/expired/replayed state rejection, no session on callback failure, exact return URLs, alternate token/provider body rejection, correct cookie flags, no credential-bearing API response/log, Origin/CSRF failures, auth allowlist and persistent HTTP 429. Test NAT behavior at the venue.

Run owner/API tests against real local D1, including atomic SQL CAS/quota behavior. Test-only seeded sessions signed with the maintained cookie helper exercise production session verification without introducing a deployed bypass. Real GitHub code exchange must be tested live. Test deployed routing with navigation headers against built assets, not Vite's proxy alone. Run the 1 MB bound-parameter save rather than inferring it from SQL text limits.

Live staging gate uses two real accounts controlled by testers, synthetic workspaces, another browser/device, actual OAuth/project CPU telemetry, denied cross-owner attempts, expiry/logout and network failure. Record Worker version, migration state, account plan, sample count, CPU p50/p95/max and any limit errors; 20 representative attempts plus a limited concurrent burst is an initial check, not a load/security audit. Production smoke repeats the acceptance with fresh synthetic accounts and public guest journeys after explicit deployment approval. If credentials/authorization are absent, leave live acceptance unverified; never replace it with mocked claims.

## 12. Effort, checkpoints and deferred work

The user asked to disregard the person-hours estimate. Use proof in this order: **actual account plan and authentication/CPU → private project backend → simple cross-browser frontend → regressions/release checks**. Do not polish or expand login/recovery UI before the vertical slice works. Earlier estimates remain historical discussion only.

| Gate | Stop/go evidence |
| --- | --- |
| 0 — before implementation | User approves the GitHub pivot with Workers Free required; freeze API/file ownership |
| A — first 2–3 focused hours | Pinned package engines/bundle, six-table schema and fresh local migrations, real auth HTTP login/logout/session/rate-limit tests; identify account plan and approve any staging resource operations |
| B — before enabling cloud remotely | Approved staging real GitHub login/logout and project CPU within Free allowance, shared limiter and cookies pass; no unauthorized plan upgrade; preview isolation proven |
| C — target T+8h | First vertical slice works in fresh contexts, second-user isolation passes |
| D — target T+12–16h | Update CAS, size/error/recovery/async guards, full baseline and cloud suites pass; review complete diff |
| Release freeze — 14 Nov 16:00 Vilnius | Staging acceptance green, production configuration/migrations/deploy explicitly authorized; leave four hours for production smoke/fallback |
| Final acceptance | Production same-project cross-browser open and denied second-user GET/PUT observed; guest demo still works |

A failed gate stops cloud rollout and triggers a concrete report. Ship the working local demo if necessary, but report the cloud acceptance criterion as unmet. No spontaneous provider migration, handwritten crypto, reduced hash cost or deadline-driven auth bypass. Existing preview/production data must not be used for destructive tests.

P1 only after P0: delete project, list rename, automatic cloud autosave, richer conflict comparison/merge UI. Deferred beyond this hackathon: email/password accounts, verification/recovery/email delivery, additional OAuth providers, teams/roles/sharing/templates, real-time collaboration, revision history, attachments, billing/notifications, additional services, normalized node tables and simulation changes. GitHub handles recovery of the GitHub account; DominoOS does not offer separate recovery or account linking.

Remaining disagreements: the password CPU probe failed on Free; the user explicitly selected GitHub instead. Remote smoke CPU has been measured and shows unresolved cold-request spikes; real OAuth callback and authenticated project paths remain unmeasured. Rate thresholds trade venue NAT access against abuse protection; Haiku was substantially more pessimistic about scope and preferred fewer conflict actions; models differed on auth schema tooling and whether to pivot providers at a failed gate. Coordinator resolution: narrow safe Open reuse, explicit CPU/schema gates, bounded persistent limiting, and **stop/review rather than automatic provider pivot**. See the full decision history in the debate document and the new [CPU evidence](AUTH_CPU_CHECK.md).
