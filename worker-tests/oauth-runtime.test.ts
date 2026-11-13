import { afterAll, beforeAll, expect, it } from "vitest";
import { createTestHarness } from "wrangler";
import { resolve } from "node:path";

const origin = "http://localhost:5173";
const server = createTestHarness({
  workers: [
    {
      config: {
        name: "oauth-runtime-test",
        main: resolve("worker-tests/fixtures/oauth-runtime.ts"),
        compatibility_date: "2026-11-12",
        vars: {
          AUTH_URL: origin,
          GITHUB_CLIENT_ID: "test-client",
          GITHUB_CLIENT_SECRET: "test-secret",
        },
        d1_databases: [
          {
            binding: "DB",
            database_name: "oauth-runtime-test",
            database_id: "00000000-0000-0000-0000-000000000002",
            migrations_dir: resolve("migrations"),
          },
        ],
      },
    },
  ],
});
beforeAll(async () => {
  await server.listen();
  await server.getWorker<Env>().applyD1Migrations("DB");
});
afterAll(async () => {
  await server.close();
});

it.each([false, true])(
  "runs provider request construction inside workerd (redirect response: %s)",
  async (redirect) => {
    const start = await server.fetch(origin + "/api/auth/sign-in/social", {
      method: "POST",
      headers: { Origin: origin },
    });
    expect(start.status).toBe(200);
    const { url } = (await start.json()) as { url: string };
    const state = new URL(url).searchParams.get("state")!;
    const browserCookie = start.headers.getSetCookie()[0].split(";")[0];
    const callback = await server.fetch(
      origin + "/api/auth/callback/github?code=test-code&state=" + state,
      {
        headers: {
          Cookie: browserCookie,
          ...(redirect ? { "X-Test-Provider-Redirect": "1" } : {}),
        },
        redirect: "manual",
      },
    );
    expect(callback.status).toBe(302);
    expect(callback.headers.get("Location")).toBe(
      redirect ? "/?builder=1&authError=1" : "/?builder=1",
    );
    const session = callback.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith("domino_session="));
    if (redirect) expect(session).toBeUndefined();
    else {
      expect(session).toBeDefined();
      const me = await server.fetch(origin + "/api/auth/get-session", {
        headers: { Cookie: session!.split(";")[0] },
      });
      expect(await me.json()).toEqual({
        user: { id: expect.any(String), name: "Runtime test" },
      });
    }
  },
);
