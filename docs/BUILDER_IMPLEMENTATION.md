# DominoOS Builder — Implementation Evidence

Status: reduced P0 implemented and locally verified on `feat/supply-chain-builder`, based on `625d059`. Verification date: 13 November 2026. This record describes local acceptance; it does not claim a merge, hosted CI result or production deployment.

## What is implemented

- Five core entity types, raw property editing, initial stock, positive BOM quantities, controlled node dragging and meaningful typed canvas/form connections.
- Whole-graph deterministic compilation into the existing Dataset and simulate engine. No second allocator or server.
- Build/Simulate navigation preserving the original imported plan in memory.
- Named scenario New/Save/Select, immutable baseline comparison, live receipt date/quantity changes and per-order allocation/late-delivery evidence.
- Generic explicit scenario revalidation after material graph edits; no automatic override pruning, clamping or stale-result display.
- One versioned browser-local workspace envelope and JSON export/import, including raw incomplete drafts, named scenarios and basic authored/fictional/imported-file labels.
- Transactional malformed-file rejection, protection of unreadable saved data, visible save errors, confirmation before replacement and keyboard-accessible entity/connection selection.
- Laptop authoring at 1280×800 and basic narrow/form operation at 390×844.

Alternative authoring/recovery on builder networks, import-to-editor migration, optimized mobile editing and advanced scenario management remain P1/P2. Existing simulator alternatives/imports/recovery remain intact.

## Actual model contributions

The three requested models genuinely ran implementation tasks with fixed interfaces and separate file ownership:

- **Gemini 4 Hydrogen:** domain types, factories, connections, compiler, schema, storage and scenario-binding helpers; 20 new unit tests. Source: [DominoOS implementation — Hydrogen domain layer](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3A78f4796c-5a12-41e5-98dd-1faf8a9d19bc)
- **Claude Haiku 5.5:** editor palette/canvas/nodes, inspectors, form connections, deletion controls, document-edit helpers and scoped paper/ink styling. Source: [DominoOS implementation — Haiku editor design](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3Af094f61b-42ae-4af7-8656-8b1df7dadb6f)
- **GPT-6 Luna:** initial App entry point and integration/scenario-control scaffolding. Its continuations did not complete the requested integration and left stale-result and TypeScript defects. Sources: [DominoOS implementation — Luna integration and verification](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3A1fff65dd-412d-4e38-9ece-0c4e5044e83d), [DominoOS implementation — Luna finish integration](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ae47a2996-aa8d-41d5-b3b3-f316cedb5fc4%3Adelegate-task%3A04f306ed-a9bf-4da2-8c42-51cc1134f8bb)
- **Root coordinator:** completed/reworked the integration and named scenario lifecycle, safe local/JSON workflows, live result derivation, baseline comparison, scenario-review gate and all six permanent builder browser tests. Also fixed the legacy narrow-toolbar overflow, stabilized canvas height, added keyboard item selection and independently verified the combined application.

No model substitution is hidden in this record. The final integration is not attributed to Luna as completed work. No additional review discussion was fabricated.

## Verification actually executed

| Check | Result |
| --- | --- |
| `npm test` | 80 passed across 8 files: all 60 original tests and 20 builder tests |
| `npm run build` | TypeScript and Vite production build passed |
| `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/dominoos-playwright npm run test:e2e` | 17 passed: all 11 original judge journeys plus 6 builder journeys |
| `WRANGLER_LOG_PATH=/private/tmp/dominoos-wrangler.log npm run deploy:check` | Static-assets deployment dry run passed; nothing published |
| `git diff --check` | Passed |
| Screenshot inspection | Automated laptop/narrow screenshots inspected locally; this is visual QA, not a human usability study |

The matching Playwright Chromium was installed into temporary storage because the default browser cache lacked the required version. Vite/Chromium tests required execution outside the restricted sandbox after localhost binding returned EPERM. Initial test failures from a case-sensitive Fit View locator and a legacy text assertion were fixed. The full suite also caught an actual narrow-toolbar overflow caused by the new Build button; its wrapping was fixed and all 17 journeys rerun successfully.

The build still emits the pre-existing Zod annotation and large-bundle warnings. No production performance, independent human acceptance, physical-device, hosted CI or live-deployment validation is claimed.

## Critical end-to-end proof

[builder-journey.spec.ts](../tests/builder-journey.spec.ts) starts with a fresh browser context and **creates the full network through visible UI controls**. No example, direct Dataset injection or seeded localStorage constructs the acceptance network.

1. Enter inventory date November 13, Aster Manufacturing, Servo motor stock 8, receipt 5 on November 17, Industrial motor unit BOM 1, and orders 6 on November 20 / 4 on November 22.
2. Drag an actual node and create an actual pointer-handle connection; use the same typed rules through forms for remaining relationships.
3. Run baseline: both orders covered.
4. Create and save Motor shortage with the receipt delayed to November 23: the second order has 2 available of 4 required and shortage 2; evidence identifies the late receipt.
5. Compare baseline missing 0 versus scenario missing 2, select baseline and the saved scenario, save locally, reload, reopen Build and rerun.
6. Export the user-created workspace, inspect its six entities/six relationships and unchanged baseline receipt date, reimport and reproduce shortage 2.

Additional browser cases cover explicit review after stock changes, Save not bypassing review, immediate recalculation after scenario edits, duplicate/incompatible connections, incomplete raw stock surviving refresh, dependent deletion, original imported-plan preservation, keyboard editing on a narrow screen, and unreadable local/invalid JSON data staying safe. The only storage injection in browser tests is malformed-data fault injection; it does not seed the acceptance network.

## Usage

Run `npm run dev`, choose **Build a network**, and start blank or open the fictional Core example. Use **Edit item** for keyboard selection, the inspector for values, and handles or Connect for relationships. Run the network before creating a named disruption. Save workspace/export for a portable copy. After refresh, choose Build a network again to reopen the locally stored draft.

The current [implementation plan](SUPPLY_CHAIN_BUILDER_PLAN.md) defines the reduced scope. The [design debate](BUILDER_DESIGN_DEBATE.md) remains a historical record; its larger original P0 and person-hour estimates are not acceptance requirements for this implementation.
