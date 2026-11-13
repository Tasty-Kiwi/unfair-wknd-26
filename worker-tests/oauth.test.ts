import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { createAuth } from "../worker/auth";
import {
  createCloudTestHarness,
  resetCloudTables,
  randomTestToken,
  hashTestToken,
  TEST_ORIGIN,
} from "./helpers";

const { server, worker } = createCloudTestHarness();
let env: Env;
let db: D1Database;
beforeAll(async () => {
  await server.listen();
  await worker.applyD1Migrations("DB");
  env = await worker.getEnv();
  db = env.DB;
}, 60_000);
afterAll(async () => {
  await server.close();
});
beforeEach(async () => {
  await resetCloudTables(db);
  await db.prepare('DELETE FROM "account"').run();
  await db.prepare('DELETE FROM "user"').run();
});

function request(
  path: string,
  cookie?: string,
  method = "GET",
  origin = TEST_ORIGIN,
) {
  return new Request(origin + path, {
    method,
    headers: {
      Origin: origin,
      "CF-Connecting-IP": "192.0.2.25",
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });
}

type Auth = ReturnType<typeof createAuth>;
async function start(auth: Auth, origin = TEST_ORIGIN) {
  const response = await auth.handler(
    request("/api/auth/sign-in/social", undefined, "POST", origin),
  );
  expect(response.status).toBe(200);
  const url = new URL(((await response.json()) as { url: string }).url);
  const cookie = response.headers.getSetCookie()[0].split(";")[0];
  return { url, cookie, response };
}
function callback(
  auth: Auth,
  attempt: Awaited<ReturnType<typeof start>>,
  cookie = attempt.cookie,
  origin = TEST_ORIGIN,
) {
  return auth.handler(
    request(
      `/api/auth/callback/github?code=test-code&state=${attempt.url.searchParams.get("state")}`,
      cookie,
      "GET",
      origin,
    ),
  );
}
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function provider(
  profile: unknown = { id: 12345, login: "tester", name: "Tester" },
) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    expect(init?.redirect).toBe("error");
    if (url === "https://github.com/login/oauth/access_token") {
      return json({
        access_token: "synthetic-github-access-token",
        token_type: "bearer",
      });
    }
    expect(url).toBe("https://api.github.com/user");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer synthetic-github-access-token",
    );
    return json(profile);
  };
  return { fetcher, calls };
}

async function sessionCount() {
  return db
    .prepare("SELECT count(*) AS n FROM cloud_sessions")
    .first<number>("n");
}

