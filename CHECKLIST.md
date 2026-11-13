# **Needtrace — Hackathon Release Checklist**

Deadline: November 14, 20:00

Vilnius time

The goal is to present the existing prototype as **Needtrace**, deliver a clear guest demo, decide cloud release only after acceptance, then prepare the Devpost submission.

I checked GitHub and found two important updates:

- **PR #5 has been merged into&#x20;**`main`**.** The backend is now in the main codebase, and the latest CI run passed.
- The repository is **private**, and `Nedomas` currently has **no collaborator access**. This must change before submission unless you make the repository public.

The recommended order is **product UX → brand → cloud release → final testing → Devpost package**. The Devpost package stays last, but reserve enough time to record and upload the video.

**Release progress**

## 1. Refine frontend and UX

- [x] First screen names manufacturers, supply changes and customer-order impact; inspected locally in both themes. Unaided user comprehension remains unvalidated.
- [x] Landing source provides two paths: **Try interactive demo** (`/`) and **Build your network** (`/?builder=1`). Both routes clicked in browser tests at all four requested widths.
- [x] Existing three presets, allocation evidence and recovery actions verified in browser; ten covered → two motors short → coverage restored.
- [x] Integrated typed node/relationship colors and dark tokens; inspected zoom and selection. Mobile canvas needs pan/zoom or forms.
- [x] Existing validation/checks and Edit item/Connect paths retained and regression-tested; added phone guidance.
- [x] Added explicit device-save wording; autosave settles in both themes. Existing cloud failure/conflict local regressions pass; live cloud gates remain open.
- [x] Rendered 1440×900,1366×768,1024×768,390×844 in both themes; no page overflow.
- [ ] Run a timed first-time-user test: someone unfamiliar with Needtrace should understand and complete the main flow without instructions.

## 2. Rebrand legacy product identity to Needtrace

- [x] Source uses Needtrace in the landing page, simulator, builder and app wordmark. Rendered landing/simulator/builder and import/reset dialogs checked.
- [x] Source includes Needtrace browser title/description, favicon and social preview asset. Verify rendered metadata and social preview on the final deployed build before release.
- [x] Needtrace wordmark/icon, shared theme preference, IBM Plex fonts and red/blue semantics applied.
- [x] User-facing name/downloads/docs searched; only compatibility identifiers and historical evidence retain legacy names.
- [ ] Update README, repository description, and public product links to the new brand.
- [x] Existing keys, workspace format/version, cookies, IDs and OAuth routes preserved; export compatibility and saved work checked.
- [ ] Approve the existing legacy workers.dev hostname or configure a Needtrace domain; no new domain is claimed. If the origin changes, verify OAuth callback settings.

## 3. Enable and verify cloud capability

- [x] Existing staging record proves one real GitHub account/profile sign-in/save/open/update/logout/re-sign-in. Fresh-browser and two-account gates below remain open; not repeated by this integration.
- [ ] Verify a clean browser profile can reopen the same saved project with nodes, scenarios, and results intact.
- [ ] Test a second real GitHub account: it must not read, list, or update the first account’s projects.
- [ ] Confirm logout revokes the old session and that account switching preserves separate local drafts.
- [ ] Measure repeated OAuth and project operations on Workers Free, including larger workspaces, and check for CPU-limit failures.
- [ ] Set up production D1 separately from staging, apply migrations, and configure the required secrets and exact AUTH_URL.
- [ ] Enable CLOUD_ENABLED in the intended production deployment and validate GitHub callback URLs.
- [ ] Deploy, run live health/login/create/list/open/update/logout checks, and confirm no secrets appear in logs.
- [x] Production-config local runtime tests verify disabled-cloud guest demo/local saves; unavailable-cloud recovery regressions pass.
- [x] Guest/local builder mode works without cloud; keep production cloud disabled and use tested local fallback.

## 4. Final product QA and release freeze

- [x] Integrated npm ci,102 unit,44 Worker,63 browser tests,typechecks,build and production dry run passed locally.
- [ ] Test the complete public Needtrace journey on the production URL.
- [x] Existing local tests for empty/invalid/large inputs, failed saves and cloud conflicts pass. Live representative reliability remains separate.
- [x] Theme refresh/cross-route, existing builder refresh,export/import,invalid-import preservation and calculation evidence tests pass.
- [ ] Confirm the app is stable, the deployed build matches the approved commit, and the public link opens without sign-in.
- [ ] Freeze features and keep only critical defect fixes until submission.

## 5. Devpost submission package — last step

- [ ] Prepare the project page: Needtrace, one-sentence tagline, and an About section of 150 words or fewer covering what it does, who it serves, and how it was built.
- [ ] Fill in Built with: React, TypeScript, Vite, Tailwind CSS, React Flow, Cloudflare Workers, D1, GitHub OAuth, and other tools actually used.
- [ ] Add the final production URL under Try it out and test it in an incognito browser.
- [ ] Make the GitHub repository public or grant GitHub user Nedomas access; permission check currently reports `none`.
- [ ] Record and edit a demo video of no more than three minutes; start with the product working.
- [ ] Upload the video to YouTube or Vimeo as public or unlisted and verify playback without your account.
- [ ] Add the team name and every member to Devpost; enter the full names and email addresses required by the form.
- [ ] Complete the disclosures: confirm the project began at the hackathon and state any pre-existing work truthfully, or None.
- [ ] Add an optional slides link only if a deck is already useful; do not spend release time creating one.
- [ ] Review all links, spelling, permissions, video visibility, and required fields; submit before 20:00.

## **Suggested cutoff times for November 14**

| Deadline (Vilnius) | Milestone                                                |
| ------------------ | -------------------------------------------------------- |
| **12:00**          | UX and Needtrace branding mostly complete                |
| **15:00**          | Production cloud decision and functional checks complete |
| **17:00**          | Feature freeze; only critical fixes afterward            |
| **18:00**          | Record and edit final demo                               |
| **19:30**          | Aim to submit Devpost with all links verified            |
| **20:00**          | Official submission deadline                             |

For the video, I would allocate roughly **20 seconds to the problem, 100 seconds to the live product, 40 seconds to scenarios and cloud saving, and 20 seconds to the vision and team**. The product should be visible from the opening seconds.

The key release rule is simple: **the core demo must remain reliable even if cloud saving cannot meet Workers Free limits**. Production cloud is disabled and not approved. Staging evidence shows some authenticated request CPU samples above the nominal Free allowance; fresh-browser restoration, retained-old-cookie rejection and live second-account isolation also remain open. See [staging verification](docs/STAGING_VERIFICATION.md).

No repository or deployment settings have been changed by this checklist.

## Integrated release evidence

See docs/NEEDTRACE_RELEASE.md and HACKATHON_READINESS.md. Local review only: no new production deployment or cloud authorization. Current repository permission check: Nedomas none. Production cloud stays disabled. Video/submission/real-user test remain human tasks.
