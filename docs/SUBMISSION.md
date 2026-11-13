# DominoOS — submission preparation

Target deadline supplied by the team: **14 November 2026, 20:00 Europe/Vilnius**. An entrant must confirm official eligibility, required fields, video limits and deadline in the event portal. This document does not certify compliance or submission.

## Materials

- [30-second pitch, differentiation and judge answers](PITCH.md).
- [60-second live demonstration](../DEMO_SCRIPT.md).
- [Technical readiness and tested limits](../HACKATHON_READINESS.md).
- [Unaided-user protocol](VALIDATION_PLAYBOOK.md), currently not conducted.

## Project description

DominoOS is a material-availability simulator for manufacturing plans. It connects stock, bills of material, dated receipts and customer orders so a planner can change a delivery, trace a shortage and compare recovery options. The fictional demo exposes a two-motor shortage on ORD-102 after a six-day delay; approved alternative supply restores coverage in the simulation. Allocation is deterministic and inspectable. CSV/JSON imports show provenance and retained data before applying. It does not place purchases, confirm supplier promises, schedule factory capacity or predict shipment dates.

## Differentiation

The demonstrated combination is a supplier-to-order view, inspectable reservations, independent recovery comparisons and explicit import provenance in a focused browser prototype. We are testing whether this helps planners combining spreadsheets. We have not established unique market coverage, easier onboarding than existing products, willingness to pay, time savings or customer adoption. Related CSV tables still require preparation; the allocation policy may differ from a real factory's priorities.

## Three-minute video outline

| Time | Picture / action | Message |
| --- | --- | --- |
| 0:00–0:30 | Brief title, then baseline map and ten covered orders | Deliver the 30-second pitch. Identify the intended planner and the question: which order loses coverage if a receipt slips? |
| 0:30–1:30 | Full-screen desktop app | Perform the complete 60-second script: baseline, six-day delay, ORD-102 allocation, both recovery cards, Vector recovery. |
| 1:30–1:55 | Reopen disrupted scenario and its allocation/timeline | Explain required-date priority, six reserved motors, two remaining and late receipt. Show editable inputs. This is deterministic simulation, not a shipment forecast. |
| 1:55–2:20 | Import dialog, then partial products CSV preview | Show session-only storage, retained BOMs and mixed-data warning. Cancel. Use no private customer files. |
| 2:20–2:40 | Recovery assumptions and exported report | Apply recovery changes a scenario, not a purchase. Reports include evidence/provenance; costs, capacity and supplier confirmation are outside the model. |
| 2:40–3:00 | Covered result; simple closing frame | State what is demonstrated and what remains unvalidated. Next: an unaided session and planner policy comparison. Close with project name and team-approved link. |

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
- [ ] All three review the submission preview; submit before the deadline and save confirmation. Nothing has been submitted automatically.

## Stop rule

Fix a demonstrated failure in the core demo or a misleading claim. Otherwise stop adding code. Preserve time for rehearsal, readable recording, submission and backup checks. Explain limitations rather than attempting new integrations or features.
