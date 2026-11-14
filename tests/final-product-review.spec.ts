import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { demoData } from "../src/data/demo";
import { fileAction } from "./ui-helpers";

/** Every cloud-only request the guest journey must never make. */
function watchCloudRequests(page: Page) {
  const cloud: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api") || /github\.com$/.test(url.hostname))
      cloud.push(`${request.method()} ${request.url()}`);
  });
  return cloud;
}

const SUMMARY = "Simulation summary";

async function openBuilderImport(page: Page) {
  return page.getByRole("button", {
    name: "Import workspace JSON",
    exact: true,
  });
}

test("hostile numeric import is rejected readably and leaves the active network, scenario and saved project untouched", async ({
  page,
}) => {
  const cloud = watchCloudRequests(page);
  // Each order value is finite; together they overflow to Infinity (exported as null).
  const hostile = {
    ...demoData,
    name: "Hostile totals",
    orders: demoData.orders.map((order) => ({ ...order, value: 1e308 })),
  };
  const valid = {
    ...demoData,
    name: "Valid large values",
    orders: demoData.orders.map((order) => ({ ...order, value: 1e300 })),
  };
  const file = (name: string, body: unknown) => ({
    name,
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(body)),
  });

  // Guest demo: a rejected dataset import keeps the disruption exactly as it was.
  await page.goto("/demo");
  await page
    .getByRole("radio", { name: "Supplier disruption", exact: true })
    .click();
  const banner = page.locator(".outcome-banner");
  await expect(banner).toContainText("€36,000");
  await page
    .getByRole("button", { name: "Import data", exact: true })
    .last()
    .click();
  await page
    .locator("#data-upload")
    .setInputFiles(file("hostile.json", hostile));
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Import rejected");
  await expect(alert).toContainText("not a finite number");
  await expect(alert).toContainText("orders[");
  await expect(
    page.getByText("Fictional demo data", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(banner).toContainText("€36,000");
  await expect(banner).toContainText("2 component units");

  // Saved project: the same file is refused and the persisted draft survives a reload.
  await page.getByRole("button", { name: "Edit this network" }).click();
  await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);
  const projectUrl = page.url();
  const name = page.getByLabel("Network name", { exact: true });
  await expect(name).toHaveValue(demoData.name);
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  const scenarioSelect = page.getByLabel("Select scenario", { exact: true });
  await expect(scenarioSelect).toHaveValue(/^scenario:editable-/);
  const summary = page.getByRole("region", { name: SUMMARY });
  await expect(summary).toContainText("1 order at risk");
  page.on("dialog", (dialog) => dialog.accept());
  await (
    await openBuilderImport(page)
  ).setInputFiles(file("hostile.json", hostile));
  await expect(page.getByRole("alert").first()).toContainText(
    "not a finite number",
  );
  await expect(summary).toContainText("1 order at risk");
  await page.reload();
  await expect(page).toHaveURL(projectUrl);
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(scenarioSelect).toHaveValue(/^scenario:editable-/);
  await expect(summary).toContainText("1 order at risk");
  await expect(summary).toContainText("2 component units missing");

  // Ordinary large finite values remain valid.
  await (
    await openBuilderImport(page)
  ).setInputFiles(file("valid.json", valid));
  await expect(page.getByLabel("Network name", { exact: true })).toHaveValue(
    "Valid large values",
  );
  expect(cloud).toEqual([]);
});

