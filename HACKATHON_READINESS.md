# Needtrace hackathon readiness

Current production evidence and the final release decision are in [FINAL_RELEASE_EXECUTION.md](docs/FINAL_RELEASE_EXECUTION.md); authoritative submission fields/rules are in [DEVPOST_READY.md](docs/DEVPOST_READY.md). The dated review below is historical.

Local integrated release review, 13 November 2026. Official Devpost deadline: **14 November 2026, 20:00 Europe/Vilnius**.

Needtrace is the displayed brand; existing technical hostname, workspace keys/formats, OAuth routes, Worker/D1 identifiers and session names remain compatible. This is a rebrand and frontend integration, not a database migration. `/landing` offers **Try interactive demo** and **Build your network**, the latter entering the existing builder at `/?builder=1`.

The release integrates landing commits `f1a9cce`, `102a261` and global theme commit `628bd02` onto remote `main` `f72c314`. The simulator, named builder scenarios, local storage, import/export, cloud owner isolation and optimistic-version checks remain intact. The simulation engine is unchanged.

## Executed local checks

- `npm ci`: succeeded; zero reported vulnerabilities.
- `npm test`: 102 unit tests passed.
- `npm run typecheck:worker` and `npm run typecheck:tests`: passed.
- `npm run build`: passed.
- `npm run test:worker`: 44 runtime/D1 tests passed.
- `npm run deploy:check`: production-config dry run passed, `CLOUD_ENABLED=false`; nothing published.
- `npm run test:e2e`: final integrated suite and count recorded in [release decision](docs/NEEDTRACE_RELEASE.md).

Rendered landing/simulator/builder at 1440×900, 1366×768, 1024×768 and 390×844 in both themes. No page horizontal overflow. Dark/light import preview and reset confirmation also inspected. Autosave settles to **Saved locally**; screenshot timing before its debounce is not a stuck save. Mobile builder is secondary: pan/zoom the canvas or use Edit item/Connect forms. Physical-device, screen-reader and unaided-user sessions have not occurred.

## Demonstration

Ten covered orders → motor receipt PO-101 moves 17→23 November → ORD-102 short two motors by 22 November → inspect allocation → compare independent recoveries → apply modeled Vector supply → coverage returns while original receipt stays late. €36,000 is fictional order value at material risk, not a measured loss or saving. Tests also exercise creating a network, named scenarios, reload, workspace export/import and invalid-input preservation.

## Release decision

The guest experience is the release candidate. Production cloud is **not approved** and must remain disabled. Documented staging evidence covers one real GitHub account/profile; clean-profile restoration, retained-old-session rejection, a second real account and Workers Free reliability remain open. No production credentials, bindings, migrations or settings changed. See [staging evidence](docs/STAGING_VERIFICATION.md).

GitHub repository remains private. A live permission lookup returned `Nedomas: none`; team must grant access or approve making the repository public. No access settings were changed. Final trademark/domain clearance and the legacy public URL decision belong to the team.

See [release status and human gates](docs/NEEDTRACE_RELEASE.md), [submission draft](docs/SUBMISSION.md), [pitch](docs/PITCH.md), [live script](DEMO_SCRIPT.md) and [current screenshots](docs/release/screenshots/). No recording, unaided usability result, public deployment of this branch or Devpost submission is claimed. Merge requires team authorization and triggers deployment automatically.
