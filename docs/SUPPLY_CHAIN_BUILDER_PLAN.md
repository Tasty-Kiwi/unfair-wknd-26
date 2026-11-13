# DominoOS — Visual Supply Chain Builder Implementation Plan

**Architecture approved. Scope amended following review of commit `d241a50`. This revision changes planning documents only.**

> Implementation update: the reduced P0 is implemented and locally verified on `feat/supply-chain-builder`. See [implementation evidence](BUILDER_IMPLEMENTATION.md) for actual model contributions, acceptance results and remaining scope. The planning history and timeboxes below are preserved; no deployment or merge is implied.

Repository: Tasty-Kiwi/unfair-wknd-26. Application baseline inspected during the original discussion: `e4197fc`; current documentation baseline: `d241a50`. Submission: **14 November 2026, 20:00 Europe/Vilnius (18:00 UTC)**.

**Smallest finished product:** build a supply chain from blank, save a named disruption scenario for that network, delay a receipt, compare with baseline, and inspect the affected customer orders.

The graph-to-Dataset architecture remains approved. One raw editable graph document owns the builder network; deterministic compilation produces the existing validated Dataset; existing Scenario overlays and simulate() calculate results. No second allocator, backend or rewrite.

The [three-round debate](BUILDER_DESIGN_DEBATE.md) remains an unchanged record of the actual participant exchanges. Its original scope and person-hour estimates are historical, not current commitments. **This plan contains no person-hour forecasts.** Deadline and checkpoint timeboxes remain.

## 1. Amendments from the review

| Decision | Current instruction |
| --- | --- |
| Five core node types first | Supplier, Component, Receipt, Product and Customer Order form P0. Alternative authoring/recovery on builder networks is P1 and cannot block shipping P0. |
| Basic named scenarios in P0 | New scenario, Save, Select and Compare with baseline are required. Duplication, separate rename/delete management and multi-scenario comparison are deferred. |
| One simple workspace format | Store the raw document, saved named scenarios, active scenario draft and basic source label in one validated versioned browser-local envelope. JSON export/import uses that same format. |
| Smaller review gate | A changed material-network signature makes saved scenarios require explicit revalidation. Preserve original inputs. No target snapshots, before/after history or automatic repair. |
| Laptop-first editing | Real canvas connections, usable forms and basic form-based connections are required. Keyboard-accessible fields/actions and a nonbroken narrow layout are required. A separate optimized mobile builder is P1. |
| Preserve the stable product | Keep existing demo/CSV/Dataset imports and recovery working through their current Simulate path. Broad import-to-editor migration is P1. |
| Evidence over forecasts | Remove person-hour estimates. Use two strict functional checkpoints and acceptance tests. Keep implementation isolated on a feature branch. |

Do not repeat the model discussion. No new architectural vote is needed to apply this feedback.

## 2. Current architecture and reusable parts

| Existing source | Reuse |
| --- | --- |
| [types.ts](../src/lib/types.ts) | Dataset, Scenario, SimulationResult and allocation evidence retain their existing meaning. Builder types live separately. |
| [validation.ts](../src/lib/validation.ts) | Reuse parseDataset, parseScenario, isIsoDate and existing import safeguards. Keep parser behavior intact. A broad structured-validation refactor is not required for P0. |
| [simulation.ts](../src/lib/simulation.ts) | Only stock allocator: due-date then ID ordering, shared source balances, dates, product-scoped alternatives and partial-kit reservations. Reuse unchanged. |
| [receipts.ts](../src/lib/receipts.ts) | Shared receipt-date changes, shift bounds, date helpers, exposure and tipping points. |
| [recovery.ts](../src/lib/recovery.ts) | Existing recovery remains available in the existing simulator. Builder alternative authoring is a later extension. |
| [provenance.ts](../src/lib/provenance.ts) | Preserve existing fictional/imported/mixed labels and CSV disclosures. Avoid a provenance migration in this milestone. |
| [SupplyGraph.tsx](../src/components/graph/SupplyGraph.tsx) | Preserve the read-only result map, focus/full views and causal status styling. Reuse visual conventions for a separate small Build canvas. |
| [ReceiptTimeline.tsx](../src/components/graph/ReceiptTimeline.tsx) | Keep current timeline interactions and allocation evidence in Simulate. |
| [ScenarioPanel.tsx](../src/components/scenarios/ScenarioPanel.tsx) | Reuse receipt date/quantity controls against the builder's compiled network. Add a small named-scenario wrapper. |
| [ImpactPanel.tsx](../src/components/scenarios/ImpactPanel.tsx) | Show actual required/allocated/missing material and late-receipt evidence for selected orders. |
| [App.tsx](../src/App.tsx) | Add Build/Simulate selection and a guarded builder snapshot boundary. Preserve existing demo, imports, report and comparison behavior. |
| [unit tests](../src/tests), [browser journeys](../tests/judge-journey.spec.ts) | Retain existing behavior coverage and add focused builder tests. |

