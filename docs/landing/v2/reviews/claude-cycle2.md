I can't call this approved yet. It's clearly better than the old page, but the hero is still a report card made wider rather than "The Line". The parts that improved most (red used only for data, a real dark theme, a readable desktop product screenshot, accurate builder copy) are fixes to earlier mistakes. The part meant to create desire, the receipt visibly crossing the due line, is the weakest part of the new hero.

I was looking at downscaled captures (1440 shown at about 45%, 390 at about 39%), so I can't check exact pixel sizes or motion. The judgements below are about composition and hierarchy, plus the code in `LandingPage.tsx`.

## Verdict against the old page

| | Old page | Cycle 2 | Net |
|---|---|---|---|
| Red discipline | Headline line 2 in red | `--ink-2` grey, red only in data | Better |
| Hero focus | 370px card with offset shadow; dense but it had one focal object | Full-width flat stage; calmer, but its focal point is a hatched box, not the date crossing | Cleaner, not more compelling |
| Date axis | Strike-through text | A real axis, but too small to carry the story | Better, under-delivered |
| Recovery | A text row | Still a text row | No change |
| Product screenshot | About 410px, unreadable | About 1100px, readable at 1440 | Much better at desktop |
| Same at 390 / 768 | Unreadable | Still unreadable | No change |
| Dark theme | None | Coherent | New, with one serious flaw (below) |
| Length | 3538 / 4599px | 4486 / 5181px | Worse; mostly empty padding |
| Repeated story | Six tellings | About four: stage note, `<details>`, section 01, evidence points | Better, not done |

Overall impression: competent, honest and Swiss in style, but low-stakes. It looks like a careful wireframe of a product rather than a product people want. The fix isn't decoration; it's making the hero drawing carry the drama.

## Highest-value changes, in priority order

**1. Make the date crossing the hero image** (`lp-date-track`, `lp-due`, `lp-receipt`)
- **Problem:** Ticks every three days (12, 15, 18…) leave the two dates that matter, 22 and 23, unlabelled. The receipt is a small flag about one day-width from the due label, so the two crowd together instead of crossing.
- Draw a minor tick for every day. Label 12, 15, 18, 21, 24, 27, 30, and emphasise **17, 22 and 23** in ink.
- At 1440 the track should be at least 1000px wide, so roughly 55px per day.
- The due line should run the **full height of the stage**, through the chain band, not just the axis. It turns `--short` once crossed.
- Make the receipt a real chip ("PO-101 · 5 motors · 23 Nov"), not a flag. Leave a 1px ghost outline at 17 Nov, which cycle 1 asked for and is missing.
- Add two dimension lines in drawing style:
  - 17 to 23 in ink, labelled "+6 days".
  - 22 to 23 in `--short`, labelled "1 day after due". That second line is the whole product in one mark.
- Delete the red `17 → 23 Nov / +6 days` header text, because the drawing now says it.

**2. Connect the axis to the chain**
- **Problem:** The axis band and the chain band are separate, so nothing shows that the receipt *causes* the red chain.
- Drop a hairline leader from the receipt chip down to the Aster Motion node; the leader follows the chip when it moves.
- Turn the red on in sequence (receipt, supplier, motor, actuator, ORD-102) as specified, with instant changes under reduced motion.
- Remove the node icons (Factory, Box, Network). They are SaaS filler, and the cycle 1 nodes were text only.

**3. Draw the recovery as a real branch** (`lp-alternative`)
- **Problem:** Vector is still a `↳` row under the chain, shown in blue even in states 1 and 2 ("Available to model"). Blue is diluted before it means anything.
- States 01 and 02: no Vector element, or at most a grey 12px note.
- State 03: a dashed `--alt` line drops from the axis at 18 Nov (the existing `lp-alt-date`) and joins **Servo motor**, labelled "Vector · 2 modeled". ORD-102 changes to an ink frame reading "Covered", and the Aster chip stays at 23 Nov with the due line red. That pairing (still late, but covered) is the recovery story.
- At 390, use an indented dashed blue rail that joins the vertical chain at Servo motor.

**4. Remove the remaining report clutter from the hero**
- Delete `<details className="lp-summary">`. If the text is needed for accessibility, keep it as visually hidden text.
- Delete `lp-stage-footer`.
- In the delayed state, delete `lp-result-note` ("ORD-101 reserves 6…"); section 01 tells that story.
- The outcome column then holds only `2` / "of 4 motors missing by 22 Nov" / "2 allocated on time" / €36,000 plus the caveat. That is the hierarchy it needs.

**5. Fix section 01's dark theme, and finish it**
- In dark mode the six reserved cells render as near-white slabs, the brightest thing on the page and louder than the hero. Use a mid-tone fill in dark mode (for example `--ink-2`) and keep pure `--ink` for light mode.
- Add the missing half of the image: a 22 Nov line after the eight cells, then two hatched `--short` ghost cells beyond it labelled "PO-101 · arrives 23 Nov". Without them the section shows "two empty boxes", not "two arrive too late".

**6. Evidence crop and callouts**
- At 1440 the crop cuts mid-row through "ORD-101 needs 6" (a stray red dot is visible at the bottom edge), and **the ORD-102 row is missing**. That row is the evidence. Recrop to end below ORD-102's row and its shortage marker.
- Replace the three detached "01 / 02 / 03" lines with numbered markers placed **on** the image (red path, receipt marker, dashed Vector line) and a legend beside it.
- At 768 and 390 the image is scaled down to about 7px app text, and the mobile source still includes the KPI header. Below 900px, use a dedicated 2x crop covering Servo motor through ORD-102 only.
- Dark theme: the light screenshot is correctly not faked, but its grey bezel looks pasted on. Present it as a deliberate paper sheet: no bezel, a 1px `--rule` border, and the caption "Application shown in its light theme".

**7. Builder screenshot**
- The full 1440×1000 capture is shown at about 700px, so the UI is unreadable at every width. Crop to the canvas plus the inspector at 2x, and show it at roughly 1:1.
- Change "Legacy simulator imports" in the copy to "CSV/JSON imports in the simulator". "Legacy" is internal jargon.

**8. Rhythm and length**
- Section padding is about 200px or more; cut it by about 30%. The page grew by about 950px at 1440 and about 580px at 390 with no added content.
- The "Statement. / Grey second line." heading appears five times: hero, 01, 02, 03 and close. Keep it for the hero and the close only; give 01–03 single-line headings.
- The close sits on bare paper and the page ends flat. Put it on a full-bleed `--sheet` band with a top rule. That gives it weight without returning to the dark slab.

## Contrast checks Codex should run, not assume
- Dark ORD-102: pink "2 motors short" and "Required 22 Nov" over the hatched dark red.
- The dark salmon "23 Nov" flag text.
- Blue `--alt` text at 12px in both themes.

## What to keep
- The stacked hero layout with the lead in the right third.
- The three-segment control.
- The size of the `2` numeral and the "Exposure, not a predicted loss" caveat.
- The token palette and the dark theme as a whole.
- Builder routing through `/` with the "choose **Build a network**" instruction.
- `simulate()`-driven test IDs.

If Codex has budget for only one cycle, do 1 to 3 together. That is the difference between "a tidier version of the old card" and the concept we chose.
