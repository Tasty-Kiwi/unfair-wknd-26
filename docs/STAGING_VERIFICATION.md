# Staging deployment and verification

13 November 2026. The user explicitly approved creating the isolated staging Worker and D1 database, applying migrations, uploading the supplied GitHub/session secrets and deploying for testing. Workers Free is required. Production deployment remains unapproved.

## Resources and deployed source

- URL: `https://domino-os-staging.tasty-kiwi.workers.dev`.
- Account: Tasty Kiwi, `74f486ac4925bc5b7ccaa9fcf865170e`.
- Worker: `domino-os-staging`.
- D1: `domino-os-staging`, ID `75faa40c-c80c-4fd6-ab27-6dc8f6cc66e4`, EEUR.
- Migrations applied remotely: `0001_auth.sql`, `0002_projects.sql`.
- Current Worker version: `57ec63cd-b693-459a-983c-b69f63828b55`.
- Config: `wrangler.staging.jsonc`; minification enabled, version preview URLs disabled, query-string redaction and logs/traces enabled.
- Exact Better Auth version: 1.7.22. This deployment was built from the then-uncommitted implementation on `plan/cloud-backend`. Subsequent work is isolated on `feat/cloud-projects`. Bringing current main into that branch does not update staging or production.
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

## Still required

- Real GitHub authorization, callback/code exchange, user/session creation and logout in a browser.
- Authenticated project create/list/open/update with scenarios, then reopen in a fresh browser.
- Live two-account owner isolation if two real accounts are available.
- CPU measurements for the real callback and authenticated project paths, including cold requests and a representative size boundary.
- Resolve or explicitly review the Free-plan CPU tail before any production release.

Local regression evidence before deployment: 91 unit tests, 12 Worker/runtime tests, 32 Chromium journeys, Worker typecheck/build/dry-runs. The backend initialization optimization was followed by typecheck and the affected 12 runtime tests. Browser API mocks and seeded sessions do not prove real GitHub identity.
