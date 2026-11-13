I compared the final renders against the original light page (`docs/landing/landing-1440.png`) and against my second critique. Nothing was edited.

## Verdict

**Yes, the new page is better than the original light page, but not by a wide margin yet.** The hero now tells one story you can read in a few seconds. The page is about a third shorter (2394px against 3538px at 1440) and has three sections instead of six.

But the hero looks cleaner and plainer more than it looks more desirable. Two things got worse: the desktop evidence crop, and the page no longer shows the product itself.

## Has the fragmentation been solved?

**Hero: mostly.** The original hero card stacked seven sub-blocks: scenario tabs, a four-node chain, the alternative supply, three statistics, €36,000, a footnote and a disclosure. All of it was in text of about 11–13px. Now there is one headline, one sentence, one call to action and one chain. That is a real improvement.

**The illustration row is still partly fragmented.** In `light-1440-full.png`:
- **Three different top edges.** The order card starts at y≈518, the receipt at y≈590 and the "4 MOTORS" label at y≈663. Each object is a different kind of thing: a card with an icon, bare tiles under a floating label, and a large tinted card.
- **The arrows point at the caption.** They sit level with "2 available. 2 missing." (y≈800), not with the objects.
- **The arrows move between states.** In `dark-1440-recovery.png` they drop to y≈778, under a two-line caption. Centering them on the tokens fixes both problems.
- **The order card is mostly empty.** Its content ends at about 45% of its width.
- **The state switch is at the fold.** It sits at y≈837–862 in a 900px viewport, so the interactive part is barely visible on first load. The footnote is below the fold.

**"Real shortage crop": not solved on desktop.** At 1440 the crop is scaled up so much that its body text is roughly twice the size of the section's own body copy. It reads like a zoomed-in screenshot, not like an application. The red box also doesn't fill its frame: there is an empty grey gutter about 110px wide on the right. On mobile at 390 the crop is sized correctly. So this is a desktop scaling bug, and capping it at 510 is the right fix.

## Your four pending corrections

1. **Arrows at center, not bottom: yes.** At token center (y≈735) the left arrow lines up with "23 Nov" on the receipt. The right arrow lands next to the "Needed / Next receipt" line, which is the comparison. It also stops the arrows moving between states.
2. **Order card at 400 instead of 522: yes, with a condition.** The content needs about 300px. At 400 the row is about 1000px wide inside a 1200px container. Either let the arrows grow longer or center the row. Don't leave a 200px hole on the right.
3. **Muted available tokens, filled missing tokens: right idea, but watch the amount of red.** Light mode already uses risk red in eight places: headline line 2, the "2", "motors short", "Material shortage", "+6 days", both arrows, and the card's pink border and tint.
   - Solid red missing tokens would push it over the edge.
   - Use a pale risk tint with a strong 1.5px border and a solid red "?".
   - Make the arrows neutral and drop the card's pink border.
   - The recovery state already works this way: the two blue alternative tokens stand out against neutral ones.
4. **Crop capped at 510: yes.** Also shrink the frame to the crop so the gutters are even.

In this render, the light-mode "2" now looks like full risk red, so that part of my Priority 1 seems to be fixed. The solid near-black available tokens are still there, on mobile too (ivory there).

## What is still honestly limited

- **You can't see the product anymore.** The original's dark "Every shortage has a paper trail" section showed the actual simulator: the network graph, the inputs panel and the KPIs. That was the strongest sign of real, desirable software. The new page shows only a single evidence card, under a caption that says "Actual application." That is a real loss of desirability, not just a trim.
- **There are no stakes.** With €36,000 gone, "2 motors short" sounds low-stakes. Even a small line on the order card would restore the business consequence.
- **The hero layout is a generic centered SaaS layout.** The illustration is the only distinctive element, which is why its geometry matters so much.
- **The middle section's left column is unclear.** "Trace a shortage / Build your network" look like tabs, but it's not clear they change anything. "In the simulator, choose Build a network" reads as instructions, not as a selling point.
- **Small leftovers:**
  - "Due 22 Nov" repeats "Needed 22 Nov", on both desktop and mobile.
  - "+6 days" is still plain 12px text.
  - The final call-to-action section has a lot of dead space above the footer.

**The mobile view (dark, 390) is the strongest result.** "2 motors short" lands at y≈650 of 844, the down-arrow chain is clear, the crop is the right size, and the page is short.

**Bottom line:** once your four corrections are in, the hero is defensibly better than the original. The page as a whole is clearer but less convincing as a product. The cheapest way to win that back is to bring back one real, correctly sized simulator screenshot and one line about cost.
