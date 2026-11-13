# Needtrace — Devpost submission kit

Copy-paste-ready text for the Unfair Weekend 2026 Devpost entry. Everything below was checked against the deployed product on 13 November 2026. Fields marked **⟦HUMAN⟧** must be filled in by the team; nothing here has been entered into Devpost or submitted.

---

## Project title

```
Needtrace
```

## Tagline

```
See which customer orders a late supplier delivery will break, and test a fix before it happens.
```

Short form, if the field is tight: `See what breaks before it breaks.`

## About (140 words)

```
When a supplier delivery slips, planners need to know which customer orders will run short, not just which part is late. Needtrace connects stock, bills of material, dated receipts, products and customer orders in one deterministic simulation. Change a receipt and Needtrace traces the shortage to the exact order, shows the allocation evidence behind every number, and compares recovery options side by side. In our fictional demo, a six-day motor delay leaves order ORD-102 two motors short, putting €36,000 of order value at risk; applying two approved alternative motors restores full coverage. Planners can also draw their own supply network in an editable builder, test named scenarios, and import CSV or JSON plans with validation. Needtrace runs in the browser with no account. It models material availability only: it does not confirm supplier commitments, place purchases or schedule the factory.
```

---

## Problem

A late supplier receipt is easy to see. Its consequence is not. Whether a delay hurts depends on stock on hand, bills of material, which earlier orders have already reserved the stock, and each customer's required date. In a spreadsheet-based plan, answering "which order is now short, by how much, and what would fix it?" means tracing several tables by hand, under time pressure.

## Solution

Needtrace makes that chain explicit and recalculates it instantly:

1. **Change the supply.** Move a receipt date or quantity, or pick a preset scenario.
2. **Trace the impact.** The supplier → component → product → customer-order map highlights exactly which order is short, and by how many units.
3. **Inspect the evidence.** Every order shows what it requires, what was allocated to it, and which receipt arrives too late.
4. **Compare responses.** Recovery options, such as restoring the original date or using approved alternative supply, are each simulated independently and ranked by units recovered.
5. **Model your own network.** An editable canvas lets you build suppliers, components, receipts, products and orders, then run named scenarios against the baseline.

## How we built it (technical implementation)

- **Deterministic simulation engine** (TypeScript): it allocates stock and dated receipts to orders by earliest required date, then order ID. Partial kits keep their reservations, and repeat runs give identical results. Every number the UI shows comes from this one engine: presets, recovery comparisons, imports and the builder.
- **Interactive network view and builder** built with React Flow: typed nodes and typed connections, a properties inspector, validation checks, named scenarios, local autosave, and a portable workspace JSON export and import.
- **Safe data import:** CSV and JSON plans are validated together with Zod before anything changes. Invalid files leave the current plan untouched, and the preview shows which tables will be replaced or retained. The header always says whether data is fictional, mixed or imported.
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Radix UI primitives, light and dark themes, responsive down to phone width.
- **Hosting:** Cloudflare Workers serves the app and a small API (`/api/health`).
- **Quality:** Vitest unit tests, Worker tests and Playwright browser journeys run in GitHub Actions on every push. The same guest browser suite also passes against the live production URL.
- **Optional cloud saving** (GitHub OAuth plus Cloudflare D1) is implemented and was exercised on staging. It is **disabled in production** and is not part of this submission's demo.

## Built with

```
React, TypeScript, Vite, Tailwind CSS, React Flow, Radix UI, Zod, Cloudflare Workers, Cloudflare D1, GitHub OAuth, Vitest, Playwright, GitHub Actions
```

D1 and GitHub OAuth power the optional cloud saving, which is implemented but disabled in production. Drop them from the list if the team prefers to list only what the public demo uses. **⟦HUMAN⟧** Add any AI coding assistants or other tools the team used, if the form or the disclosure rules ask for them.

## Key demonstrated capabilities

All of these can be reproduced on the live demo with fictional data:

- **Baseline:** all 10 customer orders across 5 products have their materials.
- **Supplier disruption:** receipt PO-101 (Aster Motion, 5 servo motors) moves from 17 to 23 November. ORD-102 needs 4 motors by 22 November. With 8 on hand and 6 reserved for the earlier order ORD-101, it is **2 motors short**, with **€36,000 of order value at material risk**.
- **Allocation evidence:** "Requires 4, with 2 available after earlier-priority allocations", plus the late receipt that misses the required date.
- **Recovery comparison:** "Use Vector Components" (2 approved motors on 18 November) and "Restore PO-101 timing" each recover 2 units, are simulated independently, and state their assumptions.
- **Approved recovery:** applying Vector Components brings all 10 orders back to covered while PO-101 stays late.
- **Editable timeline:** drag a receipt, use the keyboard, or type a date. The "latest safe" and "first short" dates update live.
- **Builder:** an editable supply-network canvas with named scenarios, local autosave and workspace JSON export.
- **Import:** validated CSV and JSON plans with a replace/retain preview and visible data provenance. Reset returns to the fictional dataset.
- **No account needed:** the guest demo and the builder work without signing in.

