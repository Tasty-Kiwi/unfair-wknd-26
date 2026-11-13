# **Needtrace — Hackathon Release Checklist**

Deadline: **14 November 2026, 20:00 Europe/Vilnius**.

Order: product UX → brand → cloud decision → final QA → Devpost package (last). Mark an item done only with evidence. Release evidence and the local fallback live in [docs/NEEDTRACE_RELEASE.md](docs/NEEDTRACE_RELEASE.md).

**Release status (checked 13 November 2026):** PR #7 is merged into `main` as `91bf9b45c55001e690bb39b2cbdd0c02d9a96b23`. Post-merge CI passed, the Cloudflare production build of that commit succeeded, and the public URL serves that build in guest mode with cloud saving disabled. Production cloud saving stays **deferred and disabled**.

## 1. Frontend and UX

- [x] First screen names manufacturers, supply changes and customer-order impact; inspected in both themes.
- [x] Landing offers **Try interactive demo** (`/`) and **Build your network** (`/?builder=1`); both verified at 1440, 1366, 1024 and 390 px.
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

## 3. Cloud saving — deferred, disabled, NOT approved

Production runs `cloudEnabled: false`. Do not enable it for this release or present cloud saving as a demo feature. Open gates, for after the hackathon:

- [x] Staging: one real GitHub account completed sign-in/save/open/update/logout/re-sign-in ([staging verification](docs/STAGING_VERIFICATION.md)).
- [x] Guest/local builder works without cloud; disabled-cloud and unavailable-cloud regressions pass, including on production.
- [ ] Clean browser profile reopens a saved staging project with nodes, scenarios and results intact.
- [ ] A second real GitHub account cannot list, read or update the first account's projects.
- [ ] Logout revokes the old session; account switching keeps separate local drafts.
- [ ] Workers Free CPU reliability under repeated OAuth/project operations and larger workspaces (current staging samples exceed the nominal allowance).
- [ ] Production D1, migrations, secrets and exact `AUTH_URL`; then `CLOUD_ENABLED`, callback URLs and live checks. Requires explicit team approval.

## 4. Final QA and release freeze

- [x] Post-merge CI on `91bf9b4` passed: `npm ci`, unit tests, both typechecks, build, Worker tests, `deploy:check` and Playwright e2e ([run 43510209170](https://github.com/Tasty-Kiwi/unfair-wknd-26/actions/runs/43510209170)).
- [x] Deployed build matches the merged commit: Cloudflare **Workers Builds: domino-os** production build succeeded on `91bf9b4` (version `77fa3eb8-1898-4d3c-881c-c78052cb94be`). A local build of `91bf9b4` produces the same `index-CHpcuUtn.js` bundle the public site serves, and all built JS/CSS assets return HTTP 200.
- [x] Public guest journey tested on production: 46/46 guest Playwright tests (landing, judge journey, builder, release/theme, cloud-disabled) passed against `https://domino-os.tasty-kiwi.workers.dev` in fresh, signed-out browser contexts. `/api/health` returns `{"ok":true,"cloudEnabled":false}`.
- [x] Empty/invalid/large inputs, failed saves, theme persistence, export/import and calculation evidence covered by passing tests.
- [x] Engineering freeze: no features or redesign; only reproducible release-blocking fixes.
- [ ] **Manual rehearsal** of the 60-second demo on the presentation machine, plus the [local fallback](docs/NEEDTRACE_RELEASE.md#local-guest-fallback) prepared before going offline.

## 5. Devpost submission — last step (human tasks)

Drafts are ready in [docs/SUBMISSION.md](docs/SUBMISSION.md), [docs/PITCH.md](docs/PITCH.md) and [DEMO_SCRIPT.md](DEMO_SCRIPT.md). Nothing has been entered in the portal.

- [ ] **Repository access:** make the repo public or grant GitHub user `Nedomas` access. The permission check still returns `none` and the repo is private.
- [ ] **Video:** record and edit a demo of at most 3:00 that opens on the working product.
- [ ] **Upload:** post it to YouTube or Vimeo (public or unlisted) and check playback while signed out.
- [ ] **Try it out:** enter `https://domino-os.tasty-kiwi.workers.dev/landing` (demo: `/`) and open it in an incognito window.
- [ ] **Built with:** React, TypeScript, Vite, Tailwind CSS, React Flow, Cloudflare Workers, D1, GitHub OAuth, plus any other tools actually used.
- [ ] **Team:** the team name and every member's full name and email.
- [ ] **Disclosures:** state that the project began at the hackathon, and list any pre-existing work truthfully (or None).
- [ ] **Optional slides link:** only if a useful deck already exists.
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
