import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`validation notice does not move the workspace at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/?builder=1");
    await page
      .getByRole("button", { name: "Core example", exact: true })
      .click();
    const builder = page.getByTestId("build-workspace");
    const geometry = () =>
      builder.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: rect.x + scrollX,
          y: rect.y + scrollY,
          width: rect.width,
          height: rect.height,
        };
      });
    const before = await geometry();
    await builder.getByRole("button", { name: "Check network" }).click();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Network is valid and ready to simulate." }),
    ).toBeVisible();
    const after = await geometry();
    expect(after).toEqual(before);
    await page.getByRole("button", { name: "Dismiss notification" }).click();
    await expect(
      page.getByText("Network is valid and ready to simulate."),
    ).toHaveCount(0);
  });
}

for (const width of [390, 1440]) {
  test(`inspector contents remain visible while collapsing at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/?builder=1");
    await page
      .getByRole("button", { name: "Core example", exact: true })
      .click();
    const show = page.getByRole("button", { name: "Show details panel" });
    if (await show.isVisible()) await show.click();
    const body = page.locator(".builder__side-body");
    await expect(body.getByText("Network", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Hide details panel" }).click();
    const state = await page
      .locator(".builder__side-collapse")
      .evaluate(async (element) => {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const animation = element
          .getAnimations()
          .find((item) => item instanceof CSSTransition);
        if (!animation) return null;
        animation.pause();
        animation.currentTime = 120;
        const content = element.querySelector(".builder__side-body")!;
        return {
          height: element.getBoundingClientRect().height,
          opacity: getComputedStyle(content).opacity,
        };
      });
    expect(state).not.toBeNull();
    expect(state!.height).toBeGreaterThan(0);
    expect(state!.opacity).toBe("1");
  });
}

for (const width of [320, 390]) {
  test(`phone map is visible and details open on selection at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 320 ? 667 : 844 });
    await page.goto("/?builder=1");
    await page
      .getByRole("button", { name: "Core example", exact: true })
      .click();
    const builder = page.getByTestId("build-workspace");
    await expect(
      builder.getByRole("button", { name: "Show details panel" }),
    ).toBeVisible();
    await builder
      .getByRole("region", { name: "Network items" })
      .getByRole("button", { name: /Aster Manufacturing/ })
      .click();
    await expect(
      builder.getByRole("button", { name: "Hide details panel" }),
    ).toBeVisible();
    await builder.getByRole("button", { name: "Map", exact: true }).click();
    const canvas = builder.getByTestId("builder-canvas");
    const nodes = canvas.locator(".react-flow__node");
    await expect(nodes).toHaveCount(6);
    await expect
      .poll(async () => {
        const canvasBox = await canvas.boundingBox();
        const boxes = await Promise.all(
          (await nodes.all()).map((node) => node.boundingBox()),
        );
        return boxes.every(
          (box) =>
            box &&
            canvasBox &&
            box.x >= canvasBox.x - 2 &&
            box.x + box.width <= canvasBox.x + canvasBox.width + 2,
        );
      })
      .toBe(true);
    await expect
      .poll(
        async () =>
          (await builder
            .getByRole("complementary", { name: "Network details" })
            .boundingBox())!.width,
      )
      .toBeLessThan(200);
    await nodes.first().click();
    await expect(
      builder.getByRole("button", { name: "Hide details panel" }),
    ).toBeVisible();
    await builder.getByRole("textbox", { name: "Name", exact: true }).click();
    await expect(
      builder.getByRole("button", { name: "Hide details panel" }),
    ).toBeVisible();
    await canvas
      .locator(".react-flow__pane")
      .click({ position: { x: 10, y: 10 } });
    await expect(
      builder.getByRole("button", { name: "Show details panel" }),
    ).toBeVisible();
    await nodes.first().click();
    await expect(
      builder.getByRole("button", { name: "Hide details panel" }),
    ).toBeVisible();
    await builder.getByRole("button", { name: "Hide details panel" }).click();
    await expect(
      builder.getByRole("button", { name: "Show details panel" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("inspector leaves map controls and connection handles accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?builder=1");
  await page.getByRole("button", { name: "Core example", exact: true }).click();
  const canvas = page.getByTestId("builder-canvas");
  const wrap = page.locator(".builder__canvas-wrap");
  const panel = page.getByRole("complementary", { name: "Network details" });
  const canvasBox = await canvas.boundingBox();
  const wrapBox = await wrap.boundingBox();
  const panelBox = await panel.boundingBox();
  expect(canvasBox && wrapBox && panelBox).toBeTruthy();
  expect(canvasBox!.x + canvasBox!.width).toBeCloseTo(
    wrapBox!.x + wrapBox!.width,
    0,
  );
  expect(canvasBox!.x + canvasBox!.width).toBeLessThanOrEqual(panelBox!.x);
  await expect(canvas.getByRole("button", { name: "Fit View" })).toBeVisible();
  await canvas.locator(".react-flow__node").first().click();
  await canvas
    .locator(".react-flow__pane")
    .click({ position: { x: 10, y: 10 } });
  await expect(
    page.getByRole("button", { name: "Show details panel" }),
  ).toBeVisible();
  await canvas.locator(".react-flow__node").first().click();
  await page.getByRole("button", { name: "Hide details panel" }).click();
  const closedBox = await canvas.boundingBox();
  expect(closedBox!.width).toBeGreaterThan(canvasBox!.width);
});

test("delete removes selected connections and nodes without intercepting text editing", async ({
  page,
}) => {
  await page.goto("/?builder=1");
  await page.getByRole("button", { name: "Core example", exact: true }).click();
  const canvas = page.getByTestId("builder-canvas");
  const edges = canvas.locator(".react-flow__edge");
  const initialEdges = await edges.count();
  const hitArea = edges.first().locator(".react-flow__edge-interaction");
  await expect(hitArea).toHaveCSS("stroke-width", "28px");
  await hitArea.dispatchEvent("click");
  await expect(
    page.getByRole("button", { name: "Remove connection" }),
  ).toBeVisible();
  await page.keyboard.press("Delete");
  await expect(edges).toHaveCount(initialEdges - 1);

  const nodes = canvas.locator(".builder-node");
  const initialNodes = await nodes.count();
  await nodes.first().click();
  const name = page.getByRole("textbox", { name: "Name", exact: true });
  await name.fill("Example");
  await name.press("Backspace");
  await expect(name).toHaveValue("Exampl");
  await expect(nodes).toHaveCount(initialNodes);
  await nodes.first().click();
  await page.keyboard.press("Backspace");
  await expect(nodes).toHaveCount(initialNodes - 1);
});

test("scenario menu keeps fields compact", async ({ page }) => {
  await page.goto("/?builder=1");
  await page.getByRole("button", { name: /^Scenario\b/ }).click();
  const select = await page.getByLabel("Select scenario").boundingBox();
  const name = await page.getByLabel("Scenario name").boundingBox();
  expect(select && name && name.y - (select.y + select.height)).toBeLessThan(
    50,
  );
});
