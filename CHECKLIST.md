# **Needtrace — Hackathon Release Checklist**

Deadline: **14 November 2026, 20:00 Europe/Vilnius**.

Order: product UX → brand → browser-only scope → final QA → Devpost package (last). Mark an item done only with evidence. Release evidence and the local fallback live in [docs/NEEDTRACE_RELEASE.md](docs/NEEDTRACE_RELEASE.md).

**Release status (checked 13 November 2026):** PR #7 is merged into `main` as `91bf9b45c55001e690bb39b2cbdd0c02d9a96b23`. Post-merge CI passed, the Cloudflare production build of that commit succeeded, and the public URL serves that build in guest mode with cloud saving disabled. Cloud saving is **indefinitely deferred and disabled**; the release is browser-only.

## 1. Frontend and UX

- [x] First screen names manufacturers, supply changes and customer-order impact; inspected in both themes.
- [x] Local UX update (14 November): landing (`/`) → projects (`/projects`) → demo or New project (JSON/CSV import or blank) → project. Verified project isolation, autosave/reopen, legacy drafts, import validation, and keyboard/modal layout at 1440 and 390 px in both themes; 88 browser tests pass. This update has not been deployed.
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

## 4. Final QA and release freeze

- [x] Post-merge CI on `91bf9b4` passed: `npm ci`, unit tests, both typechecks, build, Worker tests, `deploy:check` and Playwright e2e ([run 43510209170](https://github.com/Tasty-Kiwi/unfair-wknd-26/actions/runs/43510209170)).
- [x] Deployed build matches the merged commit: Cloudflare **Workers Builds: domino-os** production build succeeded on `91bf9b4` (version `77fa3eb8-1898-4d3c-881c-c78052cb94be`). A local build of `91bf9b4` produces the same `index-CHpcuUtn.js` bundle the public site serves, and all built JS/CSS assets return HTTP 200.
- [x] Public guest journey tested on production: 46/46 guest Playwright tests (landing, judge journey, builder, release/theme, cloud-disabled) passed against `https://domino-os.tasty-kiwi.workers.dev` in fresh, signed-out browser contexts. `/api/health` returns `{"ok":true,"cloudEnabled":false}`.
- [x] Empty/invalid/large inputs, failed saves, theme persistence, export/import and calculation evidence covered by passing tests.
- [x] Engineering freeze: no features or redesign; only reproducible release-blocking fixes.
- [ ] **Manual rehearsal** of the 60-second demo on the presentation machine, plus the [local fallback](docs/NEEDTRACE_RELEASE.md#local-guest-fallback) prepared before going offline.

## 5. Devpost submission — last step (human tasks)

Use [docs/DEVPOST_READY.md](docs/DEVPOST_READY.md) as the single source for official requirements, submission copy, links and human-owned fields. The video plan is in [docs/VIDEO_PRODUCTION.md](docs/VIDEO_PRODUCTION.md); [docs/PITCH.md](docs/PITCH.md) and [DEMO_SCRIPT.md](DEMO_SCRIPT.md) are supporting presenter notes. Nothing has been entered in the portal.

- [ ] **Repository access:** repo may remain private if GitHub user `Nedomas` is invited. Current permission is `none`; repository description/invite attempts returned 403 (admin rights required). Ask a repository administrator to grant Read access and verify.
- [ ] **Video:** record and edit a demo of at most 3:00 that opens on the working product.
- [ ] **Upload:** post it to YouTube or Vimeo as Public or Unlisted and check playback while signed out.
- [ ] **Try it out:** enter `https://domino-os.tasty-kiwi.workers.dev/landing` (demo: `/`) and open it in an incognito window.
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

## Final execution — 14 November

- [x] Reviewed and merged PRs #8–#11 sequentially; main CI and Cloudflare builds passed after each. Merged remote task branches deleted after incorporation checks.
- [x] Official event rules consolidated in `docs/DEVPOST_READY.md`; About is under 150 words; no fabricated team details or pre-existing-work attestation.
- [x] Focused UX fixes implemented and independently code/visually reviewed: names, blank-state validation, durable builder navigation/save guard, recovery payoff, laptop space and JSON export clarity.
- [x] Full integrated checks executed; details and safe guest fallback in `docs/archive/historical-releases/FINAL_RELEASE_EXECUTION.md`.
- [ ] Repository owner: invite Nedomas with Read access and verify status. Agent admin requests denied (403); permission still `none`.
- [ ] Repository owner: update description; visibility remains private.
- [ ] Team: confirm team details and pre-existing-work/build-period disclosures; review video, upload to YouTube/Vimeo, submit before deadline and retain confirmation.
- [ ] Cloud: indefinitely deferred; keep all default client/backend paths disabled. No cloud work is required for submission.

## Final guest UX execution — 14 November

- [x] PRs #8–#11 incorporated, with successful main CI and production builds checked sequentially.
- [x] Readable builder result names; helpful blank state with strict requested validation; durable builder refresh/history with synchronous draft-save guard.
- [x] Explicit modeled recovery payoff, JSON report label, laptop spacing and selected-scenario contrast.
- [x] Integrated local verification: 102 unit, 44 Worker and 74 Chromium journeys; both typechecks/build/dry run passed.
- [x] Official requirements consolidated in `docs/DEVPOST_READY.md`; About 122 words.
- [ ] Final focused UX PR merge and production source/asset verification (pending CI).
- [ ] Owner-only repository description update and Nedomas invitation (API denied 403).
- [ ] Actual team/member and pre-existing-work facts, watched/uploaded video, and Devpost submission.

## Production acceptance — final guest release

- [x] PR #12 merged as `8fca52a7e51bfcd52af2abc9344fc990c946fa4b`; final PR and main Actions plus Cloudflare builds passed. Automated review's partial-recovery finding corrected and resolved before merge.
- [x] Seven production JS/CSS assets byte-match the verified build. Public `/api/health`: `ok: true`, `cloudEnabled: false`.
- [x] 23 real production browser journeys passed: demo/recovery, partial recovery, guest builder navigation and failed-save guard, imports/reset/export/local saving.
- [x] Actual production light/dark 1366×768 and 390×844 screenshots captured in `docs/release/final/production/`.
- [x] Real production browser video with synthesized narration produced: [production demo MP4](docs/release/final/production/needtrace-demo.mp4) (147 seconds, H.264/AAC), plus captions. This is a reviewable draft.
- [ ] Presenter: watch and approve the complete video/audio, upload to YouTube/Vimeo, and check signed-out access.
- [ ] Repository owner: grant Nedomas Read access and update description; neither admin action succeeded (403).
- [ ] Team/submission owner: supply real team data and truthful pre-existing-work disclosures; complete Devpost, submit and save confirmation.
