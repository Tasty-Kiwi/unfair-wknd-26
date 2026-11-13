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
- Production D1, secrets, exact production `AUTH_URL`, cloud enablement and production deployment have not been authorized or completed. Production cloud remains disabled and its rollout is not approved; guest-release approval is separate.
- Before Devpost: deploy only after explicit release approval, then verify the intended public URL in a fresh browser; confirm repository visibility or access for GitHub user `Nedomas` (current permission check: none); enter actual team details and disclosures; record a video no longer than three minutes; capture any required screenshots; verify public/unlisted playback; review the final submission and submit before the event deadline.

## Current submission posture

The Devpost About and video outline in [submission preparation](SUBMISSION.md) are drafts. No recording, video upload, team-field verification or Devpost submission is claimed. Local screenshot captures are in docs/release/screenshots; the live GitHub permission lookup returned Nedomas: none. Use the public URL only after confirming the build and access from a clean profile. Do not describe cloud features as part of the production demo while they remain disabled.

Detailed staging evidence and limitations: [STAGING_VERIFICATION.md](STAGING_VERIFICATION.md).

## Integration scope and decision

Based on remote main f72c314; cherry-picked unique commits f1a9cce,102a261,628bd02. Git reported no textual conflicts. Semantic conflict was duplicate theme bootstraps/independent landing state: replaced with one shared runtime store and one prepaint bootstrap, retaining the old preference key. Cloud-enabled BuilderExperience on main was preserved; only theme UI, visible brand/export names and device-save help changed. Historical screenshot archives newly introduced by the landing branches were removed from the final diff; a small final/review set was retained.

Guest-mode code is ready for team review after CI. Production cloud is NOT APPROVED. The public URL has not been verified as containing this integrated commit. Nothing merged or deployed. Repo description still says Unfair Weekend 2026 Hackathon Repo; changing that optional repository setting and clearing the name/domain are human business actions.

## Final pre-release review and exact team procedure

Reviewed PR #7 head **174c09e262c3751c506e2a4708f56c05b8e2b6c2**, based on remote main **f72c314788e0b79ed95af4af465c5c9a1de9368b**. PR is open and mergeable. Both [push CI](https://github.com/Tasty-Kiwi/unfair-wknd-26/actions/runs/43508013577) and [PR CI](https://github.com/Tasty-Kiwi/unfair-wknd-26/actions/runs/43508020772) passed on that head, including all required commands. The separate Workers branch-preview check also passed; that is not proof of a production deployment.

The final local production-build acceptance smoke check repeated both themes at 1366×768 and 390×844: landing CTAs, simulator entry, builder entry/device save, refresh persistence and import/reset dialogs. The demo and downloaded report confirm ten orders, ORD-102 short two motors after the six-day delay, and coverage restored by two Vector motors while PO-101 stays at 23 November. Existing workspace format/key/version and cloud session identifiers are unchanged. No runtime/config changes were required in this final review; the complete regression suite was not rerun because its CI already covers the unchanged application head. One initial inspection probe used a button locator for a radio control, and a report probe used `results` instead of `result`; corrected probes passed. These were review-script errors, not product defects.

### Human release owner — execute only after team authorization

1. Review PR #7 and approve it through an authorized team account. Immediately recheck its head, mergeability and checks. If the head has changed from the reviewed SHA above, review that change and verify its CI before proceeding.
2. After explicit team authorization, squash-merge the reviewed head. Example command for the release owner, **not executed by this review**:

   ```sh
   gh pr merge 7 --repo Tasty-Kiwi/unfair-wknd-26 --squash --match-head-commit 174c09e262c3751c506e2a4708f56c05b8e2b6c2
   gh pr view 7 --repo Tasty-Kiwi/unfair-wknd-26 --json state,mergeCommit,mergedAt
   gh api repos/Tasty-Kiwi/unfair-wknd-26/commits/main --jq .sha
   ```

   Record the resulting merge SHA; a squash merge creates a different SHA from the PR head. If main has advanced since, identify which exact main revision the deployment built. Do not force-push or assume the PR SHA is the deployed main SHA.

3. Allow the configured automatic Cloudflare build from main. No manual deployment command is required. The Cloudflare teammate checks the build result and deployed source commit against the recorded main SHA. Keep production `CLOUD_ENABLED=false`; no D1, OAuth-origin, hostname or secret changes are part of this release.
4. Require both a successful production build result and source-commit evidence. A working HTTP response, Needtrace wordmark, or successful GitHub Actions run alone cannot identify a deployed commit. If deployment metadata cannot establish the source SHA, have the teammate compare published bundle filenames/content hashes against the build of that main revision under its actual build settings. Do not claim exact version verification until the evidence agrees.
5. In a new clean browser profile, verify:
   - Marketing: **https://domino-os.tasty-kiwi.workers.dev/landing**.
   - Demo: **https://domino-os.tasty-kiwi.workers.dev/**.
   - Builder: **https://domino-os.tasty-kiwi.workers.dev/?builder=1**.
   - Both landing CTAs; light/dark choice across navigation/reload; import warning/reset confirmation; no GitHub sign-in required for guest work; local builder save/reopen/export.
   - Complete the 60-second demo: ten covered → PO-101 17→23 Nov → ORD-102 two motors short → allocation evidence → compare both responses → apply Vector → all covered while Aster remains late. Export a report and check the current scenario/result.
