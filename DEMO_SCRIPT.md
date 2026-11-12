# DominoOS — 90-second demonstration

**Before presenting:** use the public Cloudflare Workers link in README; keep `npm run dev` at http://localhost:5173 as the fallback. Use normal browser zoom. Click Reset demo. Default view focuses the motor chain. All data shown is fictional.

**0–15 seconds — the promise**

“For a small manufacturer planning in spreadsheets, one late supplier means checking many customer promises. DominoOS shows what breaks before it breaks. This fictional factory has ten orders, all currently covered.”

Point to the headline and the supplier → motor → product → order map.

**15–35 seconds — cause the disruption**

Click **Supplier disruption**.

“Aster's motor receipt slips six days, from November 17 to November 23. That puts one order at material risk: two motors short, exposing €36,000 of order value.”

Click **ORD-102** in the graph.

“Here's the evidence. We started with eight motors. The earlier order reserved six. Helix needs four on November 22, but only two remain. The receipt arrives after that requirement.”

**35–55 seconds — resolve it**

Scroll to **Compare recovery actions**. Contrast **Restore PO-101 timing** with **Use Vector Components**, then click **Apply what-if** on the Vector option.

“We can ask Aster to restore the original timing, or buy two approved motors from Vector for November 18. Both cover the shortage; confirmation and purchase costs still matter. Apply Vector: the original receipt stays delayed, but material coverage is restored.”

Point to the covered order, blue dashed recovery supplier and zero-risk metrics. Judges can complete this causal loop in under a minute.

**55–75 seconds — prove it is interactive**

Click **Normal operations**, then click **Latest safe · 22 Nov** and **First short · 23 Nov**, or drag the receipt on the timeline.

“On the required date counts as available: five days is covered, six is short. You can change quantities, import validated JSON or separate spreadsheet tables, and inspect every allocation.”

Click **Approved recovery** to close with zero risk.

**75–90 seconds — credible business value**

“Compare baseline, disruption and recovery here, and export an auditable report. This is material availability, not a factory completion forecast. Our buyer hypothesis is small manufacturers without a full planning system. Next we must measure whether this beats their spreadsheet workflow on real plans.”

**If asked about policy:** earliest required date, then order ID; partial kits keep their component reservations. It is a transparent priority rule, not an optimization solver. €36,000 is order value exposed, not proven revenue saved.