The existing import accepts one Dataset JSON or up to five CSV tables, each limited to 2 MB. CSVs replace selected tables atomically and retain omitted tables; imported products may retain existing BOMs. Keep that logic and its preview/disclosures intact.

Earlier planning verification at the application baseline recorded 60 passing unit tests and a successful TypeScript/Vite build. The existing browser suite contains 11 journeys. These are historical baseline observations, not a new verification run or proof that the builder exists. This documentation revision does not run or claim new application tests.

Material availability remains the product boundary: no capacity, labor, production-duration or exact-shipping forecast. Lead time/region remain metadata; at-risk order value is exposure, not a predicted loss.

## 3. Feature priorities and delivery boundary

### P0 — the shippable first release

- Create a blank network or open a **core builder example**.
- Add, edit, move, delete and connect the five core node types.
- Edit initial stock, receipt/order dates and quantities, product fields and BOM edge quantities.
- Reject invalid/duplicate connections before mutation; show missing fields/relationships; compile the whole graph only when valid.
- Run the compiled network through the existing engine and show actual order/material evidence.
- Create a named scenario, Save it, Select it, edit its disruption inputs and Compare with baseline.
- Change a delivery date or quantity without changing the baseline.
- Preserve saved scenario inputs after material edits; require explicit revalidation before running them on the updated network.
- Save/restore the builder locally and export/import the same versioned workspace JSON.
- Provide real desktop handle connections and basic form-based connections using the same actions.
- Keep fields/actions keyboard accessible, the laptop layout usable and narrow screens free of broken/overlapping essential controls.
- Preserve the existing demo, CSV/Dataset import, imported-plan disclosures, existing recovery, fixed comparisons and report export.
- Prove blank creation → named disruption → shortage evidence → save/reload/reopen in automated browser tests.

### P1 — only after P0 passes

- Alternative supplier node creation, explicit approval/product scope and recovery for builder networks.
- Detailed scenario change explanations, target snapshots and selective review.
- Dedicated narrow-screen/list builder, optimized touch connections and full mobile editing parity.
- Open arbitrary existing Dataset/CSV networks in Build through a lossless adapter, including alternatives.
- Rich deletion/dependency repair UI, batch supplier disruptions and detailed provenance history.

### P2 — excluded before submission

Auto-layout, undo/redo, advanced scenario management (duplicate, separate rename/delete flows, multi-scenario comparison), multi-factory/multi-level BOMs, AI network generation, accounts, cloud synchronization, collaboration, ERP/purchasing integration, supplier qualification workflows, scheduling and optimization.

**P0 acceptance ends at the named disruption workflow.** The original blank-to-approved-alternative demonstration becomes a P1 acceptance journey. Existing approved-alternative behavior in the stable simulator must still pass its regression tests.

## 4. User journeys

### Build a network

1. Existing users still land on the working Simulate demo. **Build a network** offers Blank or Core example.
2. Blank contains no hidden business entities. Enter a network name and inventory date.
3. Click a labelled palette action to add a supplier, component, receipt, product or order. Each incomplete card opens its inspector.
4. Enter properties and connect compatible handles. The relationship form offers source/type/target selections for the same connections.
5. Set initial stock explicitly, including zero. Connect components to products and enter the positive BOM quantity.
6. Validate selects the relevant node/edge and shows actionable field/relationship errors.
7. Run compiles every node and relationship. On success, switch to the existing simulation UI for that builder network. No record is omitted to make the graph look valid.

Click-to-add and node dragging are sufficient for P0 placement. Palette drag/drop is optional; it must not delay the first connected simulation.

### Create and use a named disruption

1. Baseline is always available and contains no overlays.
2. Choose **New scenario**, enter a nonblank name such as Motor shortage, and edit receipt date/quantity through the existing controls.
3. Valid changes preview the existing engine's results; unsaved changes are visibly labelled.
4. **Save scenario** records the name, Scenario inputs and current validated network signature. It never edits baseline dates/quantities.
5. **Select scenario** reloads a saved record into the controls. Switching away from unsaved scenario changes requires an explicit Save or Discard decision.
6. **Compare with baseline** shows baseline and the selected scenario against the same compiled network: orders at risk, missing material units and value at risk.
7. Inspect an affected order for required/allocated/missing quantities and receipt/date evidence.
8. Return to Build; positions, graph properties and named scenarios remain.

### Edit after saving scenarios

A material edit makes prior results noncurrent immediately. When the updated graph compiles, any saved scenario bound to another material-network signature is labelled **Requires review**. Inputs are unchanged. It cannot run or enter comparison until the user explicitly revalidates it against the current network.

The review action needs a concise warning and the scenario's current inputs, not a before/after history interface. Same-ID retargeting is covered by the signature. Missing targets and invalid bounds remain actionable validation failures.

