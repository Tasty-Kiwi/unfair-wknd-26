import { test, expect, type Page } from "@playwright/test";
import { createCoreExample } from "../src/lib/builder/factories";
import type { BuilderWorkspaceV1 } from "../src/lib/builder/types";
import type { CloudProject, CloudUser } from "../src/lib/cloud/contracts";

const key = "dominoos.builder.workspace.v1";
const user = { id: "test-owner", name: "Test owner" };
function workspace(name = "Device draft"): BuilderWorkspaceV1 {
  return {
    format: "dominoos-builder-workspace",
    version: 1,
    document: { ...createCoreExample(), name },
    scenarios: [
      {
        scenario: {
          id: "saved-scenario",
          name: "Saved disruption",
          deliveryOverrides: [],
          alternatives: [],
        },
        validatedNetworkKey: null,
      },
    ],
    selectedScenarioId: "saved-scenario",
    workingScenario: null,
    source: { origin: "fictional", openedFromFile: true },
  };
}

type State = {
  user: CloudUser | null;
  projects: Map<string, CloudProject & { owner: string }>;
  failSave?: boolean;
  conflict?: boolean;
};
async function api(page: Page, state: State) {
  await page.route("**/api/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname,
      method = request.method();
    const reply = (status: number, json: unknown) =>
      route.fulfill({ status, json });
    if (path === "/api/me")
      return reply(
        state.user ? 200 : 401,
        state.user ? { user: state.user } : { error: { code: "unauthorized" } },
      );
    if (path === "/api/auth/sign-out") {
      state.user = null;
      return reply(200, { success: true });
    }
    if (path === "/api/auth/sign-in/social")
      return reply(200, {
        url: "https://github.com/login/oauth/authorize?client_id=test&state=test",
        redirect: true,
      });
    if (!state.user) return reply(401, { error: { code: "unauthorized" } });
    if (path === "/api/projects" && method === "GET") {
      const projects = [...state.projects.values()]
        .filter((p) => p.owner === state.user!.id)
        .map(({ workspace: _, owner: __, ...p }) => p);
      return reply(200, { projects, nextOffset: null });
    }
    if (method === "POST" && path === "/api/projects") {
      const input = request.postDataJSON();
      const project = {
        id: crypto.randomUUID(),
        name: input.name,
        version: 1,
        createdAt: "2026-11-13T12:00:00Z",
        updatedAt: "2026-11-13T12:00:00Z",
        workspace: input.workspace,
        owner: state.user.id,
      };
      state.projects.set(project.id, project);
      const { workspace: _, owner: __, ...metadata } = project;
      return reply(201, { project: metadata });
    }
    const id = path.split("/")[3],
      project = state.projects.get(id);
    if (!project || project.owner !== state.user.id)
      return reply(404, { error: { code: "not_found" } });
    if (method === "GET") {
      const { owner: _, ...visible } = project;
      return reply(200, { project: visible });
    }
    if (method === "PUT") {
      if (state.failSave)
        return reply(503, { error: { code: "cloud_unavailable" } });
      const input = request.postDataJSON();
      if (state.conflict || input.expectedVersion !== project.version)
        return reply(409, {
          error: {
            code: "version_conflict",
            currentVersion: project.version + 1,
          },
        });
      Object.assign(project, {
        workspace: input.workspace,
        version: project.version + 1,
      });
      const { workspace: _, owner: __, ...metadata } = project;
      return reply(200, { project: metadata });
    }
    return reply(405, { error: { code: "method_not_allowed" } });
  });
}
async function seed(page: Page, value: BuilderWorkspaceV1) {
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key, value },
  );
}
const builder = (page: Page) =>
  page.getByRole("main", { name: "Supply chain builder" });
async function openSaved(page: Page) {
  await builder(page)
    .getByRole("button", { name: "My projects", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "My projects" })
    .getByRole("button", { name: "Open", exact: true })
    .click();
}