describe("custom GitHub OAuth with local D1 and mocked provider HTTP", () => {
  it("exchanges a one-use state/PKCE login, stores only a session hash and revokes it", async () => {
    const upstream = provider();
    const auth = createAuth(env, upstream);
    const attempt = await start(auth);
    expect(attempt.url.searchParams.get("scope")).toBe("read:user");
    const record = await db
      .prepare("SELECT * FROM oauth_attempts WHERE state_hash=?")
      .bind(await hashTestToken(attempt.url.searchParams.get("state")!))
      .first<{ code_verifier: string; browser_hash: string }>();
    expect(record).not.toBeNull();
    const challenge = Buffer.from(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(record!.code_verifier),
      ),
    ).toString("base64url");
    expect(attempt.url.searchParams.get("code_challenge")).toBe(challenge);
    expect(record!.browser_hash).toBe(
      await hashTestToken(attempt.cookie.split("=")[1]),
    );

    const response = await callback(auth, attempt);
    expect(response.headers.get("Location")).toBe("/?builder=1");
    const allCookies = response.headers.getSetCookie();
    expect(allCookies).toHaveLength(2);
    const cookie = allCookies
      .find((c) => c.startsWith("domino_session="))!
      .split(";")[0];
    expect(allCookies.join(";")).toContain("HttpOnly");
    expect(allCookies.join(";")).toContain("SameSite=Lax");
    expect(allCookies.join(";")).not.toContain("Domain=");
    const body = new URLSearchParams(String(upstream.calls[0].init?.body));
    expect(body.get("code_verifier")).toBe(record!.code_verifier);
    expect(body.get("redirect_uri")).toBe(
      TEST_ORIGIN + "/api/auth/callback/github",
    );
    const stored = await db
      .prepare("SELECT token_hash FROM cloud_sessions")
      .first<{ token_hash: string }>();
    expect(stored!.token_hash).toBe(await hashTestToken(cookie.split("=")[1]));
    const session = await auth.getSession(request("/api/me", cookie));
    expect(session).toEqual({ userId: expect.any(String), name: "Tester" });
    const visible = await auth.handler(
      request("/api/auth/get-session", cookie),
    );
    expect(await visible.json()).toEqual({
      user: { id: session!.userId, name: "Tester" },
    });
    expect(visible.headers.get("Cache-Control")).toContain("no-store");
    await auth.handler(request("/api/auth/sign-out", cookie, "POST"));
    expect(await auth.getSession(request("/api/me", cookie))).toBeNull();
    expect(await sessionCount()).toBe(0);
  });

  it("rejects missing/wrong/duplicate browser binding and never replays a consumed state", async () => {
    const upstream = provider(),
      auth = createAuth(env, upstream),
      attempt = await start(auth);
    for (const cookie of [
      "",
      `domino_oauth=${randomTestToken()}`,
      `${attempt.cookie}; ${attempt.cookie}`,
    ]) {
      expect(
        (await callback(auth, attempt, cookie)).headers.get("Location"),
      ).toContain("authError=1");
      expect(upstream.calls).toHaveLength(0);
    }
    const malformed = await auth.handler(
      request(
        `/api/auth/callback/github?code=test&state=${attempt.url.searchParams.get("state")}&state=duplicate`,
        attempt.cookie,
      ),
    );
    expect(malformed.headers.get("Location")).toContain("authError=1");
    expect((await callback(auth, attempt)).headers.get("Location")).toBe(
      "/?builder=1",
    );
    expect((await callback(auth, attempt)).headers.get("Location")).toContain(
      "authError=1",
    );
    expect(upstream.calls).toHaveLength(2);
    expect(await sessionCount()).toBe(1);
  });

  it("rejects expired attempts and expired/duplicate/forged session cookies", async () => {
    const upstream = provider(),
      auth = createAuth(env, upstream),
      attempt = await start(auth);
    await db.prepare("UPDATE oauth_attempts SET expires_at=0").run();
    expect((await callback(auth, attempt)).headers.get("Location")).toContain(
      "authError=1",
    );
    expect(upstream.calls).toHaveLength(0);
    const valid = await callback(auth, await start(auth));
    const cookie = valid.headers
      .getSetCookie()
      .find((c) => c.startsWith("domino_session="))!
      .split(";")[0];
    expect(
      await auth.getSession(request("/", `${cookie}; ${cookie}`)),
    ).toBeNull();
    expect(
      await auth.getSession(
        request("/", `domino_session=${randomTestToken()}`),
      ),
    ).toBeNull();
    await db.prepare("UPDATE cloud_sessions SET expires_at=0").run();
    expect(await auth.getSession(request("/", cookie))).toBeNull();
  });

  it("uses stable GitHub IDs rather than changed login/name/email to retain project ownership", async () => {
    const old = provider(),
      auth = createAuth(env, old);
    const initial = await callback(auth, await start(auth));
    const cookie = initial.headers
      .getSetCookie()
      .find((c) => c.startsWith("domino_session="))!
      .split(";")[0];
    const first = (await auth.getSession(request("/", cookie)))!;
    const changed = createAuth(
      env,
      provider({
        id: 12345,
        login: "renamed",
        name: "New name",
        email: "different@example.test",
      }),
    );
    const again = await callback(changed, await start(changed));
    const nextCookie = again.headers
      .getSetCookie()
      .find((c) => c.startsWith("domino_session="))!
      .split(";")[0];
    expect(await changed.getSession(request("/", nextCookie))).toEqual({
      userId: first.userId,
      name: "New name",
    });
    const other = createAuth(
      env,
      provider({
        id: 67890,
        login: "tester",
        name: "Tester",
        email: "different@example.test",
      }),
    );
    const otherResponse = await callback(other, await start(other));
    const otherCookie = otherResponse.headers
      .getSetCookie()
      .find((c) => c.startsWith("domino_session="))!
      .split(";")[0];
    expect(
      (await other.getSession(request("/", otherCookie)))!.userId,
    ).not.toBe(first.userId);
  });

  it.each([
    "token-error",
    "profile-error",
    "invalid-profile",
    "oversized-profile",
  ])(
    "fails closed for %s without a session or reflected provider details",
    async (failure) => {
      const fetcher: typeof fetch = async (url) => {
        if (String(url).includes("access_token"))
          return failure === "token-error"
            ? json({ error: "provider-private-error" })
            : json({ access_token: "test-token" });
        if (failure === "profile-error")
          return json({ message: "private detail" }, 503);
        if (failure === "oversized-profile")
          return json({ extra: "x".repeat(65_537) });
        return json({ id: 12345, name: "Missing login" });
      };
      const auth = createAuth(env, { fetcher });
      const response = await callback(auth, await start(auth));
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/?builder=1&authError=1");
      expect(await response.text()).toBe("");
      expect(
        response.headers
          .getSetCookie()
          .some((c) => c.startsWith("domino_session=")),
      ).toBe(false);
      expect(await sessionCount()).toBe(0);
    },
  );

  it("accepts a decoded provider response even when encoding headers are retained", async () => {
    const upstream = provider();
    const fetcher: typeof fetch = async (input, init) => {
      const response = await upstream.fetcher(input, init);
      response.headers.set("Content-Encoding", "gzip");
      return response;
    };
    const auth = createAuth(env, { fetcher });
    const response = await callback(auth, await start(auth));
    expect(response.headers.get("Location")).toBe("/?builder=1");
    expect(await sessionCount()).toBe(1);
  });

  it("times out a stalled provider exchange without issuing a session", async () => {
    const fetcher: typeof fetch = async (_url, init) =>
      new Promise((_resolve, reject) => {
        init!.signal!.addEventListener(
          "abort",
          () => reject(new Error("aborted test provider")),
          { once: true },
        );
      });
    const auth = createAuth(env, { fetcher });
    const response = await callback(auth, await start(auth));
    expect(response.headers.get("Location")).toContain("authError=1");
    expect(await sessionCount()).toBe(0);
  }, 15_000);

  it("sets host-only Secure cookies on HTTPS and rejects cross-origin mutations", async () => {
    const origin = "https://demo.example";
    const auth = createAuth({ ...env, AUTH_URL: origin }, provider());
    const attempt = await start(auth, origin);
    expect(attempt.cookie).toMatch(/^__Host-domino_oauth=/);
    expect(attempt.response.headers.getSetCookie()[0]).toMatch(/; Secure/);
    const response = await callback(auth, attempt, attempt.cookie, origin);
    expect(
      response.headers
        .getSetCookie()
        .some(
          (c) =>
            c.startsWith("__Host-domino_session=") &&
            c.includes("Secure") &&
            !c.includes("Domain="),
        ),
    ).toBe(true);
    expect(
      (await auth.handler(request("/api/auth/sign-out", undefined, "POST")))
        .status,
    ).toBe(403);
  });

  it("imports legacy GitHub mappings without changing owners and rejects ambiguous mappings", async () => {
    await db
      .prepare(
        'INSERT INTO "user" (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,?,?,?)',
      )
      .bind("legacy-owner", "Legacy", "legacy@example.test", 1, 0, 0)
      .run();
    for (const id of ["legacy-account-a", "legacy-account-b"]) {
      await db
        .prepare(
          "INSERT INTO account (id,accountId,providerId,userId,createdAt,updatedAt) VALUES (?,?,?,?,?,?)",
        )
        .bind(id, "12345", "github", "legacy-owner", 0, 0)
        .run();
    }
    const migration = await readFile(
      "migrations/0003_github_oauth.sql",
      "utf8",
    );
    const importSql = migration.slice(
      migration.indexOf("INSERT INTO github_identities"),
    );
    await db.prepare(importSql).run();
    expect(
      await db
        .prepare(
          "SELECT user_id FROM github_identities WHERE github_id='12345'",
        )
        .first("user_id"),
    ).toBe("legacy-owner");
    const auth = createAuth(env, provider());
    const response = await callback(auth, await start(auth));
    const cookie = response.headers
      .getSetCookie()
      .find((c) => c.startsWith("domino_session="))!
      .split(";")[0];
    expect((await auth.getSession(request("/", cookie)))!.userId).toBe(
      "legacy-owner",
    );
    await db
      .prepare(
        'INSERT INTO "user" (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,?,?,?)',
      )
      .bind("conflicting-owner", "Other", "other@example.test", 1, 0, 0)
      .run();
    await db
      .prepare(
        "INSERT INTO account (id,accountId,providerId,userId,createdAt,updatedAt) VALUES (?,?,?,?,?,?)",
      )
      .bind("conflicting-account", "12345", "github", "conflicting-owner", 0, 0)
      .run();
    await expect(db.prepare(importSql).run()).rejects.toThrow();
    expect(
      await db
        .prepare(
          "SELECT user_id FROM github_identities WHERE github_id='12345'",
        )
        .first("user_id"),
    ).toBe("legacy-owner");
  });
});
