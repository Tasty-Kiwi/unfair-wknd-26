# Needtrace — video production

Target **2:30–2:45**, approximately **2:40**, with a hard limit of **3:00**. This is a prepared script and shot list, not a timed recording. Rehearse actual clicks and pauses. Keep the product visible from the first frame at 1366×768 or a readable laptop resolution. Hide personal tabs and notifications. The release is browser-only.

## Shot list and narration

| Time | Shot and action | Narration |
| --- | --- | --- |
| 0:00–0:20 | Open `/demo`, **Normal operations**. Show ten covered orders and the supplier-to-order network. | “A manufacturing planner gets a call: a motor delivery will be late. Which customer orders need attention? Needtrace traces a supplier change through the material plan. Here, all ten customer orders are covered.” |
| 0:20–0:42 | Choose **Supplier disruption**. Point to PO-101 and ORD-102. | “Aster's motor receipt moves from November 17 to November 23. ORD-102 needs four motors on the 22nd. Now it is two short, with €36,000 of fictional order value exposed.” |
| 0:42–1:02 | Show **Why ORD-102 is short**, then its allocation evidence. Keep four required, two allocated and the late receipt readable. | “Eight motors are in stock. The earlier order reserves six, leaving two for this order. The evidence shows exactly why the next receipt is too late. The alert comes from shared stock reservations, not a hardcoded demo result.” |
| 1:02–1:25 | Scroll the explanation rail to **Ways to recover**. Show both cards before applying anything. | “Compare restoring the original receipt date with using two approved Vector motors available November 18. Each option is calculated independently against the current scenario, with its assumptions visible.” |
| 1:25–1:42 | Apply **Use Vector Components**. Show ten covered orders and original PO-101 still at November 23. | “Apply Vector. All ten orders have material coverage again while Aster's original receipt stays late. This changes the model; no purchase is placed or supplier contacted.” |
| 1:42–2:08 | Choose **Edit this network**. Show the new `/projects/:id`, editable node and local-save indicator. Export workspace JSON from File. | “The demo is session-only. Edit this network creates a saved local copy of the current plan and scenario. Edit it, reopen it from Projects, or export workspace JSON for a portable backup.” |
| 2:08–2:25 | Show editable network and scenario evidence. | “We built an editable supply network and deterministic material simulation with traceable allocations and scenario comparison. The same engine checks imported and edited plans. The distinction is the complete path from a supplier change to an order-level explanation and a modeled response.” |
| 2:25–2:40 | Return to a clear covered-result view; show public landing and `/demo` links. | “A late delivery ripples through a plan. Needtrace helps you see which order needs attention and test a response before you act. Try the demo. Trace the next change yourself.” |

**Build-period disclosure:** Before recording, the team must confirm which capabilities in the 2:08–2:25 line were built during the weekend and explicitly attribute any pre-existing work. Adapt that line to the verified facts; this script does not attest to a build period.

Keep concise disclosures visible during the example: **Fictional data · exposed order value, not measured loss · material availability only**. Approval and availability are input assumptions. The model does not forecast shipments or factory capacity. Put necessary disclosures in captions and Devpost; keep the closing focused on the next step.

## Recording and acceptance

- Start directly at `/demo`; show working behavior within 30 seconds. Avoid slides, technology lists and feature tours.
- The first screen should answer who has the problem: a manufacturing planner checking customer-order exposure after a supplier change.
- Rehearse scrolling in the explanation rail so the evidence and both recovery cards are legible. Wait for the graph to settle after changes.
- After exporting, verify the file if it is shown in the video. Local project URLs are not shared cloud links.
- Watch the exported video from beginning to end. Confirm duration ≤3:00, clear audio, accurate quantities, readable text, no private notifications, and the actual recovery action.
- Upload to YouTube/Vimeo as Public or Unlisted and test the final link signed out. Enter it in [Devpost readiness](DEVPOST_READY.md).

## Final card

```text
Needtrace — See what breaks before it breaks.
Try it: https://domino-os.tasty-kiwi.workers.dev/
Demo: https://domino-os.tasty-kiwi.workers.dev/demo
Trace the next change yourself.
```

Verify these against the selected production build before recording. `/projects` is the local library, `/projects/:id` a saved local project, `/landing` a landing alias and `/?builder=1` the legacy device draft. A local fallback URL must not be presented as the public link.

## Existing recording

The [147-second MP4](release/final/production/needtrace-demo.mp4), with [captions](release/final/production/demo-captions.srt), was produced from `8fca52a` and predates the current UI. It is a fallback/reference pending full human review of footage, audio, labels, results and closing URL. No replacement was recorded, watched, approved or uploaded in this review. Decide whether to retain, edit or rerecord it only after that review.
