import { expect, test } from "@playwright/test";

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
