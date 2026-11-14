import { test, expect, type Page } from "@playwright/test";
import { demoData } from "../src/data/demo";
import { createCoreExample } from "../src/lib/builder/factories";

async function openNew(page: Page) {
  await page
    .getByRole("button", { name: "New project", exact: true })
    .first()
    .click();
  return page.getByRole("dialog", { name: "New project", exact: true });
}
async function blank(page: Page, name: string) {
  const modal = await openNew(page);
  await modal.getByRole("radio", { name: "Start blank", exact: true }).click();
  await modal.getByLabel("Project name", { exact: true }).fill(name);
  await modal
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("main", { name: "Supply chain builder" }),
  ).toBeVisible();
}

test("remove a local project only after confirmation", async ({ page }) => {
  await page.goto("/projects");
  await blank(page, "Remove me");
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await blank(page, "Keep me");
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "Remove Remove me" }).click();
  const dialog = page.getByRole("dialog", { name: "Remove project?" });
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("link", { name: /Remove me/ })).toBeVisible();
  await page.getByRole("button", { name: "Remove Remove me" }).click();
  await dialog.getByRole("button", { name: "Remove project" }).click();
  await page.reload();
  await expect(page.getByRole("link", { name: /Remove me/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Keep me/ })).toBeVisible();
});

test("landing to projects to demo and back, with isolated blank projects and refresh", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".lp-page")).toBeVisible();
  await page
    .getByRole("link", { name: "Open projects", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.getByRole("link", { name: "Open demo project" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await page
    .getByRole("radio", { name: "Supplier disruption", exact: true })
    .click();
  await expect(page.locator(".outcome-banner")).toContainText("2");
  await page.getByRole("link", { name: "Projects", exact: true }).click();
  await blank(page, "Line A");
  const firstUrl = page.url();
  await page.getByLabel("Network name", { exact: true }).fill("Line A revised");
  // Immediate exit must flush edits even before the debounced autosave runs.
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /Line A revised/ }),
  ).toBeVisible();
  await blank(page, "Line B");
  await page.reload();
  await expect(page.getByLabel("Network name", { exact: true })).toHaveValue(
    "Line B",
  );
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("link", { name: /Line A revised/ }).click();
  await expect(page).toHaveURL(firstUrl);
  await expect(page.getByLabel("Network name", { exact: true })).toHaveValue(
    "Line A revised",
  );
});

test("JSON dataset import saves scenario changes and rejects a later invalid import", async ({
  page,
}) => {
  await page.goto("/projects");
  const modal = await openNew(page);
  await modal.getByLabel("Project files", { exact: true }).setInputFiles({
    name: "plan.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(demoData)),
  });
  await modal
    .getByLabel("Project name", { exact: true })
    .fill("Imported production plan");
  await modal
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(page.locator(".dataset-line")).toContainText(
    "Fully imported data",
  );
  await page
    .getByRole("radio", { name: "Supplier disruption", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("radio", { name: "Supplier disruption", exact: true }),
  ).toHaveAttribute("data-state", "on");
  await page.getByRole("link", { name: "Projects", exact: true }).click();
  const another = await openNew(page);
  await another.getByLabel("Project files", { exact: true }).setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{broken"),
  });
  await expect(another.getByRole("alert")).toBeVisible();
  await expect(
    another.getByRole("button", { name: "Create project", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("link", { name: /Imported production plan/ }),
  ).toBeVisible();
});

test("CSV preview identifies retained demo data before creating a persistent plan", async ({
  page,
}) => {
  await page.goto("/projects");
  const modal = await openNew(page);
  await modal.getByLabel("Project files", { exact: true }).setInputFiles({
    name: "inventory.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("componentId,quantity\nMTR-01,12"),
  });
  await expect(modal.getByRole("status")).toContainText(
    "Mixed demo + imported data",
  );
  await modal.getByLabel("Project name", { exact: true }).fill("CSV plan");
  await modal
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(page.locator(".dataset-line")).toContainText(
    "Mixed demo + imported data",
  );
  await page.reload();
  await expect(page.locator(".dataset-line")).toContainText("CSV plan");
});

test("legacy draft is discoverable without migration, workspace JSON opens in builder", async ({
  page,
}) => {
  const workspace = {
    format: "dominoos-builder-workspace",
    version: 1,
    document: createCoreExample(),
    scenarios: [],
    selectedScenarioId: null,
    workingScenario: null,
    source: { origin: "fictional", openedFromFile: false },
  };
  await page.addInitScript((value) => {
    if (!localStorage.getItem("dominoos.builder.workspace.v1"))
      localStorage.setItem(
        "dominoos.builder.workspace.v1",
        JSON.stringify(value),
      );
  }, workspace);
  await page.goto("/projects");
  await page.getByRole("link", { name: /Motor assembly network/ }).click();
  await expect(page).toHaveURL(/\/projects\/device-draft$/);
  await expect(page.getByLabel("Network name", { exact: true })).toHaveValue(
    "Motor assembly network",
  );
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  const modal = await openNew(page);
  await modal.getByLabel("Project files", { exact: true }).setInputFiles({
    name: "workspace.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(workspace)),
  });
  await modal
    .getByLabel("Project name", { exact: true })
    .fill("Imported workspace");
  await modal
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("main", { name: "Supply chain builder" }),
  ).toContainText("Imported workspace");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("dominoos.builder.workspace.v1")!)
          .document.name,
    ),
  ).toBe("Motor assembly network");
});

for (const theme of ["light", "dark"])
  for (const width of [1440, 390]) {
    test(`${theme} ${width}: projects and modal fit, keyboard escape restores focus`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem("dominoos.landing.theme.v2", value),
        theme,
      );
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/projects");
      await expect(
        page.getByRole("heading", { name: "Your projects", exact: true }),
      ).toBeVisible();
      expect(
        await page
          .locator("html")
          .evaluate((element) => element.classList.contains("dark")),
      ).toBe(theme === "dark");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `.tmp/projects-${theme}-${width}.png`,
        fullPage: true,
      });
      const modal = await openNew(page);
      await expect(modal).toBeVisible();
      expect(
        await modal.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.left >= 0 &&
            rect.right <= innerWidth &&
            rect.top >= 0 &&
            rect.bottom <= innerHeight
          );
        }),
      ).toBe(true);
      await page.screenshot({
        path: `.tmp/new-project-${theme}-${width}.png`,
        fullPage: true,
      });
      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "New project", exact: true }).first(),
      ).toBeFocused();
    });
  }

test("storage failure keeps creation in the modal and demo remains available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage is full");
    };
  });
  await page.goto("/projects");
  const modal = await openNew(page);
  await modal.getByRole("radio", { name: "Start blank", exact: true }).click();
  await modal
    .getByLabel("Project name", { exact: true })
    .fill("Unsaved project");
  await modal
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(modal.getByRole("alert")).toContainText("Storage is full");
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Open demo project" }).click();
  await expect(page.locator(".scenario-switch")).toBeVisible();
});

test("OAuth callback restores the initiating project instead of the legacy device draft", async ({
  page,
}) => {
  await page.goto("/projects");
  await blank(page, "OAuth return project");
  const path = new URL(page.url()).pathname;
  await page.evaluate(
    (value) =>
      sessionStorage.setItem("needtrace.oauth.project-return.v1", value),
    path,
  );
  await page.goto("/?builder=1&authError=1");
  await expect(page).toHaveURL(new RegExp(path + "\\?builder=1&authError=1"));
  await expect(page.getByLabel("Network name", { exact: true })).toHaveValue(
    "OAuth return project",
  );
});
