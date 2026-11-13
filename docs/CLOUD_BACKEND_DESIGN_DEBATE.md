# DominoOS cloud backend design debate

Status: **Planning only; implementation requires approval.** This record captures actual delegated model responses, including superseded recommendations and factual errors. The [implementation plan](CLOUD_BACKEND_IMPLEMENTATION_PLAN.md) is the coordinator's final specification. Archived proposals below are not implementation instructions.

Repository: `Tasty-Kiwi/unfair-wknd-26`. Inspected remote/local main: `0d7f2130251889871217ddddb6b0986f1855ebec`. Planning branch: `plan/cloud-backend`. No application, configuration, dependency or migration files were edited, no production resources created, and no deployment performed.

## Procedure and traceability

The coordinator called `orchestrator_capabilities` before delegation. The first multi-name search returned enabled providers but empty model arrays; a corrective unfiltered query found the exact requested models. Codex, Claude Agent and Antigravity were enabled. Cursor and other catalog providers were disabled and were not used.

| Participant | Provider instance | Exact catalog/requested model | Lens |
| --- | --- | --- | --- |
| GPT-6 Luna | `codex` | `gpt-6-luna` | Architecture/security |
| Claude Haiku 5.5 | `claudeAgent` | `claude-haiku-5-5` | UX/frontend |
| Gemini 4 Hydrogen | `antigravity` | `gemini-4-hydrogen` | Backend/database/critical review |

Every contribution used `delegate_task` with that explicit provider/model, role design or review, shared read-only repository access, and no child agents. Each review/revision was a new delegated task with the real prior text in its brief. No model responses were invented or substituted.

**Model attestation limit:** T3 reported matching `executedModel` for Codex and Claude. Antigravity reported configured/requested `gemini-4-hydrogen` and returned real completed responses, but its `executedModel` field was null. Its exact runtime model is therefore not independently attested by that metadata. The requested catalog model and actual provider/task are traceable; this distinction is retained rather than represented as stronger proof.

The first Hydrogen attempt stopped on a permission request for a read-only shell command. It was cancelled with `task_cancel` and replaced on the **same provider/model** with file-read tools only. Its partial output is excluded from proposals. No permission was approved on the child's behalf.

### Real elapsed design work

An observed coordinator clock at **2026-11-13 13:47:44 UTC** precedes the proposals. All three rounds and the supplemental email/password reviews were complete and read by **2026-11-13 14:05:06 UTC**: **17 minutes 22 seconds** between these recorded observations. This exceeded the four-minute requirement through repository inspection, documentation research, verification, critique and revised design work. No sleep/idle commands were used to satisfy the time requirement.

Round 1 proposals were gathered independently. None received another model's proposal until all three completed. Round 2 shared all actual Round 1 proposals and required at least three specific criticisms of **each** competitor. Round 3 shared all actual Round 2 criticisms and original proposals. Subsequent user steering prompted an additional focused review by all three models.

## Delegated task references

The links below are the tool-returned thread links verbatim. Full final responses are archived later in this file; internal reasoning/tool traces are not copied.

| Stage | Participant | Task/thread reference | Started UTC | Completed UTC | executedModel |
| --- | --- | --- | --- | --- | --- |
| Round 1 | luna | [Cloud backend R1 — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Afa0da362-32db-4993-80ad-76069d6b9a8e) | 2026-11-13T13:49:26.582Z | 2026-11-13T13:50:06.512Z | gpt-6-luna |
| Round 1 | haiku | [Cloud backend R1 — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Ac2dbe4bb-520a-4099-a33f-17ed84bf0855) | 2026-11-13T13:48:23.409Z | 2026-11-13T13:49:52.666Z | claude-haiku-5-5 |
| Round 1 | hydrogen | [Cloud backend R1 — hydrogen read-only retry](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Af40776b9-e64f-43ef-bb0a-7f61a4e957fa) | 2026-11-13T13:51:01.787Z | 2026-11-13T13:52:13.534Z | not attested (null) |
| Round 2 | luna | [Cloud backend R2 — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Afee8acf1-6226-4a33-a3c1-7d0954713766) | 2026-11-13T13:53:04.559Z | 2026-11-13T13:53:38.339Z | gpt-6-luna |
| Round 2 | haiku | [Cloud backend R2 — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A60c19701-e8a1-4c58-8738-7ec3e1d5c9c5) | 2026-11-13T13:53:41.114Z | 2026-11-13T13:55:15.721Z | claude-haiku-5-5 |
| Round 2 | hydrogen | [Cloud backend R2 — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A65963e03-691d-4c3e-8f6e-5aff38c9e6e3) | 2026-11-13T13:54:45.607Z | 2026-11-13T13:55:24.885Z | not attested (null) |
| Round 3 | luna | [Cloud backend R3 — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A5bcdf5e7-75f3-4100-807d-886947b1080f) | 2026-11-13T13:58:01.101Z | 2026-11-13T13:58:39.414Z | gpt-6-luna |
| Round 3 | haiku | [Cloud backend R3 — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Ae218f18a-8f19-460e-9589-a2b5f959c78a) | 2026-11-13T13:58:42.272Z | 2026-11-13T14:01:00.401Z | claude-haiku-5-5 |
| Round 3 | hydrogen | [Cloud backend R3 — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A0147d486-b43b-4dab-88db-5862d3e2d2ba) | 2026-11-13T13:59:47.057Z | 2026-11-13T14:00:25.688Z | not attested (null) |
| Email/password supplement | luna | [Cloud backend email-password review — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Aa66a8d1d-520d-405a-8b06-62ef0b2de3c2) | 2026-11-13T14:02:22.852Z | 2026-11-13T14:02:50.041Z | gpt-6-luna |
| Email/password supplement | haiku | [Cloud backend email-password review — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Ac73258ae-da0d-4702-bcf0-4bd0d431ed15) | 2026-11-13T14:02:52.939Z | 2026-11-13T14:03:40.700Z | claude-haiku-5-5 |
| Email/password supplement | hydrogen | [Cloud backend email-password review — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Ae0927ba6-33e3-49df-a260-ca6c248ab722) | 2026-11-13T14:03:45.991Z | 2026-11-13T14:04:13.661Z | not attested (null) |

Cancelled initial Hydrogen attempt: [Cloud backend R1 — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A86d1ee44-825c-422e-94fe-16ae6cc91f50). Its task ID was `node:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A86d1ee44-825c-422e-94fe-16ae6cc91f50`. It produced no completed independent proposal before replacement.

## Repository and documentation evidence

The coordinator inspected the specified Wrangler/package/Vite/main/App/builder/schema/storage/scenario/compiler/CI files and unit/browser tests rather than relying on older plans. Remote main was checked read-only and matched the local checkout.

Current source facts:

- Static-assets-only Worker; no API entry point/auth/D1 binding.
- Builder workspace v1 contains raw editor strings, graph layout/viewport, scenarios, validation keys, optional receipt relationship snapshots and provenance.
- Local storage uses `dominoos.builder.workspace.v1`, a 2 MiB UTF-8 cap, 500 ms autosave and protection against replacing unreadable stored data.
- Original Dataset JSON/CSV imports and simulator memory are separate from builder workspace persistence.
- Cloud row ID must not replace the document ID used in scenario network keys.

Executed baseline: 84 unit tests, 26 Chromium journeys, build and Wrangler dry run all passed. Browser execution needed local-server permission and installation of the matching Chromium in the ignored project cache. No new backend/auth/D1 tests or live production acceptance could pass because no backend was implemented.

Primary documentation checked during this task:

