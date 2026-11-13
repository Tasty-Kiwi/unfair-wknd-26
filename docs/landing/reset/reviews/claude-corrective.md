# Final review of the landing visual reset: acceptable with conditions

Compared against the original light page (`docs/landing/landing-1440.png`). Nothing was edited.

## Check this first: two captures look out of date

- **Current:** `light-1440-full.png` and `dark-1440-recovery.png`. Both order cards say "Precision actuator" and include the cost-of-risk ("exposure") line.
- **Likely out of date:** `dark-1440-hero.png` and `dark-390-full.png`. Their order cards still say "Due 22 Nov" and have no exposure line. The 390 evidence section also has only two tabs, not three.

Re-check those two once they finish regenerating. Everything below about dark 6-days-late and mobile is provisional.

## The six corrections

| Correction | Status | Evidence |
|---|---|---|
| Centered connectors | **Partly done** | The arrows are centered on the whole row (the order card's midline), not on the tokens. They stay in the same place across states, so the drift is gone. But they sit about 15px above the token center in the late state and about 19px below it in recovery. They still point at the tokens, so this is minor and not a blocker. |
| Order card at 400 | **Done** | The card is exactly 400px wide (920–1320 in dark 1440). The arrows get longer to fill the row, so there's no empty strip on the right. The receipt and order cards are now vertically centered on each other instead of starting at different heights. |
| Muted available tokens + tinted missing | **Done** | Light: white available tokens next to pale-pink dashed missing tokens. Recovery: neutral available tokens next to filled blue alternatives, which reads well. |
| Crop capped at 510 | **Done, but the text is still large** | The red box is now about 508px with even gutters. Its body text still renders at about 22px against about 16px section copy, so it still looks zoomed in, just less than before. |
| Visible exposure line | **Done in light 1440 and recovery** | "€36,000 fictional order value at material risk. Exposure, not loss." It's small (about 11px) and grey, so it's present but quiet. Not yet confirmed in dark 6-days-late or mobile. |
| Network screenshot as its own tab | **Can't confirm** | "02 See the supply network" exists as a tab in light 1440. No capture shows it selected, so I haven't seen the restored screenshot itself. The mobile capture doesn't show the tab at all. |

## Blockers

None in the captures that are current. Before accepting, these need confirming:
1. Fresh dark-1440-hero and dark-390 captures that show "Precision actuator" and the exposure line.
2. One capture with the network tab selected, at 1440 and at 390, so we can see the screenshot is sized properly. The allocation crop's scaling bug is the risk to look for.

## Remaining visual tradeoffs

- **Lots of red in light mode.** The order card still has its pink border and pink fill. Together with the red headline, the "2", "motors short", the shortage label and the tokens, the risk red is still heavy. Dark mode uses salmon for both arrows, where light mode uses neutral ones.
- **The state switch is still at the fold.** It sits at about 887px in a 900px light viewport and about 854px in dark recovery, so the interactive part is only just visible on first load.
- **"€0 fictional order value at material risk"** in recovery is accurate, but the "Exposure, not loss" disclaimer reads oddly next to €0.
- **The evidence crop is still oversized**, as described in the table.
- **The middle section's left column still reads like instructions.** "In the simulator, choose Build a network" isn't a selling point, and it's not obvious that tabs 01–03 change anything.
- **The hero is still a generic centered layout.** The illustration carries all the character.
- **The final call to action still has some empty space** above the footer.

## Verdict

**Accept with the conditions above. Not yet a final sign-off.**

Reasons:
- **Hero:** much clearer than the original's dense, seven-part hero card. It's one claim with one chain, and the cost line is back, so the stakes are restored.
- **Page:** shorter (2344px against 3538px) with three sections instead of six.
- **Corrections:** the four geometry and color fixes show up in the current captures.

Before calling it final:
- Confirm the two captures that look out of date.
- Confirm the restored network tab shows the product at a sensible size. That was the main thing lost compared with the original, which still had a full screenshot of the simulator.
- Optionally, drop the pink border and fill on the light order card to cut back the red.
