# Needtrace — demo video production

Record a product-first video around **2:30** and keep the exported duration at or below the verified **3:00** maximum. Upload to YouTube or Vimeo as **Public** or **Unlisted**. See [DEVPOST_READY.md](DEVPOST_READY.md) for the official submission requirements and final Devpost copy.

The narration below is a script, not a recording or verified runtime. Rehearse with the actual clicks and trim pauses to stay within the limit. The currently deployed product is guest-only; production cloud saving is disabled. Do not show sign-in or imply cloud saving works in production.

## Recording setup

- Open the approved guest demo in a clean browser. Confirm the baseline shows all ten orders covered and reset to fictional demo data.
- Use a readable desktop resolution and zoom. Hide personal tabs, bookmarks, notifications, and unrelated apps.
- Check the microphone and narration levels. Keep the product visible from the opening frame; skip intro slides.
- If the public site is unavailable, use the tested local guest build described in [NEEDTRACE_RELEASE.md](NEEDTRACE_RELEASE.md). Do not present a local URL as the public product link.

## Shot list and narration — target about 2:30

### 0:00–0:15 — Open on the working demo

**Action:** Show Needtrace guest simulator at baseline with ten covered orders and supplier-to-order network.

**Narration:** “When a supplier delivery slips, which customer orders run short? Needtrace lets a manufacturing planner model that change and trace its material impact. This is a fictional dataset, and the demo works locally without sign-in.”

### 0:15–0:40 — Create the disruption

**Action:** Show baseline coverage. Choose the named supplier-disruption scenario, or move PO-101's motor receipt from November 17 to November 23, then run the simulation.

**Narration:** “The original plan covers all ten fictional orders. I delay the motor receipt by six days and recalculate. Needtrace flags ORD-102: it needs four motors on November 22, but only two remain after the earlier-priority order.”

### 0:40–1:05 — Inspect the evidence

**Action:** Select ORD-102 and its motor shortage. Keep required quantity, allocations, two missing units, and exposed order value readable.

**Narration:** “Here are the requirement, allocation, and two-unit shortage behind the alert. The 36-thousand-euro order value is exposure in this scenario, not a measured loss or saving.”

### 1:05–1:35 — Compare and apply a modeled recovery

**Action:** Open recovery comparison. Show restoring the receipt date and approved alternative supply. Choose two approved Vector motors dated November 18, inspect the assumptions, apply the option, and show restored coverage.

**Narration:** “Needtrace compares two modeled ways to recover coverage. I choose two approved Vector motors dated November 18. Applying this changes the simulation only; it does not place a purchase or contact a supplier. Recalculation restores material coverage while the original Aster receipt remains delayed.”

### 1:35–1:55 — Show the calculation boundary

**Action:** Show allocation detail and the resulting order status.

**Narration:** “Allocation follows required date, then order ID, so the same inputs produce the same result. Needtrace models material availability. It does not model factory capacity, supplier confirmation, freight, or shipment timing.”

### 1:55–2:15 — Show the local builder

**Action:** Open the builder. Show a selected node or typed connection and the local-save indicator. Avoid opening a system file dialog.

**Narration:** “The local builder lets a team edit a network and save named scenarios in this browser. CSV and JSON imports support plan testing with validation before changes are applied. Export a workspace JSON to keep a portable copy.”

### 2:15–2:30 — Close honestly

**Action:** End on Needtrace with the public guest demo link visible.

**Narration:** “Needtrace is a prototype for making supply-change consequences easier to inspect. We have not validated customer demand or business savings. Production is guest-only, with cloud saving disabled.”

## Editing and quality check

- Keep clicks and resulting feedback visible. Captions are recommended; check names and quantities against the narration.
- Show fictional-data context. Never call €36,000 a loss prevented, revenue saved, or measured benefit.
- Watch the exported video from beginning to end. Confirm final duration is no more than 3:00, audio is clear, text is readable, the recovery action is visible, and no private tabs or unrelated notifications appear.
- Test the uploaded YouTube/Vimeo link signed out and verify it is Public or Unlisted. Put the final URL in the Devpost video field in [DEVPOST_READY.md](DEVPOST_READY.md).

## Final card copy

```
Needtrace — See what breaks before it breaks
Try it: https://domino-os.tasty-kiwi.workers.dev/landing
Interactive demo: https://domino-os.tasty-kiwi.workers.dev/
Fictional data · material availability only
```

Use these links only after checking that they open in a clean browser. The legacy hostname is intentional in this release; do not imply a Needtrace domain exists.

## Produced browser draft

A real production guest-browser capture with synthesized macOS Samantha narration has been generated: `.tmp/final-execution/video/needtrace-demo.mp4`, 147 seconds, 1366×768, H.264/AAC, approximately 5.2 MB. `.tmp/final-execution/video/capture.json` records the public source and capture time. [SubRip captions](release/final/production/demo-captions.srt) are included. The filmed builder scenario was saved and exported as workspace JSON.

This is an automated recording draft, not human usability evidence or an approved/uploaded submission. Watch the entire video and audio, verify names/numbers/legibility, approve or replace synthesized narration, then upload to YouTube/Vimeo. Test the final URL while signed out. Personal/team and pre-existing-work facts must still be supplied.