- [Worker fetch API](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/), [assets binding](https://developers.cloudflare.com/workers/static-assets/binding/), [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [bound statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/), [migrations](https://developers.cloudflare.com/d1/reference/migrations/), [local development](https://developers.cloudflare.com/d1/best-practices/local-development/).
- [Workers local development](https://developers.cloudflare.com/workers/local-development/), [Vite integration](https://developers.cloudflare.com/workers/vite-plugin/get-started/), [test harness](https://developers.cloudflare.com/workers/testing/test-harness/get-started/), [preview isolation](https://developers.cloudflare.com/workers/previews/resources/).
- [Clerk React SDK](https://clerk.com/docs/react/getting-started/quickstart), [request authentication](https://clerk.com/docs/reference/backend/authenticate-request), [production deployment](https://clerk.com/docs/guides/development/deployment/production).
- [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [Auth0 React](https://auth0.com/docs/libraries/auth0-react), [access-token verification](https://auth0.com/docs/secure/tokens/access-tokens/validate-access-tokens), [jose runtime support](https://github.com/panva/jose).
- [Better Auth native D1](https://better-auth.com/blog/1-5), [Cloudflare guide](https://better-auth.com/docs/guides/cloudflare), [core database schema](https://better-auth.com/docs/concepts/database), [CLI](https://better-auth.com/docs/concepts/cli).
- [Better Auth email/password](https://better-auth.com/docs/authentication/email-password), [sessions](https://better-auth.com/docs/concepts/session-management), [rate limits](https://better-auth.com/docs/concepts/rate-limit), [security](https://better-auth.com/docs/reference/security), [options](https://better-auth.com/docs/reference/options).
- [Workers CPU limits](https://developers.cloudflare.com/workers/platform/limits/), [closed password-resolution issue](https://github.com/better-auth/better-auth/issues/9649), [fix/dependency bump](https://github.com/better-auth/better-auth/pull/9791).

Installed Wrangler 4.161.0 schema and help were also checked for route arrays, D1 bindings, local/remote migration flags and dev modes; its types expose `createTestHarness`. The library is not installed in this repository, so package-specific runtime/SQL/hash claims remain implementation proof items.

## Round 1 — independent proposals

| Participant | Actual initial preference | Main contribution | Important gap |
| --- | --- | --- | --- |
| Luna | Clerk bearer session + backend verification; one D1 JSON row, CAS | Stable owner restriction, public demo independence, JSON persistence/security boundaries | No concrete payload cap; preview isolation and async state were underspecified |
| Haiku | Path-scoped Cloudflare Access; email owner; Vite proxy; builder deep link | Existing autosave/replace lifecycle, auth outage isolation and concrete UI states | Redirect-versus-JSON contradiction, mutable email identity, broad Worker-first routing, unnecessary deep link |
| Hydrogen | Clerk authenticateRequest; native D1; Cloudflare Vite plugin | Cloud ID/document ID distinction and scenario invalidation risk; precise CAS | Wildcard auth origins, unsafe overwrite path, preview inheritance, integration estimate optimism |

The starting auth preference was **not unanimous**. The initial cloud byte caps differed: Luna deferred selection, Haiku proposed 1.9 MB, Hydrogen 1.5 MB. All favored D1 rather than KV/R2 and a workspace JSON document rather than normalized graph entities.

## Round 2 — cross-examination

Every model critiqued both competitors; complete responses below preserve the actual wording.

| Reviewer -> competitor | At least three concrete weaknesses raised |
| --- | --- |
| Luna -> Haiku | Access public-user/redirect contract; mutable email owner; all-asset Worker execution; cap/request accounting; overwrite/data-loss choices; unnecessary URL scope |
| Luna -> Hydrogen | Overstated Access limitation; insufficient streamed limits; force overwrite; save/open/auth races; missing preview binding isolation; unsupported schedule certainty |
| Haiku -> Luna | Wrong/unclear token audience requirements; named-env-only isolation; local fake-auth path; deferred size limits; bare API handling; unresolved conflict semantics |
| Haiku -> Hydrogen | Production/preview binding risk; missing bare API route; discard/overwrite UX; wildcard origins; Access claims; Vite migration risk; unproven large bound insert |
| Hydrogen -> Luna | Missing bare API and stream caps; lower-level verification choice; preview inheritance; missing races and concrete local API path |
| Hydrogen -> Haiku | Access redirect lifecycle; mutable email; narrow D1 headroom; Worker-first-all-assets; overwrite; environment auth toggle |

R2 corrections shared with all participants:
1. Official route arrays support `/api/*`; also handle bare `/api`. Array routing overrides SPA navigation detection.
2. D1's ceiling is 2,000,000 bytes, not the app's 2,097,152-byte local cap.
3. Current Clerk React package is `@clerk/react`; backend Workers compatibility is documented. Do not treat an earlier inability to verify it as proof of incompatibility.
4. Access can protect workers.dev hosts/paths. Its fit must be judged by actual account/redirect/API needs, not a claim that it is impossible there.
5. Stable opaque identity, exact trusted origins, no environment-toggle production auth bypass, and no blind 409 retry/overwrite.
6. Preview D1 requires explicit binding isolation; a staging environment alone does not retarget branch previews.
7. Preserve source/document/scenario identity and protect against stale asynchronous responses.
8. Known v1 canonical round-trip differs from promising preservation of unknown keys that the existing Zod serializer strips.

Haiku withdrew Access in favor of Clerk at this stage. That was an actual revision, later superseded by the user's domain constraint.

## User steering and Round 3 — revised proposals

Before Round 3, the user confirmed **no owned domain or DNS**, only the existing workers.dev URL, then asked “what about betterauth?”. The coordinator checked current documentation rather than assuming older Better Auth/Drizzle requirements.

Clerk's documented production-domain setup became a blocker; development keys were not accepted as a production substitute. Auth0's tenant-domain login was considered as a managed alternative. Better Auth now documents direct D1 binding support without Drizzle. All three received those sources, original proposals and all R2 criticisms.

All three revised to **Better Auth, native D1, OAuth-only with GitHub recommended conditionally**. This was not yet the final user-selected auth mode. Each retained runtime/schema/provider-credential gates.

Specific differences remained:
- Luna estimated 22–32 person-hours / 10–16 elapsed hours.
- Hydrogen estimated 21–29 person-hours / 12–16 elapsed hours and favored an early Auth0 pivot if the spike failed.
- Haiku estimated 38–50 person-hours / 16–20 elapsed hours, judged full UX unrealistic and favored cloud-disabled rather than a late provider pivot.
- Haiku wanted only Keep local / Save copy on conflicts; Luna/Hydrogen included backup-safe remote load.
- Haiku proposed an auth-user foreign key; the final plan avoids coupling projects migration to generated auth naming while account deletion is absent.
- All moved toward a Vite proxy rather than adopting the Cloudflare Vite plugin under deadline.

## Supplemental review — email/password user pivot

After R3 was underway, the user asked “what about pivoting to email + password only?”. The coordinator distinguished built-in library authentication from handwritten password/session code, researched Workers hashing and email-delivery requirements, and asked about verification/recovery scope.

The user explicitly chose: **“Defer verification and reset for the hackathon.”** The outdated OAuth provider choice was superseded. All three models then received the updated scope, their real R3 proposal, the closed hashing issue, current CPU limits, persistent limiter details and no-recovery boundary in a new delegated review.

| Participant | Actual verdict | Main objections |
| --- | --- | --- |
| Luna | Conditional accept | Real account CPU/runtime gate; no weakening hashes; test persistent limiter before hash; mailbox ownership/recovery limits; stop cloud if blocked |
| Haiku | Conditional accept, pessimistic schedule | Account CPU budget; auth endpoint allowlist; venue NAT lockouts; schema/cookie proof; no late fallback; disputed enumeration claims |
| Hydrogen | Conditional accept | Real deployed CPU versus local wall time; fixed-session 401 preserves draft; six tables; concurrent limiter proof; disabled extra auth routes |

Their agreement is conditional architectural support, **not live security/runtime acceptance**. The additional table is `rateLimit`: user/session/account/verification/rateLimit/projects in one D1 database per environment.

### Factual differences preserved and coordinator corrections

- Haiku asserted that Free should be rejected before measurement based on JS scrypt. The password bundle issue was closed upstream; that assertion was **not adopted as verified**. The actual pinned bundle and actual plan CPU must be measured. Paid service is not presumed or purchased.
- Haiku and Hydrogen disputed duplicate-email concealment with `autoSignIn:false`. Current official docs describe generic signup responses in that mode. The final plan uses separate signup then login, requires installed-version HTTP tests, and makes no blanket enumeration-resistance claim.
- Hydrogen's supplement said Auth0's “built-in email/password is test-only.” The precise documented limitation concerns **Auth0's built-in email delivery**, not all managed password authentication. This overstatement was not adopted.
- Luna's R3 mistakenly referred to “six total” tables while listing five; the final email/password design really has six because persistent rate limiting adds a table.
- Some proposals treated any auth outage as a cloud-only issue without handling auth-loading UI. The final plan keeps the builder outside blocking auth boundaries and does not make availability claims beyond valid configured sessions/runtime tests.
- Some proposals said to retry PUT with `currentVersion`; the final plan explicitly prohibits that blind overwrite.
- Proposals differ on verbatim JSON strings versus canonical workspace objects. The final contract is an object, structurally parsed and canonically serialized just like existing supported v1 exports, with distinct wire/canonical caps.
- Some proposals claimed previews are isolated merely by omitting a binding. The final plan requires explicit preview binding removal, cloud disabled, and proof of resolved bindings before upload.
- Timing estimates and deadline arithmetic from agents are estimates; authoritative deadline is the user's 14 November 20:00 Europe/Vilnius, equivalent to 18:00 UTC. No agreement on guaranteed delivery is claimed.

## Coordinator's final architecture selection

Selection occurred **after all required rounds and supplemental responses completed**, at/after the 14:05:06 UTC review observation.

1. Better Auth email/password only on the existing Worker, library hashing and revocable D1 sessions; no verification/reset emails or OAuth in this hackathon, per user steering.
2. One D1 database per deployed environment; generated core auth and persistent rate-limit tables plus one projects table.
3. Same-origin `/api` and `/api/*` Worker-first; existing static assets and public guest demo retained.
4. Complete canonical supported-v1 workspace snapshots; no simulation/server compilation or graph normalization; 1,000,000 canonical bytes and 1,050,000 project-body bytes.
5. Verified session user identity on every protected request; owner-scoped bound SQL; atomic version CAS and indistinguishable foreign/missing 404.
6. Local-first device persistence; explicit cloud saves; guest storage preserved and owner/project cloud drafts separated; backup-safe opens, accurate dirty state and stale-response guards.
7. Small account/project dialogs and reuse of current safe workspace replacement; no new dashboard/router.
8. Vite dev proxy plus local Wrangler; explicit staging resources and guest-only branch previews; existing production Worker name/deployment path preserved.
9. Test-only identity adapter outside deploy entry, real library/runtime D1 tests, and real two-account/fresh-browser staging/production acceptance after approval.
10. First pass API/ownership contracts, then the sign-in/save/sign-out/sign-in/open vertical slice. Stop and report a failed CPU/schema/security gate; no silent auth-provider or spending pivot.

The plan chooses initial signin/signup thresholds of 10/5 attempts per minute per IP instead of the supplement's 5/3 starting proposal, to reduce venue NAT lockout. These remain measured/tunable limits, not accepted security proof. No force-overwrite UI. Remote Open uses the same backup-safe flow already required to open projects; richer conflict resolution is deferred.

The no-recovery/no-verification limitation is explicit and reversible in a future phase. It must not be disguised as verified email identity or full account lifecycle support. This limited P0 still must satisfy real authentication, session expiry/revocation, ownership, private project data and data-loss safeguards.

## Outstanding proof and disagreements

**Verified now:** current main/source contracts; documentation capabilities; actual delegated responses; local baseline checks.

**Chosen, not implemented:** API/data/session/UI contracts, file ownership and release gates in the implementation plan.

**Unknown:** actual account plan/billing, credentials/permission readiness, pinned auth version/engine fit, generation-only schema tooling, production hash CPU, persistent limiter atomicity and thresholds, cookies/proxy behavior, preview binding resolution, live auth and deployed acceptance.

Schedule confidence differs substantially. Haiku remained skeptical of full delivery. No model measured hash CPU or demonstrated native D1 schema generation in this repo. No live accounts/cloud resources were created. The coordinator adopts stop/go checkpoints and defers provider changes to review; this does not erase the dissent.

## Archived actual final responses

The following are the real final proposal/review outputs retrieved from each delegated thread. They intentionally include superseded and disputed claims. Refer to the corrections above and the implementation plan for the selected design. No internal reasoning traces are included.

<details>
<summary>Round 1 — gpt-6-luna — Independent proposal</summary>

Source: [Cloud backend R1 — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Afa0da362-32db-4993-80ad-76069d6b9a8e)

## Round 1 proposal: architecture and security

### 1. Authentication

Use Clerk for account sign-in, with the browser’s Clerk session token sent as a bearer token to the same-origin API. Verify the token in the Worker on **every protected request** using Clerk’s `verifyToken` from `@clerk/backend`. Validate issuer/audience and expected authorized party where applicable; derive the owner ID only from verified claims. Keep Clerk secrets in Worker secrets, never in Vite-exposed variables. Clerk documents `@clerk/backend` and `verifyToken` as its backend verification path; its guidance for edge runtimes also describes using `CLERK_JWT_KEY` for local signature verification without a per-request network call ([Clerk `verifyToken`](https://clerk.com/docs/reference/backend/verify-token), [Clerk edge deployment guidance](https://clerk.com/articles/authentication-for-serverless-and-edge-deployments-2)).

I favor Clerk over Cloudflare Access for this public demo: Access is well suited to restricting access to a known organization or team, while this feature needs user accounts and application-level ownership. Custom auth would create avoidable deadline risk: credentials, session lifecycle, reset flows, abuse controls, and account recovery. Treat Clerk outage as a cloud-save outage only; keep demo and local workspaces usable.

### 2. Same-origin API and routing

Add a Worker entry point and set `assets.binding = "ASSETS"` with `assets.run_worker_first = ["/api/*"]`. Dispatch `/api/*` in the Worker; return JSON `404` for unknown API paths and `405` with `Allow` for unsupported methods. Delegate non-API requests to `env.ASSETS.fetch(request)`. This preserves the existing static SPA while ensuring API requests do not fall through to `index.html`. Cloudflare documents this selective Worker-first routing alongside SPA fallback ([Static Assets routing](https://developers.cloudflare.com/workers/static-assets/binding/)).

Be precise about the API boundary: `/api` itself and `/api/…` should be handled deliberately, and API errors should never become HTML. Keep SPA navigation fallback for application routes. Check behavior for `HEAD`, `OPTIONS`, malformed paths, and asset misses; avoid making the Worker run first for every static asset.

### 3. Persistence and concurrency

Use D1, not KV or R2. Projects need owner-filtered listing, small records, and atomic conditional updates. KV is eventually consistent and awkward for reliable read-modify-write; R2 is unnecessary for the expected record size and lacks the relational listing/indexing model needed here.

Minimal table:

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  document_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX projects_owner_updated ON projects(owner_id, updated_at DESC);
```

Store one lossless workspace document per row. Update with `UPDATE … SET document_json=?, version=version+1, updated_at=? WHERE id=? AND owner_id=? AND version=?`; zero affected rows means conflict or missing/unauthorized, resolved without revealing which. D1 supports transactions through `batch`, but a single conditional update is enough for compare-and-swap. Avoid last-write-wins autosave. Limit title and document bytes at the API boundary; decide a conservative cloud-specific limit after measuring representative workspaces. The local 2 MiB limit is not evidence that one D1 row of that size is supported or appropriate.

### 4. Lossless data and incomplete drafts

Inspecting the builder code shows a workspace includes domain entities and scenario state, with Zod parsing, local storage, scenario management, and compilation as distinct concerns. Persist the canonical workspace JSON that the builder already uses; do not persist compiled simulation output as the source of truth. Require schema-versioned parse/validation while retaining all user-authored fields, IDs, ordering, incomplete drafts, and unknown data if forward-compatible round-tripping is intended. Do not “repair” incomplete drafts on save. Add explicit migrations only when a schema change requires them. Protect against malformed JSON, oversized bodies, invalid IDs, and data that parses structurally but violates ownership-independent domain rules.

### 5. UX and authorization

Keep local autosave. Add explicit **Save to cloud**, **My projects**, **Open**, and **Save as copy** actions. Show save state and conflict/error recovery; never imply a local change is cloud-backed. On open, confirm before replacing dirty local work. Permit unauthenticated demo use and local editing; require sign-in only when the user chooses cloud actions.

Every read, update, and delete query must include both project ID and the verified owner ID. Never accept `owner_id` from request JSON. Return the same `404` for nonexistent and another user’s project. Add CSRF protections if cookie-based auth is used; bearer tokens reduce that risk but still require strict CORS/origin policy and no wildcard credentialed CORS. Apply rate and body-size limits. No users table is needed.

### 6. Local development, tests, and demo risks

Keep production D1 and local D1 separated by named Wrangler environments and distinct database IDs. Local dev should work without Clerk credentials for the demo; API tests can inject a test verifier or use a documented local-only identity shim that cannot activate in production. Add tests for token rejection, cross-owner access, unknown API routes, JSON errors, size limits, CAS conflicts, and lossless round-trip of incomplete workspaces. CI should exercise Worker routes and D1 migrations without production credentials or bindings.

The repo currently has static assets configured for SPA fallback, no Worker entry point or database binding, Vite dev server, and Vitest tests under `src/tests/**/*.test.ts`; package scripts include build, test, E2E, deploy, and dry-run deploy. This means the key risk is integration under the deadline, not just adding storage: local Vite requests need a deliberate API proxy or Wrangler dev path, and a production deploy must include a migration and Clerk secrets.

### 7. Explicitly omit

For the deadline, omit sharing/collaboration, organizations/roles, project deletion recovery, attachments, audit history, background sync, automatic cloud mirroring, multi-device merge, and simulation changes. Keep the public demo useful if Clerk, D1, or the API is unavailable.

**Effort estimate:** roughly 1–2 focused engineering days for a narrow vertical slice with tests and an isolated deploy configuration; account setup, DNS/secrets, migration, and production smoke testing are schedule risks. The deadline is close enough that auth-provider setup and end-to-end deployment are the main critical path.

**Unique objection to the baseline:** a one-row JSON document plus CAS is a good first cut only if the builder has one canonical workspace serialization boundary. If serialization omits draft/editor state or normalizes away fields, D1 will make that data loss durable. Verify that boundary before designing the SQL API.

</details>

<details>
<summary>Round 1 — claude-haiku-5-5 — Independent proposal</summary>

Source: [Cloud backend R1 — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Ac2dbe4bb-520a-4099-a33f-17ed84bf0855)

# Round 1: UX and frontend integration proposal (design sub-agent)

I read the repo, the Cloudflare docs, and the Clerk reference, and I did not read other agents' discussions. My recommendation changes the auth baseline: **use Cloudflare Access, not Clerk**. The reasons are below.

## Repo facts that drive the design

- `wrangler.jsonc` is assets-only. There is no `main`, and `assets` uses `not_found_handling: "single-page-application"`. Adding `/api` needs a Worker entry point.
- `main.tsx` routes only `/landing`. Everything else renders `App`, and the builder opens from `builderOpen` state (`App.tsx:291`, `:410`, `:431`). A reload or deep link cannot reach the builder, so cloud projects need a real URL.
- `storage.ts` caps the local workspace at `MAX_WORKSPACE_BYTES = 2 * 1024 * 1024` (2,097,152 bytes). Local saves validate with `parseWorkspace` (structure only). Incomplete networks are therefore saveable. Scenario validity lives in `validatedNetworkKey` and `receiptSnapshots`.
- `BuilderExperience` autosaves locally 500 ms after each change and guards `beforeunload` against unsaved changes. `replace()` already confirms before overwriting work and remounts the canvas via `canvasSession`. Cloud open should reuse `replace()`.
- `vite.config.ts` has no dev proxy. The Playwright config runs `npm run dev` on :5173 and CI runs `deploy:check` (dry run). No test covers `/api`.
- Installed: `wrangler` 4.161.0. Not installed: `jose`, `@clerk/*`, `hono`.

## Verified external facts

- **Static Assets routing** (developers.cloudflare.com/workers/static-assets/routing/worker-script): by default, assets are matched first and the Worker runs only when no asset matches. `run_worker_first` accepts `true` or an array of paths. The docs do not confirm wildcard support such as `"/api/*"`.
- **D1 limits** (developers.cloudflare.com/d1/platform/limits): max row/string/blob is **2,000,000 bytes**. Workers Paid allows 1,000 queries per invocation. Max query duration is 30 s. DB size is 10 GB (Paid).
- **Clerk** (clerk.com/docs/reference/backend/verify-token): `verifyToken(token, options)` and `authenticateRequest()` exist. Options include `secretKey`, `jwtKey`, and `authorizedParties`. The docs do not confirm Workers compatibility.
- **Cloudflare Access JWT** (developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json): header `Cf-Access-Jwt-Assertion`, cookie `CF_Authorization`. Check `iss` = `https://<team>.cloudflareaccess.com` and `aud` = the app AUD tag. JWKS is at `<team domain>/cdn-cgi/access/certs`. The docs also show `ctx.access` as an alternative.

## 1. Auth: Access, not Clerk

**Recommendation: Cloudflare Access, self-hosted app, path-scoped to `/api/projects*` and `/api/me`.** Verify the JWT in the Worker against JWKS with `jose` (`createRemoteJWKSet`, `jwtVerify`, which I did not verify in its current docs). Owner ID is the JWT `email` claim.

Why this beats Clerk here:
- **Outage isolation.** Access path-scoping means the public demo and static HTML never touch auth. Clerk's React provider and publishable key load in the main bundle unless I lazy-load them, and I have not verified that Clerk works in Workers.
- **Less code and no frontend SDK.** The frontend only does `fetch('/api/...')` and reads 401s. No new dependency in the bundle.
- **Fewer moving parts for one day of work.** No Clerk app, keys, or dashboard config.

My objection to Access: its login is a full-page redirect, which drops in-memory state. Mitigation: local autosave already survives reloads, and the cloud panel shows "Sign in to save to cloud" with a top-level link to `/api/me` so the return path is a real navigation. Access is also free for small teams, but I did not verify current pricing.

If the user insists on in-app sign-in, Clerk is acceptable only with lazy import inside the cloud panel and a 3 s timeout that falls back to local-only.

## 2. Same-origin Worker and routing

- Add `"main": "src/worker/index.ts"` and set `"run_worker_first": true`. This avoids wildcard uncertainty. Assets still serve from `env.ASSETS.fetch`.
- In the Worker: any path starting with `/api/` is handled by the API router. Unknown `/api/*` returns **JSON 404** (`{error:{code:"not_found"}}`), never `index.html`. Every other path calls `env.ASSETS.fetch(request)`, so SPA fallback still works.
- Add a `/builder` pathname branch in `main.tsx` beside `/landing`. Deep links such as `/builder?project=<id>` then work. Keep `/` unchanged for the public demo.
- Add `server.proxy: { '/api': 'http://127.0.0.1:8787' }` to Vite for dev. Run `wrangler dev` alongside.

## 3. Storage: D1, one table

Use D1 with one table. Do not add a users table.

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  version INTEGER NOT NULL,
  workspace_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX projects_owner_updated ON projects(owner, updated_at DESC);
```

Concurrency is a single compare-and-swap statement:

```sql
UPDATE projects SET workspace_json=?, name=?, version=version+1, updated_at=?
WHERE id=? AND owner=? AND version=?
```

If `meta.changes === 0`, look up the row. Return 404 if it is missing or belongs to another owner, else 409 with `currentVersion`. Use one `db.batch` only for create.

**Size cap: 1,900,000 UTF-8 bytes, not 2 MiB.** The local 2,097,152-byte cap exceeds D1's 2,000,000-byte row limit, so a near-cap local workspace cannot be copied to D1. The UI should say "too large for cloud, export JSON," and the server should return 413. Do not auto-copy.

## 4. Lossless contract

- Client sends `serializeWorkspace(workspace)`, the exact validated JSON string.
- Server runs `parseWorkspace` (structure only, not the compile or scenario revalidation), then stores `JSON.stringify(parsed)`. Known v1 fields survive unchanged. Unknown keys are dropped by zod's default strip. That is acceptable, but state it.
- Incomplete drafts are accepted because `parseWorkspace` does not require `compiled.ok`. Do not add compile checks to the server.
- Server-side revalidation stays out of scope. `validatedNetworkKey` is stored as-is and the existing review UI handles staleness.
- Keep the Worker's import of `schema.ts` type-clean: `schema.ts` imports `./factories` and `types.ts` imports `@/lib/types`. Confirm with `wrangler deploy --dry-run` that the alias does not break bundling, since esbuild does not know the Vite `@` alias.

## 5. UX: create, list, open, update

- **Header actions:** rename the existing `Save workspace` to **"Save on this device"**. Add **"Save to cloud"** (disabled with a reason if signed out). Add **"Cloud projects"**.
- **Cloud projects dialog** (reuse `ui/dialog.tsx`): list of name and `updatedAt` only. The list response must not include `workspace_json`, which can be 1.9 MB per row. Actions: Open, Save as new project, Save (updates current project).
- **Save:** sends `expectedVersion`. On success, status shows "Saved to cloud · v3 · 14:02". Cloud save is explicit, not autosaved, so every save is a deliberate action.
- **Conflict (409):** show a dialog with three choices: "Open the server version" (confirm, discards local), "Save my version as a new project" (safe default, recommended), "Overwrite" (discouraged, behind a confirm). Never auto-merge.
- **Open:** reuse `replace()`, which already confirms before discarding work. Set `source.openedFromFile` to false and show the project name in the header.
- **Current project id** lives in the URL (`/builder?project=ID`) so reload restores it. Local autosave remains the source of unsaved edits.
- Show a `beforeunload` warning when local differs from the last cloud version, not just from local save.

## 6. Owner authorization

- Every query filters `owner = email`. No sharing, no admin view.
- The API accepts an owner only from the verified JWT, never from a request body or query parameter.
- Deny by default: every `/api/projects*` path without a valid JWT returns 401 JSON, not a redirect.

## 7. Local dev, tests, prod isolation

- **Isolation (blocking):** `wrangler.jsonc` `previews: {}` means branch builds run `wrangler preview`. A D1 binding shared with production would let branch previews write production data. Create a separate D1 database for preview and production, or disable D1 binding in preview. Use `env` blocks.
- **CI:** `deploy:check` needs a real `database_id` or `preview_database_id` for the dry run. Keep the cloud Worker behind `env.production` only if the dry-run fails without it.
- **Tests:** add Vitest tests for the Worker router and the CAS helper using a fake D1 or `unstable_dev`. Add a Playwright test that runs with the cloud API disabled (proves the public demo still works offline from the API). Do not make the existing journey tests depend on Access.
- **Local:** `wrangler d1 migrations apply --local`, `wrangler dev`, Vite proxy. Add a `DEV_AUTH_EMAIL` environment variable for local-only owner injection, never set in production.

## 8. Demo risks

1. **Demo survives outage:** the Simulate home, public demo, and `/landing` make no `/api` calls on load. The cloud button probes `/api/me` lazily, with a 3 s timeout, and falls back to local-only.
2. **Access login on a judge's laptop** adds an email-OTP step. Test it on a fresh browser before the demo. Keep a local-only path so the demo does not depend on it.
3. **Access path misconfiguration** could expose or block data. Test: signed-out `GET /api/projects` must be 401, and `GET /api/nope` must be JSON 404.
4. **The 2 MiB local draft** may fail cloud upload. Demo a normal-size network.
5. **D1 cold latency** on first request. Warm with `/api/me` at builder open.
6. **Preview database sharing** (see section 7).

## 9. Omitted features

- Delete, rename after create (beyond the name field), history or undo across versions, sharing, collaboration or realtime, offline sync queue, automatic cloud autosave, R2 attachments or large workspaces, admin view, Clerk user profiles, landing-page cloud state, and cross-device import from the local cache.

## Effort and risk

- **Access + Worker + D1 CAS + `/builder` route + dialog + conflict UI:** about 8 to 10 focused hours, with about 1 day left before the deadline. That is tight. Cut in this order if needed: "Save as new project" for conflicts (replace with a plain error), then rename, then the list dialog (use a simple `<select>`).
- **Clerk variant:** add about 3 to 4 hours for setup, keys, lazy loading, and the Workers compatibility check.

## Unverified

- Wildcard `run_worker_first` (avoided by using `true`).
- `@clerk/backend` Workers compatibility.
- Current Access free-tier limits and pricing.
- `jose` API names (not installed, not checked against current docs).

## Sources

- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- https://developers.cloudflare.com/d1/platform/limits/
- https://clerk.com/docs/reference/backend/verify-token
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/

</details>

<details>
<summary>Round 1 — gemini-4-hydrogen — Independent proposal</summary>

Source: [Cloud backend R1 — hydrogen read-only retry](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Af40776b9-e64f-43ef-bb0a-7f61a4e957fa)

### Round 1 Design Proposal — Backend, Database & Critical Review

#### 1. Simplest Real Auth (Clerk vs. Alternatives)
**Choice:** `@clerk/react` (client) + `@clerk/backend` (Worker), using `createClerkClient({ secretKey, publishableKey }).authenticateRequest(request, { jwtKey, authorizedParties })` for networkless JWT verification on `/api/*`.

* **Why not Cloudflare Access?** Access is built for Zero Trust / internal teams behind configured IdPs and intercepts requests at the edge before the Worker runs. It is ill-suited for a public demo app where arbitrary external users sign in, and Access preview/hostname policies add friction to `workers_dev` and branch previews.
* **Why not custom auth?** Password hashing, email/magic-link delivery, token rotation, CSRF, and session revocation are unnecessary risk before the Nov 14, 20:00 Europe/Vilnius deadline.
* **Resilience (Public Demo & Outage Survival):**
  * **Client:** Guard `<ClerkProvider>` in [src/main.tsx](file:///Users/dominykas/Development/unfair-wknd-26/src/main.tsx) behind `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY` and wrap auth UI in a non-blocking boundary. If Clerk's key is unset or its script/API is unreachable, `/`, `/landing`, and local `BuilderExperience` ([src/components/builder/BuilderExperience.tsx](file:///Users/dominykas/Development/unfair-wknd-26/src/components/builder/BuilderExperience.tsx)) still load and run with zero auth dependency.
  * **Server:** Public routes never invoke Clerk. Protected `/api/*` routes fail closed (`401` on invalid/missing token; `503` if `CLERK_SECRET_KEY` is unconfigured), while passing `jwtKey` (`CLERK_JWT_KEY`) avoids a JWKS network fetch per request.

---

#### 2. Same-Origin Workers `/api` + Static Routing & 404 Handling
Update [wrangler.jsonc](file:///Users/dominykas/Development/unfair-wknd-26/wrangler.jsonc) to add a Worker entrypoint and `run_worker_first`:
```jsonc
{
  "main": "src/worker/index.ts",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*"]
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "domino-os-db", "database_id": "<id>" }
  ]
}
```
* **API 404 Trap:** Because `not_found_handling` is `"single-page-application"`, any request that falls through to `env.ASSETS.fetch(request)` returns `200 OK` with `index.html`. The Worker **must** terminate all `/api/*` requests itself and return `404` JSON (`{ "error": "Not found" }`) for unknown `/api/*` paths—never forward `/api/*` to `env.ASSETS`.
* **Health check:** Expose `GET /api/health` (unauthenticated) returning `{ ok: true }` so CI/smoke tests can verify Worker routing without Clerk credentials.

---

#### 3. D1 vs. KV/R2, Schema & Concurrency
**Choice:** **Cloudflare D1** only (no KV, no R2). KV is eventually consistent (breaks immediate list-after-save and lacks atomic CAS); R2 adds extra bindings and multi-step consistency for payloads well under 1.5 MB.

**Minimal Schema (no `users` table):**
```sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  workspace_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_updated
  ON projects (owner_id, updated_at DESC);
```

**API Contract & Optimistic Concurrency (CAS):**
* `GET /api/projects` → `200 { projects: [{ id, name, version, updatedAt }] }` (omits `workspace_json` to keep list responses small and fast).
* `POST /api/projects` → body `{ workspace: BuilderWorkspaceV1 }` → `201 { id, name, version: 1, updatedAt }`.
* `GET /api/projects/:id` → `200 { id, name, version, updatedAt, workspace: BuilderWorkspaceV1 }`.
* `PUT /api/projects/:id` → body `{ expectedVersion: number, workspace: BuilderWorkspaceV1 }`:
  ```sql
  UPDATE projects
  SET name = ?, workspace_json = ?, version = version + 1, updated_at = ?
  WHERE id = ? AND owner_id = ? AND version = ?;
  ```
  * If `result.meta.changes === 1` → `200 { id, name, version: expectedVersion + 1, updatedAt }`.
  * If `0` → query `SELECT version, updated_at FROM projects WHERE id = ? AND owner_id = ?`. If no row → `404`. If row exists → `409 Conflict { error: "Version conflict", currentVersion, updatedAt }`.

---

#### 4. Lossless Workspace JSON, Incomplete Drafts & Size Limits
* **Schema & Incomplete Drafts:** [src/lib/builder/schema.ts](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/builder/schema.ts#L183-L226) (`parseWorkspace`) already validates `BuilderWorkspaceV1` structurally while permitting incomplete drafts (blank `name`, blank `asOf`, unconnected nodes/edges) that fail [compileGraph](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/builder/compiler.ts#L121). The Worker **must** validate with `parseWorkspace` (shared Zod schema) and **never** gate saves on `compileGraph`.
* **Size Limit Mismatch (Critical):** [src/lib/builder/storage.ts](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/builder/storage.ts#L5) sets `MAX_WORKSPACE_BYTES = 2 * 1024 * 1024` (**2,097,152 bytes**, 2 MiB). Cloudflare D1's hard limit is **2,000,000 bytes** (2 MB decimal) per row/string (and 100,000 bytes per SQL statement, though bound parameters bypass the SQL text limit). A 2 MiB local workspace plus row metadata will fail D1 insertion.
  * **Contract:** Enforce `MAX_CLOUD_WORKSPACE_BYTES = 1_500_000` (1.5 MB UTF-8) in both the Worker (check `Content-Length` early and actual `TextEncoder().encode(raw).length` before D1 write, returning `413 Payload Too Large`) and the client cloud-save button, directing oversized drafts to local JSON export.

---

#### 5. Create / List / Open / Update UX
Keep `BuilderExperience`'s 500 ms `localStorage` autosave ([BuilderExperience.tsx:112-127](file:///Users/dominykas/Development/unfair-wknd-26/src/components/builder/BuilderExperience.tsx#L112-L127)) untouched for instant local resilience, and add **explicit** cloud actions when signed in:
* **Cloud Projects Drawer/Dialog:** Lists `GET /api/projects` sorted by `updatedAt DESC` with **Open** and **New cloud project** (`POST /api/projects` from current draft or blank).
* **Save to Cloud button:** Calls `POST /api/projects` (if no active `cloudProjectId`) or `PUT /api/projects/:id` with `expectedVersion`. Shows explicit status (`Saved to cloud · v3` / `Unsaved cloud changes`).
* **Conflict (`409`) UX:** Prompt user to either **Reload cloud version** (`GET /api/projects/:id`) or **Overwrite cloud** (retry `PUT` with `currentVersion`).
* **Local-only fallback:** When signed out, cloud controls show a subtle "Sign in to save to cloud" prompt without blocking local editing, simulation, or JSON import/export.

---

#### 6. Owner Authorization
* Every `/api/projects*` handler extracts `userId` strictly from the verified Clerk token (`requestState.toAuth().userId`), never from request body/query params.
* All `SELECT`, `UPDATE` (and optional `DELETE`) queries include `WHERE id = ? AND owner_id = ?`.
* Return `404` (not `403`) when a project ID does not exist or belongs to another `owner_id`, preventing project ID enumeration.

---

#### 7. Local Dev, Tests & Prod Isolation
* **Local Dev:** Add `@cloudflare/vite-plugin` to [vite.config.ts](file:///Users/dominykas/Development/unfair-wknd-26/vite.config.ts) so `npm run dev` runs the Worker + local Miniflare D1 (`.wrangler/state`) on `http://localhost:5173`—matching [playwright.config.ts](file:///Users/dominykas/Development/unfair-wknd-26/playwright.config.ts).
* **Unit/Integration Tests (`npm test`):** Vitest tests ([vite.config.ts:8](file:///Users/dominykas/Development/unfair-wknd-26/vite.config.ts#L8)) can test Worker route handlers directly with an injectable auth verifier and in-memory/Miniflare D1 mock, requiring zero Clerk network calls.
* **E2E & CI ([.github/workflows/ci.yml](file:///Users/dominykas/Development/unfair-wknd-26/.github/workflows/ci.yml)):** CI runs `npm test`, `npm run build`, `npm run deploy:check` (`wrangler deploy --dry-run`), and `npm run test:e2e` with no secrets. Ensure `VITE_CLERK_PUBLISHABLE_KEY` is optional at build time and `deploy:check` passes with placeholder/binding config; run remote D1 migrations (`wrangler d1 migrations apply --remote`) explicitly in deploy workflow.

---

#### 8. Key Demo Risks
1. **Unapplied D1 migration in prod:** `projects` table missing on first deploy → **Mitigation:** Gate deploy script on `wrangler d1 migrations apply --remote` + `GET /api/health` DB check (or `SELECT 1`).
2. **Clerk dev-instance limits / domain mismatch:** Clerk publishable key tied to wrong domain or `workers.dev` preview URL → **Mitigation:** Verify `authorizedParties` includes both custom domain and `*.workers.dev` preview URLs, and keep anonymous/local demo working if Clerk fails.
3. **2 MiB vs. 2 MB D1 failure during live demo:** **Mitigation:** Enforce 1.5 MB cloud limit upfront with a clear UI error.

---

#### 9. Omitted Features (Deliberate Scope Cuts)
* No `users` table or profile sync webhooks.
* No project sharing, teams, or role-based ACLs.
* No server-side simulation, revision history table, or R2 blob offloading.
* No automatic background cloud autosave (avoids `409` storms and D1 write amplification).
* No changes to [src/lib/simulation.ts](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/simulation.ts) or scenario validation semantics.

---

#### Unique Backend Objections to Baseline
1. **Do NOT conflate `projects.id` with `workspace.document.id`:** In [src/lib/builder/compiler.ts](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/builder/compiler.ts#L53-L59), `computeNetworkKey(workspaceId, dataset)` hashes `doc.id` into every `validatedNetworkKey` stored in `workspace.scenarios` and `workingScenario`. If the backend overwrites `doc.id` on `POST /api/projects` (e.g., when saving an imported JSON file or cloning), all saved scenarios silently become stale ("requires review"). Keep `projects.id` as the cloud row primary key and store `workspace` verbatim.
2. **Do NOT copy `MAX_WORKSPACE_BYTES` (2 MiB) to D1:** 2 MiB (`2,097,152` bytes) exceeds D1's `2,000,000`-byte row/string limit even before adding `id`, `owner_id`, and timestamps. Cloud save needs a stricter `1,500,000`-byte cap.
3. **Require `jwtKey` for networkless `@clerk/backend` verification:** Calling Clerk's JWKS endpoint on cold Worker starts adds latency and creates a hard runtime dependency on Clerk's availability for existing sessions.

---

#### Official Sources & Estimated Effort
* **Sources:** Cloudflare Workers Static Assets (`run_worker_first`, `not_found_handling`), Cloudflare Vite Plugin (`@cloudflare/vite-plugin`), Cloudflare D1 Limits (2,000,000-byte row/string, 100,000-byte SQL statement), Clerk `@clerk/backend` (`authenticateRequest`, `jwtKey`) & `@clerk/react` (`ClerkProvider`, `useAuth`).
* **Estimated Effort:** ~6–9 hours total (2h D1 schema/migrations + Worker `/api/projects` CAS + tests; 2h `@cloudflare/vite-plugin` + CI/Wrangler wiring; 2–3h Clerk integration + fail-open demo guard; 1–2h Builder cloud save/open/conflict UI + Playwright smoke).

</details>

<details>
<summary>Round 2 — gpt-6-luna — Cross-examination</summary>

Source: [Cloud backend R2 — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Afee8acf1-6226-4a33-a3c1-7d0954713766)

## Round 2 cross-examination

I’m treating Haiku and Hydrogen as the two competing proposals. Both have useful pieces, but neither is a complete contract yet.

### Haiku proposal

1. **Access is feasible, but the proposal understates the public-account problem.** The claim that Access is “ill-suited” for public users is too categorical: Access can protect a `workers.dev` hostname or path. That does not establish it as a good fit here, though. Its redirect and JSON `401` behavior, account lifecycle for arbitrary demo users, and preview-host policy need to be demonstrated against this app’s flow. The proposal relies on a full-page redirect and a `/api/me` navigation without defining how that produces a usable identity or returns safely to the intended UI. Email is also a mutable owner key; ownership needs a stable verified subject.

2. **`run_worker_first: true` is unnecessarily broad and carries avoidable uncertainty.** The cited routing documentation supports `run_worker_first: ["/api/*"]`, and the installed schema supports an array. Route both `/api` and `/api/*` to the Worker, explicitly handle unknown API routes as JSON, and delegate other requests to assets. Running the Worker first for every asset adds unnecessary routing work and departs from the coordinator’s confirmed route contract.

3. **The size limit is not conservative enough, and its request-size check is underspecified.** A 1,900,000-byte workspace is below D1’s 2,000,000-byte row/string cap but leaves little room for row overhead and says nothing about the full HTTP request. Use a conservative **1,000,000-byte workspace JSON cap** and **1,050,000-byte total request cap**. Stream-count bytes and stop once the limit is exceeded; `Content-Length` is only an early rejection hint, not a sufficient limit check.

4. **The conflict path is unsafe and the draft contract discards data.** “Open server version” and overwrite are the only concrete choices; the recommended “save as new project” is safer but still misses “keep local” and “save a copy” as explicit choices. Require choices that never force overwrite: keep local, save a copy, or explicitly load remote after backup. Also, the proposal accepts that Zod strips unknown keys. “Lossless” storage cannot simultaneously promise unchanged workspace preservation and silently discard unrecognized fields. Define the envelope around the existing v1 document and preserve its identity, revision, scenario data, and `source.openedFromFile` as applicable.

5. **The URL and local-development decisions create extra scope without proving the need.** Deep links are optional; My Projects on another device does not require them. Adding `/builder` routing should not be a prerequisite for cloud persistence. Similarly, requiring a concurrently running Wrangler server and Vite proxy is one possible local setup, but the proposal does not compare it with a Worker-aware dev setup or establish which is quickest under the deadline.

### Hydrogen proposal

1. **Its Access argument repeats a factual overstatement.** Access can protect `workers.dev` hosts and paths. Whether it suits this public demo depends on redirect and account lifecycle behavior, not on a blanket claim that it intercepts requests in a way that makes it unsuitable. The Clerk choice is plausible, but the proposal does not compare actual provider setup time or test the login flow. Requiring authorized parties for preview URLs also needs precise configuration; never use a wildcard or an environment toggle to weaken production verification.

2. **The declared payload limits are not justified, and the request accounting is incomplete.** The proposed 1.5 MB workspace cap is safer than 1.9 MB, but less conservative than the coordinator’s 1,000,000-byte workspace / 1,050,000-byte total-request contract. It says to count the raw workspace string, but does not clearly cap the full request body while streaming. Adopt the conservative limits and make oversize handling explicit.

3. **The conflict UX has an unsafe overwrite path.** “Reload cloud version” can discard local edits, and retrying with the fetched `currentVersion` is an overwrite. A version number alone does not make that choice safe. Offer keep local, save a copy, or load remote only after backup; make no force-overwrite option part of the baseline contract.

4. **It misses async race protection and several pieces of persisted state.** The UX sets project ID and updates state around saves and opens, but does not specify protection against stale save/open responses or identity changes during an in-flight request. Define request-generation or cancellation guards so an old response cannot replace the active draft. Preserve `source.openedFromFile`, `document.id`, document revision, and scenario data; never conflate the cloud project ID with the document ID.

5. **Its local-preview isolation claim is too narrow.** Named environments alone do not isolate branch previews. Cloudflare preview bindings support `previews.d1_databases`; configure an isolated preview database or disable the binding for public cloud previews. Do not let preview builds point at production data. Test using synthetic data and isolated bindings, never production records.

6. **Its “quickest safe setup” and deadline estimates are guesses, not evidence.** It estimates 6–9 hours and depends on installing a Vite plugin, wiring CI, deploying migrations, and configuring Clerk. Haiku estimates 8–10 hours with Access. Neither establishes actual setup availability, secret readiness, or the deadline’s remaining dependency chain. Keep these as estimates with explicit uncertainty; resolve provider and deployment prerequisites before relying on either schedule.

### Proposed contract resolution

- **Auth:** Choose one provider after a minimal end-to-end check of sign-in, same-origin API requests, and logout/account behavior on the intended public demo host. Clerk with `@clerk/react` and `@clerk/backend` is a reasonable candidate: use `authenticateRequest`, `jwtKey`, and narrowly scoped `authorizedParties`; derive ownership from a stable verified subject. Access remains a viable alternative if its redirect, JSON `401`, and public account lifecycle work for the demo. Do not introduce custom auth for this deadline. Provider outage must leave public demo and local editing usable; cloud operations fail closed. No wildcard parties or production auth bypasses. Test-only auth belongs outside the deploy entry point.

- **API and storage:** Route `/api` and `/api/*` Worker-first; always return JSON for API errors and unknown API routes. Use D1 with one project row containing the unchanged v1 workspace and a version for conditional updates. Keep envelope metadata outside the v1 workspace. KV’s consistency model is a poor fit for immediate listing and conditional writes; R2 adds no clear value for bounded JSON documents. Validate structurally, accept incomplete drafts, and do not compile-gate saves.

- **Limits and ownership:** Stream-count the request body; cap workspace JSON at 1,000,000 bytes and total request body at 1,050,000 bytes. Apply owner filtering to every project read/write using the verified subject, not email or caller input. Return indistinguishable not-found responses for unknown and other-owner IDs. List responses omit workspace bodies.

- **UX and failures:** Retain local autosave; cloud saves are explicit. Provide list/open/save and safe conflict choices: keep local, save a copy, or explicitly load remote after backup. Prevent stale async saves, opens, and auth-switch results from changing the current workspace. Preserve source metadata, document identity/revision, and scenario state. Deep links are optional. Handle offline/API/provider failures as local-only states without implying cloud success.

- **Environments and evidence:** Prefer the least setup that supports the deadline; keep local development independent of production auth and data. Isolate preview D1 with preview bindings or disable cloud persistence in public previews. Verify migrations and routes with synthetic local/preview data; never test writes against production data. Deadline plans should list external dependencies and secrets, not present unverified hour estimates as settled.

</details>

<details>
<summary>Round 2 — claude-haiku-5-5 — Cross-examination</summary>

Source: [Cloud backend R2 — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A60c19701-e8a1-4c58-8738-7ec3e1d5c9c5)

## Round 2 cross-examination (haiku, plan only)

### Evidence corrections I accept

- **`run_worker_first: true` (my R1) is wrong.** It sends every static asset through the Worker. Use the array form.
- **Wildcard `["/api/*"]` is documented for SPA routing.** I was over-cautious. The array must also include bare `"/api"`, because `/api/*` does not match it.
- **`@clerk/backend` is documented for Workers.** Use `authenticateRequest` with `jwtKey` and explicit `authorizedParties`, not `verifyToken`.
- **My claim that unauthenticated `/api/*` returns 401 JSON was false for Access.** Access redirects to login before the Worker runs, so fetch calls get a 302.
- **Access owner keys by email, which is mutable.** Use a stable subject.
- **My `DEV_AUTH_EMAIL` env toggle is env-gated auth.** Drop it.
- **My `JSON.stringify(parsed)` drops unknown keys**, which conflicts with lossless storage. Replace it with verbatim storage (below).

### Critique of Luna

1. **Audience validation is the wrong check.** Clerk session tokens are checked by `azp` against `authorizedParties`. Asking for `aud` validation invites a check that fails or gets skipped.
2. **D1 isolation is incomplete.** "Named environments and distinct database IDs" does not isolate branch previews. Preview deployments need `previews.d1_databases`. Without it, a top-level binding can point previews at production. This is the one thing that can write production data, and Luna leaves it open.
3. **The local identity shim is a fake-auth path.** "Cannot activate in production" depends on an environment flag. The test verifier belongs in a test-only entry, not the deploy entry.
4. **Limits are deferred.** "Decide after measuring" gives implementers no cap, no counting method, and no 413 contract. It also has no streaming count.
5. **Routing omits bare `/api`.** The `run_worker_first` example has only `/api/*`.
6. **Conflict semantics are open.** "Resolved without revealing which" does not map 409 vs 404 or define the client's recovery options. The 1–2 day estimate ignores the stated deadline.

### Critique of Hydrogen

1. **Production D1 sits in top-level `wrangler.jsonc` with an `"<id>"` placeholder.** That means no preview isolation, previews inherit the production binding, and a committed placeholder either breaks the dry run or invites a real ID to be committed. This is the most serious flaw.
2. **`run_worker_first: ["/api/*"]` misses bare `/api`.** Then `/api` falls through to `index.html` with 200. That is the trap Hydrogen itself warns about.
3. **The conflict UX loses data.** "Reload cloud version" discards local work without a backup. "Overwrite cloud" is a force write. The safe trio is missing: keep local, save a copy as a new project, and load the remote only after a backup.
4. **`authorizedParties` "includes `*.workers.dev` preview URLs" is not feasible.** Wildcards are not supported, and preview hashes can't be enumerated. Preview cloud should be disabled, not authenticated.
5. **The rejection of Access rests on unverified "friction" claims.** I accept the conclusion (Clerk) but not the reasoning.
6. **`@cloudflare/vite-plugin` changes the dev and Playwright path under deadline.** Its compatibility with the existing config is unverified, and it changes the E2E baseline.
7. **The "100,000 bytes per SQL statement" limit is uncertain.** If it applies to bound parameters, a 1 MB insert fails. Test a max-size insert on a non-production DB before relying on the cap. Also, the cap should apply to the streamed total, not only to the workspace after buffering.

### Resolution by category

- **Auth managed vs custom:** managed. Custom auth adds reset, abuse, and session work the deadline cannot absorb.
- **Clerk vs Access vs alternatives:** Clerk. Access is allowlist or OTP based and redirects before the Worker, so it does not suit a public account model. It can protect `workers.dev`, so it is not impossible, just worse here. If Clerk keys are not provisioned by a hard cut line, ship with cloud disabled rather than swapping to Access mid-build.
- **Quickest safe setup:** Clerk with `authenticateRequest` plus `jwtKey`, one table, explicit save. Cut rename and delete first. If time is short, replace the list dialog with a `<select>`.
- **Every-request identity:** verify on every API request. Never cache the owner in the browser.
- **Public demo:** unauthenticated use, with no `/api` calls on load. Load Clerk and the cloud panel lazily.
- **Provider outage:** with `jwtKey`, already-issued tokens verify without a network call. Sign-in and refresh fail. A D1 outage returns 503 and shows a local-only status. Local editing is never blocked.
- **D1 / KV / R2:** D1. All three proposals agree.
- **JSON vs normalization:** store the client's `serializeWorkspace` string verbatim, after `parseWorkspace` passes. Do not re-serialize. Unknown keys survive.
- **Incomplete drafts:** accept the drafts. Never gate saves on compilation. Cover this with a fixture test.
- **Limits:** workspace at most 1,000,000 UTF-8 bytes. Request body at most 1,050,000 bytes, counted while streaming. Return 413 before any D1 call. Raise the cap only after measuring representative workspaces. Hydrogen's 1.5 MB fits the row limit but leaves little margin.
- **Owner auth:** only the verified stable subject (Clerk `userId`). Every query filters on it. Return 404 for missing and other-owner rows alike. Never accept an owner from the body or query.
- **Local vs cloud first:** local is the source of truth. Cloud is explicit. Rename the existing button to "Save on this device."
- **Explicit vs auto:** explicit cloud save, never autosave to cloud.
- **Switch, unsaved, and network failures:** tag each async request with a sequence token and drop responses from superseded projects or auth states. Sign-out clears cloud state but never local state. A network failure keeps the draft dirty and shows "not saved to cloud." Do not auto-retry in a loop. Use `beforeunload` when local differs from the last cloud version.
- **409 choices:** keep local (the default). Save a local copy as a new cloud project, keeping `document.id`. Load the remote only after a local JSON download or copy.
- **Deadline:** Hydrogen states Nov 14, 20:00 Europe/Vilnius. I have not verified that. Set a cut line tonight. My 8–10 hour estimate and Luna's 1–2 days are both optimistic.
- **Dependencies and secrets:** the user must create the Clerk app, provide keys, and create the D1 IDs. Set `CLERK_JWT_KEY` with `wrangler secret put`. `VITE_CLERK_PUBLISHABLE_KEY` is public and may use a Vite variable. Never put a secret in a `VITE_` variable.
- **Production-data-safe testing:** Vitest with a fake verifier and local D1 migrations. Playwright runs without cloud. CI has no production bindings. Preview uses a dedicated DB or cloud disabled. Production migrations run only in a gated deploy step.

### Precise contract

- **Routes:** `GET /api/health` (public). `GET /api/projects`. `POST /api/projects`. `GET /api/projects/:id`. `PUT /api/projects/:id`. Unknown `/api` and `/api/*` return JSON 404. Unsupported methods return 405 with `Allow`.
- **Config:** `assets.run_worker_first: ["/api", "/api/*"]`, `assets.binding: "ASSETS"`, `main` set to the Worker. Top-level config has no production database ID. `env.production` holds the production D1. `previews.d1_databases` points to a dedicated preview DB, or cloud is disabled in previews.
- **Request:** `{ expectedVersion, workspaceJson: string }`. The server parses the string, runs `parseWorkspace` on the parsed object, and stores the exact string. `workspaceJson` is the field name, so the stored bytes match what the client validated.
- **Response:** create and update return `{ id, version, updatedAt, title }`. `GET /:id` adds `workspaceJson`. The list omits `workspaceJson`.
- **Title:** `parsed.name` trimmed, with a fallback of "Untitled." Verify that the field exists first.
- **Errors:** `{ error: { code } }`. 400 `invalid_json` or `invalid_workspace`. 401 `unauthenticated` (API only). 404 `not_found`. 409 `version_conflict` with `currentVersion`. 413 `too_large`. 503 `unavailable` or `unconfigured`.
- **Schema:** `projects(id TEXT PK, owner_id TEXT, title TEXT, version INTEGER, workspace_json TEXT, created_at, updated_at)`, with an index on `(owner_id, updated_at)`. `projects.id` is a server-generated UUID. `document.id` is never changed.
- **Update:** `UPDATE … WHERE id=? AND owner_id=? AND version=?`. Zero changes means look up the row, then return 404 or 409.
- **Client state:** a save-state union (`clean`, `dirty`, `saving`, `saved vN`, `conflict`, `error`). Keep envelope metadata outside the unchanged v1 workspace.

### Uncertain (verify before relying on it)

- Whether `authenticateRequest` with `jwtKey` runs with no `secretKey` on Workers.
- Whether the D1 100 KB statement limit applies to bound parameters.
- Whether `wrangler deploy --dry-run` needs a real `database_id`.
- Whether `parseWorkspace` strips or rejects unknown keys.
- Whether `source.openedFromFile` lives in the stored document. If it does, cloud open must not wrongly set it to false.
- Clerk development-instance constraints on `workers.dev`.
- The deadline itself.

</details>

<details>
<summary>Round 2 — gemini-4-hydrogen — Cross-examination</summary>

Source: [Cloud backend R2 — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A65963e03-691d-4c3e-8f6e-5aff38c9e6e3)

## Round 2 Cross-Examination & Contract Resolution (`gemini-4-hydrogen`)

### 1. Critique of Competing Proposals

#### Weaknesses in `gpt-6-luna`
1. **Incomplete `/api` routing & missing concrete byte/stream limits:** Proposes `run_worker_first: ["/api/*"]` without `"/api"`, leaving bare `/api` vulnerable to SPA HTML fallback. It also defers the D1 size limit to post-measurement guesswork instead of specifying a concrete cap and streamed byte counting (relying on `Content-Length` alone is spoofable/absent on chunked requests).
2. **`verifyToken` over `authenticateRequest`:** Recommends `verifyToken` instead of Clerk's `authenticateRequest`, missing built-in request/cookie/header extraction and `authorizedParties` enforcement.
3. **Broken branch-preview isolation:** Relies on "named Wrangler environments and distinct database IDs" to isolate D1. Because [wrangler.jsonc](file:///Users/dominykas/Development/unfair-wknd-26/wrangler.jsonc#L8) has `"previews": {}`, `wrangler preview` branch builds inherit top-level bindings unless `previews.d1_databases` is explicitly overridden or cloud bindings are omitted from preview.
4. **Missing race & dev-proxy mechanics:** Omits stale async save/open/auth-switch race guards and concrete Vite-to-Worker local dev wiring.

#### Weaknesses in `claude-haiku-5-5`
1. **Cloudflare Access lifecycle mismatch:** While Access *can* protect a `workers.dev` hostname/path, it is built for Zero Trust team/OTP gates, not self-serve public user accounts. Path-scoping Access to `/api/projects*` causes unauthenticated `fetch()` calls to receive a `302` HTML login redirect rather than clean JSON `401`s unless configured with non-standard bypasses, and full-page redirects disrupt in-memory SPA state.
2. **Mutable `email` as owner key:** Stores JWT `email` as `owner` in D1. Emails are mutable and can be reassigned; authorization must key off an immutable subject (`sub` / Clerk `userId`).
3. **Unsafe `1,900,000`-byte cap, `run_worker_first: true`, and `409` overwrite:**
   - `1,900,000` bytes of `workspace_json` leaves insufficient margin under D1's `2,000,000`-byte row/string limit once `id`, `owner_id`, `name`, and timestamps are included.
   - `run_worker_first: true` routes *every* static asset and HTML request through the Worker unnecessarily when `["/api", "/api/*"]` is officially supported.
   - Offering a `409` "Overwrite" button violates safe conflict handling.
4. **Env-toggle auth backdoor risk:** Proposing `DEV_AUTH_EMAIL` inside the Worker risks an authentication bypass if ever misconfigured in production/preview; test auth shims must stay outside the deploy entrypoint.

---

### 2. Evidence Corrections & Exposed Uncertainties
* **Self-corrections to `hydrogen` Round 1:**
  1. **`run_worker_first`:** Official Cloudflare SPA docs support array routing (overriding navigation bypass) and require both `"/api"` and `"/api/*"`—my Round 1 omitted `"/api"`.
  2. **`authorizedParties`:** My Round 1 risk note suggested `*.workers.dev`; wildcards are unsafe/unsupported. `authorizedParties` must list exact origin strings only.
  3. **Payload limits:** Lowering my `1,500,000`-byte cap to **`1,000,000` bytes** (workspace) / **`1,050,000` bytes** (total request) with **streamed UTF-8 byte counting** gives safe headroom under D1's `2,000,000`-byte row limit and prevents `Content-Length` bypasses.
  4. **Preview isolation & `409` UX:** Add explicit `previews` isolation in [wrangler.jsonc](file:///Users/dominykas/Development/unfair-wknd-26/wrangler.jsonc#L8), and drop `409` force-overwrite in favor of safe choices only.
* **Exposed uncertainties:** `haiku` flagged `run_worker_first` wildcards, `@clerk/backend` Workers compatibility, `jose` APIs, and Access pricing as unverified. Official Cloudflare SPA docs and Clerk's edge deployment guide confirm `run_worker_first: ["/api", "/api/*"]` and `@clerk/backend` (`authenticateRequest` with `jwtKey` and `authorizedParties`) on Workers; Access pricing and `jose` remain unnecessary once Clerk is chosen.

---

### 3. Category-by-Category Debate

#### A. Auth: Managed vs. Custom, Clerk vs. Access, Resilience
* **Managed vs. Custom:** Custom auth (passwords, reset flows, session rotation, abuse controls) is an unacceptable deadline and security risk.
* **Clerk vs. Access:** Clerk (`@clerk/react` + `@clerk/backend`) provides self-serve public accounts, clean bearer-token `401` JSON responses, and in-app sign-in without full-page redirects.
* **Every-request identity & quickest safe setup:** Every `/api/projects*` request calls `createClerkClient({ secretKey, publishableKey }).authenticateRequest(request, { jwtKey, authorizedParties })`. Passing `CLERK_JWT_KEY` verifies signatures locally on the Worker with zero per-request JWKS latency or runtime dependency on Clerk's API.
* **Public demo & provider outage:** Guard `<ClerkProvider>` in [src/main.tsx](file:///Users/dominykas/Development/unfair-wknd-26/src/main.tsx) on `VITE_CLERK_PUBLISHABLE_KEY` and wrap cloud UI in an error/availability boundary. Public routes (`/`, `/landing`, local `BuilderExperience`) make zero `/api` or Clerk calls on load; if Clerk or `/api` is unreachable, local editing, simulation, and JSON import/export continue unaffected.

#### B. Storage: D1 vs. KV/R2, Lossless JSON, Incomplete Drafts, Limits & Owner Auth
* **D1 vs. KV/R2:** D1 provides strongly consistent owner-indexed listing and atomic conditional `UPDATE`s. KV is eventually consistent (breaks immediate list-after-save and CAS); R2 adds multi-step consistency overhead for `<1 MB` payloads.
* **Lossless JSON vs. Normalization:** Store one `workspace_json` column per project row inside an **outer cloud envelope** (`id`, `owner_id`, `name`, `version`, `created_at`, `updated_at`). Keep `BuilderWorkspaceV1` unchanged inside `workspace_json`—preserving `document.id` (critical because [computeNetworkKey](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/builder/compiler.ts#L53-L59) hashes it into `validatedNetworkKey`), `document.revision`, `source.openedFromFile`, and all scenario data.
* **Incomplete drafts & limits:** Validate with `parseWorkspace` ([src/lib/builder/schema.ts](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/builder/schema.ts#L183-L226)) only; never gate saves on `compileGraph`. Enforce `1,000,000` UTF-8 bytes max for `workspace_json` and `1,050,000` bytes max for the HTTP request body via streamed chunk counting (aborting with `413` as soon as the limit is exceeded).
* **Owner auth:** Extract `owner_id` solely from verified `auth.userId` (`sub`). Every `SELECT`/`UPDATE`/`DELETE` filters `WHERE id = ? AND owner_id = ?`, returning `404` for both missing and cross-owner IDs.

#### C. UX: Local-First, Explicit Cloud Actions, Failures & Races
* **Local-first & explicit cloud:** Keep the 500 ms `localStorage` autosave in [BuilderExperience.tsx](file:///Users/dominykas/Development/unfair-wknd-26/src/components/builder/BuilderExperience.tsx) untouched. Cloud actions (**Save to cloud**, **Save as copy**, **My projects**, **Open**) are strictly explicit—never mirror autosaves to D1. Deep links (`/builder?project=...`) are optional; **My projects** works across devices without them.
* **Conflict (`409`) & dirty-state safety:** On `409` (CAS `meta.changes === 0` where row exists for owner), offer only safe choices:
  1. **Keep local** (continue editing locally; cloud stays at remote version),
  2. **Save as copy** (`POST /api/projects` creates a new cloud project), or
  3. **Load remote after backup** (require explicit confirmation / local JSON export before replacing dirty local work). No blind force-overwrite.
* **Async & auth-switch race protection:** Track a monotonic `cloudOpSeq` + `AbortController` per cloud save/open and bind the active `cloudProjectId`/`cloudVersion` to the authenticated `userId`. If the user signs out, switches accounts, or edits/opens another workspace mid-flight, ignore stale responses and clear active cloud binding.

#### D. Deadline, Dependencies/Secrets & Production-Data-Safe Testing
* **Dependencies & secrets:** Add `@clerk/react`, `@clerk/backend`, and `@cloudflare/vite-plugin` (or Vite proxy to `wrangler dev`). Store `CLERK_SECRET_KEY` and `CLERK_JWT_KEY` in Worker secrets (`.dev.vars` locally); keep `VITE_CLERK_PUBLISHABLE_KEY` optional at build time so CI `deploy:check` and E2E pass without secrets.
* **Production-data-safe testing & previews:**
  * Configure `previews` in [wrangler.jsonc](file:///Users/dominykas/Development/unfair-wknd-26/wrangler.jsonc#L8) with a separate `previews.d1_databases` (or omit D1 in preview and return `503` on `/api/projects*` so public preview cloud is disabled rather than touching prod D1).
  * Inject a `verifyAuth` dependency into the Worker factory (`createApp({ verifyAuth })`). Vitest exercises routes against Miniflare/mock D1 and a test verifier kept strictly in `tests/`—zero `DEV_AUTH` env toggles in the deploy entry.

---

### 4. Proposed Contract Resolution

1. **Routing & Worker (`wrangler.jsonc`):**
   - `main: "src/worker/index.ts"`, `assets: { directory: "./dist", not_found_handling: "single-page-application", binding: "ASSETS", run_worker_first: ["/api", "/api/*"] }`.
   - Worker handles `/api` and `/api/*` exclusively; unknown `/api/*` returns JSON `404`; unsupported methods return `405` with `Allow`. `GET /api/health` is unauthenticated (`{ ok: true }`).
   - `previews` either binds an isolated preview D1 or disables cloud bindings (`503` on `/api/projects*`).

2. **Auth (`@clerk/react` + `@clerk/backend`):**
   - Client sends `Authorization: Bearer <token>`.
   - Worker runs `authenticateRequest(request, { jwtKey: env.CLERK_JWT_KEY, authorizedParties })` with exact configured origins. Missing/invalid token → `401` JSON; missing server config/DB → `503` JSON.

3. **D1 Schema & Endpoints:**
   - Table `projects (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, workspace_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)` with index `(owner_id, updated_at DESC)`.
   - `GET /api/projects` → `{ projects: [{ id, name, version, updatedAt }] }`.
   - `POST /api/projects` → `{ workspace, name? }` → `201 { id, name, version: 1, updatedAt }`.
   - `GET /api/projects/:id` → `200 { id, name, version, updatedAt, workspace }`.
   - `PUT /api/projects/:id` → `{ expectedVersion, workspace, name? }` → CAS `WHERE id=? AND owner_id=? AND version=?` → `200 { id, name, version: expectedVersion+1, updatedAt }`, `404` if missing/other owner, `409 { error, currentVersion, updatedAt }` on version mismatch.
   - Streamed request limit `1,050,000` bytes; `workspace_json` limit `1,000,000` UTF-8 bytes; `parseWorkspace` structural validation only.

4. **Client Contract:**
   - Local 500 ms autosave and [storage.ts](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/builder/storage.ts) (`2 MiB` local cap) remain unchanged; cloud actions check the `1,000,000`-byte cap upfront.
   - Outer cloud state (`cloudProjectId`, `cloudVersion`, `cloudOwnerId`) stays outside `BuilderWorkspaceV1`; `document.id`, `revision`, `source.openedFromFile`, and scenarios round-trip verbatim.
   - Monotonic sequence + `AbortController` guard all save/open/auth-switch transitions; `409` offers only **Keep local**, **Save as copy**, or **Load remote** (after local backup/confirm).

</details>

<details>
<summary>Round 3 — gpt-6-luna — Revised proposal</summary>

Source: [Cloud backend R3 — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A5bcdf5e7-75f3-4100-807d-886947b1080f)

# Round 3 — final revised proposal

## Recommendation: Better Auth, with GitHub OAuth

Given the confirmed constraint—no owned domain or DNS, only `https://domino-os.tasty-kiwi.workers.dev`—I recommend **Better Auth with GitHub OAuth and D1-backed sessions** for this deadline.

**Clerk should be rejected for this deployment.** Its official production guidance requires a domain the project owns and can configure in DNS. A Clerk development instance is not a production substitute. **Auth0 remains a viable managed alternative**: its Universal Login can use an Auth0 tenant domain and an exact `workers.dev` callback, so it does not require an owned domain. But it adds a tenant, SPA/API configuration, bearer-token lifecycle, and JWT validation in the Worker. Better Auth’s supported direct D1 adapter and same-origin sessions are a better fit for this small app, if a short implementation spike confirms the installed Workers runtime and callback flow work as documented.

Better Auth is a self-hosted session framework, not a managed identity service or hand-built password system. Its current documentation says direct D1 support needs no Drizzle adapter, available since version 1.5. Use the native Cloudflare D1 binding, with `better-auth/react` in the UI. Do not add an unofficial Cloudflare wrapper. GitHub is the suggested OAuth provider because it is a straightforward hackathon path; **the user has not selected a provider or confirmed credentials**. Before coding the auth integration, require a GitHub OAuth app with the exact callback `https://domino-os.tasty-kiwi.workers.dev/api/auth/callback/github`, `client_id` and `client_secret` in Worker secrets, and separate local credentials if local OAuth testing is required. Request only `user:email`; no repository permissions. If Google credentials are already available, Google is reasonable, but do not assume that.

Keep D1 as the only persistence system. Use Better Auth’s four generated tables—`user`, `session`, `account`, `verification`—plus `projects`. Generate schema with the pinned Better Auth CLI, inspect the output, and check it into Wrangler migrations. **Schema generation and runtime compatibility still need confirmation during implementation**; never run migrations from a request handler. Use host-only `Secure`, `HttpOnly`, `SameSite=Lax` cookies. Disable cookie caching and avoid KV or secondary session caches so a revoked session stops authenticating promptly. Retain Better Auth’s Origin/CSRF checks; for project mutations also require same-origin `Origin` and `application/json`. Verify a session with `auth.api.getSession({ headers: request.headers })` on every protected API request. Take project ownership exclusively from verified `session.user.id`.

Auth0 is the fallback if Better Auth’s D1/Workers spike fails. Its hosted tenant domain avoids the owned-domain requirement; the SPA would obtain an RS256 API access token, which the Worker validates against a fixed issuer and audience using `jose`. This is a credible managed option, but adds token renewal and browser/API coordination. Third-party-cookie renewal behavior on the actual browser and host needs verification.

## API and data contract

Use the Worker for `/api` and `/api/*`, configured with `assets.run_worker_first: ["/api", "/api/*"]` and an `ASSETS` binding. The Worker exclusively handles those paths: unknown API routes return JSON `404`; unsupported methods return `405` with `Allow`. Other requests go to static assets and keep SPA fallback. Use `/api/auth/*` for Better Auth’s handler.

Projects use a D1 table with a generated cloud ID, `owner_id`, `name`, `workspace_json`, integer `version`, and timestamps, indexed by `(owner_id, updated_at DESC)`. Cloud ID remains separate from `workspace.document.id`; never rewrite the document ID, revision, `source.openedFromFile`, scenario state, or `validatedNetworkKey`.

Contract:

- `GET /api/projects` returns metadata only: `{ projects: [{ id, name, version, updatedAt }] }`.
- `POST /api/projects` accepts `{ name, workspace, expectedVersion? }` and returns the created metadata with version 1.
- `GET /api/projects/:id` returns metadata and `workspace`.
- `PUT /api/projects/:id` requires `{ name, workspace, expectedVersion }`; update with `WHERE id=? AND owner_id=? AND version=?`. Return `409` on a version mismatch, `404` for missing or other-owner IDs.
- All reads and writes filter on the verified session user ID. Never accept an owner from the client.

The workspace is the existing v1 canonical JSON object, **not** a new promise of unknown-key forward compatibility. Use the current serializer and `parseWorkspace`; the existing parser may strip unknown keys, so preserve supported v1 fields and document that boundary. Reject unsupported schema versions. Do structural validation only: incomplete drafts remain saveable, with no compile or scenario revalidation. Keep cloud metadata outside the workspace. Enforce a **1,000,000-byte canonical workspace cap** and **1,050,000-byte total request cap**, counting streamed UTF-8 bytes and returning `413` before any D1 write. Do not conflate either cap with the existing 2 MiB local limit.

## Local-first UI and recovery

Keep the guest storage key and existing local autosave untouched. Cloud autosave uses the existing 500 ms saver through a storage facade remapped to a separate slot per verified owner and cloud project. Never automatically load one user’s cloud draft into guest storage or another user’s workspace.

Cloud writes remain explicit. Provide **Save to cloud**, **My Projects**, **Open**, and **Save as copy**. Track dirty state across all workspace changes, not only document revision. Warn before opening over dirty work, even when a local autosave exists. Validate fetched projects before replacing the current workspace, then check an edit-generation counter so edits made during the fetch are not overwritten.

Use versioned writes. On `409`, offer **Keep local**, **Save as copy**, or **Load remote after backup**; no blind overwrite. Guard save/open responses with operation generations and owner identity. On sign-out, flush the owner-scoped draft, clear cloud bindings, reject stale completions, and restore the guest workspace. Refresh may detach the cloud ID and expose recovery through My Projects; it must not silently replace the current draft.

## Development, isolation, and verification

For lowest setup risk, first try Vite on `:5173` proxying `/api` to `wrangler dev --local :8787`. If proxying or OAuth host/origin handling fails, use an integrated built-assets Wrangler dev path. Use a named staging D1 for auth and project flows. Explicitly disable cloud auth and D1 in previews, or bind a dedicated preview D1; previews must never inherit production D1. Keep the production Worker’s existing name and top-level deploy path to avoid accidental renaming or bypassing current Builds.

Before calling the slice complete, strictly verify:

- Authenticated sign-in, same-origin requests, logout/revocation, and account switching on the actual `workers.dev` host.
- Missing/invalid sessions fail closed; project reads and writes cannot cross owners.
- Auth routes, bare `/api`, unknown routes, methods, JSON errors, streamed limits, and `413` before D1 writes.
- Generated migrations apply locally and to isolated staging; max-size fixtures save and load.
- Incomplete v1 drafts round-trip with identity, revision, source metadata, and scenario state preserved.
- CAS conflicts, local backup recovery, stale request responses, sign-out during requests, and guest isolation.
- Public demo and local editing still work without auth credentials; preview config cannot bind production data.
- Existing build, tests, browser flow, and deploy dry run still pass.

Passing these checks is not proof of live OAuth or production deployment. Those require staging credentials and an observed staging flow; production writes and deploy should be a separate decision.

## Criticism disposition and schedule

**Accepted:** the `/api` plus `/api/*` routing, streamed byte limits, CAS recovery choices, request-generation guards, preview isolation, and distinction between cloud ID and workspace document ID. **Rejected:** making Clerk the recommendation despite the newly confirmed domain constraint, and treating Access as a public self-serve account solution. Auth0 is retained as a fallback, not assumed inferior in every setup.

Main unresolved risks are Better Auth’s pinned-version D1 schema and Workers runtime compatibility, OAuth credential availability, cookie/CSRF behavior on the actual host, and the cost of six total D1 tables plus account setup under the deadline.

Estimate: **3 developers, about 22–32 person-hours total**, with realistic elapsed time of **10–16 focused hours** if work proceeds in parallel after the auth spike and credentials are ready. The remaining window to **Nov 14, 20:00 Europe/Vilnius** is viable only if GitHub credentials and staging D1 are immediately available, Better Auth passes its compatibility spike early, and scope stays to auth, project CRUD/CAS, safe recovery, and the tests above. If the spike or OAuth setup stalls, ship the public demo with cloud disabled rather than switching auth systems late.

</details>

<details>
<summary>Round 3 — claude-haiku-5-5 — Revised proposal</summary>

Source: [Cloud backend R3 — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Ae218f18a-8f19-460e-9589-a2b5f959c78a)

## Round 3 final proposal: auth, storage, and cut-down P0

**Bottom line:** Use **Better Auth with GitHub OAuth only**, native D1 via `database: env.DB`, and Wrangler migrations. Clerk is out under the no-owned-domain constraint. Cloud save is viable only as a narrow P0 with hard gates. Full scope by Nov 14 20:00 Vilnius is not realistic.

### 1. What I verified and what I did not

**Verified in official docs (this round):**
- Better Auth 1.5 release note: D1 binding passed directly (`database: env.DB`), "no custom adapter setup required." D1 has **no interactive transactions**; Better Auth uses `batch()`. Our CAS is a single `UPDATE`, so it is unaffected.
- The D1 concepts page says D1 can only be queried through a Worker, so the CLI cannot reach it directly. Schema comes from `generate` output, applied through Wrangler migrations.
- Cloudflare guide: Node compatibility is default from compatibility date 2026-08-04. Repo `wrangler.jsonc` is `2026-11-12`, so no `nodejs_compat` flag is needed. Do not use a Workers KV secondary store. Set `advanced.ipAddress.ipAddressHeaders: ["cf-connecting-ip"]`.
- Session docs: with `cookieCache` enabled, revoked sessions can stay valid until the cache expires. Disable it for immediate revocation.
- `src/lib/builder/schema.ts` uses `z.object` defaults, so `parseWorkspace` strips unknown keys. `source.openedFromFile` is inside the v1 workspace, so it is stored, not dropped.

**Not verified (must check at install):**
- Whether `npx auth@<pinned> generate` emits D1-compatible SQL without an `--adapter` flag. The `migrate` command is documented for the built-in Kysely adapter only.
- Secure / HttpOnly / SameSite cookie defaults and built-in CSRF or Origin checks. The session page covers neither, so read the installed source and assert the real `Set-Cookie` header in a test.
- Auth0 token-renewal and third-party-cookie behavior. The fetched page did not cover it.
- `jose` on Workers (not re-checked this round).
- Whether `previews.d1_databases: []` removes the inherited binding (check with `wrangler deploy --dry-run`).
- Whether the D1 100 KB SQL statement limit applies to bound parameters.

### 2. Auth comparison under no owned domain

| Option | Owned domain / DNS | Fit | Main cost |
|---|---|---|---|
| Clerk | Production requires owned domain plus DNS. Dev instance is not production. | **Rejected** | Cannot ship a production auth path on workers.dev. |
| Cloudflare Access | Works on workers.dev | Rejected | Redirect to login before Worker; fetch gets 302; email/allowlist model. |
| **Better Auth (self-hosted, D1)** | Works with workers.dev callback | **Preferred** | Four auth tables in our D1; we own cookie/CSRF config; newer D1 path. |
| Auth0 (managed) | Works on tenant domain; no custom domain needed | Credible fallback | Tenant, API audience, SPA app, callback/logout URLs; browser token lifecycle; JWT revocation lag up to token TTL; user accounts held at a third party. |

**Why Better Auth over Auth0:** no browser token lifecycle, same-origin HttpOnly cookies, DB-backed session revocation on every request, and one external app (GitHub). Its costs are that D1 becomes a single failure domain for sign-in as well as projects, and that the D1 path is new. Auth0's advantages are mature token handling and separate auth failure isolation. I did not verify Auth0's current renewal details, so I am not choosing it on those grounds.

**Rule:** if Better Auth's install, `generate`, and local GitHub login are not green within about 3 hours, ship cloud disabled. Do not start an Auth0 switch at that point. The user should confirm this rule.

**Provider:** I recommend **GitHub**. It needs one OAuth app per environment and a default minimal scope. Google is only worth it if OAuth credentials and the consent screen already exist, since external-user limits apply. **The user has not chosen a provider.** Demo judges need GitHub accounts, so keep the local demo path.

### 3. P0 architecture and contract

**Auth**
- Handle `/api/auth/*` with `auth.handler`. Protected routes call `auth.api.getSession({ headers })` on every request. `owner_id = session.user.id`. Never accept an owner from the body, query, or email claim.
- Config: `baseURL`, `trustedOrigins` (exact origins only), `secret` from a Worker secret, and GitHub `clientId` and `clientSecret` from secrets. Host-only cookies on the workers.dev host (and on `localhost` in dev).
- `cookieCache` off. No KV, no secondary storage.
- Tables: Better Auth's `user`, `session`, `account`, `verification`, plus `projects`. Generated SQL is committed as a Wrangler migration, reviewed by hand before merge.
- Add an explicit Origin check and `Content-Type: application/json` requirement on project mutations, in addition to any library checks.

**Routing**
- `main` = Worker. `assets.run_worker_first: ["/api", "/api/*"]`. Non-API paths go to `env.ASSETS`.
- Unknown `/api` paths return JSON 404. Unsupported methods return 405 with `Allow`. Errors are always `{ error: { code } }`.

**Schema (P0)**
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,                       -- server UUID, never document.id
  owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                        -- separate metadata, 1..120 chars
  workspace_json TEXT NOT NULL,              -- canonical v1, server-serialized
  version INTEGER NOT NULL CHECK (version >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX projects_owner_updated ON projects(owner_id, updated_at DESC);
```

**API (P0)**
- `GET /api/health` → `{ ok: true }`, no DB.
- `GET /api/me` → `{ user: { id, name } }` or 401.
- `GET /api/projects` → `{ projects: [{ id, name, version, updatedAt }] }`. Omits workspace.
- `POST /api/projects` body `{ name, workspace }` → 201 `{ id, name, version: 1, updatedAt }`.
- `GET /api/projects/:id` → `{ id, name, version, updatedAt, workspace }`.
- `PUT /api/projects/:id` body `{ expectedVersion, name, workspace }`:
  - `UPDATE … WHERE id=? AND owner_id=? AND version=?`.
  - If 0 rows changed: `SELECT version WHERE id=? AND owner_id=?`. No row → 404. Row → 409 with `currentVersion`.

**Limits and canonicalization**
- Stream-count the request body. Abort with 413 at 1,050,000 bytes before JSON parse. `Content-Length` is only a hint.
- Parse with `parseWorkspace`, then serialize with the same serializer the client uses. Reject 413 if canonical UTF-8 exceeds 1,000,000 bytes. Reject 400 if `parseWorkspace` fails.
- Store the canonical string. Do not promise forward compatibility for unknown keys.
- Incomplete drafts are accepted. No compile or scenario revalidation on save.

**Client**
- Keep the original guest storage key untouched. Cloud drafts go in a separate per-owner, per-project local slot using the same 500 ms saver. Cloud binding (`projectId`, `version`, `ownerId`) lives outside the workspace.
- "Dirty" means canonical serialization differs from the last synced canonical hash. `document.revision` alone is not enough.
- Every save and open carries a sequence token and an `AbortController`. Responses from a superseded token are dropped.
- Sign-out: flush the owner-scoped draft, restore the guest workspace, clear bindings, and reject in-flight completions.
- Open: validate with `parseWorkspace` before replacing anything. Recheck edit generation before applying. If local is dirty, warn and offer save-copy first.
- 409 offers only **Keep local** (default) and **Save as copy** (POST). "Load remote" is P1, behind a required local JSON download.
- Load the cloud UI lazily so the public demo bundle does not pull in Better Auth.

**Environments**
- Dev: Vite `server.proxy` `/api` → `wrangler dev :8787`. Use a separate local GitHub OAuth app with callback `http://localhost:5173/api/auth/callback/github`. Browser verification required, since Secure cookies on `http://localhost` vary by browser. Fallback: integrated `wrangler` on :8787 for the OAuth slice.
- Top-level production binding keeps worker name `domino-os`; do not move production into `env.production`.
- `previews`: set `d1_databases: []` explicitly, and leave `BETTER_AUTH_SECRET` unset in previews. Expected result: cloud 503 (unconfigured), local demo unaffected.
- Production GitHub app callback: `https://domino-os.tasty-kiwi.workers.dev/api/auth/callback/github`.

### 4. Criticism: accepted and rejected

**Accepted**
- Clerk rejected under the new constraint.
- Stable subject as the owner key, not email.
- Bare `/api` plus `/api/*` in the routing array; `run_worker_first: true` rejected.
- Streamed byte counting with a 1,050,000-byte request cap and a 1,000,000-byte canonical cap.
- Preview isolation.
- Race guards.
- No `DEV_AUTH_EMAIL` or any env-gated auth bypass.
- No `@cloudflare/vite-plugin` before the deadline.
- Stateless sessions rejected for revocation.
- Keep local / save copy as the only P0 conflict actions.
- Object wire format instead of double-encoded `workspaceJson`.

**Rejected**
- R2's verbatim string storage: it double-encodes and inflates the wire size. Canonical server-side serialization keeps every known v1 field.
- Deriving the project name from `parsed.name`: the name is separate metadata.
- Load-remote-with-backup in P0: no time for the backup UI.
- Access as a fallback: it fails the public JSON-401 requirement.

### 5. Strict tests

- Round-trip: `serialize(parse(serialize(w))) === serialize(w)` for incomplete drafts (blank name, unconnected nodes).
- Limits: exact 1,000,000 accepted, 1,000,001 rejected (413). A 1,050,001-byte streamed body returns 413 before any D1 call. Multi-byte UTF-8 counted by bytes.
- Auth: no cookie, forged cookie → 401 JSON. Revoked session (row deleted) → 401 on next request. Cross-owner GET/PUT → 404 with the same body as a missing ID. Cross-site Origin mutation → 403. Non-JSON content type → 415.
- CAS: two concurrent PUTs with the same `expectedVersion` → exactly one 200, one 409. A cross-owner PUT with a stale version → 404, not 409.
- Routing: `/api`, `/api/`, `/api/nope`, `/api/projects/x/y`, OPTIONS, HEAD → JSON or defined. `/landing` and assets still served by ASSETS.
- E2E: public demo makes zero `/api` requests on load; cloud 503 leaves local editing working.
- Client: sign-out mid-save drops the response; account switch mid-open is ignored; dirty open warns; 409 offers keep and save-copy only.
- Staging: migration applied to a staging D1 with `wrangler d1 migrations apply --remote`. Production migration only in a gated deploy step, never in tests.
- Dry run confirms `schema.ts` bundles without the `@` alias (the `@/lib/types` import must resolve).

### 6. Unresolved risks

1. The Better Auth D1 path and generated SQL are unverified until installed (Gate A).
2. Cookie flags and CSRF defaults are unverified; we own the Origin check.
3. D1 is a single failure domain: an outage stops sign-in and cloud. Local demo must keep working.
4. The 100 KB SQL statement limit may or may not apply to bound parameters. A 1 MB insert test on staging decides it.
5. Secure cookies on `http://localhost` may break in some browsers.
6. Judges need GitHub accounts, and OAuth app setup is user-dependent.
7. `previews: []` semantics and whether `wrangler deploy --dry-run` needs a real `database_id`.

### 7. Credential gate (user action)

- Create two GitHub OAuth apps: local and production callbacks as above. Provide the client ID and secret through the secret tool, never in `VITE_` variables.
- Create or name the production D1 and staging D1 database IDs.
- Provide `BETTER_AUTH_SECRET` (generated, stored as a Wrangler secret).
- Confirm GitHub as the provider, or name Google and its existing credentials.

Do not deploy with production secrets until the user supplies them.

### 8. Effort and timing (3 developers)

| Work | Person-hours |
|---|---|
| Auth spike, tables, GitHub app, cookies (Gate A) | 6–8 |
| Worker router, D1 CAS, limits, serializer bundling | 8–10 |
| Client save/open/list/conflict, guards, storage facade | 14–18 |
| Dev proxy, preview and prod config, migrations, deploy, smoke | 4–6 |
| Unit, integration, E2E tests | 6–8 |
| **Total** | **38–50** |

Elapsed: about 16–20 hours with three developers in parallel, assuming no blockers. Deadline is about one day away, and the current local time is unknown to me. Any blocker, especially a failed Gate A or missing credentials, moves cloud out of scope.

**Gates and cut line:**
- Gate A (about T+3h): install pinned Better Auth, generate and apply SQL locally, GitHub login round-trip, authenticated `/api/me`.
- Gate B (about T+10h): staging CAS and routing tests green.
- Cut line: Nov 14, 16:00 Vilnius. Deploy freeze. If production smoke is not green, ship with cloud disabled (503) and the local demo unchanged.

**Honest verdict:** a P0 with GitHub auth, create, list, open, explicit CAS save, and save-copy is viable if all three developers start now and Gate A passes. Full UX, including load-remote and rename, is not viable. Do not claim live auth proof until a real staging login succeeds.

</details>

<details>
<summary>Round 3 — gemini-4-hydrogen — Revised proposal</summary>

Source: [Cloud backend R3 — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A0147d486-b43b-4dab-88db-5862d3e2d2ba)

## Round 3 Final Revised Proposal (`gemini-4-hydrogen`)

### 1. Explicit Acceptance & Rejection of Round 2 Criticisms

* **Accepted:**
  * **Clerk is disqualified for P0:** Under the confirmed constraint (no owned domain/DNS, only `https://domino-os.tasty-kiwi.workers.dev`), Clerk production requires an owned domain + DNS, and development (`sk_test`) keys are unsuitable for production. I withdraw my R1/R2 Clerk recommendation.
  * **Routing & preview isolation:** `run_worker_first` must be `["/api", "/api/*"]` (omitting `"/api"` in R1 was a bug). Top-level `wrangler.jsonc` ([wrangler.jsonc](file:///Users/dominykas/Development/unfair-wknd-26/wrangler.jsonc)) must stay production (`name: "domino-os"`) so existing Builds do not break, while `previews.d1_databases: []` + fail-closed preview vars must prevent branch previews from inheriting production D1.
  * **Payload limits, object shape & forward compatibility:** Lowering my R1 `1.5 MB` cap to `1,000,000` canonical bytes / `1,050,000` streamed HTTP bytes fixes the D1 `2,000,000`-byte row margin. I reject Haiku’s double-encoded `workspaceJson` string (escaping inflates wire size past `1,050,000` bytes) and reject claiming unknown-key forward compatibility (`parseWorkspace` in [schema.ts:183-226](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/builder/schema.ts#L183-L226) uses Zod’s default `.strip()`).
  * **Unsafe `409` overwrite & race guards:** Dropped blind force-overwrite; added `cloudOpSeq` + `AbortController`, accurate dirty tracking across all workspace fields, and owner/project-scoped local recovery.
  * **Dev setup:** Dropped `@cloudflare/vite-plugin` before deadline; keep Vite `:5173` proxying `/api` to `wrangler dev --local :8787`.
* **Rejected:**
  * **Haiku’s `parsed.name` assumption:** `BuilderWorkspaceV1` uses `document.name`, not top-level `name`; project `name` must be explicit request metadata (`1..120` chars).
  * **Haiku’s Cloudflare Access fallback:** Access redirects unauthenticated `fetch()` calls with `302` HTML and requires OTP/allowlist friction unsuitable for a public demo.

---

### 2. Auth Architecture Decision: Better Auth (OAuth-Only, Native D1) vs. Auth0

With no owned domain (`https://domino-os.tasty-kiwi.workers.dev` only), the viable non-custom options are **Better Auth (self-hosted session framework, OAuth-only, native D1)** and **Auth0 (managed Universal Login + `jose` JWT validation)**.

| Dimension | Better Auth (OAuth-only, Native D1) | Auth0 Managed (`@auth0/auth0-react` + `jose`) |
| :--- | :--- | :--- |
| **Domain / `workers.dev`** | **Works natively.** Same-origin cookies (`__Secure-` / host-only) on `domino-os.tasty-kiwi.workers.dev`. | **Works natively.** Uses Auth0 tenant domain + exact HTTPS callback on `workers.dev`. |
| **Dependencies & Config** | `better-auth` only (since 1.5, native D1 via `database: env.DB`; **no Drizzle**, **no `better-auth-cloudflare`**). | `@auth0/auth0-react` + `jose` + Auth0 tenant, SPA app, and API resource/audience setup. |
| **Secrets** | `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (2 OAuth apps: local + prod). | Public runtime config (`domain`, `clientId`, `audience`) only; no Worker client secret. |
| **Session & Revocation** | **Simple & immediate.** DB-backed sessions in D1; `cookieCache` disabled; sign-out deletes row. | **More complex.** PKCE, third-party cookie / silent refresh issues, stateless RS256 JWTs cannot be immediately revoked without blocklists. |
| **Schema & Runtime Risk** | 4 auth tables (`user`, `session`, `account`, `verification`); native Workers/Node compat documented for `compatibility_date >= 2026-08-04` (repo is `2026-11-12`). | Zero auth tables in D1; `jose` is proven on Workers. |

**Final Choice: Better Auth (OAuth-only, native D1)**, with Auth0 as the documented fallback only if Better Auth’s native D1 runtime check fails in Day 1 spike.
* **Why:** Better Auth is a self-hosted session framework—neither handwritten password/reset auth nor a domain-gated SaaS. Same-origin `HttpOnly` cookies eliminate Auth0’s third-party silent-refresh breakage and PKCE token plumbing while giving immediate session revocation in D1 (`cookieCache` disabled, no KV/secondary cache).
* **OAuth Provider & Credential Gate:** **Do not assume the user has chosen a provider.** Recommend **GitHub OAuth** as fastest for a hackathon (Google OAuth only if Google Cloud credentials already exist). **Credential gate:** someone on the team must create two GitHub OAuth Apps before auth integration starts:
  * **Prod:** callback `https://domino-os.tasty-kiwi.workers.dev/api/auth/callback/github`, minimal `user:email` scope (no repo permissions).
  * **Local:** callback matching dev origin (`http://localhost:5173/api/auth/callback/github`, or `:8787` if using built assets).
* **CSRF, Cookies & Schema Generation:**
  * Cookies: host-only, `Secure` (prod), `HttpOnly`, `SameSite=Lax`.
  * CSRF: retain Better Auth’s `Origin`/`trustedOrigins` checks and OAuth `state` handling; enforce `Origin` matching + `Content-Type: application/json` on all `/api/projects*` mutations. Reject stateless JWT-only cookies so revocation and `session.user.id` ownership stay simple.
  * **Schema uncertainty:** Better Auth’s generated SQL for direct D1 (without Drizzle) must be generated via pinned `better-auth` CLI, inspected for SQLite/D1 compatibility, and committed as Wrangler migrations—**never** run request-time migrations.

---

### 3. Exact P0 Scope & API Contract

**In Scope (P0):**
* **Wrangler & Routing ([wrangler.jsonc](file:///Users/dominykas/Development/unfair-wknd-26/wrangler.jsonc)):** Keep top-level `name: "domino-os"` and `compatibility_date: "2026-11-12"` for production. Add `main: "src/worker/index.ts"`, `assets: { directory: "./dist", not_found_handling: "single-page-application", binding: "ASSETS", run_worker_first: ["/api", "/api/*"] }`, and prod `d1_databases`. Add named `env.staging` with a staging D1 database. Set `previews: { d1_databases: [], vars: { CLOUD_ENABLED: "false" } }` so branch previews fail closed.
* **D1 Schema (Wrangler migrations):** 4 Better Auth tables (`user`, `session`, `account`, `verification`) + `projects (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, name TEXT NOT NULL, workspace_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)` with index `(owner_id, updated_at DESC)`.
* **Worker Endpoints:**
  * `GET /api/health` → `200 { ok: true }` (public).
  * `/api/auth/*` → `auth.handler(request)` (Better Auth with `database: env.DB`, `secret`, `baseURL`, `trustedOrigins`, `socialProviders`).
  * Protected `/api/projects*`: call `auth.api.getSession({ headers: request.headers })` on every request; missing/invalid → `401 { error: { code: "unauthenticated" } }`. Missing `DB`/auth config → `503 { error: { code: "unavailable" } }`. Derive `owner_id` strictly from `session.user.id`.
  * `GET /api/projects` → `200 { projects: [{ id, name, version, updatedAt }] }` (omits `workspace_json`).
  * `POST /api/projects` → body `{ name, workspace }` → `201 { id, name, version: 1, updatedAt }`.
  * `GET /api/projects/:id` → `200 { id, name, version, updatedAt, workspace }`, or `404` if missing or owned by another user.
  * `PUT /api/projects/:id` → body `{ name, workspace, expectedVersion }` → CAS `UPDATE projects SET name=?, workspace_json=?, version=version+1, updated_at=? WHERE id=? AND owner_id=? AND version=?`. `meta.changes === 1` → `200 { id, name, version: expectedVersion + 1, updatedAt }`. `0` changes → `SELECT` by `id, owner_id`: missing → `404`; exists → `409 { error: { code: "version_conflict" }, currentVersion, updatedAt }`.
  * Unknown `/api` or `/api/*` → JSON `404`; wrong method → `405` with `Allow`.
* **Validation & Size Limits:**
  * Stream-count raw HTTP request bytes; abort with `413 { error: { code: "too_large" } }` above `1,050,000` bytes.
  * Validate `name` (trimmed string, `1..120` chars) and `workspace` via `parseWorkspace` (structural only—no `compileGraph`, rejects unsupported versions, preserves all supported v1 fields including `document.id`, `document.revision`, `source.openedFromFile`, and scenarios).
  * Serialize canonical `workspace` and enforce `<= 1,000,000` UTF-8 bytes (`413` if exceeded) before D1 write.
* **Client UX & Local Recovery:**
  * Guest local key (`dominoos.builder.workspace.v1` in [storage.ts:4](file:///Users/dominykas/Development/unfair-wknd-26/src/lib/builder/storage.ts#L4)) stays untouched for unauthenticated/public demo use.
  * Cloud project autosave reuses the 500 ms saver via a `Storage` facade remapping the fixed key to a per-`(ownerId, projectId)` slot containing only `BuilderWorkspaceV1` (cloud ID/version/dirty snapshot stay outside workspace).
  * Never auto-load Account A’s draft for Guest or Account B. On sign-out: flush owner-scoped draft, restore guest workspace, clear cloud bindings, increment `cloudOpSeq`, and abort in-flight requests.
  * Dirty tracking compares current canonical state against last cloud-saved snapshot across **all** workspace changes (not `document.revision` alone). Opening/switching warns when cloud-dirty even if local autosaved; open fetch validates with `parseWorkspace` and rechecks `cloudOpSeq` / edit generation before replacing.
  * `409` offers only: **Keep local**, **Save as copy** (`POST`), or **Load remote** (after explicit local backup/confirm). Refresh may detach to guest; authenticated **My Projects** lets the user recover a scoped local draft or explicitly fetch remote.

**Explicitly Omitted:** Project delete, sharing/teams, history, automatic cloud mirroring, R2/KV, deep-link URLs (`/builder?project=...`), Vite Cloudflare plugin.

---

### 4. Unresolved Risks

1. **Better Auth D1 native adapter + Workers runtime:** Must verify `better-auth` v1.5+ schema generation and `auth.handler` / `getSession` under `wrangler dev --local` (`compatibility_date: "2026-11-12"`) immediately.
2. **Vite `:5173` → Wrangler `:8787` OAuth proxy:** Host/Origin/cookie forwarding through Vite’s proxy can misalign `baseURL` or `Origin` headers during OAuth callbacks; fallback is testing the OAuth slice against `vite build` + `wrangler dev :8787` directly.
3. **OAuth credential gate:** Delay in creating GitHub/Google OAuth apps blocks end-to-end auth testing.
4. **D1 single failure domain & CPU:** D1 outage or cold-start latency affects cloud actions and auth; public demo and local editing remain decoupled.

---

### 5. Strict Test Plan

Keep existing **84 unit, 26 browser, `npm run build`, and `wrangler deploy --dry-run`** green with zero production secrets:
* **Worker/API (Vitest + Miniflare/local D1, injected test session verifier outside deploy entrypoint):**
  * `GET /api/health` (`200`), unknown `/api` & `/api/*` (`404` JSON, never HTML), wrong method (`405` + `Allow`).
  * Unauthenticated `/api/projects*` (`401`), cross-owner `GET`/`PUT` (`404`, not `403`).
  * Mutation CSRF: rejected missing/mismatched `Origin` or non-`application/json` `Content-Type`.
  * Streamed `1,050,000`-byte cap (`413` on chunked body without `Content-Length`) + `1,000,000`-byte canonical cap (`413`).
  * Lossless round-trip of incomplete drafts (preserving `document.id`, `revision`, `source.openedFromFile`, scenarios) and CAS `409` conflict.
* **Client & Recovery (Vitest):** Owner/project `Storage` facade isolation (Account A vs Guest/B), dirty tracking across non-revision edits, stale `cloudOpSeq` cancellation on sign-out/switch.
* **E2E & Preview Isolation (Playwright + CI):** Public demo & builder work with `/api/projects*` returning `503`/`401` (no auth calls on load); `previews` config verified to have `d1_databases: []`.

---

### 6. Honest Effort & Deadline Viability (Nov 14, 20:00 Europe/Vilnius)

With ~28 hours elapsed remaining until **Nov 14, 20:00 Europe/Vilnius** and **3 developers** working in parallel:

| Workstream | Person-Hours | Elapsed (with 3 devs) |
| :--- | :--- | :--- |
| 1. Better Auth D1 spike, SQL migration, OAuth app setup, Worker `/api/auth/*` + `/api/projects*` + tests | 8–11 h | 6–8 h |
| 2. Client `better-auth/react`, owner-scoped `Storage` facade, dirty tracking, `cloudOpSeq`, My Projects / Save / `409` UI | 8–11 h | 6–8 h |
| 3. `wrangler.jsonc` prod/staging/preview isolation, Vite proxy + OAuth callback verification, CI + Playwright + smoke deploy | 5–7 h | 4–6 h |
| **Total** | **21–29 person-hours** | **~12–16 hours elapsed** (with parallel streams + integration buffer) |

**Viability Verdict:** **Yes, viable—conditionally.** With 3 developers, ~12–16 elapsed hours fits inside the ~28-hour window **if and only if**:
1. The **Better Auth native D1 + `wrangler dev` spike** and **GitHub OAuth App creation** pass in the first **2–3 hours**.
2. If Better Auth D1 hits an unexpected runtime/schema blocker in that first 3-hour gate, pivot immediately to **Auth0 + `jose`** rather than debugging ORM/adapter internals.
3. No scope creep (keep deep links, delete, and `@cloudflare/vite-plugin` out).

</details>

<details>
<summary>Supplement — gpt-6-luna — Email/password supplemental review</summary>

Source: [Cloud backend email-password review — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Aa66a8d1d-520d-405a-8b06-62ef0b2de3c2)

## Review verdict: conditionally accept

Email and password only is viable for this hackathon **if the implementation passes an early Workers CPU and runtime gate**. Keep Better Auth’s password and session handling, native D1, and the existing project API and recovery contract. Do not substitute a custom password implementation to make the deadline.

The schedule is viable only if that gate and staging setup happen first. If password hashing exceeds the configured Workers CPU budget, or the real bundled sign-up and sign-in paths fail, the appropriate fallback is to ship cloud accounts disabled—not switch auth providers or weaken password security late.

## P0 scope

Use Better Auth’s built-in email/password flow with `emailAndPassword.enabled` and `requireEmailVerification: false`. Keep verification and password reset unavailable: no SMTP, reset links, account recovery, email changes, social providers, or account linking. Leave `emailVerified` false; do not imply the app has verified someone’s email. Keep the user-facing limitation explicit, and make clear that losing the password means losing access to that account’s cloud projects.

Use Better Auth’s documented password hashing and sessions. Set a minimum password length of 12 and a maximum of 128; use the appropriate password-manager autocomplete fields and generic sign-in errors. Protect project ownership with the opaque `session.user.id`, never the email address.

Use D1 for auth and project data, with database-backed rate limiting. That implies six app tables: Better Auth’s `user`, `session`, `account`, `verification`, and `rateLimit`, plus `projects`. Rate-limit sign-in and sign-up at the documented routes, then verify the behavior through the actual HTTP handler under concurrent attempts. Do not expose server-side `auth.api` calls as a way around those limits. Trust `cf-connecting-ip` only on the production Cloudflare ingress; do not accept user-supplied `x-forwarded-for` as the client identity. No KV or in-memory-only limiter.

For sessions, disable cookie caching and verify the database session on every protected request. Host-only `Secure`, `HttpOnly`, `SameSite=Lax` cookies and same-origin checks for mutations remain appropriate. A one-day session with refresh disabled is a reasonable simplification only if the implementation verifies Better Auth’s expiry and response-cookie behavior, including that required `Set-Cookie` headers survive the Worker response path. Never log passwords, cookies, or secrets.

Disable unused recovery and account-management routes explicitly where the library permits it; confirm they cannot be reached through the handler. Keep only `BETTER_AUTH_SECRET` as an auth secret. The built-in `account` and `verification` tables may still be required even though there is no social login or email delivery; inspect the generated schema rather than assuming otherwise.

## Must-pass gates

1. Pin a stable Better Auth version. Build and run the real bundled Worker path, then exercise sign-up, sign-in, wrong-password, logout, and revoked or expired sessions against the configured staging account. Measure CPU time, including concurrent attempts. Local wall-clock timing does not establish compatibility with the account’s Workers CPU limit. The account plan is unknown: don’t assume a limit or upgrade it without authorization.
2. Confirm database rate limits deny over-limit HTTP requests under concurrency and do so before expensive password-hash work. Test generic errors and assess whether duplicate-email sign-up responses reveal account existence; do not promise enumeration resistance unless the chosen handler behavior actually provides it.
3. Apply generated migrations locally and to isolated staging. Verify missing sessions fail closed; project reads and writes stay owner-scoped; `Origin` checks and request-size limits run before D1 writes.
4. Preserve the agreed local-first, per-owner cloud drafts, versioned writes, conflict recovery, and guest isolation. Check account switching, stale requests, and sign-out during in-flight saves.
5. Verify public demo and local editing with cloud auth disabled, and confirm previews cannot bind production D1.

The proposed security defaults have two material tradeoffs: with verification deferred, a user can register an address they do not control; with reset deferred, a forgotten password has no account recovery path. State both plainly in the UI. Disabling refresh may also cause users to need to sign in again after a day; validate that the library configuration truly enforces the intended expiry.

## Schedule and differences from R3

The earlier GitHub OAuth recommendation is superseded by the user’s explicit email/password-only choice. Retain Better Auth and D1; remove OAuth credentials, callback setup, and provider permissions from P0. Add a CPU gate, database-backed rate limiting, and explicit no-recovery behavior. Do not claim password hashing is still broken on Workers: the cited bundling issue is closed. The remaining question is whether this pinned version’s actual Worker bundle and the configured account’s CPU budget handle the documented hashing path.

The previous **22–32 person-hour** estimate assumed OAuth and did not establish password-hashing viability. For the revised scope, use **about 20–30 person-hours across three developers**, with roughly **10–16 focused elapsed hours** only if the CPU gate passes quickly, isolated staging D1 is ready, and there is no auth-provider pivot. If either the runtime gate or staging setup stalls, ship the public demo with cloud accounts disabled.

</details>

<details>
<summary>Supplement — claude-haiku-5-5 — Email/password supplemental review</summary>

Source: [Cloud backend email-password review — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Ac73258ae-da0d-4702-bcf0-4bd0d431ed15)

## Verdict: ACCEPT, conditionally

Better Auth email/password with native D1 is a reasonable P0 for a hackathon with no recovery. It is a stretch for the deadline, and it has one hard precondition: the Workers plan. Ship cloud disabled (503) if any gate below fails.

**Preconditions before any implementation:**
1. **Workers plan decision (user).** Free has a 10 ms CPU limit. Default scrypt in JS will very likely exceed it on sign-up and sign-in. I have not measured this. Lowering hash cost to fit is ruled out. So on Free, cloud is out. On Paid, the user must approve the spend. Do not upgrade silently.
2. **Route allowlist, not `/api/auth/*`.** Forward only sign-up, sign-in, sign-out, and get-session to `auth.handler`. Return JSON 404 for everything else, including reset, verify, change-email, delete-user, and link routes. Unused routes must not be reachable even if their config is off.
3. **Backup export is a P0 deliverable.** The signup copy promises "export a backup," so the download must exist before cloud is enabled. Without it the copy is misleading.

## Disagreements with R3

- **GitHub is gone.** That removes OAuth app setup, callback URLs, and the judges-need-GitHub-accounts constraint. Good.
- **Auth0 fallback is off.** R3's "switch to Auth0 at 3h" rule no longer applies. If Gate A fails, cloud goes disabled. No provider pivot without review, as the user directed.
- **Enumeration is not concealed.** R3 implied `autoSignIn:false` mitigates duplicate-email disclosure. It does not. It changes the response shape, not whether an account exists. Without verification there is no way to hide existence. Confirm the installed version's duplicate-sign-up response and document it as accepted disclosure. Do not write "concealed" in any user-facing or review text.
- **Rate limiting is a dependency, not a gate.** R3 listed it as an unverified item. It is now a Gate A item: the limiter must return 429 before any hashing, under concurrency.
- **Atomicity claim needs proof.** D1 has no interactive transactions. A read-modify-write rate counter can overshoot under a burst. Overshoot is tolerable for a hackathon, but the claim "atomic" must be tested, not assumed.

## Pitfalls in the R3 default config

1. **Per-IP rate limits will lock out judges.** Five sign-ins per minute per IP fails when a venue NAT gives everyone one public IP. Raise per-IP limits materially, and rely on the limiter as a hashing-cost brake, not a fairness control. There is no global cap, so distributed attacks still cost hashing CPU. Accept that and document it.
2. **Vite proxy Origin mismatch.** Browsers send `Origin: http://localhost:5173` through the proxy. Add that origin to `trustedOrigins`, and set `baseURL` to the origin the browser sees. Otherwise origin checks fail and cookies are mis-scoped.
3. **Auth instance must be built per request.** `env.DB` and secrets exist only inside the handler. Module-scope construction breaks or reads stale bindings.
4. **Missing secret must fail closed.** In previews, `BETTER_AUTH_SECRET` is unset. Confirm the library throws, and catch that in the router to return the defined 503 JSON, not an HTML 500 or a dev-secret fallback.
5. **`d1_databases: []` in previews.** Verify with `wrangler deploy --dry-run` that the binding is actually gone. If not, a preview could write to production D1.
6. **Fixed session with no refresh.** Set expiry (1 day) and `updateAge` to a value that never triggers refresh. Then test that the response headers from sign-in carry the cookie. Do not assume.
7. **Cookie flags on localhost.** Secure cookies on `http://localhost` vary by browser. Keep browser verification in the test plan. Do not rely on a Node fetch test for `Set-Cookie`.
8. **`name` is required by default on sign-up.** Collect a display name or pass a neutral default. Never default it to the email.
9. **Logging.** Disable request-body logging and library debug logs in production. Confirm nothing logs passwords or emails.
10. **Password policy.** Set `minPasswordLength: 12` and `maxPasswordLength: 128` explicitly. Use `autocomplete="new-password"` on sign-up and `current-password` on sign-in.
11. **Explicit defaults.** Set `requireEmailVerification: false`, `autoSignIn` explicitly, and no `sendResetPassword`. Verify the reset endpoint is blocked by the allowlist even though it errors without a sender.
12. **Generated SQL.** Commit `generate` output as a migration. Apply locally first with `wrangler d1 migrations apply --local`, then review it by hand.

## Test plan

- **Gate A (CPU, deployed):** on the configured account's staging Worker, measure per-invocation CPU for sign-up, sign-in, and wrong password, using Workers logs or analytics. Also measure 20 concurrent sign-in attempts. Local wall-clock is not evidence.
- **Rate limit (HTTP):** exceed the limit; expect 429 and near-zero CPU on limited requests. Use the real HTTP path, not `auth.api`, since server-side calls bypass limiting.
- **Auth:** sign-up, sign-in, wrong password generic error, forged cookie 401, revoked session row deleted → 401 on next request, expiry 401, sign-out clears cookie, cross-site Origin on mutations rejected.
- **Headers:** assert the real `Set-Cookie` attributes (`HttpOnly`, `SameSite=Lax`, `Secure` on https, host-only).
- **Routing:** each disabled auth path returns 404 JSON; `/api/nope` and methods return defined JSON.
- **Projects and CAS (from R3):** unchanged, including cross-owner 404 parity and concurrent-PUT single winner.
- **Enumeration:** document the duplicate-email response as observed, with a test that records it.
- **E2E:** signup copy visible; public demo makes zero `/api` calls; cloud 503 leaves local editing working.

## Schedule

Remaining time is roughly one day, with the cut line at Nov 14 16:00 Vilnius. Three developers, about 30 person-hours of realistic work, roughly 12–16 elapsed hours if started now.

- **T+0–1h:** user decides on the plan tier and approves no-recovery copy.
- **T+1–4h:** install pinned Better Auth, generate and apply SQL locally, sign-up/sign-in round trip, route allowlist.
- **T+4h, Gate A:** deployed CPU and rate-limit measurements on the configured account. Fail → cloud disabled, local demo ships.
- **T+4–10h:** projects API, CAS, limits, serializer bundling, Vite proxy.
- **T+10h, Gate B:** staging CAS, routing, and HTTP rate-limit tests green.
- **T+10–18h:** client save/open/list, conflict UI, backup export, lazy loading.
- **Nov 14 16:00:** deploy freeze. Not green → cloud 503.

I would not bet on the full P0 landing. The realistic outcome is cloud shipped only if Gate A passes early and the plan is approved.

</details>

<details>
<summary>Supplement — gemini-4-hydrogen — Email/password supplemental review</summary>

Source: [Cloud backend email-password review — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3Ae0927ba6-33e3-49df-a260-ca6c248ab722)

### Verdict: **CONDITIONAL ACCEPT**

I **accept** the pivot to **Better Auth email/password-only with native D1** (and deferred verification/reset), **strictly gated on a Day-1 (Hours 0–3) Workers CPU benchmark on `env.staging`**.

* **Why accept:** Dropping OAuth removes the external OAuth App credential gate and the Vite `:5173` → Wrangler `:8787` OAuth callback proxy hazard from R3. Better Auth (`better-auth` only) supplies `scrypt` hashing, D1-backed sessions, and D1-backed `rateLimit` with one secret (`BETTER_AUTH_SECRET`).
* **Why conditional:** Unlike OAuth, `scrypt` burns Worker CPU on every signup/signin. `wrangler dev --local` does **not** enforce Cloudflare’s **10 ms Workers Free CPU limit** (vs. 30 s on Workers Paid), and the current account plan in [wrangler.jsonc](file:///Users/dominykas/Development/unfair-wknd-26/wrangler.jsonc) is unknown. We must **not** weaken `scrypt` parameters or handwrite a weaker hash to fit 10 ms.

---

### Disagreements & Changes from R3 Proposal

1. **OAuth-only → Email+Password-only:** Drops GitHub/Google OAuth apps, `GITHUB_CLIENT_ID`/`SECRET`, and OAuth proxy/callback risks.
2. **D1 Schema grows from 5 to 6 tables:** Adds Better Auth’s `rateLimit` table (`user`, `session`, `account`, `verification`, `rateLimit`, `projects`).
3. **Primary Runtime Risk Shifted:** Replaces R3’s OAuth proxy risk with **Workers `scrypt` CPU time** and **per-IP D1 rate limiting**.
4. **No Silent Provider Fallback:** R3’s Auth0 fallback is invalid here (Auth0’s built-in email/password is test-only). If the staging CPU gate fails on a Free plan, escalate to the user rather than switching providers or weakening `scrypt`.

---

### Pitfalls in the Proposed Default Config

1. **Local vs. Production CPU Blindspot:** Testing `scrypt` only in `wrangler dev --local` will mask `1102` CPU-limit failures on Workers Free. Only a deployed `env.staging` test on the real Cloudflare account proves viability.
2. **Signup Enumeration & Double Rate-Limit Trip:** With `autoSignIn: false`, Better Auth’s default `signUp.email` can still reveal existing accounts (duplicate-email error), and an immediate client `signIn.email` call after `signUp` can consume `/sign-in/email` rate-limit quota on typos. Do not claim anti-enumeration without email verification; keep sign-in errors generic (`Invalid email or password`) and do not chain `signIn` on `signUp` failure.
3. **`cf-connecting-ip` Missing in Local Dev:** Trusting `cf-connecting-ip` (and ignoring spoofable `x-forwarded-for`) is right for production, but `cf-connecting-ip` is absent in `wrangler dev --local` / Vite proxy. Without a dev/test-only fallback (e.g., `127.0.0.1`), all local requests collapse into one bucket or fail.
4. **Fixed 1-Day Session Expiry Without Refresh:** Disabling session refresh avoids dropped `Set-Cookie` headers on concurrent requests, **but** an active user editing across a >24h hackathon will hit `401` mid-session. The client must **never** discard local edits on `401`; it must keep the `(ownerId, projectId)` local draft and prompt re-authentication.
5. **Unwanted Default Auth Routes:** Better Auth mounts reset, verification, email-change, and user-delete routes by default. Explicitly disable those features and allowlist only the P0 `/api/auth/*` endpoints (returning `404` otherwise).
6. **Rate-Limit Short-Circuiting:** Verify in the pinned `better-auth` version that D1 `rateLimit` increments atomically and returns `429` **before** `scrypt` runs, or concurrent bursts will still exhaust Worker CPU.

---

### Exact Auth P0 & Preserved Contract

* **Better Auth (`better-auth`, pinned stable):** `database: env.DB`, `secret: env.BETTER_AUTH_SECRET`, `emailAndPassword: { enabled: true, requireEmailVerification: false, autoSignIn: false, minPasswordLength: 12, maxPasswordLength: 128 }` (verify exact option names against installed version), `socialProviders: {}`. `emailVerified` stays `false`.
* **Rate Limit:** `rateLimit: { enabled: true, storage: "database", customRules: { "/sign-in/email": { window: 60, max: 5 }, "/sign-up/email": { window: 60, max: 3 } } }` keyed by `cf-connecting-ip` in prod.
* **Sessions & Security:** `cookieCache: { enabled: false }`, 1-day fixed expiry, refresh disabled, host-only `HttpOnly`, `SameSite=Lax`, `Secure` in prod. Every `/api/projects*` request calls `auth.api.getSession({ headers })`; owner is strictly `session.user.id` (never `email`). Enforce `Origin` + `Content-Type: application/json` on mutations. Never log credentials, hashes, or cookies.
* **UI:** `minLength={12}`, `maxLength={128}`, proper `autocomplete` attributes, and signup notice: *"Email verification and password reset are unavailable in this hackathon version. Keep your password and export a backup."*
* **Preserved Non-Auth Contract:** Unchanged from R3—[wrangler.jsonc](file:///Users/dominykas/Development/unfair-wknd-26/wrangler.jsonc) top-level prod + `env.staging` + `previews.d1_databases: []` fail-closed; `run_worker_first: ["/api", "/api/*"]`; `/api/health`, `/api/projects` (`GET`/`POST`), `/api/projects/:id` (`GET`/`PUT` CAS `expectedVersion` → `409`); `1,050,000` streamed / `1,000,000` canonical byte caps; structural `parseWorkspace`; guest vs. `(ownerId, projectId)` `Storage` facade, `cloudOpSeq`, and `AbortController`.

---

### Strict Test Plan

Keep existing **84 unit, 26 browser, `npm run build`, and `wrangler deploy --dry-run`** green with zero prod secrets, adding:
* **Staging CPU Gate:** Real `env.staging` signup, login, wrong-password, and concurrent burst tests; verify zero `1102` CPU-limit errors in Workers traces.
* **HTTP Auth & Rate-Limit (via `auth.handler`, not `auth.api`):** Concurrent `429` enforcement on `/sign-up/email` (>3/min) and `/sign-in/email` (>5/min) with **no `scrypt` execution after limit**; `x-forwarded-for` spoofing ignored; disabled auth routes return `404`; `emailVerified` remains `false`; `<12` / `>128` passwords rejected; sign-out deletes D1 session.
* **API, Storage & E2E:** `401` unauth, `404` cross-owner, `413` streamed/canonical caps, CAS `409`, `(ownerId, projectId)` draft isolation, `401` mid-edit preserves local draft, public demo works when `/api/projects*` returns `401`/`503`.

---

### Viable Schedule & Unresolved Gates (~28h to Nov 14, 20:00 Europe/Vilnius, 3 Devs)

| Phase | Hours | Owner(s) | Scope & Gate |
| :--- | :--- | :--- | :--- |
| **1. Hard CPU & Schema Gate** | **0–3 h** | Dev 1 + Dev 3 | Pin `better-auth`, generate 6-table D1 migration, deploy `env.staging`, run **CPU + `scrypt` + D1 `rateLimit` gate** on actual Cloudflare account. **Stop/escalate if 10 ms Free CPU fails.** |
| **2. Parallel Build** | **3–11 h** | Dev 1 / Dev 2 / Dev 3 | **D1:** Auth allowlist + `/api/projects*` + tests. **D2:** Auth UI + scoped `Storage` facade + `cloudOpSeq` + `401`/`409` handling. **D3:** `wrangler.jsonc` prod/staging/preview isolation + Vite `/api` proxy + CI/E2E. |
| **3. Integration & Smoke** | **11–18 h** | All 3 | End-to-end staging verification, full Vitest + Playwright suite, deploy check (~10 h buffer before deadline). |

</details>




## Implementation follow-up — GitHub pivot, 13 November 2026

This is subsequent implementation evidence and user direction, not an additional invented discussion round or retrospective consensus.

The user approved local implementation with Gemini 4 Hydrogen on architecture, Claude Haiku 5.5 on design and GPT-6 Luna on verification/gluing. The account is Workers Free. An explicitly approved isolated password probe made four synthetic requests, reported aggregate CPU p50 73.110 ms and p99 89.517 ms (including an unauthorized control), and was deleted with settings API 404 confirmation. These measurements fail the 10 ms password feasibility gate. They do not measure full D1-backed login. [Probe record](AUTH_CPU_CHECK.md)

The user then said “No, we have to stay on free” and “If email and password doesn't work, let's just do GitHub auth then.” This explicitly authorizes Better Auth GitHub OAuth, retaining D1 sessions/projects, and supersedes the earlier email/password decision. No paid upgrade or silent provider substitution occurred.

Implementation tasks, actual contributions:

- Provider `antigravity`, configured `gemini-4-hydrogen`, separate executed-model field unavailable: implemented OAuth configuration and exact auth routes in four Worker files; did not execute commands/tests. Task suffix `631657e4-542d-444b-ae15-c60b2074e826`.
- Provider `claudeAgent`, configured/executed `claude-haiku-5-5`: frontend implementation task in progress at this entry. Task suffix `887c6e3e-ceb6-403a-b955-dab3d77a38af`. Completion and evidence must be recorded separately.
- Provider `codex`, configured/executed `gpt-6-luna`: initial verification task `eda84cca-a8c1-42a3-a408-05702c9319bb` made no edits and ran no tests, reporting that it had not found the auth implementation in `src`; actual auth lives under `worker/`. The coordinator adapted and executed the real local integration tests. Do not attribute those test results to Luna.
- Earlier independent CPU evidence review `78480e45-2593-40cb-8fd1-ec7d4ea6cf8c`, configured/executed `gpt-6-luna`, agreed the aggregate failed the Free gate, while retaining sample and missing full-D1-auth limitations; read-only, no cloud/test execution.

The current plan/runbook records GitHub setup, Free-only deployment gates and remaining real-provider verification. No remote D1 or further Worker deployment is approved by these task assignments.

Verification follow-up: provider `codex`, configured/executed `gpt-6-luna`, task `7870ab4f-d3f3-42d3-8618-f25933a8f0b4`, reviewed the current source read-only and found no critical issue. It executed 91 unit tests, Worker typecheck, frontend build and deployment dry-run successfully. Its Worker and browser commands were blocked by sandbox `listen EPERM`; skipped tests from that attempt are not passing evidence. The coordinator reran those commands with local-port permission: **12 Worker/runtime tests and all 31 Chromium journeys passed** (26 existing + 5 new mocked-cloud journeys). Real GitHub code exchange and deployed CPU remain unverified.

Frontend completion: Haiku task `887c6e3e-ceb6-403a-b955-dab3d77a38af` completed with the GitHub-only controls, project dialogs/client/state hook, scoped local storage and seven unit tests. It ran the build and 91 unit tests, not Playwright. The coordinator reviewed its added Input primitive, fixed remaining unload/autosave/sign-out guards, and reran the final checks. Final local evidence is **91 unit tests, 12 Worker/runtime tests, all 32 Chromium journeys (26 existing + 6 cloud mocked-API journeys), Worker typecheck, build and dry-runs**. Real provider authentication and remote CPU are still pending.


## Post-integration reviews — 13 November 2026

These are subsequent reviews, not additional rounds of the original architecture debate.

- **Gemini 4 Hydrogen**, provider `antigravity`, configured model `gemini-4-hydrogen`: [Free Worker cold-start architecture review](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A758ba181-5997-4cce-966d-3177ffd0191d). Read-only source review; no commands or changes. It recommended awaiting Better Auth context initialization during Worker startup after finding no D1/network I/O in that path. It required preserving per-request session lookup and warned that startup optimization alone cannot pass the authenticated request CPU gate. The coordinator implemented the narrow change and ran the checks recorded in staging evidence. A separate executed-model field was unavailable; no stronger identity claim is made.
- **GPT-6 Luna**, provider `codex`, configured model `gpt-6-luna`: [Verify cloud implementation after main integration](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A304086d8-6da7-4272-8c35-f774c401b698). Read-only verification after main integration: 12 Worker tests, all 32 Chromium tests and deployment dry run passed after local-port permission resolved initial sandbox errors. It found no material owner-check, CAS or race issue and made no source/cloud changes. It did not verify live GitHub authorization or authenticated deployed CPU.

The coordinator kept the simple interface, quota of 20 projects, five successful creates per minute and Free-only constraints. Production remains unapproved; [staging evidence](STAGING_VERIFICATION.md) separates local tests, remote anonymous/OAuth-start proof and outstanding real-account acceptance.


## Implementation discussion and contract freeze — 13 November 2026

This new implementation discussion was requested after PR #5 already contained working code. The user's final instruction excluded the copied email-login and CPU sections; the coordinator retained the existing GitHub OAuth flow and user-reported successful sign-in. The historical discussion above is unchanged. Main was fetched at `907ba40`; this branch already contained it, so no new merge was needed.

Capabilities were rediscovered: `codex/gpt-6-luna`, `claudeAgent/claude-haiku-5-5`, and `antigravity/gemini-4-hydrogen` were available. Luna and Haiku runs reported matching executed-model identifiers. Hydrogen's separate executed-model field was unavailable; configured identity is recorded without inventing stronger execution metadata.

| Model | Independent proposal | Cross-review | Final contract |
| --- | --- | --- | --- |
| gpt-6-luna | [Implementation R1 — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A86675cde-ff5a-4712-9c62-933f85bee825) | [Implementation R2 — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A5173dd64-2e44-43d9-80e1-44a39220c72c) | [Implementation R3 — luna](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A6a0f9f9d-bb86-4e48-bac4-dc5a43f3c4a5) |
| claude-haiku-5-5 | [Implementation R1 — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A068ee984-2aa7-4609-b232-2542b0ec4064) | [Implementation R2 — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A1359a37d-60bc-4aa0-ae93-c316c5db7386) | [Implementation R3 — haiku](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A0d064da3-8d93-4543-8df0-cf72223b6b92) |
| gemini-4-hydrogen | [Implementation R1 — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A820ebd94-ceb2-41c2-9427-fd08663a10da) | [Implementation R2 — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3Abdd97f34-2c66-49b9-ad2a-ca30b93cfe2b) | [Implementation R3 — hydrogen](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A3df8f8d3-b7aa-4d5a-9e59-6ce1c5f06a29) |

Luna's first cross-review omitted Haiku, so an actual supplementary review completed that requirement before Round 3: [Implementation R2 — Luna frontend cross-review](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Ac2348025-ff76-4a1c-a3b2-ff6a7966428d%3Adelegate-task%3A6e244a2a-8e72-4d70-95c4-388a9abbbdec).

### Genuine responses and resolved disagreements

- **Round 1, Luna:** proposed auth URL validation and additional session/schema tests. Its claim that real local session tests were absent was incorrect: the current Worker harness already exercises production Better Auth verification against local D1. In Round 3 it explicitly retracted that claim and rejected a hardcoded workers.dev allowlist. It accepted canonical HTTPS origins with HTTP loopback exceptions and policy tests as its actual implementation scope.
- **Round 1, Haiku:** proposed direct Open cloud version recovery, more confirmation/account-switch coverage, and initially claimed debounced autosave could bypass Open confirmation. Cross-review checked the live `replaceNeedsConfirm()` predicate; Haiku corrected the claim to a warning-copy/coverage gap, not proven silent overwrite. It also corrected “all 32 browser tests mocked” to six cloud API-mocked journeys plus 26 ordinary frontend journeys.
- **Round 1, Hydrogen:** found missing project-route framing, pagination, method, validation, corrupt-row and per-owner quota tests. It recommended preserving the existing backend schema/API. After Haiku's criticism it accepted stateless shared test factories with a separately owned harness per suite, rather than copying setup or sharing mutable database state. It corrected its mistaken auth migration filename to `0001_auth.sql`.
- **Round 2 substantive disagreement:** Luna considered a direct Open cloud version button redundant because My Projects already supports Open. Haiku rejected that objection because the user explicitly requested the action; coordinator accepted the minimal button routed through the existing confirmation flow. No force overwrite or new endpoint was added to the contract.
- **Round 2 shared correction:** tests with seeded signed sessions prove production session verification and D1 authorization locally; browser API mocks prove UI behavior. Neither establishes a real GitHub code exchange. Real GitHub sign-in remains separately user-verified.
- **Round 3 approvals:** all three accepted unchanged project envelopes, verified ownership, D1 CAS/quota/size controls, unchanged migrations, and non-overlapping ownership. No code edits began until all three Round 3 responses completed (last completion 16:49:07 UTC).

### Frozen interfaces and ownership

`verifySession(request, env) -> Promise<{userId, name} | null>`. Project requests/responses keep `src/lib/cloud/contracts.ts`: create/update return `{project: metadata}`, detail adds `workspace`, list returns `{projects, nextOffset}`; errors are `{error:{code,message,...details},requestId}`. Only verified session identity controls owner SQL. Incomplete v1 workspaces, document identity, scenarios and provenance are preserved. Limits remain 20 projects, five successful creates/minute, 1,000,000 workspace bytes and 1,050,000 request bytes.

- **Luna:** `worker/auth.ts`, `worker/auth-options.ts`, new `worker/auth-url.ts` and `worker-tests/auth-config.test.ts`. Shared helper `validateAuthBaseURL(string): string` returns a canonical HTTPS origin or an HTTP loopback origin and rejects credentials, paths, query and fragment.
- **Hydrogen:** `worker/http.ts`, new `worker-tests/helpers.ts`/`projects.test.ts`, setup-only refactor of `worker-tests/auth.test.ts`. Index/projects only for reproduced defects; preserve all original cases.
- **Haiku:** cloud/account UI, cloud client/hook, `BuilderExperience.tsx`, cloud client unit tests and cloud mocked browser tests. Add confirmed remote recovery and SDK-compatible 429 feedback; preserve cancel, local data, account and stale-response guards.
- **Coordinator:** dependency/config/CI integration and documentation, plus a new built-Worker browser journey using actual local D1 and production auth verification. Session seeding is test-only; no deployed identity adapter or bypass. Only coordinator may use existing approved staging resources; production remains unchanged.

Implementation-task results and exact checks are recorded in `CLOUD_BACKEND_IMPLEMENTATION.md` after integration. No claim of three-model code contribution is made until the actual edited files are reviewed.
