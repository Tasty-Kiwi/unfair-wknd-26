import { test, expect } from "@playwright/test";

test("builder palette explains items on hover and keyboard focus", async ({
  page,
}) => {
  await page.goto("/?builder=1");
  const palette = page.getByRole("navigation", { name: "Add to network" });
  const receipt = palette.getByRole("button", { name: "Add receipt" });
  await receipt.hover();
  await expect(page.getByRole("tooltip")).toContainText("incoming delivery");
  await page.mouse.move(500, 10);
  await receipt.focus();
  await expect(page.getByRole("tooltip")).toContainText("test a delay");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  await expect(
    palette.getByRole("button", { name: "Add supplier" }),
  ).toBeVisible();
});

for (const theme of ["light", "dark"]) {
  test(`${theme}: covered plan offers a next step without losing allocation access`, async ({
    page,
  }) => {
    await page.addInitScript(
      (t) => localStorage.setItem("dominoos.landing.theme.v2", t),
      theme,
    );
    await page.goto("/demo");
    await expect(
      page.getByRole("heading", { name: "10 of 10 orders covered" }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Inspect allocation", { exact: true }),
    ).toBeHidden();
    await page.getByText("Inspect allocations", { exact: true }).click();
    const picker = page.getByLabel("Inspect allocation", { exact: true });
    await picker.selectOption("ORD-102");
    await expect(page.locator(".impact-panel__subtitle")).toContainText(
      "ORD-102",
    );
    await page.getByText("Inspect allocations", { exact: true }).click();
    await page.getByText("Inspect allocations", { exact: true }).click();
    await expect(picker).toHaveValue("ORD-102");
    await page.getByRole("button", { name: "Test a supplier delay" }).click();
    await expect(
      page.getByRole("heading", { name: "Why ORD-102 is short" }),
    ).toBeVisible();
    const recovery = page
      .locator(".recovery-option")
      .filter({ hasText: "Use Vector Components" });
    await recovery.getByRole("button", { name: "Apply recovery" }).click();
    await expect(
      page.getByText("Material coverage restored", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".coverage-overview__recovery")).toContainText(
      "ORD-102 regained coverage",
    );
    await expect(page.locator(".coverage-overview__recovery")).toContainText(
      "PO-101 still arrives 23 Nov",
    );
    await page
      .getByRole("radio", { name: "Normal operations", exact: true })
      .click();
    await expect(
      page.getByText("Material coverage restored", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Test a supplier delay" }),
    ).toBeVisible();
  });
}

for (const width of [1366, 390]) {
  test(`${width}px: builder groups checks and repair links focus the existing fields`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.goto("/?builder=1");
    await page
      .getByRole("button", { name: "Add supplier", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Add component", exact: true })
      .click();
    if (width === 390) {
      await page.getByRole("button", { name: "Hide details panel" }).click();
    }
    await page
      .getByRole("button", { name: "Run simulation", exact: true })
      .click();
    await expect(
      page.getByText("Your network is still in progress", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Use Next repair");
    await page
      .getByRole("button", { name: "Check network", exact: true })
      .click();
    if (width === 390) {
      await page.getByRole("button", { name: "Show details panel" }).click();
    }
    const groups = page.locator(".builder-check-group");
    await expect(groups).toHaveCount(3);
    await page.getByRole("button", { name: /Go to Supplier 1/ }).click();
    await expect(
      page.getByRole("textbox", { name: "Name", exact: true }),
    ).toBeFocused();
    const component = groups.filter({ hasText: "Component 1" });
    await component.locator("summary").click();
    await component
      .getByRole("button", {
        name: "Component must be connected to a primary supplier.",
        exact: true,
      })
      .click();
    await expect(page.locator(".builder-inspector")).toContainText(
      "Component 1",
    );
    const network = groups.filter({ hasText: "Network settings" });
    await network.locator("summary").click();
    await network
      .getByRole("button", {
        name: "Network name must not be blank.",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Network name", exact: true }),
    ).toBeFocused();
    await expect(page.locator(".builder-checks")).toContainText(
      "checks to complete before simulation",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
