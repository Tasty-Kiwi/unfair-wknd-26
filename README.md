# DominoOS

**Public demo: https://domino-os.tasty-kiwi.workers.dev** · [CI runs](https://github.com/Tasty-Kiwi/unfair-wknd-26/actions/workflows/ci.yml)

**See what breaks before it breaks.** A manufacturing material-availability simulator built for Unfair Weekend 2026. Change a supplier receipt, trace the affected customer order, and test an approved alternative in under a minute.

Designed for a small manufacturer testing a spreadsheet material plan without a full planning-system rollout. This buyer segment and willingness to pay are hypotheses; no customer validation or measured savings are claimed. See [commercial narrative](docs/PITCH.md) and [human validation playbook](docs/VALIDATION_PLAYBOOK.md).

The bundled Northstar Precision Assembly manufacturer, suppliers, prices and orders are **fictional**. All calculations run deterministically in TypeScript. No API key, backend, account or external service is required. Fonts are bundled locally.

## Run

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Vite prints another port if 5173 is already occupied. For a production build:

```sh
npm run build
npm run preview
```

## Deploy on Cloudflare Workers

The public link serves Vite static assets with SPA fallback; there is no backend or upload endpoint. To redeploy from this checkout:

```sh
npx wrangler login
npm run deploy
```

`wrangler.jsonc` selects the Tasty Kiwi account and the `domino-os` Worker. Change these for another account. `npm run deploy:check` validates a built asset deployment without publishing. Keep `npm run dev` ready as the local demo fallback. GitHub CI verifies code but does not deploy or store Cloudflare credentials.

## Demonstrate

1. Start on **Normal operations**: 10 customer orders, zero shortages.
2. Click **Supplier disruption**, or move the delivery slider from +5 to +6 days. The motor receipt moves from November 17 to November 23. ORD-102 needs four motors on November 22; two remain after ORD-101 reserves six of the eight in stock. The result is one order at risk, two missing motors, and €36,000 of order value exposed.
3. Click **Add alternative** in the Scenario Lab. Two preapproved motors available November 18 cover ORD-102. Its graph path returns to covered; the delayed original receipt remains delayed.
4. **Compare recovery actions** evaluates each candidate independently against the current scenario. Restore the original receipt timing (supplier confirmation required) or use approved alternative supply (additional purchase, unknown costs). Cards show net units recovered, remaining exposed orders and missing units. Applying an option recalculates the same engine; this is not a cost optimizer.
5. Click any graph node for its relationships, or an order to inspect component allocations. Compare the three fixed scenario snapshots below; **Export report** downloads the current inputs and results. **Reset demo** restores all original data.

A second disruption: reset, choose **CircuitWorks / PO-102**, and shift its control-board receipt to November 25. ORD-103 and ORD-106 become at risk, with eight missing boards. Focus **Control board** in the dependency map or use **Full network**.

See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for a 90-second spoken walkthrough.

## Verification

```sh
npm test             # Vitest engine + validation regression tests
npm run build        # strict TypeScript + Vite production build
npm run test:e2e     # Playwright, using locally installed Google Chrome
```

The push/PR GitHub Actions workflow runs `npm ci`, unit tests, production build, a Wrangler dry run, and all browser journeys using installed Playwright Chromium. CI itself needs no Cloudflare token.

The browser suite starts Vite if needed (or reuses port 5173). It exercises the live 5/6-day threshold, graph inspection, approved recovery, preset comparison, export, invalid JSON rejection, valid CSV import, reset, and 390px layout. Set `DOMINO_BASE_URL=https://domino-os.tasty-kiwi.workers.dev npm run test:e2e` to exercise the public deployment instead of starting Vite. Recovery comparison and atomic multi-table imports are included. Google Chrome must be installed locally; the app itself works in modern browsers. Tests produce disposable `test-results/` files.

## Import

Use **Import data**. Downloadable example JSON and CSV are available in the import dialog and in `public/examples/`.

