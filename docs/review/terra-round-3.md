# gpt-6.1-terra — Round 3

[Terra round 3 final decision](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aabb7c3a5-77ef-4145-8e1e-db77c6698058%3Adelegate-task%3A938593e2-c02a-4f8a-ad77-1bd026181602)

**Decision: AGREE with the proposed scope and ownership.** Treat submission accuracy as P0 and the direct demo entry, storage clarification, and aggregate arithmetic validation as P1. No core-demo failure has been established. This is a read-only synthesis; the proposed changes have not been implemented or reviewed.

The four panel documents were read. I also checked the current validation source and README. The live-route, repository-access, video, and overflow observations below are attributed to the panel or coordinator; I did not independently repeat those checks.

**Responses to the objections and earlier proposals:**

1. **Accept Terra’s route objection.** The coordinator’s reported live route evidence makes stale submission instructions a present accuracy issue, not merely a risk after deployment. Reconcile the docs against the actual submission build, then verify the final URLs immediately before submission.
2. **Accept both reviewers’ rejection of arbitrary numeric caps; reject Sonnet’s total-supply cap.** The reported `1e308` reproduction establishes a nonfinite order-value sum, while `1e300` alone does not establish a defect. Require safe total demand and finite total order value; do not cap aggregate supply, which the allocation ledger does not sum.
3. **Accept Sonnet’s objection to the indirect demo CTA.** Make the demo action primary and direct to `/demo`; retain **Open projects** unchanged as the secondary action. This reduces a known navigation step, but a usability improvement remains a hypothesis until observed with an unfamiliar user.
4. **Reject treating the old MP4 as automatically requiring replacement or a caveat.** It predates the current UI, but neither panel established that it was watched. Inspect the actual footage and closing URL against the submitted build before deciding what correction, if any, is necessary. Do not claim review, approval, upload, or replacement has occurred.
5. **Accept Sonnet’s correction that the four user-supplied criteria must be assessed.** Also correct Terra’s currency objection: the coordinator already used euros; preserve **€36,000**.
6. **Reassess the demo-card label as P1.** The session-only behavior is easy to misunderstand beside local-project messaging; the small copy change is proportionate. Defer empty-order rejection, route titles, forced raw-Zod messaging, and cross-tab deletion.

**Required changes and verification**

- **P0 — Submission accuracy:** Align route tables, public-repository status, release/deployment status, test claims, and recording instructions across the assigned documents. Use active technologies only in the copyable Built with field; distinguish retained disabled cloud work. Remove stale counts or replace them with evidence from the final run. Keep impact and originality claims qualified. Confirm anonymous repository access and final deployed routes before submission.
- **P1 — Demo entry and storage:** Make the primary demo CTA link to `/demo`, preserve the secondary **Open projects** journey, and state that **Edit this network** creates a saved local copy of the session-only demo. Test CTA destinations, accessible interaction, and the existing projects path.
- **P1 — Arithmetic:** In `parseDataset`, reject unsafe summed BOM demand and nonfinite summed order value with readable errors. Add boundary and normal-input unit cases, including finite `1e300`, overflow from individually finite values, and unsafe aggregate demand. Add a transactional browser-import regression proving rejection preserves the active dataset and scenario. Keep the simulation policy and saved formats unchanged.
- **P1 — Demonstration:** Prepare an approximately 2:40 script: human problem and product within 30 seconds; the exact 10-order baseline, two-motor ORD-102 shortage and **€36,000 exposed order value**, recovery, local save and export, technical proof, memorable close, and next step. At 1366px, automate the full journey, portable export/reopen and persistence, and default absence of API calls. Automated coverage does not replace an unaided human rehearsal.

Before release, run the full checks specified in the agent guide, including unit, Worker and test typechecks, build, Worker tests, E2E, and deploy check. Verify final links and claims against the selected live build. Cloud activation and deployment remain outside this decision.

**Criteria assessment:** Technical Execution is strongest in the deterministic, inspectable allocation and recovery workflow, subject to the arithmetic fix and final verification. Product Design has a clear problem and a more direct proposed entry, with unaided usability still unproven. Potential Impact is a plausible planning aid; fictional exposure is not measured savings or customer validation. Originality rests on the combined trace-to-recovery workflow, not a claim that supply-chain simulation or graphs are unique.

**Ownership accepted exactly as proposed:** Terra owns the two UI files, CTA-only landing test expectations, and the four named pitch/video/submission documents; Sonnet owns validation, its unit tests, and the new numeric-import and full-journey browser spec; the coordinator owns README, checklist, release, validation and submission evidence documents, integration, checks, and PR. Shared routing, storage formats, IDs, and engine policy stay outside those edits. Main risks are late changes invalidating the established demo, stale live-release assumptions, and overclaiming human or video verification.



