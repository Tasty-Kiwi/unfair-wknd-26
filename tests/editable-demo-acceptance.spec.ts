import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileAction } from "./ui-helpers";

for (const failure of ["read", "write"] as const) {
  test(`the editable demo still simulates when browser storage ${failure} fails`, async ({
    page,
  }) => {
    await page.addInitScript((kind) => {
      const method = kind === "read" ? "getItem" : "setItem";
      Storage.prototype[method] = function () {
        throw new DOMException(
          "Device storage unavailable",
          kind === "read" ? "SecurityError" : "QuotaExceededError",
        );
      };
    }, failure);
    await page.goto("/demo");
    const summary = page.getByRole("region", { name: "Simulation summary" });
    await expect(summary).toContainText(
      "Every order has its required materials",
    );
    await page
      .getByRole("radio", { name: "Supplier disruption", exact: true })
      .click();
    await expect(summary).toContainText("2 component units missing");
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /not saved|storage|saved workspace/i })
        .first(),
    ).toBeVisible();
    const download = page.waitForEvent("download");
    await fileAction(page, "Export workspace JSON");
    const workspace = JSON.parse(
      await readFile((await (await download).path())!, "utf8"),
    );
    expect(workspace.document.nodes).toHaveLength(40);
  });
}

const builder = (page: Page) =>
  page.getByRole("main", { name: "Supply chain builder" });

async function openDemoWorkspace(page: Page) {
  await page.setViewportSize({ width: 1366, height: 768 });
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/demo");
  await page.getByRole("button", { name: "Build", exact: true }).click();
  await expect(builder(page)).toBeVisible();
  return builder(page);
}

async function addNode(
  area: Locator,
  kind: string,
  fields: Record<string, string>,
) {
  await area.getByRole("button", { name: `Add ${kind}`, exact: true }).click();
  const inspector = area.locator(".builder-inspector");
  const key = await inspector
    .locator("[data-field][data-node-key]")
    .first()
    .getAttribute("data-node-key");
  expect(key).toBeTruthy();
  for (const [name, value] of Object.entries(fields)) {
    await inspector.locator(`input[name="${name}"]`).fill(value);
  }
  return key!;
}

async function fit(area: Locator) {
  await area
    .getByTestId("builder-canvas")
    .getByRole("button", { name: /fit view/i })
    .click();
}

async function chooseScenario(area: Locator, name: RegExp) {
  const select = area.getByLabel("Select scenario", { exact: true });
  const option = select.locator("option").filter({ hasText: name }).first();
  await expect(option).toBeAttached();
  await select.selectOption(await option.getAttribute("value")!);
}

async function dragTypedConnection(
  page: Page,
  area: Locator,
  sourceKey: string,
  targetKey: string,
  handle: string,
) {
  await fit(area);
  const canvas = area.getByTestId("builder-canvas");
  const source = canvas.locator(
    `[data-node-key="${sourceKey}"] .react-flow__handle.source[data-handleid="${handle}"]`,
  );
  const target = canvas.locator(
    `[data-node-key="${targetKey}"] .react-flow__handle.target[data-handleid="${handle}"]`,
  );
  await source.hover();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  expect(from).toBeTruthy();
  expect(to).toBeTruthy();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, {
    steps: 16,
  });
  await page.mouse.up();
}

test("editable Northstar demo builds, simulates, recovers, and persists in its workspace", async ({
  page,
}) => {
  const area = await openDemoWorkspace(page);
  await expect(
    area.getByRole("button", { name: "Simulate", exact: true }),
  ).toBeVisible();

  // Northstar must be the actual editable graph behind the demonstration,
  // rather than a separate editor populated with an unrelated dataset.
  const networkName = area.getByLabel("Network name", { exact: true });
  await expect(networkName).toHaveValue(/Northstar/i);
  await expect(
    area.getByTestId("builder-canvas").locator(".react-flow__node"),
  ).toHaveCount(40);
  await area
    .getByRole("button", { name: "Check network", exact: true })
    .click();
  await expect(area.getByRole("alert")).toHaveCount(0);
  await area.getByRole("button", { name: "Simulate", exact: true }).click();

  const summary = area
    .locator(
      '[aria-label="Simulation summary"], [aria-label="Results summary"], .simulation-summary',
    )
    .first();
  await expect(summary).toBeVisible();
  await chooseScenario(area, /motor receipt delayed|supplier disruption/i);
  await expect(summary).toContainText(/1 order at risk/i);
  await expect(summary).toContainText(/2 .*missing/i);
  await expect(summary).toContainText(/36,000/);
  await expect(
    area.getByRole("region", { name: "Recovery options" }),
  ).toBeVisible();

  // Applying the approved recovery must cover the order while preserving the
  // original delayed receipt in the current scenario's evidence.
  const recoveryCard = area
    .locator("article")
    .filter({ hasText: "Vector Components" });
  await expect(recoveryCard).toBeVisible();
  await expect(recoveryCard).toContainText(/PO-101.*still late/i);
  await recoveryCard.getByRole("button", { name: /Apply recovery/i }).click();
  await expect(summary).not.toContainText(/[1-9]\d* orders? at risk/i);
  await expect(area.getByText(/PO-101.*still late/i)).toBeVisible();

  const download = page.waitForEvent("download");
  await fileAction(area, "Export scenario report");
  const reportPath = (await (await download).path())!;
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  expect(report.result.summary.atRiskOrders).toBe(0);
  expect(
    report.inputs.deliveries.find(
      (item: { id: string }) => item.id === "PO-101",
    ).availableDate,
  ).toBe("2026-11-17");
  expect(
    report.scenario.deliveryOverrides.find(
      (item: { deliveryId: string }) => item.deliveryId === "PO-101",
    ).availableDate,
  ).toBe("2026-11-23");

  await expect(
    area.getByText(/Saved locally|Saved on this device/),
  ).toBeVisible();
  const path = page.url();
  await page.reload();
  await expect(page).toHaveURL(path);
  const restored = builder(page);
  await restored.getByRole("button", { name: "Simulate", exact: true }).click();
  await expect(
    restored
      .locator(
        '[aria-label="Simulation summary"], [aria-label="Results summary"], .simulation-summary',
      )
      .first(),
  ).not.toContainText(/order at risk/i);
  await expect(
    restored
      .getByLabel("Select scenario", { exact: true })
      .locator("option:checked"),
  ).toContainText(/recover|substitute|vector/i);
});

