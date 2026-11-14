# Claude Sonnet 5.5 — Round 1

[Sonnet round 1 independent reliability audit](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aabb7c3a5-77ef-4145-8e1e-db77c6698058%3Adelegate-task%3Aa93b331c-88fa-49f6-b6b7-e10d8cf8e360)

Executed model: `claude-sonnet-5-5`.

# Needtrace final product panel: Round 1 audit

I found no P0 defects. Two P1s need a decision before submission: the public URLs in the docs stop matching the product once this branch deploys, and the Devpost copy still presents the cloud backend as a built-with item.

**Scope:** I read AGENTS.md, CHECKLIST.md, README.md, DEVPOST_READY, VIDEO_PRODUCTION, PITCH, VALIDATION_PLAYBOOK, NEEDTRACE_RELEASE and DEMO_SCRIPT. I read `src/main.tsx`, `projects.ts` and `ProjectPage.tsx`, and part of `App.tsx` and `validation.ts`.

I ran `npm test`: 137 of 137 pass. I did not run the e2e, worker, typecheck, build or deploy-check suites. I ran the app from a local dev server in the preview browser, at 1280 px and 390 px. I made no edits and left no files or processes behind.

**Demo numbers confirmed in the live app:**
- The baseline covers all 10 orders.
- Clicking Supplier disruption gives "ORD-102 at risk" and "€36,000 in order value at material risk".
- The same panel says 2 units are uncovered and PO-101 now lands 23 Nov.
- I did not click Apply recovery, so the two approved motors restoring coverage is unchecked here.

## P1

**1. Public URLs and demo scripts will point at the wrong page once this branch deploys.**
- Evidence: `src/main.tsx` now sends `/` to the landing page and puts the simulator at `/demo`. `?builder=1` still opens the simulator `App` (the builder is a mode inside it).
- Evidence: DEMO_SCRIPT.md:76, DEVPOST_READY ("Direct guest demo" `/`, "Builder" `/?builder=1`), VIDEO_PRODUCTION's final card, NEEDTRACE_RELEASE and CHECKLIST:56 all say `/` is the demo.
- Evidence: DEMO_SCRIPT.md:7 and :60 tell the presenter to "Start on `/`, Normal operations".
- Evidence: the produced MP4 and screenshots come from the old production build (PR #12). They no longer match the landing → projects → demo path.
- Risk: a judge who follows "Direct guest demo" lands on marketing instead of the simulator. A presenter following the script on the new build starts on the wrong screen.
- Fix:
  - Change the demo link to `/demo` in the docs above.
  - Change "Start on `/`" to "open `/demo`, or Projects → Open demo project".
  - Re-record the video, or add a visible caveat that it shows the previous build.
  - Add a smoke test that `/` renders the landing page and `/demo` renders the simulator.

**2. The Devpost "Built with" line contradicts the browser-only scope.**
- Evidence: DEVPOST_READY lists "Cloudflare D1, GitHub OAuth". CHECKLIST:57 says to describe them only as retained, deferred backend work.
- Risk: judges could read it as live cloud features.
- Fix: remove D1 and OAuth from the field, or label them "retained, disabled backend".

**3. The docs say the repo is private, but it is public.**
- Evidence: CHECKLIST:53, :83 and :107, DEVPOST_READY, and NEEDTRACE_RELEASE all say "private" and describe a pending `Nedomas` invite that is blocked with a 403.
- Evidence: DEVPOST_READY says the MP4 is "in the private repository".
- Risk: the team spends deadline time on a moot admin action and may submit an inaccurate access statement.
- Fix: verify visibility and update those lines. The remaining human action is the repository description.

**4. The judge-facing testing claim in PITCH.md is stale and the counts disagree across docs.**
- Evidence:
  - PITCH says "102 unit… 63 Chromium".
  - CHECKLIST says 88, and also 74, Chromium tests.
  - `npm test` now runs 137 tests.
- Risk: a "What have you actually tested?" answer contradicts the repo and CI.
- Fix: update every count from one final CI run, or remove the numbers and cite the CI link.

## P2

5. **"Open demo project" does not create a saved project.** It goes to the session-only `/demo` (no localStorage key is written), while the Projects page says "Projects stay in this browser". The README says a local project opens at `/projects/:id`. Add one line of copy on the demo card, such as "Session-only; use Edit this network to save a copy".
6. **Every route has the same document title.** `/projects`, `/demo` and project pages all show "Needtrace — See what breaks before it breaks". Set a per-route `document.title` for history, tabs and screen readers.
7. **Imports with zero orders pass validation.** `parseDataset` accepts `orders: []`, and the simulator reports "all requirements covered for 0 orders". Add an `orders.length ≥ 1` check or a visible warning, plus a unit test.
8. **Quantities and values have no upper bound.** A quantity of 1e15 with an order value of 1e300 parses. The summary then reports 2,999,999,999,999,969 missing units and an at-risk value of 1e+300. Set a sane maximum (for example 1e9 units and 1e12 value) in the schema.
9. **Project-creation errors can show raw Zod JSON.** Setting a name over 120 characters through the DOM produced the alert "Could not create project [ { "origin": "string", "code": "too_big"… } ]". The input has `maxLength=120`, so ordinary typing is blocked and this is hard to reach. Catch `ZodError` in `ProjectsPage` and show a plain message. My whitespace-only-name test was inconclusive because the alert did not change; check it in a test.
10. **Deleting a project in another tab gives a misleading message.** `saveDatasetProject` throws "not found" and the UI shows "free browser storage". Distinguish "project removed" from a quota error. A workspace project can also be recreated by a later autosave after deletion.
11. **VALIDATION_PLAYBOOK.md still says "DominoOS"** in its title and in the claims gate (lines 1 and 45). This contradicts the rebrand checklist item.

## What held up

- The calendar-date, negative-stock, duplicate-ID, fractional-quantity, zero-quantity and delivery-before-as-of cases are rejected with readable messages.
- I found no unnamed controls or duplicate IDs on `/demo` (the Open demo project button had no accessible-name problem either), and `lang`, a single `main` and reduced-motion CSS are present.
- `/projects` showed no horizontal overflow at 390 px, and the New project dialog fits.
- A storage-save failure in a dataset project shows an alert and a `beforeunload` guard.
- Cloud stays off by default: the worker var is `CLOUD_ENABLED=false` and the client is opt-in only.

## Judging criteria

I could not assess the four criteria. No judging criteria appear in the repo docs, DEVPOST_READY covers only requirements, and no research was supplied. I did not invent any.

What the evidence does show:
- **Technical and usability:** strong and deterministic, and the claims are mostly bounded. The gaps are the items above.
- **Impact and market:** the docs honestly label the buyer and willingness to pay as unvalidated. The unaided-user test and rehearsal are still open in CHECKLIST.
- **Clarity of the story for the video:** blocked by finding 1.

