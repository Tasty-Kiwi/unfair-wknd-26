# gpt-6.1-terra — Round 2

[Terra round 2 adversarial review](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aabb7c3a5-77ef-4145-8e1e-db77c6698058%3Adelegate-task%3A35d46ebe-ee57-43de-957c-328514300659)

Executed model: `gpt-6.1-terra`.

**The highest-impact work is to align the submission and rehearsal with the production journey already live, then make the first action and demo’s storage behavior clear.** The coordinator’s asset and browser evidence establishes the current production baseline; I did not independently repeat the live journey or run tests in this read-only review.

The demo’s story is reproducible: 10 orders covered; PO-101 delayed to 23 November; ORD-102 short two motors with **€36,000** in order value exposed; the approved Vector alternative restores coverage while the original receipt remains delayed. The coordinator described the amount with a dollar sign, but the app formats it as euros. Use the app’s currency consistently.

Three substantive objections to Round 1:

1. **Sonnet’s deployment framing is obsolete.** The route mismatch is a present submission defect, not a risk that appears “once this branch deploys.” Production already serves the landing page at `/`, library at `/projects`, and simulator at `/demo`. Fix the links and scripts against that verified state; do not make a deployment a prerequisite. Terra’s conditional framing also understates the urgency.
2. **Sonnet’s arbitrary numeric maxima are the wrong fix.** [validation.ts](/Users/dominykas/Development/unfair-wknd-26/src/lib/validation.ts:43) already requires finite money and checks each order/BOM demand product for safe-integer arithmetic. However, [simulation.ts](/Users/dominykas/Development/unfair-wknd-26/src/lib/simulation.ts:165) sums shortages and values, so individually valid inputs can potentially produce an unsafe integer aggregate or infinite value aggregate. Reproduce those cases before changing code; reject unrepresentable results with clear validation and focused tests. An impressive-looking `1e300` alone does not establish incorrect arithmetic, and business caps such as `1e9` are unsupported.
3. **Sonnet’s video recommendation is too categorical.** A previous-build recording is not automatically misleading if the shown simulator and sequence remain accurate. Compare the actual footage, closing URL, labels, and results with production first. Repair or rerecord only material discrepancies; a caveat is not a substitute for a wrong final link. Neither report establishes that the video was watched in this review.

I would also **defer Sonnet’s empty-order rejection**: a blank or incomplete planning workflow may intentionally allow zero orders, and the report establishes no harmful failure. Likewise, per-route titles, DOM-forced validation messages, and cross-tab deletion deserve separate triage, not automatic pre-submission expansion.

Against the judging criteria:

- **Technical Execution:** The deterministic allocation, inspectable recovery, automated baseline, and verified live journey make a strong case. Describe the exact tested path and preserve it. Investigate aggregate arithmetic because correctness is central to the product, but do not imply the reported demo itself is broken.
- **Product Design:** The landing page explains the problem, but its visually prominent **Open projects** action precedes the secondary **Explore the demo**, which itself routes through projects. For a judge seeking immediate interaction, make the demo CTA direct to `/demo` and give it primary priority; retain a clear projects route. This is a reasoned improvement, not a measured usability result. On the project demo card, say the demo is session-only and that **Edit this network** saves a local copy; the nearby local-storage language otherwise invites a false expectation.
- **Potential Impact:** Name the user—a manufacturer or planner checking a material plan—and show the concrete decision from delay to affected order to possible response. The fictional €36,000 is exposed order value, not loss avoided, savings, or validated customer impact. One unaided rehearsal can reveal comprehension issues; one planner conversation would be useful evidence, not market validation.
- **Originality:** The defensible distinction is the combined, inspectable workflow: a dated supplier change flows through allocation to an affected order, then an approved alternative can be tested against the same model. Do not claim the graph, simulation, or supply-chain planning category is unique without evidence.

**Narrow scope and ownership:** coordinator owns the authoritative route table, README, checklist, release and debate documents, final evidence, and submission. Terra can own only the landing CTA and project-card copy plus video/pitch documentation, checking the recording before proposing changes. Sonnet can own only a reproduced finite/safe aggregate arithmetic defect and focused regression tests. Integrate only after checking the shared boundaries.

The principal risk to the tested demo is changing the simulator or shipping an unverified build close to the deadline. Verify any CTA or numeric change with targeted tests and a fresh live-path rehearsal before treating it as deployed. Preserve guest access, local projects, saved formats, scenarios, and cloud-disabled behavior.

Explicitly defer cloud activation, new integrations, broad UI redesign, speculative validation restrictions, unsupported commercial claims, and unrelated hardening. Human unaided testing, final video review, and final submission checks remain open; automated and coordinator-reported evidence does not replace them.



