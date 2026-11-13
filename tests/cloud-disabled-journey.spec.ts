import { test, expect } from "@playwright/test";
import { createTestHarness } from "wrangler";

// Exercise actual production configuration and built assets; no API mocks or D1.
const server = createTestHarness({
  workers: [{ configPath: "./wrangler.jsonc" }],
});
let origin: string;

test.beforeAll(async () => {
  origin = (await server.listen()).url.origin;
});

test.afterAll(async () => {
  await server.close();
});

test("cloud-disabled production hides auth controls and preserves guest editing across reload", async ({
  page,
}) => {
  const apiCalls: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/api/")) apiCalls.push(path);
  });
  const health = page.waitForResponse(
    (response) => response.url() === origin + "/api/health",
  );
  // Even an auth return URL must not call /api/me when cloud is disabled.
  await page.goto(origin + "/?builder=1");
  expect(await (await health).json()).toEqual({
    ok: true,
    cloudEnabled: false,
  });
  const builder = page.getByRole("main", { name: "Supply chain builder" });
  for (const name of ["Sign in with GitHub", "My projects", "Save to cloud"]) {
    await expect(
      builder.getByRole("button", { name, exact: true }),
    ).toHaveCount(0);
  }
  await builder
    .getByLabel("Network name", { exact: true })
    .fill("Guest work stays local");
  await expect(builder.getByRole("status").first()).toContainText(
    "Saved locally",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dominoos.builder.workspace.v1")!)
            .document.name,
      ),
    )
    .toBe("Guest work stays local");
  await page.reload();
  await expect(builder).toBeVisible();
  await expect(page).toHaveURL(/builder=1/);
  await expect(builder.getByLabel("Network name", { exact: true })).toHaveValue(
    "Guest work stays local",
  );
  expect(apiCalls.length).toBeGreaterThan(0);
  expect(apiCalls.every((path) => path === "/api/health")).toBe(true);
  await expect(
    builder.getByRole("button", { name: "Sign in with GitHub" }),
  ).toHaveCount(0);
});
