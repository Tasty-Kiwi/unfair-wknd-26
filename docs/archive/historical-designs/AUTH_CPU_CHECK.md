# Better Auth CPU feasibility check

Historical record: Better Auth and the probe/generator tooling were removed by the later user-approved custom OAuth replacement. Source paths and commands below describe that earlier probe and are not current setup instructions. The original sources remain in Git history at 76cb26e.

Result on 13 November 2026: **The email/password path failed the Workers Free feasibility gate.** The user subsequently required staying on Free and approved GitHub authentication instead; see [the current setup](../../GITHUB_AUTH_SETUP.md).

## Approved scope and execution

The user approved one temporary `domino-os-auth-cpu-check` Worker in the Tasty Kiwi Free account, at most 12 synthetic requests, reading CPU telemetry, and cleanup. This probe had a generated bearer secret, no D1 binding, no assets, and no user/project data. The production `domino-os` Worker was not modified.

- Exact library: `better-auth@1.7.22`, default `better-auth/crypto` hashing and verification, unchanged parameters.
- Sources: `worker/auth-cpu-probe.ts`, `wrangler.auth-probe.jsonc`.
- Compatibility date: `2026-11-12`.
- Deployed version: `3cdc2e45-279f-4e28-9e25-d580b4f27dd8`.
- Temporary URL: `https://domino-os-auth-cpu-check.tasty-kiwi.workers.dev` (deleted).
- Exactly **4 synthetic HTTP requests**, including the unauthorized control; the remaining allowance was not used.

| Request | Result |
| --- | --- |
| POST `/hash`, without the secret | 401 |
| POST `/hash`, with the secret | 200; library hash completed |
| POST `/valid`, with the secret | 200; correct synthetic password verified |
| POST `/invalid`, with the secret | 200; incorrect synthetic password rejected |

No signup endpoint, real accounts, D1 writes, migrations, or production deployment were exercised by this remote probe. Local integration tests separately exercised real Better Auth HTTP signup/login/logout and local D1; those tests establish functionality, not deployed CPU feasibility.

## CPU evidence

The Workers Observability REST query returned 403 with the existing OAuth permissions. The authorized read was completed through Cloudflare's GraphQL Analytics API instead, filtered to this exact script. The resulting aggregate contained **4 requests, 0 errors, status `success`**:

```json
{
  "dimensions": {
    "scriptName": "domino-os-auth-cpu-check",
    "status": "success"
  },
  "quantiles": {
    "cpuTimeP50": 73110,
    "cpuTimeP99": 89517
  },
  "sum": { "errors": 0, "requests": 4 }
}
```

Cloudflare's live schema introspection of `AccountWorkersInvocationsAdaptiveQuantiles` explicitly described both CPU fields in **microseconds**. Thus the observed aggregate median is **73.110 ms** and p99 **89.517 ms**. These exceed the documented Workers Free **10 ms per HTTP request** allowance. [Metrics API](https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/), [CPU limits and overrun flexibility](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)

This tiny aggregate includes the inexpensive unauthorized control. It does not provide separate timings for hashing, valid login, or invalid login; p99 from four requests is not a stable performance estimate. It is nevertheless sufficient to reject the claim that this selected runtime path has demonstrated a safe fit inside 10 ms. Full D1-backed auth requests remain unmeasured remotely.

All four requests returned successfully. Cloudflare documents isolate flexibility for occasional CPU overruns, so HTTP success does not override the measured CPU evidence or prove reliable operation on Free. The probe's `performance.now()` difference was zero; it was not used as a CPU measurement. Upload startup time was also not used as request CPU evidence.

## Cleanup and decision

`wrangler delete domino-os-auth-cpu-check --config wrangler.auth-probe.jsonc` reported successful deletion. An independent authenticated GET of that script's settings returned **404**, confirming deletion. The local generated probe secret file was removed and its tail session stopped. No production infrastructure or account billing settings changed.

Do not weaken hashing parameters, deploy the current auth path as Free-compatible, or silently switch provider/account plan. The coordinator initially recommended Paid to retain email/password. The user rejected that option, required Workers Free and then explicitly selected GitHub authentication. The current implementation removes password hashing in favor of Better Auth GitHub OAuth. This does not convert the failed password measurement into a passing OAuth measurement; real OAuth/D1 CPU still needs an approved staging check.

The backend draft, local auth tests, and UI design remain local and uncommitted. The cross-browser acceptance criterion is still unmet.

## Independent verification

Provider `codex`, requested and executed model `gpt-6-luna`, reviewed the five source/result artifacts read-only. It agreed that the observed aggregate fails the stated CPU gate and supported stopping dependent UI/deployment work. It explicitly retained the small-sample, mixed-control and missing full-D1-auth limitations. It did not run tests or cloud commands, and cleanup confirmation is coordinator evidence.

Task: `node:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A78480e45-2593-40cb-8fd1-ec7d4ea6cf8c`.

[Verification thread](t3-thread://v2/55319d5f-3d07-4b9d-b7a7-291bcf25c769/thread:delegated-task:command%3Amcp%3Aad057f4c-636b-4781-8940-b1ec8649f65d%3Adelegate-task%3A78480e45-2593-40cb-8fd1-ec7d4ea6cf8c)
