# **Needtrace — Hackathon Release Checklist**

Deadline: November 14, 20:00

Vilnius time

The goal is to turn the working DominoOS prototype into a polished, cloud-enabled **Needtrace** demo, then prepare the Devpost submission.

I checked GitHub and found two important updates:

- **PR #5 has been merged into&#x20;**`main`**.** The backend is now in the main codebase, and the latest CI run passed.
- The repository is **private**, and `Nedomas` currently has **no collaborator access**. This must change before submission unless you make the repository public.

The recommended order is **product UX → brand → cloud release → final testing → Devpost package**. The Devpost package stays last, but reserve enough time to record and upload the video.

**Release progress**

## 1. Refine frontend and UX
- [ ] Make the first screen explain what Needtrace does, who it helps, and where to start.
- [ ] Give visitors two clear paths: Try demo and Build your network.
- [ ] Make the main demo journey obvious: normal operations → supplier delay → affected orders → recovery.
- [ ] Improve graph readability: node labels, connection colors, zoom, selection, and panels.
- [ ] Simplify builder controls and make validation errors easy to fix.
- [ ] Clarify local save versus cloud save, including loading, success, failure, and conflict states.
- [ ] Review desktop layouts at 1366×768 and smaller laptop sizes; fix clipping and overflow.
- [ ] Run a timed first-time-user test: someone unfamiliar with Needtrace should understand and complete the main flow without instructions.

## 2. Rebrand DominoOS to Needtrace
- [ ] Set Needtrace as the visible app name on the landing page, editor, simulator, menus, and dialogs.
- [ ] Update browser title, description, favicon, logo, and social-sharing preview.
- [ ] Choose consistent brand colors, type, buttons, and short product messaging.
- [ ] Replace user-facing DominoOS references in errors, downloads, documentation, and demo copy.
- [ ] Update README, repository description, and public product links to the new brand.
- [ ] Keep existing saved workspace formats, document IDs, D1 records, and storage keys compatible; avoid breaking existing projects.
- [ ] Decide whether to keep the current workers.dev URL for launch or use a new Needtrace domain; verify OAuth callback settings if the origin changes.

## 3. Enable and verify cloud capability
- [ ] Repeat real GitHub sign-in and save/open on staging using the current custom OAuth build.
- [ ] Verify a clean browser profile can reopen the same saved project with nodes, scenarios, and results intact.
- [ ] Test a second real GitHub account: it must not read, list, or update the first account’s projects.
- [ ] Confirm logout revokes the old session and that account switching preserves separate local drafts.
- [ ] Measure repeated OAuth and project operations on Workers Free, including larger workspaces, and check for CPU-limit failures.
- [ ] Set up production D1 separately from staging, apply migrations, and configure the required secrets and exact AUTH_URL.
- [ ] Enable CLOUD_ENABLED in the intended production deployment and validate GitHub callback URLs.
- [ ] Deploy, run live health/login/create/list/open/update/logout checks, and confirm no secrets appear in logs.
- [ ] Verify guests can still use the demo and local saving when the cloud service is unavailable.
- [ ] Prepare a guest-mode fallback if production cloud proves unreliable on the Free plan.

## 4. Final product QA and release freeze
- [ ] Run unit tests, Worker tests, Chromium journeys, typechecks, build, and deployment checks.
- [ ] Test the complete public Needtrace journey on the production URL.
- [ ] Check empty states, invalid data, large workspaces, failed saves, and cloud version conflicts.
- [ ] Check browser refresh, back navigation, export/import, and readable results.
- [ ] Confirm the app is stable, the deployed build matches the approved commit, and the public link opens without sign-in.
- [ ] Freeze features and keep only critical defect fixes until submission.

## 5. Devpost submission package — last step
- [ ] Prepare the project page: Needtrace, one-sentence tagline, and an About section of 150 words or fewer covering what it does, who it serves, and how it was built.
- [ ] Fill in Built with: React, TypeScript, Vite, Tailwind CSS, React Flow, Cloudflare Workers, D1, GitHub OAuth, and other tools actually used.
- [ ] Add the final production URL under Try it out and test it in an incognito browser.
- [ ] Make the GitHub repository public or invite GitHub user Nedomas to the private repository; confirm access.
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

The key release rule is simple: **the core demo must remain reliable even if cloud saving cannot meet Workers Free limits**. Rebrand and UX changes should not put the existing guest experience at risk.

No repository or deployment settings have been changed by this checklist.