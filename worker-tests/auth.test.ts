import { createTestHarness } from "wrangler";
import { serializeSignedCookie } from "better-call";
import { canonicalizeCloudWorkspace } from "../src/lib/cloud/contracts";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createCoreExample } from "../src/lib/builder/factories";
import type { BuilderWorkspaceV1 } from "../src/lib/builder/types";
const origin = "http://localhost:5173";
// Test-only secrets; no deployed identity override or provider credentials.
const secret = "test-only-session-signing-secret-at-least-32-characters";
const server = createTestHarness({
  workers: [
    {
      configPath: "./wrangler.local.jsonc",
      secrets: {
        BETTER_AUTH_SECRET: secret,
        GITHUB_CLIENT_ID: "test-client-id",
        GITHUB_CLIENT_SECRET: "test-client-secret",
      },
    },
  ],
});
const worker = server.getWorker<Env>();
let db: D1Database;
beforeAll(async () => {
  await server.listen();
  await worker.applyD1Migrations("DB");
  db = (await worker.getEnv()).DB;
}, 60_000);
afterAll(async () => {
  await server.close();
});
beforeEach(async () => {
  for (const table of [
    "projects",
    "session",
    "account",
    "verification",
    "user",
    "rateLimit",
  ])
    await db.prepare(`DELETE FROM "${table}"`).run();
});
function request(
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
  requestOrigin = origin,
) {
  return server.fetch(origin + path, {
    method,
    redirect: "manual",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      Origin: requestOrigin,
      "CF-Connecting-IP": "192.0.2.10",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
function cookies(r: Response) {
  return r.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
}
// Seed real local D1 session rows and sign the cookie with Better Auth's cookie
// library. These tests exercise production session verification and authorization,
// but do not claim that GitHub issued an OAuth authorization code.
async function login(email: string) {
  const id = crypto.randomUUID(),
    token = crypto.randomUUID(),
    now = Date.now();
  await db
    .prepare(
      'INSERT INTO "user" (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?, ?, ?, 1, ?, ?)',
    )
    .bind(id, "Test User", email, now, now)
    .run();
  await db
    .prepare(
      "INSERT INTO session (id,expiresAt,token,createdAt,updatedAt,userId) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), now + 86_400_000, token, now, now, id)
    .run();
  return (
    await serializeSignedCookie("better-auth.session_token", token, secret, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
  ).split(";")[0];
}
function workspace(): BuilderWorkspaceV1 {
  return {
    format: "dominoos-builder-workspace",
    version: 1,
    document: createCoreExample(),
    scenarios: [
      {
        scenario: {
          id: "saved-delay",
          name: "Saved draft scenario",
          deliveryOverrides: [],
          alternatives: [],
        },
        validatedNetworkKey: null,
        receiptSnapshots: [],
      },
    ],
    selectedScenarioId: "saved-delay",
    workingScenario: {
      scenario: {
        id: "saved-delay",
        name: "Saved draft scenario",
        deliveryOverrides: [],
        alternatives: [],
      },
      validatedNetworkKey: null,
      receiptSnapshots: [],
    },
    source: { origin: "fictional", openedFromFile: true },
  };
}
async function create(cookie: string, value = workspace()) {
  const r = await request(
    "/api/projects",
    "POST",
    { name: "Sample", workspace: value },
    cookie,
  );
  expect(r.status).toBe(201);
  return ((await r.json()) as { project: { id: string; version: number } })
    .project;
}
describe("real Better Auth and native D1 HTTP", () => {
  it("verifies database sessions, returns no tokens and revokes sessions on signout", async () => {
    expect((await request("/api/me")).status).toBe(401);
    const cookie = await login("person@example.test");
    const me = await request("/api/me", "GET", undefined, cookie);
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({
      user: { id: expect.any(String), name: "Test User" },
    });
    const session = await request(
      "/api/auth/get-session",
      "GET",
      undefined,
      cookie,
    );
    expect(session.status).toBe(200);
    const data = (await session.json()) as { user: object; session?: object };
    expect(data.user).not.toHaveProperty("email");
    expect(data.session).not.toHaveProperty("token");
    expect(data.session).not.toHaveProperty("ipAddress");
    expect(session.headers.get("cache-control")).toContain("no-store");
    const out = await request("/api/auth/sign-out", "POST", {}, cookie);
    expect(out.status).toBe(200);
    expect(out.headers.getSetCookie().join(";")).toMatch(/Max-Age=0/i);
    expect((await request("/api/me", "GET", undefined, cookie)).status).toBe(
      401,
    );
    expect(
      await db.prepare("SELECT count(*) AS n FROM session").first("n"),
    ).toBe(0);
  });
  it("rejects forged and expired cookies and all password auth paths", async () => {
    expect(
      (
        await request(
          "/api/me",
          "GET",
          undefined,
          "better-auth.session_token=forged",
        )
      ).status,
    ).toBe(401);
    const cookie = await login("expired@example.test");
    await db.prepare("UPDATE session SET expiresAt = 0").run();
    expect((await request("/api/me", "GET", undefined, cookie)).status).toBe(
      401,
    );
    for (const path of [
      "sign-in/email",
      "sign-up/email",
      "reset-password",
      "change-email",
      "delete-user",
    ])
      expect((await request("/api/auth/" + path, "POST", {})).status).toBe(404);
    expect(
      (
        await request(
          "/api/auth/sign-in/social",
          "POST",
          { provider: "github" },
          undefined,
          "https://evil.example",
        )
      ).status,
    ).toBe(403);
  });
  it("creates GitHub authorization state with least identity scopes and rejects alternate flows", async () => {
    const started = await request("/api/auth/sign-in/social", "POST", {
      provider: "github",
    });
    expect(started.status).toBe(200);
    const payload = (await started.json()) as {
      url: string;
      redirect: boolean;
    };
    const url = new URL(payload.url);
    expect(url.origin + url.pathname).toBe(
      "https://github.com/login/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("test-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(
      origin + "/api/auth/callback/github",
    );
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    expect(url.searchParams.get("scope")?.split(" ").sort()).toEqual([
      "read:user",
      "user:email",
    ]);
    const stateCookies = started.headers.getSetCookie().join(";");
    expect(stateCookies).toMatch(/HttpOnly/i);
    expect(stateCookies).toMatch(/SameSite=Lax/i);
    expect(stateCookies).not.toMatch(/Domain=/i);
    for (const body of [
      { provider: "google" },
      { provider: "github", idToken: { token: "forged" } },
      { provider: "github", callbackURL: "https://evil.example" },
      { provider: "github", scopes: ["repo"] },
    ])
      expect(
        (await request("/api/auth/sign-in/social", "POST", body)).status,
      ).toBe(400);
    for (const path of [
      "/api/auth/callback/github?code=forged",
      "/api/auth/callback/github?code=forged&state=forged",
    ]) {
      const callback = await request(path);
      expect(callback.status).toBe(302);
      expect(callback.headers.get("location")).toContain(
        "/?builder=1&authError=1",
      );
      expect(cookies(callback)).not.toContain("session_token");
    }
    expect(
      await db.prepare("SELECT count(*) AS n FROM session").first("n"),
    ).toBe(0);
  });
  it("enforces the persistent OAuth start limiter through the actual HTTP handler", async () => {
    for (let i = 0; i < 10; i++)
      expect(
        (
          await request("/api/auth/sign-in/social", "POST", {
            provider: "github",
          })
        ).status,
      ).toBe(200);
    expect(
      (
        await request("/api/auth/sign-in/social", "POST", {
          provider: "github",
        })
      ).status,
    ).toBe(429);
    expect(
      await db.prepare("SELECT count(*) AS n FROM rateLimit").first("n"),
    ).toBeGreaterThan(0);
  });
  it("restores full workspaces, denies the other account and permits only one concurrent CAS save", async () => {
    const one = await login("owner@example.test"),
      two = await login("other@example.test");
    const value = workspace(),
      project = await create(one, value);
    const opened = await request(
      "/api/projects/" + project.id,
      "GET",
      undefined,
      one,
    );
    expect(
      ((await opened.json()) as { project: { workspace: unknown } }).project
        .workspace,
    ).toEqual(value);
    const ownList = await request("/api/projects", "GET", undefined, one);
    const listed = (await ownList.json()) as { projects: object[] };
    expect(listed.projects).toHaveLength(1);
    expect(listed.projects[0]).not.toHaveProperty("workspace");
    const list = await request("/api/projects", "GET", undefined, two);
    expect(((await list.json()) as { projects: unknown[] }).projects).toEqual(
      [],
    );
    expect(
      (await request("/api/projects/" + project.id, "GET", undefined, two))
        .status,
    ).toBe(404);
    const body = { name: "Updated", workspace: value, expectedVersion: 1 };
    expect(
      (await request("/api/projects/" + project.id, "PUT", body, two)).status,
    ).toBe(404);
    const saved = await Promise.all([
      request("/api/projects/" + project.id, "PUT", body, one),
      request("/api/projects/" + project.id, "PUT", body, one),
    ]);
    expect(saved.map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it("enforces an atomic 20-project quota and a separate creation rate", async () => {
    const cookie = await login("quota@example.test");
    const me = await request("/api/me", "GET", undefined, cookie);
    const owner = ((await me.json()) as { user: { id: string } }).user.id;
    for (let i = 0; i < 19; i++)
      await db
        .prepare("INSERT INTO projects VALUES (?, ?, ?, ?, 1, ?, ?)")
        .bind(
          crypto.randomUUID(),
          owner,
          "Old",
          JSON.stringify(workspace()),
          "2020-01-01T00:00:00.000Z",
          "2020-01-01T00:00:00.000Z",
        )
        .run();
    const saved = await Promise.all([
      request(
        "/api/projects",
        "POST",
        { name: "Last", workspace: workspace() },
        cookie,
      ),
      request(
        "/api/projects",
        "POST",
        { name: "Last", workspace: workspace() },
        cookie,
      ),
    ]);
    expect(saved.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      await db.prepare("SELECT count(*) AS n FROM projects").first("n"),
    ).toBe(20);
    await db.prepare("DELETE FROM projects").run();
    for (let i = 0; i < 5; i++) await create(cookie);
    expect(
      (
        await request(
          "/api/projects",
          "POST",
          { name: "Sixth", workspace: workspace() },
          cookie,
        )
      ).status,
    ).toBe(429);
  });
  it("stores a 1 MB bound parameter and rejects one more UTF-8 byte without replacing it", async () => {
    const cookie = await login("boundary@example.test"),
      value = workspace();
    value.document.name = "";
    const overhead = canonicalizeCloudWorkspace(value).bytes;
    value.document.name = "x".repeat(1_000_000 - overhead);
    expect(canonicalizeCloudWorkspace(value).bytes).toBe(1_000_000);
    const project = await create(cookie, value);
    const tooLarge = structuredClone(value);
    tooLarge.document.name += "x";
    const failed = await request(
      "/api/projects/" + project.id,
      "PUT",
      {
        name: "Still here",
        expectedVersion: 1,
        workspace: tooLarge,
      },
      cookie,
    );
    expect(failed.status).toBe(413);
    const stored = await request(
      "/api/projects/" + project.id,
      "GET",
      undefined,
      cookie,
    );
    expect(
      (
        (await stored.json()) as {
          project: { version: number; workspace: unknown };
        }
      ).project,
    ).toMatchObject({ version: 1, workspace: value });
  });
  it("rejects spoofed owners, new workspace versions and oversize input without writing", async () => {
    const cookie = await login("validation@example.test"),
      value = workspace();
    expect(
      (
        await request(
          "/api/projects",
          "POST",
          { name: "Bad", workspace: value, owner_id: "forged" },
          cookie,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await request(
          "/api/projects",
          "POST",
          { name: "Bad", workspace: { ...value, version: 2 } },
          cookie,
        )
      ).status,
    ).toBe(400);
    value.document.name = "x".repeat(1_000_001);
    expect(
      (
        await request(
          "/api/projects",
          "POST",
          { name: "Large", workspace: value },
          cookie,
        )
      ).status,
    ).toBe(413);
    expect(
      await db.prepare("SELECT count(*) AS n FROM projects").first("n"),
    ).toBe(0);
    for (const path of ["/api", "/api/", "/api/nope"]) {
      const r = await request(path);
      expect(r.status).toBe(404);
      expect(r.headers.get("content-type")).toContain("application/json");
    }
  });
});
