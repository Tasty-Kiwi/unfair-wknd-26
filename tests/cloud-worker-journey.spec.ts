import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { fileAction, openScenarios } from "./ui-helpers";
import { createTestHarness } from "wrangler";
import { randomTestToken, hashTestToken } from "../worker-tests/helpers";
import { readFile } from "node:fs/promises";
import { createCoreExample } from "../src/lib/builder/factories";
import type { BuilderWorkspaceV1 } from "../src/lib/builder/types";

// This runs the built SPA and production Worker against isolated local D1.
// Only session setup is synthetic: no API interception or deployed auth bypass.
// It proves persistence/authorization through real cookies, not GitHub code exchange.
const workerOptions = {
  configPath: "./wrangler.local.jsonc",
  secrets: {
    GITHUB_CLIENT_ID: "browser-test-client",
    GITHUB_CLIENT_SECRET: "browser-test-secret",
  },
};
const server = createTestHarness({ workers: [workerOptions] });
let origin: string;
let db: D1Database;
const guestKey = "dominoos.builder.workspace.v1";

test.beforeAll(async () => {
  const { url } = await server.listen();
  origin = url.origin;
  // The real browser's Origin must match the configured canonical auth origin.
  await server.update({
    workers: [{ ...workerOptions, vars: { AUTH_URL: origin } }],
  });
  const worker = server.getWorker<Env>();
  await worker.applyD1Migrations("DB");
  db = (await worker.getEnv()).DB;
});

test.afterAll(async () => {
  await server.close();
});

