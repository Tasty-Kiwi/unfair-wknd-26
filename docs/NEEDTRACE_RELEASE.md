# Needtrace release status

Status checked 13 November 2026 against live GitHub and the public deployment. The guest release is merged, built and live. Production cloud saving is deferred and disabled. The remaining work is the human submission tasks in [CHECKLIST.md](../CHECKLIST.md).

## Product and public entry

Needtrace is the visible product name. The hostname and Worker identifier keep `domino-os` for compatibility; no Needtrace domain is configured.

| Purpose          | URL                                                 |
| ---------------- | --------------------------------------------------- |
| Marketing        | https://domino-os.tasty-kiwi.workers.dev/landing    |
| Interactive demo | https://domino-os.tasty-kiwi.workers.dev/           |
| Builder          | https://domino-os.tasty-kiwi.workers.dev/?builder=1 |
| Health           | https://domino-os.tasty-kiwi.workers.dev/api/health |

Rebranding is a visible product change, not a storage or cloud migration. Legacy workspace formats, storage keys, IDs, database records and the Worker hostname stay unchanged unless a separately reviewed migration changes them.

## Release record

- **Merge:** PR #7 ("Prepare Needtrace guest release with integrated landing, themes and branding") was squash-merged on 13 November 2026 at 21:23 UTC as `91bf9b45c55001e690bb39b2cbdd0c02d9a96b23`, which is the current `main` head. The `integration/needtrace-release` branch has been deleted on the remote.
- **CI:** the **Verify Needtrace** push run on `91bf9b4` passed ([run 43510209170](https://github.com/Tasty-Kiwi/unfair-wknd-26/actions/runs/43510209170)). It ran `npm ci`, `npm test`, `typecheck:worker`, `typecheck:tests`, `build`, `test:worker`, `deploy:check` and `test:e2e`.
- **Cloudflare:** the **Workers Builds: domino-os** check on `91bf9b4` completed successfully as a production build (build `d3f5750d-2218-4ff4-85ff-89e4ca816c1d`, version `77fa3eb8-1898-4d3c-881c-c78052cb94be`).
- **Deployed source:** a local `npm ci && npm run build` of `91bf9b4` produces the same entry bundle the public site serves (`/assets/index-CHpcuUtn.js`), and every built JS/CSS asset returns HTTP 200 from production.
- **Live behaviour:** `/api/health` returns `{"ok":true,"cloudEnabled":false}`. `/`, `/landing` and `/?builder=1` serve the Needtrace title, description, Open Graph tags and social image.
- **Production browser tests:** with `DOMINO_BASE_URL` pointed at production, 46 of 46 guest Playwright tests passed in fresh, signed-out contexts (`landing`, `judge-journey`, `builder-journey`, `needtrace-release`, `cloud-disabled-journey`). They covered both themes at 1440/1366/1024/390 px, the landing CTAs, the ten-covered → ORD-102 short two motors → Vector recovery journey, imports, local builder save/restore and export compatibility. The cloud sign-in specs were not run because cloud is disabled in production.

Not established by this record: an unaided first-time-user result, a real social-platform link unfurl, or a rehearsal on the presentation machine.

## Cloud saving — deferred and disabled

Production keeps `CLOUD_ENABLED=false`, and rollout is **not approved**. Do not present cloud saving as part of the demo. Evidence so far is the staging record in [STAGING_VERIFICATION.md](STAGING_VERIFICATION.md): one real GitHub account completed sign-in, save/list/open/update, logout and re-sign-in in one browser profile against staging D1.

Open gates before any production enablement:

- Clean-profile restore and retained-old-cookie rejection.
- Second-account isolation.
- Workers Free CPU reliability (current samples exceed the nominal allowance).
- Production D1, secrets and exact `AUTH_URL`.
- Explicit team approval.

## Remaining human tasks

These are tracked in [CHECKLIST.md](../CHECKLIST.md) and are not claimed here:

- Timed first-time-user test.
- Repository description and hostname confirmation.
- Repository access: the repo is private and the `Nedomas` permission check returns `none`.
- Rehearsal on the presentation machine.
- Video of at most 3:00, uploaded and checked signed out.
- Devpost fields, team details, disclosures and final submission.

## Re-check before submitting

Run this shortly before submission, and again if `main` changes:

1. Confirm `main` is still `91bf9b4`, or that any newer commit has passing CI and a successful **Workers Builds: domino-os** check.
2. Run `curl --fail -sS https://domino-os.tasty-kiwi.workers.dev/api/health` and confirm the response is `ok: true` and `cloudEnabled: false`. If cloud shows as enabled, stop and contact the Cloudflare teammate. Do not change settings yourself.
3. In an incognito window, open `/landing`, use both CTAs, toggle the theme and reload, then run the 60-second demo on `/`.
4. Optional automated check: `DOMINO_BASE_URL=https://domino-os.tasty-kiwi.workers.dev npx playwright test tests/landing.spec.ts tests/judge-journey.spec.ts tests/builder-journey.spec.ts tests/needtrace-release.spec.ts tests/cloud-disabled-journey.spec.ts`.

If any step fails, keep the submission link claim on hold, notify the Cloudflare teammate, and present from the local fallback.

## Local guest fallback

Prepare this on the presentation computer **before** losing connectivity, from `91bf9b4` or a later verified `main`:

```sh
npm ci
npm run build
npx wrangler dev --config wrangler.jsonc --local --port 5232
```

This is a local process, not a deployment, and it uses the production configuration with cloud disabled. Open `http://127.0.0.1:5232/` for the demo, `/landing` for marketing and `/?builder=1` for the builder. A frontend-only alternative is `npm run preview -- --host 127.0.0.1 --port 5194`. Rehearse on the actual machine, check display, zoom and power, and keep an exported workspace, report and the finished recording offline.
