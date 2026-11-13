# Needtrace — Agent Guide

- **Plan:** Follow `CHECKLIST.md` in order: frontend/UX, rebrand, cloud release, QA, then Devpost submission **last**. Mark items complete only after verification. Deadline: **14 November 2026, 20:00 Europe/Vilnius**.
- **Context:** Read `README.md` before changing code; it covers architecture and product behavior. Consult `docs/CLOUD_BACKEND_IMPLEMENTATION.md` and `docs/STAGING_VERIFICATION.md` for cloud details.
- **Product:** Needtrace (formerly DominoOS) lets manufacturers model supply chains, test supplier delays, and trace affected orders. Prioritize a clear, reliable live demo over new features.
- **Preserve:** Guest demo, deterministic simulation, named scenarios, local autosave, and JSON import/export. Rebranding must not silently break existing workspace formats, storage keys, IDs, or saved projects.
- **Cloud:** React/TypeScript/Vite frontend; Cloudflare Worker + D1; direct GitHub OAuth. Keep session, owner-isolation, and version-conflict safeguards. Do not enable production cloud until live acceptance and Workers Free reliability are checked and release is approved. Never expose secrets.
- **Verification:** Run `npm test`, `npm run typecheck:worker`, `npm run typecheck:tests`, `npm run build`, `npm run test:worker`, `npm run test:e2e`, and `npm run deploy:check` before release.
- **Working tree:** Preserve local/untracked files, especially `CHECKLIST.md`. Do not run destructive Git commands or commit, push, merge, provision, or deploy without an explicit request.
- **Submission:** See `CHECKLIST.md` for Devpost requirements, including the ≤150-word About, ≤3-minute video, repository access, team details, and disclosures.
