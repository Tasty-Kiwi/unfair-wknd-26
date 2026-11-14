# **Needtrace — Hackathon Release Checklist**

Deadline: **14 November 2026, 20:00 Europe/Vilnius**.

Order: product UX → brand → browser-only scope → final QA → Devpost package (last). Mark an item done only with evidence. Release evidence and the local fallback live in [docs/NEEDTRACE_RELEASE.md](docs/NEEDTRACE_RELEASE.md).

**Current release status (14 November 2026):** `main` is `b3ced29`; GitHub verify and Cloudflare Workers Builds passed. All 12 built JS/CSS assets match the live deployment. Landing `/`, project library `/projects`, session-only simulator `/demo`, and compatible `/?builder=1` draft builder are live. The repository is public and readable signed out. This final-review branch is **not deployed**; see [current acceptance evidence](docs/FINAL_PRODUCT_ACCEPTANCE.md). Earlier commit/count records below are historical and do not establish this branch's checks. Cloud remains indefinitely deferred and disabled.

## 1. Frontend and UX

- [x] First screen names manufacturers, supply changes and customer-order impact; inspected in both themes.
- [x] Local UX update (14 November): landing (`/`) → projects (`/projects`) → demo or New project (JSON/CSV import or blank) → project. Verified project isolation, autosave/reopen, legacy drafts, import validation, and keyboard/modal layout at 1440 and 390 px in both themes; 88 browser tests pass. These routes are deployed in `b3ced29`; final-review polish remains undeployed.
- [x] Three presets, allocation evidence and recovery verified: ten covered → two motors short → coverage restored.
- [x] Typed node/relationship colours and dark tokens integrated; zoom and selection inspected.
- [x] Validation, Edit item and Connect paths retained and regression-tested; phone guidance added.
- [x] Device-save wording added; autosave and local cloud-failure/conflict regressions pass.
- [x] Rendered at 1440×900, 1366×768, 1024×768 and 390×844 in both themes with no page overflow.
- [ ] **Timed first-time-user test:** someone unfamiliar with Needtrace completes the main flow without instructions. Record time and where they hesitated.

## 2. Rebrand to Needtrace

- [x] Landing, simulator, builder, app wordmark and dialogs use Needtrace.
- [x] Deployed build serves the Needtrace title, description, Open Graph tags, favicon and `needtrace-social.png` (HTTP 200). A real social-platform unfurl has not been checked.
- [x] Needtrace wordmark/icon, shared theme preference, IBM Plex fonts and red/blue semantics applied.
- [x] README and user-facing names/downloads/docs use Needtrace; only compatibility identifiers and historical evidence keep legacy names.
- [x] Storage keys, workspace format/version, cookies, IDs and OAuth routes preserved; export compatibility verified on production.
- [ ] **Repository description:** still "Unfair Weekend 2026 Hackathon Repo". Update it in GitHub settings (human action).
- [ ] **Hostname decision:** confirm the team accepts `domino-os.tasty-kiwi.workers.dev` for submission. No Needtrace domain is configured. If the origin ever changes, update the OAuth callback settings.

## 3. Cloud — indefinitely deferred

**Decision, 14 November 2026:** Needtrace is browser-only. Cloud saving, GitHub OAuth, sessions and D1 are indefinitely deferred, with no planned release date. They are not hackathon release gates or demo features. Keep the backend code, migrations and existing storage/workspace identifiers for possible future work.

The default client must make **no cloud/API requests** and show no cloud links, sign-in controls, cloud-save actions, connection warnings or retry buttons. Production, branch-preview, local and staging configurations must default to `CLOUD_ENABLED: false`, with no default D1 binding. Guest demo, deterministic simulation, named scenarios, local autosave and JSON import/export remain required.

Reconsidering cloud requires a new explicit scope decision and approval. Retained backend development uses both the explicit `VITE_CLOUD_ENABLED=true` frontend opt-in and the `--env cloud` local/staging configuration. Existing backend session, owner-isolation and version-conflict safeguards must remain intact.

