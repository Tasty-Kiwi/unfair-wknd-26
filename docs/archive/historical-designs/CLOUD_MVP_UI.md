# DominoOS cloud MVP — simple GitHub interface

Current scope: GitHub sign-in, My Projects, Save to cloud and Open. This supersedes the earlier email/password design after the user required Workers Free and selected GitHub. No password form, account dashboard or recovery screen.

The implementation belongs to the existing builder. Guest Build/Simulate, 500 ms device autosave, Save workspace and JSON import/export remain available without signing in. Use existing Button, Dialog, Alert, Input and Label components; keep the current visual style.

## Entry and sign-in

- Show **Sign in with GitHub** when signed out or the session has not been checked. No auth/API loading screen blocks the public demo.
- Check the session only after a cloud action or an OAuth return. A plain guest visit does not initiate auth requests.
- Flush the current draft before navigating to GitHub. A failed local save blocks navigation and points to existing export.
- The only accepted OAuth authorization destination is `https://github.com/login/oauth/authorize`. Better Auth generates state and performs code exchange.
- Return to `/?builder=1`, reopen the builder and verify `/api/me`. Failed/declined sign-in returns a short error while keeping the workspace.
- Signing in does not open a project or replace the guest draft. There is no automatic binding to a cached cloud project after reload.

## My Projects and saving

My Projects is a small dialog: project names, updated times and Open buttons. Include Save current as new project and Sign out. No profile editing, delete, list rename, sharing or history.

The first Save to cloud asks for a name, defaulting to the workspace name or Untitled project. Subsequent saves update the active project with its last acknowledged version. Save as new creates a separate cloud row and preserves the workspace document identity and scenario context.

Keep device and cloud status separate:

- Saved locally / local save failed.
- Not saved to cloud / unsaved cloud changes.
- Saving to cloud / saved to cloud.
- Save failed or not confirmed.
- Cloud version conflict.

Only acknowledge a cloud save after API success, and only acknowledge the snapshot sent. Edits made during the request remain dirty. A timeout may leave the server outcome unknown; ask the user to check My Projects rather than retry a create automatically.

At 20 projects, show a plain limit message; at 5 creations/minute, ask the user to wait. Failed cloud saving never deletes the editor or changes the local 2 MiB/export capability. A cloud workspace is limited to 1,000,000 UTF-8 bytes.

## Opening and conflicts

Before Open replaces the editor, use a single clear replacement confirmation when current work or a divergent device copy would be replaced. The existing Export JSON action remains the backup path. Fetch and validate the returned workspace before applying it. If the user edits while the fetch is pending, cancel replacement and ask them to Open again.

A 409 shows exactly two actions: **Keep working locally** and **Save as new project**. There is no force overwrite, auto-merge or silent adoption of the newer version. Keep the local draft and disable updates of that stale binding until the user chooses a safe action.

## Invisible data-safety rules

- Keep cloud ID, version, owner and acknowledged snapshot outside `BuilderWorkspaceV1`.
- Preserve guest storage at `dominoos.builder.workspace.v1`. Store cloud drafts in owner/project-scoped slots through the existing storage helpers.
- A timer captures its storage slot and workspace. Cancel it before switching contexts; never write another owner's workspace into the guest slot.
- Invalidate in-flight requests on sign-out, context switch or unmount. Apply results only if operation, owner, context and edit generation still match.
- Recheck the server session before cloud actions. Another account must not inherit the previous binding or automatically load its draft.
- Sign-out flushes the active draft, clears the binding and restores the guest draft without deleting stored work. A storage failure must leave a detached/exportable copy; a network failure must say server logout was not confirmed.
- New blank, example and import detach the active cloud binding before replacement.

## Verification boundaries

Automated UI journeys must cover a guest visit with no API requests, save/open round-trip with scenarios, edits during saving/opening, cloud failure, version conflict and sign-out/account isolation. API mocks test product behavior; they do not prove real GitHub authentication.

Final acceptance requires real GitHub sign-in, a saved project reopened in another browser, another account denied access, and deployed CPU evidence on Workers Free. See [the setup/runbook](../../GITHUB_AUTH_SETUP.md) and [implementation plan](CLOUD_BACKEND_IMPLEMENTATION_PLAN.md).
