# DominoOS landing v2: design direction, cycle 1

## 0. Input limits

Most of the reference images and both baselines are unusable, so you should know what this direction rests on.

- **Both baselines (`before/landing-1440.png`, `landing-390.png`) show only "Loading DominoOS…".** They were captured before the page hydrated. My view of the old page comes from the code plus the real app screenshot at `public/landing/simulator.png`. Codex should recapture both baselines after the network goes idle and assert that `#lp-title` is visible.
- **Attio, Linear and Foundry captures show only their nav bars.** The hero areas never rendered, so I took nothing visual from them.
- **Retool is the only complete reference, and it's a counter-example.** Its gradient and glow panel is exactly the generic SaaS look we want to avoid.
- **The text from Linear's redesign post is usable.** I'm using two of its principles:
  - "Don't compete for attention you haven't earned": only the causal path gets weight.
  - "Structure should be felt not seen": fewer borders, more alignment.

## 1. What's wrong with the current page

1. **The hero card reads like a report.** About 11 elements are stacked in roughly 600px: header, title, hint, controls, receipt, chain, alternative, outcome, counts, note and a `<details>` block. Text drops to 9–11px. The chain is four equal boxes, so the cause and effect aren't visible as an image.
2. **The same story is told six times.** It appears in the figure note, the `<details>` summary, `.lp-consequence`, the three `.lp-steps`, the screenshot caption and the closing section.
3. **There is no dark theme and no theme control.**
4. **The 7px offset shadow and dark slabs are period styling, not brand.**
5. **The real product screenshot is undersized.** It sits in a 1fr column inside a dark slab, so the UI text can't be read.
6. **Some copy is out of date.** "Imports are session-only; refresh clears your plan" ignores the builder, and the builder isn't mentioned anywhere.

## 2. Two concepts, each with light and dark

**A. "Drawing Set" (industrial editorial)**
- The page is laid out like an engineering drawing set: a title block in the corner, sheet numbers (01/05), hairline grid and large Plex Condensed headings.
- The chain is drawn as a schematic with a dimension line, and the gap from 17 to 23 Nov is labelled like a measured dimension.
- Light: warm paper with ink. Dark: an ink sheet with paper-coloured lines (not blueprint blue).
- Strength: distinctive, credible and on-brand.
- Risk: it can feel static and archival, and gives less of a "this is software" feeling.

**B. "The Line" (immersive, product-led causal chain)**
- The hero is a single wide stage. A date axis runs from 12 to 30 Nov, with ORD-102's due date (22 Nov) drawn as a vertical line.
- The PO-101 receipt chip moves from 17 to 23 Nov and crosses that line. The red then runs node by node: supplier, motor, actuator, ORD-102.
- In the recovery state, a dashed blue branch for Vector drops onto the axis at 18 Nov and the order turns covered.
- Lower on the page, large crops of the real app take over.
- Light: paper stage. Dark: a near-black stage where the red and blue signals carry everything.
- Strength: the cause is the picture itself, which creates both desire and evidence.
- Risk: it becomes an animated gimmick if it's executed loosely.

**Choice: B, built with A's typography and drawing discipline (hairlines, dimension labels, no decoration).** The receipt crossing the due line is the one image that explains the product without any prose. The old page only explained it in sentences.

## 3. Tokens

Both themes are set with `[data-theme]` on `.lp-page`.

**Theme toggle**
- A visible two-option control in the header: "Light / Dark" with sun and moon icons, a 32px target and `aria-pressed`.
- Default is **light**, even when the OS prefers dark. The choice persists in `localStorage` (`dominoos-landing-theme`).
- Set the attribute before paint (inline script or a read in the initial state) so there's no flash of the wrong theme.

| Token | Light | Dark |
|---|---|---|
| `--paper` (page) | `#F2F0EA` | `#111315` |
| `--sheet` (stage) | `#FBFAF7` | `#181B1E` |
| `--raised` | `#FFFFFF` | `#1F2327` |
| `--ink` | `#15181B` | `#ECE9E2` |
| `--ink-2` | `#5B6168` | `#9AA0A6` |
| `--rule` | `rgba(21,24,27,.14)` | `rgba(236,233,226,.12)` |
| `--short` (late/short only) | `#C8321F` | `#F0644E` |
| `--short-tint` | `#F7E3DE` | `rgba(240,100,78,.12)` |
| `--alt` (modeled alternative only) | `#1F5FA8` | `#6FA8E8` |
| `--alt-tint` | `#E2ECF7` | `rgba(111,168,232,.12)` |

