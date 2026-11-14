import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { demoData } from "../src/data/demo";
import { fileAction } from "./ui-helpers";

test("live demo inputs become a persistent editable network with recovery and JSON exports", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("slider", { name: "Shift from baseline" }).fill("6");
  await page.getByRole("button", { name: "Edit this network" }).click();
  await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+/);
  const projectUrl = page.url();
  await expect(page.getByLabel("Network name", { exact: true })).toHaveValue(demoData.name);
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  const summary = page.getByRole("region", { name: "Simulation summary" });
  await expect(summary).toContainText("1 order at risk");
  await expect(summary).toContainText("2 component units missing");
  await page.getByLabel("Select scenario", { exact: true }).selectOption("scenario:recovery");
  await expect(summary).toContainText("Every order has its required materials");
  const downloaded = page.waitForEvent("download");
  await fileAction(page, "Export scenario report");
  const report = JSON.parse(await readFile((await (await downloaded).path())!, "utf8"));
  expect(report.inputs.alternatives).toEqual(demoData.alternatives);
  expect(report.result.summary.atRiskOrders).toBe(0);
  expect(report.scenario.deliveryOverrides[0].availableDate).toBe("2026-11-23");
  expect(report.dataProvenance.kind).toBe("fictional");
  await expect(page.getByText("Saved on this device", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(projectUrl);
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(summary).toContainText("Every order has its required materials");
  await page.getByLabel("Select scenario", { exact: true }).selectOption("scenario:motor-delay");
  await expect(summary).toContainText("1 order at risk");
  await expect(page.getByRole("region", { name: "Recovery options" })).toBeVisible();
});

test("Northstar example and alternative catalog survive authoring, review, and workspace export", async ({ page }) => {
  page.on("dialog", dialog => dialog.accept());
  await page.goto("/demo");
  await page.getByRole("button", { name: "Build a network", exact: true }).click();
  await fileAction(page, "Northstar demo");
  await expect(page.locator(".react-flow__node")).toHaveCount(40);
  await page.getByRole("button", { name: "Alternatives", exact: true }).click();
  await page.getByLabel("Quantity available", { exact: true }).fill("3");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Scenario requires review" })).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await fileAction(page, "Export workspace JSON");
  const file = await downloaded;
  const workspace = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(workspace.document.alternatives[0].quantity).toBe(3);
  await page.getByRole("button", { name: "Import workspace JSON", exact: true }).setInputFiles((await file.path())!);
  await expect(page.getByText(/Imported workspace/)).toBeVisible();
  await page.getByRole("button", { name: "Alternatives", exact: true }).click();
  await expect(page.getByLabel("Quantity available", { exact: true })).toHaveValue("3");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^Scenario Normal supply/ }).click();
  await page.getByLabel("Select scenario", { exact: true }).selectOption("scenario:recovery");
  await page.keyboard.press("Escape");
  const review = page.getByRole("region", { name: "Scenario requires review" });
  if (await review.locator("details").getAttribute("open") === null) {
    await review.locator("summary").click();
  }
  await page.getByRole("button", { name: "Revalidate scenario", exact: true }).click();
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  const summary = page.getByRole("region", { name: "Simulation summary" });
  await expect(summary).toContainText("Every order has its required materials");
  await page.getByRole("button", { name: "Alternatives", exact: true }).click();
  await page.getByRole("button", { name: /^Delete alternative / }).click();
  await page.getByRole("button", { name: "Confirm delete", exact: true }).click();
  await page.keyboard.press("Escape");
  if (await review.locator("details").getAttribute("open") === null) {
    await review.locator("summary").click();
  }
  await page.getByRole("button", { name: /^Remove alternative / }).click();
  await page.getByRole("button", { name: "Revalidate scenario", exact: true }).click();
  await expect(summary).toContainText("1 order at risk");
});

test("dataset and scenario report JSON can be imported directly as editable networks", async ({ page }) => {
  page.on("dialog", dialog => dialog.accept());
  await page.goto("/demo");
  await page.getByRole("button", { name: "Build a network", exact: true }).click();
  const input = page.getByRole("button", { name: "Import workspace JSON", exact: true });
  await input.setInputFiles("public/examples/domino-demo.json");
  await expect(page.getByLabel("Network name", { exact: true })).toHaveValue(demoData.name);
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  await page.getByLabel("Select scenario", { exact: true }).selectOption("scenario:disruption");
  await expect(page.getByRole("region", { name: "Simulation summary" })).toContainText("1 order at risk");
  const downloaded = page.waitForEvent("download");
  await fileAction(page, "Export scenario report");
  await input.setInputFiles((await (await downloaded).path())!);
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(page.getByRole("region", { name: "Simulation summary" })).toContainText("1 order at risk");
  await expect(page.getByText(/Imported data/)).toBeVisible();
});

test("CSV imports disclose retained demo data and preserve mixed provenance", async ({ page }) => {
  page.on("dialog", dialog => dialog.accept());
  await page.goto("/demo");
  await page.getByRole("button", { name: "Build a network", exact: true }).click();
  await fileAction(page, "Import workspace JSON…");
  await page.getByRole("button", { name: "Import workspace JSON", exact: true }).setInputFiles("public/examples/products.csv");
  await expect(page.getByText(/Mixed demo \+ imported data/)).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await fileAction(page, "Export workspace JSON");
  const workspace = JSON.parse(await readFile((await (await downloaded).path())!, "utf8"));
  expect(workspace.source.origin).toBe("mixed");
  expect(workspace.source.retainedProductBoms).toBe(true);
});

for (const theme of ["light", "dark"]) {
  test(`${theme} narrow editor keeps alternative catalog and exports usable`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.addInitScript(value => localStorage.setItem("dominoos.landing.theme.v2", value), theme);
    await page.goto("/demo");
    await page.getByRole("button", { name: "Edit this network" }).click();
    await page.getByRole("button", { name: "Alternatives", exact: true }).click();
    await expect(page.getByLabel("Quantity available", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Escape");
    await fileAction(page, "Export dataset JSON");
  });
}
