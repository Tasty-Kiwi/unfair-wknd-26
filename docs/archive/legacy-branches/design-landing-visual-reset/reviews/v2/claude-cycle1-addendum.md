**I'm keeping "The Line" as the concept, with three changes.** The real baselines and references support it: Attio and Linear both put a headline above one wide product stage, and Foundry shows the labelled line-drawing style I wanted to borrow.

## What the real baseline shows

- **At 1440, the hero is two columns.** The headline sits on the left and a card about 370px wide sits on the right with a hard offset shadow. Because the four chain boxes are the same size and equally spaced, the 17→23 Nov delay appears only as struck-through text, not as a picture.
- **Line 2 of the headline, "Which orders are now at risk?", is in brand red.** That's the same red used for shortages, so red loses its meaning as the shortage signal.
- **The page alternates bands:** grey-green "Consequence", dark simulator slab, dark close. The real product screenshot inside the dark slab is about 410px wide at 1440 and smaller still on mobile, so it can't be read.
- **The 390 page is about 4,600px long.** The hero card stacks acceptably, but "How it works" uses about 500px to repeat the card.

## What I'm taking from each reference

- **Attio:**
  - The centred headline is followed immediately by a product frame about 1080px wide, starting around y=580, so the product *is* the hero object.
  - Copy is restrained: grey subhead, ink primary button next to an outline secondary button.
  - I'm not taking the lavender gradient wash or the fake window controls.
- **Linear:**
  - A two-line headline, left-aligned, on near-black.
  - A hairline under the header.
  - A wide, low-contrast stage panel starting at about y=530.
  - **This capture still isn't fully rendered.** The subhead is blurred mid-animation and the stage is empty, so I can only take layout from it, not visual detail. It's worth recapturing after a 2–3s wait.
- **Foundry:**
  - A very large, light-weight display headline on the left, with the descriptor in a right-hand column.
  - The hero visual is a line drawing: labelled boxes, hairline connectors, small uppercase labels and annotations like "↕ READS + WRITES".
  - This is the "drawing discipline" I wanted. I'm not taking the rounded panel or its blue gradient top.

## Changes to my cycle 1 report

1. **Headline:**
   - Drop "Which order breaks?".
   - Keep the accurate current headline, "One late delivery. / Which orders are now at risk?".
   - Line 2 moves to `--ink-2`, not red. Red is only for data.
2. **Brand promise:** keep "See what breaks before it breaks." as the header brandline. This reverses my "delete `.lp-brandline`". It's also the eyebrow on the closing section.
3. **Layout:**
   - Copy the stacking from Attio and Linear: the headline block is left-aligned (Linear/Foundry) at about 2/3 width, and the stage sits below at the full 1200px.
   - Following Foundry, the short lead can sit in the right third next to the headline at 1440.
   - The two-column hero with the card on the right is gone.

The rest of cycle 1 stays as written: tokens, light/dark themes, the five sections and the mobile order.

## Primary visual directive

**The hero is one wide, flat, hairline-drawn stage: a 12–30 Nov date axis with a red due line at 22 Nov.** The PO-101 receipt visibly slides from 17 to 23 Nov across that line. The shortage then runs as red along a single labelled chain into ORD-102, and the recovery state is a dashed blue Vector branch.

- Draw it the Foundry way: labels, connectors, annotations, no boxes except ORD-102.
- Size it the Attio/Linear way: full width, directly under the headline, with the product as the hero.
- No card, offset shadow, gradient or glow, in either theme.
- Red appears only where something is late or short. That keeps the promise ("before it breaks") and the headline (a supplier delay puts customer orders at risk) in sync with what the stage shows.
