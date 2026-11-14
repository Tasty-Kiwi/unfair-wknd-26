import { test, expect } from "@playwright/test";
import { openOrderBook } from "./ui-helpers";

test("blank builder offers a starting point before requested validation", async ({
  page,
}) => {
  await page.goto("/?builder=1");
  const checks = page.locator(".builder-checks");
  await expect(checks).toContainText("Start with Core example");
  await expect(checks.locator(".builder-issues")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(checks).toContainText("Network name must not be blank");
  await expect(
    page.getByText("Your network is still in progress", { exact: true }),
  ).toBeVisible();
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Core example", exact: true }).click();
  await page
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(
    page.locator(".supply-node strong").filter({ hasText: "Customer A" }),
  ).toBeVisible();
  await expect(
    page.locator(".timeline-label").filter({ hasText: "Customer A needs 6" }),
  ).toBeVisible();
  await expect(page.locator(".impact-panel__subtitle")).toContainText(
    "Customer A",
  );
});

test("recovery announces modeled coverage and keeps the original receipt late", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("radio", { name: "Supplier disruption", exact: true })
    .click();
  await expect(page.locator(".outcome-banner")).toContainText("2 are missing");
  await page
    .locator(".recovery-option")
    .filter({ hasText: "Use Vector Components" })
    .getByRole("button", { name: "Apply recovery" })
    .click();
  await expect(
    page.getByText(/ORD-102 regained material coverage in this simulation/),
  ).toBeVisible();
  await expect(page.getByText(/PO-101 remains late/)).toBeVisible();
  await openOrderBook(page);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export report JSON", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "needtrace-scenario-report.json",
  );
  await page
    .getByRole("radio", { name: "Normal operations", exact: true })
    .click();
  await expect(
    page.getByText(/ORD-102 regained material coverage in this simulation/),
  ).toHaveCount(0);
});

for (const theme of ["light", "dark"]) {
  test(`${theme}: simulator header controls do not overlap at responsive widths`, async ({
    page,
  }) => {
    await page.addInitScript(
      (t) => localStorage.setItem("dominoos.landing.theme.v2", t),
      theme,
    );
    await page.goto("/demo");
    await expect(page.locator(".topbar")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    for (const width of [2000, 1440, 1366, 1200, 1100, 1024, 720, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const collisions = await page.locator(".topbar").evaluate((header) => {
        const items = Array.from(
          header.querySelectorAll(
            ".wordmark, .scenario-switch button, .dataset-line > span, .top-actions > [data-slot='button']",
          ),
        )
          .map((element) => ({
            label:
              element.textContent?.trim() || element.getAttribute("aria-label"),
            rect: element.getBoundingClientRect(),
          }))
          .filter(({ rect }) => rect.width > 1 && rect.height > 1);
        const bounds = header.getBoundingClientRect();
        const problems: string[] = [];
        for (let i = 0; i < items.length; i++) {
          const a = items[i];
          if (a.rect.left < bounds.left - 1 || a.rect.right > bounds.right + 1)
            problems.push(`${a.label} outside header`);
          for (const b of items.slice(i + 1)) {
            if (
              Math.min(a.rect.right, b.rect.right) -
                Math.max(a.rect.left, b.rect.left) >
                1 &&
              Math.min(a.rect.bottom, b.rect.bottom) -
                Math.max(a.rect.top, b.rect.top) >
                1
            )
              problems.push(`${a.label} overlaps ${b.label}`);
          }
        }
        return problems;
      });
      expect(collisions, `${theme} header at ${width}px`).toEqual([]);
    }
    await page
      .getByRole("button", { name: "Import data", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test(`${theme}: selected scenario has readable text contrast`, async ({
    page,
  }) => {
    await page.addInitScript(
      (t) => localStorage.setItem("dominoos.landing.theme.v2", t),
      theme,
    );
    await page.goto("/demo");
    const selected = page.getByRole("radio", {
      name: "Approved recovery",
      exact: true,
    });
    await selected.click();
    const ratio = () =>
      selected.evaluate((e) => {
        const s = getComputedStyle(e);
        const luminance = (color: string) => {
          const channels = color
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number)
            .map((v) => {
              const c = v / 255;
              return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            });
          return (
            0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
          );
        };
        const a = luminance(s.color),
          b = luminance(s.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
    await expect.poll(ratio).toBeGreaterThanOrEqual(4.5);
  });
}

test("partial recovery reports the remaining shortage without claiming restored coverage", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("radio", { name: "Supplier disruption", exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .first()
    .fill("1");
  await page
    .getByRole("spinbutton", { name: "Quantity", exact: true })
    .first()
    .press("Tab");
  await page
    .locator(".recovery-option")
    .filter({ hasText: "Restore PO-101 timing" })
    .getByRole("button", { name: "Apply recovery" })
    .click();
  await expect(
    page.getByText(
      /1 material unit\(s\) still missing across 1 order\(s\) at risk/,
    ),
  ).toBeVisible();
  await expect(
    page.getByText(/regained material coverage in this simulation/),
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "1 order at risk",
  );
});
