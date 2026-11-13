# Needtrace — final production UX QA

**Recommendation: ship the guest release as is.** I found **no release-blocking defects.** Seven important usability concerns are listed below. They are worth fixing after the hackathon, or explaining if a judge asks, but none of them breaks the demo journey. Production cloud saving stays disabled, and nothing in this review touched it.

## Scope and method

| Item              | Value                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Target            | https://domino-os.tasty-kiwi.workers.dev (production)                                                                          |
| Build             | `main` at `91bf9b4`; the site serves `index-CHpcuUtn.js`, which matches a local build of that commit                           |
| Date              | 13–14 November 2026                                                                                                            |
| Browser           | Microsoft Edge (Chromium), driven by Playwright with real clicks, typing, file uploads, downloads, reloads and back navigation |
| Viewports         | 1366×768 (laptop), 390×844 (phone), in light and dark                                                                          |
| Storage           | A fresh browser context for every pass, so no prior saved data                                                                 |
| Console / network | Errors, warnings, page exceptions and HTTP ≥ 400 were logged on every pass. **None occurred.**                                 |

**Reviewer note:** this review was carried out by an AI coding agent that also prepared some of this repository's earlier documentation. I judged the app against credible B2B software, not against its tests, and report only what I saw in the browser. **No human participant was observed.** Section 5 is a protocol for running that test.

Evidence screenshots are in [`docs/qa/final-ux/`](qa/final-ux/) and are referenced below as `[#]`.

## 1. What works well

- **First impression ([01], [02], [03]):** the landing page says what the product is within one screen: "One late delivery. See the orders at risk." A live example (Aster Motion 17 → 23 Nov, ORD-102 two motors short) sits directly under the headline. Typography, spacing and restraint read as a credible B2B product in both themes.
- **Honest disclosures ([15]):** "Why this result?" explains the arithmetic. "What the prototype does—and where it stops" names the excluded scope (capacity, costs, supplier confirmation, shipment predictions), states that simulated recoveries do not place orders, and says nothing is uploaded. The €36,000 is consistently labelled "Exposure, not loss."
- **Both entry buttons work:** **Try interactive demo** opens the simulator, and **Build your network** opens the builder. Light or dark carries over from the landing page into the app and survives a reload.
- **Simulator hierarchy ([04], [05]):** the red headline, the three stats and the supplier → order graph tell the story in one screen. **Supplier disruption** marks Aster Motion _Late_, the servo motor _Short_, Precision actuator _At risk_ and ORD-102 _Short 2 units_. Status never relies on colour alone: each one has a hatch pattern and a word.
- **Inspectable allocation:** the timeline ("ORD-101 needs 6 · Covered by 20 Nov", "ORD-102 needs 4 · Short 2 by 22 Nov, next receipt 23 Nov") and the evidence card ("2 of 4 allocated · short 2 … Arriving after 2026-11-22") explain the answer without any jargon.
- **Recovery:** **Ways to recover** compares two options with stated assumptions. **Apply recovery** on _Use Vector Components_ gives **All 10 covered** while PO-101 stays at 23 Nov. **Scenarios side by side** and the order book agree with each other.
- **Error handling:** an invalid CSV produces "Import rejected — bad.csv: unsupported CSV header…" and the plan is unchanged ([08]). An invalid workspace JSON is rejected and the canvas is preserved ([13]). Running a blank network is refused with "Fix all network issues before running." Replacing a draft with **Core example** asks for confirmation first.
- **Local saving:** **Save workspace** shows _Saved locally_. After a reload, the workspace, nodes and draft scenario are restored when the builder is reopened. **Export workspace JSON** downloads `needtrace-workspace.json`.
- **Responsive:** neither page scrolls sideways at 390 px. On phones the simulator turns the graph into a readable stacked list ([07]).
- **Dark mode ([02], [06], [09]):** contrast holds and the red/blue meanings survive. No hardcoded light surfaces are left over.

