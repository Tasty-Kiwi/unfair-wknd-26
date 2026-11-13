import { test, expect } from "@playwright/test";

test("mobile product preview discloses retained BOMs and keeps actions usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Import data", exact: true })
    .last()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Data is not saved between sessions");
  await page
    .locator("#data-upload")
    .setInputFiles("public/examples/products.csv");
  await expect(dialog).toContainText("Existing BOMs retained");
  const choose = dialog.getByRole("button", { name: "Choose different files" });
  const apply = dialog.getByRole("button", { name: "Import and mix data" });
  await apply.scrollIntoViewIfNeeded();
  const first = (await choose.boundingBox())!;
  const second = (await apply.boundingBox())!;
  expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  for (const box of [first, second]) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await page.screenshot({ path: ".tmp/import-preview-mobile.png" });
  await choose.click();
  await expect(dialog.getByText("Import preview")).not.toBeVisible();
  await page
    .locator("#data-upload")
    .setInputFiles("public/examples/products.csv");
  await apply.click();
  await expect(
    page.getByText(/Product names and SKUs are imported; existing BOMs/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Export report" }).click();
});

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
    "Recovery active",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "needtrace-scenario-report.json",
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
  await expect(
    page.getByText("Fictional demo data", { exact: true }),
  ).toBeVisible();
  await page.locator("#data-upload").setInputFiles({
    name: "deliveries.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "id,supplierId,componentId,quantity,availableDate\nPO-101,SUP-01,MTR-01,5,2026-11-23",
    ),
  });
  await expect(page.getByText("Import preview")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "Fictional and imported data will mix",
  );
  await expect(page.getByRole("dialog")).toContainText("Replace: deliveries");
  await expect(page.getByRole("dialog")).toContainText(
    "Keep existing: suppliers, components, products, inventory, orders, approved alternatives",
  );
  await page.getByRole("button", { name: "Import and mix data" }).click();
  await expect(page.locator(".notice")).toContainText(
    "Imported deliveries.csv",
  );
  await expect(
    page.getByText("Mixed demo + imported data", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".outcome-banner")).toContainText(
    "at risk due to material shortage",
  );
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Replace your imported plan?",
  );
  await page.getByRole("button", { name: "Keep my plan" }).click();
  await expect(
    page.getByText("Mixed demo + imported data", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".outcome-banner")).toContainText(
    "at risk due to material shortage",
  );
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("button", { name: "Reset to fictional demo" }).click();
  await expect(page.locator(".outcome-banner")).toContainText("Every order");
  await expect(
    page.getByText("Fictional demo data", { exact: true }),
  ).toBeVisible();
});

