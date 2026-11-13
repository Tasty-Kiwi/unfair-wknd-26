# Staging deployment and verification

13 November 2026. The user explicitly approved creating the isolated staging Worker and D1 database, applying migrations, uploading the supplied GitHub/session secrets and deploying for testing. Workers Free is required. Production deployment remains unapproved.

## Resources and deployed source

- URL: `https://domino-os-staging.tasty-kiwi.workers.dev`.
- Account: Tasty Kiwi, `74f486ac4925bc5b7ccaa9fcf865170e`.
- Worker: `domino-os-staging`.
- D1: `domino-os-staging`, ID `75faa40c-c80c-4fd6-ab27-6dc8f6cc66e4`, EEUR.
- Migrations applied remotely: `0001_auth.sql`, `0002_projects.sql`, `0003_github_oauth.sql`.
- Current Worker version: `5adba668-0dc4-4c2f-880d-f67bffcc67b1`.
- Config: `wrangler.staging.jsonc`; minification enabled, version preview URLs disabled, query-string redaction and logs/traces enabled.
- Current auth: custom GitHub OAuth with opaque D1-backed sessions, no auth SDK/signing secret. AUTH_URL replaces BETTER_AUTH_URL. Previous SDK versions/deployments below are historical. Runtime/dependency/probe/generator code was removed; applied migration history is retained.
- GitHub credentials were originally uploaded from an ignored, mode-0600 JSON file. The previous signing secret, if still stored, is unused by the new runtime. Values were not printed or committed.

The first full upload returned Cloudflare HTTP 500/code 10013. A retry encountered a transient local DNS/connectivity failure. A minimal SELECT 1 handler deployed successfully under the same staging name; it exposed no user/project data. The minified full app then deployed and replaced it. This sequence does not establish the exact cause of the initial upload failure.

## Initial custom OAuth deployment

The user explicitly requested replacing Better Auth and fixing transient health recovery. The additive migration 0003 and new Worker were deployed only to the existing approved staging resources. No new remote resource, production secret, production data write, paid upgrade or merge was made.

Before migration: zero conflicting GitHub mappings and zero cloud projects. After migration: zero missing legacy mappings and the project count remained zero. The new tables preserve old internal owner IDs; old auth sessions must sign in again. No old table or project row was dropped.

At that initial checkpoint: **102 unit tests, 40 Worker/runtime tests, 44 Chromium journeys**, Worker/test-source typechecks, build and dry run pass. The provider success/error/state/PKCE/session/migration tests use external GitHub HTTP mocks with real local D1. The built-Worker fresh-browser persistence/privacy test now uses opaque local test sessions and the actual production verifier. Neither claims a live GitHub code exchange.

All nine remote routing/anonymous/OAuth-start checks passed on `b9f1793f-e14f-454e-8d37-a93463b01750`: cloud enabled, anonymous me/projects 401, unknown API JSON 404, fixed GitHub callback with state/S256/read:user, Secure/HttpOnly/Lax/host-only state cookie, forged callback safely rejected. Production deployment/version were compared and unchanged. No fresh authenticated endpoint CPU measurement or live two-account test was made.

Failed/malformed/timed-out health now offers Retry cloud connection in place; explicitly disabled cloud remains hidden. Retry and OAuth-return recovery are covered by four new browser tests.

## Real GitHub callback repair and live verification

During the review follow-up on 13 November, the user reported failed sign-in. The coordinator reproduced the error in Helium. Safe stage-only diagnostics localized it to the token exchange; no new session was issued. The cause was `redirect: "error"`: Workers rejects this unsupported mode while constructing the outbound Request, before contacting GitHub. The previous provider mocks ran in Node and accepted it.

