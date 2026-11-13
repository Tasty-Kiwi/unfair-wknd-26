# Needtrace release status

Status checked 13 November 2026. This note separates the current product identity and implementation from the release evidence still needed before public submission.

## Product and public entry

Needtrace is the visible product name. The current hostname and Worker identifier retain `domino-os` for compatibility; no Needtrace domain is configured or guaranteed. The existing public URL is `https://domino-os.tasty-kiwi.workers.dev`, and it serves the guest experience with cloud features disabled. The app provides the simulator at `/` and landing at `/landing`; **Try interactive demo** opens `/` and **Build your network** opens `/?builder=1`. Both paths were verified locally across all four widths and themes; public verification after merge remains required.

Rebranding is a visible product change, not a storage or cloud migration. Preserve legacy workspace formats, storage keys, IDs, database records and the deployed Worker hostname unless a separately reviewed migration deliberately changes them.

## Evidence available

- The staging record documents one real GitHub account completing sign-in, save/list/open/update, logout and re-sign-in in the same existing browser profile against staging D1.
- Local checks on the integrated guest revision executed during integration: `npm ci` with zero vulnerabilities, 102 unit tests, 44 Worker tests, Worker and test-source typechecks, build, production-config dry run, and 63 Chromium journeys, including nine focused rebrand/theme/compatibility cases.
- Public HTTP smoke checks on staging include guest routes, health, anonymous API rejection, OAuth start protections and safe rejection of a forged callback.
- Production configuration remains cloud-disabled; the production version was checked unchanged in the staging report.

These facts do not establish production release acceptance. Local seeded-session tests are not live account-isolation evidence, and a successful HTTP response does not prove Workers Free CPU reliability. No public deployment of the integrated revision has been verified.

## Open release gates

- Completed locally on the integrated revision (see HACKATHON_READINESS.md); rerun after any later code changes: `npm test`, `npm run typecheck:worker`, `npm run typecheck:tests`, `npm run build`, `npm run test:worker`, `npm run test:e2e`, and `npm run deploy:check`.
- Rendered QA completed at all four requested widths in both themes; CTAs, import/reset dialogs and device save checked. Timed first-time-user testing remains pending.
- Check a clean browser profile can restore a staging project, reject a retained old cookie where applicable, and verify a second real GitHub account cannot list/read/update the first account's projects.
- Measure repeated authenticated OAuth and project operations, including larger workspaces and cold/warm requests, on Workers Free. Current samples include requests above the nominal allowance; the CPU reliability gate has not passed.
- Production D1, secrets, exact production `AUTH_URL`, cloud enablement and production deployment have not been authorized or completed. Production cloud remains disabled and production release is not approved.
- Before Devpost: deploy only after explicit release approval, then verify the intended public URL in a fresh browser; confirm repository visibility or access for GitHub user `Nedomas` (current permission check: none); enter actual team details and disclosures; record a video no longer than three minutes; capture any required screenshots; verify public/unlisted playback; review the final submission and submit before the event deadline.

## Current submission posture

The Devpost About and video outline in [submission preparation](SUBMISSION.md) are drafts. No recording, video upload, team-field verification or Devpost submission is claimed. Local screenshot captures are in docs/release/screenshots; the live GitHub permission lookup returned Nedomas: none. Use the public URL only after confirming the build and access from a clean profile. Do not describe cloud features as part of the production demo while they remain disabled.

Detailed staging evidence and limitations: [STAGING_VERIFICATION.md](STAGING_VERIFICATION.md).

## Integration scope and decision

Based on remote main f72c314; cherry-picked unique commits f1a9cce,102a261,628bd02. Git reported no textual conflicts. Semantic conflict was duplicate theme bootstraps/independent landing state: replaced with one shared runtime store and one prepaint bootstrap, retaining the old preference key. Cloud-enabled BuilderExperience on main was preserved; only theme UI, visible brand/export names and device-save help changed. Historical screenshot archives newly introduced by the landing branches were removed from the final diff; a small final/review set was retained.

Guest-mode code is ready for team review after CI. Production cloud is NOT APPROVED. The public URL has not been verified as containing this integrated commit. Nothing merged or deployed. Repo description still says Unfair Weekend 2026 Hackathon Repo; changing that optional repository setting and clearing the name/domain are human business actions.
