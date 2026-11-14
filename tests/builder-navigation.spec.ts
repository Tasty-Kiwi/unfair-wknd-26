import { test, expect } from "@playwright/test";

const builder = (page: import("@playwright/test").Page) =>
  page.getByRole("main", { name: "Supply chain builder" });

test("builder URL opens directly and survives refresh", async ({ page }) => {
  await page.goto("/?builder=1");
  await expect(builder(page)).toBeVisible();
  await page.reload();
  await expect(builder(page)).toBeVisible();
  await expect(page).toHaveURL(/builder=1/);
});

test("browser back and forward restore simulator and builder without losing the draft", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  await expect(builder(page)).toBeVisible();
  await builder(page)
    .getByLabel("Network name", { exact: true })
    .fill("History draft");

  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Build a network", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(builder(page)).toBeVisible();
  await expect(
    builder(page).getByLabel("Network name", { exact: true }),
  ).toHaveValue("History draft");
});

test("closing builder removes query and browser history reopens it", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  await expect(page).toHaveURL(/builder=1/);
  await builder(page).getByRole("button", { name: "Back to demo" }).click();
  await expect(page).not.toHaveURL(/builder=1/);
  await page.goBack();
  await expect(builder(page)).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("button", { name: "Build a network", exact: true }),
  ).toBeVisible();
});

test("OAuth error cleanup keeps durable builder query", async ({ page }) => {
  await page.goto("/?builder=1&authError=1");
  await expect(builder(page)).toBeVisible();
  await expect(page).toHaveURL(/builder=1/);
  await expect(page).not.toHaveURL(/authError/);
});

test("device draft persists across closing and reopening builder", async ({
  page,
}) => {
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  await builder(page)
    .getByLabel("Network name", { exact: true })
    .fill("Saved device draft");
  await expect(
    builder(page).getByText("Saved locally", { exact: true }),
  ).toBeVisible();
  await builder(page).getByRole("button", { name: "Back to demo" }).click();
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  await expect(
    builder(page).getByLabel("Network name", { exact: true }),
  ).toHaveValue("Saved device draft");
});

test("failed local save cancels history exit and preserves the editable draft", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const save = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "dominoos.builder.workspace.v1")
        throw new DOMException("Device storage full", "QuotaExceededError");
      return save.call(this, key, value);
    };
  });
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  await builder(page)
    .getByLabel("Network name", { exact: true })
    .fill("Keep this unsaved draft");
  await page.goBack();
  await expect(builder(page)).toBeVisible();
  await expect(page).toHaveURL(/builder=1/);
  await expect(
    builder(page).getByLabel("Network name", { exact: true }),
  ).toHaveValue("Keep this unsaved draft");
  await expect(
    builder(page).getByText("Changes not saved", { exact: true }),
  ).toBeVisible();
});
