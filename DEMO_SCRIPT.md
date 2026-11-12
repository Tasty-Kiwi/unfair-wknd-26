# DominoOS — 90-second demonstration

**Before presenting:** `npm run dev`; open http://localhost:5173 at normal browser zoom. Click Reset demo. Default view focuses the motor chain. All data shown is fictional.

**0–15 seconds — the promise**

“Manufacturing problems don't stop at the supplier. They cascade into customer commitments. DominoOS lets a planner see what breaks before it breaks. This fictional factory has ten customer orders, and its current material plan covers every one.”

Point to the zero-risk metrics and supplier → motor → product → order map.

**15–35 seconds — cause the disruption**

Click **Supplier disruption**.

“Aster's motor receipt slips six days, from November 17 to November 23. That puts one order at material risk: two motors short, exposing €36,000 of order value.”

Click **ORD-102** in the graph.

“Here's the evidence. We started with eight motors. The earlier order reserved six. Helix needs four on November 22, but only two remain. The receipt arrives after that requirement.”

**35–55 seconds — resolve it**

Click **Add alternative** in the Scenario Lab.

“Vector has two explicitly approved motors available November 18. Add them, and the shortage disappears. The original receipt is still delayed. We changed the supply plan, and the same deterministic engine recalculated the result.”

Point to the covered order, green recovery supplier and zero-risk metrics. Judges can complete this causal loop in under a minute.

**55–75 seconds — prove it is interactive**

Click **Normal operations**, then move the delivery slider to **+5 days** and **+6 days**.

“On the required date counts as available: five days is covered, six is short. You can change quantities, import validated JSON or delivery CSV, and inspect every allocation.”

Click **Approved recovery** to close with zero risk.

**75–90 seconds — credible business value**

“Compare baseline, disruption and recovery here, and export an auditable report. This is material availability, not a factory completion forecast. Our next validation is with planners using real purchase orders and BOMs. The wedge is a fast, explainable what-if before a supplier issue becomes a customer surprise.”

**If asked about policy:** earliest required date, then order ID; partial kits keep their component reservations. It is a transparent priority rule, not an optimization solver. €36,000 is order value exposed, not proven revenue saved.