Historical staging results and unfinished acceptance checks remain in [staging verification](docs/STAGING_VERIFICATION.md). They are future reference only. Existing remote staging resources have not been disabled or deleted by this local change; changing those requires a separate explicit deployment/resource request.

## 4. Historical QA and release freeze (13 November baseline)

- [x] Post-merge CI on `91bf9b4` passed: `npm ci`, unit tests, both typechecks, build, Worker tests, `deploy:check` and Playwright e2e ([run 43510209170](https://github.com/Tasty-Kiwi/unfair-wknd-26/actions/runs/43510209170)).
- [x] Deployed build matches the merged commit: Cloudflare **Workers Builds: domino-os** production build succeeded on `91bf9b4` (version `77fa3eb8-1898-4d3c-881c-c78052cb94be`). A local build of `91bf9b4` produces the same `index-CHpcuUtn.js` bundle the public site serves, and all built JS/CSS assets return HTTP 200.
- [x] Public guest journey tested on production: 46/46 guest Playwright tests (landing, judge journey, builder, release/theme, cloud-disabled) passed against `https://domino-os.tasty-kiwi.workers.dev` in fresh, signed-out browser contexts. `/api/health` returns `{"ok":true,"cloudEnabled":false}`.
- [x] Empty/invalid/large inputs, failed saves, theme persistence, export/import and calculation evidence covered by passing tests.
- [x] Engineering freeze: no features or redesign; only reproducible release-blocking fixes.
- [ ] **Manual rehearsal** of the 60-second demo on the presentation machine, plus the [local fallback](docs/NEEDTRACE_RELEASE.md#local-guest-fallback) prepared before going offline.

## 5. Devpost submission — last step (human tasks)

Use [docs/DEVPOST_READY.md](docs/DEVPOST_READY.md) as the single source for official requirements, submission copy, links and human-owned fields. The video plan is in [docs/VIDEO_PRODUCTION.md](docs/VIDEO_PRODUCTION.md); [docs/PITCH.md](docs/PITCH.md) and [DEMO_SCRIPT.md](DEMO_SCRIPT.md) are supporting presenter notes. Nothing has been entered in the portal.

- [x] **Repository access:** public repository confirmed by GitHub and a signed-out browser on 14 November. Historical invitation errors are superseded; if visibility changes to private, verify Nedomas access again.
- [ ] **Video:** record and edit a demo of at most 3:00 that opens on the working product.
- [ ] **Upload:** post it to YouTube or Vimeo as Public or Unlisted and check playback while signed out.
- [ ] **Try it out:** enter `https://domino-os.tasty-kiwi.workers.dev/` (direct demo: `/demo`) and open it in an incognito window.
- [ ] **Built with:** React, TypeScript, Vite, Tailwind CSS, React Flow, Cloudflare Workers hosting, plus any other tools actually used. Describe D1/GitHub OAuth only as retained, deferred backend work; they are not part of the browser-only demo.
- [ ] **Team:** the team name and every member's full name and email.
- [ ] **Disclosures:** truthfully disclose pre-existing work; do not state “None” without team confirmation.
- [ ] **Optional slides link:** slides are optional; add a link only if a useful deck already exists.
- [ ] **Final review:** check links, spelling, permissions, video visibility and required fields, then submit before 20:00 and save the confirmation.

## Suggested cutoffs — 14 November (Vilnius)

| Time      | Milestone                                          |
| --------- | -------------------------------------------------- |
| **12:00** | First-time-user test done; repo access granted     |
| **15:00** | Hostname confirmed; repository description updated |
| **18:00** | Demo recorded, edited and uploaded                 |
| **19:30** | Devpost submitted with all links verified          |
| **20:00** | Official deadline                                  |

Video split: about 20 s problem, 100 s live product, 40 s local builder and evidence, 20 s vision and team. Show the product in the opening seconds.

**Release rule:** the guest demo must stay reliable without cloud. If the public URL fails, present from the tested local fallback.

## Historical execution — earlier 14 November release

- [x] Reviewed and merged PRs #8–#11 sequentially; main CI and Cloudflare builds passed after each. Merged remote task branches deleted after incorporation checks.
- [x] Official event rules consolidated in `docs/DEVPOST_READY.md`; About is under 150 words; no fabricated team details or pre-existing-work attestation.
- [x] Focused UX fixes implemented and independently code/visually reviewed: names, blank-state validation, durable builder navigation/save guard, recovery payoff, laptop space and JSON export clarity.
- [x] Full integrated checks executed; details and safe guest fallback in `docs/archive/historical-releases/FINAL_RELEASE_EXECUTION.md`.
- [x] Source-access gate superseded: repository is public and readable signed out (14 November); no invitation or visibility change performed by this review.
- [ ] Repository owner: update generic repository description. Visibility is public, verified 14 November.
- [ ] Team: confirm team details and pre-existing-work/build-period disclosures; review video, upload to YouTube/Vimeo, submit before deadline and retain confirmation.
- [ ] Cloud: indefinitely deferred; keep all default client/backend paths disabled. No cloud work is required for submission.

## Historical guest UX execution — earlier 14 November release

- [x] PRs #8–#11 incorporated, with successful main CI and production builds checked sequentially.
- [x] Readable builder result names; helpful blank state with strict requested validation; durable builder refresh/history with synchronous draft-save guard.
- [x] Explicit modeled recovery payoff, JSON report label, laptop spacing and selected-scenario contrast.
- [x] Integrated local verification: 102 unit, 44 Worker and 74 Chromium journeys; both typechecks/build/dry run passed.
- [x] Official requirements consolidated in `docs/DEVPOST_READY.md`; About 122 words.
- [x] Historical focused UX PR #12 merged and verified; current production has advanced to `b3ced29`. This review branch still needs approval before merge/deployment.
- [ ] Owner-only repository description update. Nedomas invitation is unnecessary while the verified source remains public.
- [ ] Actual team/member and pre-existing-work facts, watched/uploaded video, and Devpost submission.

## Historical production acceptance — PR #12

- [x] PR #12 merged as `8fca52a7e51bfcd52af2abc9344fc990c946fa4b`; final PR and main Actions plus Cloudflare builds passed. Automated review's partial-recovery finding corrected and resolved before merge.
- [x] Seven production JS/CSS assets byte-match the verified build. Public `/api/health`: `ok: true`, `cloudEnabled: false`.
- [x] 23 real production browser journeys passed: demo/recovery, partial recovery, guest builder navigation and failed-save guard, imports/reset/export/local saving.
- [x] Actual production light/dark 1366×768 and 390×844 screenshots captured in `docs/release/final/production/`.
- [x] Real production browser video with synthesized narration produced: [production demo MP4](docs/release/final/production/needtrace-demo.mp4) (147 seconds, H.264/AAC), plus captions. This is a reviewable draft.
- [ ] Presenter: watch and approve the complete video/audio, upload to YouTube/Vimeo, and check signed-out access.
- [ ] Repository owner: update description. Earlier failed invitation action is superseded by verified public source access.
- [ ] Team/submission owner: supply real team data and truthful pre-existing-work disclosures; complete Devpost, submit and save confirmation.

## Final product panel — 14 November

- [x] Exact GPT-6.1 Terra and Claude Sonnet 5.5 completed independent, adversarial and synthesis rounds; [real responses and decision](docs/FINAL_PRODUCT_DEBATE.md).
- [x] Existing production checked directly: 12 matching JS/CSS assets, guest disruption/recovery, cloud-disabled health and anonymous public source access.
- [x] Final branch implementation and coordinator diff review complete; 147 unit, 51 Worker, 112 full browser and 28 built-asset checks pass, plus both typechecks/build/dry run. 1366×768 journey verified; [acceptance record](docs/FINAL_PRODUCT_ACCEPTANCE.md). PR/CI state is reported at handoff.
- [ ] Explicit approval to merge and deploy the review changes; no production deployment is part of this task.
- [ ] Human unaided test and presentation-machine rehearsal.
- [ ] Human final video/audio review, approval, YouTube/Vimeo upload and signed-out playback check. Existing 147-second recording predates current UI and remains a fallback/reference.
- [ ] Real team/member facts, truthful pre-existing-work/build-period disclosures, final Devpost review/submission and confirmation before 20:00.
