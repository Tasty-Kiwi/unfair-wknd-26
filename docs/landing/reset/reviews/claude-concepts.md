# Art direction review: DominoOS landing v2

## What's wrong with v2

**1. The hero has two separate centers, and neither one dominates.** At 1440, the headline sits top-left (≈180–410px). The subcopy and a small CTA sit in a separate column top-right, and the CTA is the smallest object above the fold. The demo starts at ≈445px as its own full-width card. That gives three unrelated blocks with no shared axis. The second and third headline lines are set in mid-grey, so in dark mode they look disabled rather than emphasized. The original `landing-1440.png` was stronger here: its vermilion second line and the demo card beside the headline made the hero read as one composition. v2 removed both.

**2. The demo is visually weak.** It's a slate panel (#1C2228-ish) on a near-black page, so its edge barely shows. Inside it:
- Hairline arrows and plain text labels for Supplier, Component and Product.
- A 12–30 Nov tick ruler with roughly 9px labels.
- One salmon box for ORD-102.
- A stats strip where "2 allocated on time" floats alone in the middle of the band.

The interaction that matters (On time / Delay / Recovery) is a tiny segmented control in the panel's top-right corner. "Recovery" is the payoff of the story, and it's the least visible word in the hero. On 390, the ruler compresses until the "PO-101 · 23 Nov" pill collides with the tick labels, and the chain turns into a vertical list of text.

**3. The white screenshot is the brightest thing on the dark page.** At ≈1735–2660px, a ~925px off-white app capture sits on #0F1316. It pulls more attention than the interactive hero, which inverts the hierarchy. The caption "Light application interface in both page themes" admits the mismatch instead of designing around it. The screenshot's red (#C0392B-ish, hatched) also differs from the hero's salmon (#F28B74-ish), so the page uses two "danger" colors.

**4. The page is seven bands with seven different layouts.**
- Split hero
- Split with motor squares
- Full-width screenshot
- Text plus thumbnail
- Two text columns
- Inset CTA card
- Footer

Each is fenced off by a hairline rule and a micro-caps eyebrow ("01 / FOLLOW THE ALLOCATION"). Nothing carries from one band to the next: no shared object, color or line. The page is 4301px at 1440 and 4731px at 390.

**5. Sections repeat content.**
- "Why eight motors aren't enough" repeats the hero's "2 of 4 missing".
- The builder thumbnail at ≈2950px is too small to read, and on 390 it's a grey smudge.
- "Clear inputs. Honest boundaries." is about 80 words of grey 13px body text with no visual, taking a full viewport.

**6. The messaging is inconsistent.**
- Hero: "One late delivery. Which orders are now at risk?"
- Closing section: "Find the short order. Test a way through."
- CTA labels: "Open demo", "Launch interactive demo" and "Open demo to build a network".

That's two headlines and three CTA labels for one action.

**7. Light mode is just the dark layout inverted.** The motor squares become heavy black blocks, the demo card is off-white on off-white, and nothing about the palette is specific to light mode.

**What the references do that v2 doesn't:**
- **Retool:** the interactive object is the hero, centered inside a large rounded gradient stage.
- **Attio:** a framed product window rises out of the hero and overlaps the fold, so the headline and the product read as one.
- **Linear:** the product UI is rendered in the same tone as the page, so nothing looks pasted in.

---

## Fixed for both directions

- **One headline:** "One late delivery. See which order breaks." It's reused verbatim in the closing section.
- **One CTA label:** **"Open the simulator"**, used in the nav, hero and closing section. The secondary link is always "Watch the 3 steps ↓".
- **One story object:** the 4-node chain, Aster Motion → Servo motor → Precision actuator → ORD-102. It appears in the hero demo and is reused as the anchor in the product showcase.
- **Two semantic colors only:** risk and recovery. There's no third "danger" color, and the hatching uses the risk hue.
- **Target length:** ≤ 2600px at 1440 and ≤ 3200px at 390. Five blocks at most.
- **Cut:** the motor-squares section moves into demo state 2. The builder section becomes a tab in the showcase. "Honest boundaries" shrinks to one caption line.

---

## Direction A: "The Stage" (dark-first, demo as the hero)

