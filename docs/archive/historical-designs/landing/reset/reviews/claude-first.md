# Critique of the redesigned landing page

**Verdict:** The new page looks better than either earlier version. It doesn't yet explain the story more clearly.

**Why it looks better:**
- The original light page had two columns and about nine type levels in its hero card. The rejected dark v2 had a ruler, a four-box chain and a stats slab.
- The new page has one center axis and calm paper or navy grounds. The tokens are the only distinctive shape, and they read at a glance.

**Why it's less clear:**
- **The page no longer shows why the order fails.** The original said "A six-day delay" and printed ~~17 Nov~~ → 23 Nov right next to "Due 22 Nov". The new hero puts "23 Nov" at about x200 and "Due 22 Nov" at about x1260, in 12px at the far corner of a different card. Nobody compares two dates that far apart, so "23 is after 22" is lost.
- **€36,000 has disappeared.** It sits behind a roughly 10px "Why this result?" at the bottom right.
- **The conditions in the spec weren't built.** The plan asked for state control under the graphic, a 120px numeral, a "+6 days" pill, the label "4 needed · 2 arrive late", bottom edges aligned, and a mobile crop at 0.9×. None of these shipped.

Measurements below are taken from the screenshots, scaled back to real pixels, and are accurate to about ±5px.

## 1. Hierarchy and scale: the ORD-102 card is big but its content is small

At 1440 dark, the card spans about x798–1320 and y626–914, so it's roughly 522×290.
- **The numeral is too small.** The "2" is only about 80px tall (y700–778), against a spec of 120. Line 2 of the headline is about 70px, so the payoff number is barely bigger than the headline.
- **"motors short" breaks onto two lines** ("motors / short") even though about 330px of empty width sits to its right. It looks like a layout bug.
- **The right 60% and lower third of the card are empty.** It's big without being dense.
- **The three objects don't share a bottom line:**

| Object | Bottom edge (y) |
|---|---|
| Tokens | ≈790 |
| Receipt | ≈890 |
| Order card | ≈914 |

- **The state control (y552–596) sits between the call-to-action and the graphic.** It reads as a second nav bar and pushes the order card past the 900px fold.

**Fix:**
- Set "2" at 120–140px, with "motors short" on one baseline beside it.
- Under it, put **"Needed 22 Nov · next motors 23 Nov"** in 17px, so the date comparison sits next to the number.
- Shrink the card to fit its content, about 520×300.
- Bottom-align all three objects.
- Move the state control under the graphic, as the spec says. That lifts the whole graphic about 70px and fits the card above the fold.

## 2. Color tokens: risk color fills the very card that should stand out

**Hue-on-hue:**
- In light mode, ORD-102 is a pink fill (about #F5DDD8) with a red border and a drop shadow, holding a red "2".
- In dark mode, it's a brown-maroon fill with a coral border, holding a coral "2".
- Either way, the risk numeral sits on a field of its own hue. That's the lowest-contrast way to set the most important number. The pink slab is also the loudest area in the light hero, which competes with headline line 2.

**Uneven shapes:**
- The tokens step upward. The two ivory tokens sit at about y709 and y701, and the two hatched ones at about y693 and y685. That's an 8px stair-step, and it looks misaligned rather than animated.
- The receipt is tilted about −3° with a stacked-paper shadow. Nothing else on the page is skeuomorphic, so it looks like a stray decoration.

**Tiny labels:**
- "6 days late" is about 12px coral, and "4 MOTORS NEEDED" is 9px mono.
- The row "An alternative to test / Vector Components · 2 motors" (12/10px) adds a fourth object to a three-part story before recovery has even been chosen.

**Fix:**
- Give the order card the neutral surface (#151E30 in dark, #F6F5F1 in light), with no shadow. Show risk only through the numeral and a 3px left rule or a 1.5px border.
- Put all four tokens on one baseline and remove the receipt's tilt and stack.
- Replace "6 days late" with a **"+6 days"** pill, and label the tokens **"4 needed · 2 arrive 23 Nov"**.
- Delete the alternative row from the default state. It belongs in state 03.

## 3. Evidence inset: works on desktop, fails on mobile

**Desktop light: mostly deliberate and readable.**
- The inset is about 750×617 at x571–1320. Text is about 13px and readable, and it repeats ORD-102, which connects it to the hero.
- **Three problems:**
  - The well (about #E4E3DE) and the card (#F6F5F1) are so close in value that the inset reads as another web card, not as a product screenshot.
  - The "Inspect allocation" dropdown is an unstyled native select with the system chevron, which looks broken.
  - The 2-column grid leaves an empty cell of about 290×135 to the right of "Protective housing".
- **The left column has three calls to action stacked:** the tabs, "Open demo to build a network", and a caption. But tab 02 ("Build your network") has nothing to show in the inset.

**Mobile: not readable, and not deliberate.**
- At 390 the inset is about 350×340 and shows the entire desktop component scaled to about 0.45×, so the text is about 5–6px. This is the same failure as the original's slab, and it's the condition the debate doc said must never happen.
- In dark mode it's also a bright white rectangle, the brightest object on the page.
- **Text bug:** at 390, the section headline renders as **"No black box.Follow the evidence."** with no space after the period, in both modes. The hidden line break isn't being replaced by a space.

**Fix:**
- On mobile, crop to the single Servo motor card at about 0.9×, which gives roughly 13px text.
- On desktop, style the select, then either fill the empty grid cell or crop the inset to the two cards that matter (Servo motor and Gear set).
- Darken the light well to about #DAD8D0 so the inset reads as an object.

## Does mobile tell the story fast?

Only through the headline. On a viewport of about 750px:
- **Above the fold:** the eyebrow, headline, subcopy, a full-width button, a separate "See how it works" row (y≈407), the state control (y≈455–500), and the receipt with the tokens (y≈522–704).
- **Below the fold:** the order card starts at about y726, and the "2 motors short" payoff is at about y790–860. That's the one thing the graphic exists to show.

The fastest fix is to cut the eyebrow and the separate "See how it works" row, and to move the state control below the order card. Together that recovers about 130px and puts "2 motors short" on the first screen.

## Is the light product inset deliberate and readable?

- **Desktop:** yes, mostly. It's readable, and it's sized as an object rather than a slab. The low well contrast, the native select and the empty grid cell make it look unfinished.
- **Mobile:** no. The text is illegible, and in dark mode the inset is the loudest shape on the page.
