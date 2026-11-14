## Verdict

**Yes, this is substantially better than the original. Both themes are coherent, but neither is finished yet.**

The hero now works as a drawing. A ghost marker at 17 Nov, a +6 days dimension, a red PO chip at 23 Nov, and a due line with a "1 day after due" dimension tell the story without the header text. Cycle 2 was a report card made wider. This is the concept we chose.

The cycle 2 fixes that landed:
- The `<details>` summary and stage footer are gone.
- Vector is grey and reads "Available to model" in the delayed state.
- The evidence crop now includes the ORD-102 row.
- Dark stock cells are a muted slate instead of white slabs.
- Section 01 has a single-line heading.
- The close sits on its own band.
- The copy now says "CSV/JSON imports".

Dark mode works: the salmon chip and numeral and the muted cells hold up, and the light screenshot is labelled as such.

The page is not much shorter: 4410px against 4486px at 1440, and 4843px against 5181px at 390. The spacing change barely shows on desktop.

What I looked at: the cycle 3 and cycle 2 light-1440 captures, the cycle 2 review, and the recovery states at 1240px. I compared against the original only through my cycle 2 table. The 1440 and 390 full-page captures were heavily downscaled, so mobile text-level detail is not verified.

## Substantial remaining defects

**1. Full-height lines strike through node labels (both themes, delayed and recovery)**
- The red due line at 22 Nov (x≈684 in the recovery capture) runs through "Precision actuator".
- In recovery, the blue 18 Nov line (x≈428) runs through "Servo motor" and past the label row.
- Besides the collision, this makes the chain columns look as if they sit on dates, which they don't. That is an honesty problem.
- **Edit:** end both verticals at the chain rail (y≈325, just below the arrows). The due line still visibly crosses the chain, and the labels below the rail stay clean. Don't fix this with text knockouts; the lines are what's wrong.

**2. Recovery contradicts itself**
- All three chain segments stay red and lead into a blue "Materials covered" ORD-102.
- **Edit:** in state 03, keep only the receipt chip, the due line and the Aster→Servo segment red. Draw Servo→Actuator→ORD-102 in ink, or in `--alt` if you want to show the recovered path.

**3. The blue recovery rail connects to nothing**
- It starts at a stub that ends about 30px below MTR-01, then runs all the way to x≈1205, under ORD-102, without reaching it. It reads as a bracket under the whole chain rather than a supply joining Servo motor.
- **Edit:** draw the vertical from the 18 Nov tick down to the rail, then a short horizontal run that ends in an arrowhead under the Servo motor column. Put "Vector Components · 2 modeled · 18 Nov" at the start of the rail. Delete the run to the right of Servo motor.

**4. The receipt leader lands on the wrong segment**
- The red drop from the 23 Nov marker meets the chain between Precision actuator and ORD-102. That says the late receipt hits the order directly, when it actually feeds Aster→Servo.
- **Edit:** delete the leader. With fix 1, the due line and the 1-day dimension carry the meaning, and the colour of the Aster segment shows cause.

**5. The chip's left edge lines up with the due line**
- The chip "PO-101 · 23 Nov" spans x≈683–812, so its left edge starts exactly on the 22 Nov line. It reads as anchored to 22, or as spanning 22 to 24.
- **Edit:** centre the chip on the 23 marker with a 1px stem, and keep at least 8px between the chip and the due line. Raise the chip if needed; the +6 dimension has room.

**6. The first screen cuts off the payoff at 1440×900**
- This assumes a 900px viewport. The ORD-102 card spans about y 811–955, so "2 motors short" falls below the fold, and so does the outcome "2".
- **Edit:** recover about 80px. Tighten the space between the axis and the chain (about 125px now), the space above the stage, and the hero top padding. At minimum, the whole ORD-102 card should sit above the fold.

**7. The builder screenshot is still unreadable** (carried over from cycle 2, item 7)
- **Edit:** a 2x crop of the canvas plus inspector, shown at about 1:1.

**8. Check mobile at 1:1 before calling it done**
- At 390 the axis gives about 19px per day. In the downscaled capture, the chip, the 17 Nov ghost box, the +6 days label and the 21/24 tick labels look crowded together.
- **Check:** look at a 1:1 crop. If they collide, shorten the axis to 15 to 27 Nov at 390, or drop the in-between tick labels on mobile.

Not blocking: the orphaned "2 allocated on time" in the delayed outcome band, and the evidence callouts that still sit under the image instead of on it.

**Priority:** do 1 to 4 together. They are one fix to the drawing's logic, and recovery is currently the weakest frame. Then do 5 and 6.
