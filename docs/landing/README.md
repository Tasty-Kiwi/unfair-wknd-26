# DominoOS landing — premium v2

13 November 2026. Isolated branch `design/landing-premium-v2`, based on fetched `main` at `0d7f213`. `/landing` remains the marketing route; `/` remains the simulator with the merged network builder. Nothing pushed, merged or deployed by this work.

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5211
```

## Art direction and actual investigation

Claude Code **2.1.311**, Opus, participated as read-only visual director. A real response returned `DESIGN_REVIEW_READY` using the existing authenticated CLI configuration. `--bare` skipped that configuration and initially failed; a normal read-only session succeeded. No credential was requested, printed, embedded or committed. Codex alone edited production files.

Claude proposed two directions: **The Drawing** (premium industrial editorial) and **The Line** (an immersive operational timeline). We selected **The Line**: a receipt visibly crosses the order's required date, then the consequence travels through an open supplier → component → product → order chain. This replaces the old split hero/report card rather than recoloring it. Native controls calculate all three states with the unchanged `simulate()` engine. No autoplay, decorative dashboard metrics, fabricated outcomes or new libraries.

The original paper/ink typography, IBM Plex fonts, explicit demo CTA, and red/blue semantics remain. Red now belongs to late supply and shortages, rather than the whole headline. Light mode uses warm paper, near-black ink and white evidence surfaces. Dark mode uses layered charcoal/slate, warm text, salmon shortage and pale-blue recovery. The light application screenshots remain authentic and are explicitly labeled as light in both themes.

### Real references

Browser captures are in `v2/references/`. Early captures caught entrance-animation loading states; they were recaptured before drawing conclusions. Linear's product stage remained partially obscured by its entrance effect, so it was not treated as evidence of fine product-detail styling.

- [Attio](https://attio.com/): compact navigation, confident headline above a wide product stage, restrained controls. Adopted the composition principle, not its agentic claims, assets or gradients.
- [Linear](https://linear.app/): dark hierarchy separates foreground, secondary text and quiet structure; typography carries emphasis. Its [design-refresh article](https://linear.app/now/behind-the-latest-design-refresh) informed reducing competing detail and making hierarchy deliberate. We retained operational red/blue signals rather than adopting Linear's identity.
- [Retool](https://retool.com/): the current hero makes a complex product approachable through one prominent working interaction. Adopted that emphasis; no copied prompt UI or AI positioning.
- [Foundry](https://www.palantir.com/platforms/foundry/): labeled line drawings explain connected operational systems. Adopted precise annotations and connections; no copied brand illustrations.

### Review cycles and changes caused

Claude's full actual responses are preserved in `v2/reviews/` (read-only reviews, not human/customer research).

1. **Baseline/concept:** Claude rejected incomplete screenshots; hydrated baselines and references were recaptured, followed by an addendum. Selected The Line over The Drawing. Removed the report-card composition and alternating decorative slabs.
2. **First render:** Claude found the timeline too small, date labels cramped, repeated explanation, weak recovery semantics and an unreadable product thumbnail. Enlarged the axis, added the original receipt marker, six-day dimension and due-date gap, moved results below the diagram, muted unapplied alternatives, and captured genuine graph/allocation evidence.
3. **Refinement:** Claude found date guides colliding with product names and red links contradicting a recovered order. Guides now stop before the semantic chain; downstream recovery is blue, the original late receipt remains red, and its misleading long leader is removed. Centered the date chip, shortened the hero, and captured a clearer actual builder canvas crop.

Codex product/content review verified persistence and builder CTA language. Technical review found a dark first-paint gap on the global body surface; the early landing-only style now covers that gap, with a module-blocking regression check. Agents made no file edits. Visual investigation and iterative review ran for more than ten minutes; no idle waiting was counted as review.

## Accuracy and persistence

The fictional Aster receipt moves 17 → 23 November. ORD-102 needs four motors on 22 November. ORD-101 reserves six of eight on-hand motors first, leaving two; ORD-102 is short two. Two modeled approved Vector motors dated 18 November restore coverage while Aster stays delayed. €36,000 is fictional order value exposed to shortage, not a proven loss/saving. Approval and availability are input assumptions; no purchasing, supplier confirmation, capacity or shipment prediction is performed.

The builder is now implemented on main and was actually exercised: open simulator → **Build a network** → **Core example**, save, reload, reopen and restore, then simulate. There is no direct builder URL. The landing CTA explicitly opens the simulator and instructs the visitor to choose **Build a network**. Builder workspaces save in this browser and support JSON export; simulator CSV/JSON imports are session-only. Neither is uploaded.

Theme defaults to light, uses its own `dominoos.landing.theme.v2` key, persists when storage is available, and still switches if storage is blocked. A landing-only head script restores the surface before lazy React loading; ordinary links to `/` create a fresh document without the landing theme. Simulator and builder retain their existing light styles.

## Verification

- `npm test`: **84 unit tests passed** (including the merged builder coverage).
- `npm run build`: **passed**, TypeScript/Vite.
- `DOMINO_BASE_URL=http://127.0.0.1:5211 PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers" npm run test:e2e`: **34 Chromium tests passed** against the built preview.
- Browser coverage: both themes, all three numerical outcomes, persistence/reload, storage failure, keyboard Enter and focus, reduced motion, both CTAs, simulator/builder navigation, first paint before lazy module load, and four viewport sizes per theme. Existing simulator and builder journeys are included.
- Actual computed text/background contrast audit: 103 text samples per theme, no AA failures; minimum observed ratios **5.07:1 light**, **6.52:1 dark**. This checks rendered text samples, not a screen-reader audit. Focus uses theme-blue outlines and controls have 44px minimum touch targets.
- Earlier browser failures: stale disclosure-click assertions after replacing it with an always-available accessible summary; tests updated. Earlier 42px theme buttons were increased to 44px after targeted checks. An attempted builder screenshot targeted a simulation-only selector and timed out; it was corrected to the actual editable canvas. No product failure was hidden with retries.

