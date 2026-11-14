# Application UI redesign: command centre + allocation tiles

Branch `redesign/app-ui`. This changes the simulator (`/`) and the builder (`/?builder=1`) only. The landing page, the simulation engine, recovery calculations, datasets, import/export formats, storage keys and routes are unchanged. Production cloud saving stays disabled.

## What changed

### Simulator

- **One screen on desktop.** It has three parts:
  - A 52 px toolbar with the scenario switch, dataset provenance and the inventory date.
  - A compact causal banner: **PO-101 +6 days → 2 servo motors short → ORD-102 at risk**. The €36,000 figure is labelled "Order value at material risk … exposure, not a measured loss".
  - A work area with the supply-chain map on the left and the explanation and recovery panel on the right.
- **Highlighted causal path.** Nodes and edges off the shortage path fade to 45% opacity but stay in the map. Approved alternatives remain visible.
- **"Why ORD-102 is short".** Motor allocation tiles show 6 units reserved by ORD-101, 2 left for ORD-102 and 2 missing. Beside them is the arithmetic (available − reserved = left; missing) and the late receipt. All figures come from the simulation result.
- **Recovery beside the evidence.** Each option shows before → after (`2 short → 0 short`), net units recovered, orders still at risk and **receipts still late**. The cards keep restoring material coverage separate from the supplier delivery being on time.
- **After recovery, the banner lists what changed.** For example: "PO-101 still late: lands 23 Nov (+6 days)" and "Vector Components supplies 2 on 18 Nov (approved alternative)". The Aster card in the map reads "Receipt still late", and the evidence panel opens on the order that recovered.
- **Order book in a drawer.** A bottom bar shows the order count and a coverage strip. It opens the full order book, the scenario comparison and *Export report JSON*.
- **Scenario inputs** ("Change the inputs") are in the right rail below the recovery options. Every existing control is kept.
- **Phones:** banner → explanation and recovery → chain list → timeline → inputs, with the order book as a bottom sheet.

### Builder

- **One 52 px toolbar:** workspace name, Build/Simulate, a Scenario popover, save status, a File menu (New blank, Core example, Save, Export, Import), theme and *Back to demo*.
- **The canvas fills the rest of the viewport.** The palette is a narrow left rail. Node editing, checks and connections sit in a collapsible floating inspector, and the graph stops short of the inspector, so fit-to-view never hides nodes behind it. *Check network* and *Run simulation* sit in a small status bar on the canvas.
- **An empty canvas offers the Core example** directly.
- **Simulate mode** uses the same layout as the simulator: scenarios inline, the map on the left, evidence and inputs on the right.
- **Phones open on a structured list** grouped by node type. Each group has an Add button and each item shows its issue count. The details panel sits below the list, and the map is one tap away.

### Shared visual system

The app's colour tokens now match the landing page: paper `#f2f1ec`, ink `#1b2227`, risk `#b83222`, blue `#2858aa`, and the navy dark theme. Type is still IBM Plex Sans and Plex Sans Condensed. Status is never conveyed by colour alone: shortages are hatched or dashed and labelled in words.

## Verification (14 Nov 2026, local)

- `npm test` 102/102 · `npm run test:worker` 44/44 · `typecheck:worker`, `typecheck:tests` and `npm run build` clean · `npm run deploy:check` dry run OK.
- `npm run test:e2e`: 74/74, run in Microsoft Edge because the bundled Playwright browsers are not installed on this machine.
  - The tests now open the drawer, File menu or Scenario popover where controls moved. A shared helper (`tests/ui-helpers.ts`) does this.
  - Assertions on wording follow the new copy.
  - No assertion about calculated values was removed.
- The disruption → shortage → recovery journey was checked in a browser at 1440, 1366 and 390 px, in light and dark mode:
  - After *Use Vector Components* is applied, every order is covered.
  - The notice and banner state that PO-101 remains late (23 Nov).
  - The order book shows 0 at risk.
- An independent design critique was run against before and after screenshots. Its main findings were fixed: the overlapping timeline label, the late tag disappearing after recovery, tile contrast in dark mode, the "Value at risk" wording, the two different "Simulate" actions, and the truncated header context.
- **No usability testing with real participants has been done.** These are engineering and design-review checks only.

Screenshots are in [`docs/redesign/`](redesign/), with `before-*` from production and `after-*` from this branch. Builder screenshots taken from the local dev server show a "Cloud is unavailable" row, because no local API was running. Production reports cloud as disabled and does not show that row.

## Known limitations

- The recovery assumption text and the detailed evidence cards still show ISO dates (`2026-11-18`), as before.
- The Core example opens at its saved viewport. Use *Fit view* on small screens.
- If this merges, the demo video and the Devpost screenshots must be re-recorded.
