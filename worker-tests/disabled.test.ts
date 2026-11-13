import { createTestHarness } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Exercise built-asset routing with the checked-in cloud-disabled deployment.
const server = createTestHarness({
  workers: [{ configPath: "./wrangler.jsonc" }],
});
beforeAll(async () => {
  await server.listen();
}, 60_000);
afterAll(async () => {
  await server.close();
});

describe("cloud-disabled deployment", () => {
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