### Save and reopen

Auto-save the workspace envelope locally and offer an explicit Save workspace action. Wait for actual write success before showing Saved locally. Refresh or Import workspace restores the raw graph and named scenarios. Revalidate and rebuild computed state; do not load cached simulation results.

A safe incomplete draft may reopen with errors and Run disabled. A malformed file or storage value never replaces current valid in-memory state silently.

## 5. Canonical graph and node schema

One raw BuilderDocument is the editable authority for a builder network. IDs are immutable and independent of labels. React Flow nodes/edges are adapters to that document.

```ts
type NodeKind = "supplier" | "component" | "receipt" | "product" | "order";
type NodeKey = string; // kind + ":" + exact immutable domain ID

type EditorNode<K extends NodeKind, F> = {
  kind: K;
  id: string;
  position: { x: number; y: number };
  fields: F;
};

type BuilderNode =
  | EditorNode<"supplier", {
      name: string; region: string; leadTimeDays: string;
    }>
  | EditorNode<"component", {
      name: string; unit: string; initialStock: string | null;
    }>
  | EditorNode<"receipt", {
      quantity: string; availableDate: string;
    }>
  | EditorNode<"product", { name: string; sku: string }>
  | EditorNode<"order", {
      customer: string; quantity: string; requiredDate: string; value: string;
    }>;

type BuilderDocument = {
  id: string;
  name: string;
  asOf: string;
  revision: number; // business fields/relationships, not positions/viewport
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  viewport?: { x: number; y: number; zoom: number };
};
```

Node fields **omit supplierId, componentId, productId and bom**. Those relationships exist only as edges. Never keep independently writable FKs and edge relationships.

- Generate new domain IDs with a kind prefix and UUID. Existing arbitrary IDs, when adapted in P1, remain exact. Typed NodeKeys prevent cross-kind collisions.
- Counts remain raw strings until compilation. Empty/invalid visible text cannot fall back to an earlier valid parsed number.
- Initial stock starts empty and must be entered explicitly. Null is reserved for preserving genuinely absent inventory rows in the later Dataset adapter; it means no row, not an empty authored field. Explicit "0" emits a zero row.
- Required names/customer/SKU/unit, whole-count and money/date rules follow the existing Dataset validator. BOM/order quantities are positive; stock/receipts may be zero; money is finite and nonnegative.
- Dates are real ISO calendar dates and not before asOf.
- Region may be empty and lead time may visibly default to zero. Label lead time informational.
- Preserve raw invalid graph field values in the workspace format; validation of the envelope is distinct from readiness to simulate.

P1 extends NodeKind with a distinct alternative semantic type, reusing receipt UI where practical. Approval defaults false and product scope defaults empty. Product scope is an inspector property stored once, never extra canvas edges.

## 6. Meaningful edges and connection rules

```ts
type RelationshipKind =
  | "primarySupplier" | "receiptSupplier" | "receiptComponent"
  | "bom" | "orderedProduct";

type BuilderEdge =
  | {
      id: string; kind: Exclude<RelationshipKind, "bom">;
      source: NodeKey; target: NodeKey;
    }
  | {
      id: string; kind: "bom";
      source: NodeKey; target: NodeKey; quantity: string;
    };
```

| Relationship | Cardinality at compile | Dataset meaning |
| --- | --- | --- |
| Supplier → Component | Exactly one primary supplier per component | Component.supplierId; creates no stock or delivery |
| Supplier → Receipt | Exactly one incoming supplier per receipt | Delivery.supplierId |
| Receipt → Component | Exactly one outgoing component per receipt; many receipts per component | Delivery.componentId |
| Component → Product | At least one BOM line per product; unique component/product pair; many-to-many | Product.bom with positive required quantity |
| Product → Order | Exactly one incoming product per order; many orders per product | CustomerOrder.productId |

The receipt supplier can differ from the component's primary supplier. Derive each from its own edge; otherwise valid-looking results can attribute receipts to the wrong supplier.

Use one **canConnect(document, candidate)** function for desktop handles and connection forms, plus the same reducer for mutations. Reject wrong endpoint kinds, nonexistent endpoints, wrong direction/handle, self-loops, cycles, duplicate pairs and extra single-parent relationships before accepting an edge.

Use an exact allowlist, not a no-skipped-layer rule: Supplier → Component is required. Product → Product and arbitrary free-form edges are unsupported.

A second parent is rejected. Replacing an existing single-valued relationship is an explicit atomic remove/add action. Duplicate BOM attempts select the existing edge for editing; never add or sum another requirement silently.

Missing relationships may exist in the draft and block the full compile. Invalid proposed relationships never enter the document.

## 7. Compilation and validation