test("guest journey at 1366x768: shortage, evidence, recovery, saved copy, export and import", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const cloud = watchCloudRequests(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());

  // Landing: the demo is the primary action; the project library is secondary.
  await page.goto("/");
  const primary = page
    .getByRole("link", { name: "Explore the demo", exact: true })
    .first();
  await expect(primary).toHaveAttribute("href", "/demo");
  await expect(
    page.getByRole("link", { name: "Open projects", exact: true }).first(),
  ).toHaveAttribute("href", "/projects");
  const box = (await primary.boundingBox())!;
  expect(box.y + box.height).toBeLessThan(768);
  await primary.click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(
    page.getByRole("heading", { name: "10 of 10 orders covered" }),
  ).toBeVisible();

  // The planned receipt covers all ten orders; the first short date breaks ORD-102.
  await expect(page.getByLabel("Receipt", { exact: true })).toContainText(
    "PO-101 · Servo motor · 17 Nov",
  );
  await page.getByRole("radio", { name: "First short, 23 Nov" }).click();
  const banner = page.locator(".outcome-banner");
  await expect(banner).toContainText("€36,000");
  await expect(banner).toContainText("2 component units");

  // Inspect the evidence behind the exposure.
  await page.locator('[data-id="order:ORD-102"]').click();
  const evidence = page.getByRole("region", {
    name: "Order allocation evidence",
  });
  await expect(evidence).toContainText("Requires 4, with 2 available");
  await expect(evidence).toContainText("2026-11-23");

  await page.getByRole("button", { name: "Close node details" }).click();

  // Compare options and apply the Vector purchase scenario; the receipt stays on 23 Nov.
  const options = page.getByRole("region", { name: "Recovery options" });
  await expect(options.locator("article")).toHaveCount(2);
  await options
    .locator("article")
    .filter({ hasText: "Use Vector Components" })
    .getByRole("button", { name: "Apply recovery" })
    .click();
  await expect(
    page
      .getByRole("heading", { name: /10 of 10 orders covered|Every order/ })
      .first(),
  ).toBeVisible();
  const notice = page.locator(".notice");
  await expect(notice).toContainText(
    "ORD-102 regained material coverage in this simulation",
  );
  await expect(notice).toContainText("PO-101 remains late (23 Nov)");
  await expect(notice).toContainText(
    "No purchase or supplier confirmation was made",
  );
  await expect(
    page.getByLabel("Available date", { exact: true }).first(),
  ).toHaveValue("2026-11-23");

  // Edit this network: a saved local copy that survives reload and library navigation.
  await page.getByRole("button", { name: "Edit this network" }).click();
  await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);
  const projectUrl = page.url();
  const name = page.getByLabel("Network name", { exact: true });
  await expect(name).toHaveValue(demoData.name);
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  const summary = page.getByRole("region", { name: SUMMARY });
  const scenarios = page.getByLabel("Select scenario", { exact: true });
  await expect(summary).toContainText("Every order has its required materials");
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(projectUrl);
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page
    .getByRole("link", { name: new RegExp(demoData.name) })
    .first()
    .click();
  await expect(page).toHaveURL(projectUrl);
  await expect(name).toHaveValue(demoData.name);
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(summary).toContainText("Every order has its required materials");

  // Export the workspace, then import it as a separate copy.
  const download = page.waitForEvent("download");
  await fileAction(page, "Export workspace JSON");
  const exported = await download;
  const body = await readFile((await exported.path())!);
  const workspace = JSON.parse(body.toString("utf8"));
  expect(workspace.document.name).toBe(demoData.name);
  expect(workspace.scenarios.length).toBeGreaterThanOrEqual(2);

  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page
    .getByRole("button", { name: "New project", exact: true })
    .first()
    .click();
  const modal = page.getByRole("dialog", { name: "New project", exact: true });
  await modal.getByLabel("Project files", { exact: true }).setInputFiles({
    name: exported.suggestedFilename(),
    mimeType: "application/json",
    buffer: body,
  });
  await modal.getByLabel("Project name", { exact: true }).fill("Imported copy");
  await modal
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  const copyUrl = page.url();
  await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);
  expect(copyUrl).not.toBe(projectUrl);
  await expect(
    page.getByRole("main", { name: "Supply chain builder" }),
  ).toContainText("Imported copy");
  await expect(name).toHaveValue("Imported copy");
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(summary).toContainText("Every order has its required materials");
  for (const label of [
    "Normal supply",
    "Motor receipt delayed",
    "Motor delay with approved substitute",
    "Vector Components recovery",
  ])
    await expect(scenarios.locator("option", { hasText: label })).toHaveCount(
      1,
    );
  await expect(
    scenarios.locator("option", { hasText: "Vector Components recovery" }),
  ).toHaveJSProperty("selected", true);
  const names = workspace.scenarios.map(
    (record: { scenario: { name: string } }) => record.scenario.name,
  );
  expect(names).toContain("Vector Components recovery");
  expect(workspace.selectedScenarioId).toBe(
    workspace.scenarios.find(
      (record: { scenario: { name: string } }) =>
        record.scenario.name === "Vector Components recovery",
    ).scenario.id,
  );

  // Removing the copy leaves the original project in the library, and it still opens.
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "Remove Imported copy" }).click();
  await page
    .getByRole("dialog", { name: "Remove project?" })
    .getByRole("button", { name: "Remove project" })
    .click();
  await expect(page.getByRole("link", { name: /Imported copy/ })).toHaveCount(
    0,
  );
  await page.reload();
  await expect(page.getByRole("link", { name: /Imported copy/ })).toHaveCount(
    0,
  );
  await page
    .getByRole("link", { name: new RegExp(demoData.name) })
    .first()
    .click();
  await expect(page).toHaveURL(projectUrl);
  await expect(name).toHaveValue(demoData.name);

  // Guest mode: no sign-in control and no cloud traffic anywhere in the journey.
  await expect(page.getByText(/sign in with github/i)).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(cloud).toEqual([]);
});