test("complete JSON import becomes fully imported and reset restores provenance", async ({
  page,
}) => {
  const dataset = {
    name: "Imported plan",
    asOf: "2026-11-12",
    suppliers: [
      { id: "SUP-1", name: "Imported supplier", region: "EU", leadTimeDays: 4 },
    ],
    components: [
      { id: "CMP-1", name: "Imported part", unit: "pcs", supplierId: "SUP-1" },
    ],
    products: [
      {
        id: "PRD-1",
        name: "Imported product",
        sku: "IMP-1",
        bom: [{ componentId: "CMP-1", quantity: 1 }],
      },
    ],
    inventory: [{ componentId: "CMP-1", quantity: 1 }],
    deliveries: [],
    orders: [
      {
        id: "ORD-1",
        customer: "Imported customer",
        productId: "PRD-1",
        quantity: 1,
        requiredDate: "2026-11-20",
        value: 100,
      },
    ],
    alternatives: [],
  };
  await page.goto("/");
  await page
    .getByRole("button", { name: "Import data", exact: true })
    .last()
    .click();
  await page.locator("#data-upload").setInputFiles({
    name: "plan.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(dataset)),
  });
  await expect(page.getByText("Import preview")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "Nothing — this is a complete dataset replacement",
  );
  await page.getByRole("button", { name: "Apply import" }).click();
  await expect(
    page.getByText("Fully imported data", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("ORD-1", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Replace your imported plan?",
  );
  await page.getByRole("button", { name: "Reset to fictional demo" }).click();
  await expect(
    page.getByText("Fictional demo data", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("ORD-101", { exact: true }).first(),
  ).toBeVisible();
});

test("narrow screen retains disclosure and has no page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByText("Fictional demo data", { exact: true }),
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

test("recovery comparison evaluates independent options and applies the selected plan", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: /Supplier disruption/ }).click();
  const comparison = page.getByRole("region", { name: "Recovery options" });
  await expect(comparison.locator("article")).toHaveCount(2);
  await expect(comparison).toContainText(
    "costs and factory capacity are not modeled",
  );
  const purchase = comparison
    .locator("article")
    .filter({ hasText: "Use Vector Components" });
  await expect(purchase).toContainText("2net units recovered");
  await purchase.getByRole("button", { name: "Apply recovery" }).click();
  await expect(page.locator(".outcome-banner")).toContainText("Every order");
  await expect(
    page.getByLabel("Available date", { exact: true }).first(),
  ).toHaveValue("2026-11-23");
  await page.getByRole("radio", { name: /Supplier disruption/ }).click();
  await comparison
    .locator("article")
    .filter({ hasText: "Restore PO-101 timing" })
    .getByRole("button", { name: "Apply recovery" })
    .click();
  await expect(page.locator(".outcome-banner")).toContainText("Every order");
  await expect(
    page.getByLabel("Available date", { exact: true }).first(),
  ).toHaveValue("2026-11-17");
});

test("spreadsheet bundle imports atomically and rejects invalid related tables", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Import data", exact: true })
    .last()
    .click();
  const inventory = {
    name: "inventory.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("componentId,quantity\nMTR-01,0"),
  };
  const invalidOrders = {
    name: "orders.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "id,customer,productId,quantity,requiredDate,value\nBAD,Acme,MISSING,1,2026-11-22,100",
    ),
  };
  await page.locator("#data-upload").setInputFiles([inventory, invalidOrders]);
  await expect(page.getByRole("alert")).toContainText("MISSING");
  await expect(
    page.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("All material requirements covered");
  const files = ["products", "bom", "orders", "inventory"].map(
    (name) => `public/examples/${name}.csv`,
  );
  await page.locator("#data-upload").setInputFiles(files);
  await expect(page.getByRole("dialog")).toContainText(
    "Fictional and imported data will mix",
  );
  await page.getByRole("button", { name: "Import and mix data" }).click();
  await expect(page.locator(".notice")).toContainText("10 orders");
  await expect(
    page.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("All material requirements covered");
});

test("receipt date moves by preset, timeline keyboard, and drag, all in sync", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const summary = page.getByRole("region", { name: "Simulation summary" });
  await expect(page.getByLabel("Receipt", { exact: true })).toContainText(
    "PO-101 · Servo motor · 17 Nov",
  );
  await expect(
    page.getByText("€36,000 more order value becomes at risk"),
  ).toBeVisible();

  await page.getByRole("radio", { name: "First short, 23 Nov" }).click();
  await expect(summary).toContainText("Due to material shortage");
  await page.getByRole("radio", { name: "Latest safe, 22 Nov" }).click();
  await expect(summary).toContainText("All material requirements covered");
  await page.getByRole("radio", { name: "As planned, 17 Nov" }).click();

  const handle = page.getByRole("slider", { name: "Move receipt PO-101" });
  await handle.focus();
  await handle.press("ArrowRight");
  await expect(handle).toHaveAttribute("aria-valuenow", "1");
  await expect(handle).toHaveAttribute("aria-valuetext", /18 Nov, 1 day late/);
  await expect(page.getByLabel("Available date").first()).toHaveValue(
    "2026-11-18",
  );
  await expect(
    page.getByRole("radio", { name: "Custom date" }),
  ).toHaveAttribute("aria-checked", "true");
  await handle.press("End");
  await expect(handle).toHaveAttribute("aria-valuenow", "12");
  await expect(summary).toContainText("Due to material shortage");
  await handle.press("Home");
  await expect(handle).toHaveAttribute("aria-valuenow", "-5");

  // Drag back towards the right with a pointer.
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 400, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  expect(Number(await handle.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("a typed date beyond the drag window widens every slider's range", async ({
  page,
}) => {
  await page.goto("/");
  const date = page.getByLabel("Available date").first();
  await date.fill("2026-12-07"); // PO-101 planned 17 Nov, so 20 days late
  const handle = page.getByRole("slider", { name: "Move receipt PO-101" });
  await expect(handle).toHaveAttribute("aria-valuenow", "20");
  await expect(handle).toHaveAttribute("aria-valuemax", "20");
  await expect(handle).toHaveAttribute("aria-valuemin", "-5");
  await expect(page.getByLabel(/Shift from baseline/)).toHaveAttribute(
    "max",
    "20",
  );
  await expect(page.getByLabel(/Shift from baseline/)).toHaveValue("20");

  await handle.focus();
  await handle.press("ArrowLeft");
  await expect(handle).toHaveAttribute("aria-valuenow", "19");
  await expect(handle).toHaveAttribute("aria-valuetext", /6 Dec, 19 days late/);
  await expect(date).toHaveValue("2026-12-06");
});

test("a supplier is only flagged Late when its receipt actually slips", async ({
  page,
}) => {
  await page.goto("/");
  const aster = page.locator('[data-id="supplier:SUP-01"]');
  await page.getByRole("radio", { name: /Supplier disruption/ }).click();
  await expect(aster).toContainText("Late");

  // Same shortage from a quantity cut on time: not "Late".
  await page.getByRole("radio", { name: /Normal operations/ }).click();
  await page.getByLabel("Quantity").first().fill("1");
  await expect(
    page.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("Due to material shortage");
  await expect(aster).toContainText("Reduced");
  await expect(aster).not.toContainText("Late");
});

test("a receipt dated 2035 keeps the timeline axis bounded and movable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Import data" }).last().click();
  await page.locator("#data-upload").setInputFiles({
    name: "deliveries.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "id,supplierId,componentId,quantity,availableDate\nPO-101,SUP-01,MTR-01,5,2035-01-10",
    ),
  });
  await page.getByRole("button", { name: "Import and mix data" }).click();
  await expect(page.locator(".notice")).toContainText(
    "Imported deliveries.csv",
  );

  // Daily ticks would be about 3,000 elements here.
  const ticks = page.locator(".timeline-axis .tick");
  expect(await ticks.count()).toBeLessThanOrEqual(62);
  await expect(page.locator(".timeline-axis")).toContainText("2034");

  const handle = page.getByRole("slider", { name: "Move receipt PO-101" });
  await expect(handle).toHaveAttribute("aria-valuenow", "0");
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  await expect(handle).toHaveAttribute("aria-valuenow", "1");
  await expect(handle).toHaveAttribute("aria-valuetext", /11 Jan/);
  await expect(page.getByLabel("Available date").first()).toHaveValue(
    "2035-01-11",
  );
  expect(errors).toEqual([]);
});