```ts
type BuilderIssue = {
  nodeKey?: NodeKey; edgeId?: string; field?: string; message: string;
};

function compileGraph(doc: BuilderDocument):
  | { ok: false; issues: BuilderIssue[] }
  | { ok: true; dataset: Dataset; networkKey: string; canSimulate: boolean };
```

1. Validate document shape, node identities, endpoints and all required links.
2. Parse every raw field deliberately. Reject blank/nonfinite/invalid counts instead of coercing empty text to zero.
3. Build typed indexes and deterministic table/BOM ordering with a code-point comparator.
4. Map node properties and the five edge kinds into Dataset tables. Initial stock becomes inventory. **P0 builder networks compile alternatives as an empty array.**
5. Call parseDataset as the final business-contract gate.
6. Return no Dataset if any current node or edge is incomplete/invalid. Never drop a disconnected receipt or order.
7. Return canSimulate only when at least one order exists. Empty datasets may be structurally valid but do not constitute a completed simulation journey.

For P0, field/relationship diagnostics can come from the small builder validator, reusing shared helpers where practical. If parseDataset finds a remaining semantic error, show its existing message as a network-level error. Do not parse formatted strings into fields. Do not refactor every existing Zod/semantic parser just to obtain perfect field mapping.

Keep the existing validation and simulation implementations authoritative. No allocation logic belongs in the compiler.

Tests must assert exact Dataset relationships as well as simulation results. A graph compiler can produce a Dataset that validates but maps a receipt to the wrong existing component or supplier.

A general datasetToGraph adapter remains designed for P1: preserve every business field/reference, absent versus zero inventory, alternatives and scope, then prove normalized business round-trip and simulation parity. Do not silently strip alternatives from an existing imported plan to fit the five-type builder.

## 8. State ownership and synchronization

Use useReducer and a small context/hook; no new state library. Keep one owner of the builder document, saved scenarios, working scenario, selection and local-save state.

A validated Dataset and results are derived in memory. Build text edits never call simulate, receiptExposure, tippingPoints or comparison computations.

Compile/Run publishes the Dataset, network identity, scenario readiness and result together only after all validations succeed. A failed compile preserves the current raw draft and any in-memory previous valid snapshot. Hide old results while the draft is invalid/noncurrent rather than constructing a historical-results editor.

**No persisted validated checkpoints or result caches in P0.** After refresh, compile the restored draft again; if it is incomplete, show issues and no current result. This deliberately reduces persistence complexity.

Moving nodes/panning/zooming changes local save state but not the material-network key. Metadata-only label changes refresh displayed labels after successful compilation without invalidating scenario meaning.

A result belongs to workspace ID + compiled material-network key + actual Scenario inputs. Never reuse by display name or scenario ID alone. Reset form state on workspace/compiled-network/scenario identity, not data.name; the current ScenarioPanel key is in App.tsx:598.

Guard the engine boundary against thrown validation failures. Do not catch an error and substitute zero shortages.

### Existing plans and builder networks

P0 has two explicit input sources within the same application:

- Existing demo/imported plans retain their current Dataset/import state and existing Simulate behavior.
- Builder networks own a BuilderDocument; the simulator receives only its compiled read-only Dataset.

These are different networks, not two writable representations of one network. Use a clear active-network/source selection. The shared engine, evidence panels and visual language keep Build and Simulate connected.

Existing CSV/Dataset imports target the existing simulator, not the graph document. Opening one must not overwrite the saved builder or silently apply CSV rows to it. Users can return to their builder. Cross-format migration into Build is P1.

The core builder example contains only supported core entities and is explicitly fictional. Opening the full original DominoOS demo continues to use its existing simulator, including alternatives.

## 9. Minimal named scenarios and baseline comparison — P0

Keep the existing Scenario type. Wrap saved and working instances with one network binding:

```ts
type ScenarioRecord = {
  scenario: Scenario;                 // stable ID and user-entered name
  validatedNetworkKey: string | null;
};
```

No targetSnapshots, archive history or before/after diff structures are required.

- **New:** create a fresh Scenario ID with a nonblank user name and empty overrides for the current network. Baseline remains immutable.
- **Edit:** reuse ScenarioPanel delivery date/quantity controls. Keep a working Scenario copy so Save is explicit; name edits can use the same form.
- **Save:** validate with parseScenario, save by ID, and bind to the current compiled network. A material change must require explicit revalidation before Save/Run; Save cannot silently stamp a stale hypothesis as current.
- **Select:** choose a saved record. If working changes are unsaved, require Save or Discard before replacement. Needs-review records open the revalidation action, not results.
- **Compare with baseline:** show two rows/cards from the same Dataset: empty baseline versus selected Scenario. Include orders at risk, missing units and value at risk; retain per-order evidence. Label previews containing unsaved edits.
- **Restore:** saved records and the working copy travel in the same workspace envelope. Selecting/running restored records always validates against the restored network.

Legacy fixed presets and comparisons continue for the existing demo/import path. Do not generate three arbitrary “recovery” presets as a substitute for user-created scenarios on builder networks.

