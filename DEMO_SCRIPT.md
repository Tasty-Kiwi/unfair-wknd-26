# DominoOS — 60-second demonstration

**Before presenting:** open the deployed link from `README.md` (keep `npm run dev` at `http://localhost:5173` as a fallback), use normal browser zoom, and click **Reset demo**. The opening view uses fictional demo data and starts with the servo-motor chain in focus.

## 0–10 seconds — establish the baseline

“A small manufacturer has ten customer orders and limited component supply. Right now, every order has the material it needs by its required date.”

Point to **Every order has its required materials** and the supplier → component → product → order map.

## 10–22 seconds — delay the supplier

Click **Supplier disruption**.

“Aster's motor delivery slips six days, from 17 November to 23 November. DominoOS recalculates the entire order book and identifies one customer commitment at material risk: ORD-102, short two motors, with €36,000 of order value exposed.”

This preset is calculated from the same editable receipt inputs as the timeline; it is not a hardcoded result.

## 22–36 seconds — inspect the shortage

Click **ORD-102** in the graph (or select it under **Allocation evidence**).

“Helix needs four servo motors on 22 November. Eight were on hand, but the earlier ORD-101 reserves six. Only two remain for ORD-102, and the delayed receipt lands one day after it is required.”

Point to **Requires 4, with 2 available** and **Arriving after 2026-11-22**.

## 36–50 seconds — compare recovery options

Scroll to **Ways to recover**.

“DominoOS compares independent recovery actions. Restoring Aster's receipt timing or using two approved motors from Vector both recover the two missing units. Supply confirmation, cost and factory capacity remain outside this calculation.”

The options use the live deterministic simulation; they are ranked by net shortage units recovered.

## 50–60 seconds — apply the approved alternative

On **Use Vector Components**, click **Apply recovery**.

“The original Aster delivery remains delayed, while approved alternative supply restores material coverage. ORD-102 is covered and the order-value exposure returns to zero.”

Point to **Every order has its required materials**, the recovered order and the blue dashed alternative-supply path.

## Optional proof after the minute

- Click **Normal operations**, then **Latest safe · 22 Nov** and **First short · 23 Nov**, or move the receipt with the timeline keyboard control, to show that date inputs and timeline stay synchronized.
- Use **Import data** to preview exactly which tables a CSV bundle replaces and which remain. A partial import explicitly warns that fictional and imported business data will mix.
- Click **Reset demo** to restore the original fictional dataset, scenario and provenance.
- Export the report to show inputs, allocation policy, provenance, scenario and calculated results.

## Honest interpretation

- **€36,000 is order value at material risk**, not an actual loss, revenue saved or measured customer benefit.
- DominoOS models material availability only. It does not forecast production completion, shipping dates, capacity, freight or purchasing cost.
- Allocation is earliest required date, then order ID; partial kits retain their component reservations.
- The factory, customers and data in the demonstration are fictional. No customer validation or business benefit has been claimed.