**Concept:** The demo is the hero, like Retool's prompt box, inside one large lit stage. The page is mostly a frame for that object. The product showcase uses the app's real dark theme, so it sits naturally on the page like Linear's UI.

### Layout at 1440 (container 1280, stage 1360 wide, radius 28)

**0–72: Nav.** Logo left. On the right: theme toggle, then a pill-shaped "Open the simulator" button.

**120–330: Centered headline.** 72/76px, weight 560, tracking −2%, one color, two lines:
- "One late delivery."
- "See which order breaks.", with only "breaks" in the risk color.

Below it, one line of 18px subcopy at 60% opacity, max-width 560. No eyebrow.

**360–1040: The Stage.** This is a 1360×680 rounded panel. Its background is a radial gradient that tracks the story: cool on the left, warming toward ORD-102 on the right. Inside it:
- **Top, centered:** a 3-step control at 56px tall and 520px wide, a real segmented control with full labels: **1 Delay → 2 Threatened → 3 Recover**. The active step fills and the others show their numbers.
- **Middle band (y+180 to y+420):** the 4-node chain. Cards are 220×120 with 18px titles. Connectors are 2px and animate a pulse that travels left to right.
- **Under the chain:** a single date rail across the full stage width, with only three labels: 17 Nov, **22 Nov (due)** and 23 Nov. The receipt chip is draggable. Dragging it past the due marker automatically switches to state 2.
- **State 2:** the connectors after Servo motor turn risk-colored. ORD-102 grows to 260×150 and shows "2 of 4 motors missing". The 8-square inventory bar (6 reserved for ORD-101, 2 free) slides up under Servo motor. This replaces section 01.
- **State 3:** a Vector Components node drops in below Aster Motion with a dashed connector. The chain turns recovery-green, and ORD-102 shows "Covered by 18 Nov".
- **Bottom-right of the stage:** "€36,000 at risk" (32px), which counts down to €0 in state 3.
- **Bottom-center, overlapping the stage edge by 28px:** the primary CTA, "Open the simulator →", 56px tall.

**1140–1960: Product showcase.** Left: a 360px text column with the title "The same chain, in the full simulator." and three numbered lines that act as tabs: Supply network, Supply against need, Build your own. Right: a 880px window frame using the **app's real dark theme**. Clicking a tab swaps the screenshot. The ORD-102 card in the screenshot gets a risk-colored ring, so it visibly connects to the hero.

One 13px caption line below: "Fictional Northstar plan · calculations run locally · nothing leaves your browser · doesn't place orders."

**2060–2460: Closing.** The headline repeats verbatim at 56px, with the same CTA under it, on a smaller version of the hero gradient. Then the footer.

### Layout at 390
- Headline at 40px.
- The stage becomes full-bleed, 16px inset, about 760px tall.
- The step control turns into a sticky three-button bar at the bottom of the stage.
- The chain becomes a vertical spine (one column, connectors running down), with the date rail running horizontally across the top of the stage, showing three labels only.
- The showcase becomes a horizontal swipe carousel of three dark screenshots, each cropped tight around one feature. No full-page thumbnails.

### Palettes

| Token | Dark | Light |
|---|---|---|
| Page | #0A0C0F | #F5F4F0 |
| Stage gradient | #0F1B26 → #1E140F | #E6EEF4 → #F6E7DC |
| Surface / card | #161B21 | #FFFFFF |
| Text / muted | #EEECE6 / #8B929B | #111417 / #5E656D |
| Risk | #FF6A3D | #D23F1C |
| Recovery | #6FD3A6 | #1E8A5A |

The light version keeps the same composition. The stage turns into a pale cool-to-peach wash, and the product showcase switches to the app's light theme.

**Why this works:** the first thing anyone sees is the interaction, and the three-act story is the hero itself. It also removes the pasted-screenshot problem at its source, because the showcase matches the page theme.

**Cost:** this needs a real dark theme in the app, or at least the three screens it shows. Don't fake it by inverting the light screenshots.

---

## Direction B: "The Production Line" (light-first editorial, full-width timeline)

