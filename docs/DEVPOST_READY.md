# Needtrace — Devpost submission

This is the source for submission copy, links and human-owned fields. No final video upload or Devpost submission is claimed. Deadline: **14 November 2026, 20:00 Europe/Vilnius**.

## Event requirements

The [event page](https://unfair-weekend.devpost.com) requires an About section of at most **150 words**, a video of at most **three minutes** hosted on YouTube or Vimeo as **Public or Unlisted**, a team name, each member's full name/email, and truthful pre-existing-work disclosure. Slides are optional. The submission owner must inspect the actual final form for any additional questions.

## Title and tagline

**Needtrace**

Trace supplier delays to customer orders—and test a modeled response.

Short form: **See what breaks before it breaks.**

## About (99 words)

Needtrace helps manufacturing planners see which customer orders are exposed when material deliveries slip. Connect stock, bills of material, dated receipts, products and orders; change a receipt; trace the affected order; and compare modeled recovery options with inspectable allocation evidence. In the fictional demo, a six-day motor delay leaves ORD-102 short by two motors. Two approved alternative motors restore coverage in the simulation. The browser prototype uses deterministic TypeScript calculations and an editable network. CSV and JSON imports support plan testing; local projects and portable exports preserve work. Customer demand, savings and willingness to pay have not been validated.

## Built with

React, TypeScript, Vite, Tailwind CSS, React Flow, Radix UI, Zod, Cloudflare Workers, Vitest, Playwright, GitHub Actions.

Workers hosts the public app. Cloud saving, D1 and GitHub OAuth are retained, deferred backend work and are not active demo features. Add other tools only when their actual use is confirmed and the form asks for them.

## Links and routes

| Field | URL or status |
| --- | --- |
| Try it out / landing | https://domino-os.tasty-kiwi.workers.dev/ |
| Direct session-only demo | https://domino-os.tasty-kiwi.workers.dev/demo |
| Project library | https://domino-os.tasty-kiwi.workers.dev/projects |
| Saved local project | `/projects/:id` on the same origin; exists only in that browser |
| Landing alias | `/landing` |
| Legacy device draft | `/?builder=1` |
| Source | https://github.com/Tasty-Kiwi/unfair-wknd-26 |
| Video | **HUMAN:** add the approved YouTube or Vimeo URL after upload. |

Production routes and anonymous public source access were verified on 14 November; see [release evidence](NEEDTRACE_RELEASE.md). The historical private-repository invitation blocker is superseded. If the source becomes private again, verify Nedomas access. No permissions or visibility were changed in this review. The legacy hostname is intentional; no Needtrace domain is claimed.

The demo is session-only. **Edit this network** creates a saved local project; export workspace JSON for a portable copy. This review branch remains undeployed until approved.

## Human fields and submission gate

- Team name: **HUMAN**.
- Every member's full name/email and any portal invitations: **HUMAN**.
- Pre-existing work and actual work completed during the weekend: **HUMAN**. Do not invent a build period or state “None” without team confirmation.
- Tool, AI, asset and license disclosures requested by the actual form: **HUMAN**, based on verified facts.
- Watch the complete final video/audio, confirm duration, readable labels, results and closing URL; upload and check signed-out playback.
- Recheck source and guest links, review the Devpost preview, submit before the deadline, and retain confirmation.

## Credibility and recording

The Northstar manufacturer, orders, suppliers, approvals and prices are fictional. €36,000 is exposed order value, not measured loss or savings. Recovery changes a material-availability simulation; it does not place a purchase, confirm a supplier commitment, model factory capacity or predict shipment dates.

The [existing production MP4](release/final/production/needtrace-demo.mp4), sourced from `8fca52a`, predates the current UI. It is a fallback/reference pending full human review, not an approved replacement. No viewing, approval or upload is claimed in this review. Use the revised [video plan](VIDEO_PRODUCTION.md), [pitch](PITCH.md) and [60-second demo](../DEMO_SCRIPT.md). Current engineering results and human gaps are in [final acceptance](FINAL_PRODUCT_ACCEPTANCE.md).
