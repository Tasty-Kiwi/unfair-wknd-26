# DominoOS landing — visual reset

Branch: `design/landing-visual-reset`, built on the previous premium-v2 implementation. `/landing` stays isolated; `/` stays the unchanged simulator and builder. No push, merge or deployment.

## Why the direction changed

The prior approval overstated the visual result. The user rejected the disconnected hero, fragmented technical illustration and giant light screenshot against a dark document. Passing tests did not establish desirability.

Before coding, Codex debated the actual captures with Claude Opus and two independent Codex reviewers for more than five minutes (first Claude concept output 16:10 Europe/Vilnius; implementation began after the concept debate). The first Claude proposals were challenged: one assumed an invented dark product/green recovery, the other repeated the rejected split composition. Neither was adopted unchanged.

The selected direction is a unified, centered promise and CTA followed by one asymmetric receipt → four motor slots → customer-order result. Missing slots are visibly distinct; recovery fills two slots with modeled blue supply. The order is the largest object, and its need date is compared directly with the late receipt. The technical ruler and extra product-code node are removed. Reservation arithmetic and exposure details remain in native disclosure. The €36,000 fictional exposure is also visible beside the shortage, never described as loss/savings.

The page has three distinct roles: demonstrate the consequence; show authentic inspectable software; invite exploration with model/storage boundaries in disclosure. A large white full-interface slab is replaced with a framed, bounded shortage crop and selectable real network/builder captures. Product imagery remains truthfully light in dark mode.

Light: warm paper, ink, restrained shortage red. Dark: deep navy, layered blue-black surfaces, warm foreground, coral shortage and periwinkle recovery. Theme persistence/early paint stay landing-only. No new dependencies, simulator changes or builder logic changes.

## Real reference observations

Current browser captures: `reset/references/`.

- **Attio:** one headline/description/action cluster above product evidence makes the intended next action obvious. Adopted the unified hierarchy, not branding or decorative gradients.
- **Linear:** large type, quiet navigation and dark surface separation let the product stage carry attention. Adopted restrained structure rather than report-like borders around every band.
- **Retool:** a dominant operational interaction offers an immediate reason to explore complex software. Adopted the interaction-first principle; no AI/prompt claims or copied visual assets.

## Actual criticism and corrections

Read-only Claude Opus reviews are preserved in `reset/reviews/`. Two Codex reviewers independently challenged the old report rhythm, mobile length and competing information. Their recommendations are design observations, not human usability evidence.

- Initial render: stronger centered message, but missing slots were quieter than available stock, the order panel was oversized, arrows pointed at captions, and mobile date wrapping weakened the comparison.
- Refinement: center connectors on objects, narrow order panel, mute available tokens, emphasize missing slots, remove tilt, keep dates together, shorten mobile scene. Order outcome is visible in the 390×844 first screen.
- Product evidence: crop the actual motor allocation line for legibility and cap desktop scale; restore the authentic supply network as a selectable view. Builder remains a real crop. Its CTA explicitly opens the simulator first, where **Build a network** is available.
- Claude's comparison was qualified: clearer and shorter than original light, but initially plainer and less convincing as software. The final network showcase addresses that criticism; no claim of exceptional or universally preferred design is made.

## Captures and reproduction

`reset/first/`, `reset/refined/`, `reset/final/` contain rendered iterations, both themes, full-page and first-screen captures. Final includes 1440×900, 1024×768, 768×1024 and 390×844 plus recovery and network views. Capture transitions are disabled to avoid recording intermediate opacity. Previous originals remain under `landing-1440.png` and `v2/final/` for direct comparison.

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5221
```

Open `/landing`. Demo states use the unchanged `simulate()` and bundled scenarios: ten covered orders; delayed PO-101 produces ORD-102's two-motor shortage; two modeled Vector motors restore coverage while the receipt stays late.

## Verification and limits

Executed locally: `npm test` (84 unit tests), `npm run build`, and `DOMINO_BASE_URL=http://127.0.0.1:5221 PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers" npm run test:e2e`. Browser checks cover both themes, persistence, keyboard controls, reduced motion, all scenario outcomes, entry into simulator/builder, storage failure, first paint, all four widths and product-evidence selection. Final run: 36 Chromium tests passed (including 11 simulator journeys and the existing builder journeys).

No horizontal overflow in tested viewports. Simulator and builder regressions remain part of the browser suite. Content accurately distinguishes simulator session-only CSV/JSON imports from browser-local builder workspaces; no purchasing, supplier confirmation, cost optimization, capacity scheduling or shipment forecasts are promised.

Tradeoffs: readable evidence is a crop, while the full network uses a labeled horizontal image scroller on phones to preserve readable scale (full-size image link also available); desktop controls sit above the fold; mobile controls follow the visible order result; the hero is deliberately sparse. Physical-device, screen-reader and unaided-user testing have not occurred. Visual improvement remains a reviewed design judgment, not measured user preference.

Final Claude condition: mobile network was initially unreadable when shrunk to 330px. Replaced with a 750px image scroller constrained to the phone frame; checked scroll width 766 / client 348 with page width 390. Captures include left/right views. This preserves authentic software at readable scale without page overflow.

The follow-up review confirmed mobile label legibility, but caught vertical timeline clipping. Removed the height cap, made the scroller keyboard-focusable with a region label, and added browser assertions for full image height, horizontal panning and page bounds. Final left/middle/right screenshots show the entire timeline and graph across pan positions.
