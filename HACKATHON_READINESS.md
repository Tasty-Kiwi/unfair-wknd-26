# DominoOS hackathon readiness

Last verified: 13 November 2026 (Europe/Vilnius)

## Completed improvements

- Added explicit table-level provenance for fictional demo data, mixed fictional/imported data and fully imported data.
- Added an atomic import preview that lists replaced and retained tables and requires confirmation before mixing fictional and imported business data.
- Kept failed imports transactional: validation errors leave the dataset, scenario and provenance unchanged.
- Made reset restore the original demo dataset, scenario selection, UI state and fictional provenance.
- Removed a duplicate recovery scenario entry and renamed the recovery action from **Apply what-if** to the more direct **Apply recovery**.
- Kept the deterministic simulation, paper-and-ink visual system, responsive layout, accessible controls and keyboard-operable receipt timeline.
- Switched local Playwright configuration from a machine-specific Chrome channel to Playwright Chromium, matching CI and making the end-to-end suite reproducible.
- Updated the 60-second demonstration and pitch to distinguish order value at risk from actual financial loss.

## Verification results

Executed locally on 13 November 2026:

| Check | Result |
| --- | --- |
| `npm ci --cache .npm-cache` | Passed |
| `npm test` | Passed — 5 files, 59 tests |
| `npm run build` | Passed |
| `npm run deploy:check` | Passed — Cloudflare dry run only; nothing published |
| `npm run test:e2e` | Passed — 10 Playwright Chromium journeys |
| `git diff --check` | Passed |

The automated and rendered checks cover:

- Original fictional scenario: 10 orders covered with no material shortages.
- Six-day motor delay: ORD-102 is exposed with two motors missing and €36,000 of order value at material risk.
- Approved alternative: two Vector motors restore coverage while the delayed Aster receipt remains delayed.
- Deterministic recovery calculations and stable allocation tie-breaking.
- No mutation of the original dataset or scenario inputs.
- Synchronized date field, preset, timeline slider, keyboard and drag controls.
- Atomic invalid-import rejection, partial-import preview, mixed provenance, complete JSON provenance and reset behavior.
- Desktop layout at 1440 × 900 and mobile layout at 390 × 844 with no horizontal page overflow.

## Repository and deployment readiness

- Authenticated `origin/main` was fetched before final verification; the upstream baseline is `4b6a371`, with no later commits at the time of review. The improvements are prepared for review on a dedicated pull-request branch.
- GitHub Actions runs install, unit tests, production build, Cloudflare dry run and Playwright Chromium journeys on pushes and pull requests.
- The production build and Cloudflare dry run pass. No deployment was performed.

## Known limitations

- The simulation covers material availability, not production capacity, factory completion, shipping dates, transport, purchasing cost or uncertainty.
- CSV import supports deliveries, inventory, products/BOM and orders. Suppliers, components and approved alternatives require a complete validated JSON dataset; the preview makes retained fictional tables explicit.
- A mixed dataset can be internally valid while still being unsuitable for a real decision. Users must confirm that retained demo references are intentional.
- Recovery options show modeled coverage and assumptions, not confirmed supplier commitments or purchasing recommendations.
- The demonstration uses fictional data. Customer demand, willingness to pay and measured operational benefit remain unvalidated.

## Remaining manual tasks

1. Run the 60-second script once on the final presentation machine and deployed URL at normal browser zoom.
2. Confirm the deployed URL is reachable from a separate network and that its build matches the final submitted commit.
3. Replace any presentation screenshots after the final deployment so they match the submitted UI exactly.
4. Submit before 14 November 2026 at 20:00 Europe/Vilnius.
