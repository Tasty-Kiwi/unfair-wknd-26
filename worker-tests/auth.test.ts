import { canonicalizeCloudWorkspace } from "../src/lib/cloud/contracts";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  TEST_ORIGIN,
  createCloudProject,
  createCloudTestHarness,
  createSampleWorkspace,
  resetCloudTables,
  seedSessionCookie,
  sendWorkerRequest,
} from "./helpers";

const origin = TEST_ORIGIN;
const { server, worker } = createCloudTestHarness();
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
  await resetCloudTables(db);
});
function request(
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
  requestOrigin = origin,
) {
  return sendWorkerRequest(server, path, {
    method,
    body,
    cookie,
    origin: requestOrigin,
  });
}
function cookies(r: Awaited<ReturnType<typeof request>>) {
  return r.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
}
async function login(email: string) {
  return (await seedSessionCookie(db, email)).cookie;
}
const workspace = createSampleWorkspace;
function create(cookie: string, value = workspace()) {
  return createCloudProject(server, cookie, { workspace: value });
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
