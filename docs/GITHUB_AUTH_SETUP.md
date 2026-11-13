# GitHub sign-in setup and release checks

Current choice: **Better Auth 1.7.22 + GitHub OAuth + D1, Workers Free only**. The user approved this pivot after the password CPU check failed. The probe was deleted. The user has now separately approved and completed staging resource creation/migrations/deployment. No paid plan or production deployment is approved. See [current staging evidence](STAGING_VERIFICATION.md).

## OAuth application

The repository/app owner registers an **OAuth App** at [GitHub Developer settings](https://github.com/settings/applications/new). This is for sign-in only; no repository or organization permissions are requested.

| Field | Value |
| --- | --- |
| Application name | DominoOS |
| Homepage | `https://domino-os.tasty-kiwi.workers.dev` |
| Production callback | `https://domino-os.tasty-kiwi.workers.dev/api/auth/callback/github` |
| Local callback | `http://localhost:5173/api/auth/callback/github` |
| Prepared staging callback | `https://domino-os-staging.tasty-kiwi.workers.dev/api/auth/callback/github` |
| Device flow | Off; unused |

GitHub's current documentation supports additional callback URLs. Register only the environments actually being tested. Separate local/staging and production apps are preferable for credential isolation; if the dashboard supports only one callback, create separate apps. No custom domain is needed. [GitHub registration](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app), [Better Auth GitHub guide](https://better-auth.com/docs/authentication/github)

Supply the Client ID and Client Secret through secure input, one value per input. Never paste a secret into chat, source, a PR, a screenshot or a `VITE_` variable. The generated Better Auth session secret is separate from the GitHub Client Secret. The library requests only `read:user user:email`; it uses GitHub's stable provider account identity, while project ownership uses the internal session user ID. Do not add `repo` scope.

## Local development

Use ignored `.dev.vars` next to Wrangler configuration:

```dotenv
BETTER_AUTH_SECRET=<generated high-entropy value, at least 32 characters>
GITHUB_CLIENT_ID=<local OAuth app client ID>
GITHUB_CLIENT_SECRET=<local OAuth app client secret>
```

`wrangler.local.jsonc` already sets `CLOUD_ENABLED=true`, `BETTER_AUTH_URL=http://localhost:5173`, local-only DB, ASSETS and API routing. It must never be deployed. Run:

```sh
npm ci
npm run types:worker
npx wrangler d1 migrations apply DB --local --config wrangler.local.jsonc
npm run build
# Separate terminals:
npm run dev
npm run dev:api
```

Open `http://localhost:5173`, enter the builder and use Sign in with GitHub. Vite forwards `/api` to local Wrangler on 8787; the browser and OAuth callback stay on 5173. A successful return to `/?builder=1` opens the builder and verifies `/api/me`; it does not automatically replace the current guest draft. A failed/declined login returns the builder with a plain error and preserves local work.

Without credentials, `npm run dev` continues to support the guest app. Do not put test credentials or an identity override in a deployed configuration.

## Automated verification

```sh
npm test
npm run typecheck:worker
npm run typecheck:tests
npm run build
npm run test:worker
npm run deploy:check
npm run test:e2e
```

The Worker harness uses an isolated local D1 and explicit **test-only** OAuth/session secrets. It does not contact GitHub. Seeded database sessions exercise the real cookie verifier and owner queries. OAuth-start tests inspect the provider URL/state and reject forged callbacks, but do not prove a real code exchange. The browser suite includes UI API mocks and a separate built-Worker journey with real local D1, fresh browser contexts, matching exported workspaces/simulation, logout revocation and second-owner GET/PUT denial. See [implementation evidence](CLOUD_BACKEND_IMPLEMENTATION.md).

## Approved staging, then production

`wrangler.staging.jsonc` prepares the exact Worker name `domino-os-staging`, D1 name `domino-os-staging`, callback origin and secret requirements. The user approved staging creation, migrations, saved secrets and deployment on 13 November 2026. D1 `75faa40c-c80c-4fd6-ab27-6dc8f6cc66e4` was created in EEUR and both migrations applied. The staging configuration now contains that actual ID. Production deployment remains unapproved. Deployment results and remaining gates are recorded separately.

After approval: create the staging D1, bind its actual ID, apply the two reviewed migrations remotely, supply the secrets securely and deploy the built frontend/Worker using `--config wrangler.staging.jsonc`. No automatic provisioning, migration-on-request, or production-data tests. Query-string redaction is enabled in deployed observability config to avoid recording OAuth callback codes/state in request URLs.

Production keeps the existing `domino-os` Worker name. Its checked-in config has cloud disabled and no DB binding until approved resource setup is complete. Configure a distinct production D1 ID, the exact production URL and production secrets; enable cloud only after staging passes. Branch previews explicitly disable cloud and remove the DB binding. Inspect the resolved preview deployment before upload to confirm isolation.

## Live acceptance gates

1. Real GitHub sign-in is user-verified: the user reported it worked during testing on 13 November 2026. Declined login, browser logout and old-cookie rejection remain live checks. Confirm Secure/HttpOnly/SameSite=Lax host-only production cookies. No OAuth codes, secrets or tokens in application logs/API responses.
2. User A saves a workspace with nodes, positions, raw incomplete fields and named scenarios. Sign out, then reopen the project in a fresh browser with no shared localStorage.
3. User B sees only B's projects. Direct GET/PUT of A's known ID returns 404, and A's project remains unchanged.
4. Two saves from one version yield one success and one 409. Network failure, timeout, rejected size and sign-out during a request preserve local work and cannot apply stale results.
5. Verify the public landing page, guest builder and deterministic simulator with auth unavailable, then repeat the existing regression suite.

Record Worker version, database/migration state, the accounts/contexts used and results. The user's latest implementation instruction excludes new email-login and CPU work; historical findings remain in the staging record without a new performance claim. No production deployment or live two-account completion claim until separately authorized and verified.
