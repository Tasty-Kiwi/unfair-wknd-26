# Needtrace landing — integrated release

`/landing` contains the reviewed visual-reset design (`f1a9cce`, `102a261`) integrated with the product-wide theme (`628bd02`) on `f72c314`. `/` remains the simulator; `/?builder=1` directly opens the existing cloud-capable builder. Two clear actions: **Try interactive demo** and **Build your network**. No root-route promotion or cloud enablement.

One shared theme store (`src/lib/theme.ts`) controls all surfaces. The single prepaint bootstrap in `index.html` mirrors it. The existing key `dominoos.landing.theme.v2` remains compatible; workspace keys, formats, IDs and session cookies are unchanged. Explicit choices persist across routes, reloads and tabs. A fresh landing defaults light; a fresh simulator follows OS preference. The landing retains its paper/navy design tokens while dialogs, simulator and builder use the product theme.

## Design and evidence

The centered promise/actions lead into receipt → motor quantities → affected order, calculated with the unchanged deterministic engine. Recovery fills the missing slots while preserving the late receipt. Exposure is fictional order value, not loss/savings. Technical details use native disclosure. The product showcase has actual shortage, supply-network and builder captures, explicitly identified as the light product interface. It remains intentionally light in the landing's dark theme; the live simulator and builder now also support dark mode.

The earlier visual review challenged the disconnected hero, ruler and giant pasted screenshot. Claude Opus and two Codex reviewers debated alternatives and actual renders before the visual reset. Useful prior final images/review records remain under `reset/final` and `reset/reviews`; intermediate historical screenshot archives were omitted from this release diff. Current rebranded captures for both themes and all requested widths are in [release screenshots](../../historical-releases/pr7-release-screenshots/). Claude's integrated screenshot review is [preserved](../../historical-releases/CLAUDE_REVIEW.md).

The release review found autosave screenshots taken before the save debounce: checked both themes and confirmed **Saved locally**. Added explicit device-save wording and mobile pan/zoom + form-edit guidance. Mobile is a secondary builder editing surface; use the form for readable field editing and pan/zoom the network. Desktop presentation is recommended.

No human participant, physical-device or screen-reader session occurred. Visual feedback is independent model review, not customer validation.

## Verification

See [release decision](../../../NEEDTRACE_RELEASE.md) and CHECKLIST.md for final integrated test counts, guest/cloud distinction and remaining human actions. The guest demo works with cloud disabled; authentication and production infrastructure approval remain separately gated. Browser tests cover brand, legacy format compatibility, both CTA routes, theme persistence/cross-route behavior, import safeguards, scenario states, responsive overflow, product image controls and existing simulator/builder/cloud regressions.

```sh
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 5231
```

For the real cloud-disabled guest runtime locally, use `npx wrangler dev --config wrangler.jsonc --local --port 5232` after building. Neither command publishes.
