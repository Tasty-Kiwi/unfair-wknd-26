# DominoOS hackathon readiness

Reviewed locally: **13 November 2026**. Team-supplied deadline: **14 November 2026, 20:00 Europe/Vilnius**.

## Decision and reviewed revision

PR [#3](https://github.com/Tasty-Kiwi/unfair-wknd-26/pull/3) is open and mergeable at `19c03f7790629fea6623e9a2a1bf1f7f7dde3f53`, branch `fix/hackathon-readiness`, targeting `main`. Recheck the head before release. The local documentation follow-up does not change application behavior and is not yet on the remote PR. No push, merge or deployment was performed in this product-review pass.

Application verification supports a hackathon demonstration and final review of PR #3. No significant observable UI defect required an application change. This is engineering and rendered-interface evidence, not validation by real manufacturing planners.

**Production deployment is owned by another teammate and has not been verified as containing PR #3.**

## Current verification

Executed in the repository on Node `24.14.0`, npm `11.9.0`, with existing installed dependencies. This pass is not a fresh dependency-install certification; the preceding release investigation independently installed and checked the PR head.

| Check | Result |
| --- | --- |
| `TMPDIR="$PWD/.tmp" npm test` | Passed: 5 files, 60 unit tests |
| `TMPDIR="$PWD/.tmp" npm run build` | Passed: TypeScript and Vite production build |
| `DOMINO_BASE_URL=http://127.0.0.1:5194 TMPDIR="$PWD/.tmp" PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers" npm run test:e2e` | Passed: 11 Chromium journeys against local production preview |
| Rendered interaction | Desktop 1440 × 900 and mobile 390 × 844 inspected; delay, evidence, recovery, mobile import and reset confirmation exercised |
| Downloaded reports | Baseline 10 orders covered; six-day delay makes ORD-102 short two motors; Vector supply removes shortage while PO-101 remains dated 23 November; fictional provenance retained |

The browser suite covers synchronized date inputs/presets/timeline/keyboard/drag, independent recovery comparison, invalid imports preserving state, mixed and complete-import provenance, retained-BOM preview, imported-plan reset cancellation/confirmation, responsive layout and exports. Downloaded JSON assertions additionally inspect scenario inputs and computed results.

The build emits non-failing upstream Zod annotation warnings and a Vite chunk-size advisory. No measured demonstration issue justified optimization.

Ignored visual evidence: `.tmp/final-desktop.png`, `.tmp/final-recovery.png`, `.tmp/final-mobile.png`, `.tmp/final-mobile-recovery.png`, `.tmp/final-import.png`, `.tmp/final-reset.png`. These are local artifacts, not submission attachments or production evidence.

## Product review

- The paper-and-ink design has consistent hierarchy and readable states. The supplier → component → product → customer-order chain connects the input to its consequence. Red shortage treatment distinguishes the affected path; allocation evidence explains the two missing motors.
- The top scenario controls provide a visible entry into the demonstration. Editable delivery controls and timeline remain available. Mobile uses a stacked chain and requires substantial scrolling; use desktop for the timed presentation.
- Recovery cards compare alternative supply with restoring receipt timing. Each states its assumptions, remaining shortage and independent effect. Applying recovery changes local simulation state, not purchasing or supplier commitments.
- Import preview distinguishes replaced and retained tables, warns about mixed fictional/imported data and retained BOMs, and discloses session-only storage. Resetting an imported plan requires confirmation with a clear keep-plan action.
- A first-time user has not been observed without assistance. Discoverability and desirability for actual planners remain hypotheses.

## Demonstration acceptance

The exercised path is: ten covered orders → **Supplier disruption** → PO-101 moves from 17 to 23 November → ORD-102 needs four motors with only two available after ORD-101 reserves six of eight → compare both recovery cards → apply **Use Vector Components** → all ten orders regain material coverage while Aster stays delayed.

The €36,000 is order value at material risk, not measured loss or savings. Allocation uses required date, then order ID; partial kits retain reservations. The simulation covers material availability, not factory capacity, purchasing costs, production completion or shipping dates.

## Submission materials

- [30-second pitch, differentiation and accurate judge answers](docs/PITCH.md).
- [60-second demonstration script](DEMO_SCRIPT.md), shortened narration with actual labels and click/scroll directions.
- [Three-minute video outline and three-person checklist](docs/SUBMISSION.md).
- [Unaided-user validation playbook](docs/VALIDATION_PLAYBOOK.md), corrected to describe the red shortage state.

Spoken durations are targets. A human must rehearse with the actual clicks, record/watch the video, check official rules and complete submission. No customer validation, operational savings, paid demand or commercial result is claimed.

## Remaining team actions

1. Review the local documentation commit. Obtain explicit authorization before pushing or merging; recheck PR head and repository status first.
2. Presenter: rehearse the 30-second pitch and 60-second demo on the presentation machine; test normal zoom, scrolling, display and power. Conduct an unaided outsider session if time permits.
3. Release owner: coordinate the approved presentation URL/revision with the teammate owning production, then check the complete demonstration and latest import/reset safeguards on that URL.
4. Prepare an offline fallback before presentation: `npm ci`, `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 5194`. Open the local URL and repeat the demo with the network disconnected. Keep a video backup offline.
5. Submission owner: verify official rules, eligibility and required materials; record the video; test sharing signed out; review claims and URLs with the team; submit before the deadline and save confirmation.

## Known limits and stop rule

CSV bundles retain omitted tables and can retain matching-product BOMs; full JSON is needed to replace suppliers, components and approved alternatives. Mixed data can validate structurally while being unsuitable for a real decision. Browser state disappears on refresh/close. Keep source files; an exported report is an audit record, not a one-click project backup.

No remaining application defect was identified in the exercised paths. Unknowns include unaided usability, real manufacturing-policy fit and browsers/devices beyond the tested Chromium viewports. Fix a demonstrated core-flow failure or misleading claim; otherwise preserve time for rehearsal, recording and submission.