The fix uses `redirect: "manual"` and rejects non-OK responses, including 3xx, before reading JSON. Credentials are never forwarded to a redirect target. See the official [Workers Request documentation](https://developers.cloudflare.com/workers/runtime-apis/request/). Fixed-label callback failure diagnostics log only the stage, an allowlisted category and optional upstream HTTP status; never provider bodies, code/state, cookies, tokens or raw exception messages.

Staging-only diagnostic versions `2cec0660-004c-465d-8037-ac0285282720` and `bc059f12-1f2e-4ac8-8983-0f23f7a94bd3` were replaced by the fixed version **`5adba668-0dc4-4c2f-880d-f67bffcc67b1`**. No resource, migration, secret, account plan or production configuration changed.

Observed in the user's existing Helium profile using real GitHub authorization:

- Sign-in succeeded and the app displayed the authenticated identity.
- Created **Staging OAuth verification 2026-11-13** with the core network and **Live GitHub scenario**. D1 confirmed six nodes, six connections, one scenario and 4,136 serialized bytes at version 1.
- Listed/opened the saved project, changed the document name and saved version 2 (4,152 bytes), confirmed directly in D1.
- Signed out; the app restored the device draft. Signed in through GitHub again, listed/reopened version 2 and observed the updated network name and named scenario. Simulation displayed every order covered and zero component units missing.
- Left the existing Helium tab open on the restored project and closed the diagnostic DevTools panel. No user cookie or credential was copied into chat, source or logs.

This is **real-provider, real-session, real-staging-D1 evidence for one account in its existing browser profile**. It does not establish fresh-browser restoration, rejection of a retained old cookie, or privacy against a second real GitHub account. Those live checks remain open; their isolated-local test coverage remains passing.

### CPU evidence for the fixed Worker

Wrangler real-time tail returned per-request `cpuTime` in integer milliseconds. Only method, normalized path, CPU/wall time, outcome and fixed diagnostic fields were retained. Query strings, headers, cookies, user IDs and provider responses were excluded. These are a handful of observed requests, not percentiles or a load test:

| Successful route | Observed CPU milliseconds |
| --- | --- |
| POST /api/auth/sign-in/social | 13, 5 |
| GET /api/auth/callback/github | 13, 6 |
| GET /api/me (authenticated) | 2, 2, 1, 0, 0, 1, 1 |
| GET /api/projects | 2, 1 |
| POST /api/projects (4.1 KB workspace) | 17 |
| GET /api/projects/:id | 7, 2 |
| PUT /api/projects/:id | 3 |
| POST /api/auth/sign-out | 2 |

All these tail events had outcome `ok`; none reported `exceededCpu` or exceptions. **Several samples exceed the nominal Free request allowance, so this is not a passed reliability gate.** A successful response can use runtime CPU rollover. Representative larger workspaces, repeated cold/warm requests, different isolates and sustained operation still need measurement. Do not weaken validation or activate production based on this small sample.

Before the fix, a separate GraphQL window (17:56:22–18:18:41 UTC) covering only the initial custom deployment returned ten requests, zero runtime errors, CPU p50 1.270 ms and p95/p99 7.526 ms. This mixed anonymous/start/failing-callback sample is **not authenticated success evidence**. Detailed telemetry query access returned 403 after Wrangler credential refresh; permitted real-time tail supplied the endpoint samples above instead.

Current checks: **102 unit tests, 44 Worker tests across seven files, 44 Chromium journeys**, Worker/test-source typechecks, build and production-config dry run pass. The browser command needed `PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers"` for the existing local Chromium installation; the corrected full run passed in 25.7 seconds. Two new redirect-rejection cases preserve provider isolation. A test-only Worker entry executes the real auth module and constructs provider requests using workerd's Request before returning fake GitHub JSON. Restoring the old redirect mode makes its successful-login case fail; restoring the fix passes. This catches the actual runtime incompatibility without adding any deployed test bypass.

### Shared-network limit recommendation

Limits remain ten OAuth starts and twenty callbacks per minute per client IP. The existing local integration case accepts ten starts and rejects the eleventh with 429. No venue/shared-Wi-Fi contention was demonstrated; no threshold was raised. Check several real testers on the venue network before release, retain Retry-After behavior and wait for the next minute when throttled. This environment cannot establish the venue's NAT behavior.

## Confirmed remote HTTP behavior

On the complete app:

| Check | Result |
| --- | --- |
| `/` and `/landing` | 200 HTML |
| `/api/health` | 200 JSON, `cloudEnabled: true` |
| `/api/me` without session | 401 JSON |
| `/api/projects` without session | 401 JSON |
| Bare `/api`, unknown `/api/nope` with navigation headers | 404 JSON; no SPA fallback |
| GitHub OAuth start | 200, correct provider URL, configured client ID and exact staging callback |
| OAuth protections | Random state and S256 PKCE present; scope only `read:user` |
| OAuth state cookie | Secure, HttpOnly, SameSite=Lax, host-only |
| Forged callback state/code | 302 to the safe error return; no authenticated session |
| Deployed bindings/settings | Only staging DB ID; expected secret names; query-string redaction enabled |

Python's default user agent was rejected by Cloudflare with 403/1010 before the Worker. The checks succeeded with an explicit `DominoOSStagingCheck/1.0` user agent; no account security settings were changed.

Production deployment `a5917882-a7d7-4ea1-9418-524455dcad8d`, version `c438a69d-1282-4954-a93f-10c29aee3e60`, was read before and after and remains identical. No production bindings, data, code or billing were changed.

## Earlier SDK implementation verification

At the earlier SDK checkpoint, the approved staging upload contained canonical auth-origin validation, confirmed Open cloud version recovery and rate-limit feedback. No migration, new remote resource, secret change, production deployment or billing change was needed. Its nine routing/OAuth-start smoke checks passed, including exact callback/state/PKCE/cookie assertions and forged-state rejection. Production deployment/version were compared and unchanged again.

The integrated source passed **97 unit tests, 28 Worker/runtime tests, 39 Chromium journeys, Worker and test-source typechecks, build and deployment dry run**. The new browser journey uses built ASSETS, the production Worker, real isolated local D1 and test-only signed database sessions, without API interception. It proves save, logout/revocation, fresh-browser reopen of the exact workspace/scenarios, matching simulation output, update and second-owner GET/PUT denial. It does not claim two real GitHub accounts were authenticated.

The shared staging browser reached GitHub's login screen and had no authenticated GitHub session. It was closed without requesting credentials or changing account settings. Real sign-in remains user-verified as described below; the full live two-real-account journey remains open. The user's latest instruction excludes further email-login/CPU work; earlier measurements below are retained as historical evidence, not a new release claim. See [implementation evidence](CLOUD_BACKEND_IMPLEMENTATION.md).

## Historical CPU findings

The initial full-app aggregate showed CPU p50 23.030 ms and p95/p99 56.101 ms over eight requests. A later ten-request aggregate had p50 1.960 ms with the same upper tail. These tiny mixed samples include startup and unauthenticated paths; they are not per-endpoint estimates or a complete Free-plan feasibility proof.

The coordinator then deferred auth-module loading and cached only the SDK client/configuration for stable D1 bindings. Every protected request still calls the real session verifier; no identities or session results are cached. Configuration/secret changes invalidate the cached client. Better Auth 1.7.22 documents shared-D1-client fixes. Typecheck and all 12 local Worker/runtime tests, including revocation and cross-owner/CAS behavior, pass with this change.

The optimized-version smoke window reported **6 requests, 0 errors, CPU p50 1.064 ms and p95/p99 150.289 ms**, with startup CPU p95 191.498 ms. Cloudflare GraphQL CPU fields are microseconds. The median improved, but the upper tail did not establish a fit within Free's 10 ms request allowance. Lazy initialization can move work into the first request. **Do not describe this as a passed CPU gate or approve production from these results.** Cloudflare's overrun flexibility explains why successful HTTP responses alone are insufficient.

### Startup initialization experiment

Hydrogen's source review found Better Auth 1.7.22 initialization constructs its adapter and configuration without D1/network I/O. The coordinator replaced request-time dynamic imports with a static import and, only when cloud is configured, awaits the SDK context at module startup. The SDK client/configuration cache is unchanged; every protected request still performs a real database-backed session lookup. Initialization errors are caught without logging sensitive details so the public demo remains available; protected requests fail closed.

Cloudflare supports [global binding access](https://developers.cloudflare.com/workers/runtime-apis/bindings/) for client initialization and documents a separate [one-second startup allowance](https://developers.cloudflare.com/workers/platform/limits/). The staging upload reported **90 ms startup**, below that allowance. This does not prove that request processing fits Free's 10 ms budget.

Before this upload, Worker typechecking, all **91 unit tests**, all **12 Worker/runtime tests** (cloud enabled and disabled), and the staging deployment dry run passed. After upload, the same nine HTTP checks passed, including OAuth start and rejection of forged callback state; production deployment/version were compared and unchanged.

The first GraphQL reads for exact sub-minute timestamps returned no samples. A minute-aligned window covering the smoke checks then returned **7 API requests, 0 errors, CPU p50 20.378 ms, p95/p99 55.514 ms, startup CPU p95 354.701 ms**. The nine HTTP checks include two asset requests. These are mixed, small-sample aggregates, not endpoint-level timings; window alignment can include other traffic. The upper tail is lower than the prior lazy-init sample, but the median is higher, so this is not a controlled overall performance win. Most importantly, request CPU still exceeds Free's 10 ms allowance. **The startup-only change does not pass the Free CPU gate.** Raw sanitized evidence is retained locally in ignored `.tmp/staging-cpu-eager.json`.

Independent post-main verification by Luna also passed **12 Worker tests**, **32 Chromium journeys** and the production-config dry run before the startup-only change. It found no material owner-check, CAS or stale-response issue. These checks used local runtime/seeded sessions and browser API mocks, not real GitHub authorization.

## Historical user-reported browser verification

On 13 November 2026, the user reported: “When I was testing, GitHub sign-in did work.” That sign-in used the previous SDK flow. It remains historical user evidence; the replacement required fresh real-provider verification, now recorded above. The report did not specify the tested build/version; it does not by itself verify logout, cross-browser workspace restoration, second-account isolation or request CPU reliability.

## Still required

- Fresh-browser restoration and retained-old-session rejection; same-profile real GitHub sign-in/logout/re-sign-in now passed as recorded above.
- Reopen the saved scenario in another browser profile with no shared localStorage. Same-profile live save/list/open/update now passed.
- Live two-real-account GET/PUT privacy checks and unchanged original data.
- Broader authenticated endpoint reliability measurements: current endpoint samples include over-budget requests and do not pass the gate.
- Separate authorization/configuration before any production rollout.

Older SDK measurements and test counts above are historical, not results for this replacement. Current architecture, migration and test evidence are in [CLOUD_BACKEND_IMPLEMENTATION.md](CLOUD_BACKEND_IMPLEMENTATION.md).
