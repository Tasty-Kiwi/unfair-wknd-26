# Needtrace final product acceptance

14 November 2026. This record separates the public `b3ced29` baseline from local final-review changes. The latter are not deployed. No unaided human session, final-video approval, upload or Devpost submission is claimed.

## Baseline evidence

- Clean checkout and fetched main: `b3ced29ebd3c9f3074867149fb4ba55385e6676a`.
- GitHub verify and Workers Builds succeeded; [release links](NEEDTRACE_RELEASE.md).
- All 12 JS/CSS production assets byte-match the clean build: [hashes](review/production-assets-b3ced29.json).
- Production automated guest run: `DOMINO_BASE_URL=https://domino-os.tasty-kiwi.workers.dev npx playwright test --project=browser-only` — **92 passed (1.3m)**, before branch-only expectations were introduced.
- Baseline local: 137 unit, 51 Worker and 110 browser tests passed (92 browser-only,18 explicit cloud opt-in regressions). Both typechecks, build and deployment dry run passed.
- Coordinator directly operated production at 1366×768: landing → library → demo 10 covered → six-day delay → ORD-102 short 2 motors/€36,000 → Vector recovery 10 covered, original receipt still 23 Nov; local blank creation and refresh/reopen also observed.
- Production at 390×844: no horizontal page overflow on simulator, projects or legacy builder. Public source anonymously readable in incognito. Health `ok:true, cloudEnabled:false`.

## Final integrated branch

All required checks passed on the integrated final-review source. The initial full browser run exposed eight instances of one stale test expectation: it clicked **Explore the demo** but expected the library. The test now clicks **Open projects** for that library-reopen step. No product behavior was reverted. The corrected full run passed.

| Command | Result |
| --- | --- |
| `npm test` | **147 passed**, 12 files (10 added aggregate-safety cases) |
| `npm run typecheck:worker` | Passed; bindings generated, no default config change |
| `npm run typecheck:tests` | Passed |
| `npm run build` | Passed; browser-only `dist/` |
| `npm run test:worker` | **51 passed**, 7 files |
| `npm run test:e2e` | **112 passed (1.0m)**: 94 browser-only and 18 explicit cloud opt-in regressions |
| `npm run deploy:check` | Passed; `CLOUD_ENABLED=false`, no production D1 binding; dry run only |
| `DOMINO_BASE_URL=http://127.0.0.1:5194 npx playwright test tests/final-product-review.spec.ts tests/landing.spec.ts tests/projects.spec.ts --project=browser-only --output .tmp/final-product-built-results` | **28 passed (20.3s)** against built production assets served by `npm run preview -- --host 127.0.0.1 --port 5194 --strictPort` |
| Markdown relative-link checks, About count, `git diff --check` | Passed; About **99 words**, no broken local links in current submission/release docs |

The separate cloud fixture remains in ignored `dist-cloud/` and does not activate production cloud. Dependency PURE-annotation warnings are nonblocking. Connection-refused messages in explicit opt-in failure tests are expected; normal guest journeys assert no API/GitHub requests.

### Judge acceptance matrix

| Step | Check | Outcome and evidence |
| --- | --- | --- |
| 1 | Open landing | Healthy on production and built branch. [Final laptop screenshot](review/screenshots/06-local-final-landing-dark-1366.png). |
| 2 | Understand user/problem without narration | Copy names manufacturers, supplier changes and customer orders; **human comprehension unverified**. |
| 3 | Reach demo | Branch primary CTA directly opens `/demo`; keyboard CTA test passes. Production still has the earlier two-hop CTA until approved deployment. |
| 4 | Ten covered orders | Baseline summary verifies 10 of 10. |
| 5 | Delay motor receipt | PO-101 moves 17 Nov → 23 Nov using live controls/preset. |
| 6 | Identify order | ORD-102, Helix Automation, becomes at risk. |
| 7 | Inspect shortage | Four required, two allocated, two motors missing; €36,000 fictional order exposure. |
| 8 | Explain late receipt | Six of eight stock units reserved for ORD-101; PO-101 arrives 23 Nov after 22 Nov need. |
| 9 | Compare responses | Both independently evaluated recovery cards appear. |
| 10 | Apply alternative | Two approved Vector motors available 18 Nov applied. |
| 11 | Observe coverage | All 10 covered; original PO-101 still 23 Nov. |
| 12 | Understand action boundary | Notice explicitly says no purchase or supplier confirmation made; **human interpretation unverified**. |
| 13 | Open/create local project | **Edit this network** creates a separate `/projects/:id`; blank and JSON/CSV creation also pass. |
| 14 | Save, refresh, reopen | Scenario survives refresh and library reopening; rejected hostile import preserves saved project. |
| 15 | Portable workspace | Export JSON, import separate copy, retain named scenarios, delete copy, reopen untouched original. |

The new complete journey runs at **1366×768** and captures console errors and default cloud requests; both remain empty. Existing tests cover light/dark layouts at 1440, 1366, 1024 and 390 px, keyboard timeline adjustment, accessible input labels, modal focus/Escape, rejected imports and local save failures. This is engineering acceptance, not an accessibility-conformance or unaided usability claim.

### Numeric regression

Before: ten individually finite `1e308` order values passed validation and the simulator's total became `Infinity`, serialized as `null`. Individually safe BOM demands could also sum beyond the safe integer limit. After: `parseDataset` rejects these inputs with field paths and readable errors before application. Exactly `Number.MAX_SAFE_INTEGER` total demand passes; one above fails. A lone `1e308` and ten `1e300` values remain valid. No arbitrary business caps or supply-total cap were added. Demo outcomes and allocation rules are unchanged.

### Screenshot inspection and limits

[Current screenshots](review/screenshots/) include five observed production states, the final branch's dark laptop landing, and inspected final local project layouts in light 390 and dark 1440. Screenshots 01–06 use 1366×768 CSS viewports; the preview tool downscales the raster to 1280×720. Later requests for extra light-mode preview frames failed twice with “The browser is not producing screenshot frames.” Those frames were rejected. Built-asset browser checks and project screenshots completed; no unsupported visual verification is claimed.

All preview tabs opened by the coordinator were closed. No replacement video was recorded, watched, approved or uploaded. The original MP4 is unchanged.

## Human acceptance gaps

- First-time-user comprehension and unaided completion remain unverified. Automated tests and model reviews are engineering evidence.
- No manufacturing-policy/customer-demand/savings validation was performed. Demo values and supplier approvals are fictional.
- Final video viewing, approval, upload, signed-out playback and presentation-machine rehearsal remain human-owned.
- Real team/member details, build-period/pre-existing-work disclosure, actual portal review/submission and saved confirmation remain human-owned.