test("guest editing makes no API calls and survives unavailable cloud", async ({
  page,
}) => {
  const calls: string[] = [];
  await page.route("**/api/**", (route) => {
    calls.push(route.request().url());
    return route.fulfill({
      status: 503,
      json: { error: { code: "cloud_unavailable" } },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  await builder(page)
    .getByLabel("Network name", { exact: true })
    .fill("Still local");
  await expect(builder(page).getByRole("status").first()).toContainText(
    "Saved locally",
  );
  expect(calls).toHaveLength(0);
  await builder(page)
    .getByRole("button", { name: "Sign in with GitHub" })
    .click();
  await expect(builder(page)).toContainText("Cloud is unavailable");
  await expect(
    builder(page).getByLabel("Network name", { exact: true }),
  ).toHaveValue("Still local");
});

test("GitHub navigation flushes the device draft first", async ({ page }) => {
  const state: State = { user: null, projects: new Map() };
  await api(page, state);
  await page.route("https://github.com/login/oauth/authorize**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>GitHub test destination</title>",
    }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Build a network", exact: true })
    .click();
  await builder(page)
    .getByLabel("Network name", { exact: true })
    .fill("Before GitHub");
  let stored = "";
  page.on("request", (request) => {
    if (request.url().startsWith("https://github.com/")) stored = "navigated";
  });
  // The sign-in request happens only after host.persist, even before autosave's debounce.
  await page.route("**/api/auth/sign-in/social", async (route) => {
    const current = await page.evaluate(
      (key) => localStorage.getItem(key),
      key,
    );
    expect(JSON.parse(current!).document.name).toBe("Before GitHub");
    return route.fulfill({
      json: {
        url: "https://github.com/login/oauth/authorize?client_id=test&state=test",
        redirect: true,
      },
    });
  });
  await builder(page)
    .getByRole("button", { name: "Sign in with GitHub" })
    .click();
  await expect(page).toHaveURL(/github\.com\/login\/oauth\/authorize/);
  expect(stored).toBe("navigated");
});

test("cloud round-trip in a fresh browser keeps guest draft and handles conflict without overwrite", async ({
  page,
  browser,
  baseURL,
}) => {
  page.on("dialog", (dialog) => dialog.accept());
  const state: State = { user, projects: new Map() };
  await api(page, state);
  await seed(page, workspace());
  await page.goto("/?builder=1");
  await expect(
    builder(page).getByRole("button", { name: "Save to cloud", exact: true }),
  ).toBeVisible();
  await builder(page)
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  const name = page.getByRole("dialog", { name: "Save to cloud", exact: true });
  await name.getByLabel("Project name").fill("Cloud network");
  await name
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(name).not.toBeVisible();
  expect(state.projects.size).toBe(1);
  const original = [...state.projects.values()][0];
  expect(original.workspace.scenarios[0].scenario.name).toBe(
    "Saved disruption",
  );
  await builder(page)
    .getByLabel("Network name", { exact: true })
    .fill("Unsaved cloud edits");
  state.conflict = true;
  await builder(page)
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(builder(page)).toContainText(
    "The cloud project has a newer version",
  );
  expect(original.workspace.document.name).toBe("Device draft");
  await builder(page)
    .getByRole("button", { name: "Keep working locally" })
    .click();
  await builder(page)
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    builder(page).getByLabel("Network name", { exact: true }),
  ).toHaveValue("Device draft");
  const guest = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).document.name,
    key,
  );
  expect(guest).toBe("Device draft");

  const fresh = await browser.newContext({ baseURL });
  const otherPage = await fresh.newPage();
  otherPage.on("dialog", (dialog) => dialog.accept());
  state.user = user;
  await api(otherPage, state);
  await otherPage.goto("/?builder=1");
  await expect(
    builder(otherPage).getByRole("button", {
      name: "My projects",
      exact: true,
    }),
  ).toBeVisible();
  await openSaved(otherPage);
  await expect(
    builder(otherPage).getByLabel("Network name", { exact: true }),
  ).toHaveValue("Device draft");
  await expect(
    builder(otherPage).getByLabel("Select scenario", { exact: true }),
  ).toContainText("Saved disruption");
  await expect(
    builder(otherPage).getByTestId("builder-canvas").locator(".builder-node"),
  ).toHaveCount(original.workspace.document.nodes.length);
  await fresh.close();
});

test("failed cloud updates preserve edits and do not change the guest draft", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());
  const saved = workspace("Remote network");
  const id = crypto.randomUUID();
  const state: State = {
    user,
    failSave: true,
    projects: new Map([
      [
        id,
        {
          id,
          name: "Remote",
          version: 1,
          createdAt: "2026-11-13T12:00:00Z",
          updatedAt: "2026-11-13T12:00:00Z",
          workspace: saved,
          owner: user.id,
        },
      ],
    ]),
  };
  await api(page, state);
  await seed(page, workspace("Guest backup"));
  await page.goto("/?builder=1");
  await expect(
    builder(page).getByRole("button", { name: "My projects", exact: true }),
  ).toBeVisible();
  await openSaved(page);
  await expect(
    builder(page).getByLabel("Network name", { exact: true }),
  ).toHaveValue("Remote network");
  await builder(page)
    .getByLabel("Network name", { exact: true })
    .fill("Kept despite cloud error");
  await builder(page)
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(builder(page)).toContainText("Not saved to cloud");
  await expect(builder(page)).toContainText("Cloud is unavailable");
  await expect(
    builder(page).getByLabel("Network name", { exact: true }),
  ).toHaveValue("Kept despite cloud error");
  await expect
    .poll(async () =>
      page.evaluate(
        ({ key, id }) => {
          const guest = JSON.parse(localStorage.getItem(key)!);
          const cloud = JSON.parse(
            localStorage.getItem(
              `dominoos.builder.cloud-draft.v1:test-owner:${id}`,
            )!,
          );
          return [guest?.document.name, cloud?.document.name];
        },
        { key, id },
      ),
    )
    .toEqual(["Guest backup", "Kept despite cloud error"]);
  expect(state.projects.get(id)!.workspace.document.name).toBe(
    "Remote network",
  );
});

