# claude-sonnet-5-5 — implementation result

[Sonnet implement numeric safety and acceptance regressions](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aabb7c3a5-77ef-4145-8e1e-db77c6698058%3Adelegate-task%3Afe68f15d-1dce-4645-b23e-767716f4fe4f)

`parseDataset` now rejects order values whose sum overflows and demand whose total passes the safe-integer limit. The focused unit tests and the new browser spec pass. The coordinator still owns the full suite.

## Files changed (only my three)
- [src/lib/validation.ts](/Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts): added `checkOrderTotals`, called from `checkDataset`. It replaces the old per-order, per-line safe-integer check.
  - Demand is each order's quantity times the summed BOM line quantities, accumulated across all orders. It must stay a safe integer, which also bounds `missingUnits`.
  - Order values are accumulated and must stay finite.
  - Each problem is reported once, with an `orders[i]` path and a plain message. There are no arbitrary maximums and no supply cap.
- [src/tests/validation.test.ts](/Users/dominykas/Development/unfair-wknd-26/src/tests/validation.test.ts): added an "aggregate numeric safety" block.
- [tests/final-product-review.spec.ts](/Users/dominykas/Development/unfair-wknd-26/tests/final-product-review.spec.ts): new, two tests.

## Overflow reproduction, before and after
The "before" runs used the `HEAD` validator, copied to a temporary file that I deleted afterwards.

| Input | Before | After |
| --- | --- | --- |
| 10 orders × 1e308 value | accepted; the sum exports as `{"t":null}` | rejected: `orders[1].value: the summed order value across all orders is not a finite number…` |
| 10 orders × 1e300 value | accepted | accepted |
| 3 orders, each demand about 2^52 | accepted | rejected: `orders[0]: total component demand across orders exceeds the safe integer range (9007199254740991)…` |

## Unit tests
- **Value overflow:** two or ten 1e308 values are rejected. A lone 1e308 and ten 1e300 values are accepted.
- **Demand overflow:**
  - Three individually safe demands that sum past the limit are rejected.
  - A BOM whose lines are each safe but whose order total is not is rejected.
  - Exactly `MAX_SAFE_INTEGER` passes and one over fails, tried with single and multiple orders and a two-line BOM.
  - Supply at `MAX_SAFE_INTEGER` is not capped.
- **Presets and entry points:** the demo, `domino-demo.json` and every preset are unchanged. The disruption result is still 1 order at risk, 2 units missing, €36,000. Imports via JSON and CSV are covered.

## Browser spec
- **Hostile import:**
  - **In `/demo`:** after Supplier disruption, the hostile file shows a readable "Import rejected… not a finite number" alert. The data label stays "Fictional demo data" and the €36,000 / 2-unit banner is unchanged.
  - **In the saved project:** the same file is rejected via File → import. The editable scenario and "1 order at risk, 2 units missing" survive a reload. A valid 1e300 import still works.
  - It fails against the old validator (no alert appears).
- **1366×768 guest journey:** the primary "Explore the demo" (`/demo`) and secondary "Open projects" (`/projects`) links, then the full path through to removing the copy. It ends with the original project still opening, no console errors, no sign-in text and no cloud requests.
  - The path: 10 covered → "First short, 23 Nov" → ORD-102 €36,000 → Requires 4, with 2 available, 2026-11-23 → compare options.
  - Then: apply Vector (ORD-102 regained coverage, PO-101 still 23 Nov, "No purchase or supplier confirmation was made") → Edit this network.
  - Then: refresh → library → reopen → export workspace JSON → import as "Imported copy" with its scenarios → remove the copy.
- **Cloud requests:** a cloud request means any `/api/*` path or a `github.com` host.

## Commands and results
- `npx vitest run src/tests/validation.test.ts`: 41 passed. Before the fix, 8 of the new tests failed.
- `npx vitest run`: 12 files, 147 tests passed.
- `npm run typecheck:tests`: clean.
- `npx playwright test tests/final-product-review.spec.ts --project=browser-only`: 2 passed. With `--repeat-each=3`, 6 of 6 passed.
- Prettier check on all three files: clean.

## Limitations
- `simulate` calls `parseDataset` itself, so the "before" overflow was reproduced on the validator and a raw JSON sum rather than through the simulator.
- The new error message replaces the old per-line "component demand exceeds the safe integer range" wording. Nothing else referenced it, and the existing `/safe integer/i` test still passes.
- The journey relies on Terra's landing edits already in the tree. It checks the CTA `href`s, not click-through on both links.
- I ran only the `browser-only` project, not the full e2e or the cloud-opt-in project.
- Other agents' modified files (README, landing, docs, `CHECKLIST.md`) were left untouched, and nothing was committed.

PR none, head unchanged, checks and reviews: focused unit tests, test typecheck and the new browser spec pass; the coordinator's full suite and any review are still pending.

