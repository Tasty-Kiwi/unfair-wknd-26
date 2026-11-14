# GPT-6.1 Terra — Round 1

[Terra round 1 independent product audit](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aabb7c3a5-77ef-4145-8e1e-db77c6698058%3Adelegate-task%3A0c8bb213-7de3-49f1-9f00-aafa5e28488f)

Executed model: `gpt-6.1-terra`.

**Round 1 finding: the main release risk is a mismatch between the current routes and the submission package.** The product’s core demo is supported by focused tests, but the instructions and links need to be reconciled with the exact build selected for submission.

### P1 — Submission and rehearsal instructions point at the wrong current routes

On this checkout, `/` renders the landing page, `/projects` opens the project library, and `/demo` opens the simulator ([main.tsx](/Users/dominykas/Development/unfair-wknd-26/src/main.tsx:32)). The documented judge journey test follows that sequence ([projects.spec.ts](/Users/dominykas/Development/unfair-wknd-26/tests/projects.spec.ts:41)). Yet the submission source calls `/` the direct guest demo and `/?builder=1` the builder ([DEVPOST_READY.md](/Users/dominykas/Development/unfair-wknd-26/docs/DEVPOST_READY.md:39)); the demo script also tells the presenter to start the simulator at `/` ([DEMO_SCRIPT.md](/Users/dominykas/Development/unfair-wknd-26/DEMO_SCRIPT.md:3)). The README says these route changes have not been deployed, while the release documents describe older production commits as current.

**Minimal change:** Once the intended release build is established, make one verified route table authoritative and update the submission copy, recording instructions, fallback and release status together. If this checkout is released, use `/demo` for the direct simulator and describe the actual projects journey. Confirm the public build before changing the submitted links.

**Verification:** Open each final link in a clean browser against the actual submission deployment; add or retain route tests for `/`, `/projects`, `/demo` and the legacy builder entry. Risk: a presenter or judge follows valid-looking instructions into the wrong screen.

### P1 — Submission gate is stale about repository visibility

The task states that the repository is currently public, but the submission document says it is private and requires an invitation ([DEVPOST_READY.md](/Users/dominykas/Development/unfair-wknd-26/docs/DEVPOST_READY.md:49)); the checklist repeats that status. This can waste limited submission time or cause the team to report an incorrect access state.

**Minimal change:** Verify anonymous source access immediately before submission, then record the observed visibility and remove the obsolete invitation blocker if public. Retain the general rule that a private repository requires the specified access.

**Verification:** Open the source URL signed out. I did not independently verify the live repository state in this read-only review.

### P2 — The strongest first action is one screen farther away than its label suggests

The landing page clearly states the user and problem, but **Explore the demo** links to `/projects#demo`, requiring another action before the interactive simulator ([LandingPage.tsx](/Users/dominykas/Development/unfair-wknd-26/src/landing/LandingPage.tsx:88), [ProjectsPage.tsx](/Users/dominykas/Development/unfair-wknd-26/src/components/projects/ProjectsPage.tsx:415)). This is a plausible friction point for the requested ten-second clarity and unaided journey; it is not evidence that users will fail.

**Minimal change:** Consider making **Explore the demo** link directly to `/demo`, while keeping **Open projects** for local work. Alternatively, retain the route and label it **Choose a demo or project**.

**Verification:** Test the link and keyboard navigation, then observe one unfamiliar person without instructions. The timed human test remains open.

### P2 — Submission technology list can imply inactive cloud functionality

The ready-to-copy **Built with** field includes D1 and GitHub OAuth, while the next paragraph says they are deferred and not active in the public demo ([DEVPOST_READY.md](/Users/dominykas/Development/unfair-wknd-26/docs/DEVPOST_READY.md:31)). A judge reading only the field may infer that the submitted experience uses them.

**Minimal change:** Put the active browser demo stack and Workers hosting in the copyable list; describe D1 and OAuth separately as retained, deferred work if the form provides room. Confirm the final list against what was actually built and used.

**Verification:** Review the rendered Devpost preview for any implication of live cloud saving.

### P2 — Human impact and distinctiveness remain hypotheses

The pitch responsibly identifies the spreadsheet-planner wedge as unvalidated and acknowledges established planning products ([PITCH.md](/Users/dominykas/Development/unfair-wknd-26/docs/PITCH.md:27)). That is credible, but judges still lack evidence that a real planner finds this workflow useful or that the proposed entry point is distinct enough to adopt.

**Minimal change:** Run the already prepared unaided journey and, if time permits, one planner conversation; report the actual outcome and objections without converting one session into market validation. Keep the pitch centered on the inspectable chain from delay to allocation to modeled response, rather than claiming a unique graph or savings.

**Verification:** Record participant role, completion time, help and misunderstandings using [VALIDATION_PLAYBOOK.md](/Users/dominykas/Development/unfair-wknd-26/docs/VALIDATION_PLAYBOOK.md:1). No Deep Research reports were supplied or assumed.

Across the four criteria: **technical execution** has meaningful deterministic simulation and browser-journey coverage, including the two-unit shortage and recovery ([simulation.test.ts](/Users/dominykas/Development/unfair-wknd-26/src/tests/simulation.test.ts:18), [judge-journey.spec.ts](/Users/dominykas/Development/unfair-wknd-26/tests/judge-journey.spec.ts:46)). **Design** communicates the problem clearly, with the navigation friction above still untested by a first-time user. **Impact** and **originality** have a plausible, carefully qualified pitch but no customer evidence yet. Recovery cards disclose assumptions and that applying an option does not purchase supply ([RecoveryComparison.tsx](/Users/dominykas/Development/unfair-wknd-26/src/components/scenarios/RecoveryComparison.tsx:89)); local project isolation and reopening have automated coverage ([projects.spec.ts](/Users/dominykas/Development/unfair-wknd-26/tests/projects.spec.ts:41)).

I found no P0 from the inspected source. This was a bounded, read-only source and documentation review: I did not run the test suite, inspect the live browser or watch the video, so those results remain unverified by this review.