## What makes it different

Needtrace connects a late receipt to the specific customer order it breaks, and shows the reservation arithmetic behind the answer. It doesn't stop at a dashboard flag. Its aim is a fast, transparent entry point for planners who work in spreadsheets, without an ERP implementation. Large planning suites such as SAP IBP, Kinaxis and o9 already cover supply-chain scenarios, so this focus is our hypothesis, not a proven market gap.

## Honest limitations

- All data in the demo is **fictional**. Needtrace has no customers, pilots or validated demand yet.
- **€36,000 is order value at material risk**, not a measured loss, saving or business benefit.
- It models **material availability only**. It does not model factory capacity, production scheduling, freight, costs, lead-time uncertainty or shipment dates.
- **Recovery options are scenario changes.** They don't place purchases or contact suppliers, and supplier availability is an input, not something the software verifies.
- Allocation follows one fixed, transparent policy (required date, then order ID), which may differ from a real factory's priorities.
- Simulator imports live in browser memory and are cleared on refresh. Builder workspaces save in the browser only.
- **Production cloud saving is disabled.** Accounts and cross-device sync are not part of this release.
- **No AI in the product.** Every calculation is deterministic rule-based arithmetic.
- No unaided first-time-user test has been run yet.

## Links

| Field                       | URL                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------- |
| Try it out (marketing page) | https://domino-os.tasty-kiwi.workers.dev/landing                                       |
| Interactive simulator       | https://domino-os.tasty-kiwi.workers.dev/                                              |
| Editable builder (optional) | https://domino-os.tasty-kiwi.workers.dev/?builder=1                                    |
| Source code                 | https://github.com/Tasty-Kiwi/unfair-wknd-26 (**⟦HUMAN⟧** private; grant access first) |
| Demo video                  | **⟦HUMAN⟧** YouTube/Vimeo URL after upload                                             |

If Devpost allows only one "Try it out" link, use `/landing` and put the direct simulator link (`/`) in the About text or a second link field. The `domino-os` hostname is the legacy deployment name; the product shown is Needtrace.

## Screenshots and captions

All images are real captures of the application. Upload in this order; the first image is the gallery thumbnail.

| #   | File                                                                                           | Caption                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [devpost/01-disruption-light-1440.png](devpost/01-disruption-light-1440.png)                   | A six-day motor delay leaves order ORD-102 two motors short, with €36,000 of order value at material risk. Fictional demo data. |
| 2   | [devpost/02-recovery-options-light.png](devpost/02-recovery-options-light.png)                 | Two recovery options, each simulated independently and ranked by units recovered. Costs and factory capacity are not modeled.   |
| 3   | [devpost/03-recovered-light-1440.png](devpost/03-recovered-light-1440.png)                     | After applying two approved Vector Components motors, all 10 orders are covered while the original delivery stays late.         |
| 4   | [../public/landing/shortage-desktop.png](../public/landing/shortage-desktop.png)               | Allocation evidence: exactly how many motors ORD-102 needs, how many it got, and which receipt arrives too late.                |
| 5   | [release/screenshots/builder-selected-dark.png](release/screenshots/builder-selected-dark.png) | Build your own supply network: typed suppliers, components, receipts, products and orders. Saved locally, no account needed.    |
| 6   | [release/screenshots/landing-dark-1440.png](release/screenshots/landing-dark-1440.png)         | Needtrace: see which customer orders are affected when supply changes. Light and dark themes.                                   |

Optional: [release/screenshots/simulator-light-1440.png](release/screenshots/simulator-light-1440.png), captioned "Baseline: all ten fictional customer orders have their materials." Shots 1–3 were captured from the production URL at 1440×900. Check how Devpost crops the thumbnail before publishing.

## Judging criteria

The official criteria are Technical Execution, Product Design, Potential Impact and Originality. Here is where Needtrace answers each one:

- **Technical execution:** one deterministic engine behind every view; atomic, validated imports; CI-tested unit, Worker and browser suites; live on Cloudflare Workers.
- **Product design:** a three-step story (disruption, evidence, recovery) on one screen; status is never shown by colour alone (hatching plus words); light and dark themes; works on phones.
- **Potential impact:** it answers the planner's real question, "which customer order breaks?", in seconds instead of manual spreadsheet tracing. The impact is still a hypothesis to validate with planners.
- **Originality:** order-level consequence tracing with inspectable reservation arithmetic and side-by-side recovery simulation, in a no-install browser tool.

## Likely judge questions

**Where is the AI?** The product deliberately has none. A shortage is arithmetic, and planners need to audit it, so every number comes from a deterministic, inspectable engine. A future explanation layer would have to keep that evidence intact. _(⟦HUMAN⟧ If asked about development: say truthfully which AI coding tools the team used.)_