**Concept:** The page reads like a well-made engineering document on warm paper. One horizontal timeline runs edge to edge and acts as the page's spine. The headline sits above it, and the delay plays out along it. The app's existing light UI is native in this palette, so the screenshot looks like it belongs to the page instead of being imported into it.

### Layout at 1440 (12-column grid, 1200 container, but the timeline bleeds full width)

**0–72: Nav.** Same as Direction A.

**120–380: Headline, left-aligned across columns 1–9.** 88px, weight 600, ink color:
- "One late delivery."
- "See which order *breaks*.", with "breaks" in vermilion. This brings back the original's best idea.

On the right, columns 10–12, bottom-aligned with the headline's baseline: a 17px subline, then a large "Open the simulator" button (52px) and the "Watch the 3 steps ↓" link. The headline and CTA now share one baseline instead of floating as separate blocks.

**420–1180: The Line (full-bleed, 760px tall).** A horizontal date axis runs edge to edge at y+380, drawn as a thick 3px ink rule with day ticks from 12 to 30 Nov.
- **Above the axis:** the 4-node chain sits on the line as tall "stations", 260 wide each, evenly spaced.
- **Under the axis, where the receipt and due date fall:** a 2px vertical vermilion "due 22 Nov" line that runs the full height of the band.
- **Interaction:** the receipt is a large chip (120×48) riding on the axis, and the visitor drags it.
- **Step labels:** printed big in the left margin, 1 Delay / 2 Threatened / 3 Recover at 15px with 56px numerals. They're clickable and stay in sync with the drag.
- **State 2:** everything to the right of the due line takes a vermilion hatch wash. The ORD-102 station shows "2 short · €36,000 exposed", and the inventory row (8 squares) prints directly under the Servo motor station.
- **State 3:** the Vector Components receipt chip slides in on the axis at 18 Nov, before the due line. The hatch wipes away left to right, and the stations turn ink with green checkmarks.

**1260–2060: Showcase as a "spread".** One large framed screenshot (1200 wide) of the real light app, with no device chrome and a 1px rule border, like a figure in a report. Three numbered callouts sit in the margin with leader lines pointing into the screenshot (01 supply network, 02 supply against need, 03 build your own). The ORD-102 card in the figure carries the same vermilion hatch as The Line, so they read as the same object.

A single "Fig. 1" caption carries the honesty statement.

**2120–2420: Closing.** A thin band showing the timeline again, now in recovered state. The headline repeats verbatim with the same CTA.

### Layout at 390
- Headline at 44px, with the CTA full-width under it.
- The Line rotates 90°: the date axis runs vertically down the left 48px, and the stations stack on the right with a sticky due-line marker. The receipt chip drags vertically, which is natural for thumbs.
- The showcase becomes two cropped figures with callouts placed below each, not in the margin.

### Palettes

| Token | Light ("Paper") | Dark ("Night shift") |
|---|---|---|
| Page | #F2EEE5 | #121518 |
| Paper surface / rules | #FBF9F4 / #D9D2C3 | #1A1E22 / #2C3238 |
| Ink / muted | #1A1916 / #6B665C | #ECE6D8 / #9A968C |
| Risk (vermilion) | #C7361A | #FF6B4A |
| Recovery | #2E6B4E | #74C79E |
| Hatch | risk at 18% | risk at 22% |

In dark mode the showcase isn't pasted in. It sits on a deliberate full-bleed "light table" band (#E8E3D6) with a soft top and bottom fade. This band is the page's one intentional light zone, matched to the paper palette. The vermilion and hatching match on both sides.

**Why this works:** the timeline matches how planners think about delays, as dates on a line. It stays readable in screenshots and on stage, and the light-first palette fits the app's existing UI, so integration is cheap. The editorial grid gives the "explain it honestly" tone a visual form instead of a block of grey text.

**Cost:** a full-bleed interactive timeline is harder to build responsively. The 390 vertical rotation needs its own build pass.

---

## Recommendation

**Build Direction B now.** The real app is light, so B fixes the worst problem (the pasted white screenshot) without new app theming. Its timeline also makes "delay → order threatened → recovery" literally spatial. Direction A has more impact, but only once the app has a real dark theme. Until then, A would fall back into the same mismatch you rejected.
