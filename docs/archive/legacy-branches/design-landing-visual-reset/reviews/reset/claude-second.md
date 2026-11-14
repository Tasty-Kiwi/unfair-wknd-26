# Second review of the refined landing page

The refinements worked. The dates now sit together in the order card ("Needed 22 Nov. Next receipt 23 Nov."), the order surface is neutral, the receipt is no longer tilted, the tokens share one baseline, and the state switch sits under the graphic. On mobile at 390, "2 motors short" is now on the first screen (around y700–760 of 844). I've skipped the mobile date wrap and the evidence inset, since you're already fixing those.

## Priority 1: the visual emphasis points at the motors that arrived, not the missing ones

**Light mode numeral looks faded.** At 1440 light, the "2" and "motors short" are a pale salmon, roughly #D9877C. Headline line 2 and the "Material shortage" dot use the full risk red, roughly #C0392B. So the payoff number is now the weakest red on the page. That's a step back from the original light version, where the risk figure was the strongest mark. Dark mode doesn't have this problem: there the "2" matches the headline coral. So "aligned tokens" holds in dark mode but not in light.

**The two available tokens are the loudest marks in the hero.**
- In light mode they're solid near-black squares.
- In dark mode they're solid ivory squares.
- In both modes the two missing tokens are thin dashed outlines with faint hatching.

So the eye goes first to "2 available". The fact that matters is "2 missing", and it reads like an empty slot.

**Fix:**
- Set the numeral and "motors short" in the same full risk color as headline line 2, in both modes.
- Make the available tokens quiet: a neutral surface fill (#F6F5F1 in light, #151E30 in dark), a hairline border and muted icons.
- Give the missing tokens the full-strength risk color, with a 1.5px solid or dashed border and the "?" in risk color.

The heaviest marks in the row should be the shortage.

## Priority 2: the row's geometry doesn't connect cause and effect

Measurements are from the 1440 dark screenshot:
- **The arrows point at the caption, not at the objects.** Both connectors (x352–400 and x726–784) sit at y≈800, level with the "2 available. 2 missing." text. The token centers are at y≈733, and the receipt's date line is at y≈740. So the chain reads as receipt → caption → card.
- **The order card is mostly empty.** It's 522px wide (x798–1320), but its content ends at about x1030, leaving about 290px of empty navy to the right. The receipt is 220px wide. The tops of the three objects step down: the card at y516, the receipt at y588, the tokens' label at y663. Now that the bottom edges align, the top stagger makes the card look oversized rather than prominent.
- **"Due 22 Nov" is repeated.** The top-right corner label says the same thing as "Needed 22 Nov" in the sentence below it.

**Fix:**
- Move both arrows to the vertical center of the tokens, around y733.
- Shrink the order card to about 380–400px wide, so the "2 motors short" block fills it and the three objects read as one balanced chain.
- Drop the "Due" label in the corner.
- Optionally, enlarge the "Needed / Next receipt" line from about 13px to 15–16px, since it's now the sentence that makes the comparison.

## Smaller items (not priorities)

- "+6 days" is still plain text of about 12px rather than the pill the spec asked for.
- €36,000 still appears nowhere on the visible page. If dropping it was a deliberate decision, ignore this.
