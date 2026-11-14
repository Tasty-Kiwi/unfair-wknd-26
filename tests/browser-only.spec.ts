import { test, expect } from "@playwright/test";
import { fileAction } from "./ui-helpers";

for (const backend of ["unavailable", "enabled"] as const) {
  test(`browser-only projects make no API requests with an ${backend} backend`, async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname.startsWith("/api") || url.hostname === "github.com")
        requests.push(request.url());
    });
    await page.route("**/api/**", (route) =>
      backend === "enabled"
        ? route.fulfill({ json: { ok: true, cloudEnabled: true } })
        : route.abort(),
    );
    await page.goto("/");
    await page
      .getByRole("link", { name: "Open projects", exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "New project", exact: true })
      .first()
      .click();
    const dialog = page.getByRole("dialog", {
      name: "New project",
      exact: true,
    });
    await dialog
      .getByRole("radio", { name: "Start blank", exact: true })
      .click();
    await dialog
      .getByLabel("Project name", { exact: true })
      .fill("Browser-only network");
    await dialog
      .getByRole("button", { name: "Create project", exact: true })
      .click();
    const builder = page.getByRole("main", { name: "Supply chain builder" });
    await builder
      .getByLabel("Network name", { exact: true })
      .fill("Saved without cloud");
    await fileAction(builder, "Save workspace");
    await page.reload();
    await expect(
      builder.getByLabel("Network name", { exact: true }),
    ).toHaveValue("Saved without cloud");
    await expect(
      builder.getByRole("region", { name: "Cloud", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: /Sign in with GitHub|Save to cloud|Retry cloud connection/,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByText(/Cloud is unavailable|GitHub sign-in did not finish/),
    ).toHaveCount(0);
    const download = page.waitForEvent("download");
    await fileAction(builder, "Export workspace JSON");
    expect((await download).suggestedFilename()).toMatch(/\.json$/);
    await page.goto("/?builder=1&authError=1");
    await expect(builder).toBeVisible();
    await expect(
      builder.getByText(/Cloud is unavailable|GitHub sign-in did not finish/),
    ).toHaveCount(0);
    expect(requests).toEqual([]);
  });
}
