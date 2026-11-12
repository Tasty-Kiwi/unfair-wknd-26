# DominoOS — human validation playbook

Status: **not conducted**. This is a protocol and blank evidence template, not customer validation. Automated tests and agent reviews do not count as human sessions. Get consent before recording; do not collect confidential customer plans in a hackathon demo.

## Unassisted usability test (10 minutes)

Recruit someone outside the coding team. Use the public demo, or `npm run dev` as the fallback. Start with Reset demo. Give only this task:

> A supplier warns you that a delivery may be six days late. Find which customer commitment is exposed, explain why, and test a way to cover the shortage.

Let them work without pointing to buttons. Time from task delivery. Record where they hesitate and their exact words. Ask them to think aloud; if they ask for help, record that before intervening.

Success criteria: they cause a disruption, identify ORD-102 and its two-motor shortage, explain the earlier reservation and late receipt, and apply a recovery without help. Target the first completed causal loop within 60 seconds. Test a laptop; also ask them to inspect the plan at a narrow width.

Afterward ask:

- What did the amber state mean? Did you interpret it as a definite shipping delay?
- What changed when you applied recovery? What still needs supplier confirmation?
- What would you do next in your own workflow?

Record: date; participant role (anonymous); device; time to disruption/evidence/recovery; help given; errors; exact quotes (with consent); observed misunderstandings; proposed fix; retest result. A guided or failed attempt remains a useful result: do not relabel it a pass.

## Manufacturing-planner interview (20 minutes)

Target hypothesis: a planner, operations manager or owner at a small discrete manufacturer currently combining BOMs, stock, purchase orders and customer commitments in spreadsheets. The buyer and willingness to pay remain unvalidated.

Start with their recent experience, before showing the demo:

1. Tell us about the last supplier delay that affected an order. How did you discover the exposure?
2. Which files/systems and people were involved? How long did the analysis take? Ask for a real example they can describe without confidential details.
3. Who decides which order gets scarce stock? Is it due date, customer priority, margin, or a different policy?
4. Would reserving materials for incomplete kits match your current policy? What counterexample would invalidate this simulator for you?
5. When is a receipt actually usable: arrival, inspection release, or another date? What makes an alternate genuinely approved?
6. Who owns the budget for solving this, and what happens if it remains unsolved?

Then show the fictional demo. Ask them to explain the result, challenge an assumption, and describe what would stop them from trying it on an anonymized plan. Do not ask leading questions such as “Would this save you hours?”

Evidence template: interview date; role/company size (with consent); current workflow; delay example; measured or self-reported time (label which); policy mismatch; must-have import; current workaround; budget owner; verbatim quote; pilot next step; hypothesis supported/refuted/unclear.

## Claims gate

- Today: tested fictional material-availability scenarios and a public prototype.
- After usability: report actual participants, unassisted completion rate and observed times, including failures.
- After a planner interview: report their context and objections; one interview does not validate market demand.
- After a comparative pilot: measure time on the same task with the current workflow and DominoOS; record data preparation time and allocation-policy differences. Only then discuss measured time savings.
