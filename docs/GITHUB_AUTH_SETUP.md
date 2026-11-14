# GitHub sign-in setup — retained, indefinitely deferred

**14 November 2026:** Cloud is indefinitely deferred. The app is browser-only by default. The instructions below are explicit opt-in backend development, not release or demo requirements. A new approval is required before any remote cloud activation.

Current implementation: a small custom GitHub OAuth flow on Workers with D1-backed opaque sessions. Better Auth, its CLI and signing secret are no longer used. No new authentication dependency is required.

## GitHub OAuth app

Keep the existing GitHub OAuth app and client credentials. The callback path is unchanged:

| Environment | Callback |
| --- | --- |
| Local | `http://localhost:5173/api/auth/callback/github` |
| Approved staging | `https://domino-os-staging.tasty-kiwi.workers.dev/api/auth/callback/github` |
| Future production | `https://domino-os.tasty-kiwi.workers.dev/api/auth/callback/github` |

Use a separate app for local/staging versus production where possible. Register only the callback being tested. No owned domain or device flow is needed. The Worker requests only `read:user`, exchanges the code with S256 PKCE, fetches the stable GitHub user ID and discards the GitHub access token. It does not request private email, repository or organization access. See GitHub's official [authorization-code flow](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

## Configuration

`AUTH_URL` is the canonical application origin in each Wrangler config. HTTPS is required except explicit HTTP loopback for local development. `CLOUD_ENABLED` and a D1 `DB` binding control cloud availability.

Only two server secrets are required, supplied through ignored `.dev.vars` locally or Wrangler secrets remotely:

```dotenv
GITHUB_CLIENT_ID=<OAuth app client ID>
GITHUB_CLIENT_SECRET=<OAuth app client secret>
```

Do not use `VITE_` variables, source, localStorage or logs for these values. `BETTER_AUTH_SECRET` is obsolete; an unused legacy value can be removed separately after migration. It is never read by the new runtime. There is no session signing key: cookies contain cryptographically random tokens, and D1 stores their SHA-256 hashes.

## Local development

```sh
npm ci
npm run types:worker
npx wrangler d1 migrations apply DB --local --config wrangler.local.jsonc --env cloud
VITE_CLOUD_ENABLED=true npm run build
# Separate terminals (frontend stays on localhost:5173):
VITE_CLOUD_ENABLED=true npm run dev
npm run dev:api -- --env cloud
```

Use `http://localhost:5173`; the Vite proxy forwards `/api` to Wrangler on 8787. A direct mutation with an incorrect Origin is rejected. GitHub returns to `/?builder=1`; the current local draft is preserved. After refresh, reopen a cloud project through My Projects.

Only an explicitly cloud-enabled frontend probes health. In that mode, a failed public health probe offers Retry cloud connection without reloading or discarding local work. An explicit `cloudEnabled:false` hides cloud controls and does not offer retry. Guest editing and local autosave work without credentials.

## Migrations and the auth transition

Apply migrations in order; do not rewrite `0001_auth.sql` or `0002_projects.sql`.

`0003_github_oauth.sql` creates the current identity/session/one-use OAuth-state/rate-limit tables and imports old GitHub account mappings with the **same internal owner IDs**. Identical legacy mappings are deduplicated; conflicting mappings abort rather than guessing. Existing project rows and workspace document IDs are untouched. Old auth tables remain as unused migration history, not a runtime dependency. No migration or schema generator runs during requests.

Existing sessions must sign in again after this change; their old cookies are ignored. Successful sign-in with the previous Better Auth build is historical evidence and must be repeated for the custom flow.

## Verification

```sh
npm test
npm run typecheck:worker
npm run typecheck:tests
npm run build
npm run test:worker
npm run deploy:check
npm run test:e2e
```

OAuth tests mock only external GitHub HTTP responses and use actual local D1 for one-use state, PKCE, identity mapping, session hashes and revocation. Browser persistence tests seed opaque sessions only in isolated local D1 and exercise the production Worker without API interception. These are not live GitHub-provider proof.

## Historical staging and future release boundary

Use existing `wrangler.staging.jsonc`, Worker `domino-os-staging` and D1 `75faa40c-c80c-4fd6-ab27-6dc8f6cc66e4`. Earlier approval covered the historical staging work below. It does not authorize a new deployment now that cloud is indefinitely deferred. If future work is explicitly approved, the retained commands select the cloud environment:

```sh
npx wrangler d1 migrations apply DB --remote --config wrangler.staging.jsonc --env cloud
VITE_CLOUD_ENABLED=true npm run build
npx wrangler deploy --config wrangler.staging.jsonc --env cloud
```

Query-string redaction remains enabled so callback codes/state are not logged. Production `domino-os` and branch previews remain cloud-disabled with no production DB. Do not create production resources, merge the PR or activate production cloud without separate approval.

The remaining live acceptance checks are save/reopen with scenarios in another browser, retained-old-cookie rejection, and GET/PUT denial from a second real GitHub account. Same-profile real GitHub sign-in, persistence and logout now pass as recorded below. Reliability/performance claims require real authenticated endpoint measurements; no new measurement is inferred from the SDK removal. Current deployment evidence is in [STAGING_VERIFICATION.md](STAGING_VERIFICATION.md).

## Review follow-up

The custom flow now passed real GitHub sign-in and same-profile save/list/open/update/logout/re-sign-in in Helium. Provider fetches must use `redirect: "manual"` and reject 3xx explicitly: Workers does not support `redirect: "error"`. The runtime regression test covers this distinction. Fresh-browser and second-real-account privacy checks remain required. See [current staging evidence and CPU samples](STAGING_VERIFICATION.md#real-github-callback-repair-and-live-verification); several samples exceed 10 ms, so production remains disabled.

Keep the current per-IP limits until venue testing demonstrates contention. Ten starts and twenty callbacks per minute are shared by testers behind one public IP; a 429 should be retried after the supplied delay, without bypassing the limiter.
