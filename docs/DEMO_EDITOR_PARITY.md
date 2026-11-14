# Demo and editor parity

Implemented and checked locally on 14 November 2026. No cloud release or deployment was performed.

## Supported workflows

- Open the active simulator dataset and scenario with **Edit this network**. This creates a local editable project rather than replacing the current device draft.
- Load the complete **Northstar demo** from the editor File menu. Its catalog and normal, disruption, and recovery scenarios are preserved. **Core example** remains a separate learning fixture.
- Author approved alternative supply with supplier, component, product scope, quantity, availability date, and approval. Existing alternative IDs remain stable.
- Run the same deterministic allocation engine, manipulate receipt dates and quantities, apply approved recovery, and compare saved scenarios with baseline.
- Export editable workspace JSON, simulator dataset JSON, and scenario report JSON with source provenance and comparisons. Import workspaces, datasets, reports, and CSV tables.
- CSV imports retain unselected tables from the current valid network. An incomplete draft uses the disclosed Northstar base. Retained product BOMs and mixed provenance survive workspace round-trips.
- Save incomplete drafts and named scenarios locally. Existing v1 files and storage keys remain compatible.

## Review safeguards

Material changes invalidate previous scenario validation. Receipt and alternative snapshots expose changed context; missing or invalid alternative uses remain visible until repaired or removed. Revalidation does not silently discard them. Canvas controls and graph handles have reserved space beside the inspector.

The converter checks its compiled output against the dataset. Unsupported numeric representations or invalid inputs produce explicit errors rather than silent data loss. BOM display order can differ while allocation results remain identical.

## Evidence

`src/tests/builder-parity.test.ts` covers conversion, approved alternatives, deterministic allocations, version compatibility, JSON round-trips, identity invalidation, and malformed references. The Northstar oracle is covered, then one order misses two component units with EUR 36,000 exposure after the motor delay, then approved recovery restores coverage while the receipt remains delayed.

`tests/demo-editor-parity.spec.ts` covers active simulator conversion, recovery, persistence, catalog editing and removal, explicit revalidation, imports, exports, provenance, and narrow layouts in both themes. Existing blank-network, cloud, project, navigation, and release journeys remain part of the full end-to-end suite.

Verification commands: `npm test`, `npm run typecheck:worker`, `npm run typecheck:tests`, `npm run build`, `npm run test:worker`, `npm run test:e2e`, and `npm run deploy:check`. The deployment check is a dry run; production cloud remains disabled. Local browser coverage does not constitute live cloud acceptance.

Final local results: 137 unit tests, 51 Worker tests, and all 110 end-to-end journeys passed. Both typechecks, the production build, and the deployment dry run passed. Review also repaired CSV table retention, stale alternative removal, inspector overlap, and overlapping simulation/review messages.