- **JSON:** replaces the whole dataset: `name`, `asOf`, `suppliers`, `components`, `products` (with one-level BOMs), `inventory`, `deliveries`, `orders`, and `alternatives`. The bundled example is the schema reference; shared TypeScript interfaces are in `src/lib/types.ts`.
- **CSV:** select up to five table files together. Headers identify the table, independent of filename or column order. Each selected table replaces its existing rows; omitted tables retain current data. Cross-references validate after all files are applied, so related changes commit atomically. Quoted fields and CRLF are supported. Templates are in the import dialog.

  | Table      | Headers                                             |
  | ---------- | --------------------------------------------------- |
  | Deliveries | `id,supplierId,componentId,quantity,availableDate`  |
  | Inventory  | `componentId,quantity`                              |
  | Products   | `id,name,sku`                                       |
  | BOM        | `productId,componentId,quantity`                    |
  | Orders     | `id,customer,productId,quantity,requiredDate,value` |

  Products retain their existing BOM if their ID already exists. Import new products together with a BOM. A BOM file replaces **all** product BOMs, and every product needs at least one line. The supplier/component/approved-alternative catalog remains from the current dataset; use JSON to replace it, including stale approved-product references. Numeric fields use plain digits (decimal point allowed for order value), without currency symbols or thousands separators.

- Dates must be real ISO calendar dates, `YYYY-MM-DD`, on or after `asOf`. Counts must be nonnegative integers; BOM and order quantities must be positive. References, duplicate IDs, approval and product scope are checked using Zod plus semantic validation.
- Each file is limited to 2 MB (one JSON or up to five CSVs). A rejected file leaves the current data and scenario unchanged. Imported plans get illustrative six-day disruption and recovery presets derived from their first receipt; these do not guarantee that a particular imported order will be affected or recovered.
- State is in browser memory; refresh resets it. Export a report if you need a record. Nothing is uploaded or persisted on a server.

## Model and limits

`simulate(dataset, scenario)` validates independent input copies and returns per-order, per-component allocation evidence and aggregate metrics. A scenario overlays receipt dates/quantities and approved alternative supplies; it never mutates the baseline.

1. Orders allocate by **earliest required date, then code-point order ID**.
2. Each BOM line demands `order quantity × per-product quantity`.
3. On-hand stock is available at `asOf`. Dated receipts and alternatives are consumed by availability date, then source ID/type. A receipt on an order's required date is eligible.
4. Source balances are shared across all orders: a unit cannot be allocated twice. Alternatives are limited by catalog quantity, earliest available date, explicit approval and approved product IDs.
5. **Partial kits retain reserved materials.** A short line marks the whole order **At risk due to material shortage**; allocations on other lines remain held. This policy can strand materials and is not an optimizer. It does not maximize throughput, order count or order value.
6. Orders at risk and missing units come from uncovered BOM demand. Affected products/components are distinct IDs. Order value at material risk sums the full values of distinct short orders; it is exposure, not lost revenue, profit or guaranteed savings.

This prototype models **material availability only**. It excludes factory capacity, machine and labor schedules, production durations, transport/inspection buffers, expiry, multi-level BOMs and exact shipment/completion forecasts. Incoming dates are assumed usable material availability dates. The approved catalog is an input assumption, not an external qualification check.

## Project layout

- `src/lib/`: domain types, pure simulation, Zod/reference validation and CSV parser.
- `src/data/demo.ts`: four suppliers, ten components, five products, ten orders, eleven receipts and an approved alternative; three scenario overlays.
- `src/components/graph/`: typed React Flow nodes, causal shortage paths, focused/full network views.
- `src/components/scenarios/`: live scenario controls and structured allocation explanations.
- `src/components/ui/`: shadcn/Radix primitives.
- `src/tests/`: calculation and validation tests; `tests/`: Chrome journey tests.
- `AGENT_DISCUSSION.md`: real timed review, participant contributions, disagreements and decisions.

React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, React Flow, Lucide, Zod and Vitest. The production bundle contains the graph and validation libraries; the public Worker hosts the prototype, with no ERP integration. Human usability and manufacturing-policy validation remain outstanding.
