# DominoOS — Visual Supply Chain Builder Implementation Plan

**Status: proposed; awaiting approval. No application implementation has begun.**

Repository: Tasty-Kiwi/unfair-wknd-26. Inspected baseline: `e4197fc`. Prepared 13 November 2026 after nine completed model reviews. Submission deadline: **14 November 2026, 20:00 Europe/Vilnius (18:00 UTC)**. At 13:40 Vilnius on 13 November, approximately 30 hours 20 minutes remained. Recalculate available hours when implementation is approved; these estimates are not a reservation of developer time.

**Product promise:** a user creates a supply chain on a blank canvas, connects suppliers to materials, products and orders, changes an incoming receipt, and sees exactly which orders lack materials, without uploading a spreadsheet.

**Decision:** add one versioned editable graph document with raw field drafts and explicit typed relationships. Compile it transactionally into the existing validated `Dataset`. Keep `Scenario` overlays separate and use the existing `simulate()` as the only allocation engine. Extend the existing application with Build and Simulate workspaces.

The [genuine three-round debate](BUILDER_DESIGN_DEBATE.md) contains all nine participant responses, exact requested models/providers, task links, corrections and final differences. Architecture selection happened after all three rounds completed.

## 1. Current architecture and reusable parts

| Existing code | Verified behavior | Reuse or focused change |
| --- | --- | --- |
| [types.ts](../src/lib/types.ts) | Dataset contains suppliers, components, products/BOMs, inventory, deliveries, orders and alternatives. Scenario contains delivery overrides and activated alternative uses. SimulationResult contains allocations, shortages, late deliveries and summary metrics. | Keep business interfaces and Scenario semantics. Add editor types in a separate builder module. |
| [validation.ts](../src/lib/validation.ts) | Zod structural validation plus duplicate/reference/date/demand checks; independent parsed copies; real ISO dates; positive whole BOM/order counts; nonnegative stock/supply; finite nonnegative money. Alternatives require nonempty product scope even when unapproved. | Retain existing parser behavior. Expose structured issue paths for editor diagnostics without parsing formatted error strings. |
| [simulation.ts](../src/lib/simulation.ts) | Validates Dataset and Scenario; earliest required date, then code-point order ID; stock before dated supply; shared balances; product-scoped alternatives; partial kits retain reservations. | Reuse unchanged. Do not create graph-based stock logic, scheduling or an optimizer. |
| [receipts.ts](../src/lib/receipts.ts) | Shared date/shift rules, receipt overrides, exposure and tipping points; bounded timeline axes. | Use existing date controls and withReceiptDate. No duplicate date or exposure implementation. |
| [recovery.ts](../src/lib/recovery.ts) | Independent recovery candidates, explicit application, quantity/date/approval constraints enforced through the engine. | Retain and apply only against current validated snapshots. |
| [provenance.ts](../src/lib/provenance.ts) | Current table origins are fictional/imported; partial import yields mixed. One source per table cannot represent authored edits or retained old BOMs. | Extend summaries to conservative table source sets and authored data; retain import disclosures. |
| [SupplyGraph.tsx](../src/components/graph/SupplyGraph.tsx) | Read-only four-kind map, causal status styling, focus/full views, typed selection, separate narrow list view; drag/connect disabled. Receipts live on a timeline rather than as graph nodes. | Keep this Simulate view. Reuse visual tokens/card conventions. Build gets a small editable canvas with receipt/alternative nodes, not a rewrite of the result map. |
| [ReceiptTimeline.tsx](../src/components/graph/ReceiptTimeline.tsx) | Planned versus changed dates, shared quantities and shortage evidence, pointer/keyboard receipt movement. | Preserve in Simulate and keep its changes as Scenario overlays. |
| [ScenarioPanel.tsx](../src/components/scenarios/ScenarioPanel.tsx) | Validates overrides; edits receipt dates/quantities; activates catalog alternatives. It does not create catalog entries. Expensive exposure/tipping calculations exist. | Reuse for current snapshot. Add minimal scenario wrapper/review UI. Do not mount or simulate on Build keystrokes. |
| [App.tsx](../src/App.tsx) | Owns Dataset, provenance, one active Scenario and import previews. Three fixed comparison presets. Synchronous memoized simulation assumes valid references. Imports/reset replace related state; export report includes inputs/scenario/results. No draft persistence. | One workspace reducer and a guarded snapshot boundary. Preserve current default demo and Simulate UI. C owns this integration. |
| [unit tests](../src/tests) and [browser journeys](../tests/judge-journey.spec.ts) | Allocation, validation, receipts, recovery, provenance; 11 browser tests cover disruption, inspection, alternatives, imports, reset, timeline and narrow layout. | Keep all existing coverage. Update only intentionally changed copy/entry navigation and add builder journeys. |

The import boundary is already useful: one full Dataset JSON or up to five CSVs, each limited to 2 MB. CSV headers identify inventory, products, BOM, orders and deliveries. Selected tables replace rows; omitted tables remain. Product imports without BOM retain matching products' old BOMs. Related files validate atomically. Preserve these exact safeguards and the replace/retain preview.

Baseline verification performed during planning: **60 unit tests in 5 files passed; TypeScript/Vite production build passed.** Build emitted existing dependency annotation and bundle-size warnings. No Playwright run, human usability validation, deployment or builder acceptance has been performed.

Important limitations remain visible: lead time/region are metadata, incoming dates mean usable material availability, orders at risk are not predicted lost revenue, and partial kits retain stock. Unit labels do not change the whole-count allocation model.

## 2. Requirements and scope contract

### P0 — must pass before the builder is accepted

- Blank and example start inside the existing app; existing imported plans can be opened for editing.
- Add, select, move, edit and delete suppliers, components, receipts, products, customer orders and narrowly scoped alternative supplies.
- Real desktop canvas connections plus an equivalent list/inspector workflow for narrow screens and keyboard users.
- Explicit initial stock and BOM quantities; typed relationship rules and actionable errors.
- Deterministic whole-document conversion and a validated current-network simulation boundary.
- Change receipt date and quantity, inspect affected orders/material allocations, and apply an explicitly approved product-scoped alternative.
- Browser-local save/restore of valid and incomplete drafts; versioned workspace JSON portability; existing Dataset JSON/CSV import compatibility.
- Preserve scenarios and their original hypotheses after edits, with an explicit review gate; never silently mutate the baseline.
- Keep the existing demo, comparison presets, recovery cards, timeline, report export, disclosures and tests functioning.
- Automated construction from blank must prove the complete motor disruption and recovery journey.

