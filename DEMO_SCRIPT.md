# DominoOS — 60-second demonstration

**Before presenting:** open the team's approved presentation URL or tested local production preview (`npm run build`, then `npm run preview -- --host 127.0.0.1 --port 5194`). Use a desktop browser at normal zoom and click **Reset demo**. If an imported plan is present, export results and keep source files before confirming reset. Start with fictional data and the servo-motor chain in focus.

The spoken text is about 120 words. Rehearse the clicks and scrolling aloud; these timings are targets, not measured presenter results. Keep the pitch separate from this minute.

## 0–10 seconds — establish the baseline

“Ten customer orders have their materials. DominoOS shows what happens when a supplier delivery slips.”

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
- DominoOS models material availability only. It does not forecast production completion, shipping dates, capacity, freight or purchasing cost.
- Allocation is earliest required date, then order ID; partial kits retain their component reservations.
- The factory, customers and data in the demonstration are fictional. No customer validation or business benefit has been claimed.

See [submission preparation](docs/SUBMISSION.md) for the three-minute video outline and team checklist.
