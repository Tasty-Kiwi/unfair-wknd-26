# claude-sonnet-5-5 — Round 3

[Sonnet round 3 final decision](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aabb7c3a5-77ef-4145-8e1e-db77c6698058%3Adelegate-task%3A40b859ad-6062-43e8-b2c3-84c9ebd22898)

# Round 3 final decision (read-only; no implementation exists yet, so nothing below reviews code changes)

I read all four round files. I also spot-checked `LandingPage.tsx`, `ProjectsPage.tsx` and the per-order demand check in `validation.ts`. I ran no tests and did not watch the video.

## Responses to the objections

1. **Accept, Terra on arbitrary caps.** I withdraw my round-1 proposal of 1e9 units and 1e12 value. Those are invented business limits. `1e300` on its own is valid. Your reproduction shows the real gap: ten values of 1e308 each pass `parseDataset` but sum to `Infinity` in `simulate`.
2. **Accept in part, Sonnet's round-2 supply check.** Sonnet round 2 asked for a safe-integer check on total supply as well as total demand. I reject the supply half. The allocation ledger does not sum supply, so capping it would be an unnecessary restriction. I keep the demand check and the finite order-value total.
3. **Accept, Terra on the video.** Sonnet round 1 was too categorical in saying the video must be re-recorded or caveated. The MP4 predates the current UI. Compare its closing URL and labels first, and make no watched, approved or replaced claims. A wrong final link is not fixed by a caveat.
4. **Reject, Sonnet's round-2 criticism that Terra's CTA wording was weak.** Terra's alternative label, "Choose a demo or project", is the weaker option, so we go direct to `/demo` as the primary action. Sonnet's point that the "Explore the demo" button is the second action and takes two hops is correct. The `/projects#demo` href at `LandingPage.tsx:~88` confirms the detour.
5. **Reject, Terra's round-2 claim that the "obsolete deployment" framing is wrong.** Terra says production already serves these routes. Terra round 1 says the README states the route changes are not deployed, and Sonnet round 1 says the docs go stale only once the branch deploys. These conflict. Docs must state routes only as observed on the actual submission URL, and I treat that as a verification item. The drift is blocking either way.
6. **Accept, Terra's euro correction.** Dollar sign was a mistake by the coordinator, so it is disregarded and €36,000 stays.
7. **Accept, Sonnet's round-2 criticism that its own report skipped the criteria.** It is assessed below.
8. **Reject on the unsupported added P2s.** Per-route titles, zero-order rejection, forced raw Zod text and cross-tab delete stay deferred. They are real but not worth pre-deadline risk.

## Reassessed initial proposals

- **Stale docs, public repo, Built with, hypotheses:** These stay in scope and are P0 for copy accuracy.
- **Stale test counts:** Fold them into the coordinator's final run. Cite one CI run or drop the numbers.
- **"DominoOS" in VALIDATION_PLAYBOOK:** Coordinator-owned, trivial.

## P0 (submission accuracy, not a core demo failure)

- **Route table:** Coordinator writes one route table, verified against the submission deployment. Terra aligns `/` (landing), `/projects`, `/demo` and the `/?builder=1` legacy behavior across `DEVPOST_READY.md`, `DEMO_SCRIPT.md`, `VIDEO_PRODUCTION.md` and `PITCH.md`.
- **Repository visibility:** Replace the private/invite blocker with an observed, signed-out check.
- **Built with:** List active technologies only, with D1 and OAuth described separately as retained and deferred.
- **Hypotheses:** Keep them honest, with no savings or validated-buyer claims. €36,000 is exposed order value, not savings.
- **Script, about 2:40:**
  1. Human problem
  2. Product in under 30 seconds
  3. The exact shortage (PO-101 to 23 Nov, ORD-102 short 2 motors, €36,000), then recovery
  4. Local save and export
  5. Technical proof
  6. Memorable close
  7. Next step

## P1 (small, reversible, tested)

