# Needtrace — submission preparation

Target deadline supplied by the team: **14 November 2026, 20:00 Europe/Vilnius**. An entrant must confirm official eligibility, required fields, video limits and deadline in the event portal. This document does not certify compliance or submission.

## Materials

- [30-second pitch, differentiation and judge answers](PITCH.md).
- [60-second live demonstration](../DEMO_SCRIPT.md).
- [Technical readiness and tested limits](../HACKATHON_READINESS.md).
- [Unaided-user protocol](VALIDATION_PLAYBOOK.md), currently not conducted.

## Project title and tagline

**Needtrace — trace supply changes to customer orders**

**See what breaks before it breaks.**

## Project description

### Devpost About (122 words)

Needtrace helps manufacturing planners see which customer orders are exposed when material deliveries slip. Connect stock, bills of material, dated receipts, products and orders; change a receipt; trace shortages to the affected order; and compare modeled recovery options with inspectable allocation evidence. In the fictional demo, a six-day motor delay leaves ORD-102 short by two motors, while approved alternative supply restores material coverage in the simulation. Needtrace is a browser prototype built with React, TypeScript and Vite, using a deterministic TypeScript simulation and React Flow network view. CSV and JSON imports support testing a plan. The prototype does not confirm supplier commitments, place purchases, model factory capacity or forecast shipment dates. Customer demand, savings and willingness to pay have not been validated.

### Verified “Built with” list

React, TypeScript, Vite, Tailwind CSS, React Flow, Cloudflare Workers, Cloudflare D1, GitHub OAuth, Zod, Vitest and Playwright. The public demo currently runs guest-only; optional cloud capability is disabled in production and is not a release claim.

### Final release links

- Marketing/project page: **https://domino-os.tasty-kiwi.workers.dev/landing**
- Interactive demo: **https://domino-os.tasty-kiwi.workers.dev/**
- Editable builder: **https://domino-os.tasty-kiwi.workers.dev/?builder=1**
- Source: **https://github.com/Tasty-Kiwi/unfair-wknd-26** (private; Nedomas permission is currently `none`).

Keep this hostname and OAuth origins unchanged. Production serves the merged PR #7 build (`91bf9b4`); see [release status](NEEDTRACE_RELEASE.md). Enter the marketing page under Try it out if one URL is allowed, and include the direct demo link in the description. Re-check each link in a clean browser shortly before submission. Production cloud saving remains disabled and is not a demo promise.

## Differentiation

The demonstrated combination is a supplier-to-order view, inspectable reservations, independent recovery comparisons and explicit import provenance in a focused browser prototype. We are testing whether this helps planners combining spreadsheets. We have not established unique market coverage, easier onboarding than existing products, willingness to pay, time savings or customer adoption. Related CSV tables still require preparation; the allocation policy may differ from a real factory's priorities.

## Final video and screenshot package

Use the **2:45 recording script** in [DEMO_SCRIPT.md](../DEMO_SCRIPT.md), with a 3:00 hard limit and an actual timed rehearsal. The 60-second core script remains available for live judging. No recording or upload is claimed. Watch the exported video from start to finish, check audio/text legibility, and test the public/unlisted YouTube or Vimeo link signed out.

### Selected authentic screenshots

These are actual local captures of the PR #7 guest build that is now deployed (`91bf9b4`). Use the first three as the main product story; mobile and light views are optional alternatives. Keep fictional-data context in captions and do not use social artwork as a substitute for product evidence.

1. [Dark landing](release/screenshots/landing-dark-1440.png) — “Needtrace: see which orders are affected when supply changes. Fictional demonstration.”
2. [Real supplier-to-order path](../public/landing/simulator-detail.png) — “A six-day motor receipt delay leaves ORD-102 two motors short. Fictional material-availability scenario.”
3. [Editable builder](release/screenshots/builder-selected-dark.png) — “Author a network locally and inspect typed relationships. Fictional example; production cloud disabled.”
4. [Light simulator](release/screenshots/simulator-light-1440.png) — “Baseline: all ten fictional customer orders have material coverage.”
5. [Mobile landing](release/screenshots/landing-dark-390.png) — “Responsive guest demo and direct builder entry.”

The existing product crop in item 2 was captured during landing work and has the same unchanged allocation behavior; use the rebranded screenshot set for views containing a wordmark. Select only readable images; inspect any Devpost thumbnail/crop before publishing.

