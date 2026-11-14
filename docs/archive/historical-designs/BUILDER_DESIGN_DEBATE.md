# DominoOS Builder Design Debate

> **Historical discussion record.** After reviewing documentation commit `d241a50`, the architecture was approved and the MVP priorities were amended. The current [implementation plan](SUPPLY_CHAIN_BUILDER_PLAN.md) makes five core node types and basic saved named scenarios P0; alternative authoring, detailed reconciliation, broad import migration and optimized mobile editing are P1. The original participant outputs and decisions below are preserved verbatim. Their person-hour estimates are not current forecasts. No new model round was requested or conducted for this scope amendment.

Status: COMPLETE. Three substantive rounds were completed by all three requested models before the coordinator selected the architecture below. Application implementation is not authorized yet.

Repository: Tasty-Kiwi/unfair-wknd-26. Inspected HEAD: e4197fc (Improve hackathon readiness and dataset provenance, PR #3). Discussion date: 13 November 2026. Deadline: 14 November 2026, 20:00 Europe/Vilnius (18:00 UTC).

## Method and authenticity

The coordinator called T3 orchestrator_capabilities before delegating. All three exact requested models were advertised as able to run child tasks. Each round used fresh delegate_task reviews in planning mode against the shared checkout, with explicit instructions not to write files, change application code, or spawn agents. Round 1 proposals were independent; none was sent to another participant until all three completed. Round 2 received all three verbatim Round 1 proposals. Round 3 received the original brief and all six verbatim Round 1/2 proposals, plus specific objections returned to their authors. The coordinator did not select the final architecture before these exchanges.

| Participant | Exact model identifier | Provider instance | Role |
| --- | --- | --- | --- |
| GPT-6 Luna | gpt-6-luna | codex | System architecture: domain graph, conversion, validation, scenario integrity; challenge two sources of truth. |
| Claude Haiku 5.5 | claude-haiku-5-5 | claudeAgent | Product design and workflows: empty canvas to valid chain, creation/connections/forms/deletion/onboarding, deadline usability. |
| Gemini 4 Hydrogen | gemini-4-hydrogen | antigravity | Critical engineering and product reviewer: challenge scope/performance/robustness/testing and competitive distinction without fragility. |

Codex and Claude report matching executedModel identifiers. Antigravity reports model=gemini-4-hydrogen with executedModel=null; its provider does not expose a separate execution-model confirmation in these task results. The Gemini outputs below are actual completed Antigravity responses from tasks requested with that exact model. No substitute model was requested or used by the coordinator.

## Interrupted attempts

Gemini's first two Round 1 tasks failed with the provider message: “There was a network issue connecting to the server, please try again.” The coordinator stopped without selecting an architecture. The first Haiku task was stopped without a final proposal. After the user reported switching to a mobile hotspot and requested another Gemini attempt, fresh independent Haiku/Gemini reviews completed. Luna's original completed independent proposal was retained.

Failed Gemini attempts:

[DominoOS debate R1 — Gemini 4 Hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3A4de329f5-0a5b-49ed-96fc-a51164385e62)

[DominoOS debate R1 — Gemini 4 Hydrogen retry](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3A730e6818-2928-4c63-89a8-c7b8d253cc14)

These failed attempts are not counted as substantive rounds or participant opinions.

## Repository-grounded corrections

The verbatim outputs preserve mistakes rather than silently rewriting the discussion. The final plan resolves them explicitly:

- Direct FK-backed draft editing can support drag through a reducer. Handles do not require an explicit edge store; raw draft completeness and choosing exactly one relationship representation decide the tradeoff.
- Never silently omit incomplete nodes. Compilation must fail for the entire visible document.
- A layer-skip prohibition incorrectly rejects the required Supplier → Component primary edge. Exact typed connection rules are required.
- The scenario-panel key is in App.tsx:598: data.name + scenario.id. An early Gemini citation to ScenarioPanel.tsx:598 was wrong. The local-state reset concern itself is valid.
- Removing one product restriction while other approvedProductIds remain need not throw: parseScenario checks approval/catalog bounds; simulate only allocates to eligible products. Empty scope fails Dataset validation; unapproval blocks scenario activation.
- Missing inventory rows are valid existing inputs and mean zero to the engine. Preserve missing versus explicit zero on conversion; a newly created blank stock field must not silently become zero.
- Existing IDs need only be unique inside their Dataset table. Graph endpoints must include the entity kind.
- Single-enum provenance cannot describe imported names retaining fictional BOMs or authored edits to imported tables. Origin must not be overwritten on edit.
- Existing browser suite has 11 tests, not nine. Plan-only participant estimates and tests are proposals, not completed validation.

## Independent verification by coordinator

- npm test: 60 tests passed across 5 files on 13 November 2026.
- npm run build: TypeScript and Vite production build passed. Existing dependency annotation and bundle-size warnings were emitted.
- No Playwright run, browser usability proof, deployment, or builder acceptance is claimed.
- The working tree was clean before writing planning documents.

## Round 1 — Independent proposals

### GPT-6 Luna

Source: [DominoOS debate R1 — GPT-6 Luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3A6dfcdf23-1473-4553-8f67-ef43e3a4e743)

Provider: codex; requested model: gpt-6-luna. Status: completed.

<details>
<summary>Actual participant output, preserved verbatim</summary>

## Recommendation

Use a **typed editable graph document as the sole business source of truth**, then compile it deterministically to the existing `Dataset` shape for `simulate()`. Keep scenario state separate as the existing delivery overrides and alternative uses. The graph document should contain nodes and typed edges; React Flow’s node positions, selection, and viewport are presentation state, not business data.

Directly editing `Dataset` would be the smaller change, but it is a poor fit for the requested interaction: relationships live in foreign-key fields and arrays, so graph connections would become a second, easily divergent representation. Conversely, persisting both a graph and a Dataset invites stale snapshots. Compile the Dataset from the document when needed; do not persist a second editable Dataset. This preserves the current simulation engine and its data contract.

Code paths support this boundary: `simulate()` consumes `Dataset` and `Scenario`; `ScenarioPanel` commits scenario changes against the current data; `compareRecoveries()` evaluates independent what-ifs without applying them implicitly. `SupplyGraph` and `ReceiptTimeline` are existing visualization surfaces to adapt, rather than reasons to add another engine.

## MVP behavior and data model

The workspace opens blank or with an example and supports authoring, inspecting, connecting, simulation, scenario use, and save/restore/import/export. Include the motor example as an end-to-end authored flow: as of 2026-11-13, Aster Manufacturing has servo stock 8 and a receipt of 5 available November 17; an industrial unit needs one servo; orders require 6 on November 20 and 4 on November 22. A scenario that delays the receipt to November 23 leaves the second order short by 2. An explicitly approved alternative of 2 units available November 18 covers both orders.

A compact graph document could be:

- `Workspace`: `version`, `asOf`, `nodes`, `edges`, and table-level provenance.
- Nodes with stable IDs and discriminated `kind` and `data`: supplier, component, receipt, product, order, and alternative supply.
- Edges with stable IDs and discriminated `kind`: supplier→component (primary supplier), supplier→receipt, receipt→component, component→product (BOM quantity), and product→order.
- Alternative supply is a distinct node, connected to its supplier and component, with quantity, availability date, approval state, and approved product IDs. This makes approval and scenario references inspectable without overloading ordinary receipts.
- Inventory belongs on a component as initial stock. Orders carry requested quantity and due date; products derive BOM lines from component edges and their quantities.

The Dataset compiler maps nodes into existing arrays and edges into foreign keys/arrays. Supplier→component satisfies the current required `supplierId`; receipt links provide supplier and component for deliveries. Product BOM edges produce `Product.bom`; product→order edges produce order product references. Alternative nodes map to `Dataset.alternatives`. Keep mapping deterministic and report graph validation errors before compilation.

Reject invalid edges before committing them: only allowed endpoint-kind pairs, existing endpoints, no duplicate semantic links, and no cycles. Multiple receipts per component and multiple component edges per product must be supported. On node deletion, show dependent references; confirm then remove incident edges and reconcile orders, BOM links, and `approvedProductIds` in one document transaction. Reconcile scenario references too.

Use Zod schemas in `validation.ts` for persisted workspace and import boundaries, while retaining `Dataset` validation for compiled input. Keep incomplete form drafts local to the inspector; only commit valid field edits to the workspace, so a half-entered quantity cannot corrupt the last compilable document. File import should parse and validate a candidate completely before replacing the current document. Invalid input leaves the active workspace and its results intact. Save/restore should round-trip the workspace and scenario, while export should include a versioned portable document.

## Scenario integrity and provenance

Treat every committed business edit as a semantic revision. Compute a deterministic revision/fingerprint from canonical node and edge business data, excluding graph positions and UI state. Store the revision with scenario state and derived results. On a semantic edit, reconcile overrides by delivery ID and alternative uses by alternative ID; remove dangling references, and mark the scenario as needing review if a referenced relationship or target changed despite retaining the same ID. Do not silently treat same-ID retargeting as unchanged. Invalidate simulation results and comparisons until recomputed against the new compiled Dataset.

Do not mutate baseline data when activating a scenario. The active scenario remains overlays consumed by `simulate()`. The existing recovery comparison behavior is a useful precedent: alternatives generate independent candidate scenarios, rather than being silently applied to the baseline.

Extend provenance beyond the current table-level `"fictional" | "imported"` classification. `provenance.ts` currently updates provenance when tables are imported; newly authored rows need an authored source too. Preserve per-table classification for UI summaries, and record per-node provenance (`authored`, `imported`, or `example`) so edits and mixed workspaces are not misrepresented. The “example” label should remain explicitly fictional.

## Five largest risks

1. **Two sources of truth:** persisted Dataset plus graph nodes/edges can disagree. Avoid this by persisting only the graph document and deriving Dataset.
2. **Relationship mapping errors:** compiler direction, cardinality, or ID mapping bugs can yield plausible but incorrect simulation inputs. Keep the compiler pure and add exact mapping tests.
3. **Stale scenarios:** deletion or same-ID retargeting can leave scenarios appearing valid. Revision binding, explicit reconciliation, and result invalidation are necessary.
4. **Invalid intermediate forms:** direct updates can break a previously valid plan while the user is typing. Separate draft values from committed domain data.
5. **Hackathon scope and interaction cost:** fully freeform graph editing is slow on laptop and awkward on narrow screens. Provide simple typed node creation, constrained connection choices, inspector-driven editing, and a list-based connection path on narrow layouts.

## Integration, exclusions, and sequencing

The biggest integration problem is agreeing on the document/compiler boundary early. The graph UI, persistence, and simulation must all use the same stable IDs and compiler output. A second likely conflict is alternative supply: the required demo needs authors to create and approve the alternative, while existing scenario UI only selects alternatives already in `Dataset`. Promote **narrow alternative authoring and approval to P1**, with no general approval workflow.

Exclude automatic layout, undo/redo, collaboration, backend sync, arbitrary edge types, multiple simulation engines, and broad schema migration tooling. Treat these as out of scope unless the core path is complete.

A realistic estimate is **roughly 65–85 person-hours**, or about 22–28 hours per developer across three people, with little schedule slack before the November 14, 20:00 deadline.

1. **Developer A: domain and compiler (18–24h).** Define document types, schema validation, edge rules, deterministic compiler, dependency deletion, scenario reconciliation, and focused unit coverage.
2. **Developer B: graph authoring (20–26h).** Blank/example workspace, typed node forms, edge creation and validation, inspector, narrow list-based connections, and paper/ink styling.
3. **Developer C: application integration (18–24h).** Workspace state and persistence, transactional import/export, scenario integration, timeline/result invalidation, and end-to-end journey.

First vertical slice: create supplier, component, receipt, product and order; connect them; compile and simulate; save, reload, and verify same outcome. Then author and approve the alternative, activate it in a disruption scenario, and verify recovery. Stop/go after the first slice: proceed only if compiler tests show exact Dataset mappings and the journey works from a genuinely blank document—not a pre-seeded Dataset. If it does not, narrow styling and optional features before weakening the end-to-end requirement.

Automated checks should cover schema rejection, edge constraints, cardinalities, deterministic compilation, transactional import, deletion cleanup, same-ID retarget reconciliation, and scenario/result invalidation. Browser coverage should exercise the full blank-to-engine journey and narrow list-based connection flow. Human acceptance should confirm a developer can build the example without seeded data, understand why the delayed receipt creates a two-unit shortage, and activate the approved alternative to resolve it. These are proposed checks; I have not run them or asserted their results.

</details>

### Claude Haiku 5.5

Source: [DominoOS debate R1 — Claude Haiku 5.5 resumed](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3A2413faf8-9da1-4197-8dbc-72ba8f44e527)

Provider: claudeAgent; requested model: claude-haiku-5-5. Status: completed.

<details>
<summary>Actual participant output, preserved verbatim</summary>

# Round 1 proposal: DominoOS visual supply-chain builder (product and workflow review)

**Scope note.** This is read-only. I read the files you listed, plus a grep for persistence and the test names. I wrote no files, spawned no agents, and ran no tests, so every test below is proposed, not run. Plan mode asked for a plan file under `~/.claude/plans/`; I did not create it because you asked for no file writes. I can save this if you want it.

## 1. Architecture options

**A. Editable GraphDocument, compiled deterministically to Dataset (recommended).** The document holds seven record arrays that mirror the Dataset tables, with stable IDs. Edges are not stored separately. They are foreign-key fields on the records: `component.supplierId`, `delivery.supplierId`/`componentId`, `product.bom[]`, `order.productId`, `alternative.approvedProductIds`. `compile(doc)` is pure: it sorts by id, runs the existing `parseDataset` and `parseScenario` (`validation.ts:389,404`), and returns either a Dataset or a problem list keyed by node id. Simulate reads only the last successful compile.
- Pro: incomplete drafts never reach the engine, and there is one commit point.
- Con: an extra model layer, plus a decompile step so a JSON or CSV import can load into the editor.

**B. Direct Dataset editing, graph stays a read-only projection.** This is the cheapest option and leaves import, export and tests untouched. But "create by connecting" becomes dropdowns. Records cannot be incomplete, because `parseDataset` requires them complete. Provenance stays table-level only. It fails the connect requirement.

**C. Dataset canonical with a patch reducer and draft overlay.** This looks like B with validation per patch. It still needs a draft layer, and it has to hold draft fields on top of a type that forbids them. It ends up as A with a worse shape.

Recommendation: A, kept thin. No generic graph engine. The document is seven arrays and one compile function.

## 2. Node and edge model

| Edge (user action) | Stored as | Cardinality | Rule |
|---|---|---|---|
| Supplier → Component (primary) | `component.supplierId` | each component exactly 1 | required (`validation.ts:257`) |
| Supplier → Receipt | `delivery.supplierId` | receipt exactly 1 | must exist |
| Receipt → Component | `delivery.componentId` | receipt 1; component many | many receipts allowed; date ≥ as-of (`:308`) |
| Component → Product | `product.bom[]` `{componentId, quantity}` | many-to-many | quantity lives on the edge; duplicate pair rejected (`:272`) |
| Product → Order | `order.productId` | order 1 | order quantity is a node field, not an edge field |
| Supplier → Alternative → Component; Alternative → Product | `alternative.{supplierId,componentId,approved,approvedProductIds}` | product scope min 1 (`:119`) | a separate kind, not a receipt flag |
| Initial stock | component inspector → `inventory` row | one per component (`:282`) | field, not a node |

Alternative is kept as a **distinct kind with its own table**. The scenario semantics differ: `parseScenario` requires approval (`:450`), caps quantity at the catalog (`:455`), and enforces an earliest date (`:460`). The canvas can draw it with the existing dashed style (`SupplyGraph.tsx:209,298`).

**Rejecting connections before they are accepted.** Use a fixed layer rank: supplier < receipt/alternative < component < product < order. `isValidConnection` rejects any edge that points backward or skips a layer. Because the rank is strictly increasing, cycles cannot form, but keep a cycle guard anyway. Duplicate (source, target, kind) edges are rejected. A second primary supplier does not silently replace the first. It shows an explicit "Replace primary supplier" action.

**Incomplete drafts.** A node can exist with missing fields. Its inspector shows field-level errors. Compile emits `{nodeId, field, message}` problems and excludes incomplete nodes. The Dataset never contains them.

## 3. Stable IDs, deletion, retargeting

- IDs are generated once (`PREFIX-NN`) and read-only after creation. Names are editable. Renaming IDs would break `kind:id` selection keys (`SupplyGraph.tsx:192,434`), scenario overrides, and `approvedProductIds`.
- **Deletion of supplier, component, product or order** is blocked, with a usage list ("Used by 2 components, 3 receipts"). This is the P0 behaviour.
- **Deletion of a receipt or alternative** removes its scenario entries in the same commit and shows a notice. This is the only cascade.
- **Removing the last product** from an alternative's `approvedProductIds` is blocked, because scope is required.
- **Same-ID retargeting.** If a receipt's `componentId` or `supplierId` changes, or an alternative's product scope changes, the existing scenario entry would silently apply to the new relationship. Reconcile by diffing the previous and next compile: any scenario entry whose target's semantic fields changed is dropped, with a notice. A scenario entry is valid only for the relationship it was authored against.

## 4. The stale-scenario hazard, concretely

`App.tsx:314` runs `useMemo(() => simulate(data, scenario))` with no try/catch. The only guard, `update()` at `:324`, covers scenario writes. Any dataset edit that deletes a receipt named in an override, or un-approves an alternative in the scenario, makes `simulate` throw during render. Fix: commit compile, then reconcile, then `parseScenario`, then set `data` and `scenario` in one update. If any step fails, keep the previous state and show the error.

## 5. Persistence, import, provenance

- **Nothing is persisted today.** A grep for `localStorage`/`sessionStorage` returns nothing. `judge-journey.spec.ts` asserts "Data is not saved between sessions". The copy changes with draft persistence.
- **Draft save:** localStorage with a schema version. A draft that fails to parse is ignored with a "Discard draft" action, so it cannot brick startup.
- **Export:** write the compiled, validated Dataset JSON. Import runs through `parseImportBundle` (`:728`), which is already transactional and reports replaced and retained tables.
- **Provenance:** the source union is `"fictional" | "imported"` (`types.ts:73`). `kindFor` (`provenance.ts:8`) would call authored data "mixed", and the label "Mixed demo + imported" (`provenance.ts:36`) would be wrong. Add `"authored"` with its own label, and update `provenance.test.ts`. Keep granularity per table, not per record, to avoid doubling the model.

## 6. Biggest integration problem

`parseDataset` is all-or-nothing and throws a single string. Forms need incremental, per-node, per-field errors. Build a compile function that returns structured problems and reuses the validator's messages, and keep `parseDataset` as the final gate. The second problem is state ownership: `ScenarioPanel` validates against whatever `data` it is given (`ScenarioPanel.tsx:45-58`). Build and Simulate must share one state container, or scenario and data will diverge.

## 7. Five greatest risks

1. **Dual model drift or lossy round-trip.** Mitigation: a property test that `compile(decompile(d))` deep-equals `d` for the demo and the motor example. After cutover, no code writes Dataset directly.
2. **Scenario crash or staleness** (`App.tsx:314`). Mitigation: the single commit path in section 4, plus unit tests for deleting an override target, un-approving an alternative, and retargeting.
3. **React Flow editable connections consume the schedule.** Today `nodesConnectable={false}` and `nodesDraggable={false}` (`SupplyGraph.tsx:428-429`). Editable mode needs handles for five kinds, `isValidConnection`, a narrow-screen path, and keyboard access. Mitigation: forms first (section 8).
4. **Provenance and copy changes break existing specs.** `provenance.test.ts` has four tests, including "becomes mixed after a partial import". The judge spec asserts the copy and the reset flow. Mitigation: update these in the same change as the `"authored"` addition, not later.
5. **Draft persistence corrupts startup, or Simulate shows stale results after an invalid edit.** Mitigation: a versioned envelope; Simulate displays a "Built from draft saved at HH:MM; draft has N errors" badge rather than silently showing old results.

Also noted: `supplier.leadTimeDays` is not read by `simulation.ts`. Do not let users expect lead time to change results. Label it informational or hide it.

## 8. Forms first, canvas second

Every connection is also a form field: "Supplied by", "Used in product, quantity", "Product for order". Canvas drag calls the same mutation. The list path and the canvas then share semantics. If canvas connections slip, the demo still runs.

## 9. Scope

- **P0:** blank or example start; add supplier, component, receipt, product and order; connect via canvas or form under the rules in section 2; inspector for required fields, initial stock and BOM quantities; compile with a problem list; Simulate runs on the last valid compile with a stale badge; existing disruption controls on the compiled Dataset; draft save; JSON export and import; the motor example built through the UI.
- **Promoted from P1 to P0, narrowly:** creating one approved alternative with product scope. The motor proof needs it, and `ScenarioPanel` only selects existing catalog entries (`ScenarioPanel.tsx:535`). Creation is missing, so this is a real promotion. Its deletion copy and comparison stay P1.
- **P1:** named scenarios (a list of existing `Scenario` objects), wider deletion warnings, and `compareRecoveries` (`recovery.ts:14`) surfaced in Build.
- **Excluded:** auto-layout; undo and redo (use discard-draft instead); multi-user; backend; pricing and freight; lead-time effects; lot and expiry; spreadsheet-grid editing; PO integration.

**Motor example check (hand-traced against `simulation.ts`):** order 1 (Nov 20, 6 units) takes 6 from stock (8 → 2 left). Order 2 (Nov 22, 4 units) takes 2 from stock, then 2 from the Nov 17 receipt of 5 (3 left over). With the receipt moved to Nov 23, it is after Nov 22 (`simulation.ts:67`), so order 2 is short 2. ALT-01-style alternative (2 units, Nov 18, scoped to the industrial unit) is dated before Nov 22 and covers both short units. The trace matches your numbers. It has not been run.

## 10. Effort and sequence

Estimates are my guesses, not measurements.

| Work package | Person-hours |
|---|---|
| Document model, compile, decompile, tests | 12 |
| Reconcile, deletion, retargeting | 8 |
| Editable canvas and connection validity | 14 |
| Inspector forms and narrow list path | 10 |
| Persistence, import and export, provenance | 8 |
| Simulate wiring and alternative creation | 6 |
| Visual pass (paper and ink) | 6 |
| Blank-to-engine e2e test | 6 |
| Buffer and bugs | 8 |
| **Total** | **~78** |

That is about 26 focused hours per developer. Against roughly 30 wall hours, this is tight but workable only if P2 stays out.

**Three-developer split:**
- **Dev A:** document schema, compile, decompile, reconcile, unit tests. This is the critical path.
- **Dev B:** forms, inspector, narrow list path, then canvas connections.
- **Dev C:** App wiring, persistence, import and export, provenance, e2e harness, copy and visual.

**Checkpoints:**
- **Slice 1 (target Nov 13, 23:00):** blank → supplier, component, receipt, product, order via forms → compile → Simulate shows covered and at-risk. Go if it works. If not, drop canvas connections and ship forms-only.
- **Slice 2 (target Nov 14, 11:00):** the motor example through the UI, with the disruption, shortage 2, and the approved alternative covering both. Go to P1 if it holds. If not, cut P1 entirely.
- **Freeze Nov 14, 16:00.** E2E green and rehearsal by 17:30. Deploy dry-run. Keep the buffer to 20:00.

**Automated checks (proposed, not run):** compile and decompile round-trip on the demo and the motor example; reconcile unit tests for override-target deletion, alternative un-approval and retargeting; updated provenance tests; a Playwright blank-to-engine test asserting shortage 2 with the disruption and covered with the alternative; and the nine existing judge specs staying green.

**Human checks:** a 10-minute cold read by someone who has not seen the app. Can they build the motor chain without help? Audit the copy. Check the mobile list path on a real phone.

</details>

### Gemini 4 Hydrogen

Source: [DominoOS debate R1 — Gemini 4 Hydrogen resumed](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3A4eaade07-30e6-4b40-abf2-64a7ce503c1f)

Provider: antigravity; requested model: gemini-4-hydrogen. Status: completed.

<details>
<summary>Actual participant output, preserved verbatim</summary>

# DominoOS Visual Supply-Chain Builder — Round 1 Architecture & Execution Proposal

## 1. Architecture Comparison & Recommendation

### Option A: Editable `GraphDocument` Compiled Deterministically to `Dataset` (Recommended)
Maintain a dedicated, serializable `GraphDocument` as the **sole canonical business source** in Build mode, paired with a pure, deterministic `compileGraphToDataset(doc)` function that produces a validated `Dataset` (via [`parseDataset()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L389-L397)) for Simulate mode.

* **Why it wins:** [`parseDataset()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L389-L397) strictly enforces [`componentSchema`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L66-L71) (`supplierId` non-blank), [`productSchema`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L78-L85) (`bom.min(1)`), [`alternativeSchema`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L109-L120) (`approvedProductIds.min(1)`), and cross-record [`requireRef`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L201-L213) checks. Users building from a blank canvas **must** be able to place an unlinked `Component` or `Product` node, type partial forms, and wire edges incrementally. `GraphDocument` absorbs these incomplete states without weakening [`validation.ts`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts) or corrupting the last compiled `Dataset` snapshot.
* **Layout & Identity:** Visual coordinates `(x, y)` and stable internal IDs live natively on `GraphDocument` nodes, while `datasetToGraphDocument(dataset)` hydrates the starter demo or imported JSON/CSV into the same document model.

### Option B: Direct `Dataset` Editing with Derived Graph Projection (Rejected)
Mutating `Dataset` directly on every form keystroke or node drop forces one of two bad compromises:
1. Injecting sentinel/placeholder IDs (e.g., `"UNASSIGNED"` suppliers or dummy BOM lines) to satisfy `parseDataset()`, which leaks fake entities into [`simulate()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/simulation.ts#L17-L202) and [`SupplyGraph.tsx`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/graph/SupplyGraph.tsx); or
2. Relaxing `parseDataset()`, which breaks invariants assumed by [`simulate()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/simulation.ts#L54) (`productById.get(order.productId)!`) and [`recovery.ts`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/recovery.ts#L29-L67).

### One-Source-of-Truth & Boundary Rules
* **Build -> Simulate Boundary:** Build edits `GraphDocument` only. `compiledSnapshot: { dataset: Dataset; issues: CompileIssue[] }` holds the **last valid** `Dataset` until the current `GraphDocument` compiles cleanly through `compileGraphToDataset()` + `parseDataset()`. Incomplete forms show inline node/inspector diagnostics without overwriting `compiledSnapshot` or crashing Simulate.
* **Transactional Import:** [`parseImportBundle()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L728-L776) continues to validate against the current valid `Dataset`; on confirmation, `datasetToGraphDocument()` replaces `GraphDocument` atomically.
* **Provenance Extension:** [`DatasetSource`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/types.ts#L73) (`"fictional" | "imported"`) and [`provenance.ts`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/provenance.ts) must add `"authored"` (and update [`provenanceLabel`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/provenance.ts#L34-L38) to distinguish `"Authored in builder"`, `"Mixed demo + authored/imported"`, etc.). Any Build edit marks the touched table(s) as `"authored"`; starting blank initializes all tables to `"authored"`.

---

## 2. Suggested Data Model, Mappings & Cardinality

### Node Types & `GraphDocument` Shape
```ts
type NodeKind = "supplier" | "component" | "receipt" | "product" | "order" | "alternative";

interface GraphDocument {
  version: 1;
  name: string;
  asOf: string; // YYYY-MM-DD
  nodes: GraphNode[]; // { id, kind, position: { x, y }, data: KindPayload }
  edges: GraphEdge[]; // { id, kind, source, target, quantity?: number }
}
```
* **Stable IDs:** Nodes carry immutable business IDs (`SUP-01`, `MTR-01`, `PO-101`, `PRD-01`, `ORD-01`, `ALT-01`) generated sequentially or user-edited with uniqueness validation. React Flow node IDs use `${kind}:${id}` (matching [`SupplyGraph.tsx:185`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/graph/SupplyGraph.tsx#L185)).
* **Initial Stock (`Inventory`):** Stored directly on the `Component` node payload (`initialStock: number >= 0`) and compiled to `Dataset.inventory` (`1:1` per component). Avoid a separate Inventory node—it adds canvas clutter for a scalar property.

### Alternative Supply: Distinct Node vs. Specialized Receipt
**Recommendation: Distinct `alternative` node** (rendered with a dashed ink border matching `.legend-dash` in [`SupplyGraph.tsx:459`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/graph/SupplyGraph.tsx#L459)).
* **Why:** In [`types.ts:27-51`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/types.ts#L27-L51), `Delivery` is unconditional baseline supply modifiable via `Scenario.deliveryOverrides`, whereas `AlternativeSupply` is conditional catalog supply requiring `approved: boolean` and `approvedProductIds: string[]` (`min(1)` in [`validation.ts:118-119`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L118-L119)), activated only via `Scenario.alternatives`. Overloading `receipt` blurs baseline vs. recovery semantics and complicates `Scenario` reconciliation.

### Edge Types, Mappings & Cardinality Rules
| Edge Kind | Source -> Target | Cardinality | Maps to `Dataset` Field |
| :--- | :--- | :--- | :--- |
| `supplies` (primary) | `Supplier -> Component` | `1` Supplier per Component (`N:1`) | `Component.supplierId` |
| `ships` | `Supplier -> Receipt` | `1` Supplier per Receipt | `Delivery.supplierId` |
| `delivers` | `Receipt -> Component` | `1` Component per Receipt (many Receipts per Component) | `Delivery.componentId` |
| `bom` | `Component -> Product` | `M:N` (unique per `(Component, Product)` pair) | `Product.bom[{ componentId, quantity }]` (`quantity >= 1`) |
| `fulfills` | `Product -> Order` | `1` Product per Order (`1:N`) | `CustomerOrder.productId` |
| `alt_from` | `Supplier -> Alternative` | `1` Supplier per Alternative | `AlternativeSupply.supplierId` |
| `alt_for` | `Alternative -> Component` | `1` Component per Alternative | `AlternativeSupply.componentId` |
| `alt_approved_product` | `Alternative -> Product` | `>= 1` Products per Alternative | `AlternativeSupply.approvedProductIds[]` |

* **Pre-Accept Edge Validation:** Reject before adding to `GraphDocument.edges`:
  1. Disallowed `(source.kind, target.kind)` pairs (only the 8 above are valid).
  2. Self-loops or cycles (the graph is strictly layered/DAG).
  3. Duplicate `(kind, source, target)` edges (e.g., duplicate BOM line—prompt user to edit existing edge quantity instead, matching [`validation.ts:272-275`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L272-L275)).
  4. Single-parent violation on `supplies`, `ships`, `delivers`, `fulfills`, `alt_from`, `alt_for` (either reject with a clear message or offer 1-click replace). Multiple receipts between the same Supplier and Component work naturally because each `Receipt` is its own node.

### Deletion & Scenario Reconciliation
* **Deletion Guard:** Deleting a node computes dependent references (`Component` -> BOM edges, `Receipt`s, `Alternative`s; `Product` -> `Order`s and `Alternative.approvedProductIds`). Show a confirmation listing affected edges/nodes (specifically warning if removing a `Product` leaves an `Alternative` with 0 approved products, violating `approvedProductIds.min(1)`).
* **Scenario Reconciliation:** [`App.tsx:310-314`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx#L310-L314) calls `simulate(data, scenario)` in `useMemo`, which calls [`parseScenario()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L404-L475) and **throws** on stale IDs or violated bounds. Every Build->Simulate transition must run `reconcileScenario(nextDataset, scenario)`:
  * Drop `deliveryOverrides` whose `deliveryId` no longer exists or whose `availableDate < nextDataset.asOf`.
  * Drop `alternatives` whose `alternativeId` was deleted, unapproved (`!approved`), or whose `availableDate < nextDataset.asOf`; clamp `quantity <= catalog.quantity` and `availableDate >= catalog.availableDate`.
  * Surface a dismissible notice summarizing any pruned/clamped scenario entries. Never mutate baseline `Dataset` from a scenario.

---

## 3. MVP Feature Set & Scope Triage (P0 / P1 / P2)

### Required User-Created Motor Example (Acceptance Anchor)
From a **blank** workspace (no seeded `Dataset` shortcut):
1. Set `asOf = 2026-11-13`.
2. Create Supplier `Aster Manufacturing`, Component `Servo` (`initialStock: 8`), Receipt `5` units on `2026-11-17`, Product `Industrial unit` (`BOM: 1 × Servo`), Order 1 (`6` units, `2026-11-20`), Order 2 (`4` units, `2026-11-22`).
3. Compile & Simulate: `8` stock covers Order 1 (`6`, `2` left); Receipt `5` on Nov 17 covers Order 2 (`4`). All covered.
4. Disrupt Receipt to `2026-11-23`: Order 1 covered; Order 2 gets `2` from remaining stock, Receipt on Nov 23 is after `2026-11-22` ([`simulation.ts:67`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/simulation.ts#L67)), leaving **shortage `2`**.
5. Activate explicit approved `Alternative` (`2` units, `2026-11-18`, approved for `Industrial unit`): both orders covered.

### P0 (Must-Ship)
* **Build / Simulate Workspace Toggle** in [`App.tsx`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx) (paper/ink design, zero new backend).
* **Blank / Example Start** + **Node & Edge Authoring** on React Flow canvas (`@xyflow/react`) **and** narrow-screen (`<= 720px`) list-based connection UI (extending [`useNarrow()`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/graph/SupplyGraph.tsx#L90-L100)).
* **Inspector Panel:** Edit node fields, BOM edge quantities, and component initial stock; show inline compile blockers.
* **Deterministic Compiler + Last-Valid-Snapshot Isolation** + **Scenario Reconciliation**.
* **Narrow P1->P0 Promotion (Openly Flagged):** The motor recovery proof requires creating an `approved` `AlternativeSupply` scoped to `Industrial unit` from scratch. Therefore, **Alternative node authoring + approval scoping** must be **promoted from P1 to P0**. Without it, the blank-to-recovery journey is impossible without seeded data.
* **Simulate Workspace:** Reuse existing [`simulate()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/simulation.ts#L17), [`ScenarioPanel`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/scenarios/ScenarioPanel.tsx), [`ReceiptTimeline`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/graph/ReceiptTimeline.tsx), and [`RecoveryComparison`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/scenarios/RecoveryComparison.tsx).
* **Persistence & Portability:** `localStorage` draft auto-save/restore (updating the outdated *"Data is not saved between sessions"* copy in [`App.tsx:809-810`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx#L809-L810) and [`judge-journey.spec.ts:13`](file:///Users/dominykas/Development/unfair-wknd-26/tests/judge-journey.spec.ts#L13)) + JSON export/import.

### P1 (Ship If Ahead at Hour 20)
* Named scenario CRUD (save/rename/delete custom scenarios) + dynamic comparison table (replacing hardcoded `scenarioNames` in [`App.tsx:403-407`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx#L403-L407)).
* Rich deletion impact modal listing cascading references before confirm.

### P2 (Explicit Hackathon Exclusions)
* Auto-layout engines (ELK/dagre — use deterministic column-lane placement as in [`SupplyGraph.tsx:188`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/graph/SupplyGraph.tsx#L188)).
* Undo/redo history stack.
* Multi-level sub-assembly BOMs (`Product -> Product`, unsupported by `simulate()`).
* Cost/freight/capacity optimization or backend sync.

---

## 4. Five Greatest Risks & Biggest Integration Problem

### Biggest Integration Problem
**Decoupling `App.tsx` from demo-assumed state and synchronous `simulate()` crashes.** Currently [`App.tsx`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx) assumes a non-empty, static `Dataset` on every render:
* [`App.tsx:310-314`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx#L310-L314) runs `presets.map(s => simulate(data, s))` and `simulate(data, scenario)` unconditionally in `useMemo`, which throws if `scenario` is stale after a Build edit.
* [`SupplyGraph.tsx:131`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/graph/SupplyGraph.tsx#L131) defaults `componentFocus` to `"MTR-01"` and [`App.tsx:403-407`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx#L403-L407) hardcodes 3 `scenarioNames`.
* [`ScenarioPanel.tsx:598`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/scenarios/ScenarioPanel.tsx#L598) keys on `data.name + scenario.id`, which will not reset stale local drafts if `data` changes without changing `data.name` or `scenario.id`.

### Five Greatest Risks
1. **Uncaught `simulate()` / `parseScenario()` Exceptions:** Any mismatch between edited `GraphDocument` and active `Scenario` crashes the React tree unless guarded by `reconcileScenario()` and an error boundary around Simulate.
2. **Same-ID Semantic Retargeting:** If a user keeps `PO-101` or `ALT-01` but changes its `componentId`, `supplierId`, or `approvedProductIds`, `deliveryOverrides` / `alternatives` still match by ID and silently simulate the wrong relationship or throw on `approvedProductIds` mismatch. Reconciliation must validate semantic compatibility, not just ID existence.
3. **Narrow/Mobile Canvas Parity:** [`SupplyGraph.tsx:380-448`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/graph/SupplyGraph.tsx#L380-L448) swaps React Flow for `.chain-list` below `720px`. If edge creation only works via React Flow handles, mobile/keyboard users and narrow Playwright tests cannot build graphs. Both views must call the same `connectNodes(source, target)` controller.
4. **Compute Jank from `tippingPoints()` & `receiptExposure()`:** [`ScenarioPanel.tsx:92, 238`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/scenarios/ScenarioPanel.tsx#L92) runs up to 15 full `simulate()` calls in `useMemo`. Running Simulate projections live while typing in Build mode will lag; Build mode must **not** trigger `simulate()` until compile/switch.
5. **Existing E2E Suite Regressions:** [`tests/judge-journey.spec.ts`](file:///Users/dominykas/Development/unfair-wknd-26/tests/judge-journey.spec.ts) asserts exact strings (`"Data is not saved between sessions"`, `.react-flow__node` count `29`, `"Fictional demo data"`). Changing default landing state or persistence copy without updating or scoping those assertions will break CI.

---

## 5. Three-Developer Sequencing & Realistic Person-Hours

**Timeline:** ~30.7 wall hours (Nov 13 13:20 -> Nov 14 20:00 Vilnius). Accounting for sleep, meals, and integration/polish, budget **~17 effective hours per developer (~51 person-hours total)**:

* **Dev A — Compiler, Validation, Persistence & Provenance (~17h)**
  * `GraphDocument` types, `compileGraphToDataset()`, `datasetToGraphDocument()`, cycle/duplicate edge validators (6h).
  * `reconcileScenario()`, `"authored"` provenance in [`provenance.ts`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/provenance.ts), `localStorage` draft store + JSON export/import (6h).
  * Vitest unit suite for compiler, edge rejection, reconciliation, and motor scenario math (5h).
* **Dev B — Build Canvas, Inspector & Narrow Connector (~17h)**
  * Build-mode React Flow canvas (`@xyflow/react`) with paper/ink node cards (`Supplier`, `Component`, `Receipt`, `Product`, `Order`, `Alternative`) and `onConnect` validation (7h).
  * Inspector panel (forms, BOM quantities, initial stock, alternative approval/product-scoping, deletion warnings) (6h).
  * Narrow (`<= 720px`) list-based node/edge creator sharing the same graph mutation actions (4h).
* **Dev C — App Integration, Simulate Hardening & E2E Proof (~17h)**
  * Build/Simulate workspace shell in [`App.tsx`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx), blank-start flow, dynamic `presetsFor` / `ScenarioPanel` keying fix, and error-safe Simulate boundary (7h).
  * Playwright E2E test for the full blank -> motor example -> Nov 23 disruption -> Nov 18 alternative recovery -> reload persistence + narrow viewport test (6h).
  * Visual paper/ink polish, regression triage on [`judge-journey.spec.ts`](file:///Users/dominykas/Development/unfair-wknd-26/tests/judge-journey.spec.ts), demo rehearsal (4h).

### First Vertical Slice & Stop/Go Gates
* **First Vertical Slice (Target: Nov 13, 20:30 — ~7h in):** Blank workspace -> add 1 Supplier, 1 Component (with stock), 1 Product (with BOM), 1 Order -> compile to `Dataset` -> switch to Simulate -> `simulate()` renders Order status.
* **Gate 1 (Nov 13, 21:00):** `compileGraphToDataset()` + `parseDataset()` round-trips `demoData` cleanly in Vitest; vertical slice works end-to-end. *If missed:* drop P1 named scenarios immediately.
* **Gate 2 (Nov 14, 12:00):** Full motor example works from blank canvas in browser (including Receipt delay to Nov 23 and Alternative recovery on Nov 18) + `localStorage` restore works. *If missed:* freeze new UI features and dedicate all 3 devs to bugfixing and E2E stability.
* **Gate 3 (Nov 14, 17:30):** Code freeze; only critical bugfixes and demo script verification until 20:00.

---

## 6. Verification Strategy (Automated vs. Human Checks)

*(Note: No tests or builds were executed in this plan-only review.)*

* **Automated Unit Tests (`npm test` / Vitest):**
  * `compileGraphToDataset(datasetToGraphDocument(demoData))` equals `demoData`.
  * Edge validator rejects cycles, invalid kind pairs, duplicate BOM edges, and second primary suppliers.
  * `reconcileScenario()` safely prunes/clamps stale overrides and alternatives after node deletion or same-ID retargeting.
  * Motor example assertions: baseline `0` at-risk, Nov 23 delay `2` missing units on Order 2, Nov 18 alternative `0` missing units.
* **Automated Browser Tests (`npm run test:e2e` / Playwright):**
  * Full blank-to-recovery motor journey at desktop (`1280x800`) and narrow (`390x844`, using list-based connection UI) with zero `pageerror`s and no horizontal overflow.
  * Page reload restores `localStorage` draft and `"authored"` provenance badge.
  * Existing [`tests/judge-journey.spec.ts`](file:///Users/dominykas/Development/unfair-wknd-26/tests/judge-journey.spec.ts) updated only where persistence copy intentionally changed.
* **Human Checks:**
  * Paper/ink visual legibility (contrast, hatched shortage indicators, dashed alternative edges, zero overlapping labels in `ReceiptTimeline`).
  * Live 3-minute judge demo dry-run on laptop screen without DevTools or seeded shortcuts.

</details>


## Round 2 — Cross-examination

### GPT-6 Luna

Source: [DominoOS debate R2 — GPT-6 Luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3Abaf35001-b010-424f-aaf5-c3a022e661c5)

Provider: codex; requested model: gpt-6-luna. Status: completed.

<details>
<summary>Actual participant output, preserved verbatim</summary>

## Cross-examination: revised architecture and cut line

**Shared recommendation:** keep one canonical editable `GraphDocument` in Build and compile it deterministically to the existing `Dataset` for Simulate. Do not store editable graph edges alongside independently editable Dataset foreign keys. But I revise my Round 1 recommendation on intermediate validity: **an incomplete or invalid current document must block compilation of the entire document.** Keep the last valid compiled snapshot only as a clearly stale, read-only preview; never silently omit incomplete nodes and simulate a partial plan.

I checked the relevant code paths. `simulate()` calls `parseDataset()` and `parseScenario()` on every run (`simulation.ts:17–19`); both throw on invalid input. `parseDataset()` enforces component supplier references, nonempty BOMs, and alternative product scope (`validation.ts:257–371`). `parseScenario()` validates override targets and alternative approval, dates, and quantities (`:404–475`). `App.tsx` memoizes simulations from the current data/scenario, so build edits must invalidate or safely reconcile simulations before they render. The current graph is read-only (`SupplyGraph.tsx:428–429`), and the scenario UI selects existing alternatives rather than authoring them (`ScenarioPanel.tsx:535–565`).

### Objections to Haiku

1. **“Seven record arrays with FK fields” does not make canvas connections impossible.** A reducer can update a canonical component’s `supplierId` when the user drags Supplier → Component; there need not be a second writable edge store. The key decision is whether the draft model can represent incomplete records, not whether `Dataset` fields can be edited through a graph.

2. **“Compile emits problems and excludes incomplete nodes” is unsafe.** A product/order chain can compile while an unfinished component or disconnected receipt silently vanishes, making the simulation look authoritative. Fail compilation for the entire current business document when any required record or relationship is incomplete. Identify every blocker by node and field. Preserve valid imported data as valid; the new “ready for meaningful simulation” rule applies to builder documents, not to blanket rejection of currently supported empty datasets.

3. **The layer-rank rule contradicts a required relationship.** Supplier → Component is a direct primary-supplier relationship, so “skips a layer” cannot be rejected. Use an exact allowlist of edge kinds and endpoint pairs, then validate cardinality and cycles. Also, ID uniqueness should be per table/type: `parseDataset` checks uniqueness within tables, not across them. A compiler using a single global ID map would reject legal documents or resolve the wrong record.

4. **Blocking most deletions is the wrong interaction contract.** It leaves users unable to repair the graph. Confirm a transaction that removes dependent relationships and explains effects; if an alternative would be left with no approved products, make the user update or remove it before commit. Scenario changes and result invalidation belong in that same transaction.

5. **Table-level provenance alone loses mixed origin on individual records.** Marking an entire table “authored” after one edit can misrepresent imported records. Keep existing table summaries if needed, but retain origin at record level—or explicitly scope the MVP provenance promise to table-level summaries and accept the limitation.

### Objections to Gemini

1. **Direct Dataset editing is dismissed using a false constraint.** A form draft overlay and reducer can preserve incomplete text while committed `Dataset` edits happen only after field validation; React Flow `onConnect` can dispatch the same relationship update as the list UI. Sentinel foreign keys and schema weakening are avoidable. The comparison should be thin FK-backed document plus draft overlay versus explicit edge document, not direct editing “forces” sentinels.

2. **The proposed reconciliation silently mutates hypotheses.** Dropping scenario entries, clamping alternative quantities, and moving dates to legal minima can change what the user intended to test. This is especially wrong for same-ID retargeting: an override on receipt `R1` must not silently apply to a different supplier/component after `R1` is repointed. Prefer archival invalidation: preserve the scenario as needing review, identify changed/deleted targets, and block its activation until the user explicitly repairs or resets it. Rename/layout-only edits should not stale a scenario; changes to receipt relationship/date/capacity, alternative scope/approval/capacity/date, BOM, order demand/product/date, or `asOf` should.

3. **“Any Build edit marks touched tables authored” erases origin.** Editing an imported row does not change where it came from. Track row origin if provenance must remain accurate; otherwise keep provenance as a coarse import-history label and do not claim it identifies the origin of each current row.

4. **The P0 alternative promotion is correct, but the sequencing underestimates its integration cost.** A distinct alternative record needs a supplier, component, positive quantity/date, approval, and product scope, then scenario activation and recovery proof. This must be in the first meaningful vertical slice, not deferred to “Hour 20.”

5. **A 51-hour budget and a 20:30 first slice are incompatible.** Nov 13 13:20 to Nov 14 20:00 is about 30.7 wall hours. Three developers cannot contribute 17 focused hours each while also sleeping, integrating, and rehearsing. The required receipt-disruption-to-order-shortage proof should be the first 4–6 effective hours’ gate.

### Revised mapping and draft policy

I recommend an explicit `GraphDocument` with stable typed nodes and edges as the authoring source, plus separate raw inspector drafts for invalid text. On field blur/commit, validate the affected field; invalid text stays in the inspector draft and does not mutate the canonical document. A valid field edit updates the document, increments its semantic revision, and invalidates derived results. On save, persist both document and inspector drafts so reload does not discard malformed/incomplete text. A whole-document import is transactional: parse, validate, compile; replace only on success.

Mappings: `Supplier → Component` supplies `Component.supplierId`; `Supplier → Receipt → Component` maps both delivery foreign keys; `Component → Product` carries BOM quantity and compiles to `Product.bom[]`; `Product → Order` maps `order.productId`. Initial stock remains a component property compiled into the one inventory row. Multiple receipts per component and multiple BOM components per product are valid. Enforce the exact edge allowlist, one primary supplier per component, one supplier and component per receipt, one product per order, and no duplicate BOM pair. Test cycles even though these allowed pairs appear acyclic.

A distinct alternative node is the clearest minimal representation: it preserves the existing `AlternativeSupply` semantics and compiles product-scope edges into `approvedProductIds`. Keep approval as a field, not an extra approval edge. The required demo means basic alternative creation, approval, and product scoping are **P0**, even though broader authoring/deletion workflows are P1.

**Visual connection → wrong simulation example:** user drags a receipt onto a component intending Supplier → Receipt → Component. If the UI merely stores the visual edge but the compiler reads the receipt’s old `componentId`, the canvas shows “5 servos arriving” while `simulate()` allocates those five units to the old component. The edge must dispatch a validated domain mutation; visual state alone is never evidence of a business relationship.

### Risks, value, and feasible plan

The five highest risks, ranked by likelihood × impact:

1. **Incorrect compiler mapping** produces plausible but false coverage. Golden mapping tests should assert exact Dataset tables and references, not only successful simulation.
2. **Stale scenario/result presentation** after semantic edits misleads users. Invalidate results immediately; require explicit scenario review for affected hypotheses.
3. **Canvas and narrow-list parity** diverges. Both paths must use the same connection reducer; narrow path is required acceptance, not optional polish.
4. **Incomplete draft behavior** either crashes compilation or silently omits data. Block the entire compile and preserve raw field text.
5. **Integration/scope overload** leaves a polished editor without disruption evidence. Start with the motor example’s actual shortage.

The biggest integration problem is the single state transition spanning document mutation, compilation, scenario review state, and result invalidation. `ScenarioPanel` validates against the `Dataset` it receives, while `App.tsx` currently simulates synchronously from current state. Define that boundary before splitting UI work.

At roughly **45–54 focused person-hours total**, three developers have about 15–18 hours each, with very little slack. First slice in 4–6 effective hours: from blank, create/connect supplier, component stock, receipt, product/BOM, and two orders; compile; delay the receipt to Nov 23; assert the second order is short by 2. Then add the approved 2-unit Nov 18 alternative and prove recovery, followed by persistence/import/export and visual refinement. Stop if the shortage evidence is not working: cut named scenarios, rich deletion dialogs, and visual polish before the acceptance path. Canvas dragging remains required; a forms-only fallback is a documented scope reduction, not full success.

Exclude undo/redo, auto-layout, collaboration, backend sync, new simulation logic, and broad migration tooling. Proposed automated checks: edge validation and deterministic mapping; incomplete-document compile failure; import atomicity; semantic versus layout/rename revisions; scenario review for same-ID retarget, deletion, reduced caps/unapproval, and BOM/order edits; and browser proof from a genuinely blank workspace. Human checks: a cold laptop walkthrough and narrow list-based connection journey. I ran no tests; these are proposals only.

</details>

### Claude Haiku 5.5

Source: [DominoOS debate R2 — Claude Haiku 5.5](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3A6f10bc11-6553-45d4-9351-9e806b61f10a)

Provider: claudeAgent; requested model: claude-haiku-5-5. Status: completed.

<details>
<summary>Actual participant output, preserved verbatim</summary>

## Round 2 cross-examination: Haiku (claude-haiku-5-5)

**Scope.** Read-only. I re-read `simulation.ts`, `validation.ts`, `App.tsx`, `SupplyGraph.tsx`, `provenance.ts`, `types.ts` and `tests/judge-journey.spec.ts`. I did not run tests, write files, or start agents. The plan file was not written because your instructions forbid file writes. Every test below is proposed, not run.

### Verified code facts that decide disputes

- `simulate()` calls `parseDataset` and `parseScenario`, and both throw (`simulation.ts:18-19`). `App.tsx:314` runs `simulate(data, scenario)` in `useMemo` with no try/catch. A stale scenario therefore crashes render. Reconciliation is mandatory, not optional.
- `App.tsx:310-311` already runs `simulate` once per preset on every `data` change. Compile-on-every-keystroke will multiply that cost.
- `provenance.ts:8-14` `kindFor` returns `mixed` only when more than one source is present. An all-`authored` dataset would be labelled **"Fictional demo data"**, because it falls through to `fictional`. My Round 1 claim that authored data would be called "mixed" was wrong. The real bug is the fall-through, and `provenanceLabel` (`:34-38`) needs a third branch.
- `SupplyGraph.tsx:428-429` sets `nodesDraggable={false}` and `nodesConnectable={false}`. Narrow mode is a separate `.chain-list` branch at `:380`, so connection needs both paths.
- `judge-journey.spec.ts:13` asserts the copy "Data is not saved between sessions", which must change with draft persistence.
- Inventory is a separate table keyed by `componentId` with uniqueness checks (`validation.ts:281-282`).

### Critique of Luna (gpt-6-luna), with three+ specific weaknesses

1. **Alternative approval scope is stored in two places.** Luna places `approved` and `approvedProductIds` on the alternative node and also draws "connected to its supplier and component". Once product scope is shown as edges, there are two writable representations. This is the exact drift risk Luna itself names. Pick one. I recommend checkbox properties on the alternative, with the Alternative→Product line derived for display.
2. **Internal contradiction on priority.** Luna says the required alternative demo means authors must create the alternative, then says to promote it "to P1". P1 means not in the MVP. The demo needs it, so it is P0. Luna's own argument supports promotion, but its label does not.
3. **No rule for incomplete versus valid.** Luna says "report graph validation errors before compilation" but never says whether a partial graph compiles, whether a blank Dataset is "ready", or whether an incomplete receipt is dropped. This is the central question for the Simulate snapshot and it is unanswered.
4. **Estimate and slice do not fit.** 65–85 person-hours (22–28 per developer) exceeds the roughly 51–60 effective hours available across three developers after sleep. The first slice does not include receipt disruption → changed order evidence, so the earliest proof of value comes too late.

### Critique of Gemini (gemini-4-hydrogen), with three+ specific weaknesses

1. **Dual representation in its own model.** Gemini's `GraphDocument` stores `Component` payloads and `edges` of kind `supplies`. Its mapping table then sends `supplies` to `Component.supplierId`. The same fact has two writable homes, and Gemini gives no rule for resolving a mismatch.
2. **Silent clamping and dropping of scenarios.** Gemini's `reconcileScenario` clamps `quantity` to the catalog and forces `availableDate >= catalog.availableDate`, and drops unapproved alternatives. In the motor example, a catalog edit to the alternative's date would silently rewrite the user's recovery hypothesis, so the Nov 18 proof could show green for a different scenario than the one the user authored. The user must see a review state, not a quiet edit.
3. **Compile gating is undefined, and the timeline is tight.** Gemini says `compiledSnapshot` holds the last valid Dataset and that Build must "not trigger `simulate()` until compile/switch". That conflicts with compiling on each valid edit to keep the snapshot fresh, which is the point. Its Gate 1 at Nov 13 21:00 requires a `demoData` round-trip plus a working vertical slice, with no time allowed for the mapping tests.
4. **Unverified claim.** Gemini's `ScenarioPanel.tsx:598` key claim ("`data.name + scenario.id`") was not confirmed in this review. Do not build on it until checked.

### Self-critique: what I revise from my Round 1

- **Incomplete nodes must block whole-graph compile.** My Round 1 "excludes incomplete nodes" is wrong. If an incomplete receipt is silently omitted, the compile succeeds and simulate produces a plausible but different shortage. Revised: compile fails for the entire graph while any node is incomplete. Simulate keeps the last valid snapshot, labelled with its revision and the count of blocking issues.
- **"Valid Dataset" is not "ready for simulation".** A blank Dataset parses. Readiness is a separate check: at least one order, every order's product has BOM lines, and every component has a supplier and an inventory value.
- **My skip-layer rule was wrong.** Rejecting edges that "skip a layer" would block Supplier→Component, which the brief makes primary. Replace it with an explicit allowlist of kind pairs: supplier→component, supplier→receipt, supplier→alternative, receipt→component, alternative→component, component→product, product→order, alternative→product. Because every allowed edge moves strictly up the kind order, cycles are excluded by construction. Keep a cycle guard anyway.
- **Estimate.** My 78 hours was over budget. Revised below.
- **Deletion.** I said scenario entries are "removed with a notice". That is silent loss of intent. Revised to move affected entries to a review list.

### Answers to the coordinator's eight questions

**1. Canonical representation.** Use records with foreign keys as the only stored relationship, and derive edges for display. Drag still works: `onConnect` calls a reducer that sets the matching field (`component.supplierId`, `delivery.componentId`, appends a BOM line, sets `order.productId`, or toggles an alternative's approved-product checkbox). Edge rules live in one function, so drag and list use the same mutation. Storing edges separately creates a second writable representation. Reject it.

**2. Incomplete nodes.** Compile is all-or-nothing, as above. A valid imported Dataset and a "ready for meaningful simulation" document are different states.

**3. Inventory and IDs.** Inventory is a `null`-able field on the component. `null` means not entered and blocks compile. Explicit `0` emits a row with quantity 0. On decompile, a missing inventory row becomes `null`, not 0, so an imported gap is visible rather than assumed. IDs need not be globally unique across types. Node identity is `kind:id`, which `SupplyGraph.tsx:192` already uses.

**4. Scenario policy.** Choose explicit review with archive. Each scenario entry carries a fingerprint of the relationship it targets. When a semantic edit changes that fingerprint, or deletes the target, the entry moves to `needsReview`. It is not applied, not clamped, and not deleted. The user can rebase it explicitly or discard it. Automatic reconciliation is limited to non-semantic edits: renames (IDs are immutable), layout, and notes. Reduced caps and unapproval always go to review. A full reset is only a fallback when the whole scenario is unreadable. Results show the revision they were built from, and comparisons are disabled while any entry is in review.

**5. Alternative and approval.** Keep the alternative as a distinct kind, not a receipt subtype. Approval scope is checkbox properties (`approved` plus `approvedProductIds`), because `validation.ts:116-119` and `:450-452` require both. This is also the simplest route to the required demo. Alternative authoring must be P0, but as a minimal form only.

**6. Field validation.** Validate each node payload with its own Zod schema using `safeParse`, returning field paths. Do not parse error strings from `parseDataset` and do not use regex. Missing numbers are `null`, never 0. Missing references are `null`, never a sentinel such as `"UNASSIGNED"`. Persist the typed text of invalid fields in a separate `drafts` map beside the valid document, so a refresh does not erase half-typed input.

**7. Hours.** Gemini's 51 is at the top of what is realistic, and Luna's 65–85 is not feasible. My revised plan is about 50 person-hours total. Dev A (document, compile, reconcile, provenance): about 16h. Dev B (canvas drag, inspector, list path, alternative form): about 17h. Dev C (shell, persistence, scenario review, e2e, copy): about 17h. Canvas drag connection stays required. A forms-only fallback is a scope reduction and must be reported as such.

**8. Vertical slice.** Build this by effective hour 6, before the alternative. Blank document, forms only: supplier, component (stock 8), receipt 5 on Nov 17, product (BOM 1), orders 6 on Nov 20 and 4 on Nov 22. Compile, run `simulate()`, then apply a receipt-delay override through the existing scenario controls. The second order must show shortage 2. This is the proof that disruption changes customer-order evidence. Verify first that the existing `ScenarioPanel` can set a receipt date; I have not checked that.

### Concrete visual-to-simulation failure example

The user drags a receipt connection in the canvas and reuses the ID `R-01`. The receipt originally supplied Servo (`CMP-SRV`). They retarget it to Controller (`CMP-CTL`) and keep `R-01`. The existing "receipt delay to Nov 23" override still matches `R-01`, so the motor shortage now delays controller supply. The Servo shortage disappears or changes, and the scenario looks valid. This is why the fingerprint check is required and cannot be left as a hope.

A second example: the user unticks "Industrial unit" on `ALT-01` but leaves the alternative active. If that is accepted, `parseScenario` throws at `App.tsx:314`. That is a crash, not a wrong number, and it must be prevented at the form, not caught at render.

### Revised decisions

- Canonical: FK records. Edges are derived. Drag and list call one reducer.
- Compile: all-or-nothing, with a separate readiness check.
- Alternative: distinct kind, checkbox scope, P0 minimal form.
- Scenarios: explicit review with fingerprints; no silent clamp, drop, or reset.
- Provenance: add `authored` and fix `kindFor` fall-through and `provenanceLabel`.

### Unresolved disagreements

- **Canvas drag as P0 versus fallback.** I want drag P0, built last. Gemini and Luna both treat the list path as the primary path. The brief asks for both, so this is a scope choice for the coordinator.
- **Draft persistence granularity.** Whether the `drafts` map ships in the first build is undecided. It costs about an hour and protects half-typed input.
- **Named scenarios.** Excluded from P0. The required demo uses one disruption scenario only.

### Risk ranking

1. Stale scenario or crash at `App.tsx:314` after a semantic edit.
2. Same-ID retargeting producing a plausible wrong shortage.
3. Compile gating ambiguity leading to silent omission.
4. Provenance label bug on all-authored datasets.
5. Canvas drag consuming time that the list path and forms need.

### Feasible cut line

Cut in this order, and report each cut to the user:

1. Named scenarios, auto-layout, undo (already excluded).
2. Canvas drag, leaving forms and the list path.
3. Draft persistence beyond export and import.

Do not cut: the compile gate, the alternative form, receipt-delay evidence, scenario review, or the `authored` label. If the vertical slice (effective hour 6) is not green, stop and cut before adding the alternative.

</details>

### Gemini 4 Hydrogen

Source: [DominoOS debate R2 — Gemini 4 Hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3A389aacc6-a653-4142-9f98-9f7a49c2fb81)

Provider: antigravity; requested model: gemini-4-hydrogen. Status: completed.

<details>
<summary>Actual participant output, preserved verbatim</summary>

## Cross-Examination of Round 1 Proposals

### Critique of Claude Haiku 5.5
1. **Layer-rank rule contradicts the required primary supplier edge:** Haiku proposes `supplier < receipt/alternative < component < product < order` and rejects any edge that "skips a layer." That rule immediately rejects `Supplier -> Component` (the required primary supplier relationship for `Component.supplierId` in [validation.ts:257-265](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L257-L265)), because `Supplier` skips `receipt/alternative` to reach `Component`. Connection validity must use an explicit `(sourceKind, targetKind)` allowlist, not numeric layer monotonicity.
2. **Silent exclusion of incomplete nodes corrupts simulation truth:** Haiku states that `compile(doc)` "excludes incomplete nodes" from the `Dataset`. Silently omitting an incomplete `Receipt`, `Order`, or `Component` produces a `Dataset` that passes `parseDataset()` and renders plausible-looking coverage numbers for a partial graph. Compilation must fail for the **entire** current graph when any node/edge is invalid or incomplete, retaining the last valid `compiledSnapshot` with an explicit stale/blocked indicator.
3. **Forms-first fallback and unrealistic 78h estimate:** Haiku budgets ~78 person-hours (26h/dev across ~30.7 wall hours) and suggests dropping canvas drag connections if Slice 1 slips. Canvas drag connection is a core requirement; shipping forms-only is a reportable scope reduction, not full P0 completion. Additionally, Haiku's per-table `"authored"` provenance and lossy `inventory` omission (treating missing `inventory` rows identically to `0` on round-trip) need correction.

### Critique of GPT-6 Luna
1. **65–85 person-hours is infeasible before Nov 14 20:00:** Luna budgets 22–28h per developer in ~30.7 wall hours, leaving zero realistic margin for sleep, merge conflicts, or E2E debugging. A candid ceiling is **~45–54 focused person-hours** (~15–18h/dev).
2. **Vague compiler/validator boundary:** Luna delegates validation to "Zod schemas in `validation.ts`" and "report graph validation errors before compilation," without solving the core integration problem: [`parseDataset()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L389-L397) throws a single formatted `Error` string capped at 20 lines (`MAX_REPORTED_PROBLEMS`), which cannot drive per-node, per-field inspector diagnostics without structured validation.
3. **Over-engineered per-node provenance & fuzzy scenario reconciliation:** Luna introduces per-node provenance (`authored | imported | example`) alongside per-table provenance, doubling provenance state with no engine consumer, and leaves scenario reconciliation vague ("mark the scenario as needing review") without specifying what happens when `App.tsx:314` calls `simulate(data, scenario)`—which calls `parseScenario()` and **throws** during render on stale IDs or bounds.

### Self-Critique & Revisions to Gemini 4 Hydrogen
1. **Auto-clamping scenarios silently alters user hypotheses (Revised):** In Round 1, I proposed clamping `Scenario.alternatives` quantity/date and pruning invalid overrides automatically. That was wrong: if a user authored a 5-unit recovery hypothesis and catalog capacity drops to 2, silently clamping to 2 changes the hypothesis without consent.
2. **Table-level provenance overwrite erases origin (Revised):** Overwriting an imported table's provenance to `"authored"` on a single edit hides that the rest of the table came from CSV/JSON. Provenance must track **imported vs. authored origin** accurately without erasing import history (e.g., `"mixed"` or table-level `"imported+authored"` / `"authored"` only for newly created tables).
3. **Too many edge kinds for alternative approval (Revised):** My Round 1 `alt_approved_product` edge adds unnecessary canvas clutter (`Alternative -> Product` crossing `Component -> Product` lanes). Product scope belongs as checkboxes in the `Alternative` inspector.
4. **Missing raw draft persistence:** Persisting only valid typed numbers/dates loses half-typed or invalid inputs on page refresh.

---

## Resolution of Coordinator Questions

### 1. Graph Document Model vs. Direct Dataset Editing
**Decision: Typed `GraphDocument` with explicit `nodes` and `edges`, compiled purely to `Dataset`.**
Direct `Dataset` editing *can* support React Flow drag connections via a reducer, so the objection is not that handles are impossible—it is **draft completeness and single-source integrity**. `parseDataset()` rejects missing `supplierId`, empty `Product.bom` (`bom.min(1)` at [validation.ts:84](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L84)), and unreferenced/incomplete fields. Direct `Dataset` editing forces sentinel FKs (`"UNASSIGNED"`) or relaxed schemas. Haiku's FK-array `GraphDocument` avoids an explicit `edges` array, but forces `Product.bom` and `Component.supplierId` to hold dangling/unvalidated strings during incremental wiring.
* **Rule:** `GraphDocument` stores `nodes` (with raw/draft-capable fields) and `edges` (as the **sole** representation of relationships). FK fields (`supplierId`, `componentId`, `productId`, `bom`) are **derived only** during `compileGraphToDataset(doc)`. Never store writable FKs on `GraphDocument` nodes alongside `edges`—that creates two writable representations of the same relationship.

### 2. Incomplete Nodes, Compilation Failure, and Blank vs. Simulatable State
* **All-or-nothing compilation:** `compileGraphToDataset(doc)` must validate the **entire** `GraphDocument` and return `{ ok: true, dataset } | { ok: false, issues: StructuredIssue[] }`. It never silently drops incomplete nodes.
* **Blank vs. Ready-to-Simulate:** Currently `parseDataset()` accepts an empty `Dataset` (`suppliers: []`, `orders: []`). Therefore, we must distinguish:
  1. `compilable` (passes `parseDataset()`, valid for save/export/import), from
  2. `simulatable` (`dataset.orders.length > 0`, ready for meaningful `simulate()` evidence).
  Simulate remains on the last valid `compiledSnapshot` when `ok: false`, displaying a persistent banner: *"Draft has N blocking issues — showing results from last valid snapshot."*

### 3. Exact Edge Allowlist, ID Collisions, and Inventory Round-Trip
* **Exact Allowlist (7 edge kinds, no numeric rank rule):**
  1. `primary_supplier`: `Supplier -> Component` (`1` per Component; maps to `Component.supplierId`)
  2. `ships`: `Supplier -> Receipt` (`1` per Receipt; `Delivery.supplierId`)
  3. `delivers`: `Receipt -> Component` (`1` Component per Receipt, many Receipts per Component; `Delivery.componentId`)
  4. `bom`: `Component -> Product` (`M:N`, unique `(Component, Product)` pair, `quantity >= 1` on edge; `Product.bom[]`)
  5. `fulfills`: `Product -> Order` (`1` Product per Order; `CustomerOrder.productId`)
  6. `alt_from`: `Supplier -> Alternative` (`1` per Alternative; `AlternativeSupply.supplierId`)
  7. `alt_for`: `Alternative -> Component` (`1` per Alternative; `AlternativeSupply.componentId`)
* **Realistic Visual-Connection -> Incorrect Simulation-Data Example:**
  Suppose a user connects `Supplier A -> Component Servo` (primary supplier) and `Supplier B -> Receipt PO-101 -> Component Servo`. If a buggy compiler derives `Delivery.supplierId` from `Component.supplierId` instead of the `ships` edge (`Supplier B -> Receipt PO-101`), `simulate()` allocates the receipt cleanly—no validation error!—but [`SupplyGraph.tsx:220-231`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/graph/SupplyGraph.tsx#L220-L231) and [`Allocation.supplierId`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/types.ts#L97) attribute the delivery and lateness flag to `Supplier A` instead of `Supplier B`.
  Second example: [`checkDataset()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L226-L255) checks ID uniqueness **per table**, not globally. If `Supplier` and `Component` both have ID `"X-01"`, keying React Flow nodes or edges by bare `"X-01"` causes edges to attach to the wrong node or silently collide. Every React Flow node ID and `GraphEdge` endpoint must use typed keys (`supplier:X-01`, `component:X-01`).
* **Inventory Absence vs. Explicit Zero:** `Component` payload stores `initialStock: number | null` (or `""` in draft). `null` (absent) compiles to **no row** in `Dataset.inventory`; `0` compiles to `{ componentId, quantity: 0 }`. While [`simulation.ts:84`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/simulation.ts#L84) treats both as `0` (`?? 0`), preserving `null` vs. `0` guarantees lossless `compile(decompile(dataset))` round-trip.

### 4. Scenario Reconciliation, Provenance, and Stale Result UI
Comparing policies:
* **Full-reset policy** (wiping scenarios on any Build edit) destroys valid disruption scenarios when a user merely renames a node or moves it on the canvas.
* **Silent auto-pruning/clamping** alters hypotheses behind the user's back.
* **Selected Policy — Fingerprint + Archived-Invalid / Explicit-Review Reconciliation:**
  * Compute a deterministic semantic fingerprint per entity (excluding `(x, y)` positions and display-only `name`/`region` renames).
  * **Layout/rename-only edits:** Zero scenario disruption; results remain valid.
  * **Same-ID retargeting** (e.g., `PO-101` changes `componentId` or `supplierId`; `ALT-01` changes `componentId`, `supplierId`, or removes a product from `approvedProductIds`), **reduced catalog cap** (`use.quantity > catalog.quantity`), **later catalog date**, **unapproval** (`approved: false`), or **deleted target:** Do **not** silently clamp or drop without record. Mark affected scenario(s) as `status: "needs_review"` with the exact conflict list, archive them out of active `simulate()` (falling back active Simulate to `NORMAL_SCENARIO` so [`App.tsx:314`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx#L314) never throws), and offer one-click **"Rebase/Prune to current data"** or **"Discard scenario"** in the UI.
  * **BOM / Order edits:** Do not invalidate `Scenario` schema, but change simulation outcomes; clear cached `SimulationResult` and recompute only when Simulate is active or re-compiled.
  * **Provenance:** Extend [`DatasetSource`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/types.ts#L73) to `"fictional" | "imported" | "authored"`. Starting blank sets all tables `"authored"`; importing sets replaced tables `"imported"`; editing a `"fictional"` table marks it `"authored"`, while editing an `"imported"` table preserves `"imported"` if untouched or marks `"mixed"` at the dataset level via `kindFor()` without erasing which tables were imported.

### 5. Alternative Node Kind, Product Scope, and P0 Promotion
**Decision: Distinct `alternative` node kind; product scope via inspector checkboxes; Alternative authoring promoted to P0.**
`AlternativeSupply` has distinct schema rules (`approved`, `approvedProductIds.min(1)`, catalog-bounded scenario activation) vs. `Delivery` (unconditional baseline). Making it a specialized receipt subtype forces discriminated payloads everywhere for zero gain. Render it as a distinct node with dashed ink borders (`alt_from` and `alt_for` edges), and manage `approvedProductIds` via **checkboxes** in the Alternative inspector (defaulting to connected/existing products, preventing unchecking the last product or flagging it as a compile error). Because the required motor proof cannot pass from a blank canvas without creating and approving an alternative, **Alternative authoring + approval scoping is P0**.

### 6. Structured Field/Domain Validation & Incomplete Draft Persistence
Do **not** regex-parse `parseDataset()` error strings. Refactor [`validation.ts`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts) to expose `validateDatasetStructured(data): ValidationIssue[]` (`{ entityKind, entityId, field, message }`), and have `parseDataset()` call it and format the thrown `Error` for backwards compatibility.
* Keep raw string/draft values in `GraphDocument` node/edge fields (e.g., `quantityDraft: string`) alongside parsed numbers, or store `GraphNode.data` with stringly-typed form inputs validated by `compileGraphToDataset()`.
* Never coerce missing numeric fields to `0` or missing FKs to sentinels.
* Persist the full `GraphDocument` (including invalid/incomplete text) + `lastValidDataset` + `archivedScenarios` in versioned `localStorage` so a browser refresh mid-edit restores the exact workspace without crashing startup.

### 7. Realistic Effort, Deadline, and Required Canvas Drag
**Candid Assessment:** Against ~30.7 wall hours (Nov 13 13:20 -> Nov 14 20:00 Vilnius), **~45–51 focused person-hours (~15–17h per developer)** is the realistic maximum with sleep and integration. Luna's 65–85h and Haiku's 78h will miss the deadline.
* **Canvas drag connection is mandatory P0** on desktop (`onConnect` + `isValidConnection` in React Flow), paired with the narrow (`<= 720px`) list-based connection UI calling the same `connectEdge()` action. If canvas drag were ever dropped, it would have to be explicitly reported as a scope cut, not a full pass.

### 8. Critical First Vertical Slice (First 4–6 Effective Hours)
The first vertical slice (by **Nov 13, 19:30**) must prove the **disruption-to-order-evidence loop**, not just a pretty editor or all-covered baseline:
1. Blank workspace -> create Supplier, Component (with stock), Receipt, Product (BOM), Order -> connect on canvas -> compile to `Dataset`.
2. Switch to Simulate -> delay Receipt past Order date -> [`simulate()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/simulation.ts#L17) reports `at-risk` Order with exact `shortage` and `lateDeliveries` evidence.
* **Stop/Go Gate (19:30):** If this loop fails, freeze all styling/P1 work and fix the compiler/Simulate boundary before proceeding.

---

## Summary: Risk/Value Ranking & Feasible Cut Line

1. **Unresolved Disagreements:** None on core architecture—all three proposals converge on `GraphDocument` -> deterministic `Dataset` compilation. Remaining tension is strictly scope discipline (keeping `alt_approved_product` out of canvas edges and keeping P1 out of the critical path).
2. **Risk/Value Ranking (Highest Priority First):**
   - **R1 (Critical):** Structured validation + whole-graph compile gate + `localStorage` raw-draft persistence (prevents silent partial simulation and refresh crashes).
   - **R2 (Critical):** Safe scenario reconciliation (`needs_review` archive vs. silent clamping) + `App.tsx` error-safe `simulate()` boundary.
   - **R3 (High):** Shared `connectEdge()` controller powering both React Flow `onConnect` and narrow-screen list UI.
   - **R4 (Medium):** Existing [`judge-journey.spec.ts`](file:///Users/dominykas/Development/unfair-wknd-26/tests/judge-journey.spec.ts) copy regressions (`"Data is not saved between sessions"`).
3. **Feasible Cut Line (~48h total):**
   - **IN (P0):** Blank/example start; 6 node kinds (including Alternative authoring/approval); 7 validated edge kinds via canvas drag + narrow list UI; inspector with field-level errors & initial stock; whole-graph compiler + last-valid snapshot; safe scenario review/archive; `localStorage` draft restore + JSON export/import; `"authored"` provenance; motor recovery E2E proof.
   - **CUT / DEFERRED (P1/P2):** Named custom scenario CRUD, rich deletion impact modal (use simple confirm + dependent count), auto-layout, undo/redo, multi-level BOMs.

*(All tests and checks referenced—unit round-trip, reconciliation, and Playwright E2E—are proposed and unrun; baseline `npm test` status of 60 passing in 5 files is taken from the coordinator's report.)*

</details>


## Round 3 — Final revisions and remaining disagreement

### GPT-6 Luna

Source: [DominoOS debate R3 — GPT-6 Luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3Ab676fd8e-a8fc-4965-8e69-abf043f1d5e7)

Provider: codex; requested model: gpt-6-luna. Status: completed.

<details>
<summary>Actual participant output, preserved verbatim</summary>

## Revised proposal

### Criticisms and decisions

- **Haiku: FK-backed records can still support drag connections. ACCEPT.** A reducer can translate a connection into a relationship edit, so FK-backed records do not inherently force sentinel IDs or block canvas authoring. I reject Gemini’s claim that FK-backed editing “forces” sentinels. The real tradeoff is which representation is canonical and how incomplete input persists.
- **Haiku and Gemini: explicit edges alongside relationship fields create two writable homes. ACCEPT.** My Round 1 proposal was ambiguous here: it named nodes and edges, but also described node payloads and alternative scope in ways that could duplicate relationships. Revised design: explicit edges are the sole stored representation of relationships. Node payloads omit supplier, component, product, and BOM relationship fields. Alternative product scope is the specified exception: `approvedProductIds` lives once on the alternative node and is edited with inspector checkboxes; there are no product-scope edges.
- **Haiku and Gemini: incomplete records must block the whole compile. ACCEPT.** Excluding incomplete records could produce plausible results from a different plan than the visible graph. Compilation is all-or-nothing across all current nodes and edges. Invalid visible raw input blocks compiling even if an earlier typed value was valid.
- **Gemini: the alternatives’ product scope should not be a canvas edge. ACCEPT.** Keep a distinct alternative semantic kind and reuse receipt form/view code where practical. Scope stays explicit in checkboxes. Empty scope is visibly invalid even when unapproved; a valid, unapproved alternative may be saved if it has nonempty scope, but cannot be activated. The validator checks nonempty scope, while scenario parsing checks approval. Neither creates blanket product eligibility.
- **Gemini: provenance needs mixed-source handling. ACCEPT, with bounded scope.** Accurate row-by-row lineage would add substantial complexity. Use a workspace sidecar containing a set of origins per table: `fictional`, `imported`, and `authored`. On edit, union `authored` into the table’s origins without erasing prior origins. CSV replacement makes that table `imported`; product CSV replacement unions prior product origins because imported products inherit BOM data. Full Dataset JSON cannot establish original history, so mark it locally `imported`; preserve richer origin only in a versioned workspace envelope. Describe this as conservative table history, not per-row provenance or authenticity.
- **Gemini Round 2: existing imported data may omit inventory. ACCEPT.** Preserve absence when compiling imported workspaces: `null` means no inventory row, while an empty stock field on a newly authored required component means incomplete and blocks compilation. Explicit zero compiles as a row with quantity zero. This retains valid imports without treating a blank new form as zero.
- **Haiku: avoid silent scenario pruning or clamping. ACCEPT.** Reconciliation must preserve hypotheses and require explicit review. However, I revise my earlier per-entity fingerprint proposal: per-target fingerprints and partial automatic rebasing add machinery and ambiguity within this deadline.
- **Haiku’s critique of Gemini: approved-product removal and coverage behavior need precision. ACCEPT.** Removing one product from `approvedProductIds` can remain Dataset-valid if other products remain; `parseScenario` does not test scope against a particular order. Simulation may simply allocate only to eligible products and leave a shortage. Unapproval does fail scenario parsing on activation. Therefore review must detect changed scope; it must not claim every such edit causes a parser failure.
- **Gemini: direct editing can use a reducer without schema weakening. ACCEPT.** This is a fair comparison, and my Round 1 framing of it as a poor fit was too categorical. Both architectures can support drag and raw drafts.
- **Gemini: “no remaining disagreements” is inaccurate. REJECT.** FK-backed canonical records versus explicit canonical edges remains a genuine architecture choice. Table-origin sets versus row-level lineage also remains unresolved; this proposal chooses table-origin sets for schedule reasons.

### Concrete design

Use a versioned `Workspace` with stable, typed nodes, explicit typed edges, raw inspector drafts, provenance sidecar, and saved scenarios. React Flow positions and viewport are presentation state. Edge IDs are stable; node keys include kind because Dataset IDs are unique per table, not globally.

Node payloads contain business values only. Edges encode:

- Supplier → Component: one primary supplier per component.
- Supplier → Receipt → Component: one supplier and component per receipt; multiple receipts per component.
- Component → Product: one BOM line per component/product pair; positive quantity on the edge; multiple components per product.
- Product → Order: one product per order.
- Alternative: distinct node with supplier/component identity, quantity/date, approval, and nonempty `approvedProductIds` scope stored once in its payload.

Connection validation uses an exact endpoint-kind allowlist, cardinality and duplicate checks, endpoint existence, and a cycle guard. Both canvas drag and narrow list-based connection call the same reducer. Node deletion is a transaction that previews dependent nodes/edges, removes accepted dependencies, updates alternative scopes, and sends affected scenarios to review. If the result would leave invalid alternative scope or dangling required relationships, require the user to repair or remove those records before commit.

For raw fields, choose the minimal canonical raw draft: user-editable string values (including number/date text) live in the workspace and parse only during whole-document compilation. This avoids a valid typed value plus a second raw overlay that could disagree. On compile, parse every current node and edge, then build Dataset and pass it through existing `parseDataset()`. Invalid raw input is retained through save/reload and blocks compilation; never compile a prior typed value hidden behind invalid text. Imported absent inventory remains absent as above.

Import is transactional: parse the complete candidate workspace or Dataset bundle, validate/compile it, then replace the active document only on success. Export a versioned workspace envelope to preserve drafts, scenarios, and richer provenance; Dataset JSON export may remain an explicit data-only export. `simulation.ts` remains the engine boundary.

### Scenario integrity, results, and prioritization

Use one whole-network allocation-input fingerprint, excluding positions, names, SKU, region, and lead time; include demand, relationships, dates, stock, approval, caps, and order value. After any allocation-input edit, mark every saved nonbaseline scenario `needs_review`, preserving its hypotheses unchanged. Require explicit **Revalidate and use** through `parseScenario()` against the newly compiled Dataset. Show before/after semantic changes, especially same-ID retargets. Deleted targets require editing or removing their scenario entries; never silently clamp, prune, or reactivate old targets.

This is simpler than per-target fingerprints and partial automatic rebase, while conservatively surfacing all potentially affected hypotheses. It may ask users to revalidate unaffected scenarios after an unrelated allocation edit; that is an accepted MVP cost. Name-only edits refresh visible labels but do not stale scenarios. While the graph is invalid, simulation is unavailable or clearly shown as results from the old snapshot only; never present them as current under the editable Build label. Invalidate derived results and comparisons on semantic changes.

Ranked by combined technical risk and user value:

1. **P0, highest:** blank workspace, node creation, canvas and narrow-list connections, inspector, raw drafts, deterministic compile, and invalid-graph gating.
2. **P0:** actual receipt disruption to order shortage evidence, plus alternative authoring/approval/scope and recovery. The required recovery journey promotes this narrow alternative capability from P1 to P0.
3. **P0:** save/restore, transactional import/export, provenance sidecar, and semantic scenario review. These complete recovery and protect authored work.
4. **P1:** named scenario CRUD and comparisons while retaining the three existing preset comparisons. Deletion warnings should be included in P0 only at a simple transactional confirmation level.
5. **P2:** auto-layout, undo/redo, collaboration, backend sync, richer row-level provenance, multi-level BOMs, and other simulation engines.

### Risks, integration, schedule, and proof

Five greatest risks: incorrect edge-to-Dataset mapping producing plausible false results; same-ID retargeting leaving stale hypotheses; invalid raw forms silently compiling old values; import/deletion transactions losing references or work; and integrating canvas, narrow list, compile state, and scenario review under one consistent state owner. The largest integration problem is that single state transition: graph edit, compilation, scenario review status, and result invalidation must be atomic from the user’s perspective.

First integrated gate is within **4–6 effective hours**: from a genuinely blank workspace, create and connect at least one edge through the actual UI, compile to Dataset, delay the receipt to November 23, and show the second order short by 2. No seeded Dataset shortcut. Then build out the complete motor journey: as of Nov 13, Aster Manufacturing, servo stock 8, receipt 5 on Nov 17, industrial unit BOM 1, orders 6 on Nov 20 and 4 on Nov 22; delay leaves shortage 2, and an explicitly approved alternative of 2 available Nov 18 covers both. The full browser journey from blank is mandatory by the second gate; canvas drag and local restore remain P0.

Named scenarios and rich comparison work are the first cuts if the gate slips. Do not claim completion if canvas drag or local restore is cut. Run automated compiler/cardinality/transaction/reconciliation tests and a browser test from blank through disruption and recovery; human checks should rehearse the laptop journey and narrow list-based creation. These are proposed checks, not executed results.

Estimate **about 52–60 person-hours**: compiler/validation/state 15–18; graph UI and forms 15–18; app integration, persistence, scenarios, tests and rehearsal 22–24. Parallel work is feasible only after agreeing on document and reducer interfaces. One developer owns compiler, validator, and fingerprint; one owns graph/inspector using that interface; one owns app shell, persistence, and end-to-end integration. **Conditional feasibility: no, not as a comfortable commitment.** At the stated deadline, 52–60 focused hours leaves little time for sleep, integration, and debugging across three people. A working demo is possible if the first gate passes, P1/P2 stay out, and the interface stabilizes immediately; otherwise the required blank-to-recovery proof is at high risk.

</details>

### Claude Haiku 5.5

Source: [DominoOS debate R3 — Claude Haiku 5.5](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3Afef99b36-48fb-4310-97dc-00054425f01b)

Provider: claudeAgent; requested model: claude-haiku-5-5. Status: completed.

<details>
<summary>Actual participant output, preserved verbatim</summary>

I stopped at plan approval, so the Round 3 proposal below is my full answer. The only file I wrote is the plan file at `/Users/dominykas/.claude/plans/act-as-the-review-splendid-seahorse.md`, which plan mode required. I made no repo edits, ran no tests, and spawned no agents. Every test and timing below is proposed, not run.

## Position changes and decisions

1. **Canonical store: explicit typed edges, not FK-backed records.** This reverses my Round 2 position. The brief asks for typed edges and for rejecting duplicate and cyclic edges before they are accepted. That wording describes an edge store, not FK fields. Node payloads omit supplier, component, product, and order references and BOM lines. The one exception is alternative `approvedProductIds`, stored once as inspector checkboxes.
2. **Fair comparison.** Neither design needs sentinels, because both can use nullable draft slots. The real difference is where cardinality is enforced. FK slots enforce single-valued relations by type. Edges need one `canAddEdge` function that checks uniqueness per kind. I accept this costs about 1.5 extra hours, and the edge store matches the brief's acceptance language.
3. **Draft policy: raw strings in the canonical document.** Scalar fields are stored as typed strings. Compile parses them, so invalid text saves and reloads losslessly with no overlay to keep in sync. An authored new field left blank is `""`, which blocks compile. Imported absent stock is `null`, which compiles to no inventory row and is treated as 0 by `simulation.ts:84`. Imported absence stays valid.
4. **Compile gate.** Compile covers the whole document. Every node and edge must validate before any Dataset is produced. Simulate shows the last valid snapshot, read-only, with a stale banner and its revision. No editable simulation appears under the Build label.
5. **Alternative.** A distinct kind, sharing receipt form and view code. No product-scope edges. Empty scope blocks compile even when the alternative is unapproved, because `validation.ts:117-119` requires at least one product. Approved=false with non-empty scope is valid but cannot activate (`validation.ts:450`). Creating an alternative never auto-approves or auto-scopes.

## Scenario policy

- Store `ScenarioRecord { scenario, boundFingerprint, targetSnapshots }`. The `Scenario` type stays unchanged.
- The fingerprint is a hash of the compiled allocation inputs: asOf, component supplier, BOM, inventory, deliveries, orders including value, alternatives including approval and scope. It excludes names, region, unit, SKU, lead time, and positions.
- When the fingerprint changes, every saved non-baseline scenario becomes `needs_review`. Those scenarios cannot activate.
- Revalidate runs `parseScenario` and diffs each entry against its snapshot. Same-ID retargets show as before/after. Keep and Remove are per entry. A deleted target allows only Remove.
- No automatic clamp, prune, or fallback. Partial automatic rebase is rejected for MVP.

## Provenance

Per-table source sets in a sidecar. Import replaces the listed tables with `imported`, and a product CSV retains the prior product sources for its BOM. A JSON import marks tables locally as imported and does not claim authenticity. Fix the `kindFor` fall-through and add `authored`. Record-level lineage costs about 6 hours and is rejected for MVP.

## Criticisms of my proposal (by model and claim)

**Luna (gpt-6-luna), Round 2**
- *"A reducer can update canonical FKs; no second writable store is needed."* **ACCEPT.** My Round 1 claim that direct editing gives only dropdowns was overstated.
- *"Compile must fail for the whole document, not omit incomplete nodes."* **ACCEPT.** Already in my Round 2 revision.
- *"The layer-rank rule contradicts Supplier→Component; uniqueness is per table."* **ACCEPT.** Replaced by an explicit allowlist, with per-table IDs.
- *"Blocking most deletions is wrong; use a confirmed transaction."* **ACCEPT** the confirmed transaction. **REJECT** blocking. If removing a product leaves an alternative with no approved products, the same transaction must remove that alternative too, or the user must edit it first.
- *"Table-level provenance loses mixed origin."* **ACCEPT** the loss. **REJECT** per-record lineage for MVP; source sets are the bounded fix.

**Gemini (gemini-4-hydrogen), Round 2**
- *"Layer-rank rejects Supplier→Component."* **ACCEPT.**
- *"Silent exclusion of incomplete nodes corrupts simulation truth."* **ACCEPT.**
- *"78 hours is unrealistic and forms-only is a cut."* **ACCEPT.** I now treat canvas drag as P0.
- *"Haiku's FK arrays force dangling strings."* **REJECT.** Dropdowns over existing IDs with nullable slots avoid dangling IDs. **ACCEPT** the narrower point that absent must be `null`, not 0.
- *"Table-level authored overwrite erases origin."* **ACCEPT.**
- *"ScenarioPanel.tsx:598 keys on data.name + scenario.id."* **Not found** in the file. I am setting this claim aside.

## Verified facts

- Removing one product from `approvedProductIds` is Dataset-valid and does not throw. Affected orders show shortage, because `simulation.ts:104-109` filters by product.
- `parseScenario` does not check coverage against a particular order.
- Unapproval after activation throws inside `App.tsx:314`. Gating must prevent this, and a try/catch is the backstop.
- The motor brief omits required fields: order customer and value, product SKU, component unit, supplier lead time. The e2e must enter them. Region and lead time can default because they are informational, and simulate does not read lead time.

## Priorities, risk and value

| Task | Risk | Value | Owner | Person-hours |
|---|---|---|---|---|
| Types, raw parse, compile, edge rules, golden mapping tests | High | High | A | 8 |
| Fingerprint, review records, Keep/Remove | High | High | A | 3 |
| Provenance sidecar, label fixes, provenance tests | Low | Medium | A | 2.5 |
| Canvas drag connect, palette, `isValidConnection` | Medium | High | B | 7 |
| Narrow list connection path | Medium | High | B | 3 |
| Inspector forms incl. alternative checkboxes, deletion confirm | Medium | High | B | 7 |
| Build/Simulate shell, blank/example start, stale gating, try/catch | High | High | C | 4 |
| Scenario review UI | Medium | High | C | 3 |
| localStorage envelope, transactional JSON import/export | Medium | Medium | C | 3 |
| E2E blank→motor (desktop + narrow), judge copy | Medium | High | C | 4 |
| Integration and buffer | — | — | shared | 4 |

**Total is about 50 person-hours.** That is roughly A 15, B 17, C 18 including buffer.

**Cut to P1:** named scenario CRUD (about 5h), comparisons beyond existing presets (about 3h), rich deletion modal (about 2h), record-level provenance (about 6h). Presets stay, filtered to the current workspace, because `App.tsx:310-313` runs them on every data change.

## Gates and sequencing

- **G0, about 15:30 Nov 13:** shared types, compile contract, and edge rules merged. No UI yet.
- **G1, about 19:00 Nov 13 (effective hour 5):** from blank, forms create the nodes. One canvas drag and list connections wire the rest. Compile succeeds. Simulate with the receipt moved to Nov 23 shows order 2 at-risk with shortage 2. **Stop/go:** if G1 fails, freeze visuals and ship the list path only, reported as a scope reduction.
- **G2, about 11:00 Nov 14:** alternative authoring, activation, recovery to covered, and reload restore, all in one automated blank-to-recovery run.
- **G3, about 16:00 Nov 14:** export/import, narrow test, judge copy updated. Code freeze at 17:30.

## Deadline verdict

**Conditional yes** for the minimal P0 path above, if G1 passes by about 19:30 Nov 13 and P1 is cut. **No** for the full brief including named scenario CRUD, rich deletion, and record-level provenance. My judgment is that full P0 by 20:00 with no slack is about a coin flip.

## Remaining disagreements (no consensus claimed)

- **Raw canonical strings versus typed fields with a separate draft overlay.** Luna and my Round 2 drafts-map proposal disagree with this. I chose raw strings to remove the overlay sync risk.
- **Whole-network fingerprint versus per-entity fingerprints.** Gemini's Round 2 position differs. I chose whole-network for simplicity, accepting extra review after unrelated edits.
- **Record-level provenance.** Luna and Gemini want it. I reject it for MVP.
- **Canvas drag as P0.** I hold it, with list parity as acceptance. Haiku's Round 2 position puts drag last, which is a sequencing disagreement.

## Checks

- **Automated (proposed):** golden compile mappings on demo and motor, edge rejection, null versus `""` stock, transactional import, fingerprint change on semantic edits and not on rename or position, same-ID retarget diff, blank-to-recovery Playwright run at desktop and narrow widths.
- **Human:** one person does a cold walkthrough of the motor example without seeded data.

</details>

### Gemini 4 Hydrogen

Source: [DominoOS debate R3 — Gemini 4 Hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3Aa6b264aa-38f5-4370-948e-b11e8b5d4aed)

Provider: antigravity; requested model: gemini-4-hydrogen. Status: completed.

<details>
<summary>Actual participant output, preserved verbatim</summary>

# Round 3 Final Revised Proposal & Disagreement Review — Gemini 4 Hydrogen

**Scope:** Plan-only review. No files, git state, or tests were modified or run. All code references were verified directly in the repository.

---

## 1. Responses to Round 2 Criticisms (Accept / Reject)

### From GPT-6 Luna (`gpt-6-luna`)
1. **Direct `Dataset` editing "forces" sentinels is a false constraint.** — **ACCEPT.** My R1/R2 framing was contradictory: once a reducer + draft overlay sits in front of `Dataset`, direct `Dataset` editing *can* support React Flow `onConnect` without sentinel foreign keys. The real architectural trade-off is **thin FK-backed draft records** (Haiku) vs. **explicit-edge `GraphDocument`** (Luna/Gemini).
2. **Silent scenario clamping/dropping mutates user hypotheses.** — **ACCEPT.** I retracted auto-clamping in R2; in R3 I replace per-target auto-rebase with whole-network semantic fingerprinting and explicit user revalidation.
3. **Marking an entire table `"authored"` on edit erases `"imported"` / `"fictional"` origin.** — **ACCEPT.** A single-enum overwrite misrepresents mixed tables. Replaced below with a conservative per-table source **SET** sidecar.
4. **P0 alternative authoring must be in the first vertical slice, not Hour 20.** — **PARTIALLY ACCEPT / REJECT TIMING.** I accept that alternative authoring is P0 and cannot wait until Hour 20, but **reject** putting it in Gate 1 (4–6 effective hours). Gate 1 must prove `blank -> UI connect -> compile -> receipt delay -> short order (2 units)` first; alternative authoring + recovery follows immediately in Slice 2 (Hours 6–12).

### From Claude Haiku 5.5 (`claude-haiku-5-5`)
5. **Dual representation of `supplies` edge + `Component.supplierId` in R1.** — **ACCEPT** (fixed in R2, codified in R3). An explicit-edge `GraphDocument` **must omit** relationship FK/BOM fields from node payloads, storing them solely in `edges` (except `approvedProductIds` on `alternative` nodes).
6. **Undefined compile gating vs. live `simulate()` cost (`App.tsx:310-314`).** — **ACCEPT.** `compileGraphToDataset()` runs on Build commit/compile, while `simulate()` (including `presets.map`, `tippingPoints()`, and `receiptExposure()`) runs only when Simulate is active or explicitly requested—never on raw keystrokes.
7. **Unverified `ScenarioPanel.tsx:598` key claim.** — **ACCEPT.** Re-reading [`ScenarioPanel.tsx:535-620`](file:///Users/dominykas/Development/unfair-wknd-26/src/components/scenarios/ScenarioPanel.tsx#L535-L620) confirms line 598 is `const candidate: Scenario = { ... }` inside `AlternativeSection`, not a React `key` prop. I retract that citation.
8. **False "no remaining disagreements" claim in R2.** — **ACCEPT.** FK-backed vs. explicit-edge `GraphDocument`, raw-draft representation, provenance granularity, and scenario fingerprint scope remain genuinely contested.

---

## 2. Criticisms Returned to Original Authors

* **To Haiku (FK-backed `GraphDocument` & single-enum provenance):**
  1. Storing FKs/BOMs on node payloads forces `onConnect` and inspector forms to mutate nested arrays (`product.bom[]`) and string FKs directly, then reconstruct visual edges on every render. Explicit edges keep visual wiring and edge metadata (`bom.quantity`) first-class in one array.
  2. Haiku's R2 single-enum `"authored"` provenance still overwrites `"imported"` on a single edit and cannot represent [`App.tsx:382-383`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx#L382-L383) (`retainedProductBoms` where imported product names/SKUs keep fictional/prior BOMs).
* **To Luna (per-node provenance & per-target scenario rebase):**
  1. Per-node provenance (`authored | imported | example`) plus per-target scenario rebase adds schema, UI, and test surface that exceeds a ~45–51h budget without changing simulation correctness.
  2. Luna's R2 still leaves raw invalid draft persistence (`""` vs. `null` vs. `"abc"`) and `kindFor()` fall-through in [`provenance.ts:8-14`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/provenance.ts#L8-L14) underspecified.

---

## 3. Revised Concrete Implementation Design

### A. Canonical Model: Explicit-Edge `GraphDocument` (vs. FK-Backed Draft)
* **Fair Comparison:** Both Haiku's sole FK-backed draft records and Luna/Gemini's explicit-edge `GraphDocument` support React Flow drag (`onConnect`), narrow list UI, and incomplete drafts without sentinels. Explicit-edge `GraphDocument` wins for a visual graph builder because edges are first-class (`{ id, kind, source, target, quantity? }`), BOM quantity lives natively on `bom` edges, and deletion/retargeting checks inspect `edges` directly without scanning every node payload.
* **Strict Single-Source Rule:** Node payloads **omit** `supplierId`, `componentId`, `productId`, and `bom`. Only `alternative` nodes store `approvedProductIds: string[]` once as inspector checkboxes (no product-scope canvas edges).
* **7 Allowed Edge Kinds:** `primary_supplier` (`Supplier->Component`, 1 per component), `ships` (`Supplier->Receipt`, 1 per receipt), `delivers` (`Receipt->Component`, 1 per receipt, many per component), `bom` (`Component->Product`, M:N unique pair, `quantity` on edge), `fulfills` (`Product->Order`, 1 per order), `alt_from` (`Supplier->Alternative`, 1 per alt), `alt_for` (`Alternative->Component`, 1 per alt). Reject disallowed pairs, duplicates, and cycles before commit.

### B. Raw Draft Representation & Validation Policy
* **Choice: Minimal Canonical Raw Draft** (string number/date fields inside `GraphDocument`, parsed only at compile) over valid-typed-fields + separate raw overlay.
  * *Why:* A single raw-draft shape eliminates dual-state drift between typed values and a sidecar overlay, guarantees invalid raw text (e.g., `"abc"`, `""`, `"2026-13-99"`) saves/restores across `localStorage` reloads, and makes it **impossible** to accidentally compile stale last-valid typed numbers when visible raw input is invalid.
* **Whole-Graph Compile Gate:** ALL current nodes and edges must validate in `compileGraphToDataset(doc)` via structured Zod/cross-ref checks returning `{ ok: true, dataset } | { ok: false, issues }`. Incomplete or invalid nodes **never** get silently omitted.
* **Inventory `null` vs. `""`:** In [`simulation.ts:84`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/simulation.ts#L84), absent `inventory` rows default to `0` (`?? 0`), and [`validation.ts:281-291`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L281-L291) allows omitted rows. Therefore, `initialStock: string | null`:
  * `null` = absent inventory row (preserved from valid CSV/JSON imports; compiles to no `inventory` row, keeping imports usable).
  * `""` = incomplete user-cleared stock input on an authored/edited component (blocks compile with a field error until filled with `"0"` or positive integer).

### C. Alternative Node Kind & Verified Engine Semantics
* **Distinct `alternative` semantic kind** (sharing receipt form/view components where appropriate), with `approved: boolean` and `approvedProductIds: string[]` edited via inspector checkboxes (no product-scope edges, never implicitly approved or scoped to all products).
* **Verified Code Facts:**
  * Empty `approvedProductIds` fails [`alternativeSchema`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L117-L120) (`min(1)`), so it is **visibly invalid** even when `approved: false`.
  * `approved: false` with non-empty `approvedProductIds` is `Dataset`-valid, but fails [`parseScenario()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L450-L454) on activation.
  * Removing one product from `approvedProductIds` while others remain is `Dataset`-valid, and [`parseScenario()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts#L404-L475) does **not** check coverage scope against orders. [`simulate()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/simulation.ts#L107-L108) simply allocates only eligible products, which may produce a shortage without throwing.

### D. Simplest Safe Scenario Policy Within Budget
* **Choice: Whole-Network Allocation-Input Fingerprint** vs. per-target fingerprint + partial automatic rebase.
  * *Why:* Per-target diffing + partial rebase adds complex edge cases for ~45–51h. Instead, compute a canonical `allocationFingerprint` over `asOf`, `components` (IDs, `supplierId`), `inventory`, `products` (BOMs), `deliveries` (IDs, `supplierId`, `componentId`, `quantity`, `availableDate`), `orders` (IDs, `productId`, `quantity`, `requiredDate`, `value`), and `alternatives` (`supplierId`, `componentId`, `quantity`, `availableDate`, `approved`, `approvedProductIds`).
  * **Excluded from fingerprint:** canvas `(x, y)` positions, display `name`, `sku`, `region`, and `leadTimeDays` (unread by `simulation.ts`). Display labels in Simulate refresh automatically on name-only edits without staling scenarios.
  * **On allocation-input change:** Every saved non-baseline scenario transitions to `status: "needs_review"` with its hypotheses preserved unchanged and a before/after semantic diff (explicitly surfacing same-ID retargeting, e.g., `PO-101` changing `componentId`). Active Simulate falls back to baseline `NORMAL_SCENARIO` so [`App.tsx:314`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx#L314) never throws.
  * **Explicit Revalidation:** User clicks **"Revalidate & use"** (runs `parseScenario(nextDataset, scenario)` and requires confirmation if targets retargeted; deleted/unapproved targets block reactivation until edited/removed). **Zero automatic pruning, clamping, or fallback labelled as the old scenario.**
  * **On Graph Invalidity:** Simulate displays the **last valid compiled snapshot** as read-only with a persistent *"Draft has N issues — showing last valid snapshot"* banner (or hides results if none exists yet). Never show an editable old simulation under the current Build label.

### E. Provenance Strategy (Conservative Per-Table Source SET)
* Existing [`DatasetSource`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/types.ts#L73) (`"fictional" | "imported"`) and [`kindFor()`](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/provenance.ts#L8-L14) cannot represent authored rows, mixed tables, or retained BOMs (`retainedProductBoms` in [`App.tsx:382-383`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx#L382-L383)).
* **Design:** Maintain a workspace sidecar `Record<DatasetTable, Set<"fictional" | "imported" | "authored">>`:
  * Blank workspace initializes all tables to `Set(["authored"])`.
  * Build edits union `"authored"` into the touched table's set without erasing `"imported"` or `"fictional"`.
  * CSV import replaces touched table sets with `Set(["imported"])`, **except** `products.csv` when `retainedProductBoms` is true—which unions `Set(["imported"])` with prior `products` sources.
  * Full Dataset JSON import cannot prove external origin, so mark `Set(["imported"])` locally; preserve the richer source SET only inside the versioned workspace envelope (no authenticity claim).
  * *Trade-off:* Bounded MVP cost (~2h) vs. per-row forensic lineage (~8–10h).

### F. Scope & P0/P1 Cut Line
* **P0 (Mandatory):** Blank/example start; 6 node kinds (including narrow `alternative` authoring + `approvedProductIds` checkboxes); 7 validated edge kinds via **canvas drag** (`onConnect`) AND **narrow (`<= 720px`) list-based connection UI**; inspector with raw draft preservation & field errors; whole-graph compiler + last-valid snapshot; whole-network fingerprint + `needs_review` scenario gate; existing 3 preset comparisons (`presetsFor`, [`App.tsx:310-313, 403-407`](file:///Users/dominykas/Development/unfair-wknd-26/src/App.tsx#L310-L313)); `localStorage` draft restore + JSON export/import; per-table source SET provenance; motor example E2E proof from blank.
* **P1 (If ahead at Hour 14):** Named custom scenario CRUD + comparison table (~5h: `savedScenarios[]` in workspace envelope, save/rename/delete actions in `ScenarioPanel`, dynamic comparison columns alongside presets).
* **Excluded (P2):** Auto-layout, undo/redo, per-row provenance, partial scenario auto-rebase, multi-level BOMs, backend sync.

---

## 4. Remaining Disagreements (Unresolved)
1. **Explicit-edge `GraphDocument` (Luna/Gemini) vs. sole FK-backed draft records (Haiku).**
2. **Minimal raw string draft (Gemini) vs. typed document + raw overlay (Luna/Haiku).**
3. **Whole-network allocation fingerprint (R3 proposal) vs. per-target fingerprint (Haiku/Luna R2).**
4. **Conservative per-table source SET sidecar vs. per-node provenance (Luna) vs. single-enum `"authored"` (Haiku).**

---

## 5. Risk & Value Ranking + Sequencing

### Top Tasks Ranked by Technical Risk × User Value
1. **[Critical Risk / Critical Value]** Raw-draft `GraphDocument`, explicit-edge allowlist/cycle guard, and structured `compileGraphToDataset()` + `null` vs `""` inventory handling.
2. **[Critical Risk / High Value]** Whole-network `allocationFingerprint` + `needs_review` scenario gate + error-safe `App.tsx` Simulate boundary (prevents `App.tsx:314` crashes and stale lies).
3. **[High Risk / Critical Value]** Shared `connectEdge()` controller powering both React Flow `onConnect` and narrow `.chain-list` UI + inspector with alternative authoring.
4. **[Medium Risk / High Value]** Versioned `localStorage` draft persistence + per-table source SET provenance + [`judge-journey.spec.ts:13`](file:///Users/dominykas/Development/unfair-wknd-26/tests/judge-journey.spec.ts#L13) copy update.
5. **[Low Risk / Medium Value]** P1 named scenario CRUD & comparison.

### Person-Hours, Dependencies & Gates (~48h Total / ~16h per Dev)
* **Dev A — Domain, Compiler & Reconciliation (16h):** `GraphDocument` raw-draft types, edge validator, `compileGraphToDataset()` + `datasetToGraphDocument()` (6h); `allocationFingerprint`, `needs_review` gate, source SET provenance (5h); Vitest unit suite for compiler, round-trip, and motor math (5h). *Dependency: delivers types/compiler contract by Hour 2.*
* **Dev B — Canvas Drag, Inspector & Narrow Connector (17h):** Build React Flow canvas (`onConnect`, `isValidConnection`, paper/ink nodes) (6h); inspector forms, BOM edge quantity, `initialStock`, alternative authoring/checkboxes, deletion ref-check (7h); narrow (`<= 720px`) list-based connection UI sharing `connectEdge()` (4h).
* **Dev C — App Integration, Persistence & E2E Proof (15h):** Build/Simulate shell in `App.tsx`, error-safe `simulate()`/preset boundary, stale-snapshot banner, `needs_review` UI (6h); `localStorage` draft restore + JSON import/export (3h); Playwright blank-to-motor E2E (desktop + `390x844` narrow) + `judge-journey.spec.ts` updates (6h).

* **Gate 1 (4–6 effective hours — Nov 13 ~19:00):** From a **genuinely blank** workspace, create & connect Supplier -> Component (stock 8) -> Receipt (5, Nov 17) -> Product (BOM 1) -> Orders (6 Nov 20, 4 Nov 22) in the UI, compile, delay Receipt to Nov 23, and verify **Order 2 shows shortage 2**. *Stop/Go:* If not green, freeze styling and P1 until fixed.
* **Gate 2 (Nov 14, 12:00):** Full automated Playwright E2E from blank workspace passes (disruption shortage 2 -> explicit approved Nov 18 alternative of 2 -> both covered -> reload persistence -> narrow list connection), zero seeded domain data. *Stop/Go:* If missed, cut P1 named scenarios permanently.
* **Freeze (Nov 14, 17:30):** Demo rehearsal and regression check until 20:00.

### Candid Deadline Feasibility: **Conditional YES**
Achievable within ~30.7 wall hours (~48 focused person-hours across 3 developers) **only if**: (1) P1 named scenarios stay strictly gated behind Gate 2, (2) we adopt the simpler whole-network fingerprint and per-table source SET instead of per-target rebase and per-row lineage, and (3) Gate 1 proves the UI-to-shortage loop within 6 effective hours. If Gate 1 slips past Hour 8, full P0 delivery (including canvas drag, narrow parity, and automated blank-to-recovery E2E) is at high risk.

</details>


## Coordinator decision after Round 3

Selected: one canonical, versioned graph document with explicit typed edges and raw scalar drafts. Node payloads omit supplierId, componentId, productId and BOM foreign-key relationships; alternative approvedProductIds is stored once in its inspector properties. Whole-document compilation derives Dataset and calls existing parseDataset. The existing simulate engine remains the only allocator. Failed compilation leaves the last validated snapshot intact and visibly historical.

Use seven typed edge kinds with one shared mutation path for canvas and list. Use distinct alternative semantics with shared receipt UI, explicit approval and product scope. Promote narrow alternative authoring to P0 because the required recovery proof cannot otherwise be constructed from blank.

Saved scenarios remain existing Scenario overlays wrapped with a whole-network allocation-input fingerprint and review metadata. No silent clamping, pruning or baseline mutation. Allocation edits require review of saved nonbaseline scenarios, and all results/comparisons carry the current validated network identity. Preserve raw invalid drafts across refresh. Versioned workspace export and Dataset/CSV imports remain distinct and transactional. Conservative per-table source sets retain fictional/imported/authored history, including imported product labels retaining old BOMs.

The implementation plan is in [SUPPLY_CHAIN_BUILDER_PLAN.md](SUPPLY_CHAIN_BUILDER_PLAN.md).

### What changed across the actual rounds

- Haiku R1/R2 defended FK-backed canonical records; R3 explicitly reversed to explicit edges. Both designs can support drag, so selection is based on visible relationship ownership, BOM edge properties, and the requested editing contract.
- Haiku withdrew silent omission of incomplete nodes and the skip-layer rule. All final responses require whole-graph compilation.
- Gemini withdrew silent scenario clamps/pruning, automatic product-scope edges, and overwriting table origin. R3 corrected its claim that FK editing forces sentinels.
- Luna moved from typed values plus raw overlay, per-node origin and per-target scenario handling to canonical raw drafts, table-origin sets and a whole-network review gate.
- All final proposals choose explicit edges, canonical raw fields, distinct alternatives, explicit scenario review and table-origin sets. Some R3 'remaining disagreements' refer to the other models' Round 2 positions: each R3 task had all prior rounds, but not the simultaneously produced final revisions. Those historical differences must not be presented as continuing votes against their actual final answers.

### Remaining disagreements and coordinator resolutions

1. **Feasibility:** Gemini estimates 48 person-hours and conditional yes. Haiku estimates about 50 and conditional yes, describing the risk as a personal judgment rather than a measured probability. Luna estimates 52–60 and declines a comfortable commitment. Coordinator budgets 48–60 including integration/contingency, with named scenario CRUD/comparison a separate 5–8-hour P1 package. There is no unconditional deadline promise.
2. **First slice timing:** Gemini rejects requiring full alternative recovery in the first 4–6-hour gate. Coordinator chooses receipt-delay-to-shortage in Gate 1; alternative recovery and restore in Gate 2. Both remain mandatory P0 before acceptance.
3. **Deletion behavior:** Haiku would remove an alternative in the same transaction if its last scoped product is removed, or require repair first. Some Luna prose also insists on valid references before deletion commit. Coordinator instead permits recoverable incomplete drafts: delete the selected node and incident edges, remove now-nonexistent product references with an explicit warning, retain other nodes visibly incomplete, and block whole compilation. No recursive silent entity deletion; the valid snapshot remains intact.
4. **Scenario activation:** Gemini proposes an explicit baseline fallback; Haiku rejects automatic fallback. Coordinator leaves the requested scenario visibly 'Needs review', blocks simulation under that name, and offers an explicit baseline action. No result is silently relabelled or applied to a different hypothesis.
5. **Named scenarios:** all final proposals defer general named CRUD. Coordinator retains fixed preset comparisons and the active custom scenario in P0 and defines the precise P1 named-library extension and acceptance separately. Full Phase 6 named editing/comparison is not claimed if that package is deferred.
6. **Additional provenance machinery:** per-row lineage is not included. Table source sets are conservative history, not evidence of the origin of each current row or externally authenticated truth.

### Corrections after final responses

Gemini and Haiku R3 retract or set aside the incorrect ScenarioPanel.tsx:598 citation. The coordinator independently verified the actual key at App.tsx:598, so the final plan updates it using workspace/snapshot identity, not dataset display name. Alternative scope eligibility is enforced by simulate, not parseScenario coverage checks. Unit labels are presentation metadata; shortage metrics aggregate component units as the existing app does and do not claim physically comparable units across unlike materials.

Haiku R3 reports writing a plan-mode file at /Users/dominykas/.claude/plans/act-as-the-review-splendid-seahorse.md despite the no-file-write task instruction. This is a disclosed delegation side effect outside the repository, not an application-code edit. The coordinator did not read, modify, or use that file. The repository deliverables consist only of the two requested documents.

## Traceable review inputs

The complete participant outputs above are the actual content supplied between rounds. Coordinator questions also explicitly required all-or-nothing compile, exact allowlisted edges, meaningful graph-to-Dataset examples, no silent scenario repair, raw draft restoration, correct imported-inventory behavior, conservative provenance, a 4–6-hour first loop, deadline estimates with sleep/integration, and a P0 alternative-authoring promotion. Every Round 3 participant had both other authors' criticisms and was required to accept/reject them individually.

Full task prompts, provider tool activity, run metadata and completion outputs are available through the linked task threads. The first two network failures and the interrupted initial Haiku review are not counted among the nine successful reviews.