6. If build or live acceptance fails, stop the public release/submission-link claim. Ask the Cloudflare teammate to diagnose or, if appropriate, restore the known-good deployment using the team's approved process. This review does not authorize rollback/settings changes. Do not repeatedly merge speculative fixes. Use the prepared local fallback for the presentation.

### Tested local guest fallback

Prepare on the presentation computer **before** losing connectivity, from the reviewed revision (or approved merged revision after equivalent checks):

```sh
npm ci
npm run build
npx wrangler dev --config wrangler.jsonc --local --port 5232
```

This is a local process, not a deployment. The current acceptance check used that production configuration, whose cloud flag is false. Open `http://127.0.0.1:5232/` for the demo, `/landing` for marketing, and `/?builder=1` for the builder. Keep the terminal and downloaded dependencies installed. A frontend-only alternate is `npm run preview -- --host 127.0.0.1 --port 5194`; the guest app tolerates unavailable cloud, but use the tested local Worker path first. Rehearse on the actual machine, check display/zoom/power, export the workspace/report, and keep the finished recording offline. No physical-machine/offline rehearsal is claimed here.

### Final recommendation

**Approve guest-only PR #7 for team-authorized merge; no application release blocker found in the reviewed paths.** Production acceptance remains pending until automatic deployment and clean-browser checks complete. Production cloud remains NOT APPROVED; its outstanding live-account/CPU gates are deferred and must not be presented as completed guest-release work. GitHub still reports `Nedomas: none` on the private repository; grant and verify judge access or approve repository visibility before submission. Name/domain clearance, actual team entries, video, portal validation and submission remain human actions.

The prior handoff documentation was committed and pushed as 174c09e. At the start of this status refresh, the local integration branch matched the remote exactly and the working tree was clean. This refresh changes documentation only; these new edits remain local and uncommitted. No merge, branch deletion, deployment or infrastructure change was performed.

## Compact production smoke-test card

Use after the authorized merge, on the **production** deployment rather than the PR preview:

1. Record `mergeCommit.oid` from PR #7. The Cloudflare teammate must show a successful main-triggered production build and a deployed source SHA matching that commit (or explicitly identify a later reviewed main commit). Save the build URL/SHA. Preview success alone does not pass this check.
2. In a fresh signed-out browser, open `https://domino-os.tasty-kiwi.workers.dev/landing`. Select Light and Dark, reload, and confirm the choice persists. Check at 1366px laptop and 390px phone width.
3. Click **Try interactive demo**: it must open `/`. Return to landing and click **Build your network**: it must open `/?builder=1`. Neither guest path may require GitHub login. Create/load a local example, save, reload and confirm local restoration.
4. On `/`, reset to fictional data: ten orders covered. Choose Supplier disruption: PO-101 moves 17→23 Nov; ORD-102 needs four motors by 22 Nov and is short two. Inspect allocation evidence; compare both recovery options; apply Vector. Coverage must return while PO-101 stays at 23 Nov. Check the exported report matches the current scenario.
5. Verify the public backend explicitly:

   ```sh
   curl --fail --silent --show-error https://domino-os.tasty-kiwi.workers.dev/api/health
   ```

   Require JSON with `ok: true` and **`cloudEnabled: false`**. Confirm cloud saving/sign-in controls are unavailable in the guest builder. If cloud is enabled, stop acceptance and contact the Cloudflare teammate; do not change settings in this review.

6. Only after all checks pass, use `/landing` as the marketing link and `/` as the direct demo link in the submission. Save the actual production verification evidence; this document does not assert it happened.
7. If any production gate fails, keep production acceptance unchecked, notify the Cloudflare teammate, and switch the presentation to the tested local guest runtime. Use the local fallback commands above; keep the previous known-good deployment available under the team's recovery process. No new manual deployment or infrastructure changes are authorized.

Refresh of release status: remote main remains f72c314; PR #7 remains 174c09e, open and mergeable. GitHub reports no reviews and no review threads; there are no recorded unresolved findings, but team approval has **not** occurred. Both application CI runs and the branch-preview check passed. No application/config changes since that verified head; no expensive regression rerun needed. The current local fallback health check again returned `ok: true, cloudEnabled: false`. Public deployment/version verification remains outstanding. The submission package now has a role-based ownership table; actual names must be supplied by the team.

## Merge and cleanup gate — latest GitHub refresh

PR #7 is still OPEN at `174c09e262c3751c506e2a4708f56c05b8e2b6c2`; remote main is `f72c314788e0b79ed95af4af465c5c9a1de9368b`. Both application checks and Cloudflare branch-preview build succeeded on the latest PR head. There are no GitHub reviews or review threads recorded; approval is still a human task. No merge commit exists yet. Production cloud configuration remains false.

Do not delete local or remote `integration/needtrace-release` while the PR is open. After an authorized merge, fetch main and verify complete content incorporation (including squash merges), clean local state and no leftover commits before normal branch deletion. Confirm the automatic production build and deployed source SHA, then execute the production smoke-test card above. No production version claim is made by this pre-merge refresh.
