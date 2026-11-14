# Needtrace archive

This folder holds historical material: earlier design decisions, release evidence that has since been superseded, and material from deleted branches. None of it describes the current product. For that, start at the [README](../../README.md), the [checklist](../../CHECKLIST.md), [DEVPOST_READY.md](../DEVPOST_READY.md) and [REDESIGN.md](../REDESIGN.md).

The archive was created on 14 November 2026 during branch consolidation (cleanup PR from `chore/legacy-branch-archive`). Files were moved with `git mv`, so `git log --follow <file>` still shows their original history.

Links from archived documents to `file:///Users/...` paths and `t3-thread://` delegate transcripts were local to the authors' machines and agent sessions. They are left as written, as part of the record, and will not resolve.

## Contents

### [BRANCH_ARCHIVE.md](BRANCH_ARCHIVE.md)
Every legacy branch with its last SHA, its PR, where its work went and what was discarded.

### [historical-designs/](historical-designs/)
Design debates and plans that fed the shipped implementations.

| File | Originally | What it is |
|---|---|---|
| [AGENT_DISCUSSION.md](historical-designs/AGENT_DISCUSSION.md) | repository root | 12 Nov multi-agent design discussion from the DominoOS stage |
| [SUPPLY_CHAIN_BUILDER_PLAN.md](historical-designs/SUPPLY_CHAIN_BUILDER_PLAN.md) | `docs/` | Builder plan. The shipped result is in [BUILDER_IMPLEMENTATION.md](../BUILDER_IMPLEMENTATION.md). |
| [BUILDER_DESIGN_DEBATE.md](historical-designs/BUILDER_DESIGN_DEBATE.md) | `docs/` | Builder design debate |
| [CLOUD_BACKEND_DESIGN_DEBATE.md](historical-designs/CLOUD_BACKEND_DESIGN_DEBATE.md) | `docs/` | Cloud backend debate, including the user's override to use GitHub OAuth |
| [CLOUD_BACKEND_IMPLEMENTATION_PLAN.md](historical-designs/CLOUD_BACKEND_IMPLEMENTATION_PLAN.md) | `docs/` | Cloud plan. The shipped result is in [CLOUD_BACKEND_IMPLEMENTATION.md](../CLOUD_BACKEND_IMPLEMENTATION.md). |
| [CLOUD_MVP_UI.md](historical-designs/CLOUD_MVP_UI.md) | `docs/` | Cloud UI MVP notes |
| [AUTH_CPU_CHECK.md](historical-designs/AUTH_CPU_CHECK.md) | `docs/` | Email/password CPU check that failed the Workers Free gate |
| [landing/](historical-designs/landing/) | `docs/landing/` | PR #7 landing integration record and screenshots of the landing before the redesign |

### [historical-releases/](historical-releases/)
Release reviews and QA from before the PR #14 redesign. The current production evidence stays in [`docs/release/final/`](../release/final/).

| File | Originally | What it is |
|---|---|---|
| [HACKATHON_READINESS.md](historical-releases/HACKATHON_READINESS.md) | repository root | 13 Nov integrated release review |
| [FINAL_RELEASE_EXECUTION.md](historical-releases/FINAL_RELEASE_EXECUTION.md) | `docs/` | 14 Nov PR #8–#11 merge execution log |
| [FINAL_UX_QA.md](historical-releases/FINAL_UX_QA.md) and [qa/final-ux/](historical-releases/qa/final-ux/) | `docs/`, `docs/qa/final-ux/` | PR #11 production QA of the pre-redesign UI, with all 15 screenshots it references |
| [CLAUDE_REVIEW.md](historical-releases/CLAUDE_REVIEW.md) | `docs/release/` | PR #7 release review |
| [pr7-release-screenshots/](historical-releases/pr7-release-screenshots/) | `docs/release/screenshots/` | 8 of the 44 PR #7 release screenshots. The other 36 (every breakpoint and theme of the same screens) were removed. Recover them with `git show 91bf9b4:docs/release/screenshots/<name>.png`. |

### [legacy-branches/](legacy-branches/)
Material that existed only on branches since deleted.

- [design-landing-visual-reset/](legacy-branches/design-landing-visual-reset/): from branch `design/landing-visual-reset` (GameAssasin, 13 Nov; never opened as a PR):
  - landing review cycles ([reviews/reset/](legacy-branches/design-landing-visual-reset/reviews/reset/), [reviews/v2/](legacy-branches/design-landing-visual-reset/reviews/v2/), including `contrast.json`);
  - six representative screenshots;
  - [`landing-visual-reset-code.patch`](legacy-branches/design-landing-visual-reset/landing-visual-reset-code.patch), the branch's `index.html`, `src/` and `tests/` changes from merge base `0d7f213`, kept for reference only.

  Three reviews that were already identical in [historical-designs/landing/reset/reviews/](historical-designs/landing/reset/reviews/) are not duplicated.
- [feat-builder-color-coding/](legacy-branches/feat-builder-color-coding/): the original `628bd02` "Add persistent dark mode" commit (titukas, 13 Nov) as a `git format-patch`. A later version of it ships on `main`.

**Do not apply archived patches to the current application.** They target code that has since been replaced.
