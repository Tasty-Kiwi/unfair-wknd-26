# Needtrace — 60-second demonstration

Open `/demo` with the fictional Northstar dataset and **Normal operations**. Rehearse clicks and scrolling with the final build. The demo is session-only; export results or create a local project before leaving if needed.

1. **0–10 seconds — baseline:** “Ten customer orders have their materials. Needtrace shows what happens when a supplier delivery slips.” Point to the covered result and network.
2. **10–22 seconds — disruption:** Choose **Supplier disruption**. “Aster's motor receipt moves from November 17 to November 23. ORD-102 is two motors short, exposing €36,000 of fictional order value—not a measured loss.”
3. **22–36 seconds — evidence:** Open ORD-102 allocation evidence. “It needs four motors on November 22. The earlier order reserves six of the eight in stock, leaving two. The next receipt arrives too late.”
4. **36–50 seconds — compare:** Show both recovery cards. “Model restoring the receipt date or using two approved Vector motors on November 18. These are supply assumptions, not confirmed commitments.”
5. **50–60 seconds — recover:** Apply Vector. “All ten orders are covered again while the original receipt stays late. Only the scenario changes; no purchase is placed.”

After the minute, choose **Edit this network** to create a saved editable project from the active demo. Show the local-save indicator, reopen it from Projects and export workspace JSON. Allocation is deterministic by required date and order ID. The model covers material availability, not factory capacity or shipment forecasts.

## Routes and recording

`/` is landing, `/projects` the library, `/projects/:id` a saved local project and `/demo` the session-only simulator. `/landing` is a landing alias; `/?builder=1` opens the legacy device draft. Verify public links against the selected deployed build before presenting.

Use [VIDEO_PRODUCTION.md](docs/VIDEO_PRODUCTION.md) for the approximately 2:40 problem-first narration and shot list. [DEVPOST_READY.md](docs/DEVPOST_READY.md) contains submission requirements and human-owned disclosures. The earlier MP4 is a fallback/reference; human review, approval and upload remain open.
