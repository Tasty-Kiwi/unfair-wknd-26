import { test, expect } from "@playwright/test";
import { fileAction } from "./ui-helpers";
for (const theme of ["light", "dark"] as const)
  for (const width of [1440, 1366, 1024, 390]) {
    test(`${theme} ${width}: shared theme, branded guest routes and import safeguards`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
      await page.goto("/landing");
      await expect(page).toHaveTitle(/Needtrace/);
      await page
        .getByRole("button", {
          name: `${theme === "dark" ? "Dark" : "Light"} mode`,
          exact: true,
        })
        .click();
      await page
        .getByRole("link", { name: "Open projects", exact: true })
        .first()
        .click();
      await page.getByRole("link", { name: "Open demo project" }).click();
      await expect(
        page.getByRole("link", { name: "Needtrace home", exact: true }),
      ).toBeVisible();
      expect(
        await page
          .locator("html")
          .evaluate((e) => e.classList.contains("dark")),
      ).toBe(theme === "dark");
      await page.reload();
      expect(
        await page
          .locator("html")
          .evaluate((e) => e.classList.contains("dark")),
      ).toBe(theme === "dark");
      await page
        .getByRole("button", { name: "Import data", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toContainText("not saved");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await page.goto("/?builder=1");
      await expect(
        page.getByRole("main", { name: "Supply chain builder" }),
      ).toContainText("Needtrace");
      expect(
        await page
          .locator("html")
          .evaluate((e) => e.classList.contains("dark")),
      ).toBe(theme === "dark");
      await page
        .getByRole("button", { name: "Core example", exact: true })
        .click();
      await fileAction(page, "Save workspace");
      await expect(
        page.getByRole("button", { name: "Run simulation", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page
        .getByRole("button", {
          name: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
          exact: true,
        })
        .click();
      await page.goto("/landing");
      await expect(page.locator(".lp-page")).toHaveAttribute(
        "data-theme",
        theme === "dark" ? "light" : "dark",
      );
      await page
        .getByRole("link", { name: "Explore the demo", exact: true })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: "Your projects" }),
      ).toBeVisible();
      await page.getByRole("link", { name: /Motor assembly network/ }).click();
      await expect(
        page.getByRole("main", { name: "Supply chain builder" }),
      ).toBeVisible();
    });
  }
test("Needtrace export name retains backward-compatible workspace envelope", async ({
  page,
}) => {
  await page.goto("/?builder=1");
  await page.getByRole("button", { name: "Core example", exact: true }).click();
  const dl = page.waitForEvent("download");
  await fileAction(page, "Export workspace JSON");
  const download = await dl;
  expect(download.suggestedFilename()).toBe("needtrace-workspace.json");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const data = JSON.parse(Buffer.concat(chunks).toString());
  expect(data.format).toBe("dominoos-builder-workspace");
  expect(data.version).toBe(1);
});
