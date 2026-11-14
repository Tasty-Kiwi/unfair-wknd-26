# Re-check of the remaining conditions in `claude-corrective.md`

I made no edits. I compared the five fresh captures against the conditions still open in that file.

## 1. Fresh captures show the exposure line and "Precision actuator": **PASS**

- **dark-1440-hero:** The card is labelled ORD-102 · Precision actuator, with "Needed 22 Nov. Next receipt 23 Nov." It shows "€36,000 fictional order value at material risk. Exposure, not loss." The old "Due 22 Nov" text is gone.
- **dark-390-full:** It has the same "Precision actuator" label and the same exposure line, which wraps onto two lines. The evidence section now has three tabs (01 / 02 / 03), so the out-of-date two-tab capture is replaced.
- **Fold at 1440:** The state switch's middle is at about 857px and its bottom at about 880px in the 900px viewport. All three options are fully visible on first load, which fixes the fold issue at desktop. "Fictional plan…" and "Why this result?" sit below the fold, which is fine.
- **Fold at 390:** The state switch sits at about 850px, just below a typical 844px phone viewport. This is the same fold tradeoff as before, now on mobile. It's not a blocker.

## 2. Network screenshot sized and framed correctly: **PASS at 1440, FAIL at 390**

- **1440: PASS.** The panel is about 750px wide. The whole graph fits inside the frame: suppliers through to customer orders, the legend, and the full "Servo motor: supply against need" timeline. The node labels read at about 9–11px: small but legible. The red chain (Aster Motion → Servo motor → Precision actuator → ORD-102) is the clear focus. Unlike the allocation crop, it isn't oversized. The light product UI inside a dark frame matches the caption "light product interface".
- **390: FAIL on legibility.** It's framed correctly but shrunk to about 330px wide, so the node text comes out at about 3–4 CSS px. You can see the red chain's shape, but not "Aster Motion", "Short", "ORD-102" or any timeline label. The caption below it is bigger than anything inside the screenshot. The ↗ icon may open the full image, but the tab can't stand on its own as evidence. Possible fixes:
  - On mobile, crop to the four-node red chain.
  - Or let the image scroll sideways at its natural width.

## 3. Light and dark compared with the original light page: **PASS**

- **Layout:** The two modes match. Card positions, the 400px order card and the state-switch position (about 857–860px) all line up.
- **Colors:** Dark mode swaps cleanly. The red becomes salmon, the near-black call-to-action button becomes cream, and the missing tokens get a filled maroon background with dashed salmon borders.
- **Dark order card:** It now has a neutral border with no pink fill. That makes it calmer than light mode, which still has the pink border and fill. The two modes treat red unequally, but that's the documented tradeoff.
- **Embedded screenshots:** Both are light UI, so in dark mode they make a bright patch. The caption states this, so it's accepted.
- **Against the original light page:** The direction is the same, with the shorter page and a single claim in the hero, as established before.

## 4. Substantial blockers

- **Only one:** the mobile network tab described in section 2. I'd treat it as the last condition before final sign-off rather than a hard blocker, because the 1440 version proves the restored screenshot works.
- **Unchanged and still documented:** the oversized text in the allocation crop (about 22px against 16px section copy, at both 1440 and 390), the "€0" recovery wording, the instruction-style left column, and the empty space around the final call to action.

**Verdict:** Conditions 1 and 3 are met, and the desktop half of condition 2 is met. Fix the network tab on mobile, then it's ready for final sign-off.
