**Verdict: the illegibility is fixed. Condition 2 at 390 now passes**, with the caveats below. I made no edits.

## What's fixed

- **Text is readable now.** At natural scale the node text comes out at about 10–12px. That's the same as the 1440 capture. "Aster Motion", "Late", "MTR-01", "Servo motor", "8 on hand · 10 required", "ORD-102", "Short 2 units", "Precision actuator · At risk", the legend and the timeline axis are all readable. The caption is no longer bigger than the content.
- **The panel looks like it scrolls.** The header says "Scroll image →", and the cut-off "Sho…" badge on the right edge of the first view also hints that there's more. Together they tell the user to pan without needing extra arrows or fades.
- **The scroll stays inside the panel.** The frame stays within its 348px column, and you report that the page is 390px wide with no overflow.
- **Light and dark match.** The frame and layout are the same in both. Only the header and caption colours change, as expected.

## Remaining issues (none block sign-off)

1. **You never see the red chain all at once.** The left view shows Aster Motion → Servo motor, and the right view shows Precision actuator → ORD-102. The 348px window shows about 46% of the 750px image, so the argument the desktop makes in one glance takes about 2–3 swipes here. That's the accepted cost of panning at natural scale. If that's not acceptable, the other option from before was a mobile-only crop to the four red nodes.
2. **The timeline looks cut off at the bottom.** Both views end at the first row ("Supply in" / "8 on hand" / "PO-101 · 5 · 23 Nov"), with "planned" clipped. The rows that show the shortfall aren't visible. The 1440 capture showed the whole "Servo motor: supply against need" timeline, so either the mobile frame cuts the image off by height or the captures stop short. Check whether the frame clips vertically. If it does, the timeline at 390 only shows its first row.
3. **The middle of the chain is unverified.** Neither capture shows the Servo motor → Precision actuator link. I'm assuming it renders the same way as on desktop, but I haven't seen it at 390.
4. **Minor:** "Scroll image →" stays visible after scrolling to the right end. It's cosmetic.

## Still open from earlier (unchanged, documented)

- The text in the allocation crop is too large.
- The "€0" recovery wording.
- The instruction-style left column.
- The empty space around the final call to action.
- The bright patch the light screenshots make in dark mode.

**Bottom line:** the condition that blocked sign-off is resolved. Before calling it final, confirm issue 2, whether the timeline is clipped vertically. That's the only remaining item that could hide real content.
