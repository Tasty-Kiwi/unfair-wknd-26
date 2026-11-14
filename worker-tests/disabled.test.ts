import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Every default configuration must serve the browser app without a D1 binding.
describe.each([
  "./wrangler.jsonc",
  "./wrangler.local.jsonc",
  "./wrangler.staging.jsonc",
])("cloud-disabled default %s", (configPath) => {
  const server = createTestHarness({ workers: [{ configPath }] });
  beforeAll(async () => {
    await server.listen();
  }, 60_000);
  afterAll(async () => {
    await server.close();
  });
  it("has no database and rejects OAuth, sessions and project operations", async () => {
    const env = await server.getWorker<Env>().getEnv();
    expect(env.DB).toBeUndefined();
    for (const [path, method] of [
      ["/api/me", "GET"],
      ["/api/projects", "POST"],
      ["/api/auth/sign-in/social", "POST"],
      ["/api/auth/callback/github?code=unused&state=unused", "GET"],
      ["/api/auth/get-session", "GET"],
      ["/api/auth/sign-out", "POST"],
    ]) {
      const response = await server.fetch(
        "https://domino-os.tasty-kiwi.workers.dev" + path,
        { method },
      );
      expect(response.status).toBe(503);
      expect(response.headers.get("location")).toBeNull();
    }
  });
  it("serves public SPA routes and assets without auth or a database", async () => {
    for (const path of ["/", "/landing", "/?builder=1"]) {
      const response = await server.fetch(
        "https://domino-os.tasty-kiwi.workers.dev" + path,
        {
          headers: { Accept: "text/html", "Sec-Fetch-Mode": "navigate" },
        },
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");
    }
  });
  it("returns JSON for bare and unknown API paths even on browser navigation", async () => {
    for (const path of ["/api", "/api/", "/api/nope", "/api/projects/x/y"]) {
      const response = await server.fetch(
        "https://domino-os.tasty-kiwi.workers.dev" + path,
        {
          headers: { Accept: "text/html", "Sec-Fetch-Mode": "navigate" },
        },
      );
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain(
        "application/json",
      );
    }
    const response = await server.fetch(
      "https://domino-os.tasty-kiwi.workers.dev/api/projects",
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toContain("application/json");
    const health = await server.fetch(
      "https://domino-os.tasty-kiwi.workers.dev/api/health",
    );
    expect(await health.json()).toEqual({ ok: true, cloudEnabled: false });
  });
});
