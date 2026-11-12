# DominoOS — real agent design discussion

## Timing and participants

Discussion began 2026-11-12 at **18:24:05 UTC** (20:24:05 Europe/Vilnius). Independent proposals began at 18:24:25 UTC. Round two cross-examinations followed the actual round-one findings at approximately 18:28 UTC. Final architectural review completed after 18:30 UTC, exceeding four minutes of actual elapsed review. No application code was modified during this phase. The time was used for independent proposals, reading actual responses, counterexamples, repository inspection, cross-examination, and rule resolution; no sleep commands were used.

The real `orchestrator_capabilities` catalog exposed:

- Agent A: **gpt-6-luna**, provider instance **codex**. System architecture, deterministic simulation, dated allocation, partial kits, test strategy.
- Agent B: **claude-haiku-5-5**, provider instance **claudeAgent**. Product critique, all-or-nothing counterproposal, boundary tests, import transactionality, auditability and VC skepticism.
- Agent C: **gemini-3.8-flash**, provider instance **antigravity**. Judge experience, graph focus, visual hierarchy, incomplete-kit warning, critique of its own initial scope overreach. The catalog accepted this exact model; its run metadata does not independently report an executed-model override.
- Lead: **gpt-6.1-sol**, Codex. Repository inspection, review of numerical examples, final policy and integration decisions.

Six real `delegate_task` design/review tasks ran: one independent proposal and one cross-examination per model. No model substitution or recursive agents.

## Round 1 — independent proposals

**Luna** proposed a browser-only pure TypeScript engine, immutable fixtures, dated supply lots, earliest required date then order-ID priority, per-component allocations and audit traces. It warned that partial kits can strand material and that supply availability is not a shipment prediction. It recommended cutting import for scope; the lead rejected that cut because basic import is required. Its demo prose briefly contradicted itself about whether the initial receipt was usable; the final dated example below fixes that.

**Haiku** independently proposed pure functions, ISO calendar dates, integer units, a frozen baseline plus overlays, and all-or-nothing order reservations. It supplied the useful Nov 17 receipt / Nov 22 required-date boundary: a five-day delay remains eligible, six days does not. It stressed that greedy allocation is not optimization and that synthetic data must be disclosed. Its proposed cuts to the graph, substitutes and responsive work were rejected where they conflicted with the brief.

**Gemini** proposed a memorable disruption-to-recovery visual chain and product-scoped approved alternatives. Its first response also overreached: multi-echelon language, inferred completion dates, invented penalty savings, unmeasured performance claims, and unsupported ERP comparison claims. These were explicitly challenged and excluded. We adopt the visual clarity, not those claims.

## Round 2 — cross-examination and disagreements

Each reviewer received the actual other proposals, the partial-reservation disagreement, the lead's simpler architecture, proposed graph/control layout, import scope, and business-value wording. All were asked to debate mathematical soundness, memorable visuals, feasibility, complexity, measurable benefit and VC objections.

**Haiku's strongest counterexample:** stock A=1, B=0; early order X needs A+B; later Y needs A. Partial EDF reserves A for incomplete X and leaves Y short. All-or-nothing could cover Y. Conversely, all-or-nothing EDF can still be suboptimal: X takes A+B while separate later orders Y and Z could use A and B to cover two orders. Haiku maintained its dissent and suggested separate non-consuming coverage and atomic commitments.

**Luna** defended explicit per-component reservations as matching the requested explanation, with conservation and incomplete-kit flags. Its second-round response introduced expiry rules that are outside our domain and mischaracterized a rollback example; the lead rejected those additions. There is no expiry model in this prototype.

**Gemini** supported partial reservations only with a visible incomplete-kit warning, accepted rejection of inferred completion dates, and argued for a focused motor graph plus full network view. It repeated an unmeasured speed claim and misread the five-day boundary as an inspection buffer; neither is adopted. There is no hidden inspection/kitting lead time.

**Shared conclusions:** one-level BOM, pure browser engine, immutable baseline, date-only inputs, visible allocation evidence, no optimization claim, no backend or external credentials, and order value at material risk rather than revenue saved.

## Round 3 — final lead decision

