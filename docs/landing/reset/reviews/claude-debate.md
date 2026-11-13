## Verdict: build the third direction, with six conditions

I checked it against the original light capture (`docs/landing/landing-1440.png`) and the Retool, Attio and Linear references in `docs/landing/reset/references/`. I couldn't list that folder, so if it holds other references, I haven't seen them.

**What I'm dropping from my earlier doc:**
- **From B:** the split hero, the 12–30 Nov ruler, and the full-width figure of the app.
- **From A:** the assumption that the app has a dark theme, and green recovery. The original already uses blue for the alternative supply ("Vector Components … Alternative" in the hero card), so blue recovery comes from the product. Green was something I made up.

## Why accept it

1. **It fixes the original's real weakness, density.** The original hero card holds about nine type levels in roughly 950px: tabs, a chain of four bordered boxes, a strikethrough date, an alternative row, a three-number stats strip, a footnote and a disclosure. The vermilion line 2 of the headline is the strongest thing on that page because it's the only large shape. Your three parts (cause, mechanism, consequence) keep the story and lose about 70% of the ink.
2. **The motor tokens are the original's best graphic idea, used in the right place.** The eight squares in "The consequence" band were the only memorable shape on the page, but they were stranded in section 2. With four tokens and two hatched, they move into the hero. Hatching matches the app's shortage treatment, so there's one shortage style across page and product.
3. **A centered cluster gives the page one axis.** Attio and Retool show why this works: the headline, CTA and object share a single center line. v2 had two centers and the original had two columns.
4. **A smaller light inset is better than a slab.** In the original, the app capture is shown at about 0.55× scale inside a dark band, so its text is around 6px and can't be read. A 1:1 crop at roughly 760px wide is readable and looks like a deliberate object. It's also honest: the app is light, and the inset shows exactly that.

## Where it fails unless you add these conditions

1. **A centered headline over an object is a template** (it's Attio's layout). It only becomes distinctive if the graphic is not a card. So: no stage, panel, gradient or border around the demo. The three parts sit directly on the page as freestanding objects. The asymmetry is the signature.
2. **Without the ruler, "+6 days" means nothing unless the due date is printed.** The receipt must show "17 → 23 Nov" and ORD-102 must show "due 22 Nov". Comparing 23 with 22 does the ruler's job in two words.
3. **Moving reservations into details only works because the tokens are ORD-102's own four.** The original's logic: 8 in stock, ORD-101 reserves 6, 2 are left, and the other 2 come on PO-101. So the two hatched tokens really are the late ones. The tokens must never stand for stock. Label them "4 needed · 2 arrive late". "Why only two?" opens the reservations explanation and shows "€36,000 exposed".
4. **Recovery fills the gaps; it doesn't undo the delay.** The two blue tokens drop into the hatched slots under a small "Vector · 18 Nov" tag. The receipt keeps "+6 days". That's the honest version of the story, and it keeps the picture to three parts.
5. **On dark navy, a mid blue disappears.** Recovery blue has to be light and slightly desaturated (#8FB2FF), not the light-mode #2B59C3. That's the riskiest color decision in dark mode.
6. **The state control must stay visible**, which v2 failed. Use a 44px, three-segment control on the center axis directly under the graphic, with full labels.

## Desktop geometry, 1440 (container x120–1320, center axis x720)

| y | Element |
|---|---|
| 0–64 | Nav: logo · theme toggle · "Open demo" |
| 112–264 | Headline 72/76, weight 600, centered, max 980. Line 2 in risk color (keep the original's best move) |
| 292–348 | Subcopy 18/28, max 600, muted |
| 380–432 | Primary button (52 tall) + "See how it works ↓" link, centered as one row |
| 496–856 | Graphic, 360 tall, no container |
| 880–924 | State control 444×44 on the axis: On time · 6 days late · Recover |
| 880 | "Why only two? · €36,000 exposed ▸" right-aligned to x1320 |

**Graphic columns** (bottoms aligned):
- **Receipt** x120–336 (216×132): "Aster Motion" 17px, "PO-101" mono 12, "~~17~~ → 23 Nov" 28px, "+6 days" pill.
- **Connector** 336–392.
- **Tokens** x392–716: four tokens of 72×96, radius 10, 12 gap. Allocated tokens are solid ink. Missing tokens have a 1.5px risk outline and a 45° hatch at about 20%.
- **Connector** 716–800. This arrow sits across the center axis, so the headline's axis lands on the moment the shortage reaches the order.
- **ORD-102** x800–1320 (520×360, radius 20):
  - "ORD-102 · due 22 Nov" 15px mono, top-left.
  - Hero numeral **"2 short"** at 120px.
  - On time: "Ready 22 Nov" in ink.
  - Recovered: "Covered" in ink, with "2 from Vector · 18 Nov" in blue.

Approximate areas: receipt 28k px², tokens 31k px², order 187k px². The order is about 6× either other part, so the asymmetry is strong.

**Section 2, evidence (≈1000–1800).** Padding 120 top and bottom.
- **Left column** x120–480: title 40/44 "The same order, in the working simulator.", two large text tabs (Allocation, Build), and one honesty caption line.
- **Right inset** x560–1320, 760×560, radius 16, padding 24. Crops shown at 1:1 from fresh 2× captures. The allocation crop must include ORD-102 so it connects to the hero. If the order needs emphasis, draw a ring outside the inset; don't paint over the screenshot.

**Section 3, close (≈1800–2140).** Headline repeated at 56px, centered, same CTA. Then a 64px footer. The page totals about 2200px, against the original's 3538.

## Mobile geometry, 390 (24 margins, 342 content)

- 0–56: nav.
- 88–250: headline 36/40, centered, about 4 lines.
- 270–342: subcopy 16/24.
- 368–420: full-width button. Link at 436.
- 500–612, row 1:
  - receipt 160×112 on the left
  - 14 gap
  - tokens 4×36 wide, 48 tall, 8 gap (168 wide) on the right
- A 32px connector drops down from the tokens.
- 644–884: ORD-102 at full width, 342×240, with the "2 short" numeral at 72px. It's still clearly the largest part.
- 904–948: three-up state control.
- 964: details link.
- Evidence: tabs become a pill toggle. The inset is 342×420, cropped tight to one card at about 0.9×, with no full-page thumbnail.
- Close and footer. Total is about 2150px.

## Palettes

| Token | Light (paper/ink) | Dark (near-navy) |
|---|---|---|
| Page | #ECEBE6 (original's paper) | #0D1422 |
| Surface (receipt/order) | #F6F5F1 | #151E30 |
| Ink / muted | #1A1D21 / #5C6168 | #ECE8DF (warm ivory) / #8C96A8 |
| Rule | #CFCDC5 | #26324A |
| Risk / hatch | #B8321F / risk 20% | #FF7759 / risk 26% |
| Recovery | #2B59C3 | #8FB2FF |
| Allocated token | #1A1D21 | #ECE8DF |
| Evidence inset | #F6F5F1 on a #E2E0D8 well | #F1EFE8 with a 1px #26324A edge, no shadow |

**Why both modes hold up:**
- **Light** keeps what already worked in the original: warm paper, ink, and vermilion.
- **Dark** isn't an inversion. Navy and vermilion are near-complements, so "2 short" carries more weight there than in light. Ivory ink keeps it related to the paper look.
- **The inset in dark mode** reads as a sheet of the light theme on purpose. At 760px wide (about 53% of the viewport) it's an object, not a slab.