## 2. Release-blocking defects

**None found.** The full journey from delay to affected order, evidence and recovery ran correctly at 1366 px and 390 px in both themes, with no console errors or failed requests.

## 3. Important usability concerns (not blocking)

**U1 — Builder simulation shows internal IDs instead of names ([12]).**
Steps: open **Build a network**, click **Core example**, then **Run simulation**. The order cards read `order-customer-a` / `order-customer-b`, and the component card reads `component-servo-motor`. The timeline shows `receipt-servo-1 · 5 · 17 Nov` and "order-customer-a needs 6", and **Inspect allocation** lists `order-customer-a · Customer A`. The demo dataset uses readable IDs (ORD-102), so this only shows up in builder-authored networks, but there it looks like debug output. Expected: display names ("Customer A"), with IDs secondary.

**U2 — The builder greets first-time users with errors ([09]).**
Steps: arrive through **Build your network** with no saved data. The blank canvas already lists "Network name must not be blank." and "Inventory date must be a real calendar date in YYYY-MM-DD format." in red under CHECKS, before the user has done anything. The empty state is a small dashed note in the top-left corner. Credible B2B tools hold validation back until the user acts, and offer a clear first step (for example "Start from the example").

**U3 — At 1366×768 the builder canvas is mostly below the fold ([10], [11]).**
The title, workspace toolbar, scenario panel, section header and palette take about 490–555 px, so only the top 200–280 px of the canvas is visible without scrolling. After an action error, the error banner pushes it further down. A newly added node in [10] sits at the bottom edge of the viewport.

**U4 — Refreshing inside the builder returns the user to the simulator.**
Steps: open the builder (from the landing page or `/?builder=1`). The address bar changes to `/`. Reload the page and the simulator appears. The workspace is intact and returns after clicking **Build a network**, but for a moment it looks as if the work is gone. The builder URL also can't be bookmarked or shared once opened.

**U5 — The recovered state doesn't say a recovery happened ([05]).**
After **Apply recovery**, the headline reads "Every order has its required materials", which is identical to the untouched baseline. Only the selected **Approved recovery** tab and a small "Recovery active" label on the Vector card show what changed. The payoff of the story is easy to miss, especially on video. Expected: something like "Recovered: 1 order back on plan via Vector Components (was 1 at risk)."

**U6 — "Export report" downloads raw JSON.**
In the simulator, **Export report** saves `needtrace-scenario-report.json`. Its contents are complete and correct (dataset, provenance, scenario and results), but a planner or manager expects a readable document such as CSV or PDF, and the label promises a report.

**U7 — Builder on a phone: the canvas opens cropped and unreadable ([14]).**
At 390 px the Core example canvas cuts off the supplier on the left and the orders on the right, and the node text renders at about 6 px. The page does disclose "On a phone, pan or zoom the canvas" and offers form-based **Edit item** / **Connect** as an alternative, so it is usable but not pleasant. Judges will probably use a desktop.

## 4. Cosmetic improvements that can wait

