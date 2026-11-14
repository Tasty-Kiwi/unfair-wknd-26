# Branch archive

This page records the legacy branches checked on 14 November 2026 against `main` at `fe200ef217027871e3638737d353780753c96930` (PR #14, the Needtrace simulator and builder redesign). It explains where each branch's work went before the branch was deleted. The canonical application is whatever is on `main`. Nothing listed here should be restored over it.

**How each branch was checked:** I did not rely on Git saying a branch was "ahead" or "behind". Each branch was checked in one of three ways:
- Ancestry: `git merge-base --is-ancestor`.
- Patch equivalence: comparing the branch's diff from its merge base byte for byte with its squash commit on `main`.
- File content: comparing blob hashes per file. Where hashes differed, I read the code to see whether `main` has a later version of the same work.

## Remote branches

| Branch | Last SHA | PR | What it implemented | Where it went in `main` | Comparison result | Unique material kept | Remote branch |
|---|---|---|---|---|---|---|---|
| `review/reliability-workers-recovery` | `f67fb384c5eccbe73f38f2e900bbd2431afa7925` (12 Nov, Dominykas M.) | #1 | Workers deployment, CI, imports, recovery comparison | merge `93a2d68` | Fully incorporated: the branch tip is an ancestor of `main` | None needed | Deleted |
| `design/route-sheet` | `fe4f09a6d182e90bc4902bce429e403856f2075f` (12 Nov, Dominykas M.) | #2 | "Dated route sheet" redesign with movable receipts | merge `a772ebf` | Fully incorporated (ancestor) | None needed | Deleted |
| `fix/hackathon-readiness` | `635af979e96a4c5ccdc113145ba643ce441e6138` (13 Nov, GameAssasin) | #3 | Dataset provenance, protection of imported plans, retained-BOM disclosure, submission materials | squash `e4197fc` | Historically divergent but equivalent: the branch diff from merge base `4b6a371` is **byte-identical** to the squash commit | None needed | Deleted |
| `feat/supply-chain-builder` | `f54453b444b89ade5d5cd64f5c8519ec7f0db86f` (13 Nov, Dominykas M.) | #4 | Visual supply-chain builder with named scenarios | merge `0d7f213` | Fully incorporated (ancestor) | None needed | Deleted |
| `plan/cloud-backend` | `563cedb34539236e1f434bbac990f1106f762c87` (13 Nov, Dominykas M.) | #5 | Private cloud projects with direct GitHub OAuth | merge `0531c1a` | Fully incorporated (ancestor). Production cloud remains disabled. | None needed | Deleted |
| `feat/builder-color-coding` | `628bd02036cc3fbb1b4c5cf31ee9ed8ddeb9f3a1` (13 Nov, titukas) | #6 (`9331cad`) | Colour-coded builder nodes and edges. The tip commit `628bd02` adds persistent dark mode. | `9331cad` via merge `907ba40`; `628bd02` integrated by squash PR #7 (`91bf9b4`) | Historically divergent but equivalent. PR #7's [landing record](historical-designs/landing/README.md) names `628bd02` as integrated. `main` has later versions of the same files, with the same `dominoos.landing.theme.v2` key, the same theme store and toggle, and an expanded prepaint script. Five of the twelve touched files reverse-apply exactly onto `main`. The other seven have been rewritten since. | [`legacy-branches/feat-builder-color-coding/`](legacy-branches/feat-builder-color-coding/) (original patch) | Deleted |
| `design/landing-visual-reset` | `102a2615c2f2911d83ab33d434a01a70f94ba8a4` (13 Nov, GameAssasin) | none (never opened as a PR) | Two landing redesigns: "live causal timeline" (`f1a9cce`) and "focused disruption and recovery story" (`102a261`), each with review cycles and screenshots | squash PR #7 (`91bf9b4`) | Historically divergent but equivalent for code. PR #7 integrated both commits, as its [landing record](historical-designs/landing/README.md) states. `main`'s landing, `index.html` and `tests/landing.spec.ts` are later versions. 11 files are blob-identical. The rest are design-iteration screenshots and reviews that PR #7 chose not to keep. | [`legacy-branches/design-landing-visual-reset/`](legacy-branches/design-landing-visual-reset/) (reviews, 6 screenshots, code patch) | Deleted |
| `redesign/app-ui` | `828eb83d1f023d4b15f4a8717fc9c139b9b09516` (14 Nov, titukas) | #14 | Command-centre simulator and builder redesign | squash `fe200ef` | Equivalent: `git cherry` marks the commit as patch-equivalent, and the branch tree equals `main`'s tree | None needed | Deleted |

No branch contained functional work missing from `main`, so nothing was merged or ported into application code.

## Local-only branches (remotes already deleted)

| Branch | Last SHA | PR | Result |
|---|---|---|---|
| `chore/final-release-documentation` | `f09bc85` | #8 → `e1f1a49` | Branch diff byte-identical to squash. Deleted locally. |
| `submission/devpost-kit` | `91976ae` | #9 → `2aa9377` | Byte-identical. Deleted locally. |
| `submission/demo-video-kit` | `ae0082f` | #10 → `d6b35ed` | Byte-identical. Deleted locally. |
| `qa/final-guest-review` | `bbf2a82` | #11 → `b8d541d` | Byte-identical. Deleted locally. |

## Discarded as obsolete

These were not copied into the archive. They remain reachable through the SHAs above, through PR history, and through the commit that removed them.

- **`design/landing-visual-reset` iteration screenshots:** 105 of 111 were not copied: `docs/landing/reset/{first,refined,final}/` and `docs/landing/v2/{after,before,cycle2,cycle3,final}/`. They show intermediate landing states at every breakpoint and theme. Six representative frames were kept.
- **Third-party reference screenshots** of Attio, Linear, Retool and Foundry (`docs/landing/*/references/`): not archived. They are copies of other companies' sites, not Needtrace work.
- **Three landing-reset `public/landing/*.png` images** (`allocation-mobile`, `builder`, `simulator-mobile`): the current landing never references them.
- **The branch's earlier landing code:** kept only as a reference patch, not restored. It predates the shared theme store and the Needtrace branding.

To recover any omitted file: `git show 102a261:<path>`, for example `git show 102a261:docs/landing/v2/final/dark-1440.png > out.png`.