### Required-field checklist for the submission owner

- [ ] Project title, tagline, About <=150 words, intended user and honest problem/solution description.
- [ ] Built with list above, checked against actual source; label D1/OAuth as optional staging capability, not enabled production functionality.
- [ ] Verified marketing/demo links; source link with judge access granted or team-approved public visibility.
- [ ] <=3-minute video URL with public/unlisted signed-out playback; chosen product screenshots and captions.
- [ ] Actual team name, every required member name/email, invitations/acceptance and eligibility information from the team.
- [ ] Truthful pre-existing-work, tools/AI-assistance, asset/license and other disclosures required by the official form; do not assume “None.”
- [ ] Review the actual event form for additional mandatory questions, acknowledgements and official deadline. This repository checklist does not certify event compliance.
- [ ] Team reviews the preview, submits before 14 November 20:00 Europe/Vilnius and saves the confirmation.

## Human owners — assign names before handoff

No names are inferred. One person may hold multiple roles, but each responsibility must have an actual owner.

| Role                                   | Required action                                                                                      | Completion evidence                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Team approver / authorized maintainer  | Done: PR #7 merged as `91bf9b4`; approve any further release-blocking fix before it reaches main     | Merge SHA recorded in NEEDTRACE_RELEASE.md                                            |
| Cloudflare teammate / release verifier | Done for `91bf9b4`; re-run the pre-submission re-check and keep cloud disabled                       | Production build tied to main SHA, clean-browser results, health cloudEnabled false   |
| Repository administrator               | Grant Nedomas access and verify permission, or obtain team approval to make the repository public    | Intended judge account can open the repository; latest permission lookup remains none |
| Presenter / video owner                | Rehearse, record <=3:00, upload public/unlisted and test signed out; keep offline copy               | Playable final video URL and actual duration                                          |
| Submission owner                       | Enter actual team details, assets, links and disclosures; obtain team review; submit before deadline | Portal preview reviewed and submission confirmation saved                             |

## Three-person final checklist

Assign actual names before submission. Responsibilities below are not claims of completed work.

**Person 1 — presenter / product owner**

- [ ] Rehearse the 30-second pitch and 60-second demo aloud with actual clicks. Use desktop; mobile needs more scrolling.
- [ ] Run one unaided outsider session if time allows. Record actual hesitation and assistance; a guided demo is not customer validation.
- [ ] Prepare answers on exposed order value, reservation policy, data preparation and simulations versus supplier commitments.

**Person 2 — release owner / presentation reliability**

- [ ] Coordinate the reviewed revision and presentation URL with the teammate owning production. Obtain authorization before any push or merge.
- [ ] On the presentation machine, test the entire demonstration and compare recovery wording/import safeguards with the approved revision.
- [ ] Prepare the local fallback: `npm ci`, `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 5194`. Install and start before losing connectivity; test with the network disconnected.
- [ ] Check browser zoom, display cable, screen resolution and power. Keep a video backup offline.

**Person 3 — submission / video owner**

- [ ] Confirm official rules, membership/eligibility, required acknowledgements, license obligations, video length and deadline.
- [ ] Record/export the video; watch it start to finish and test its shared link signed out.
- [ ] Enter the description, team, repository, approved demo URL and video. Claim only observed engineering results and fictional-scenario outcomes.
- [ ] Confirm the repository is public or invite GitHub user `Nedomas` to the private repository, then verify access using the intended account.
- [ ] Capture requested screenshots from the final approved build; check that they show the actual product and disclose fictional data where relevant.
- [ ] Enter the real team name, all member names and the email addresses required by Devpost. Do not infer team details from this draft.
- [ ] All three review the submission preview; submit before the deadline and save confirmation. Nothing has been submitted automatically.

## Submission status

The About copy above is 122 words (under the 150-word limit). It is draft text, not a submitted project page. No recording, upload, team-field entry, public repository change or Devpost submission has been completed. Actual local screenshots are shortlisted above; a fresh GitHub lookup still reports Nedomas permission none. Production release and the Try it out URL still require the checks recorded in [staging verification](STAGING_VERIFICATION.md).

## Stop rule

Fix a demonstrated failure in the core demo or a misleading claim. Otherwise stop adding code. Preserve time for rehearsal, readable recording, submission and backup checks. Explain limitations rather than attempting new integrations or features.
