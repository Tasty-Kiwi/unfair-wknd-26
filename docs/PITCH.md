# DominoOS — pitch and commercial hypotheses

## 30-second pitch

Small manufacturers often need to answer a deceptively hard question across several spreadsheets: if this receipt slips, which customer orders lose material coverage? DominoOS brings stock, BOMs, receipts and commitments into one explainable what-if. Change a delivery, trace the exposed orders, and compare confirmed timing with approved alternative supply. Every number has an allocation trail. We are testing whether a lightweight tool can shorten this decision without a full planning-system rollout.

## Buyer, wedge and honest differentiation

Initial customer hypothesis: a small discrete manufacturer whose planner, operations manager or owner maintains material plans in spreadsheets. The likely buyer and willingness to pay need interviews. This is not a validated customer segment.

Planning systems such as SAP IBP, Kinaxis and o9 already address supply-chain scenarios. Our hypothesis is a narrower entry point: spreadsheet imports, a transparent due-date policy, and an immediately inspectable supplier-to-order chain without an ERP implementation project. A visual graph alone is a feature; a startup requires evidence of repeated pain, adoption, trusted data preparation and a viable buyer.

## Likely judge questions

**Why is this a company rather than an ERP feature?** That is the hypothesis to validate. We would begin with teams whose current spreadsheet workflow makes a rapid cross-order what-if difficult, measure task time including imports, and test repeat usage before claiming a market wedge.

**Where is the AI?** The material decisions are deterministic and auditable. AI is not necessary to calculate a shortage. Any future explanation layer must preserve the underlying evidence.

**What business value have you proven?** In the fictional demo, a six-day receipt change exposes one €36,000 order to a two-unit material shortage. Two independent what-ifs remove that shortage. That value is exposure, not proven loss or savings. No customer benefit has been measured yet.

**Does it optimize allocation or predict shipment dates?** No. It uses due date then order ID and retains reservations on partial kits. Factory capacity, lead-time uncertainty, production and shipment timing are not modeled.

**Which recovery is best?** The comparison ranks by net shortage units recovered and shows remaining exposed orders plus explicit supply assumptions. Costs and freight are unknown; it is not a purchase recommendation or profit optimizer.

## Next evidence

Run the unassisted journey and planner interview in [VALIDATION_PLAYBOOK.md](VALIDATION_PLAYBOOK.md). Before expanding scope, test a small anonymized real plan against the planner's current allocation and material-availability reasoning.
