# Needtrace — Devpost submission

This is the single source for Devpost copy, verified event requirements, links, and human-owned submission fields. The demo and video are not submitted yet. Keep actual team details and attestations with the team; do not infer them from this document.

## Verified event requirements

The official [Unfair Weekend Devpost page](https://unfair-weekend.devpost.com) sets the deadline at **14 November 2026, 20:00 Europe/Vilnius**. It requires an About section of at most **150 words**, a demo video of at most **3 minutes** hosted on YouTube or Vimeo with **Public** or **Unlisted** visibility, and the team name plus each member's full name and email. A repository may be public or private; if private, invite **Nedomas**. Disclose pre-existing work. Slides are optional.

Use these requirements as the authority for submission docs. The exact wording of any other portal questions remains for the submission owner to inspect.

## Project title

```
Needtrace
```

## Tagline

```
Trace supplier delays to customer orders—and test a modeled response.
```

Short form: `See what breaks before it breaks.`

## About (122 words)

```
Needtrace helps manufacturing planners see which customer orders are exposed when material deliveries slip. Connect stock, bills of material, dated receipts, products and orders; change a receipt; trace shortages to the affected order; and compare modeled recovery options with inspectable allocation evidence. In the fictional demo, a six-day motor delay leaves ORD-102 short by two motors, while approved alternative supply restores material coverage in the simulation. Needtrace is a browser prototype built with React, TypeScript and Vite, using a deterministic TypeScript simulation and React Flow network view. CSV and JSON imports support testing a plan. The prototype does not confirm supplier commitments, place purchases, model factory capacity or forecast shipment dates. Customer demand, savings and willingness to pay have not been validated.
```

## Built with

```
React, TypeScript, Vite, Tailwind CSS, React Flow, Radix UI, Zod, Cloudflare Workers, Cloudflare D1, GitHub OAuth, Vitest, Playwright, GitHub Actions
```

The public demo is guest-only and production cloud saving is disabled. Worker, D1, and GitHub OAuth are optional implementation/staging capability, not active production features. Add AI tools or other tools only if the team actually used them and the form asks for them.

## Try it and source

| Devpost field     | Value / status                                               |
| ----------------- | ------------------------------------------------------------ |
| Try it out        | https://domino-os.tasty-kiwi.workers.dev/landing             |
| Direct guest demo | https://domino-os.tasty-kiwi.workers.dev/                    |
| Builder           | https://domino-os.tasty-kiwi.workers.dev/?builder=1          |
| Source            | https://github.com/Tasty-Kiwi/unfair-wknd-26                 |
| Video             | **⟦HUMAN⟧** Add the final YouTube or Vimeo URL after upload. |

The hostname contains the legacy DominoOS name; the product is Needtrace. Verify the guest link in a clean browser before submission. GitHub administration was attempted but denied: repository update and collaborator invitation returned 403 (“Must have admin rights to Repository”). The repository is private and access for Nedomas is not verified. A repository administrator must invite **Nedomas** with Read access and verify that the intended account can open the source.

## Team and disclosures — ⟦HUMAN⟧

- [ ] Team name: **⟦HUMAN⟧**
- [ ] Every member's full name and required email: **⟦HUMAN⟧**. Enter real values and complete any Devpost invitations required by the form.
- [ ] Pre-existing work: **⟦HUMAN⟧**. Truthfully disclose the prototype, code, templates, or other materials that predate the event, and the team's work during the event. Do not state “None” without team confirmation.
- [ ] Any additional tool, AI, asset, or license attestations requested by Devpost: **⟦HUMAN⟧**. Answer from what the team can verify; do not infer.
- [ ] Optional slides: add a link only if a useful deck exists. Slides are not required.

## Final submission gate

- [ ] About remains at or below 150 words.
- [ ] Demo video is at most 3:00, plays signed out, and is Public or Unlisted on YouTube or Vimeo.
- [ ] Repository is public or Nedomas has been invited and can open it.
- [ ] Team name, full names, required emails, pre-existing-work disclosure, and any other required attestations are accurate.
- [ ] Guest demo and source links work; production cloud saving remains disabled and is not described as a live feature.
- [ ] Review the Devpost preview with the team, submit before **14 November 2026, 20:00 Europe/Vilnius**, and retain the confirmation.

For the video shot list and narration use [VIDEO_PRODUCTION.md](VIDEO_PRODUCTION.md). The [pitch notes](PITCH.md) and [60-second demo](../DEMO_SCRIPT.md) are supporting presenter material, not separate submission authorities.