**Narrow alternative creation is promoted from P1 to P0.** The required recovery demonstration cannot otherwise be constructed entirely through user actions.

### P1 — detailed but gated work

Named scenario save/select/rename/delete/edit and chosen-scenario comparison; richer deletion summaries; batch supplier-delay action. These are separate work packages. Basic dependency warnings and fixed preset comparisons are already P0.

The full Phase 6 named-scenario experience is not claimed if P1 is deferred. P0 retains the baseline, three existing illustrative presets, and the persisted active custom scenario. The user can edit the active scenario name, but a named library requires the P1 package.

### P2 — excluded before submission

Auto-layout engines, undo/redo history, advanced shortcuts, multiple factories, multi-level BOMs, AI-generated networks, cloud sync, login, collaboration, ERP integration, purchase automation, supplier qualification workflows, capacity/labor/machine scheduling, production-duration or exact-shipment predictions, and cost/throughput optimization. Do not add these even if the canvas is easy to extend.

## 3. User journeys and workspace behavior

### Start and build

1. First visit retains the existing Simulate demo. A prominent **Build a network** entry offers **Blank network** and **Open example**. The example remains labelled fictional.
2. Blank creates a new workspace identity with no entities, a network name field and inventory date. Do not seed hidden suppliers, products or dummy BOM lines.
3. Palette buttons create a visibly incomplete card and open its inspector. Click-to-add works everywhere; desktop palette drag/drop is a second placement path using React Flow screen-to-canvas coordinates.
4. Enter fields and connect records. A new component requires an explicit stock value, including explicit zero. A new product has an empty BOM until a component connection is created.
5. Connect via handles, or choose relationship/source/target in the inspector/list. Both dispatch the same domain action. BOM connection opens its required quantity field; an initial empty quantity is a visible blocker, not an assumed unit.
6. **Validate network** shows all blocking issues, selects a node/edge when an issue is chosen, and scrolls its field into view.
7. **Run simulation** compiles all visible input and, only on success with at least one order, switches to Simulate with the current network and baseline. It never simulates a valid-looking subset.

### Disrupt, inspect and recover

1. Choose a delivery with its supplier/component context. Supplier selection may filter delivery choices; P0 changes a selected delivery, not an invented supplier-wide engine parameter.
2. Delay its availability or reduce quantity through the existing ScenarioPanel/timeline. The app recalculates the same snapshot with a Scenario overlay; baseline dates and quantities stay unchanged.
3. Select an affected order in the result map or order table. ImpactPanel shows required/allocated/missing quantities, stock and receipt allocations, dates and late-delivery evidence.
4. Return to Build, add an alternative supplier and an Alternative node, connect its supplier/component, enter capacity/date, select approved products and explicitly check approval.
5. Run the updated network. The old disruption now requires review because baseline allocation inputs changed. Review the change summary and retain its original receipt delay explicitly.
6. Activate the approved alternative in a recovery Scenario; the delayed original receipt stays delayed. Existing recovery comparison explains the additional-purchase assumption and unknown costs.
7. Return to Build without losing positions, properties, active Scenario or raw incomplete text.

### Invalid or stale input

Build always remains usable. Invalid text is retained and highlighted. The last validated snapshot is preserved, but any old results are either hidden or behind a read-only banner: **“Draft changed — these results use validated revision N. Fix the draft and run again.”** Do not show editable historical controls as if they apply to the current draft.

No validated snapshot yet means no numeric simulation summary; show a short completion checklist. A structurally valid empty Dataset may be imported/exported, but the builder's meaningful-simulation readiness rule requires at least one customer order.

### Replace or reopen

Save progress locally or export a workspace. Refresh restores the exact draft and scenario records. New/Open example/replace import/reset show what will be replaced and offer export first; never merge a new blank network with a demo invisibly. Opening a different workspace changes workspace identity even when IDs or names match.

## 4. Final node schema

The following is the implementation contract, not application code already added. Raw scalar number/date text is canonical until compilation. Do not keep a second last-valid numeric field beside invalid visible text.

```ts
type NodeKind =
  | "supplier" | "component" | "receipt"
  | "product" | "order" | "alternative";
type NodeKey = string; // derived as kind + ":" + exact immutable domain ID
type Origin = "fictional" | "imported" | "authored";

type EditorNode<K extends NodeKind, F> = {
  kind: K;
  id: string;                         // immutable Dataset ID
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
      customer: string; quantity: string;
      requiredDate: string; value: string;
    }>
  | EditorNode<"alternative", {
      name: string; quantity: string; availableDate: string;
      approved: boolean; approvedProductIds: string[];
    }>;

type BuilderDocument = {
  id: string;                         // workspace/network identity
  name: string;
  asOf: string;
  revision: number;                   // business fields/links, not positions/viewport
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  viewport?: { x: number; y: number; zoom: number };
};
```

- **Do not put supplierId, componentId, productId or bom on node fields.** Those relationships exist only in edges and are derived during compilation.
- Alternative approvedProductIds is stored once as inspector checkboxes. It is the deliberate property/reference exception; no product-scope canvas edges.
- New domain IDs use a kind prefix plus UUID, independent of labels. Imported IDs remain exact. Uniqueness is per kind/table; use typed NodeKeys and never key maps by bare ID. IDs are read-only in MVP. Use existing IDs as subtitles; meaningful names/customer labels remain prominent.
- Names/SKU/customer/unit must satisfy existing nonblank rules. Region can be empty; lead time can visibly default to zero and is labelled informational.
- Counts follow existing whole-number rules. BOM and order quantities are positive; stock, receipts, alternative capacities and overrides may be zero. Money is finite/nonnegative and may be decimal.
- Raw parsing rejects blank/nonfinite/unsafe count inputs before Number conversion can silently coerce them. Valid numeric values imported from existing Dataset must round-trip, including values rendered by JavaScript in exponent form. Test parsing independently; do not replace the existing validator's accepted domain with a narrower accidental text grammar.
- initialStock **null** means a genuinely absent imported inventory row; it remains valid and is disclosed as “No inventory row; simulation assumes 0.” Empty string means an incomplete authored/cleared field and blocks compilation. Explicit "0" emits a zero row. New components start with empty string, never null.
- Dates are real YYYY-MM-DD calendar dates. Supply/order dates are on or after asOf. No automatic lead-time date calculation.
- Alternatives default unapproved with no product selections. Empty scope blocks compilation even when unapproved. An unapproved record with nonempty scope is valid catalog data, but cannot activate.
- Inspector may warn that a selected approved product does not consume the alternative's component. Preserve existing engine semantics; do not silently broaden product scope.

