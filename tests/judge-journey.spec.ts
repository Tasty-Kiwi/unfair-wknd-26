import { test, expect } from "@playwright/test";

test("judge causes a disruption, audits allocation, and resolves it with live inputs", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const summary = page.getByRole("region", { name: "Simulation summary" });
  await expect(summary).toContainText("All material requirements covered");
  const slider = page.getByRole("slider", { name: "Shift from baseline" });
  await slider.fill("5");
  await expect(summary).toContainText("All material requirements covered");
  await slider.fill("6");
  await expect(summary).toContainText("Due to material shortage");
  await expect(page.locator(".outcome-banner")).toContainText("€36,000");
  await expect(page.locator(".outcome-banner")).toContainText(
    "2 component units",
  );
  const orderNode = page.locator('[data-id="order:ORD-102"]');
  await expect(orderNode.locator(".supply-node")).toHaveClass(/is-risk/);
  await orderNode.click();
  await expect(
    page.getByRole("region", { name: "Order allocation evidence" }),
  ).toContainText("Requires 4, with 2 available");
  await expect(
    page.getByRole("region", { name: "Order allocation evidence" }),
  ).toContainText("2026-11-23");
  await page
    .getByRole("button", { name: "Add alternative", exact: true })
    .click();
  await expect(summary).toContainText("All material requirements covered");
  await expect(orderNode.locator(".supply-node")).not.toHaveClass(/is-risk/);
  await expect(page.locator('[data-id="supplier:SUP-04"]')).toContainText(
    "RECOVERY ACTIVE",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "domino-scenario-report.json",
  );
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("radio", { name: /Supplier disruption/ }).click();
  await expect(summary).toContainText("Due to material shortage");
  await page.getByRole("radio", { name: /Approved recovery/ }).click();
  await expect(summary).toContainText("All material requirements covered");
  await page.getByRole("button", { name: "Full network", exact: true }).click();
  await expect(page.locator(".react-flow__node")).toHaveCount(29);
  expect(errors).toEqual([]);
});

test("bad import preserves baseline; valid CSV replaces deliveries", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Import data", exact: true })
    .last()
    .click();
  await page.locator("#data-upload").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{broken"),
  });
  await expect(page.getByRole("alert")).toContainText("Import rejected");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator("#data-upload").setInputFiles({
    name: "deliveries.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "id,supplierId,componentId,quantity,availableDate\nPO-101,SUP-01,MTR-01,5,2026-11-23",
    ),
  });
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".notice")).toContainText(
    "Imported deliveries.csv",
  );
  await expect(page.locator(".outcome-banner")).toContainText(
    "at risk due to material shortage",
  );
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.locator(".outcome-banner")).toContainText("Every order");
});

test("narrow screen retains disclosure and has no page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByText("FICTIONAL DEMO DATA", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.getByRole("radio", { name: /Supplier disruption/ }).click();
  await expect(page.locator(".outcome-banner")).toContainText(
    "2 component units",
  );
  await page
    .getByRole("button", { name: "Add alternative", exact: true })
    .click();
  await expect(page.locator(".outcome-banner")).toContainText("Every order");
});