1. **Allocation policy:** order by `(requiredDate, orderId)` using explicit code-point comparisons. Allocate each BOM component independently from eligible on-hand stock and dated supply, oldest available date then stable source ID. Reserve only available units, never twice. Partial reservations remain in the simulated ledger. Any short BOM line marks the whole order **At risk due to material shortage**. This is a deterministic priority policy, not a maximum-throughput or maximum-value optimizer. Haiku's policy dissent remains documented.
2. **Dates:** valid ISO calendar dates, inclusive receipt deadline. On-hand stock is available as of the dataset date. A Nov 17 receipt delayed five days is available Nov 22; delayed six days is Nov 23 and cannot serve a Nov 22 requirement. No production-duration, inspection-buffer, expiry or shipping assumptions.
3. **Exact motor example:** 8 stock, ORD-101 uses 6 by Nov 20, ORD-102 needs 4 by Nov 22. A 5-motor receipt initially available Nov 17 covers the remaining 2. Move it to Nov 23: ORD-102 has 2 allocated and 2 short. Add an explicitly approved, product-scoped 2-motor alternative available before Nov 22: shortage becomes zero. No baseline mutation.
4. **Architecture:** React + TypeScript + Vite; Tailwind and shadcn primitives; React Flow; Lucide; Zod; Vitest. No backend, authentication, AI calculations, paid API keys or cloud dependencies.
5. **Visual plan:** graphite canvas `#101319`, steel surfaces `#191e27`, border `#303846`, paper text `#eef1f5`, muted steel `#9ca8b8`, cyan selection `#75d5e8`, amber shortage `#f4b75e`, green coverage `#81bba1`. Locally bundled Manrope typeface; tabular numbers. Left-aligned workbench: quiet navigation, compact metrics, graph as the hero, adjacent scenario controls, allocation evidence below, three-state comparison. A focused motor path is default; all supplier/component/product/order relationships remain inspectable in full-network mode. Shortage uses text and icons as well as color.
6. **Business outcome:** sum the full values of distinct orders with at least one shortage; compare to fully covered order value. This represents exposure under the model, never revenue saved, margin recovered or guaranteed fulfillment.
7. **Import:** whole dataset as validated JSON; browser CSV for incoming delivery records. Transactional acceptance and useful errors, no partial application of malformed files. Basic import stays in scope.
8. **Ownership:** Luna owns domain types, deterministic engine, fixtures and simulation tests. Haiku owns validation/import, scenario controls, impact explanations and validation tests. Lead owns scaffold, graph, application integration, styling, browser journey and documentation. Use T3-managed isolated worktrees and review files before copying into the integration checkout. Gemini reviews final UX rather than editing competing files.

## Outstanding risks and limits

- Partial component reservations can strand material in incomplete kits; explicitly disclose the policy and do not claim optimality.
- Receipt promises and qualified alternative availability are fictional inputs, not supplier confirmations.
- A clean material result cannot establish actual factory completion or shipment timing.
- Full graphs can be dense; default to a focused chain, provide zoom and a complete order table.
- Imported data can be internally valid but operationally inaccurate. No ERP reconciliation is claimed.
- No customer validation or real business savings has been established by this hackathon prototype.

## Implementation and final review

Luna implemented domain types, the pure engine, fixtures and initial calculation tests in a T3-managed isolated worktree. Haiku implemented Zod/reference validation, CSV parsing, scenario controls, evidence explanations and initial validation tests in a separate managed worktree. The lead inspected and integrated those owned files, corrected source-ordering and immediate-control behavior, expanded regression coverage, implemented the React Flow map and responsive shell, and documented usage.

Gemini's final **source-based** UX review confirmed the causal demo and raised five concrete concerns: nested evidence headings, fixed scroll offsets, inconsistent success/risk colors, hidden fictional-data disclosure below 1000px, and a delay-only slider. The lead removed the redundant evidence heading, used an evidence element ref for scrolling, aligned green/amber tokens, retained disclosure on narrow screens, and allowed expediting by up to five days without moving before the dataset date. This reviewer did not claim browser inspection.

Final verification in the integration checkout:

- **35 Vitest tests passed**: conservation, delay/restoration, approved and partial recovery, deterministic tie-breaking, immutable baseline, inclusive dates, source ordering, product-scoped/shared alternatives, malformed input, and the second control-board disruption.
- **Strict TypeScript and Vite production build passed**. Vite reports a non-blocking bundle-size advisory for the graph/validation bundle and strips two upstream Zod comment annotations.
- **3 Playwright Chrome journey tests passed**: disruption/evidence/recovery/export/full graph, import rejection/CSV/reset, and 390px disclosure/layout/recovery.
- Actual desktop and mobile screenshots were captured and inspected. Shared T3 preview automation timed out twice and the CUA host was unavailable; the lead used local Playwright with installed Chrome for browser verification. A positioned table container corrected the mobile overflow, and graph fitting responds to viewport resizing.

These are local automated checks, not physical-device testing, factory validation, deployment, real customer evidence or measured business savings.