**Why not just use the ERP?** Large planning suites cover this, but they take an implementation project. Our hypothesis is a lighter entry point for planners working in spreadsheets: import a plan, see the order-level consequence, inspect why. That still needs validation with real planners.

**Is the €36,000 a real saving?** No. It is the value of the fictional order exposed to the shortage in the simulation. We have measured no loss, saving or customer benefit.

**How does it decide who gets scarce stock?** By earliest required date, then order ID, and a partial kit keeps its reservations. It is simple and transparent rather than optimized, and a real factory's priorities may differ.

**Which recovery option is best?** The options are ranked by net shortage units recovered, with each one's assumptions shown. Costs, freight and supplier confirmation are unknown, so this is not a purchase recommendation.

**Does "Apply recovery" order parts or contact a supplier?** No. It changes the simulation only. Real action goes through the normal purchasing process.

**Can I use my own data, and is it saved?** Yes. CSV covers stock, products, BOMs, receipts and orders, and JSON can replace the whole catalog. Files are validated together before anything changes. Simulator imports are cleared on refresh. Builder workspaces save in the browser and export as JSON. Cloud saving exists but is disabled in production.

**What have you tested?** Unit, Worker and Playwright browser suites run in CI on every push. The guest browser suite (46 tests, both themes, four screen widths) also passed against the live production URL. Those are engineering checks, not proof that planners find it valuable.

**What's next?** Watch an unaided planner use it, test a small anonymized real plan against the planner's own reasoning, and interview a potential budget owner.

---

## Team and submission fields — ⟦HUMAN⟧ complete before submitting

Do not guess these; nothing below has been filled in.

- [ ] **Team name:** ⟦HUMAN⟧
- [ ] **Members:** full name and email for every member, with each one's Devpost invitation accepted. The official site allows solo teams or up to 6 people. Cash prizes are split among the members listed on the final Devpost submission.
- [ ] **Demo video URL:** ⟦HUMAN⟧ Open on the working product, keep it within the team's 3:00 target, upload as public or unlisted, and check playback while signed out. A recording script is in [DEMO_SCRIPT.md](../DEMO_SCRIPT.md).
- [ ] **Repository access:** ⟦HUMAN⟧ The repository is private. Either make it public, or grant access to whichever account the organisers require, and verify that access.
- [ ] **Pre-existing work disclosure:** ⟦HUMAN⟧ The rules say "Start from scratch at the event. Disclose any pre-existing work." For reference, the repository's first commit is dated 12 November 2026, 18:57 Vilnius time (the event's first day). The team must confirm whether any other material pre-existing work, templates or assets were used, and write the disclosure itself.
- [ ] **AI tools disclosure:** ⟦HUMAN⟧ The Terms say entrants must follow the published rules on AI tools. State the AI coding tools the team actually used, if asked.
- [ ] **Licences and assets:** ⟦HUMAN⟧ Confirm third-party licence and attribution obligations. The repository has no LICENSE file; IBM Plex fonts are SIL OFL.
- [ ] **Final review:** check every link in a signed-out browser, check the spelling, preview the Devpost page, then submit and save the confirmation.

## Competition requirements — what was checked

| Requirement                                                                   | Status                                              | Source                                                                                  |
| ----------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Submit through **Devpost**; nothing else counts                               | Verified                                            | [unfairweekend.com/terms](https://unfairweekend.com/terms), section 5                   |
| Project **and video demo** due **Sat 14 Nov, 20:00**                          | Verified (no time zone stated; event is in Vilnius) | [unfairweekend.com](https://unfairweekend.com)                                          |
| Start from scratch; disclose pre-existing work                                | Verified                                            | unfairweekend.com and Terms                                                             |
| Team size: solo or up to 6                                                    | Verified                                            | unfairweekend.com                                                                       |
| Judging: Technical Execution, Product Design, Potential Impact, Originality   | Verified                                            | unfairweekend.com                                                                       |
| Public vote opens about 21:00 on 14 Nov; finalists pitch from 12:00 on 15 Nov | Verified                                            | unfairweekend.com                                                                       |
| About text limit of 150 words                                                 | **Unverified** (team-supplied)                      | Not found on the official site or Terms; check the Devpost form                         |
| Video length of 3 minutes or less                                             | **Unverified** (team-supplied)                      | Not found on the official site or Terms; check the Devpost form                         |
| Repository access for judges                                                  | **Unverified**                                      | Not stated publicly; the team's checklist names a GitHub account to grant access        |
| Required Devpost form fields and questions                                    | **Unverified**                                      | The Terms refer to "published submission requirements" that were not publicly available |
| AI tools and open-source licence rules                                        | **Unverified**                                      | The Terms refer to published rules that were not found                                  |

Check every unverified row in the live Devpost form before submitting.