async function session(context: BrowserContext, userId: string) {
  await db
    .prepare(
      "INSERT OR IGNORE INTO github_identities (github_id,user_id,name) VALUES (?,?,?)",
    )
    .bind("test:" + userId, userId, userId)
    .run();
  const token = randomTestToken();
  await db
    .prepare(
      "INSERT INTO cloud_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)",
    )
    .bind(await hashTestToken(token), userId, Date.now() + 86_400_000)
    .run();
  await context.addCookies([
    {
      name: "domino_session",
      value: token,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  return `domino_session=${token}`;
}

const builder = (page: Page) =>
  page.getByRole("main", { name: "Supply chain builder" });

async function exportedWorkspace(page: Page): Promise<BuilderWorkspaceV1> {
  const downloaded = page.waitForEvent("download");
  await fileAction(builder(page), "Export workspace JSON");
  const path = await (await downloaded).path();
  expect(path).toBeTruthy();
  return JSON.parse(await readFile(path!, "utf8"));
}

test("real Worker and D1 preserve a project across browser contexts and deny a second owner", async ({
  browser,
}) => {
  test.setTimeout(60_000);
  const first = await browser.newContext({ acceptDownloads: true });
  const second = await browser.newContext({ acceptDownloads: true });
  const outsider = await browser.newContext();
  try {
    const originalCookie = await session(first, "browser-owner-a");
    const page = await first.newPage();
    const guest: BuilderWorkspaceV1 = {
      format: "dominoos-builder-workspace",
      version: 1,
      document: { ...createCoreExample(), name: "D1 network" },
      scenarios: [],
      selectedScenarioId: null,
      workingScenario: null,
      source: { origin: "fictional", openedFromFile: false },
    };
    await page.addInitScript(
      ({ key, workspace }) =>
        localStorage.setItem(key, JSON.stringify(workspace)),
      { key: guestKey, workspace: guest },
    );
    await page.goto(origin + "/?builder=1");
    await expect(
      builder(page).getByText("Signed in as browser-owner-a", { exact: true }),
    ).toBeVisible();
    await builder(page)
      .getByRole("button", { name: "Run simulation", exact: true })
      .click();
    await builder(page)
      .getByRole("button", { name: "New scenario", exact: true })
      .click();
    await builder(page)
      .getByLabel("Scenario name", { exact: true })
      .fill("D1 receipt delay");
    await builder(page)
      .getByLabel("Available date", { exact: true })
      .first()
      .fill("2026-11-30");
    await builder(page)
      .getByRole("button", { name: "Save scenario", exact: true })
      .click();
    const simulation = await builder(page)
      .getByRole("region", { name: "Simulation summary" })
      .innerText();

    await builder(page)
      .getByRole("button", { name: "Save to cloud", exact: true })
      .click();
    const naming = page.getByRole("dialog", {
      name: "Save to cloud",
      exact: true,
    });
    await naming.getByLabel("Project name").fill("Private D1 project");
    const createdResponse = page.waitForResponse(
      (r) =>
        r.url() === origin + "/api/projects" && r.request().method() === "POST",
    );
    await naming
      .getByRole("button", { name: "Save to cloud", exact: true })
      .click();
    const created = await createdResponse;
    expect(created.status()).toBe(201);
    const { project } = await created.json();
    await expect(naming).not.toBeVisible();
    const saved = await exportedWorkspace(page);
    expect(saved.scenarios[0].scenario.name).toBe("D1 receipt delay");
    expect(saved.scenarios[0].validatedNetworkKey).toBeTruthy();
    const row = await db
      .prepare("SELECT owner_id, workspace_json FROM projects WHERE id = ?")
      .bind(project.id)
      .first<{ owner_id: string; workspace_json: string }>();
    expect(row?.owner_id).toBe("browser-owner-a");
    expect(JSON.parse(row!.workspace_json)).toEqual(saved);

    await builder(page)
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await expect(builder(page)).toContainText(
      "Signed out. Your device draft is restored.",
    );
    expect((await first.request.get(origin + "/api/me")).status()).toBe(401);
    const revoked = await server.fetch(origin + "/api/me", {
      headers: { Cookie: originalCookie },
    });
    expect(revoked.status).toBe(401);

    // A new context has no localStorage and a separately issued session for A.
    await session(second, "browser-owner-a");
    const reopened = await second.newPage();
    await reopened.goto(origin + "/?builder=1");
    expect(
      (await reopened.evaluate(() =>
        localStorage.getItem("dominoos.builder.workspace.v1"),
      )) ?? "",
    ).not.toContain("D1 network");
    await builder(reopened)
      .getByRole("button", { name: "My projects", exact: true })
      .click();
    await reopened
      .getByRole("dialog", { name: "My projects" })
      .getByRole("button", { name: "Open", exact: true })
      .click();
    await openScenarios(builder(reopened));
    await expect(
      builder(reopened).getByLabel("Select scenario", { exact: true }),
    ).toContainText("D1 receipt delay");
    expect(await exportedWorkspace(reopened)).toEqual(saved);
    await builder(reopened)
      .getByRole("button", { name: "Simulate", exact: true })
      .click();
    await expect(
      builder(reopened).getByRole("region", { name: "Simulation summary" }),
    ).toHaveText(simulation, { useInnerText: true });

    // Update through the real UI and confirm SQL versioning/persisted content.
    await builder(reopened)
      .getByRole("button", { name: "Build", exact: true })
      .click();
    await builder(reopened)
      .getByLabel("Network name", { exact: true })
      .fill("Updated D1 network");
    const updatedResponse = reopened.waitForResponse(
      (r) =>
        r.request().method() === "PUT" &&
        r.url().endsWith("/api/projects/" + project.id),
    );
    await builder(reopened)
      .getByRole("button", { name: "Save to cloud", exact: true })
      .click();
    expect((await updatedResponse).status()).toBe(200);
    const latest = await second.request.get(
      origin + "/api/projects/" + project.id,
    );
    expect((await latest.json()).project).toMatchObject({
      version: 2,
      workspace: {
        document: { id: saved.document.id, name: "Updated D1 network" },
      },
    });

    await session(outsider, "browser-owner-b");
    const deniedGet = await outsider.request.get(
      origin + "/api/projects/" + project.id,
    );
    expect(deniedGet.status()).toBe(404);
    const deniedPut = await outsider.request.put(
      origin + "/api/projects/" + project.id,
      {
        headers: { Origin: origin },
        data: { name: "Stolen", expectedVersion: 2, workspace: saved },
      },
    );
    expect(deniedPut.status()).toBe(404);
    expect(
      (await (await outsider.request.get(origin + "/api/projects")).json())
        .projects,
    ).toEqual([]);
    expect(
      (
        await (
          await second.request.get(origin + "/api/projects/" + project.id)
        ).json()
      ).project.version,
    ).toBe(2);
  } finally {
    await Promise.all([first.close(), second.close(), outsider.close()]);
  }
});