Duplication, a management screen, separate rename/delete actions, recovery libraries and comparison among multiple saved scenarios are deferred. Users may update a saved record through its normal name/input form; no extra administration UI is required.

## 10. Small scenario revalidation gate

Compute **networkKey** from a deterministic serialization of compiled material inputs: workspace identity/asOf, entity IDs and relationships, stock, BOM quantities, delivery dates/quantities, order product/quantity/date/value, and any alternative data when P1 adds it. Exclude labels, customer display text, SKU, unit, region, informational lead time, positions and viewport.

At each successful compile:

1. Compare every saved/working record's validatedNetworkKey with the new key.
2. A mismatch means Requires review and blocks Run and comparison for that record. Keep every original input unchanged.
3. Show a concise warning: “This network changed. Review the scenario inputs before using them with the updated network; the same receipt ID may now represent different supply.”
4. **Revalidate against current network** is an explicit acknowledgment and calls parseScenario. Display current referenced delivery names/components/dates as available in the existing controls.
5. Success binds the record to the new key. Failure retains its inputs and error; the user edits/removes invalid overrides explicitly.
6. Baseline is always available through an explicit selection. Never silently substitute baseline under another scenario's name.

The same-ID supplier/component retarget is captured by networkKey even when parseScenario alone would accept it. No per-target selective invalidation, automatic pruning/clamping or hidden repair.

On load, validate the stored graph and scenario shapes, recompile, check bindings and run parseScenario before use. Persisted bindings are state, not permission to bypass validation.

## 11. Editing and deletion safeguards

All fields and BOM quantities are editable through the inspector. Selecting an edge opens its meaningful properties.

P0 deletion uses a simple confirmation explaining that connected relationships will be removed and dependent entities may need repair. Detailed dependency trees are deferred.

- Delete the selected node and incident edges only.
- Deleting a supplier can leave components/receipts incomplete.
- Deleting a component removes its stock field and incident BOM/receipt edges; dependent products/receipts remain visible.
- Deleting a product leaves connected orders incomplete.
- Deleting a receipt preserves saved scenario inputs; references to it cannot run after the network changes until explicitly corrected.
- Deleting an order removes its demand.
- Deleting a required edge may make the graph incomplete and blocks Run.

Do not silently delete other business entities, reassign links or clear saved scenario inputs. Keep raw incomplete drafts editable/savable. Without undo/redo, require confirmation for destructive node deletion and guard Delete/Backspace while typing.

P1 defines alternative-scope deletion behavior when that authoring feature is introduced.

## 12. One workspace persistence format and basic source labels

Use one browser-local envelope and the same JSON for export/import:

```ts
type BuilderWorkspaceV1 = {
  format: "dominoos-builder-workspace";
  version: 1;
  document: BuilderDocument;
  scenarios: ScenarioRecord[];
  selectedScenarioId: string | null;  // null can mean baseline/new working record
  workingScenario: ScenarioRecord | null;
  source: {
    origin: "authored" | "fictional";
    openedFromFile: boolean;
  };
};
```

Validate the envelope with Zod. This validation permits safe raw incomplete fields; it does not claim that the network is ready to simulate. Enforce unique IDs, known kinds/version and valid structural values before mounting editor adapters.

- Save the single value to localStorage after a short debounce and via Save workspace. Persist raw graph values, positions and named scenarios.
- Mark Saved locally only after setItem succeeds. Catch quota/security errors, keep live work and the previous stored value, show Changes not saved, and offer JSON export.
- Export the same supported envelope; Import workspace validates a candidate completely before confirmation/replacement.
- Apply a bounded JSON file size, reusing the existing 2 MB single-file convention for this small MVP format. Do not introduce a separate large-file/checkpoint migration system. Reject oversize export/import clearly rather than producing a file that cannot reopen.
- Malformed/unknown-version storage shows an error without crashing startup or silently overwriting the value. The user can explicitly start a new workspace or import a valid file. A full recovery/history UI is deferred.
- New/Open example/Import workspace protects current work with Save/Export/Discard choices. Do not silently merge by labels or IDs.
- Capture workspace/revision while reading a file; do not apply an import preview after the user has changed the active workspace.
- On refresh, restore the envelope, compile again and validate scenarios. Do not persist Dataset snapshots or SimulationResult.

**Source labels stay small and honest.** Blank manual networks say Authored in builder, not “real manufacturing data.” Core examples say Fictional example; editing one retains that qualification. Reopening JSON adds Imported workspace while preserving its declared authored/fictional origin. File labels are self-reported, not authenticity checks.

Preserve the existing provenance helpers and CSV retained-BOM disclosures on the legacy import path unchanged. P0 does not merge legacy tables with builder graphs, so no per-table source-set migration is needed. If future work introduces such a merge, it must introduce adequate mixed-source labeling at that time.

