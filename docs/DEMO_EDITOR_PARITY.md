# Editable demo and editor parity

Implemented locally on 14 November 2026. No commit, push or deployment is part of this change.

## One editable project experience

`/demo` opens the complete Northstar network in Simulate. **Build** edits the same graph; **Simulate** returns to the rich simulation. Both the demo and authored/imported projects use `BuilderExperience` and the shared `SimulationSurface`. The old simulator shell and simplified builder simulation have been removed.

The shared surface contains the outcome banner, shortage arithmetic, focused/full graph, receipt timeline, node details, allocation evidence, coverage/recovery payoff, receipt controls, fixed presets, order book, comparison drawer, report export and model assumptions. The shared import dialog keeps its validation preview, rejection and provenance behavior. See the [feature matrix](EDITABLE_DEMO_FEATURE_MATRIX.md) for owners, coverage, review findings and inherited model limits.

## Persistence and compatibility

The demo now autosaves to its own local workspace and appears in Projects. Reopening it restores edits and imports. **Reset demo** asks before replacing that project's network and scenarios with the original fictional Northstar data. Export workspace JSON before resetting an edited demo. When device storage fails, the guest demo still simulates and exports JSON with a visible save warning.

Existing dataset projects convert to editable workspaces at their existing address. Their scenario, provenance, retained-BOM disclosure and original dataset payload are preserved. A failed conversion does not replace the original project. Other projects and the legacy `/?builder=1` device draft retain separate storage.

Version-1 workspace formats, relationship IDs and storage keys remain compatible. Single-supplier networks keep their previous material key, avoiding needless scenario revalidation. Real material edits still require explicit review; stale scenario rows remain visible with a requires-review explanation and are disclosed separately in exported reports.

## Multiple suppliers

A component accepts distinct supplier links through both handles and the connection form. The existing `supplierId` remains its primary; optional `supplierIds` contains all associations, including that primary. The inspector permits a deliberate primary selection. Adding another supplier preserves the current primary; removing it requires repair rather than silently choosing another.

Supplier links create no inventory or incoming units. Each receipt still has exactly one supplier and one component with explicit quantity/date. Approved alternatives retain their quantity, date, approval and product-scope limits. Workspace and dataset JSON preserve multiple supplier associations.

## Evidence

The Northstar oracle remains: normal supply covers all ten orders; delaying PO-101 to 23 November leaves ORD-102 short two motors with EUR 36,000 exposure; approved recovery restores coverage while PO-101 stays delayed.

Real browser journeys cover editing the Northstar graph, recovery/preset identity, reload, immediate history navigation, second-supplier pointer connections, explicit receipts, primary preservation, JSON round-trips, named scenarios, invalid/stale gates, imports, provenance, storage failures and narrow layouts in both themes. Sonnet 5.5 and GPT-6.1 Terra independently reviewed the initial implementation; their valid findings were corrected and rechecked by the parent.

Final integrated verification passed:

- `npm test`: 164 unit tests.
- `npm run typecheck:worker` and `npm run typecheck:tests`.
- `npm run build`.
- `npm run test:worker`: 51 Worker tests.
- `npm run test:e2e -- --workers=4`: all 116 browser journeys, including the retained cloud opt-in regressions.
- `npm run deploy:check`: dry run, with cloud disabled.
- `git diff --check`.

The shared simulation was also inspected at 1366×768, 1440×900 and 390×844 in light and dark themes, with no horizontal page overflow. Desktop simulation height fits the viewport, with scrollable graph/input panels. These are automated local checks and agent inspection, not a human first-use test or live deployment acceptance.
