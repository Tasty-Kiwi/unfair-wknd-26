# Needtrace release status

Checked **14 November 2026**. Public production serves `b3ced29` in browser-only guest mode. This final-review branch contains additional changes that have **not** been deployed. Merge and production deployment require explicit approval.

## Authoritative route table

These routes were observed on the public deployment, not inferred only from source:

| Purpose | Public URL | Persistence |
| --- | --- | --- |
| Landing | https://domino-os.tasty-kiwi.workers.dev/ | Theme preference only |
| Project library | https://domino-os.tasty-kiwi.workers.dev/projects | Projects in this browser |
| Local project | `/projects/:id` on the same origin | Dataset/scenario or editable workspace autosave |
| Standalone simulator | https://domino-os.tasty-kiwi.workers.dev/demo | Session-only; export or create an editable copy |
| Landing alias | https://domino-os.tasty-kiwi.workers.dev/landing | Same landing |
| Legacy builder | https://domino-os.tasty-kiwi.workers.dev/?builder=1 | Existing device draft |
| Health | https://domino-os.tasty-kiwi.workers.dev/api/health | Reports `cloudEnabled: false` |

Project IDs belong to local storage. A `/projects/:id` link is not a shared cloud project. **Edit this network** creates a saved local copy of the current simulator dataset/scenario. **Build a network** opens the legacy device draft. No account is required.

The visible product is Needtrace. The Worker and hostname retain `domino-os` for compatibility; no Needtrace domain is configured. Existing workspace versions, storage keys, IDs and import/export formats remain unchanged.

## Verified production baseline

- `main`: `b3ced29ebd3c9f3074867149fb4ba55385e6676a` (**Bring the builder demo and simulator into parity**).
- GitHub **verify** succeeded at 12:12:10 UTC: [run 43593171052](https://github.com/Tasty-Kiwi/unfair-wknd-26/actions/runs/43593171052).
- **Workers Builds: domino-os** succeeded at 12:07:30 UTC: build `a00fec02-4f69-4b71-852d-ef26f671f7c7`.
- All **12 JS/CSS assets** from the clean baseline build were fetched through the public browser and matched SHA-256 byte for byte. [Per-asset evidence](review/production-assets-b3ced29.json).
- Live browser at 1366×768: ten covered → PO-101 delayed to 23 Nov → ORD-102 short two motors and €36,000 exposed fictional order value → Vector recovery restores coverage while PO-101 stays late. No purchase was placed.
- Live mobile at 390×844: simulator, library and legacy builder accessible without horizontal page overflow. Automated guest coverage is listed in [final acceptance](FINAL_PRODUCT_ACCEPTANCE.md).
- The app made no cloud requests during the observed normal guest path. The coordinator separately requested health, which returned `{"ok":true,"cloudEnabled":false}`; this diagnostic is not an app-initiated cloud request.
- GitHub reported the repository **public**, and a signed-out incognito browser could read the source. The former private-repository/Nedomas invitation blocker is superseded. No visibility or permission change was made in this review.

Earlier `91bf9b4` and `8fca52a` test counts, captures and releases are historical. The [existing MP4](release/final/production/needtrace-demo.mp4) comes from `8fca52a` and predates the current UI. It remains a fallback/reference pending human viewing and approval. This review did not record, approve or upload a replacement.

## Final-review changes versus production

[The three-round debate](FINAL_PRODUCT_DEBATE.md) authorizes P0/P1 clarity, numeric safety and submission corrections. [Final acceptance](FINAL_PRODUCT_ACCEPTANCE.md) records local results separately from the deployed baseline. A local passing build or PR check is not proof these changes are live.

Cloud saving, GitHub OAuth and D1 remain **indefinitely deferred**, with no default D1 binding or frontend cloud requests. Historical backend/CPU questions in [staging verification](STAGING_VERIFICATION.md) are future reference and are not hackathon release requirements. Do not activate cloud, provision resources or change authentication for submission.

## Human submission gates

- Observe an unfamiliar person completing the journey without help; record time and misunderstandings. Automated tests do not establish this.
- Rehearse on the presentation machine and prepare the offline fallback.
- Watch and approve the complete final video/audio; upload a ≤3-minute Public/Unlisted YouTube or Vimeo video and check signed-out playback. A local MP4 is not a Devpost video URL.
- Confirm real team/member details and truthful pre-existing-work/build-period disclosures.
- Confirm the legacy hostname is acceptable; the repository description remains generic and can be updated by its owner.
- Review the actual Devpost preview, submit before **14 November 2026, 20:00 Europe/Vilnius**, and retain confirmation. No submission is claimed.

## Re-check before submission

1. Confirm the selected main commit has passing GitHub and Cloudflare checks. If it changes, repeat production asset and journey checks.
2. Open landing, library and `/demo` signed out. Verify shortage/recovery, themes and local project reopening.
3. Confirm health still reports cloud disabled. Contact the release owner if unexpectedly enabled; do not silently change deployment settings.
4. Check anonymous source access, uploaded video and final Devpost links.

## Local guest fallback

Prepare from a verified checkout **before** losing connectivity:

```sh
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 5194
```

Open `http://127.0.0.1:5194/` for landing, `/demo` for simulator, `/projects` for local projects and `/?builder=1` for the legacy draft. A production-Worker fallback is `npx wrangler dev --config wrangler.jsonc --local --port 5232`; it uses cloud-disabled defaults and does not deploy. Rehearse display, zoom, power and audio. Keep workspace JSON, report, source files and an approved recording offline.