## 5. Final edge schema and connection rules

```ts
type RelationshipKind =
  | "primarySupplier" | "receiptSupplier" | "receiptComponent"
  | "bom" | "orderedProduct"
  | "alternativeSupplier" | "alternativeComponent";

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

| Kind and direction | Required cardinality at compile | Dataset meaning |
| --- | --- | --- |
| primarySupplier: Supplier → Component | Exactly one incoming per component | Component.supplierId; this edge creates no receipt or stock |
| receiptSupplier: Supplier → Receipt | Exactly one incoming per receipt | Delivery.supplierId |
| receiptComponent: Receipt → Component | Exactly one outgoing per receipt; many receipts per component | Delivery.componentId |
| bom: Component → Product | At least one incoming BOM per product; one edge per component/product pair; many-to-many overall | Product.bom with positive required quantity |
| orderedProduct: Product → Order | Exactly one incoming per order; many orders per product | CustomerOrder.productId |
| alternativeSupplier: Supplier → Alternative | Exactly one incoming per alternative | AlternativeSupply.supplierId |
| alternativeComponent: Alternative → Component | Exactly one outgoing per alternative | AlternativeSupply.componentId |

A receipt's supplier may differ from its component's primary supplier. Existing validation permits this; never derive receipt supplier from the primary-supplier edge. Multiple receipts between the same supplier and component are distinct nodes and remain separate deliveries. One product can require many components and one component can serve many products.

Implement **canConnect(document, candidate)** as the single rule function used by React Flow isValidConnection, onConnect, list forms and imports' semantic checking. Check exact endpoint kinds, existence, self-loop, duplicate semantic pair and cardinality before accepting an edge. Reject wrong handle direction and incompatible handle kind. There are no generic free-form edges or Product → Product links. The allowlist is acyclic by construction; a cycle check also protects untrusted workspace imports.

A second primary/receipt supplier or order product is rejected with an actionable explanation. **Replace connection** is an explicit atomic remove/add action. Never let array order decide which parent wins. Duplicate BOM attempts select the existing edge for quantity editing; do not add or sum a second line.

Missing required links are permitted in an editable draft, visibly incomplete, but block the entire compile. Invalid proposed connections are rejected before mutation. These are different states.

## 6. Source of truth, state and simulation synchronization

**Canonical editable authority:** BuilderDocument plus its workspace sidecars (Scenario records and provenance). Relationship edges are authoritative; React Flow nodes/edges are adapters, not a second store. A compiled Dataset is immutable derived input, never independently edited.

### Alternatives considered

| Architecture | Genuine advantage | Cost / reason for decision |
| --- | --- | --- |
| Edit valid Dataset directly, with raw forms and a reducer | Maximum reuse of existing foreign keys/imports; drag can dispatch field updates | Incomplete nodes still require a separate draft representation. It can work without sentinels, but keeping valid committed records and incomplete visible records understandable adds state transitions. |
| FK-backed draft document; derive all canvas edges | Single-valued relationships are naturally constrained; close to existing Dataset | Viable, and Haiku defended it through Round 2. BOM edge editing/deletion must be projected through nested record arrays; visible edges are adapters to nullable draft fields. |
| Explicit-edge raw document; derive Dataset — selected | The editable connection is the stored relationship, including BOM quantity; clear endpoint/cardinality checks and incomplete states | Adds a deterministic conversion boundary and mapping tests. Node payloads must omit the corresponding FKs; otherwise this becomes two sources of truth. |
| Independently editable graph plus Dataset | None needed for this feature | Rejected: ambiguous conflict resolution and stale simulation inputs. |

The selected design follows the requested graph-document direction after an actual challenge, rather than assuming direct Dataset editing cannot support a canvas. No second stock engine or backend is needed in any accepted option.

Use React useReducer and a small context/hook in App; do not add Redux/Zustand or a second state framework for this scope.

```ts
type SourceSets = Record<DatasetTable, Origin[]>; // sorted, unique JSON arrays
type ValidatedSnapshot = {
  workspaceId: string;
  sourceRevision: number;
  dataset: Dataset;
  sourceSets: SourceSets;
  allocationFingerprint: string;
};

type WorkspaceState = {
  document: BuilderDocument;
  sourceSets: SourceSets;
  scenarios: ScenarioRecord[];
  activeScenarioId: string;
  mode: "build" | "simulate";
  lastSuccessful?: ValidatedSnapshot; // immutable derivative, never user-editable
};
```

UI selection, hover and current validation diagnostics are transient. Raw field values are in document and must persist. Position/viewport updates do not trigger allocation or scenario review.

**Compile/Run transaction:** capture workspace/revision → compile → derive fingerprint → assess Scenario records → validate chosen Scenario → calculate result(s) → publish snapshot/result/mode together. If any step fails, show structured diagnostics and retain current draft and previous valid snapshot unchanged. Build keystrokes must not call simulate, receiptExposure, tippingPoints or comparison functions.

Any business-field or relationship edit marks compiled results as not current immediately. Validating or entering Simulate recompiles the current revision. A name/SKU/region/unit/lead-time edit may reuse allocation results after successful compilation when its allocation fingerprint is unchanged; render labels from the newly compiled Dataset. It must not mark saved hypotheses stale. Canvas position/pan/zoom requires no compile or business revision increment, but still participates in local save/dirty tracking through a separate transient save counter.

A result is keyed by **workspace ID + allocation fingerprint + canonical Scenario inputs**; never reuse by name, selected node, or scenario ID alone. A replacement network with identical business IDs cannot inherit another network's cached results or Scenarios.

Move render-time simulate calls behind this boundary and a defensive error state. Never catch an engine error and substitute zero shortages. ScenarioPanel/ImpactPanel form state must reset on workspace/snapshot identity and selected Scenario identity, not data.name. The actual current key is in App.tsx:598.

The lastSuccessful Dataset may be persisted as a read-only checkpoint in the workspace envelope to preserve validated data while the draft is incomplete. On restore, re-parse this untrusted checkpoint, verify its workspace identity/fingerprint, and recompute results; never trust stored results. This checkpoint is history, not a second editable business source.

## 7. Deterministic conversion and validation

Required APIs:

```ts
type BuilderIssue = {
  code: string;
  nodeKey?: NodeKey;
  edgeId?: string;
  field?: string;
  message: string;
};

