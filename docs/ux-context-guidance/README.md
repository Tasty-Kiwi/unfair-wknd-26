# Contextual decision guidance — 14 November 2026

Branch: `ux/contextual-decision-guidance`, based on `main` at `5de767e`.

## Scope and review

Preserve PR #14's command-center simulator, large builder canvas, mobile List/Map and the existing disruption explanation. Apply the Human Lens `review-product-experience` skill and its journey/visual-review methods. Two independent Codex reviewers assessed actual local renders and challenged the proposed changes. Discussion and rendered/source inspection ran for more than five minutes before implementation. These are design judgments and engineering evidence, not measured human usability outcomes.

The simulator reviewer challenged duplicating the scenario tab and hiding evidence. We kept one contextual delay action with an illustrative-simulation caveat, retained the top tabs, and made exact allocations a native disclosure. Graph inspection still opens detail directly. Disclosure content remains mounted, so its order selection survives closing/reopening.

The builder reviewer challenged a wizard, compiler-order repairs, and moving a large checklist ahead of the editor. We kept free editing, placed one explicit “Go to…” repair link before the inspector, and grouped the original issue messages where Checks already lived. Item/connection issues precede network metadata in the overview; inline field errors, node badges and strict compiler validation remain. Activated repair links select the target, focus its existing field and scroll it into view. Network fields and BOM quantities have matching focus hooks. No compiler errors are suppressed by this grouping.

## Changes

- Normal simulator: concise coverage summary and **Test a supplier delay**, using the existing six-day preset. A plan with no receipts explains the prerequisite instead of showing an unusable action.
- **Inspect allocations** reveals the same existing picker and evidence. Disruption keeps the shortage/recovery panel.
- Recovery: current coverage, regained order and still-late original receipts are shown explicitly; no purchase or supplier confirmation is claimed. Scenario edits, resets and imports clear stale recovery context.
- Builder: grouped Checks with counts, repair shortcuts and “network still in progress” failed-run feedback. No mandatory workflow or new model semantics.

## Verification

Executed locally: `npm test` (**102 passed**), `npm run typecheck:worker`, `npm run typecheck:tests`, `npm run build`, and `npm run test:e2e` (**78 passed**). After the final BOM focus hook and copy refinements, build and the **4 focused context-guidance journeys** passed again.

Focused journeys cover baseline summary/disclosure, preserved order selection, delay → shortage → recovery, late PO-101, stale-context clearing, grouped checks and keyboard destination focus at 1366×768 and 390×844. Existing simulation, import/export, workspace/navigation and cloud journeys passed in the full browser run. Engine, workspace format, storage keys and cloud configuration were not changed. No deployment was performed.

Rendered both light/dark modes at 1366×768 and 390×844; no horizontal page overflow detected (`layout.json`). Captures here are from local Vite, not production. `simulator-*`, `recovery-*`, `builder-*` and `checks-*` show final states. Screenshots labeled builder show the repair field; checks show the grouped overview after scrolling its panel.

## Limits

The builder still allows incomplete work and displays field-specific errors after validation. On mobile, editing can require scrolling. A complete guided wizard, new graph styling and another layout redesign are deliberately outside scope. No real participant, physical device or screen reader session was available. Additional iteration should follow observed use rather than adding more controls.

An independent read-only code reviewer checked the working diff, coverage render guard, stale recovery resets, repair focus targets and supported import/schema paths. No concrete correctness or compatibility finding remained after checking those callers. Parent execution supplied the test evidence above; the reviewer did not rerun tests.

## Pre-merge review

The final code review found that Run simulation still used the old generic validation error, while Check network showed the new repair guidance. Both now show the same in-progress guidance. Browser regressions cover the failed-run message on blank networks and at desktop/mobile repair destinations.

Reverified locally on 14 November: 102 unit tests, 44 Worker tests, both typechecks, production build and deployment dry run passed. All 78 browser journeys passed using Playwright's Chromium channel with the required v1254 browser and a temporary configuration outside the repository; the default headless shell was not yet installed. No deployment was performed.
