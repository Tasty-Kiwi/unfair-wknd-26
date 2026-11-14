I looked at all 8 images. The two 390px captures were shown to me at about 165px wide, so I could only check their overall layout, not text, spacing or crop details.

**Your fixes are all in place:**
- **Due label and receipt:** "Order due 22 Nov" now sits below the axis and the "PO-101 · 23 Nov" receipt tag sits above it, in both stage captures.
- **Baseline ghost:** the dashed "17 Nov" box sits clearly above the tick labels with clean spacing.
- **Recovery stub:** it's gone. Recovery now shows a single "18 Nov / Vector +2" marker, and the supply line turns from red to blue there, which reads correctly.
- **Builder crop:** sharp at 1418px wide, and the selected Aster Motion node has real fields (Region, Lead time). No inspector side panel appears in the crop, but the filled node is enough.

**Remaining issues (none blocking):**
1. **Builder thumbnail text is tiny on the page.** At 1440 it renders about 705px wide, so node text is roughly 6–8px. It works as a preview with the "view full size" link, but it's the weakest spot on desktop.
2. **Builder canvas has extra empty space** at the top and bottom, and the Receipt→Servo edge loops back across the diagram, which looks a bit tangled.
3. **"1 day after due" stays red in Recovery.** That's accurate, since the Aster receipt is still late, but next to "Materials covered" it slightly mixes signals.
4. **"2 / 4 allocated on time" floats** at the top of the middle stat column, out of line with the big number and the euro value.
5. **Mobile captures:** the stacked layout looks coherent and nothing obviously overflows. I couldn't check text size, the simulator crop's legibility or tap targets. To check them I'd need crops at native resolution.

**Compared with v1:** v2 is clearly stronger. The hero stage is full width and more readable, there's less red in the headline, the sections are tighter, and the copy around the real app screenshot is more honest. v1's side-by-side hero card was cramped.

**Verdict on desktop at 1440 (mobile only checked for overall layout):**
- **Light:** ship-ready. It's consistent and calm, the red status color is used sparingly, and the screenshots match the page.
- **Dark:** ship-ready, a little below light. The light simulator screenshot is a bright block on the dark page. It's labeled and deliberate, but it's the main visual break. The coral accents hold up well and the stage reads cleanly.

No substantial blocking issues remain on desktop in either theme. I can't make the same call for mobile until I see native-resolution crops.
