import { test, expect, type Locator, type Page } from "@playwright/test";
import { fileAction, openScenarios } from "./ui-helpers";
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

  await fileAction(builder, "Save workspace");
  await expect(
    builder.getByText("Saved locally", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(builder).toBeVisible();
  await expect(page).toHaveURL(/builder=1/);
  await openScenarios(builder);
  await expect(
    builder.getByLabel("Scenario name", { exact: true }),
  ).toHaveValue("Motor shortage");
  await builder.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("2 component units missing");

  const downloadPromise = page.waitForEvent("download");
  await fileAction(builder, "Export workspace JSON");
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
  await openScenarios(builder);
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
  await fileAction(builder, "Save workspace");
  await page.reload();
  await expect(builder).toBeVisible();
  await expect(page).toHaveURL(/builder=1/);
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
    .getByRole("button", { name: "Back to demo", exact: true })
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
  // Phones open on the structured list; the map is one tap away.
  await builder.getByRole("button", { name: "Map", exact: true }).click();
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

async function canvasViewport(builder: Locator) {
  return builder
    .getByTestId("builder-canvas")
    .locator(".react-flow__viewport")
    .evaluate((element) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
      return { x: matrix.e, y: matrix.f, zoom: matrix.a };
    });
}

async function expectViewport(
  builder: Locator,
  expected: { x: number; y: number; zoom: number },
) {
  // CSS matrix serialization rounds the stored floating-point transform.
  await expect
    .poll(async () => {
      const actual = await canvasViewport(builder);
      return Math.max(
        Math.abs(actual.x - expected.x),
        Math.abs(actual.y - expected.y),
        Math.abs(actual.zoom - expected.zoom),
      );
    })
    .toBeLessThan(0.001);
}

async function exportWorkspace(page: Page, builder: Locator) {
  const downloading = page.waitForEvent("download");
  await fileAction(builder, "Export workspace JSON");
  const path = (await (await downloading).path())!;
  return { path, workspace: JSON.parse(await readFile(path, "utf8")) };
}

test("each added node is revealed without Fit View and field edits keep the framing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const builder = await openBuilder(page);
  const canvas = builder.getByTestId("builder-canvas");
  for (const kind of [
    "supplier",
    "component",
    "receipt",
    "product",
    "customer order",
  ]) {
    const key = await add(builder, kind, {});
    const node = canvas.locator(`.builder-node[data-node-key="${key}"]`);
    await expect(node).toBeVisible();
    await expect
      .poll(async () => {
        const bounds = (await canvas.boundingBox())!;
        const card = (await node.boundingBox())!;
        return (
          card.x >= bounds.x &&
          card.y >= bounds.y &&
          card.x + card.width <= bounds.x + bounds.width &&
          card.y + card.height <= bounds.y + bounds.height
        );
      })
      .toBe(true);
  }
  const before = await canvasViewport(builder);
  await builder
    .locator('.builder-inspector input[name="customer"]')
    .fill("New customer");
  expect(await canvasViewport(builder)).toEqual(before);
  const order = canvas.locator('.builder-node[data-kind="order"]');
  const bounds = (await order.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 - 20,
    bounds.y + bounds.height / 2,
    { steps: 8 },
  );
  await page.mouse.up();
  expect(await canvasViewport(builder)).toEqual(before);
});

test("pan and zoom restore after reload and same-ID import without invalidating scenarios", async ({
  page,
}) => {
  const builder = await openBuilder(page);
  await builder
    .getByRole("button", { name: "Core example", exact: true })
    .click();
  await motorScenario(builder);
  await builder.getByRole("button", { name: "Build", exact: true }).click();
  const before = (await exportWorkspace(page, builder)).workspace;
  const canvas = builder.getByTestId("builder-canvas");
  await canvas.getByRole("button", { name: /zoom in/i }).click();
  await expect
    .poll(async () => (await canvasViewport(builder)).zoom)
    .toBeCloseTo(Math.min(1.6, before.document.viewport.zoom * 1.2), 5);
  // Pan through a clear corner of the actual canvas.
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 15, box.y + 15);
  await page.mouse.down();
  await page.mouse.move(box.x + 65, box.y + 45, { steps: 8 });
  await page.mouse.up();
  const saved = await exportWorkspace(page, builder);
  expect(saved.workspace.document.revision).toBe(before.document.revision);
  expect(saved.workspace.scenarios).toEqual(before.scenarios);
  expect(saved.workspace.document.viewport).not.toEqual(
    before.document.viewport,
  );
  await expectViewport(builder, saved.workspace.document.viewport);
  await fileAction(builder, "Save workspace");
  await page.reload();
  await expect(builder).toBeVisible();
  await expect(page).toHaveURL(/builder=1/);
  await expectViewport(builder, saved.workspace.document.viewport);
  await canvas.scrollIntoViewIfNeeded();
  const restoredViewport = await canvasViewport(builder);
  const reopenedBox = (await canvas.boundingBox())!;
  await page.mouse.move(reopenedBox.x + 15, reopenedBox.y + 15);
  await page.mouse.down();
  await page.mouse.move(reopenedBox.x + 65, reopenedBox.y + 45, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(() => canvasViewport(builder))
    .not.toEqual(restoredViewport);
  await expect(
    builder.getByText("Saved locally", { exact: true }),
  ).toBeVisible();
  // React Flow's onMoveEnd commits after its DOM transform changes. Wait for
  // that exact viewport to reach storage before starting an atomic import.
  await expect
    .poll(async () => {
      const stored = await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("dominoos.builder.workspace.v1")!)
            .document.viewport,
      );
      const actual = await canvasViewport(builder);
      return (
        Math.max(
          Math.abs(stored.x - actual.x),
          Math.abs(stored.y - actual.y),
          Math.abs(stored.zoom - actual.zoom),
        ) < 0.001
      );
    })
    .toBe(true);
  page.once("dialog", (dialog) => dialog.accept());
  await builder
    .getByLabel("Import workspace JSON", { exact: true })
    .setInputFiles(saved.path);
  await expect(builder.getByText(/Imported workspace/)).toBeVisible();
  await expectViewport(builder, saved.workspace.document.viewport);
  await expect(
    builder.getByRole("region", { name: "Scenario requires review" }),
  ).toHaveCount(0);
  await builder.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("2 component units missing");
});