The existing legacy import can remain in-memory as before; distinguish that clearly from locally saved builder workspaces in help/import copy. No data uploads, backend, login, cloud storage or analytics transmission is added.

## 13. Laptop-first editor interface

Reuse the current IBM Plex typography, paper/sheet surfaces, ink rules, red hatching and clear status words. Incomplete is a build state, not a simulated shortage.

- **Top:** Build/Simulate, network name/inventory date, Save workspace status, Validate and Run. New/Open example/Import workspace/Export workspace can use a compact actions menu.
- **Left:** five labelled palette buttons with existing Lucide icons.
- **Center:** draggable controlled nodes, pan/zoom, selectable labelled edges, typed handles and “N per product” BOM labels.
- **Right:** node or edge inspector with required fields, actionable validation, Delete and a small relationship form.
- **Simulate:** existing map/timeline/controls/evidence plus New/Save/Select scenario and Compare with baseline.
- **Laptop:** prioritize 1280×800; ensure inspector and primary actions are reachable. Do not auto-fit after every edit or reset positions when switching workspaces.
- **Narrow screens:** stack/collapse panels, allow scrolling, keep fields/actions reachable and provide the same basic relationship form. A dedicated NetworkList/editor and full touch-optimized parity are P1.
- **Keyboard:** native labels, visible focus, keyboard-usable buttons/fields/relationship selects, error focus and sensible focus recovery after delete. Do not require dragging to create every connection.
- **Accessibility:** status text/icons in addition to color, reduced motion and clear validation/save announcements.

No new theme system, 3D, cinematic graph animation or decorative dashboard is needed. Palette drag/drop and advanced shortcuts are optional.

## 14. Components, files and ownership

| Proposed package/file | Responsibility | Owner |
| --- | --- | --- |
| src/lib/builder/types.ts and schema.ts | Core raw document, minimal ScenarioRecord and workspace schema | A |
| src/lib/builder/connections.ts | Five relationships, canConnect and simple dependency cleanup | A |
| src/lib/builder/compiler.ts | Whole-graph compile, Dataset mappings and networkKey | A |
| src/lib/builder/scenarios.ts | Named-record validation/binding; no history system | A |
| src/lib/builder/state.ts | Shared reducer/actions and compile publication contract | A contract; C integration |
| src/lib/builder/storage.ts | One local envelope and JSON format | C |
| src/components/builder/BuildWorkspace.tsx | Palette/canvas/inspector layout | B |
| src/components/builder/BuilderCanvas.tsx and BuilderNode.tsx | Controlled React Flow adapters and handle interactions | B |
| src/components/builder/PropertiesInspector.tsx | Five entity forms, BOM editor and basic relationship form | B |
| src/components/builder/builder.css | Laptop layout, stacked narrow fallback and paper/ink styling | B |
| src/components/scenarios/NamedScenarios.tsx | New/Save/Select, revalidate and baseline comparison controls | C |
| src/App.tsx | Active input source, Build/Simulate boundary and preserved legacy flows | C alone |
| src/tests/builder-*.test.ts | Mapping/rule/scenario/storage tests | A/C by module |
| tests/builder-journey.spec.ts | Blank creation, named disruption, local restore and JSON journey | C with B support |
| Existing tests/docs/help | Intended navigation/copy changes and regressions | C |

No separate mobile editor, generalized migration layer, target-history module or provenance-version adapter is required for P0. Keep the shared simulation/validation types and algorithms intact. One developer owns App integration and one owns shared domain contracts to avoid conflicting broad edits.

## 15. Implementation sequence and three-developer dependencies

No person-hour figures are used to decide scope or completion.

1. **Isolate implementation.** Once implementation begins, create a feature branch before application edits. Keep the stable submission branch intact until acceptance passes.
2. **Freeze the small contract.** Agree five node kinds, five relationships, raw-field representation, compiler result, ScenarioRecord and the single JSON envelope.
3. **Implement the minimum compiler.** A builds relationship checks, exact Dataset mapping, raw-field errors and a minimal golden test. Deliver this before polishing forms.
4. **Connect a thin real UI.** B supplies add/edit/move and a real canvas connection; C mounts its compiled Dataset in the existing simulator. All three work toward one runnable vertical slice.
5. **Pass Checkpoint 1.** Create the core chain from blank, compile it and produce the correct shortage in the existing engine/evidence panel.
6. **Finish core authoring and named scenarios.** Complete all five inspectors, BOM editing, basic connection form, deletion, New/Save/Select and baseline comparison.
7. **Add minimal save/restore and revalidation.** C integrates local envelope/JSON actions; A provides networkKey/binding rules. No target snapshots or checkpoint persistence.
8. **Pass Checkpoint 2.** Complete the automated named-disruption save/reload journey and a cold user walkthrough.
9. **Stabilize P0.** Run existing/new tests and build, check laptop/narrow accessibility and preserve all legacy demo/import/recovery paths.
10. **Consider P1 only after P0 passes.** Alternative authoring comes first if there is room; do not reopen the architecture or expand the persistence system.
11. **Merge/release only after acceptance and the team's release decision.** If incomplete, keep the branch and submit the existing stable application.