function datasetToGraph(data: Dataset, workspaceId: string): BuilderDocument;
function compileGraph(doc: BuilderDocument):
  | { ok: true; dataset: Dataset; canSimulate: boolean;
      allocationFingerprint: string }
  | { ok: false; issues: BuilderIssue[] };
```

### Dataset → document

1. Call parseDataset on external Dataset input.
2. Create one node per supplier/component/delivery/product/order/alternative, preserving exact IDs, all business fields and imported absent inventory.
3. Create the seven relationship kinds from foreign keys and BOM lines; alternatives' scope stays a node property.
4. Use deterministic initial columns/rows, not an auto-layout dependency. These positions are only a starting point and become editable.
5. Re-compiling must preserve business meaning. CSV table imports also go through this adapter after their existing atomic validation.

### Document → Dataset

1. Validate envelope/node/edge shape, typed IDs and endpoint references; validate all raw fields and every required relationship. Report every blocker with a source node/edge/field. Do not omit disconnected or invalid records.
2. Build stable node indexes. Sort arrays and BOM lines with the same code-point comparator convention used by the engine; never locale-dependent ordering for canonical fingerprints.
3. Emit suppliers/components/products/orders, deliveries and alternatives by mapping the table above. Produce inventory rows only when stock is not null.
4. Build a path/source map as arrays are emitted so Dataset issue paths, such as products[2].bom[1].quantity, identify the correct BOM edge and inspector field.
5. Call the existing Dataset validation boundary. Publish only on full success.
6. Return canSimulate = orders.length > 0. Existing valid empty Datasets remain valid inputs, without showing “all orders covered” as a meaningful builder success.

Refactor validation.ts narrowly to expose an **inspectDataset(input)** result with path-addressed Zod and semantic issues. parseDataset keeps its existing throwing API, messages, capped reporting and independent parsed-copy behavior by formatting the same results. Expose equivalent Scenario diagnostics if needed. Do not regex-parse human error messages or duplicate stock allocation. Existing semantic/reference validation remains authoritative.

Validation layers: workspace shape accepts raw incomplete strings; graph semantics checks links/cardinality; shared Dataset validation checks the engine contract. A structurally malformed file is rejected transactionally. A structurally safe but business-incomplete workspace can be reopened **as a draft**, with Run blocked and errors shown.

Round-trip oracle: normalize table/BOM/approved-product ordering, then compare all fields, exact IDs/references, absent versus explicit-zero inventory and baseline/scenario simulation outcomes. Byte-for-byte JSON equality is not required because deterministic ordering may differ from imported array order. No node/entity may disappear.

## 8. Scenarios, disruption and named-library extension

Keep Scenario unchanged. It always contains only deliveryOverrides and activated alternatives on top of the baseline Dataset.

```ts
type ScenarioRecord = {
  scenario: Scenario;
  boundFingerprint: string;
  targetSnapshots: {
    // Only referenced delivery/alternative business fields needed for review.
    deliveries: Delivery[];
    alternatives: AlternativeSupply[];
  };
  status: "ready" | "needsReview";     // re-derived on restore/compile
};
```

Baseline is an immutable empty Scenario. Editing a preset creates/updates the active custom Scenario; never overwrite the baseline or immutable example presets. Preserve original fixture presets for the fictional demo. Generated presets for arbitrary networks remain explicitly illustrative: a six-day delay or a recovery catalog entry does not guarantee an impacted or recovered order.

**Allocation fingerprint:** deterministic serialization of asOf, IDs/references, stock, BOM quantities, delivery quantities/dates, order product/quantity/date/value and alternative supplier/component/capacity/date/approval/scope. Include identity of suppliers/components/products/orders even when otherwise unused. Exclude names, customer display text, SKU, unit, region, lead time, positions, viewport, network display name and Scenario labels. Use canonical serialization or a stable hash of it; do not add a crypto service.

At a successful compile with changed allocation inputs, every persisted nonbaseline Scenario becomes needsReview unless already explicitly bound to that fingerprint. Keep its original inputs and targetSnapshots. No automatic clamp, pruning, date adjustment or silent reset.

Review shows general allocation changes and before/after referenced targets. **Same ID pointing to a different supplier/component is a semantic change even when parseScenario accepts it.** User must acknowledge the changed target, or remove/edit that entry. Deleted/unapproved targets or violated catalog bounds block activation until explicitly repaired. A nonempty changed product scope may simply change eligibility rather than throw; still show it for review.

**Revalidate and use** runs parseScenario against the new Dataset, requires explicit acknowledgment of changed target meaning, and on success updates the binding/snapshots. If invalid, retain the Scenario with its original hypothesis and actionable issues. Provide **Use baseline** as an explicit alternative; do not silently fall back and display baseline results under the old Scenario name.

After edits within an already-current active Scenario, validate normally and recompute. Applying RecoveryComparison creates/updates a scenario through this same path. Date overrides preserve the planned baseline quantity unless the user changes it; quantity overrides are explicit. No new supplier-outage field is added.

### P1 named scenarios — implementation-ready extension, 5–8 person-hours

The persisted ScenarioRecord[] store is already the foundation. Add Save as, select, rename and delete, with stable UUID-backed Scenario IDs. Nonblank names are labels only. Selecting a needsReview record opens review rather than running it. On editing a named record, keep its ID; on Save as, copy overlays and generate a new ID. Baseline cannot be edited/deleted.

Example flow: **Baseline** → save receipt delay as **Motor shortage** → duplicate, activate alternative and save as **Alternative supply**. Every record remains bound to the same network revision before comparison. Choosing a record from another workspace is impossible by workspace identity.

Extend the existing comparison table to baseline plus up to two selected saved Scenarios; all use exactly the same current Dataset. Invalid/review records display that state, never fabricated zero metrics. Retain the existing three preset comparisons. Compute only when Simulate/comparison is active. P1 tests: save/edit/rename/select/delete, refresh/export restore, baseline unchanged, stale scenario blocked, and the three motor scenario results compared on one fingerprint.

Optional supplier-wide delay is another 1–2 hours: create ordinary overrides for all selected supplier deliveries using shared UTC day helpers, validate atomically, and show exactly which receipts change. It is not required for the selected-delivery P0 demonstration.

## 9. Deletion and dependency handling

P0 uses one concise confirmation showing the selected entity, incident connections, affected BOM/scope relationships and referenced Scenarios.

- Delete only the selected node and its incident edges. Other entities stay visible.
- Deleting a supplier leaves its components/receipts/alternatives incomplete until relinked or removed.
- Deleting a component removes its inventory field with the node and incident BOM/delivery links. Products/receipts/alternatives remain visibly incomplete.
- Deleting a product removes its incident BOM/order connections and removes its ID from alternative scope lists as an explicitly previewed change. An alternative with empty scope becomes visibly invalid; do not silently delete the alternative or approve another product.
- Deleting a receipt/alternative preserves referencing Scenarios unchanged in needsReview; the review flow requires explicit removal/editing of dangling entries.
- Deleting an order removes that demand. Deleting a connection may make either side incomplete.
- No recursive hidden entity cascade, automatic scenario repair, or implicit reassignment.
- Whole-graph compilation is blocked until all remaining required relationships are repaired. The previous valid snapshot remains intact.

This permits useful draft repair without pretending deletion preserved a valid plan. Rich dependency trees and bulk repair are P1.

## 10. Interface and visual direction

Keep the existing IBM Plex typography, cool paper/sheet surfaces, ink rules, hatched shortage red and dashed alternative blue. Incomplete is a separately labelled build state, not a shortage prediction. Use icons plus readable text, not color alone.

- **Top:** Build/Simulate toggle, network name/inventory date, local save state, primary Run simulation. New, Open example, Import, Export workspace and Export Dataset can live in a compact actions menu. Validate opens the issue list; Run repeats validation.
- **Left:** labelled palette with supplier, component, delivery, product, customer order and alternative. Use existing Lucide assets and shared receipt/alternative visual primitives.
- **Center:** pan/zoom, controlled node dragging, typed handle IDs, selected nodes/edges, labelled relationships, BOM “N per product” text and incomplete badges. Do not auto-fit on every keystroke or reset user positions when switching workspaces.
- **Right:** one inspector for node fields or edge quantity. Required fields and errors sit together. Relationships can also be changed through typed selectors calling the same mutations.
- **Laptop:** at about 1280×800 use a roughly 180–200 px palette, flexible canvas and 290–320 px inspector. Keep tools reachable without covering Run. Inspector scrolls independently.
- **Below about 1050 px:** palette becomes a compact Add menu and inspector a drawer.
- **At the existing 720 px narrow breakpoint:** use a node/relationship list with Add, select/edit and Connect source/type/target. No tiny handles required; optional canvas view is secondary. On 390 px, fields, issue list, confirmation and top actions must fit and remain scrollable.
- **Accessibility:** native labels, meaningful button names, visible focus, keyboard list connections/deletion, aria-live validation/save messages, focus recovery after delete, reduced-motion support. Guard text-field Delete/Backspace so typing does not remove nodes.

A sparse drafting-board canvas with visible material quantities and dates is enough visual distinction. Do not add 3D, cinematic edge animation, a new theme system or decorative dashboards.

## 11. Persistence, import/export and migration

No backend, upload endpoint, analytics transmission, login or external data service is introduced.

Use localStorage for one active workspace envelope. This is enough for the bounded MVP and avoids an IndexedDB migration/transaction layer. Debounce writes around 500 ms, flush at explicit Save and before app-controlled replacement/navigation, and update **Saving / Saved locally / Changes not saved** only after the actual write result. Raw invalid values and Scenario records are included.

```ts
type WorkspaceEnvelope = {
  format: "dominoos-workspace";
  version: 1;
  savedAt: string;
  state: WorkspaceState;  // lastSuccessful optional; no result caches/functions
};
```

Serialize source sets as sorted unique arrays, not JavaScript Set objects. Store one JSON value so a failed write cannot partially replace the previous saved envelope. Catch quota/security failures; preserve live work and the old saved value, show unsaved state, and offer workspace export. Browser-local is not a cloud backup.

Use a bounded local save budget (initial target: 2 MB of serialized UTF-16 data), verify against the full envelope including checkpoint/scenarios, and test boundary behavior. Do not reject an existing supported Dataset/CSV import merely because its expanded workspace exceeds local quota; keep it usable in memory with a clear “not saved locally” status and portable export. Large-network performance and multi-tab editing are not promised.

Versioned workspace files may use a separate explicit larger bound (initial target: 10 MB, matching the existing maximum CSV bundle size). Export must check that a file can be reopened within that bound and disclose any checkpoint-excluded export before download; never produce an unimportable file silently. Preserve active data if the limit is exceeded.

Startup parses the version and structural schema before mounting editor adapters. Revalidate any checkpoint and Scenario bindings; recompute results. A structurally invalid/unknown-version saved value cannot crash startup or overwrite itself with the demo automatically. Offer recovery/export of the raw value and an explicit discard action. A safe incomplete draft restores with issues and Run disabled.

### Distinguish three file formats

1. **Workspace JSON:** format discriminator and version, raw draft, positions, Scenario records, source sets and optional validated checkpoint. Safe incomplete business drafts are accepted after a preview as drafts. Structurally malformed or unsupported versions are rejected. A bad checkpoint rejects the candidate or is explicitly discarded in the preview; do not trust it.
2. **Legacy Dataset JSON:** no workspace discriminator; parse through existing parseImportBundle/parseDataset, create a new document and provenance, then commit on confirmation.
3. **Legacy CSV bundle:** retain the current replace/retain behavior and file limits; apply to a captured current valid Dataset through parseImportBundle. Do not silently use an older snapshot when the current graph is invalid. Ask the user to repair/revert/export the draft before partial CSV replacement; full JSON/workspace replacement remains available.

An import preview includes replaced tables, retained tables/BOMs, source origins, node/order counts and scenarios that will be replaced or require review. Capture workspace ID/revision when file reads begin; if it changed before confirmation, invalidate the preview and re-validate rather than overwriting newer edits. Full imports do not merge graphs by label or ID.

Reset demo keeps its existing behavior but protects authored/restored data with confirmation and an export action. Keep the report export distinct from editable-workspace export; an existing report is not silently treated as a Dataset. Update App import/help/reset copy and README: the current “not saved between sessions” promise will become inaccurate.

## 12. Provenance without silent fictional/real mixing

Retain the existing provenance system's user-visible purpose and compatibility, but replace its single-source summary assumption with a workspace **per-table source set**. It records conservative table history, not row-level certified origin.

- Blank authored workspace: source sets start authored.
- Open fictional example: fictional.
- Edit/add/delete a record or relationship: union authored into every touched table. Component stock touches inventory; BOM edits touch products; approved scope edits touch alternatives.
- Dragging/repositioning alone changes no origin.
- Full table CSV replacement: imported for replaced data; omitted tables retain source sets.
- Products CSV without BOM replacement: union imported with previous product sources because retained BOMs may be fictional/authored/imported.
- BOM-only replacement retains product names/SKU, so union imported with previous product sources too. Products plus BOM replacement together may replace the product source set with imported.
- Full Dataset JSON: locally imported, which describes how data entered this browser, not proof it is real. Clearly say the file's original authenticity is unknown.
- Versioned workspace import preserves its source sets with the qualification that metadata is self-reported.
- Summaries show Authored in builder, Fictional example, Imported file, or Mixed sources with the contributing labels/table details. Never erase fictional/imported history after one edit or label all authored data fictional through the current kindFor fall-through.
- Retain and export retained-BOM disclosures. Existing DatasetProvenance exports remain readable; add source-set detail/version deliberately and keep previous fictional/imported summaries/tests valid for old cases.

For compatibility, retain the existing DatasetProvenance helpers for legacy fictional/imported flows and tests. Add a versioned SourceSetProvenance summary derived from SourceSets for builder UI/report detail. A legacy provenance object upgrades by wrapping each table's old string in a one-element array. Never project a mixed-source table back into a single-source legacy enum as though that projection were accurate. Existing report fields may retain their legacy meaning where representable; richer workspace/report provenance carries an explicit version and sourceSets, and builder labels always use the richer summary. Do not persist two independently writable provenance objects.

Do not implement per-field or per-row forensic lineage before submission.

## 13. Proposed components and file ownership

| File/package | Responsibility | Owner |
| --- | --- | --- |
| src/lib/builder/types.ts, schema.ts | Raw document, envelope, issue and ScenarioRecord contracts | A |
| src/lib/builder/connections.ts | Allowlist, canConnect, dependency analysis, atomic replace/delete | A |
| src/lib/builder/compiler.ts | datasetToGraph, compileGraph, source-path mapping, fingerprint | A |
| src/lib/builder/scenarios.ts | Scenario bindings, target snapshots, review/revalidation | A |
| src/lib/builder/state.ts | Reducer actions, compile/snapshot transition contract | A defines; C integrates |
| src/lib/builder/storage.ts | Versioned local save/load and workspace file parsing | C |
| src/lib/validation.ts | Structured diagnostics while keeping existing parser contracts | A alone |
| src/lib/provenance.ts and types.ts | Source-set summaries/adapters; no engine changes | A alone |
| src/components/builder/BuildWorkspace.tsx | Palette/canvas/inspector/issue layout | B |
| src/components/builder/BuilderCanvas.tsx, BuilderNode.tsx | React Flow adapters and handle behavior | B |
| src/components/builder/PropertiesInspector.tsx | Shared entity fields and BOM quantity editor | B; C may own alternative field fragment by agreement |
| src/components/builder/NetworkList.tsx | Narrow/keyboard creation and connection UI | B with C integration support |
| src/components/builder/WorkspaceActions.tsx, builder.css | Save/import/export actions and responsive styling | C actions; B styles |
| src/components/scenarios/ScenarioReview.tsx | Explicit hypothesis review and errors | C |
| src/App.tsx | Single owner of Build/Simulate integration and legacy import/reset/report paths | C alone |
| Existing graph/scenario components | Keep result map/timeline; only identity/gating integration changes | C |
| src/tests/builder-*.test.ts | Mapping, rule, transaction, persistence and scenario tests | A/C split by module |
| tests/builder-journey.spec.ts | Blank-to-engine and restore/narrow journeys | C, assisted by B |
| tests/judge-journey.spec.ts, README.md | Existing behavior/copy updates and regression check | C |

Prefer a small shared receipt/alternative form fragment, not a generic schema-driven form framework. Keep the existing App Simulate markup intact where possible; extract a SimulationWorkspace wrapper only if it makes the gate clear. No new routing or backend dependency is required.

## 14. Numbered implementation sequence, dependencies and effort

Estimates include focused implementation and meaningful verification. They are planning estimates, not measured productivity. **P0 plus contingency: 48–60 person-hours. P1 named scenarios/comparison: an additional 5–8.**

| # | Work package and concrete output | Depends on | Person-hours |
| --- | --- | --- | --- |
| 1 | Freeze types, actions, issue shape, typed handles and ownership; write one golden mapping fixture after approval | Approval | 2 |
| 2 | Raw schemas, connections, deterministic compiler/adapter, structured Dataset diagnostics and mapping tests | 1 | 7–9 |
| 3 | Minimal palette, node movement/selection, five basic inspectors and real handle connections; wire shared actions | 1; use 2 as it lands | 8–10 |
| 4 | Integrate guarded snapshot with existing ScenarioPanel/ImpactPanel/map; prove actual delayed receipt changes order evidence | 2 + minimal 3 | 4–5 |
| 5 | Distinct alternative authoring, approval/scope UI and recovery path | 2–4 | 3–4 |
| 6 | Scenario fingerprint/review, deletion confirmation and incomplete-dependency handling | 2–5 | 4–5 |
| 7 | Local envelope/restore, legacy import adapters, workspace export, checkpoint handling and provenance disclosures | 2; integrates 4/6 | 6–7 |
| 8 | Narrow/list parity, laptop layout and accessible field/error behavior | 3; shared 2 rules | 3–4 |
| 9 | Full blank journey, persistence/import/scenario regressions, all existing tests/build, human walkthrough and rehearsal | Incrementally from 3; final 4–8 | 6–7 |
| 10 | Integration/conflict/failure contingency | All | 5–7 |
| | **Total** | | **48–60** |

No package waits for a polished canvas. Deliver the minimum parts of 2/3/4 into one running app during the first 4–6 effective hours, then complete breadth. Tests land with the owning behavior rather than all at the end.

### Three-developer work split

- **Developer A — domain authority:** types/diagnostics, compiler, relationship rules, deletion analysis, fingerprint/review helpers, provenance adapter and golden tests. Deliver the minimal compile path early. Roughly 14–18 focused hours before shared contingency.
- **Developer B — authoring surface:** canvas, palette, raw inspectors, typed handles, BOM edge editing, shared receipt/alternative UI, narrow list and visual/accessibility pass. Roughly 15–19 hours; this is a likely bottleneck. C should take a discrete form fragment or list integration rather than both editing the same canvas file.
- **Developer C — continuous integration:** App boundary from the start, current Scenario controls/evidence, storage/import/export, review UI, Playwright and legacy regression/copy. Roughly 14–16 hours before shared contingency.

These ranges total the 43–53 implementation/verification hours, with 5–7 shared contingency added above. They assume familiarity with React/TypeScript and immediate agreement on contracts. Do not count wall-clock overlap as free person-hours.

Parallelism starts after package 1. A owns domain/shared validation files; B owns builder views/styles; C owns App/import/report paths. Agree compileGraph and reducer shapes before splitting. Integrate at least every two effective hours. Do not fork a long-lived editor mock that simulates against fixtures.

## 15. Stop/go checkpoints and delivery calendar

All times below are Europe/Vilnius and assume implementation approval during the afternoon of 13 November. Shift start-relative targets when approval arrives, but keep the submission freeze. Recalculate whether enough focused capacity remains after sleep, meals and integration.

**Gate 0 — within 60–90 minutes:** one contract, shared actions and compile result interface. Existing demo still works. If this is unresolved, stop adding UI and resolve the canonical model.

**Gate 1 — within 4–6 effective hours, target about 19:30 on 13 November:** actual blank UI creation → typed connection → validated Dataset → receipt delay → affected order evidence. For the motor network, order B must show shortage 2 and receipt November 23. At least one edge must be dragged in the actual canvas; the rest may use the equivalent connection form for speed. Show the generated IDs/data mapping and result, not a mocked summary.

Go only if compiler mappings are covered and the engine/evidence path is real. If missed, freeze styling/P1 and use a maximum two-hour repair window. If it still fails or core forecast exceeds available capacity, stop integrating the builder into the submission and preserve the current working app. A forms-only editor can be retained as an explicitly incomplete prototype; it is not accepted as this feature.

**Gate 2 — target by 12:00 on 14 November:** automated Playwright construction from blank → disruption shortage 2 → explicit approved alternative recovery → local refresh restore, plus invalid-draft blocking and narrow connection proof. P0 canvas and restore cannot be dropped. If failed, no P1 work starts; all developers focus on the required path and protecting the existing app.

**Gate 3 — feature freeze 16:00 on 14 November:** all existing and new required automated checks pass. Run a cold laptop walkthrough, a 390 px narrow check and the actual pitch route. If there is no outside participant, label the developer walkthrough as internal; do not claim human/customer validation.

**Release verification — 17:30:** build, existing CI checks/dry run, approved deployment procedure if requested, fresh-browser rehearsal and local fallback ready. Only critical fixes until the 20:00 submission. Deployment is not authorized by approval of this planning document.

P1 starts only if Gate 2 is green and there are at least 5–8 genuinely spare person-hours after reserving regression/rehearsal time. Otherwise defer it explicitly.

## 16. Minimum demonstration and exact oracle

All records below are created by UI actions, compiled and run through simulate. The live pitch may load an example, but automation must start blank.

| Input | Value |
| --- | --- |
| Inventory date | 2026-11-13 |
| Primary supplier | Aster Manufacturing |
| Component | Servo motor; unit motors; initial stock 8 |
| Receipt | Quantity 5, available 2026-11-17; connected to Aster and Servo motor |
| Product | Industrial motor unit; SKU IMU-001; BOM 1 × Servo motor |
| Order A | Customer A; 6 units; required 2026-11-20 |
| Order B | Customer B; 4 units; required 2026-11-22 |
| Alternative | A second explicitly created supplier; capacity 2; available 2026-11-18; approved only for Industrial motor unit |

For complete schema input, enter supplier region/lead time (empty/0 is permitted), product SKU, component unit, customer and order value. Test values may be explicit 0 for both order values; if using illustrative prices, disclose them as test/demo assumptions. Values do not change the quantity oracle.

1. Baseline: order A allocates 6 stock; order B allocates 2 stock + 2 original receipt. Both covered; missingUnits 0. The remaining original receipt is 3.
2. Delay original receipt to November 23: order A still gets 6 stock; B gets only 2 stock, shortage 2, at-risk. Evidence identifies the original receipt now after November 22. Baseline receipt date stays November 17.
3. Create alternative in Build; explicitly review the retained disruption against the updated catalog. Baseline does not activate the new catalog supply.
4. Activate 2 alternative motors on November 18 while retaining the delayed original receipt: B gets 2 stock + 2 alternative, both covered; missingUnits 0. The alternative is consumed once.
5. If the alternative is unapproved, activation is rejected. If approved for another product only, it cannot cover Industrial motor unit; engine may return a shortage rather than a parser error.

The same compiled business data must yield the same results as a direct minimal Dataset oracle; the UI test itself may not inject that Dataset.

## 17. Automated test strategy and acceptance matrix

Keep pure tests in Vitest and critical user journeys in Playwright. Do not use screenshot assertions as a substitute for allocation evidence.

| Required case | Unit/integration proof | Browser proof |
| --- | --- | --- |
| 1. Every node type | Reducer generates stable unique typed identity and raw fields for all six kinds | Add/select/edit each kind in blank journey or compact authoring test |
| 2. Valid node pairs | Table-driven seven-kind mappings/cardinality | At least one real pointer connection; remaining inspector/list connections |
| 3. Invalid connections | Wrong kind/direction, self-loop, cycles, missing endpoints, second parent; rejected action leaves document unchanged | Attempt Product → Supplier; explanatory feedback and no new edge |
| 4. Required relationships | Missing primary supplier/receipt endpoint/order product/BOM/alternative scope blocks whole compile | Disconnected receipt blocks Run and selects its issue |
| 5. Duplicate BOM | Reject same component/product pair; no double demand or silent merge | Duplicate attempt opens/selects existing quantity editor |
| 6. Quantities/dates | Whole-number/positive/zero, decimal money, blank/invalid/nonfinite text, real date/asOf rules, safe demand | Edit quantity/date; invalid text blocks current Run and survives refresh |
| 7. Delete dependencies | Incident-edge cleanup, remaining orphan issues, product-scope change, unchanged saved hypotheses | Confirm delete, see dependencies/incomplete state and repair or remove |
| 8. Compile valid Dataset | Exact foreign keys/BOM/stock/receipts from golden document; call parseDataset | Export Dataset generated from authored network and inspect relationships |
| 9. Semantic round-trip | Demo, import fixtures, reordered arrays, same bare IDs across kinds, absent vs zero inventory, multiple receipts/components/alternatives | Open/import existing plan, edit and re-run without unintended business change |
| 10. Motor shortage | Baseline allocation; late scenario B shortage 2; input immutability | Entire network created via UI from blank, delay receipt, inspect B evidence |
| 11. Approved alternative | Capacity/date/product restrictions and conservation | Author/approve/scope alternative then activate recovery; original receipt remains delayed |
| 12. Unapproved alternative | Valid catalog entry; parseScenario rejects activation | Unapproved cannot activate; no fake coverage |
| 13. Save/reopen | Envelope round-trip; debounced write; quota/security failure; checkpoint validation | Wait for Saved locally, reload exact draft/scenario, export/import workspace |
| 14. Scenario integrity | Allocation fingerprint excludes metadata/layout and includes retarget/BOM/order/value/stock/approval/caps; no silent rewrite | Retarget same-ID receipt, review before activation; baseline and saved inputs preserved |
| 15. Invalid draft safety | All-or-nothing compilation; malformed/version mismatch rejected; previous snapshot/import untouched | Clear raw BOM/stock, reload, see exact incomplete field and stale banner; failed import keeps draft/checkpoint |
| 16. Existing behavior | All 60 baseline tests plus new cases; parser error contracts | All 11 judge journeys preserved with intentional copy updates |

Additional high-value fixtures: a receipt supplied by B while component primary is A; component and supplier sharing the same bare ID; one product with two materials; multiple products sharing one alternative; ties on date; approvedProductIds containing another valid but ineligible product. These expose plausible incorrect data that still passes structural validation.

**Critical Playwright journey:** start fresh context, navigate New blank, create every business record through visible controls, connect/edit BOM, Run baseline, delay selected receipt, assert stock allocation and shortage/date evidence, return Build and author alternative, review retained scenario, activate recovery, assert covered and delayed original receipt, save/reload. No addInitScript seed, localStorage fixture injection, prebuilt example or direct Dataset hook may construct this acceptance network.

Use accessible locators and explicit node/handle data attributes. Pointer-drag proof should be bounded by current element geometry, not fixed screen pixels. Narrow journey uses NetworkList. Collect pageerror and assert none.

Regression command set after implementation: npm test; npm run build; npm run test:e2e; npm run deploy:check as the existing CI requires. Use installed Playwright Chromium. These are future acceptance checks; only the baseline unit/build runs described above have happened.

## 18. Human checks, performance and integration risks

Human checks are distinct from automated proof: cold build workflow, interpreting missing-field guidance, safe deletion, lossless return to Build, paper/ink legibility, focus and touch usability on a real phone if available. Record observer, task, assistance and result. Do not invent usability outcomes.

Performance scope is the small-manufacturer/demo network. Measure representative 50-node/100-edge Build interactions on the developers' actual laptop and report hardware/browser. Dragging and typing must not call simulate; validation should not freeze input. Do not claim an unmeasured enterprise graph size or latency. Keep automatic placement simple; no performance rewrite of the allocator.

| Risk | Consequence | Mitigation / decision |
| --- | --- | --- |
| Wrong relationship mapping still validates | Plausible false coverage or supplier attribution | Golden Dataset assertions, B-supplier receipt fixture, typed keys, single edge authority |
| Render-time stale Scenario | React crash or misleading scenario result | Guarded compile/parse/run transaction and explicit review; never run needsReview records |
| Raw draft versus old parsed value | Invalid visible graph yields valid-looking simulation | One canonical raw document; all-or-nothing compile |
| Lossy import/provenance migration | Imported BOM/stock/history silently changes | Semantic round-trip, explicit absent inventory, replace/retain preview, origin union rules |
| Storage quota or malformed envelope | Lost work or startup failure | Catch failures, retain old value/live draft, raw recovery/export, bounded size |
| Shared App/validator edits | Integration stalls near deadline | A owns validation/domain; C owns App; contract first, frequent merges |
| React Flow and list divergence | Narrow users cannot construct the accepted graph | Same canConnect/reducer; two browser paths |
| Scope larger than focused capacity | New feature endangers working submission | Gate 1 repair limit, P1 cut, freeze and keep existing app if P0 is not ready |

## 19. Final review decisions and remaining uncertainty

The final independently revised proposals converge on explicit edges, canonical raw drafts, whole-graph compilation, distinct alternatives with checkbox scope, whole-network scenario review and conservative table source sets. Earlier FK/per-target/per-row disagreements are recorded as history; they are not falsely presented as current votes after all three revisions.

Remaining differences were substantive:

- Gemini and Haiku judge a tightly cut P0 conditionally feasible at about 48–50 hours. Luna estimates 52–60 and declines a comfortable commitment. This plan uses **48–60 including contingency**, not a guaranteed finish or a statistically measured success probability.
- Gate 1 proves disruption evidence; full alternative recovery follows in Gate 2, despite suggestions to put recovery into the first slice.
- This plan allows recoverable incomplete drafts after deletion instead of recursively deleting dependent entities or blocking every delete until a valid replacement exists.
- This plan does not automatically switch an invalid Scenario to baseline. The user chooses baseline or repairs/revalidates the preserved hypothesis.
- Named library/comparison remains a 5–8-hour P1 package. If deferred, the team must not claim the full named-scenario requirement shipped.
- Source sets describe conservative table history. Row-level original-data attribution and authenticity remain outside scope.

Final code-level corrections and every actual model output are in the debate record. The architecture was selected by the coordinator after discussion; no fictitious consensus or unrun model contribution is included.

## 20. Completion criteria and approval boundary

Accept P0 only when a fresh user can construct the motor chain from blank, connect via canvas/list, enter stock/BOM, compile the entire graph, delay a receipt, inspect the exact affected-order evidence, author and activate an explicitly approved alternative, return to editing, save/restore, and export/reopen without corrupting the baseline or Scenarios.

Also require all graph-to-Dataset mappings, invalid/draft/import/identity safeguards, the existing regression suite, production build and critical desktop/narrow browser journeys to pass. Human visual/usability results must be documented honestly, including any remaining gap.

If named scenario CRUD/comparison is implemented, accept it only against its separate P1 tests and report it explicitly. Dropping canvas connection, local restore, whole-document validation or the blank-to-recovery proof is a scope reduction requiring a new acceptance decision, not completion of this plan.

**This deliverable changes planning documents only. Approval of the plan authorizes beginning implementation; it does not itself commit, push, merge or deploy application changes.**