**A. Landing and demo card (Terra)**
- The primary CTA becomes a direct link to `/demo` (e.g. "Try the demo"). The secondary "Open projects" keeps its existing label and journey.
- The demo card gets one line: session-only demo, and **Edit this network** creates a saved local copy. I confirmed that the button exists (`App.tsx:583`) and that `tests/demo-editor-parity.spec.ts` clicks it. I did not verify that it persists a copy, so Terra must confirm before shipping that wording.
- Update only the CTA expectations in `tests/landing.spec.ts`. `tests/projects.spec.ts` follows the projects journey, so it must still pass unchanged.
- Don't touch routing, storage formats or keys.

**B. Numeric import safety (Sonnet)**
- In `parseDataset`, reject:
  - total BOM-expanded demand, summed per component and also overall (which bounds `missingUnits`), when it is not a safe integer;
  - a sum of order values that is not finite. `atRiskValue` ≤ `totalValue`, so one check covers both.
- Both give readable messages that say the sum is unrepresentable.
- No supply check, no caps, no engine change.
- **Unit tests in `src/tests/validation.test.ts`:**
  - all ten orders at 1e308 are rejected;
  - a single 1e300 order is accepted;
  - many safe-integer lines that sum past 2^53 are rejected;
  - the demo and existing fixtures still parse;
  - the boundary: a sum exactly at the limit passes, one over fails.
- **Browser test in the new `tests/final-product-review.spec.ts`:**
  - Importing the hostile JSON shows the readable error and does not change the workspace.
  - Autosave and the prior project are untouched (transactional).
  - A valid import still works.
- **Full 1366 journey (default, no API calls):**
  - Landing, `/demo`, disruption, the 2-unit shortage with €36,000.
  - Apply recovery, restoring coverage.
  - Edit this network, local save and reload.
  - Portable export, then reopen with persistence.
  - Assert that no `/api` requests are made.

## Risks

- A CTA or label change breaks `tests/landing.spec.ts` or `projects.spec.ts`. Keep these edits to hrefs and copy only.
- Sums might be computed elsewhere (scenario or recovery paths) in ways that differ from the check. Sonnet must run every scenario preset on a boundary dataset, not just the baseline.
- Rejecting too aggressively could break the exports of existing saved projects. Run old fixtures and a stored-project load.
- Shipping an unverified build close to the deadline is the main danger. Do a fresh live rehearsal after the final integration, and rerun the full verification suite before any release.
- The human unaided test, final video review and the submission itself remain open. Automated results do not replace them.

## The four criteria

- **Technical Execution:** Strong and deterministic. The finite and safe-sum guard closes the one reproduced correctness gap. Claim only the tested path.
- **Product Design:** A direct first action to the working demo is the biggest lever. The session-only copy prevents the false expectation that the demo is saved. It is reasoned, not measured.
- **Potential Impact:** Name the user (a manufacturer or planner) and show the decision from delay to affected order to response. Impact stays a hypothesis. One session is a data point, not validation.
- **Originality:** The defensible claim is the inspectable chain from a dated supplier change through allocation to an affected order, then a modeled alternative on the same model. Don't claim a unique graph or category.

## Ownership: I agree

- **Terra:** `src/landing/LandingPage.tsx`, `src/components/projects/ProjectsPage.tsx`, `tests/landing.spec.ts` (CTA expectations only), `docs/DEVPOST_READY.md`, `docs/VIDEO_PRODUCTION.md`, `docs/PITCH.md`, `DEMO_SCRIPT.md`.
- **Sonnet:** `src/lib/validation.ts`, `src/tests/validation.test.ts`, new `tests/final-product-review.spec.ts`.
- **Coordinator:** README, CHECKLIST, `docs/NEEDTRACE_RELEASE`, `docs/VALIDATION_PLAYBOOK`, `docs/SUBMISSION`, debate and evidence, integration, checks and PR.
- **Boundary conditions:**
  - Sonnet must not edit landing or projects files. Terra must not edit validation files.
  - The new browser spec depends on Terra's CTA text. Sonnet should reach `/demo` by URL and cover the landing click in a separate assertion after Terra lands.
  - Only the coordinator commits, pushes and deploys.

**Deferred (P2):** Cloud activation, per-route titles, zero-order rejection, forced Zod text, cross-tab delete, redesign and integrations.

