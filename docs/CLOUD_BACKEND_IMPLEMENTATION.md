# Cloud backend implementation

13 November 2026. Existing branch `plan/cloud-backend`, [PR #5](https://github.com/Tasty-Kiwi/unfair-wknd-26/pull/5). No PR merge or production activation.

## Current architecture

The user explicitly replaced Better Auth with a small custom GitHub OAuth implementation. There is **no auth SDK dependency, auth CLI, password hashing, signing secret, JWT, email flow, account linking or provider framework** in the current runtime. The old probe/generator sources and configs were removed. Applied SQL migration history remains intact.

React/Vite and deterministic simulation stay in the browser. One Cloudflare Worker serves the same-origin API and ASSETS. D1 stores projects and the current auth records. Production/branch-preview cloud remains disabled; the already-approved staging deployment uses its own database.

## GitHub sign-in and sessions

1. A same-origin JSON POST to `/api/auth/sign-in/social` starts GitHub authorization. Client-supplied providers, token shortcuts and external callbacks are rejected by the API wrapper.
2. The Worker generates independent random 32-byte state, browser nonce and PKCE verifier. D1 stores the state/browser hashes and verifier for ten minutes; an HttpOnly cookie binds the attempt to that browser.
3. GitHub receives only `read:user`, the fixed callback and an S256 challenge. The callback atomically deletes a matching, unexpired state/browser record **before** exchanging the code, making it one-use.
4. Only fixed GitHub token/profile endpoints are contacted. Redirects use Workers-compatible manual mode and non-OK responses (including 3xx) are rejected; fetches time out after ten seconds and decoded JSON is limited to 64 KiB. Code, credentials, provider tokens and raw callback errors are never logged or returned. The access token is discarded after fetching the profile.
5. The stable positive GitHub numeric ID maps to an internal user ID. Login, display name and email are not authorization keys. Existing GitHub mappings keep their original internal owner IDs.
6. A new opaque 256-bit session cookie lasts one day. D1 stores only its SHA-256 hash and expiry. Every protected request joins that hash with the identity record; there is no in-memory session cache. Logout deletes the row and clears cookies.

HTTPS cookies are `__Host-domino_session` and `__Host-domino_oauth`: Secure, HttpOnly, SameSite=Lax, Path=/, no Domain. Local HTTP loopback uses unprefixed names. Duplicate/malformed/forged/expired cookies are rejected. POST Origin is checked both at the API boundary and in the auth handler.

Auth starts and callbacks use atomic D1 limits of 10 and 20 per trusted client IP per minute. Expired auth data is pruned opportunistically. These are demo resource bounds, not comprehensive abuse protection.

The flow follows GitHub's current official [authorization-code and PKCE documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps). No new cryptographic scheme or custom password authentication was introduced.

## Database and migration

| Active table | Purpose |
| --- | --- |
| github_identities | Stable GitHub ID → unique internal owner ID and display name |
| cloud_sessions | Hashed opaque session, owner and expiry |
| oauth_attempts | Hashed one-use state/browser binding, verifier and expiry |
| oauth_limits | Atomic per-route/IP minute counters |
| projects | Private metadata, complete versioned workspace JSON and CAS version |

`0001_auth.sql` and `0002_projects.sql` are unchanged. New `0003_github_oauth.sql` creates current auth tables/indexes and imports `account JOIN user` GitHub mappings while preserving internal user IDs. Identical mappings deduplicate; conflicting mappings abort rather than choosing an owner. Legacy auth tables remain unused to avoid destructive migration and permit rollback. The current runtime never reads them.

Old session cookies are ignored, so existing testers must sign in again. Project rows, document IDs and workspace JSON are not rewritten. Before staging migration the ambiguous-mapping count was zero and the project count was zero. After migration there were zero missing legacy mappings and the project count remained zero.

## API and workspace contract

Session verification returns `{userId,name} | null` from D1. All project SQL binds that verified owner, never a body or URL user ID.

| Endpoint | Contract |
| --- | --- |
| GET /api/health | Public `{ok:true,cloudEnabled}` |
| GET /api/me | `{user:{id,name}}` or 401 |
| GET /api/projects | Bounded metadata list `{projects,nextOffset}`, no workspace bodies |
| POST /api/projects | `{name,workspace}` → 201 `{project:metadata}` |
| GET /api/projects/:id | Authorized `{project:{...metadata,workspace}}` |
| PUT /api/projects/:id | `{name,workspace,expectedVersion}` → incremented metadata or 409 |
| POST /api/auth/sign-in/social | Fixed GitHub start, `{url,redirect:true}` |
| GET /api/auth/callback/github | Validated code exchange, fixed success/error return |
| GET /api/auth/get-session | Minimal user identity or null; no token/private email |
| POST /api/auth/sign-out | Server-side revocation and cookie clearing |

Metadata is `{id,name,version,createdAt,updatedAt}`; project errors remain `{error:{code,message,...details},requestId}`. Prepared owner-scoped queries return the same 404 for missing and foreign rows. One atomic owner/version UPDATE prevents lost writes. Single-statement creation predicates enforce 20 projects/account and five successful creates/minute.

Structural v1 validation preserves incomplete drafts, positions, known raw fields, scenarios, validation keys, receipt snapshots and provenance. The cloud row ID never replaces the graph document ID. No compile or scenario revalidation is required to save. The canonical UTF-8 workspace cap is 1,000,000 bytes; streamed project/auth envelopes are limited to 1,050,000 / 16,384 bytes. Unknown extension keys follow the existing schema stripping behavior.

Unknown API paths return JSON 404, including navigation requests; ASSETS still serves the SPA and /landing. Mutations require exact Origin and JSON framing; errors are safe 400/401/403/404/405/409/413/415/429/500/503 responses. API responses are private/no-store.

## Frontend and review feedback

The existing local-first UI remains: GitHub sign-in/out, My Projects, explicit Save to Cloud, Open and Save as New. Guests can build/simulate/autosave/import/export without auth. Cloud drafts are owner/project-scoped; cloud binding stays outside the workspace format. Saves acknowledge only the confirmed snapshot, later edits remain dirty, and stale completions are ignored.

Conflict actions stay Keep working locally, Save as new project and Open cloud version with confirmation. Cancel has no replacement side effect. Account changes detach the prior cloud project and restore the guest draft; sign-out does not delete local data. Refresh intentionally opens the device draft; My Projects explains how to reopen cloud work.

The review's remaining retry issue is fixed. Failed/timed-out/malformed health probes show **Retry cloud connection**. A retry performs one fresh probe without reload or draft replacement, and preserves OAuth-return intent. Explicit `cloudEnabled:false` keeps cloud controls hidden without retry. Overlapping/stale/unmounted checks cannot apply state.

## Actual model and coordinator contributions

- **Gemini 4 Hydrogen**, `antigravity/gemini-4-hydrogen`: implemented `worker/auth.ts` and `0003_github_oauth.sql`. [Custom GitHub OAuth — backend](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac5096eeb-26c8-40a1-a97e-08e83ea6c75b%3Adelegate-task%3Afa49fb43-9138-45d1-a314-c30858942280) Reported SQL import/dedup/conflict checks and source typecheck; it did not run browser/Worker suites.
- **Claude Haiku 5.5**, `claudeAgent/claude-haiku-5-5`: implemented retry state/action, UI and four browser tests. [OAuth pivot — retry cloud connection](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac5096eeb-26c8-40a1-a97e-08e83ea6c75b%3Adelegate-task%3A21930c76-8cfe-4250-b39f-fa0da9922b30) Reported 16 cloud journeys, 102 unit tests and app typecheck passing; integration type errors were left to the coordinator.
- **GPT-6 Luna**, `codex/gpt-6-luna`: changed auth configuration tests only. [Custom OAuth tests — implementation ready](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac5096eeb-26c8-40a1-a97e-08e83ea6c75b%3Adelegate-task%3A1e2e98cf-e67e-4d6b-af61-652b4876f384) It did not migrate the remaining harness/tests or run them. The earlier attempt [Custom GitHub OAuth — tests](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac5096eeb-26c8-40a1-a97e-08e83ea6c75b%3Adelegate-task%3A08677b0b-3d7f-47af-a602-24949ee09b46) made no edits because the new server was not available yet.
- **Coordinator:** removed SDK/CLI/probe dependencies and tooling, integrated entry point/env/config changes, completed the opaque-session harness/browser migration, restored URL-boundary cases, implemented mocked-provider OAuth/security/migration tests, added callback duplicate-param/origin/profile/redirect protections, reused bounded JSON reading, reviewed the retry code, and ran final verification.

Luna/Haiku reported matching executed-model IDs. Hydrogen's separate executed-model field was unavailable; no stronger identity claim is made. Historical three-round discussions and the explicit user override remain in [the debate record](archive/historical-designs/CLOUD_BACKEND_DESIGN_DEBATE.md).

## Configuration and local use

Only `AUTH_URL`, `CLOUD_ENABLED`, `DB`, `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are required. AUTH_URL is a canonical HTTPS origin, with HTTP permitted only on localhost/127.0.0.1/[::1]. GitHub credentials belong in ignored .dev.vars or Worker secrets, never VITE variables/localStorage/source/logs. No session signing secret or schema generator remains.

```sh
npm ci
npm run types:worker
npx wrangler d1 migrations apply DB --local --config wrangler.local.jsonc
npm run build
# Separate terminals; browser and OAuth callback use localhost:5173:
npm run dev
npm run dev:api
```

Keep the existing GitHub OAuth app/callbacks. The Vite /api proxy targets 8787 while the browser stays on the configured 5173 origin. [Setup/runbook](GITHUB_AUTH_SETUP.md)

## Verification

| Check | Final local result |
| --- | --- |
| npm test | 102 tests / 10 files pass |
| npm run test:worker | 44 tests / 7 files pass |
| npm run test:e2e | 44 Chromium journeys pass |
| Worker and test-source typechecks | Pass |
| TypeScript/Vite build | Pass; existing upstream annotation warnings only |
| Production-config deploy dry run | Pass; cloud disabled/no D1 |
| Removed auth packages | npm tree contains no better-auth/auth/better-call |

New tests mock only external GitHub HTTP while using actual local D1 for code exchange, PKCE/binding/replay/expiry, bad/oversized/compressed responses, timeout, stable identity mapping, Secure cookies, hashed sessions, logout and legacy owner migration/conflicts. Existing auth/owner/CAS/quota/size/framing cases remain.

The built-Worker browser journey uses the actual runtime, real local D1 and opaque test sessions, with no API interception. It saves a UI-created named scenario, checks the SQL row, logs out/rejects the old cookie, reopens the exact workspace in a fresh context with matching simulation output, updates version 2 and denies a second owner's GET/PUT. Other browser tests prove cloud-disabled guest behavior and transient-health retry without reload/data loss. Synthetic sessions/provider HTTP mocks are not live GitHub proof. A new test-only workerd entry constructs outbound Requests inside the Worker runtime; the old redirect mode fails its login case and the fix passes. Provider 3xx responses are rejected without forwarding credentials.

## Deployment and remaining acceptance

Existing approved staging only: `domino-os-staging`, isolated D1 `75faa40c-c80c-4fd6-ab27-6dc8f6cc66e4`. Migration 0003 was applied there after local tests; no old rows/tables were dropped. The custom flow was deployed as version `5adba668-0dc4-4c2f-880d-f67bffcc67b1`. [Staging verification](STAGING_VERIFICATION.md) records current smoke results and production comparison.

Production `domino-os` and previews retain cloud disabled/no production D1. No new resource, paid upgrade, merge or production activation was made. Legacy signing-secret values, if still stored on an environment, are unused and may be retired separately.

The review follow-up found and fixed unsupported `redirect: "error"` in provider fetches. Real GitHub sign-in, save/list/open/update, logout, re-sign-in and scenario reopen/simulation now pass in Helium with one account; D1 confirms version 2. The full fresh-browser/two-real-account staging privacy journey remains open. The user's earlier successful sign-in tested the previous SDK flow; it does not automatically verify this replacement. Endpoint CPU samples are now recorded in the staging evidence; some exceed 10 ms, so consistent Free-plan reliability remains unproven. No performance result is inferred merely from dependency removal. Local persistence/privacy acceptance is passing; complete live acceptance is not claimed.

Delete, sharing, cloud autosave, revisions, email/password, teams and advanced account/recovery UI remain deferred.