- **C1 Mixed date formats:** date inputs follow the browser locale (`11/23/2026`), evidence and the inspector use ISO (`2026-11-22`, `Baseline: 2026-11-17`), and headings use `22 Nov`. Pick one display format ([04], [06]).
- **C2 Raw file input in the builder toolbar:** "Import workspace JSON Choose File No file chosen" is an unstyled native control beside styled buttons ([09], [11]).
- **C3 Native browser `confirm()`:** replacing a draft shows the browser's own dialog ("Replace the current network and its scenarios? Export workspace JSON first if you want to keep it."). It works, but it's off-brand next to the app's styled Import and Assumptions dialogs.
- **C4 Toolbar hierarchy:** **New blank / Core example / Build / Simulate / Save workspace / Export workspace JSON** are equal-weight buttons in one row. **Build/Simulate** is a mode switch but looks like two more actions.
- **C5 Cloud wording in a guest-only release:** the builder subtitle says "…cloud saving is a separate action when available." No cloud action exists in production, so the phrase raises a question it can't answer.
- **C6 Technical JSON error:** "Invalid JSON: Expected ',' or '}' after property value in JSON at position 20 (line 1 column 21)" is correct but developer-facing. Lead with "This file isn't a valid Needtrace workspace" and keep the detail secondary ([13]).
- **C7 Disabled "Revalidate scenario" with no reason:** with an incomplete draft and a new scenario, the panel "Scenario requires review" shows a disabled **Revalidate scenario** button and no explanation of why ([13]).
- **C8 Two dark palettes:** the landing page's dark theme is navy (`#0d1422`) while the app's is charcoal, so moving between them feels like two products ([02] vs [09]).
- **C9 Phone stat row:** in the simulator at 390 px, "Products affected" wraps to two lines, so its "0" sits lower than the other two numbers ([07]).
- **C10 First-visit theme differs by page:** in a fresh context with the operating system set to dark and no saved choice, `/landing` renders light, while `/` renders dark (it follows the OS setting). Once the user picks a theme, both pages stay in sync.

## 5. Five-minute unaided-user test protocol

Use this protocol to collect the evidence that is still missing. **It has not been run.** Record the results honestly, including failures.

**Participant:** someone who hasn't seen Needtrace, ideally with planning, operations or supply-chain experience; any adult will do if no one like that is available. One facilitator. Use a laptop with Edge or Chrome at 100% zoom, in a fresh private window.

**Setup (before the participant sits down):** open `https://domino-os.tasty-kiwi.workers.dev/landing`. Start a timer and keep a notes sheet.

**Facilitator script (read it word for word, then stay quiet):**

> "This is a prototype. I'm testing the software, not you. Please think out loud. I can't help while you work, so if you get stuck, just say what you're looking for."

**Tasks.** Read each one aloud, then don't answer questions or point:

| #   | Task (say this)                                                                                 | Success looks like                                                                                 | Time cap |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| 1   | "In your own words, what does this product do?" (landing page only)                             | Mentions late supply affecting customer orders                                                     | 0:45     |
| 2   | "Open the demo and find out which customer order is in trouble if a supplier delivery is late." | Clicks **Try interactive demo** and **Supplier disruption**, and says "ORD-102"                    | 1:15     |
| 3   | "Why is it short, and by how much?"                                                             | Says 2 motors, and finds the timeline or allocation evidence (stock reserved by the earlier order) | 1:00     |
| 4   | "Find a way to fix it and apply it."                                                            | Clicks **Apply recovery** on either option and notices that all orders are covered                 | 1:00     |
| 5   | "Would anything here make you hesitate to trust or act on this result?"                         | Free answer: note any mention of fictional data, costs or confirmation                             | 0:30     |

That's 4:30 of tasks plus 0:30 of setup, for 5:00 in total.

**What to record for each task:** completed yes/no; time taken; wrong clicks, in order; moments of hesitation of more than 5 seconds and where they happened; exact quotes; any question asked (log it, don't answer it).

**Afterwards (30 s, optional):** "On a scale of 1–5, how confident are you that you understood the result?"

**Reporting rules:** report the number of participants and whether they matched the target profile. Don't call a guided demo, a teammate or an automated test "user validation". Include the raw notes. With fewer than five participants, describe the results as observations, not percentages.

## 6. Release recommendation

**Go for the guest release and the hackathon demo.** The core promise of a late delivery traced to the exact order, explained and recovered works on production in both themes at laptop and phone widths, with honest disclosures and no errors.

Before presenting, the team should be ready to explain U1 (the raw IDs in the builder's simulation view) if they show the builder, and should bear U5 in mind when narrating the recovery. The other items can wait until after the event. **Don't start a fix sprint during the release freeze:** none of these is a reproducible failure of the core demo.
