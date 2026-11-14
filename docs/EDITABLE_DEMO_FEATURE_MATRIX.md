# Editable demo feature matrix

Local implementation, 14 November 2026. This inventory compares the rich demo at the start of this change with the editable project implementation. It does not describe the deployed site.

Every project route now opens `BuilderExperience`; `SimulationSurface` owns the simulation body. The old `App.tsx` shell has been removed. `/demo` and its library entry share a dedicated editable Northstar workspace. Build and Simulate use that same workspace, scenario and alternative catalog.

| Feature                                                                                    | Current owner                                                 | Verification                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Deterministic allocation, partial reservations, same-day supply and no double allocation   | `simulation.ts`                                               | `simulation.test.ts`, `builder-parity.test.ts`; Northstar baseline → 2 missing / EUR 36,000 → recovery                                   |
| Outcome banner, shortage cause chain and changed-input disclosure                          | `SimulationSurface`, `OutcomeBanner`, `causeReceipt`          | `context-guidance.spec.ts`, `judge-journey.spec.ts`, `editable-simulation-features.test.ts`                                              |
| Shortage arithmetic, earlier-order reservations and late supply                            | `ShortageExplanation`, `ImpactPanel`                          | `judge-journey.spec.ts`, `final-product-review.spec.ts`                                                                                  |
| Covered-plan guidance and recovery payoff                                                  | `CoverageOverview`                                            | Both themes in `context-guidance.spec.ts`; partial recovery in `final-ux.spec.ts`                                                        |
| Receipt picker, quantities, custom dates, latest safe / first short and shift slider       | `ScenarioPanel`, `receipts.ts`                                | `receipts.test.ts`, `judge-journey.spec.ts`                                                                                              |
| Timeline dragging, keyboard moves and bounded axis                                         | `ReceiptTimeline`                                             | `judge-journey.spec.ts`: pointer and keyboard synchronization, widened ranges and 2035 receipt                                           |
| Focused / full graph, supplier, component, product and order details                       | `SupplyGraph`, shared `NodeDetail`                            | `judge-journey.spec.ts`, `final-product-review.spec.ts`                                                                                  |
| Independent receipt-timing and approved-alternative recovery, with original delay retained | `RecoveryComparison`, `recovery.ts`                           | `recovery.test.ts`, `final-ux.spec.ts`, `editable-demo-acceptance.spec.ts`                                                               |
| Fixed presets matched by material inputs, independent of saved names and IDs               | Builder owner, `scenarioInputsKey`                            | `context-guidance.spec.ts`, `judge-journey.spec.ts`; recovery highlights Approved recovery                                               |
| Named scenarios and comparison with baseline                                               | Builder owner, `NamedScenarios`, shared comparison table      | `builder-journey.spec.ts`; Compare opens the order drawer                                                                                |
| Order book, comparison rows, current scenario and report download                          | `SimulationSurface`, `scenarioReport`                         | `judge-journey.spec.ts`, `final-product-review.spec.ts`; stale saved scenarios are listed as requiring review, also disclosed in reports |
| Import preview, rejection, CSV retention and provenance                                    | Shared `ImportDataDialog`, builder import owner               | `judge-journey.spec.ts`, `demo-editor-parity.spec.ts`; hostile totals rejected and valid large finite values retained                    |
| Reset to the original fictional network and scenarios                                      | Demo workspace owner                                          | `judge-journey.spec.ts`; confirmation is required; other projects use the explicit File menu fixture action                              |
| Multiple supplier associations with a stable primary; explicit supply records              | Connections, compiler, schema, converter, inspector and graph | `builder-domain.test.ts`, `builder-parity.test.ts`, actual pointer / export / import journey in `editable-demo-acceptance.spec.ts`       |
| Local autosave, immediate navigation, project isolation and compatible v1 files            | Builder owner, storage and projects                           | `builder-navigation.spec.ts`, `projects.test.ts`, `projects.spec.ts`, `builder-journey.spec.ts`                                          |
| Dataset projects become editable at their existing address                                 | `makeProjectEditable`, `ProjectPage`                          | `projects.test.ts`: scenario / provenance / original payload retained, idempotent conversion and failed-save preservation                |
| Guest use without working device storage                                                   | `DemoPage`, builder fallback                                  | `editable-demo-acceptance.spec.ts`: blocked reads and writes still permit simulation and workspace export                                |
| Model assumptions, theme and narrow layouts                                                | Shared surface, theme owner, responsive styles                | `final-ux.spec.ts`, `needtrace-release.spec.ts`, narrow import/catalog journeys in both themes                                           |

## Independent review and corrections

Sonnet 5.5 reviewed feature parity against the old rich demo, and GPT-6.1 Terra reviewed domain and persistence integrity. Both were read-only reviews; neither established browser acceptance. The parent addressed their valid findings and ran browser verification afterwards:

- Preserve the old single-supplier network-key shape so unchanged v1 scenarios remain current.
- Match presets by material content, retain meaningful saved-scenario identities on recovery, remove duplicate fixed comparison rows, and disclose stale named scenarios.
- Convert dataset projects in place so imported projects use the same editable experience.
- Restore reset and retained-BOM disclosure; scope reset to the demo, update autosave wording, and remove import's redundant confirmation after the preview.
- Save pending edits synchronously on navigation and retain a guest fallback for unavailable storage.
- Connect Compare to the shared drawer; reset stale selection / drawer state after replacing a network.

## Existing model boundaries

Supplier links are associations, not stock or purchase orders. Material availability remains separate from factory capacity and shipment forecasts. Only approved, product-scoped alternatives allocate. A quantity-only receipt reduction still has no automatic restoration suggestion; quantity controls remain available. Money labels retain the existing whole-euro rounding, and large-network interactive performance has not been benchmarked. These are inherited limits, not omitted demo features.

Final integrated command results are recorded in [DEMO_EDITOR_PARITY.md](DEMO_EDITOR_PARITY.md). Automated local checks do not constitute a human first-use test or a deployment.
