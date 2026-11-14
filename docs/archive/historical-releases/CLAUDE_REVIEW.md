# Needtrace release screenshot review (8 images, no edits)

I only reviewed the static screenshots. No human testing happened, and I didn't click, hover, or resize anything. Where a screenshot can't show something, I say so.

**Verdict:** nothing in these screenshots blocks the 1366 desktop demo. One item needs checking before release (#1). Two items are significant on mobile but are tradeoffs (#2 and #3).

## Needs checking before release

**1. "Saving..." appears in all three builder screenshots.**
- It shows in `builder-dark-1366` (top right, next to the toolbar) and in both 390 builder captures (below "Choose File").
- None of them shows "Saved".
- The captures may have caught it mid-save. If the status really stays on "Saving...", that's a trust problem with local autosave, which the release must keep working.
- **Check:** open the builder, wait a few seconds, and confirm the label settles to a saved state.

## Significant but not blocking

**2. The mobile builder graph is cut off on both sides and the text is too small to read** (`builder-dark-390`, `builder-light-390`).
- On first render, the supplier node is clipped on the left (only "…facturing" shows) and the customer order nodes are clipped on the right ("CUSTOMER ORD…").
- Node labels render at about 5–6 px, so they can't be read without zooming.
- The fit-to-view result doesn't match the canvas width.
- **Tradeoff:** editing on a phone is secondary. But the network can't be read on first load, which is more than a cosmetic issue.

**3. At 1366, the builder canvas sits mostly below the fold** (`builder-dark-1366`).
- The header, toolbar, scenario row, section header and palette take up about the first 460 px.
- Only the top row of nodes shows, and the supplier node is cut off at the bottom of the screen.
- **Tradeoff:** this layout puts controls first. In a live demo, the presenter will have to scroll before the graph is visible.

## Minor polish (not blocking)

- **Raw browser file input:** "Choose File No file chosen" uses the browser's default styling next to the "Import workspace JSON" label (both widths). It looks unfinished compared with the styled buttons around it.
- **Disabled button looks more prominent than enabled ones** (`builder-light-390`): "Add connection" is filled mid-grey, while the enabled buttons have outlines. "Save scenario" in the same theme is styled correctly.
- **Navigation is duplicated:** the builder has both a "Simulate" button and "Back to Simulate". The CTA wording also varies: "Build your network" on the landing page, "Build a network" in the simulator.
- **Simulator 390 header wraps awkwardly:** "Build a network", "Import data" and "Reset demo" break across lines, and the theme toggle can't be confirmed at this capture's scale. The image is 390×5234, shown downscaled about 2.6×, so I can't judge text contrast on that page.

## Checks that pass

- **Rebrand:** "Needtrace" and the N logo appear on the landing page and simulator. The builder shows "Needtrace · Fictional example". No "DominoOS" text is visible anywhere.
- **Two CTA paths:** "Try interactive demo" (filled) and "Build your network" (outlined) are clear in dark 1366, light 1440 and mobile 390. Mobile stacks them full width, and the demo CTA repeats at the bottom of the page.
- **Light/dark legibility:** both themes read well on the landing page. The accent changes from coral (dark) to brick red (light), and the shortage state stays clear in both. The light evidence card inside the dark mobile landing page is labelled "light product interface", so it reads as intentional.
- **Simulator at 1366:**
  - The scenario tabs show an obvious selected state ("Normal operations" is filled).
  - The KPI strip, the "Fictional demo data" badge and the "All 10 covered" status are all clear.
  - Graph columns are labelled, and the dashed blue edge for the approved alternative supplier stands out.
  - The zoom controls don't overlap any nodes.
  - Node subtext is small grey-on-dark but readable.
- **Simulator at 390:** the graph switches to a grouped list (suppliers, components, products, orders) with a legend. That's a reasonable mobile tradeoff.
- **Builder colours:** each node type has its own colour (supplier orange, component green, receipt purple, product blue, order pink), and edge colours match their source node.

## What the screenshots can't show

- **Selection state:** no screenshot has a selected node or edge, so I can't assess selection styling.
- **Cloud and guest boundaries:** none of the screenshots show a GitHub sign-in, account area or cloud-sync control. The only boundary text is "No account required for local work" on the landing page. In the builder, "Save workspace" doesn't say whether it saves locally or to the cloud, which could confuse a guest. To verify the cloud boundary visually, you'd need screenshots of the signed-out and signed-in states.