**Parallel work:** A owns domain/compiler/scenario binding and unit proofs. B owns the authoring surface/forms/connections and laptop usability. C integrates continuously into App, owns named controls/storage and browser proof. Contracts precede dependent UI; C should wire the simulator as soon as the minimal compiler is ready, not after the editor looks finished.

Tests land with behavior. Integrate small working increments frequently. Do not build a disconnected canvas against mocked result fixtures.

## 16. Strict checkpoints and submission protection

These are review/deadline timeboxes, not person-hour implementation forecasts. All calendar times are Europe/Vilnius.

### Checkpoint 1 — first 4–6 effective hours of implementation

From blank, create a Supplier, Component, Receipt, Product and Customer Order, enter all required fields, make at least one real canvas connection, compile the complete network and create a correct shortage by delaying the receipt.

A minimal five-node fixture can use stock 1, receipt 1 due before an order for 2, then move the receipt after its due date: required 2, allocated 1, shortage 1. The full motor fixture below remains the final P0 oracle.

**Go:** actual engine results and affected-order evidence match the compiled data. **If failed:** stop every secondary task until the vertical slice works. Do not spend that time on alternatives, mobile optimization, persistence history or appearance.

### Checkpoint 2 — Saturday 14 November, midday (12:00)

A fresh user can build the motor network, create/Save/Select a named disruption, compare with baseline, save the workspace, reload and run the same scenario without assistance. The Playwright journey proves the same sequence from blank.

This gate does **not** require authoring an alternative supplier. It requires named scenarios, local restore, correct shortages and a stable existing demo.

If failed, all work remains on P0 correctness. Alternative authoring and other P1 work do not begin. If P0 cannot stabilize before release, keep it unmerged and submit stable DominoOS.

### Freeze and release

Target feature freeze at 16:00 on 14 November and rehearsal/release checks by 17:30. Submission is 20:00. Keep time for regression failures and an existing-app fallback; do not make a late unstable merge because the editor looks finished.

The implementation stays on its feature branch until acceptance tests pass. Checkpoints guide scope, not an unconditional deadline promise. Deployment requires the team's release instruction; this plan amendment does not deploy or merge anything.

## 17. P0 motor demonstration and exact acceptance oracle

Every business record is entered through user actions in the automated test. The pitch may open an example for speed.

| Input | Value |
| --- | --- |
| Inventory date | 2026-11-13 |
| Supplier | Aster Manufacturing |
| Component | Servo motor, unit motors, initial stock 8 |
| Receipt | 5 motors, available 2026-11-17, connected to Aster and Servo motor |
| Product | Industrial motor unit, SKU IMU-001, BOM 1 × Servo motor |
| Order A | Customer A, 6 units, required 2026-11-20 |
| Order B | Customer B, 4 units, required 2026-11-22 |
| Named scenario | Motor shortage: original receipt delayed to 2026-11-23 |

Supply required schema fields: supplier region/lead time (empty/0 is valid), product SKU, component unit, customer and order value. Explicit test order values can be zero; illustrative prices must be disclosed as demo assumptions.

**Baseline:** A takes 6 stock; B takes 2 stock and 2 receipt. Both covered, no missing units; 3 original receipt motors remain.

**Motor shortage:** A still takes 6 stock; B has 2 stock and lacks 2 motors because the receipt lands after November 22. B is at risk and evidence names the delayed receipt/date. The baseline receipt still says November 17.

**Compare:** baseline and Motor shortage use the same Dataset, displaying 0 versus 1 at-risk order and 0 versus 2 missing material units. Neither scenario changes baseline stock, quantities or dates.

**Restore:** after Save workspace and refresh, select Motor shortage, run it and get the same shortage. JSON export/import of the workspace reproduces the network and saved scenario as well.

**P1 extension only:** explicitly create an alternative supplier with 2 motors on November 18, explicit approval and Industrial motor unit scope; activate it in a recovery scenario. Both orders become covered while the original receipt stays delayed. This can be added after P0 passes and requires its own authoring/eligibility tests.

## 18. Automated and human test plan

