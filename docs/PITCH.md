# Needtrace — pitch and commercial hypotheses

## Project title and tagline

**Title:** Needtrace — trace supply changes to customer orders

**Tagline:** See what breaks before it breaks.

## 30-second pitch

When a supplier delivery slips, which customer orders run short? Needtrace connects stock, bills of material, receipts and orders in one explainable simulation. Change a delivery, trace the shortage to an order, and compare recovery options with allocation evidence. Our fictional demo shows two missing motors and how approved alternative supply restores coverage. It models material availability; supplier confirmation and factory capacity remain outside the calculation.

About 70 spoken words; rehearse to 30 seconds. The intended user is a manufacturing planner combining spreadsheets; this is a customer hypothesis, not validated demand.

## What the demonstration proves

Using the fictional demo dataset:

1. The original plan covers all ten orders with no material shortages.
2. Delaying motor receipt PO-101 from 17 November to 23 November exposes ORD-102.
3. ORD-102 needs four motors on 22 November but has only two available after the earlier-priority order, leaving two missing.
4. Needtrace compares restoring the receipt date with using approved Vector Components supply.
5. Applying two approved Vector motors dated 18 November restores material coverage while the original Aster receipt remains delayed.

These outcomes are calculated by the same simulation used for editable scenarios and imports. The €36,000 figure is **order value at material risk**. It is not an actual financial loss, revenue saved or measured business benefit.

## Buyer, wedge and honest differentiation

Initial customer hypothesis: a small discrete manufacturer whose planner, operations manager or owner maintains material plans in spreadsheets. The likely buyer, switching cost and willingness to pay still require interviews. This is not a validated customer segment.

Planning systems such as SAP IBP, Kinaxis and o9 already address supply-chain scenarios. Our hypothesis is a narrower entry point: validated spreadsheet imports, explicit dataset provenance, a transparent due-date policy, and an immediately inspectable supplier-to-order chain without a full ERP implementation. A visual graph alone is a feature; a durable product requires evidence of repeated pain, trustworthy data preparation, adoption and a viable buyer.

## Why the result is trustworthy

- **Deterministic allocation:** earliest required date, then order ID; repeat runs produce the same result.
- **Inspectability:** each order shows required quantities, allocations, shortages and late supply.
- **Atomic imports:** invalid files do not alter the application; valid imports show which tables will be replaced or retained before confirmation.
- **Explicit provenance:** the header distinguishes fictional demo data, mixed demo and imported data, and fully imported data. Reset restores the original fictional dataset and provenance.
- **Honest boundary:** material availability is modeled; production capacity, freight, purchasing cost, lead-time uncertainty and shipment timing are not.

## Likely judge questions

**Why is this a company rather than an ERP feature?** That is the hypothesis to validate. We would begin with teams whose current spreadsheet workflow makes a rapid cross-order what-if difficult, measure the full task including data preparation, and test repeat usage before claiming a market wedge.

**Where is the AI?** The material decisions are deterministic and auditable. AI is not necessary to calculate a shortage. Any future explanation layer must preserve the underlying evidence.

**What business value have you proven?** In the fictional demo, a six-day receipt delay exposes one €36,000 order to a two-motor shortage, and two modeled recovery actions remove that shortage. This is exposure in a simulation, not a proven loss, saving or customer outcome. No customer benefit has been measured.

**Does it optimize allocation or predict shipment dates?** No. It uses required date then order ID and retains reservations on partial kits. Factory capacity, lead-time uncertainty, production and shipment timing are outside the model.

**Which recovery is best?** The comparison ranks by net shortage units recovered and shows remaining exposed orders plus explicit supply assumptions. Costs, freight and confirmation status are unknown; it is not a purchase recommendation or profit optimizer.

**Does Apply recovery place an order or contact a supplier?** No. It changes the local simulation only. Confirm supply and act through the normal purchasing process.

**Can I use my own data, and is it saved?** CSV supports stock, products, BOMs, receipts and orders; full JSON can replace the catalog as well. Related files are validated together before applying. Omitted tables and matching-product BOMs can be retained, with explicit warnings. Simulator imports stay in browser memory and are lost on refresh/close. Export the report and keep source files; that report is an audit record, not a one-click project backup. Builder workspaces and named scenarios save in this browser and support a portable workspace JSON export. Production cloud saving is disabled.

**What have you actually tested?** The integrated release passed 102 unit tests, 44 Worker tests and 63 Chromium browser journeys, both typechecks, production build and a deployment dry run. GitHub Actions passed on PR #7 head a51adb8. A final local acceptance smoke check repeated the guest demo and examined exported evidence. Desktop and mobile were inspected. These are engineering checks, not evidence that real planners find the product intuitive or valuable.

**What would you validate next?** Observe an unaided user and compare a small anonymized plan with a planner's actual reservation policy. Include data preparation time. Interview a potential budget owner before claiming a viable paid product.

## Next evidence

Run the unassisted journey and planner interview in [VALIDATION_PLAYBOOK.md](VALIDATION_PLAYBOOK.md). Before expanding scope, test a small anonymized real plan against the planner's current allocation and material-availability reasoning.

Use [SUBMISSION.md](SUBMISSION.md) for the video outline and three-person checklist.
