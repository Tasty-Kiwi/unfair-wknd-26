import { expect, type Locator, type Page } from "@playwright/test";

type Scope = Page | Locator;

/** The simulator keeps the order book and scenario comparison in a drawer. */
export async function openOrderBook(page: Page) {
  const toggle = page.getByRole("button", { name: /^Order book/ });
  if ((await toggle.getAttribute("aria-expanded")) !== "true")
    await toggle.click();
}

/** Builder workspace file actions live in the toolbar's File menu. */
export async function fileAction(scope: Scope, name: string) {
  await scope.getByRole("button", { name: "File", exact: true }).click();
  await scope.getByRole("button", { name, exact: true }).click();
}

/**
 * In Build mode, named scenarios sit behind the toolbar's Scenario button;
 * in Simulate mode they are shown inline, so this is a no-op there.
 */
export async function openScenarios(scope: Scope) {
  const select = scope.getByLabel("Select scenario", { exact: true });
  const toggle = scope.getByRole("button", { name: /^Scenario\b/ });
  await expect(select.or(toggle).first()).toBeVisible();
  if (!(await select.isVisible())) await toggle.click();
}
