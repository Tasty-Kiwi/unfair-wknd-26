import { test, expect } from "@playwright/test";

test("landing calculates all three fictional scenarios and launches simulator", async ({
  page,
}) => {
  await page.goto("/landing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "One late delivery.Which orders are now at risk?",
  );
  const scenario = page.getByRole("group", { name: "Supply scenario" });
  const status = page.getByRole("status");
  await expect(status).toContainText("Material shortage");
  await expect(page.getByTestId("landing-shortage")).toHaveText("2");
  await expect(page.getByTestId("landing-exposure")).toHaveText("€36,000");
  await expect(status).toContainText("exposure, not a predicted loss");
  await scenario.getByRole("button", { name: "On time", exact: true }).click();
  await expect(page.getByTestId("landing-shortage")).toHaveText("0");
  await expect(page.getByTestId("landing-exposure")).toHaveText("€0");
  await expect(page.locator(".lp-figure-note")).toContainText(
    "All 10 orders covered",
  );
  const recovery = scenario.getByRole("button", {
    name: "Alternative supply applied",
    exact: true,
  });
  await recovery.focus();
  await page.keyboard.press("Enter");
  await expect(recovery).toHaveAttribute("aria-pressed", "true");
  await expect(status).toContainText("Materials covered");
  await expect(page.getByTestId("landing-shortage")).toHaveText("0");
  await expect(page.getByTestId("landing-exposure")).toHaveText("€0");
  await expect(page.locator(".lp-figure-note")).toContainText(
    "original Aster receipt still arrives on 23 Nov",
  );
  await scenario
    .getByRole("button", { name: "Delivery delayed", exact: true })
    .click();
  await expect(page.getByTestId("landing-shortage")).toHaveText("2");
  await page.getByText("Read the three-state example", { exact: true }).click();
  await expect(page.locator(".lp-summary")).toContainText(
    "Approval and availability are fictional inputs",
  );
  await page
    .getByRole("link", { name: "Launch interactive demo" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Every order has its required materials",
  );
});

for (const [width, height] of [
  [1440, 900],
  [1024, 768],
  [768, 1024],
  [390, 844],
]) {
  test(`landing controls and navigation work at ${width}px without overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/landing/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const cta = page
      .getByRole("link", { name: "Launch interactive demo" })
      .first();
    const box = (await cta.boundingBox())!;
    expect(box.y + box.height).toBeLessThan(height);
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to content" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    const controls = page.getByRole("group", { name: "Supply scenario" });
    await controls
      .getByRole("button", { name: "Alternative supply applied", exact: true })
      .click();
    await expect(page.getByTestId("landing-shortage")).toHaveText("0");
    await expect(page.locator(".lp-applied")).toContainText(
      "2 approved motors applied",
    );
    await expect(page.locator(".lp-chain-node")).toHaveCount(4);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const button of await controls.getByRole("button").all()) {
      const rect = (await button.boundingBox())!;
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(width);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    }
    await page
      .getByRole("link", { name: "See how it works", exact: true })
      .click();
    await expect(page).toHaveURL(/#how-it-works$/);
    await expect(
      page.getByRole("heading", {
        name: /Follow the consequence\.\s*Then change the outcome\./,
      }),
    ).toBeInViewport();
    await page.getByRole("link", { name: "Open demo", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Every order has its required materials",
    );
  });
}