| P0 case | Required proof |
| --- | --- |
| Every core node | Reducer identities/raw fields and UI create/edit for all five kinds |
| Valid/invalid connections | Table-driven five-kind mapping; wrong kind/direction, missing endpoint, self-loop/cycle, duplicate and second parent rejected without mutation |
| Missing relationships | Any incomplete current node, missing BOM or receipt/order link blocks the entire compile |
| BOM quantities | Positive count, no duplicate pair or silent summing; editing changes exact demand |
| Counts/dates/money | No blank-to-zero coercion, real ISO/asOf rules, positive BOM/order counts, finite/nonnegative values and safe demand |
| Delete dependencies | Incident-edge cleanup, visible incomplete dependents, saved inputs retained; invalid references cannot run |
| Exact Dataset mapping | Receipt supplier independent of primary supplier; multiple receipts/materials; typed IDs; parseDataset succeeds only for the full valid graph |
| Motor oracle | Baseline allocation versus delayed receipt leaves B short by exactly 2; input immutability |
| Named scenario workflow | New/Save/Select/edit; names/IDs persist; unsaved-switch behavior; baseline comparison uses the same Dataset |
| Scenario review | Material change including same-ID retarget blocks saved scenarios; explicit revalidation; unknown targets fail; no silent clamp/prune |
| Nonmaterial edits | Layout/label changes preserve scenario binding while labels/save state refresh correctly |
| Local and JSON restore | Same envelope round-trip, named/working scenarios and raw graph survive; no cached results/checkpoints required |
| Invalid input safety | Invalid graph blocks Run; malformed/unknown-version workspace rejected transactionally; quota failure leaves live/previous stored work intact |
| Existing app | Keep existing unit suite, build and all legacy judge journeys; intentional navigation/copy assertions updated only as needed |
| Basic accessibility/responsiveness | Keyboard form connection path; focus/error behavior; laptop usable; narrow essential controls reachable |

**Critical Playwright P0 journey:** fresh context → New blank → create the full motor network with visible controls → at least one pointer connection, other relationships through handles/forms → run baseline → New/Save named Motor shortage → inspect B shortage/date/allocation → compare baseline → save workspace → reload/select/run → export/import the same workspace and verify again.

No seeded Dataset, localStorage fixture injection, prebuilt example or test-only state hook may construct the acceptance network. Collect pageerror and require none.

Add a separate browser test for invalid connection/duplicate BOM, missing relationship, deletion and scenario revalidation. A basic narrow layout/form-connection check is P0; duplicating the entire build flow in a dedicated mobile UI is P1.

**P1 tests:** alternative authoring/approval/scope/capacity/date restrictions, recovery with original delay retained, Dataset-to-editor-to-Dataset semantic round-trip including alternatives, and full mobile-editor parity. Existing simulator alternative tests remain part of P0 regression.

Run npm test, npm run build, npm run test:e2e and the existing CI's npm run deploy:check after implementation. Passing those locally is not deployment/hosted CI/human validation.

**Human checks:** one cold laptop walkthrough without assistance, error/deletion clarity, scenario naming/selection/comparison, and refresh recovery. Record observer/help/result honestly. Inspect narrow-screen overflow and keyboard operation. If only developers participate, label it internal validation.

## 19. Main risks and bounded responses

| Risk | Response |
| --- | --- |
| Visual edges compile into the wrong existing business references | Golden mapping assertions and exact allocation evidence before UI polish |
| Stale scenario still parses after receipt retargeting | Whole material-network signature and explicit revalidation, even if parseScenario alone succeeds |
| Partially valid graph produces plausible results | All-or-nothing compile; no omitted records or cached-number fallback |
| Scenario editing mutates baseline | Existing Scenario overlays only; immutability and baseline comparison tests |
| New editor disrupts legacy imports/demo | Explicit input sources, preserved legacy code path and feature-branch isolation |
| Persistence grows into a migration project | One raw workspace format; no validated checkpoints/history/provenance migration |
| Responsive work consumes the milestone | Laptop first, accessible shared connection form, basic narrow layout; optimized mobile deferred |
| P1 displaces usable scenarios | Named disruption/save/select/baseline comparison required before alternatives |
| Deadline pressure causes unstable release | Functional checkpoints, acceptance gate and keep stable submission if builder is unfinished |

The prior three-model effort forecasts are not used. The remaining uncertainty is measured by actual integrated behavior and failures at the checkpoints.

## 20. Completion and approval boundary

Accept P0 when a fresh user can create and connect the five core entity types, edit stock/BOM/receipt/order inputs, compile the full graph, create/Save/Select a named disruption, see and explain the affected order, compare with baseline, return to editing, and save/reopen the workspace locally and through JSON.

Also require invalid networks/scenarios to stay blocked, original hypotheses/baseline to remain unchanged, keyboard-accessible fields/actions, usable laptop/basic narrow layouts and preservation of existing demo/import/recovery/tests.

Alternative authoring, sophisticated review, full mobile parity and import-to-editor migration improve the accepted product later; they do not determine whether P0 ships. Do not claim the original blank-to-recovery milestone when only the smaller P0 is delivered.

Architecture approval is recorded. This amendment applies the requested priority changes and leaves the original debate trace intact. **No application implementation, branch creation, commit, push, merge or deployment is performed by this documentation revision.**

