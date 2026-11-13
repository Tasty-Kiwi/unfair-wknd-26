# Staging deployment and verification

13 November 2026. The user explicitly approved creating the isolated staging Worker and D1 database, applying migrations, uploading the supplied GitHub/session secrets and deploying for testing. Workers Free is required. Production deployment remains unapproved.

## Resources and deployed source

- URL: `https://domino-os-staging.tasty-kiwi.workers.dev`.
- Account: Tasty Kiwi, `74f486ac4925bc5b7ccaa9fcf865170e`.
- Worker: `domino-os-staging`.
- D1: `domino-os-staging`, ID `75faa40c-c80c-4fd6-ab27-6dc8f6cc66e4`, EEUR.
- Migrations applied remotely: `0001_auth.sql`, `0002_projects.sql`.
- Current Worker version: `f40b12ca-41a9-45c0-94b8-8058ee47d71b`.
- Config: `wrangler.staging.jsonc`; minification enabled, version preview URLs disabled, query-string redaction and logs/traces enabled.
- Exact Better Auth version: 1.7.22. The initial deployment used the then-uncommitted implementation on `plan/cloud-backend`. The current staging deployment uses `feat/cloud-projects`: implementation commit `7756bc1`, main integration commit `ce8568a` (including PR #6), plus the startup initialization change described below. Production is unchanged.
- GitHub Client ID/Secret and generated session secret were uploaded from an ignored, mode-0600 JSON file. Values were not printed or committed.

The first full upload returned Cloudflare HTTP 500/code 10013. A retry encountered a transient local DNS/connectivity failure. A minimal SELECT 1 handler deployed successfully under the same staging name; it exposed no user/project data. The minified full app then deployed and replaced it. This sequence does not establish the exact cause of the initial upload failure.

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
| OAuth protections | Random state and S256 PKCE present; scopes only `read:user user:email` |
| OAuth state cookie | Secure, HttpOnly, SameSite=Lax, host-only |
| Forged callback state/code | 302 to the safe error return; no authenticated session |
| Deployed bindings/settings | Only staging DB ID; expected secret names; query-string redaction enabled |

Python's default user agent was rejected by Cloudflare with 403/1010 before the Worker. The checks succeeded with an explicit `DominoOSStagingCheck/1.0` user agent; no account security settings were changed.

Production deployment `a5917882-a7d7-4ea1-9418-524455dcad8d`, version `c438a69d-1282-4954-a93f-10c29aee3e60`, was read before and after and remains identical. No production bindings, data, code or billing were changed.

## CPU remains a release concern

The initial full-app aggregate showed CPU p50 23.030 ms and p95/p99 56.101 ms over eight requests. A later ten-request aggregate had p50 1.960 ms with the same upper tail. These tiny mixed samples include startup and unauthenticated paths; they are not per-endpoint estimates or a complete Free-plan feasibility proof.

The coordinator then deferred auth-module loading and cached only the SDK client/configuration for stable D1 bindings. Every protected request still calls the real session verifier; no identities or session results are cached. Configuration/secret changes invalidate the cached client. Better Auth 1.7.22 documents shared-D1-client fixes. Typecheck and all 12 local Worker/runtime tests, including revocation and cross-owner/CAS behavior, pass with this change.

The optimized-version smoke window reported **6 requests, 0 errors, CPU p50 1.064 ms and p95/p99 150.289 ms**, with startup CPU p95 191.498 ms. Cloudflare GraphQL CPU fields are microseconds. The median improved, but the upper tail did not establish a fit within Free's 10 ms request allowance. Lazy initialization can move work into the first request. **Do not describe this as a passed CPU gate or approve production from these results.** Cloudflare's overrun flexibility explains why successful HTTP responses alone are insufficient.

### Startup initialization experiment

Hydrogen's source review found Better Auth 1.7.22 initialization constructs its adapter and configuration without D1/network I/O. The coordinator replaced request-time dynamic imports with a static import and, only when cloud is configured, awaits the SDK context at module startup. The SDK client/configuration cache is unchanged; every protected request still performs a real database-backed session lookup. Initialization errors are caught without logging sensitive details so the public demo remains available; protected requests fail closed.

Cloudflare supports [global binding access](https://developers.cloudflare.com/workers/runtime-apis/bindings/) for client initialization and documents a separate [one-second startup allowance](https://developers.cloudflare.com/workers/platform/limits/). The staging upload reported **90 ms startup**, below that allowance. This does not prove that request processing fits Free's 10 ms budget.

Before this upload, Worker typechecking, all **91 unit tests**, all **12 Worker/runtime tests** (cloud enabled and disabled), and the staging deployment dry run passed. After upload, the same nine HTTP checks passed, including OAuth start and rejection of forged callback state; production deployment/version were compared and unchanged.

The first GraphQL reads for exact sub-minute timestamps returned no samples. A minute-aligned window covering the smoke checks then returned **7 API requests, 0 errors, CPU p50 20.378 ms, p95/p99 55.514 ms, startup CPU p95 354.701 ms**. The nine HTTP checks include two asset requests. These are mixed, small-sample aggregates, not endpoint-level timings; window alignment can include other traffic. The upper tail is lower than the prior lazy-init sample, but the median is higher, so this is not a controlled overall performance win. Most importantly, request CPU still exceeds Free's 10 ms allowance. **The startup-only change does not pass the Free CPU gate.** Raw sanitized evidence is retained locally in ignored `.tmp/staging-cpu-eager.json`.

Independent post-main verification by Luna also passed **12 Worker tests**, **32 Chromium journeys** and the production-config dry run before the startup-only change. It found no material owner-check, CAS or stale-response issue. These checks used local runtime/seeded sessions and browser API mocks, not real GitHub authorization.

## Still required

- Real GitHub authorization, callback/code exchange, user/session creation and logout in a browser.
- Authenticated project create/list/open/update with scenarios, then reopen in a fresh browser.
- Live two-account owner isolation if two real accounts are available.
- CPU measurements for the real callback and authenticated project paths, including cold requests and a representative size boundary.
- Resolve or explicitly review the Free-plan CPU tail before any production release.

Local regression evidence before deployment: 91 unit tests, 12 Worker/runtime tests, 32 Chromium journeys, Worker typecheck/build/dry-runs. The backend initialization optimization was followed by typecheck and the affected 12 runtime tests. Browser API mocks and seeded sessions do not prove real GitHub identity.
