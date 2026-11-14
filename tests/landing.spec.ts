import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"]) {
  test(`${theme}: three engine-backed outcomes, keyboard and theme persistence`, async ({
    page,
  }) => {
    await page.goto("/landing");
    await page
      .getByRole("button", {
        name: `${theme === "light" ? "Light" : "Dark"} mode`,
      })
      .click();
    await page.reload();
    await expect(page.locator(".lp-page")).toHaveAttribute("data-theme", theme);
    await expect(page.locator("html")).toHaveAttribute(
      "data-landing-theme",
      theme,
    );
    const controls = page.getByRole("group", { name: "Supply scenario" });
    const outcome = page.getByRole("status");
    await expect(page.getByTestId("landing-shortage")).toHaveText("2");
    await page.getByText("Why this result?", { exact: true }).click();
    await expect(page.getByTestId("landing-exposure")).toHaveText("€36,000");
    await expect(page.locator(".lp-summary")).toContainText(
      "Exposure, not a predicted loss",
    );
    await controls
      .getByRole("button", { name: "On time", exact: true })
      .click();
    await expect(page.getByTestId("landing-shortage")).toHaveText("0");
    await expect(page.getByTestId("landing-exposure")).toHaveText("€0");
    await expect(outcome).toContainText("All 10 orders covered");
    const recovery = controls.getByRole("button", {
      name: "Alternative supply applied",
      exact: true,
    });
    await recovery.focus();
    await page.keyboard.press("Enter");
    await expect(recovery).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("landing-shortage")).toHaveText("0");
    await expect(page.locator(".lp-applied")).toContainText(
      "Applied to scenario",
    );
    await expect(outcome).toContainText(
      "original Aster receipt still arrives on 23 Nov",
    );
    await controls
      .getByRole("button", { name: "Delivery delayed", exact: true })
      .click();
    await expect(page.getByTestId("landing-shortage")).toHaveText("2");
    await expect(page.locator(".lp-summary")).toContainText(
      "Approval and availability are fictional inputs",
    );
  });
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ]) {
    test(`${theme}: ${width}px layout, focus and reduced motion`, async ({
      page,
    }) => {
      await page.addInitScript(
        (t) => localStorage.setItem("dominoos.landing.theme.v2", t),
        theme,
      );
      await page.emulateMedia({
        reducedMotion: "reduce",
        colorScheme: theme === "light" ? "dark" : "light",
      });
      await page.setViewportSize({ width, height });
      await page.goto("/landing/");
      await expect(page.locator(".lp-page")).toHaveAttribute(
        "data-theme",
        theme,
      );
      const cta = page
        .getByRole("link", { name: "Open projects", exact: true })
        .first();
      const r = (await cta.boundingBox())!;
      expect(r.y + r.height).toBeLessThan(height);
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("link", { name: "Skip to content" }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#lp-main")).toBeFocused();
      await page
        .getByRole("button", {
          name: "Alternative supply applied",
          exact: true,
        })
        .click();
      await expect(page.getByTestId("landing-shortage")).toHaveText("0");
      expect(
        await page
          .locator(".lp-receipt")
          .evaluate((el) => getComputedStyle(el).transitionDuration),
      ).toBe("0s");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const button of await page
        .locator(".lp-theme button, .lp-state-controls button")
        .all()) {
        const b = (await button.boundingBox())!;
        expect(b.height).toBeGreaterThanOrEqual(44);
        expect(b.width).toBeGreaterThanOrEqual(44);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(width);
      }
      if (width >= 600) {
        await page
          .getByRole("link", { name: "The product", exact: true })
          .click();
        await expect(page.locator("#lp-evidence")).toBeInViewport();
      }
    });
  }
}
test("default light, simulator and actual builder entry points remain isolated", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/landing");
  await expect(page.locator(".lp-page")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  await page
    .getByRole("link", { name: "Open projects", exact: true })
    .first()
    .click();
  await page.getByRole("link", { name: "Open demo project" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Every order has its required materials",
  );
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("link", { name: "Needtrace home" }),
  ).toBeVisible();
  await page.goto("/landing");
  await page
    .getByRole("link", { name: "Explore the demo", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "New project", exact: true })
    .first()
    .click();
  await page.getByRole("radio", { name: "Start blank", exact: true }).click();
  await page.getByLabel("Project name", { exact: true }).fill("My network");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "File", exact: true }).click();
  await page
    .getByLabel("Workspace actions")
    .getByRole("button", { name: "Core example", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Motor assembly network",
  );
});
test("theme remains usable when local storage is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    }),
  );
  await page.goto("/landing");
  await page.getByRole("button", { name: "Dark mode" }).click();
  await expect(page.locator(".lp-page")).toHaveAttribute("data-theme", "dark");
});

test("saved dark surface paints before the lazy route loads", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("dominoos.landing.theme.v2", "dark"),
  );
  await page.route(/\/assets\/.*\.js$/, (route) => route.abort());
  await page.goto("/landing");
  await expect(page.locator("html")).toHaveAttribute(
    "data-landing-theme",
    "dark",
  );
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(13, 20, 34)",
  );
});

test("product evidence changes between real allocation, network and builder captures", async ({
  page,
}) => {
  await page.goto("/landing");
  await page.getByRole("button", { name: "See the supply network" }).click();
  await expect(page.locator(".lp-showcase img")).toHaveAttribute(
    "src",
    "/landing/simulator-detail.png",
  );
  await page
    .getByRole("button", { name: "Build your network", exact: false })
    .click();
  await expect(page.locator(".lp-showcase img")).toHaveAttribute(
    "src",
    "/landing/builder-detail.png",
  );
  await page.getByRole("button", { name: "Trace a shortage" }).click();
  await expect(page.locator(".lp-showcase img")).toHaveAttribute(
    "src",
    "/landing/shortage-desktop.png",
  );
  await expect(page.locator(".lp-showcase img")).toBeVisible();
});

test("mobile network preserves readable scale without clipping the timeline", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/landing");
  await page.getByRole("button", { name: "See the supply network" }).click();
  const image = page.getByRole("region", {
    name: "Supply network image; scroll to explore",
  });
  await image.locator("img").evaluate(async (img) => {
    await (img as HTMLImageElement).decode();
  });
  const bounds = await image.evaluate((e) => ({
    width: e.clientWidth,
    scroll: e.scrollWidth,
    height: e.clientHeight,
    content: e.scrollHeight,
    page: document.documentElement.scrollWidth,
  }));
  expect(bounds.scroll).toBeGreaterThan(bounds.width);
  expect(bounds.height).toBeGreaterThanOrEqual(bounds.content - 1);
  expect(bounds.page).toBe(390);
  await image.focus();
  await expect(image).toBeFocused();
  await image.evaluate((e) => (e.scrollLeft = e.scrollWidth));
  expect(await image.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
});
