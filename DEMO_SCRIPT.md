# Needtrace — 60-second demonstration

**Before presenting:** open the team's approved presentation URL or tested local production preview (`npm run build`, then `npm run preview -- --host 127.0.0.1 --port 5194`). Use a desktop browser at normal zoom and click **Reset demo**. If an imported plan is present, export results and keep source files before confirming reset. Start with fictional data and the servo-motor chain in focus.

The spoken text is about 120 words. Rehearse the clicks and scrolling aloud; these timings are targets, not measured presenter results. Keep the pitch separate from this minute.

## 0–10 seconds — establish the baseline

“Ten customer orders have their materials. Needtrace shows what happens when a supplier delivery slips.”

Point to **Every order has its required materials** and the supplier → component → product → order map.

## 10–22 seconds — delay the supplier

Click **Supplier disruption**.

“Aster's motors arrive six days late. ORD-102 is short two motors. Its €36,000 order value is exposed; that is not a measured loss.”

This preset is calculated from the same editable receipt inputs as the timeline; it is not a hardcoded result.

## 22–36 seconds — inspect the shortage

Click **ORD-102** in the graph (or select it under **Allocation evidence**), then scroll to its evidence.

“This order needs four motors. The earlier order reserves six of eight on hand, leaving two. The next receipt arrives after the required date.”

Point to **Requires 4, with 2 available** and **Arriving after 2026-11-22**.

## 36–50 seconds — compare recovery options

Scroll back up to **Ways to recover**. Show both cards before choosing one.

“Both options restore coverage: recover Aster's timing or use two approved Vector motors. Each is simulated independently; supply needs confirmation.”

The options use the live deterministic simulation; they are ranked by net shortage units recovered.

## 50–60 seconds — apply the approved alternative

On **Use Vector Components**, click **Apply recovery**. Scroll to the summary.

“Apply Vector. The shortage disappears while Aster stays delayed. This models material availability, not purchasing or production commitments.”

Point to **Every order has its required materials**, the recovered order and the blue dashed alternative-supply path.

## Optional proof after the minute

- Click **Normal operations**, then **Latest safe · 22 Nov** and **First short · 23 Nov**, or move the receipt with the timeline keyboard control, to show that date inputs and timeline stay synchronized.
- Use **Import data** to preview exactly which tables a CSV bundle replaces and which remain. A partial import explicitly warns that fictional and imported business data will mix.
- Show the session-only storage and retained-BOM disclosures in the import dialog. Refresh clears state; keep source files and export results. Reset asks before replacing an imported plan.
- Export the report to show inputs, allocation policy, provenance, scenario and calculated results.

## Honest interpretation

- **€36,000 is order value at material risk**, not an actual loss, revenue saved or measured customer benefit.
- Needtrace models material availability only. It does not forecast production completion, shipping dates, capacity, freight or purchasing cost.
- Allocation is earliest required date, then order ID; partial kits retain their component reservations.
- The factory, customers and data in the demonstration are fictional. No customer validation or business benefit has been claimed.

See [submission preparation](docs/SUBMISSION.md) for the three-minute video outline and team checklist.

## Final recording script — target 2:45, hard limit 3:00

This is a prepared script, not a timed recording. Rehearse aloud; trim pauses or omit the optional builder detail to finish before three minutes. Keep the product visible from the first frame. Do not show cloud sign-in or cloud saving.

| Time      | Action                                                                                            | Narration                                                                                                                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:15 | Start on `/`, Normal operations; show ten covered orders.                                         | “This is Needtrace. When supply changes, which customer order loses its materials? Here, all ten orders are covered.”                                                                                                                                      |
| 0:15–0:35 | Click Supplier disruption; point to PO-101 and ORD-102.                                           | “Move Aster’s motor receipt from 17 to 23 November. ORD-102 needs its materials on the 22nd. It is now two motors short.”                                                                                                                                  |
| 0:35–0:55 | Open ORD-102 allocation evidence.                                                                 | “There are eight motors on hand, but the earlier order reserves six. Two remain for this order’s need of four. The next receipt arrives too late. The allocation evidence explains every quantity.”                                                        |
| 0:55–1:15 | Show both recovery cards.                                                                         | “We can model restoring the original delivery date or using two approved alternative motors. Each option is calculated independently. Supplier availability and approval are inputs, not promises verified by the software.”                               |
| 1:15–1:35 | Apply Vector recovery; point to covered result and unchanged late receipt.                        | “Apply Vector Components. Material coverage returns while the original Aster delivery remains late. This changes a scenario; it does not place a purchase.”                                                                                                |
| 1:35–2:05 | Open Build a network; Core example; show a node field, named-scenario controls and Saved locally. | “The same deterministic engine also works with an editable network. Connect suppliers, materials, receipts, products and customer orders. Test named scenarios against the baseline. Workspaces save in this browser; export JSON for a portable copy.”    |
| 2:05–2:25 | Back to simulator; show Import data disclosure, then cancel.                                      | “Prepared CSV or JSON plans can be imported with source disclosures and validation. These simulator imports clear on refresh. Builder workspace saving is separate. Neither guest path requires GitHub authentication.”                                    |
| 2:25–2:45 | Return to covered result; closing frame with links.                                               | “This is fictional manufacturing data. The €36,000 figure is order value exposed to shortage, not a measured loss or saving. Needtrace models material availability, not factory capacity, costs or shipment forecasts. See what breaks before it breaks.” |

Closing links: marketing `/landing`; interactive demo `/`; builder `/?builder=1`, on the unchanged public hostname. Use only after production verification. Keep an offline recording and tested local build available.
