# Needtrace final product debate

14 November 2026. Baseline: clean `main` at `b3ced29`; work branch `fix/final-product-review`. No supplied ChatGPT or Gemini Deep Research reports were found or used.

## Genuine panel evidence

The catalog confirmed **GPT-6.1 Terra** (`codex/gpt-6.1-terra`) and **Claude Sonnet 5.5** (`claudeAgent/claude-sonnet-5-5`). All six review tasks returned these executed model identifiers. Each round was a new delegated task. Round 1 reports were withheld until both independent reviews completed. Full returned responses, including their limitations and mistakes, are preserved:

| Round | Terra | Sonnet |
| --- | --- | --- |
| Independent audit | [Report and task reference](review/terra-round-1.md) | [Report and task reference](review/sonnet-round-1.md) |
| Adversarial review | [Report and task reference](review/terra-round-2.md) | [Report and task reference](review/sonnet-round-2.md) |
| Final decision | [Report and task reference](review/terra-round-3.md) | [Report and task reference](review/sonnet-round-3.md) |

## Disagreements and corrections

- Both initially treated routing drift conditionally. Coordinator browser checks established `/`, `/projects`, `/demo` and the legacy builder were already live. All 12 JS/CSS assets byte-match the baseline build; [hash evidence](review/production-assets-b3ced29.json). Submission drift is a present accuracy defect.
- Sonnet proposed arbitrary quantity/value maxima. Terra challenged the lack of a business basis. Both withdrew those caps in Round 3. Coordinator reproduced finite individual values summing to `Infinity`, exported as `null`; reject unrepresentable aggregate demand/value instead. Do not restrict aggregate supply: the allocation ledger does not sum it.
- Terra initially ranked the indirect demo CTA and storage clarification P2. Both accepted them as small P1 changes after cross-examination. This removes an observed navigation step; it does not establish measured usability improvement.
- Sonnet initially skipped the four criteria despite their inclusion in the brief. Both subsequent rounds assessed them explicitly.
- Neither reviewer watched the existing MP4. Its older source commit alone does not prove the footage unusable. Preserve it as a fallback/reference; require human review of actual labels, results and closing URL. Do not claim replacement or approval.
- Terra incorrectly attributed a dollar sign to the coordinator. Coordinator messages already used euros; this objection is rejected. Sonnet's Round 3 uncertainty about live routes is superseded by the browser and asset evidence, not by another source-document assertion.

## Shared implementation decision and backlog

| Priority | Decision | Verification |
| --- | --- | --- |
| P0 | Correct submission/rehearsal routes, stale release/test claims and private-repository blocker. Active-only Built with list. | Live route and signed-out source checks; consistent current docs. |
| P1 | Primary demo CTA opens `/demo`; secondary **Open projects** remains. Explain session-only demo and local editable copy. | Landing keyboard/route tests; project save/reopen regression. |
| P1 | Reject unsafe aggregate BOM demand and nonfinite summed order value with readable validation. Preserve ordinary large finite values and allocation rules. | Boundary, overflow, normal-fixture unit tests; transactional invalid-import browser test. |
| P1 | Prepare a problem-first 2:30–2:45 video script and shot list, with the exact fictional shortage/recovery and a memorable next step. | Manual copy review, About ≤150 words; final recording/rehearsal remains human-owned. |
| P2 | Defer cloud/auth/D1 activation, redesign, forecasting, AI predictions, integrations, zero-order rejection, per-route titles, forced raw-Zod messages and cross-tab delete changes. | No implementation in this branch. |

No core-demo P0 was reproduced. P0 here refers to submission accuracy, not a claim that the simulator fails. No new market figures, customer savings or supplier commitments are introduced.

## Ownership and integration boundaries

Both Round 3 responses accepted exclusive ownership before implementation:

- **Terra:** landing and project demo-card copy, CTA expectations in `tests/landing.spec.ts`, Devpost/pitch/video documents and `DEMO_SCRIPT.md`.
- **Sonnet:** `src/lib/validation.ts`, its unit tests and new `tests/final-product-review.spec.ts` for numeric imports and the complete 1366×768 journey.
- **Coordinator:** README, checklist, release/validation/submission handoff documents, this record, evidence, integration, all required checks, commits and PR.

Routing implementation, demo data, scenarios, allocation policy, existing storage keys/IDs/formats and cloud-disabled configuration are outside these edits. No agent may claim to have reviewed the final implementation merely from the debate. Implementation results and final acceptance evidence will be recorded separately.

## Judging rationale

**Technical Execution:** deterministic allocation and inspectable recovery are the substance; numeric safety protects truthful output. **Product Design:** direct demo access and storage clarity reduce friction; unaided human completion remains unverified. **Potential Impact:** the target is a manufacturing planner checking consequences of a supplier change; demand and savings remain hypotheses. **Originality:** demonstrate the complete supplier-change → allocation evidence → affected order → modeled response workflow, without claiming a unique graph or category.

No commit, push, merge, production deployment, repository-administration change or Devpost submission had occurred at this decision gate. Implementation and verification follow this agreement.

## Implementation contributions

- [Terra implementation result and task reference](review/terra-implementation.md): landing/project copy, keyboard CTA expectations and initial submission/story revisions;26 focused browser checks passed.
- [Sonnet implementation result and task reference](review/sonnet-implementation.md): aggregate numeric validation,10 unit cases and two browser acceptance tests; focused checks passed, including a regression run against the old validator.
- Coordinator reviewed the complete diff, integrated/revised the final documents, tightened cloud-request detection, and corrected the older release test's library-navigation expectation after the full suite exposed it. No scenario data or allocation policy changed. Neither delegate is represented as having approved these later coordinator edits.

[Final acceptance evidence](FINAL_PRODUCT_ACCEPTANCE.md) records integrated checks and separates local changes from the unchanged deployed baseline. No human usability, video approval, team disclosure or submission is fabricated.