## Artifacts

- `v2/before/`: actual hydrated previous landing, desktop/mobile. No implemented dark theme existed in that revision; browser dark preference did not provide one.
- `v2/cycle2/`, `v2/cycle3/`: real intermediate implementation screenshots.
- `v2/final/`: full pages at **1440×900, 1024×768, 768×1024, 390×844**, both themes; separate desktop/mobile stage captures for **on-time, delayed and recovery** states.
- `public/landing/simulator-detail.png`, `allocation-mobile.png`: actual simulator graph and ORD-102 evidence. `builder.png` is the full actual builder; `builder-detail.png` is its canvas crop. No fabricated UI or color-inverted screenshots.

## Integration and remaining limits

Changed: landing JSX/CSS, focused browser tests, early theme restoration in `index.html`, genuine product screenshots, and this review evidence. No simulator/builder/engine/data/dependency/deployment/default-route changes. Styles and tokens remain landing-scoped. No push, merge or deployment authorized.

Local Chromium only; physical devices, screen-reader sessions and unaided users remain untested. Mobile is deliberately linear and scrolls substantially. Product screenshots are evidence, with full-size links; small text in screenshots is not a replacement for the working app. No customer validation or commercial benefit is claimed.

Final recommendation: the wide causal timeline, larger authentic product evidence and deliberately designed dark surfaces are a defensible improvement over v1. Claude gave a qualified improvement verdict for both modes; final small fixes separated the due guide from the receipt chip, removed the duplicate recovery stub and spaced phone labels. The final additional Claude inspection found no blocking visual issues, with qualified light/dark improvement verdicts. It retained caveats about thumbnail text, diagram density and downscaled mobile inspection. Codex inspected native-width phone stage captures separately.

The builder image is an actual local edit of the fictional core example (supplier name/region/lead time filled through its inspector), captured at 2× resolution. No screenshot was fabricated.
