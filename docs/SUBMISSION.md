# Needtrace — submission preparation

Target deadline supplied by the team: **14 November 2026, 20:00 Europe/Vilnius**. An entrant must confirm official eligibility, required fields, video limits and deadline in the event portal. This document does not certify compliance or submission.

## Materials

- [30-second pitch, differentiation and judge answers](PITCH.md).
- [60-second live demonstration](../DEMO_SCRIPT.md).
- [Technical readiness and tested limits](../HACKATHON_READINESS.md).
- [Unaided-user protocol](VALIDATION_PLAYBOOK.md), currently not conducted.

## Project description

### Devpost About (122 words)

Needtrace helps manufacturing planners see which customer orders are exposed when material deliveries slip. Connect stock, bills of material, dated receipts, products and orders; change a receipt; trace shortages to the affected order; and compare modeled recovery options with inspectable allocation evidence. In the fictional demo, a six-day motor delay leaves ORD-102 short by two motors, while approved alternative supply restores material coverage in the simulation. Needtrace is a browser prototype built with React, TypeScript and Vite, using a deterministic TypeScript simulation and React Flow network view. CSV and JSON imports support testing a plan. The prototype does not confirm supplier commitments, place purchases, model factory capacity or forecast shipment dates. Customer demand, savings and willingness to pay have not been validated.

### Suggested “Built with” list

React, TypeScript, Vite, Tailwind CSS, React Flow, Cloudflare Workers, Cloudflare D1, GitHub OAuth, Zod, Vitest and Playwright. The public demo currently runs guest-only; optional cloud capability is disabled in production and is not a release claim.

### Try it out link status

The current public deployment is `https://domino-os.tasty-kiwi.workers.dev`, a legacy hostname serving the guest prototype with cloud features disabled. It has not been rebranded to a Needtrace domain. Do not substitute a guessed hostname or describe the production deployment as freshly verified. Verify the approved URL in a fresh browser before entering it in Devpost. Current evidence and release gaps are recorded in [staging verification](STAGING_VERIFICATION.md).

## Differentiation

The demonstrated combination is a supplier-to-order view, inspectable reservations, independent recovery comparisons and explicit import provenance in a focused browser prototype. We are testing whether this helps planners combining spreadsheets. We have not established unique market coverage, easier onboarding than existing products, willingness to pay, time savings or customer adoption. Related CSV tables still require preparation; the allocation policy may differ from a real factory's priorities.

## Three-minute video outline

| Time      | Picture / action                                                  | Message                                                                                                                                                               |
| --------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:30 | Needtrace title, then working baseline map and ten covered orders | Start with the working product and deliver the 30-second pitch. Identify the intended planner and ask: which order loses coverage if a receipt slips?                 |
| 0:30–1:30 | Full-screen desktop app                                           | Perform the complete 60-second script: baseline, six-day delay, ORD-102 allocation, both recovery cards, Vector recovery.                                             |
| 1:30–1:55 | Reopen disrupted scenario and its allocation/timeline             | Explain required-date priority, six reserved motors, two remaining and late receipt. Show editable inputs. This is deterministic simulation, not a shipment forecast. |
| 1:55–2:20 | Import dialog, then partial products CSV preview                  | Show session-only storage, retained BOMs and mixed-data warning. Cancel. Use no private customer files.                                                               |
| 2:20–2:40 | Recovery assumptions and exported report                          | Applying recovery changes a scenario, not a purchase. Reports include evidence/provenance; costs, capacity and supplier confirmation are outside the model.           |
| 2:40–3:00 | Covered result; simple closing frame                              | State what is demonstrated and what remains unvalidated. Next: an unaided session and planner policy comparison. Close with Needtrace and the team-approved link.     |

Record at readable desktop resolution and normal zoom. Favor clear narration over music. Use pauses and pointer movement to identify evidence. Hide personal tabs and notifications. Trim dead time without disguising behavior. Watch the exported file to check duration, sound, text legibility and public viewing permissions. Recording and timed rehearsal have not been completed by this review.

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

The About copy above is 122 words (under the 150-word limit). It is draft text, not a submitted project page. No recording, upload, screenshot capture, team-field verification, Nedomas access check, public repository change or Devpost submission has been completed by this document update. Production release and the Try it out URL still require the checks recorded in [staging verification](STAGING_VERIFICATION.md).

## Stop rule

Fix a demonstrated failure in the core demo or a misleading claim. Otherwise stop adding code. Preserve time for rehearsal, readable recording, submission and backup checks. Explain limitations rather than attempting new integrations or features.
