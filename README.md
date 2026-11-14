# Needtrace

**Needtrace · See what breaks before it breaks.** · [CI runs](https://github.com/Tasty-Kiwi/unfair-wknd-26/actions/workflows/ci.yml)

A manufacturing material-availability simulator built for the Unfair Weekend 2026 hackathon. Change a supplier receipt, trace the affected customer order, and test an approved alternative in under a minute.

The local app opens with the landing page at `/`, followed by the project library at `/projects`. Open the fictional demo, or choose **New project** to import JSON/CSV or start a blank network. Each local project opens at `/projects/:id` and autosaves separately. `/demo` opens the session-only simulator directly; `/landing` and `/?builder=1` remain compatible entry points. These route changes have not been deployed. The existing public Workers URL still uses the legacy `domino-os` hostname; no Needtrace domain is claimed here. Production cloud features remain disabled. Staging and release limits are documented in [staging verification](docs/STAGING_VERIFICATION.md).

Designed for a small manufacturer building a material network or testing a spreadsheet plan without a full planning-system rollout. This buyer segment and willingness to pay are hypotheses; no customer validation or measured savings are claimed. See [commercial narrative](docs/PITCH.md) and [human validation playbook](docs/VALIDATION_PLAYBOOK.md).

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

The production public link currently serves the guest app with cloud features disabled. The optional Worker backend is deployed separately to staging; see the cloud section below. New projects save locally, including dataset imports and scenario changes. The standalone `/demo` simulator remains session-only: export a report before leaving it and keep source files for reimport. Resetting an imported plan requires confirmation. Product CSV imports without a BOM retain matching products' existing BOMs; the preview and active plan disclose this. To redeploy from this checkout:

```sh
npx wrangler login
npm run deploy
```

`wrangler.jsonc` selects the Tasty Kiwi account and the legacy `domino-os` Worker. These infrastructure identifiers and the public hostname are not the product's visible brand. Change them only as a deliberate migration, including checking OAuth origins/callbacks. `npm run deploy:check` validates a built asset deployment without publishing. Keep `npm run dev` ready as the local demo fallback. GitHub CI verifies code but does not deploy or store Cloudflare credentials.

## Demonstrate

Open `/`, choose **Open projects**, then **Open demo project**. To use your own plan, choose **New project** instead: import one workspace/dataset/report JSON or up to five CSV tables, review the import preview, name the project, and create it. **Start blank** opens a separate network builder. The project library also surfaces an existing device draft without migrating or replacing it. Browser storage is local to this browser and device; export JSON for a portable backup.

1. Start on **Normal operations**: 10 customer orders, zero shortages.
2. Click **Supplier disruption**, or pick **Latest safe** (22 Nov) then **First short** (23 Nov) under _Land on_. You can also drag the PO-101 receipt on the dated timeline under the map. The motor receipt moves from November 17 to November 23. ORD-102 needs four motors on November 22; two remain after ORD-101 reserves six of the eight in stock. The result is one order at risk, two missing motors, and €36,000 of order value exposed.
3. Click **Add alternative** under **Change the inputs**. Two preapproved motors available November 18 cover ORD-102. Its graph path returns to covered; the delayed original receipt remains delayed.
4. **Ways to recover** evaluates each candidate independently against the current scenario. Restore the original receipt timing (supplier confirmation required) or use approved alternative supply (additional purchase, unknown costs). Cards show net units recovered, remaining exposed orders and missing units. Applying an option recalculates the same engine; this is not a cost optimizer.
5. Click any graph node for its relationships, or an order to inspect component allocations. **Scenarios side by side** compares the three fixed scenarios; **Export report** downloads the current inputs and results. **Reset demo** restores all original data.

A second disruption: reset, choose receipt **PO-102** (control board), and shift its control-board receipt to November 25. ORD-103 and ORD-106 become at risk, with eight missing boards. Focus **Control board** in the map or use **Full network**.

See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for a 60-second spoken walkthrough.

## Build a network

Choose **Build a network** from the existing simulator. Start blank or open the explicitly fictional **Core example**. Add suppliers, components, receipts, products and customer orders, then connect typed handles or use the **Connect** form. Enter initial stock and the quantity required on each component-to-product BOM connection. **Check network** lists missing fields and relationships; **Run simulation** converts the complete graph into the existing validated Dataset and allocation engine.

In Simulate, choose **New scenario**, give it a name, change a receipt date or quantity and **Save scenario**. **Select scenario** reopens saved inputs; **Compare with baseline** compares the same network with and without those changes. Selecting an order shows its actual material allocations. Baseline quantities and dates are never changed by scenario controls. A material edit in Build requires explicit **Revalidate scenario** before an older scenario can run; its original overrides are retained.

Builder progress auto-saves in this browser, including incomplete graph fields and named scenarios. Check for **Saved locally**, or use **Save workspace**. After refreshing, choose **Build a network** again to reopen it. **Export workspace JSON** and **Import workspace JSON** use one versioned format (2 MB limit). Storage errors remain visible; local browser storage is not an external backup. These device actions do not upload data; configured cloud saving is a separate explicit action.

The original **Import data** JSON/CSV path stays separate and preserves its existing behavior. Entering Build and returning with **Back to Simulate** preserves the original in-memory plan. Existing approved-alternative recovery continues there. Authoring alternatives, migrating arbitrary imports into Build and a dedicated mobile editor are deferred; the builder provides laptop editing, keyboard-accessible forms and a basic narrow layout.

The automated acceptance journey creates the motor network from blank using visible UI actions, including actual node dragging and a pointer connection. With stock 8, receipt 5 on November 17, BOM 1, and orders 6 on November 20 and 4 on November 22, baseline covers both. A named delay to November 23 leaves the second order short by 2. The test also compares baseline and saves/reloads/exports/reimports the created workspace. See [implementation evidence](docs/BUILDER_IMPLEMENTATION.md).

## Verification

```sh
npm test             # Vitest engine + validation regression tests
npm run typecheck:worker # generate bindings and check Worker source
npm run typecheck:tests  # check browser/API test source
npm run build        # strict TypeScript + Vite production build
npm run test:worker  # production Worker + isolated local D1
npm run test:e2e     # Playwright, using its installed Chromium browser
```

The push/PR GitHub Actions workflow runs `npm ci`, unit tests, Worker/test-source typechecks, production build, Worker/D1 tests, a Wrangler dry run, and all browser journeys using installed Playwright Chromium. CI itself needs no Cloudflare token. Build before running Worker/browser tests because they serve `dist/` assets.

The browser suite starts Vite if needed (or reuses port 5173). It exercises the live 5/6-day threshold, graph inspection, approved recovery, preset comparison, export, invalid JSON rejection, valid CSV import, reset, and 390px layout. Set `DOMINO_BASE_URL=https://domino-os.tasty-kiwi.workers.dev npm run test:e2e` to exercise the public deployment instead of starting Vite. Recovery comparison and atomic multi-table imports are included. Install Playwright Chromium once with `npx playwright install chromium`; the app itself works in modern browsers. Tests produce disposable `test-results/` files.

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
- JSON/CSV projects created from `/projects` save their dataset and scenario locally across refreshes. The standalone `/demo` import path remains in memory; refresh resets it. Export a report for a portable record; report JSON can be imported as a new project. These device actions do not upload data. Signed-in users can explicitly save builder workspaces to the cloud when cloud features are configured.

## Optional cloud projects

Cloud projects use a small custom **GitHub OAuth** flow, a same-origin Worker API and D1-backed sessions. Email/password sign-in is disabled. The public demo and guest builder remain available without authentication; local autosave and JSON import/export continue to work.

In the builder, use Sign in with GitHub, My projects, Save to cloud and Open. Cloud saves are explicit and version-checked. A conflict offers Keep working locally, Save as new project, or Open cloud version after confirmation. Each account can keep 20 projects and create at most 5 per minute; a cloud workspace is limited to 1,000,000 UTF-8 bytes.

For local development, follow [GitHub setup](docs/GITHUB_AUTH_SETUP.md), apply the local migrations, and run `npm run dev` alongside `npm run dev:api`. Credentials belong in ignored `.dev.vars`, never `VITE_` variables. Guest development works without credentials. Apply the checked-in migrations, including `0003_github_oauth.sql`, without rewriting previously applied files. Only GitHub Client ID/Secret are required; the fixed origin is `AUTH_URL`.

The checked-in production and branch-preview configurations keep cloud disabled. The replacement custom OAuth flow has passed a real GitHub sign-in, save/list/open/update, logout and re-sign-in using one account in its existing browser profile on staging. Fresh-browser restoration, retained-old-cookie rejection and live second-account isolation remain unverified. Local Worker tests cover seeded sessions and owner checks, but do not replace those live checks. Several observed authenticated request CPU samples exceeded the nominal Workers Free allowance; reliability is not established. See [implementation evidence](docs/CLOUD_BACKEND_IMPLEMENTATION.md) and [staging verification](docs/STAGING_VERIFICATION.md). Production rollout is not approved.

The builder checks public `/api/health` before showing cloud controls. If cloud is disabled, unreachable or returns an invalid response, guest editing and local saving continue without sign-in or project requests. A failed connection offers Retry cloud connection; an explicitly disabled backend keeps cloud controls hidden. After a refresh, the device draft opens; reopen a cloud project from My projects.

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
- `src/lib/builder/`: raw graph types, typed connections, whole-graph compiler, versioned local workspace format and scenario bindings.
- `src/components/builder/`: controlled React Flow editor, inspector, connection form and Build/Simulate integration.
- `src/data/demo.ts`: four suppliers, ten components, five products, ten orders, eleven receipts and an approved alternative; three scenario overlays.
- `src/components/graph/`: typed React Flow nodes, causal shortage paths, focused/full network views.
- `src/components/scenarios/`: live scenario controls and structured allocation explanations.
- `src/components/ui/`: shadcn/Radix primitives.
- `src/tests/`: calculation and validation tests; `tests/`: Chrome journey tests.
- `docs/archive/`: historical design debates, superseded release reviews and material from deleted branches, including the original timed agent discussion. See the [archive index](docs/archive/README.md) and [branch archive](docs/archive/BRANCH_ARCHIVE.md).

React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, React Flow, Lucide, Zod and Vitest. The production bundle contains the graph and validation libraries; the public Worker hosts the prototype, with no ERP integration. Human usability and manufacturing-policy validation remain outstanding.
