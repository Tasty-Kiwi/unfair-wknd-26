import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const builderFor = (page: Page) =>
  page.getByRole("main", { name: "Supply chain builder" });

async function openBuilder(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  const builder = builderFor(page);
  await expect(builder).toBeVisible();
  return builder;
}

async function add(
  builder: Locator,
  kind: string,
  fields: Record<string, string>,
) {
  await builder
    .getByRole("button", { name: `Add ${kind}`, exact: true })
    .click();
  const inspector = builder.locator(".builder-inspector");
  const key = await inspector
    .locator("[data-field][data-node-key]")
    .first()
    .getAttribute("data-node-key");
  expect(key).toBeTruthy();
  for (const [field, value] of Object.entries(fields)) {
    await inspector.locator(`input[name="${field}"]`).fill(value);
  }
  return key!;
}

async function connect(
  builder: Locator,
  kind: string,
  source: string,
  target: string,
  quantity?: string,
) {
  const form = builder.locator(".builder-connect");
  await form.getByLabel("Connection type", { exact: true }).selectOption(kind);
  await form.getByLabel(/^From \(/).selectOption(source);
  await form.getByLabel(/^To \(/).selectOption(target);
  if (quantity !== undefined)
    await form
      .getByLabel("Quantity per product unit", { exact: true })
      .fill(quantity);
  await form
    .getByRole("button", { name: "Add connection", exact: true })
    .click();
}

async function fit(builder: Locator) {
  await builder
    .getByTestId("builder-canvas")
    .getByRole("button", { name: /fit view/i })
    .click();
}

async function pointerConnect(
  page: Page,
  builder: Locator,
  sourceKey: string,
  targetKey: string,
  sourceKind: string,
  targetKind = sourceKind,
) {
  const canvas = builder.getByTestId("builder-canvas");
  const from = canvas.locator(
    `[data-node-key="${sourceKey}"] .react-flow__handle.source[data-handleid="${sourceKind}"]`,
  );
  const to = canvas.locator(
    `[data-node-key="${targetKey}"] .react-flow__handle.target[data-handleid="${targetKind}"]`,
  );
  await from.hover();
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  expect(a).toBeTruthy();
  expect(b).toBeTruthy();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, {
    steps: 16,
  });
  await page.mouse.up();
}

async function buildMotor(page: Page, builder: Locator) {
  await builder
    .getByLabel("Network name", { exact: true })
    .fill("My motor network");
  await builder
    .getByLabel("Inventory as of", { exact: true })
    .fill("2026-11-13");
  const supplier = await add(builder, "supplier", {
    name: "Aster Manufacturing",
    leadTimeDays: "0",
  });
  const component = await add(builder, "component", {
    name: "Servo motor",
    unit: "motors",
    initialStock: "8",
  });
  const receipt = await add(builder, "receipt", {
    quantity: "5",
    availableDate: "2026-11-17",
  });
  const product = await add(builder, "product", {
    name: "Industrial motor unit",
    sku: "IMU-001",
  });
  const orderA = await add(builder, "customer order", {
    customer: "Customer A",
    quantity: "6",
    requiredDate: "2026-11-20",
    value: "600",
  });
  const orderB = await add(builder, "customer order", {
    customer: "Customer B",
    quantity: "4",
    requiredDate: "2026-11-22",
    value: "400",
  });
  await fit(builder);
  const movable = builder
    .getByTestId("builder-canvas")
    .locator(`[data-node-key="${orderB}"]`);
  await movable.hover();
  const beforeMove = (await movable.boundingBox())!;
  await page.mouse.move(
    beforeMove.x + beforeMove.width / 2,
    beforeMove.y + beforeMove.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    beforeMove.x + beforeMove.width / 2 - 20,
    beforeMove.y + beforeMove.height / 2,
    { steps: 8 },
  );
  await page.mouse.up();
  await expect
    .poll(async () => (await movable.boundingBox())!.x)
    .toBeLessThan(beforeMove.x - 10);
  // A real pointer connection is mandatory. No graph/Dataset/state injection.
  await pointerConnect(page, builder, supplier, component, "primarySupplier");
  await expect(
    builder.getByTestId("builder-canvas").locator(".react-flow__edge"),
  ).toHaveCount(1);
  await connect(builder, "receiptSupplier", supplier, receipt);
  await connect(builder, "receiptComponent", receipt, component);
  await connect(builder, "bom", component, product, "1");
  await connect(builder, "orderedProduct", product, orderA);
  await connect(builder, "orderedProduct", product, orderB);
  await expect(
    builder.getByTestId("builder-canvas").locator(".react-flow__edge"),
  ).toHaveCount(6);
  return { supplier, component, receipt, product, orderA, orderB };
}

async function motorScenario(builder: Locator) {
  await builder
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("Every order");
  await builder
    .getByRole("button", { name: "New scenario", exact: true })
    .click();
  await builder
    .getByLabel("Scenario name", { exact: true })
    .fill("Motor shortage");
  await builder
    .getByLabel("Available date", { exact: true })
    .first()
    .fill("2026-11-23");
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("2 component units missing");
  await builder
    .getByRole("button", { name: "Save scenario", exact: true })
    .click();
  return builder.getByLabel("Select scenario", { exact: true }).inputValue();
}

test("blank graph -> named motor disruption -> baseline comparison -> reload and JSON reopen", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const builder = await openBuilder(page);
  const ids = await buildMotor(page, builder);
  await page.screenshot({ path: ".tmp/builder-laptop.png", fullPage: true });
  const scenarioValue = await motorScenario(builder);

  const evidence = builder.getByRole("region", {
    name: "Order allocation evidence",
  });
  await evidence
    .getByLabel("Inspect allocation", { exact: true })
    .selectOption(ids.orderB.slice("order:".length));
  await expect(evidence).toContainText("Requires 4, with 2 available");
  await expect(evidence).toContainText("2026-11-23");
  await builder
    .getByRole("button", { name: "Compare with baseline", exact: true })
    .click();
  const rows = builder
    .getByRole("region", { name: "Baseline comparison" })
    .locator("tbody tr");
  await expect(rows.nth(0).locator("td").nth(1)).toHaveText("0");
  await expect(rows.nth(1).locator("td").nth(1)).toHaveText("2");
  await builder
    .getByLabel("Select scenario", { exact: true })
    .selectOption("baseline");
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("Every order");
  await builder
    .getByLabel("Select scenario", { exact: true })
    .selectOption(scenarioValue);
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("2 component units missing");

  await builder
    .getByRole("button", { name: "Save workspace", exact: true })
    .click();
  await expect(
    builder.getByText("Saved locally", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  await expect(
    builder.getByLabel("Scenario name", { exact: true }),
  ).toHaveValue("Motor shortage");
  await builder.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("2 component units missing");

  const downloadPromise = page.waitForEvent("download");
  await builder
    .getByRole("button", { name: "Export workspace JSON", exact: true })
    .click();
  const download = await downloadPromise;
  const path = (await download.path())!;
  const exported = JSON.parse(await readFile(path, "utf8"));
  expect(exported.document.nodes).toHaveLength(6);
  expect(exported.document.edges).toHaveLength(6);
  expect(
    exported.document.nodes.find(
      (node: { id: string }) => `order:${node.id}` === ids.orderB,
    ).position.x,
  ).toBeLessThan(1200);
  expect(exported.scenarios[0].scenario.name).toBe("Motor shortage");
  expect(
    exported.document.nodes.find(
      (node: { kind: string }) => node.kind === "receipt",
    ).fields.availableDate,
  ).toBe("2026-11-17");

  page.once("dialog", (dialog) => dialog.accept());
  await builder
    .getByLabel("Import workspace JSON", { exact: true })
    .setInputFiles(path);
  await expect(builder.getByText(/Imported workspace/)).toBeVisible();
  await builder.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("2 component units missing");
  expect(errors).toEqual([]);
});

test("material edits block saved scenarios and Save cannot bypass explicit revalidation", async ({
  page,
}) => {
  const builder = await openBuilder(page);
  await builder
    .getByRole("button", { name: "Core example", exact: true })
    .click();
  await motorScenario(builder);
  await builder.getByRole("button", { name: "Build", exact: true }).click();
  await builder.locator('.builder-node[data-kind="component"]').click();
  await builder.getByLabel("Initial stock on hand", { exact: true }).fill("7");
  await expect(
    builder.getByRole("region", { name: "Scenario requires review" }),
  ).toBeVisible();
  await builder
    .getByRole("button", { name: "Save scenario", exact: true })
    .click();
  await expect(builder.getByRole("alert").first()).toContainText(
    "Revalidate this scenario explicitly",
  );
  await builder.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toHaveCount(0);
  await builder
    .getByRole("button", { name: "Revalidate scenario", exact: true })
    .click();
  await builder.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("3 component units missing");
  // Editing current scenario inputs updates results immediately, not an old snapshot.
  await builder
    .getByLabel("Available date", { exact: true })
    .first()
    .fill("2026-11-17");
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("Every order");
});

test("incomplete draft survives refresh; duplicate BOM, incompatible handles and dependent deletion are safe", async ({
  page,
}) => {
  const builder = await openBuilder(page);
  await builder
    .getByRole("button", { name: "Core example", exact: true })
    .click();
  await fit(builder);
  const canvas = builder.getByTestId("builder-canvas");
  const component = await canvas
    .locator('.builder-node[data-kind="component"]')
    .getAttribute("data-node-key");
  const product = await canvas
    .locator('.builder-node[data-kind="product"]')
    .getAttribute("data-node-key");
  const order = await canvas
    .locator('.builder-node[data-kind="order"]')
    .first()
    .getAttribute("data-node-key");
  await connect(builder, "bom", component!, product!, "9");
  await expect(
    builder.locator(".builder-connect").getByRole("alert"),
  ).toContainText("already exists");
  await pointerConnect(
    page,
    builder,
    component!,
    order!,
    "bom",
    "orderedProduct",
  );
  await expect(canvas.locator(".react-flow__edge")).toHaveCount(6);

  await canvas.locator('.builder-node[data-kind="component"]').click();
  await builder.getByLabel("Initial stock on hand", { exact: true }).fill("");
  await builder
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toHaveCount(0);
  await builder
    .getByRole("button", { name: "Save workspace", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  await fit(builder);
  await canvas.locator('.builder-node[data-kind="component"]').click();
  await expect(
    builder.getByLabel("Initial stock on hand", { exact: true }),
  ).toHaveValue("");
  await builder.getByLabel("Initial stock on hand", { exact: true }).fill("8");
  await canvas.locator('.builder-node[data-kind="supplier"]').click();
  await builder
    .getByRole("button", { name: "Delete supplier", exact: true })
    .click();
  await builder
    .getByRole("button", { name: "Confirm delete", exact: true })
    .click();
  await expect(
    canvas.locator('.builder-node[data-kind="supplier"]'),
  ).toHaveCount(0);
  await expect(canvas.locator(".react-flow__edge")).toHaveCount(4);
  await builder
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toHaveCount(0);
});

test("legacy imported plan and disruption survive entering and returning from Build", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Import data", exact: true })
    .last()
    .click();
  await page.locator("#data-upload").setInputFiles({
    name: "deliveries.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "id,supplierId,componentId,quantity,availableDate\nPO-101,SUP-01,MTR-01,5,2026-11-23",
    ),
  });
  await page
    .getByRole("button", { name: "Import and mix data", exact: true })
    .click();
  const summary = page.getByRole("region", { name: "Simulation summary" });
  const before = (await summary.textContent())!;
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  await builderFor(page)
    .getByRole("button", { name: "Back to Simulate", exact: true })
    .click();
  await expect(summary).toHaveText(before);
  await expect(
    page.getByText("Mixed demo + imported data", { exact: true }).first(),
  ).toBeVisible();
});

test("narrow editing has a keyboard form connection path without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const builder = await openBuilder(page);
  await builder.getByLabel("Network name", { exact: true }).fill("Small chain");
  await builder
    .getByLabel("Inventory as of", { exact: true })
    .fill("2026-11-13");
  const supplier = await add(builder, "supplier", { name: "My supplier" });
  const component = await add(builder, "component", {
    name: "Motor",
    unit: "motors",
    initialStock: "0",
  });
  await connect(builder, "primarySupplier", supplier, component);
  await builder
    .getByLabel("Edit item", { exact: true })
    .selectOption(`node:${component}`);
  const stock = builder.getByLabel("Initial stock on hand", { exact: true });
  await stock.focus();
  await stock.press("ControlOrMeta+A");
  await stock.press("7");
  await expect(stock).toHaveValue("7");
  await expect(
    builder.getByTestId("builder-canvas").locator(".react-flow__edge"),
  ).toHaveCount(1);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({ path: ".tmp/builder-narrow.png", fullPage: true });
});

test("malformed saved workspace is not overwritten on open; bad JSON import keeps the draft", async ({
  page,
}) => {
  // Fault injection only; no business network is seeded by this test.
  await page.addInitScript(() =>
    localStorage.setItem("dominoos.builder.workspace.v1", "{broken"),
  );
  const builder = await openBuilder(page);
  await expect(builder.getByRole("alert").first()).toContainText(
    "Invalid JSON",
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem("dominoos.builder.workspace.v1"),
      ),
    )
    .toBe("{broken");
  await builder
    .getByLabel("Network name", { exact: true })
    .fill("Keep this draft");
  await builder
    .getByLabel("Import workspace JSON", { exact: true })
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"format":"unknown","version":3}'),
    });
  await expect(builder.getByRole("alert").first()).toContainText(
    "Invalid builder workspace",
  );
  await expect(builder.getByLabel("Network name", { exact: true })).toHaveValue(
    "Keep this draft",
  );
});