**Rules**
- No gradients, glows, blur or offset shadows. Elevation is only `0 1px 0 var(--rule)`.
- Red never appears in the brand or the CTA.
- Shortages are shown with red **plus** hatching (the app's existing `--hatch` pattern), so colour isn't the only signal.
- The CTA is ink on paper. Its hover state is a 1px underline offset, not a blue fill.

**Typography**
- Display: IBM Plex Sans Condensed 600.
- Body: IBM Plex Sans 400/500.
- All numerals use `font-variant-numeric: tabular-nums`.
- Use only these sizes: **12 / 14 / 17 / 22 / 32 / 48 / 88**.
  - 12 for labels, in sentence case. Uppercase eyebrows are allowed at most once per section.
  - 17/1.55 for body text.
- h1 is 88/0.95 with −0.015em tracking. At 390px it's 48/1.0.
- Nothing below 12px at any width.

## 4. Page composition (5 sections; the story is told once)

**Header** (64px)
- Left: brand.
- Right: "How it works", the theme toggle and "Open demo ↗".
- Delete `.lp-brandline`.

**1. Hero: the Line.** Content max-width is 1200px.
- **Headline** (spans 2/3 of the width, left-aligned):
  - Line 1: "One late delivery."
  - Line 2, in `--ink-2`: "Which order breaks?"
  - A single 17px lead line, then the CTA "Launch interactive demo" and a link to `#builder` ("Build your own network").
- **Scenario control:** a three-segment control below the headline, labelled "On time · Delayed +6 days · Vector modeled". Min height 44px. Only the active segment is filled, in ink. Keep `aria-pressed`.
- **Stage** (`--sheet`, 1px rule, padding 40px, about 440px tall):
  - **Top band (date axis):** ticks from 12 to 30 Nov. A dashed vertical line at 22 Nov is labelled "ORD-102 due 22 Nov". The PO-101 chip ("Aster Motion · 5 motors") sits at 17 Nov and slides to 23 Nov in 400ms ease-out. The old date stays as a 1px ghost outline. Once the chip passes the due line, the due line and the "+6 days" label turn `--short`.
  - **Middle band (chain):** four nodes on one 2px line. Nodes are text only with no boxes: a 12px label, a 22px name and a 14px ID. Only ORD-102 gets a frame.
    - In the delayed state, line segments and nodes turn red in sequence, 120ms apart.
    - With `prefers-reduced-motion`, everything changes instantly.
  - **Recovery state:** a dashed `--alt` branch drops from the axis at 18 Nov ("Vector · 2 modeled") into the Servo motor node. ORD-102 changes from hatched red to an ink frame with "Covered". The Aster chip **stays at 23 Nov**.
  - **Right column (outcome):**
    - The hero numeral `2` at 88px in `--short`, with "of 4 motors missing by 22 Nov" next to it.
    - Underneath: "2 allocated from stock".
    - Then "€36,000 fictional order value exposed", followed by the 14px `--ink-2` line "Exposure, not a forecast loss."
  - Keep the existing `role="status"` live region.
- Delete `.lp-figure-head`, `.lp-figure-title`, `.lp-control-hint`, `.lp-figure-note` and `.lp-summary`. Put a visually hidden one-sentence text summary in their place for accessibility.
- **Under the stage**, one 12px line: "Fictional Northstar plan · deterministic calculation in your browser · no account".

**2. "Why eight motors weren't enough."** This is the only explanatory section.
- Show the eight stock cells: six solid ink, labelled ORD-101; two outlined, labelled ORD-102.
- Then two hatched red ghost cells, positioned *after* a 22 Nov line and labelled "PO-101 · arrives 23 Nov".
- One 17px sentence: "Orders reserve by required date, then order ID — the same inputs always give the same answer."
- Replaces `.lp-consequence` and `.lp-steps`.

**3. Product evidence (`#how-it-works`).** Full-width real screenshots.
- Recapture the app at 2x DPR in both its light and dark themes, *if the app has a dark theme*.
- If it doesn't, show the light capture framed as a paper sheet on the dark page. **Never fake a dark screenshot.**
- **Desktop:** crop the "From supplier to customer order" panel plus the "supply against need" timeline. Display it at ≤1:1 CSS pixels so the 11px app text stays readable (about 1100px wide).
- Put three numbered callouts in the margin:
  1. "Red path = short or late"
  2. "Drag a receipt along the date axis"
  3. "Approved alternative, dashed"
- Each callout is 14px and connected to the crop with a hairline leader.
- **Mobile:** use a separate, tighter crop covering Servo motor through ORD-102, from a 2x source at about 700px wide. Don't scale the desktop crop down.

**4. Build your own network (`#builder`).**
- Use a real screenshot of the builder at 2x.
- Copy must be accurate, and Codex needs to check it against the builder code:
  - "Start from the demo and choose **Build a network**."
  - "Networks you build are saved in this browser and can be exported."
  - "CSV/JSON imports stay in memory and clear on refresh."
- The CTA goes to `/`. **No `/builder` route exists, so don't invent a deep link.**

**5. Limits and close.**
- Merge `.lp-trust` and `.lp-close` into one section on `--paper`, not a dark slab.
- Two columns:
  - Left, "What it calculates": material availability, dated supply and allocation.
  - Right, "What it doesn't": capacity, cost, supplier commitments, purchasing, forecasting and AI optimisation.
- Then a single 48px line, "Find the short order. Test a way through.", and the CTA.
- No testimonials, logos or usage numbers, since we have no real customer validation.

## 5. Mobile (390px)

- Page gutters 20px. The stage goes edge-to-edge with 16px internal padding.
- **Order:**
  1. Headline at 48px.
  2. Lead.
  3. CTA, full width.
  4. Three-segment control, full width with equal segments; labels shorten to "On time / +6 days / Vector".
  5. **Compressed axis strip**: 12–30 Nov over about 340px, roughly 18px per day, with the due line and the chip.
  6. **Vertical chain**: a 2px left rail at x=12. Nodes are rows with the label above the name. The rail segments turn red top to bottom.
  7. The Vector branch shows as an indented dashed blue rail joining at Servo motor.
  8. The outcome block comes after ORD-102: the `2` numeral at 64px, then the € line.
- Nothing scrolls horizontally, and no tap target is smaller than 44px.

## 6. Acceptance checks for Codex

- Light and dark screenshots at 1440 and 390, taken after hydration, for all 3 scenario states (12 captures).
- In both themes, every red or blue text element meets ≥4.5:1 contrast against its surface.
- `data-testid`s `landing-shortage` and `landing-exposure` are preserved, and the values still come from `simulate()`. Nothing is hardcoded.
- A grep finds no `box-shadow` other than the rule shadow, no `gradient`, and no `font-size` under 12px.
- The ORD-102 numbers (4 needed, 2 allocated, 2 missing, €36,000) appear **once** in the hero and **once** in section 2, and nowhere else.