test("same-ID retarget review shows current receipt, supplier and component before revalidation", async ({
  page,
}) => {
  const builder = await openBuilder(page);
  await builder
    .getByRole("button", { name: "Core example", exact: true })
    .click();
  await motorScenario(builder);
  await builder.getByRole("button", { name: "Build", exact: true }).click();
  const supplier = await add(builder, "supplier", {
    name: "Birch Components",
    leadTimeDays: "0",
  });
  const component = await add(builder, "component", {
    name: "Circuit board",
    unit: "boards",
    initialStock: "0",
  });
  await connect(builder, "primarySupplier", supplier, component);
  for (const id of [
    "edge-receipt-supplier-aster",
    "edge-receipt-component-servo",
  ]) {
    await builder
      .getByLabel("Edit item", { exact: true })
      .selectOption(`edge:${id}`);
    await builder
      .getByRole("button", { name: "Remove connection", exact: true })
      .click();
    await builder
      .getByRole("button", { name: "Confirm remove", exact: true })
      .click();
  }
  await connect(
    builder,
    "receiptSupplier",
    supplier,
    "receipt:receipt-servo-1",
  );
  await connect(
    builder,
    "receiptComponent",
    "receipt:receipt-servo-1",
    component,
  );
  const review = builder.getByRole("region", {
    name: "Scenario requires review",
  });
  await expect(review).toContainText("Receipt receipt-servo-1");
  await expect(review).toContainText(
    "Previously validated supplier: Aster Manufacturing (supplier-aster)",
  );
  await expect(review).toContainText(
    "Previously validated component: Servo motor (component-servo-motor)",
  );
  await expect(review).toContainText(
    `Current supplier: Birch Components (${supplier.slice("supplier:".length)})`,
  );
  await expect(review).toContainText(
    `Current component: Circuit board (${component.slice("component:".length)})`,
  );
  await expect(review).toContainText("Current plan: 5 boards on 2026-11-17");
  await expect(review).toContainText(
    "Scenario override: 5 units on 2026-11-23",
  );
  await page.screenshot({
    path: ".tmp/builder-scenario-review.png",
    fullPage: true,
  });
  await builder.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toHaveCount(0);
  await fileAction(builder, "Save workspace");
  await page.reload();
  await expect(builder).toBeVisible();
  await expect(page).toHaveURL(/builder=1/);
  await expect(review).toContainText(
    "Previously validated component: Servo motor",
  );
  await expect(review).toContainText("Current component: Circuit board");
  await review
    .getByRole("button", { name: "Revalidate scenario", exact: true })
    .click();
  await expect(review).toHaveCount(0);
  const { workspace } = await exportWorkspace(page, builder);
  expect(workspace.scenarios[0].receiptSnapshots[0].component.name).toBe(
    "Circuit board",
  );
});

test("same-ID and same-revision import recompiles changed material data and supports legacy scenarios", async ({
  page,
}) => {
  const builder = await openBuilder(page);
  await builder
    .getByRole("button", { name: "Core example", exact: true })
    .click();
  await motorScenario(builder);
  const { workspace } = await exportWorkspace(page, builder);
  const oldRevision = workspace.document.revision;
  workspace.document.nodes.find(
    (node: { kind: string }) => node.kind === "component",
  ).fields.initialStock = "7";
  // Older v1 files have no historical relationship snapshot.
  for (const record of [...workspace.scenarios, workspace.workingScenario])
    delete record.receiptSnapshots;
  expect(workspace.document.revision).toBe(oldRevision);
  page.once("dialog", (dialog) => dialog.accept());
  await builder
    .getByLabel("Import workspace JSON", { exact: true })
    .setInputFiles({
      name: "edited-workspace.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(workspace)),
    });
  const review = builder.getByRole("region", {
    name: "Scenario requires review",
  });
  await expect(review).toContainText(
    "Previous relationship was not recorded for this scenario.",
  );
  await expect(review).toContainText("Current component: Servo motor");
  await review
    .getByRole("button", { name: "Revalidate scenario", exact: true })
    .click();
  await builder.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(
    builder.getByRole("region", { name: "Simulation summary" }),
  ).toContainText("3 component units missing");
});