test("a second supplier can provide an explicit second receipt for the same motor component", async ({
  page,
}) => {
  const area = await openDemoWorkspace(page);
  await fileAction(area, "Core example");
  const canvas = area.getByTestId("builder-canvas");
  await expect(
    canvas.locator('.builder-node[data-kind="supplier"]'),
  ).toHaveCount(1);
  await expect(
    canvas.locator('.builder-node[data-kind="component"]'),
  ).toHaveCount(1);
  const originalSupplier = await canvas
    .locator('.builder-node[data-kind="supplier"]')
    .getAttribute("data-node-key");
  const component = await canvas
    .locator('.builder-node[data-kind="component"]')
    .getAttribute("data-node-key");

  const supplier = await addNode(area, "supplier", {
    name: "Vector Components",
    leadTimeDays: "1",
  });
  // Receipts are the quantity evidence: eligibility alone is not inventory.
  const receipt = await addNode(area, "receipt", {
    quantity: "2",
    availableDate: "2026-11-18",
  });
  const edgesBefore = await canvas.locator(".react-flow__edge").count();
  await dragTypedConnection(
    page,
    area,
    supplier,
    component!,
    "primarySupplier",
  );
  await dragTypedConnection(page, area, supplier, receipt, "receiptSupplier");
  await dragTypedConnection(
    page,
    area,
    receipt,
    component!,
    "receiptComponent",
  );
  await expect(canvas.locator(".react-flow__edge")).toHaveCount(
    edgesBefore + 3,
  );

  await area
    .getByRole("button", { name: "Check network", exact: true })
    .click();
  await expect(area.getByRole("alert")).toHaveCount(0);
  await area
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(
    area.getByRole("region", { name: "Simulation summary" }),
  ).toBeVisible();
  await expect(
    area.getByText(/single primary supplier|more than one primary/i),
  ).toHaveCount(0);

  const download = page.waitForEvent("download");
  await fileAction(area, "Export workspace JSON");
  const workspace = JSON.parse(
    await readFile((await (await download).path())!, "utf8"),
  );
  const supplierEdges = workspace.document.edges.filter(
    (edge: { kind: string; target: string }) =>
      edge.kind === "primarySupplier" && edge.target === component,
  );
  expect(supplierEdges).toHaveLength(2);
  expect(
    supplierEdges.map((edge: { source: string }) => edge.source),
  ).toContain(originalSupplier);
  expect(
    supplierEdges.map((edge: { source: string }) => edge.source),
  ).toContain(supplier);
  expect(
    workspace.document.nodes.find(
      (node: { id: string }) => `component:${node.id}` === component,
    ).fields.primarySupplierId,
  ).toBe(originalSupplier!.slice("supplier:".length));
  expect(
    workspace.document.nodes.find(
      (node: { id: string }) => `receipt:${node.id}` === receipt,
    ).fields.quantity,
  ).toBe("2");

  // Reopen from the captured export directly. This round-trip checks that the
  // graph retains both supplier relationships, instead of accepting a drag in
  // the canvas while losing it from the durable workspace format.
  await page
    .getByLabel("Import workspace JSON", { exact: true })
    .setInputFiles({
      name: "multi-supplier.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(workspace)),
    });
  await expect(canvas.locator(".react-flow__edge")).toHaveCount(
    edgesBefore + 3,
  );
  await area
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(
    area.getByRole("region", { name: "Simulation summary" }),
  ).toBeVisible();
});
