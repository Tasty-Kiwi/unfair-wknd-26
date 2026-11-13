# DominoOS landing page

Local feature branch: `feature/domino-landing`, based on fetched `main` at `625d059c28f9965365dc119fc53d0ee27f48a582`. Reviewed 13 November 2026. Nothing pushed, merged or deployed by this work.

Open `/landing` (or `/landing/`) on the local app. `/` remains the simulator. For the production build preview:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5201
```

## Design decision

Chosen direction: an industrial field report. Large IBM Plex Condensed typography asks a specific planning question; a custom labeled diagram makes the answer tangible. Paper, ink, structural rules, shortage red and alternative blue extend the simulator's identity. Native scenario buttons invite deliberate exploration without autoplay. There are no invented dashboards, customer endorsements or signup flows.

The independent art-direction review compared three directions:

| Direction | Appeal and clarity | Originality and identity | Responsive fit | Decision |
| --- | --- | --- | --- | --- |
| Industrial editorial | Direct question and concrete operational evidence | Specific to planning documents; closest brand fit | Diagram can rearrange without losing meaning | Chosen |
| Physical domino chain reaction | Strong hook, but falling tiles suggest inevitable failure | Memorable brand metaphor, at risk of becoming decoration | Complex motion and small labels are harder on phones | Rejected as the primary composition |
| Premium software screenshot hero | Familiar and immediately credible as software | Least distinctive; could resemble any SaaS page | Straightforward, but screenshot detail shrinks | Use one real screenshot as supporting evidence |

The page uses the unchanged `simulate()` function and real demo scenarios. ORD-102 requires four motors. Earlier ORD-101 reserves six of the eight in stock, leaving two; the delayed receipt arrives on 23 November, after ORD-102's 22 November need. Two modeled approved Vector motors restore coverage. €36,000 is fictional order value exposed to material shortage, never loss or savings.

## Actual independent feedback

Four Codex reviewers worked read-only; only the lead edited files.

- **Human psychology/content:** Keep the operational question, explicit demo CTA and fictional-data framing. Rendered review requested an instruction for scenario selection and an earlier session-storage boundary. Both were added. A readable three-state summary explains modeled approval/availability and provides an alternative to operating the controls.
- **Art direction:** Industrial editorial was strongest; desktop/tablet composition was coherent. First phone render used a serpentine diagram and tiny labels. The iteration replaced it with a linear four-node flow, enlarged control/diagram text and removed the reference label that squeezed the phone heading. Final screenshot review found no clipping; mobile card height remains a conscious tradeoff. At 1024px the diagram is compact but contained; keeping the two-column composition also keeps the launch CTA in the first screen.
- **Evidence/data:** Checked IDs, dates, quantities, product-scoped alternative and exposure against the dataset/engine, then reviewed the rendered desktop values. No numeric mismatch found. Predictive capability and commercial validation are not claimed; the slogan is accompanied by explicit simulation language.
- **Engineering:** Recommended native links, a minimal route selection, prefixed CSS, skip navigation, focus and reduced-motion support. Both routes are lazy loaded so the landing does not initially fetch the simulator UI bundle. Final review reported no blocking isolation issue. Reviewer did not run tests; execution results below are the lead's.

Claude Code was not found on PATH or at the checked common installation paths (`~/.local/bin/claude`, `/opt/homebrew/bin/claude`, `/usr/local/bin/claude`). No Claude critique or authentication was fabricated.

These are agent reviews, not observed human usability or customer validation.

## Verification executed

- `npm test`: **60 unit tests passed**, 5 files.
- `npm run build`: **passed** (TypeScript and Vite). Existing Zod annotation warnings are nonfatal. No new runtime dependency.
- `DOMINO_BASE_URL=http://127.0.0.1:5201 PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers" npm run test:e2e`: **16 Chromium tests passed** against the built preview: 11 existing simulator journeys plus 5 landing tests.
- Landing tests cover three computed states, numeric exposure/shortage, recovery preserving the original delay, accessible state buttons, keyboard Enter, skip link, the static summary, working CTA to `/`, section navigation, reduced-motion mode, visible first-screen launch CTA and overflow/control bounds at all four requested sizes.
- Initial run: 12 passed, 4 failed because a new heading locator omitted an accessible-name space around a line break. Fixed the locator with whitespace matching, then reran the full suite successfully. No product bug was hidden by retries.
- Real rendered inspection and captures at **1440×900, 1024×768, 768×1024 and 390×844**. Inspected full pages and changed mobile layout based on visible density/reading-order issues. No horizontal overflow observed at those widths.

Screenshots in this folder are from the built local preview. [Desktop](landing-1440.png), [small desktop](landing-1024.png), [tablet](landing-768.png), [mobile](landing-390.png), [mobile recovery](recovery-390.png). `public/landing/simulator.png` is a real 1440×1000 capture of the existing simulator in its disruption state, used as product evidence. It is deliberately an overview; the text invitation opens the readable working simulator.

## Integration boundaries and files

- `src/landing/LandingPage.tsx`: page, live diagram, state controls, truthful copy, real evidence image and ordinary navigation links.
- `src/landing/landing.css`: styles scoped to `.lp-page`; responsive layout and reduced-motion behavior.
- `src/main.tsx`: minimal pathname selection and lazy route imports, preserving `/` and existing fallback behavior.
- `tests/landing.spec.ts`: focused browser acceptance checks.
- `public/landing/simulator.png`: locally captured product screenshot, lazy loaded below the hero.
- This document and five rendered screenshots: rationale, review and verification evidence.

No changes to `App.tsx`, the simulation engine, demo data, builder plan/feature, dependencies, deployment settings or default route. The builder remains planned and is not advertised. A future root promotion requires the team's explicit route decision. Native links perform normal document navigation, protecting the simulator from leftover landing styles.

Remaining limits: Chromium/local verification only; no screen-reader session, physical-device test or unaided human test. Imported plans remain session-only. This branch needs review and explicit authorization before push, merge or production work.