test("late Open cannot replace edits made after its dialog closes", async ({
  page,
}) => {
  const id = crypto.randomUUID(),
    saved = workspace("Cloud version");
  const state: State = {
    user,
    projects: new Map([
      [
        id,
        {
          id,
          name: "Remote",
          version: 1,
          createdAt: "2026-11-13T12:00:00Z",
          updatedAt: "2026-11-13T12:00:00Z",
          workspace: saved,
          owner: user.id,
        },
      ],
    ]),
  };
  await api(page, state);
  await seed(page, workspace("Guest work"));
  let started!: () => void, finish!: () => void;
  const startedPromise = new Promise<void>((resolve) => {
    started = resolve;
  });
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route(`**/api/projects/${id}`, async (route) => {
    started();
    await pending;
    const { owner: _, ...project } = state.projects.get(id)!;
    await route.fulfill({ json: { project } });
  });
  await page.goto("/?builder=1");
  await expect(
    builder(page).getByRole("button", { name: "My projects", exact: true }),
  ).toBeVisible();
  await builder(page)
    .getByRole("button", { name: "My projects", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "My projects" });
  await dialog.getByRole("button", { name: "Open", exact: true }).click();
  await startedPromise;
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await builder(page)
    .getByLabel("Network name", { exact: true })
    .fill("New edit during fetch");
  finish();
  await expect(builder(page)).toContainText("Your edits changed while opening");
  await expect(
    builder(page).getByLabel("Network name", { exact: true }),
  ).toHaveValue("New edit during fetch");
});

test("sign-out ignores a save response that arrives later", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());
  const id = crypto.randomUUID();
  const state: State = {
    user,
    projects: new Map([
      [
        id,
        {
          id,
          name: "Remote",
          version: 1,
          createdAt: "2026-11-13T12:00:00Z",
          updatedAt: "2026-11-13T12:00:00Z",
          workspace: workspace("Cloud workspace"),
          owner: user.id,
        },
      ],
    ]),
  };
  await api(page, state);
  await seed(page, workspace("Guest fallback"));
  await page.goto("/?builder=1");
  await expect(
    builder(page).getByRole("button", { name: "My projects", exact: true }),
  ).toBeVisible();
  await openSaved(page);
  await expect(
    builder(page).getByLabel("Network name", { exact: true }),
  ).toHaveValue("Cloud workspace");
  let started!: () => void, release!: () => void;
  const began = new Promise<void>((resolve) => {
    started = resolve;
  });
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/projects/${id}`, async (route) => {
    started();
    await pending;
    const { owner: _, workspace: __, ...project } = state.projects.get(id)!;
    await route.fulfill({ json: { project: { ...project, version: 2 } } });
  });
  await builder(page)
    .getByLabel("Network name", { exact: true })
    .fill("Local edit before logout");
  await builder(page)
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await began;
  await builder(page)
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await expect(
    builder(page).getByRole("button", { name: "Sign in with GitHub" }),
  ).toBeEnabled();
  release();
  await expect(
    builder(page).getByLabel("Network name", { exact: true }),
  ).toHaveValue("Guest fallback");
  await expect(
    builder(page).getByRole("button", { name: "My projects", exact: true }),
  ).not.toBeVisible();
  await expect(builder(page)).toContainText("Signed out");
  const draft = await page.evaluate(
    (id) =>
      JSON.parse(
        localStorage.getItem(
          `dominoos.builder.cloud-draft.v1:test-owner:${id}`,
        )!,
      ).document.name,
    id,
  );
  expect(draft).toBe("Local edit before logout");
});
