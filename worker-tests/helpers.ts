import { serializeSignedCookie } from "better-call";
import { createTestHarness } from "wrangler";
import { createCoreExample } from "../src/lib/builder/factories";
import type { BuilderWorkspaceV1 } from "../src/lib/builder/types";
import type { ProjectMetadata } from "../src/lib/cloud/contracts";

export const TEST_ORIGIN = "http://localhost:5173";

// Test-only secrets; no deployed identity override or provider credentials.
export const TEST_AUTH_SECRET =
  "test-only-session-signing-secret-at-least-32-characters";

export const CLOUD_TEST_TABLES = [
  "projects",
  "session",
  "account",
  "verification",
  "user",
  "rateLimit",
] as const;

export type CloudTestHarness = ReturnType<typeof createCloudTestHarness>;
export type CloudTestServer = CloudTestHarness["server"];

/** Create an isolated Wrangler test harness for a single Worker test file. */
export function createCloudTestHarness() {
  const server = createTestHarness({
    workers: [
      {
        configPath: "./wrangler.local.jsonc",
        secrets: {
          BETTER_AUTH_SECRET: TEST_AUTH_SECRET,
          GITHUB_CLIENT_ID: "test-client-id",
          GITHUB_CLIENT_SECRET: "test-client-secret",
        },
      },
    ],
  });
  const worker = server.getWorker<Env>();
  return { server, worker };
}

/** Clear all cloud auth and project tables in a D1 database instance. */
export async function resetCloudTables(db: D1Database): Promise<void> {
  for (const table of CLOUD_TEST_TABLES) {
    await db.prepare(`DELETE FROM "${table}"`).run();
  }
}

/**
 * Seed a real local D1 user + session row and return a Better Auth signed cookie
 * plus the seeded userId. Uses production session verification without OAuth.
 */
export async function seedSessionCookie(
  db: D1Database,
  email: string,
  options?: {
    name?: string;
    userId?: string;
    expiresAtMs?: number;
  },
): Promise<{ cookie: string; userId: string }> {
  const userId = options?.userId ?? crypto.randomUUID();
  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = options?.expiresAtMs ?? now + 86_400_000;
  const name = options?.name ?? "Test User";

  await db
    .prepare(
      'INSERT INTO "user" (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?, ?, ?, 1, ?, ?)',
    )
    .bind(userId, name, email, now, now)
    .run();

  await db
    .prepare(
      "INSERT INTO session (id,expiresAt,token,createdAt,updatedAt,userId) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), expiresAt, token, now, now, userId)
    .run();

  const cookie = (
    await serializeSignedCookie(
      "better-auth.session_token",
      token,
      TEST_AUTH_SECRET,
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      },
    )
  ).split(";")[0];

  return { cookie, userId };
}

export type WorkerRequestOptions = {
  method?: string;
  body?: unknown;
  rawBody?: string | Uint8Array;
  cookie?: string;
  origin?: string | null;
  contentType?: string | null;
  contentEncoding?: string;
  headers?: Record<string, string>;
};

/** Issue an HTTP request against a test harness server with explicit framing options. */
export function sendWorkerRequest(
  server: CloudTestServer,
  path: string,
  options?: WorkerRequestOptions,
): ReturnType<CloudTestServer["fetch"]> {
  const method = options?.method ?? "GET";
  const headers = new Headers(options?.headers);

  if (options?.origin !== null) {
    headers.set("Origin", options?.origin ?? TEST_ORIGIN);
  }
  if (!headers.has("CF-Connecting-IP")) {
    headers.set("CF-Connecting-IP", "192.0.2.10");
  }
  if (options?.cookie) {
    headers.set("Cookie", options.cookie);
  }
  if (options?.contentEncoding) {
    headers.set("Content-Encoding", options.contentEncoding);
  }

  let body: string | Uint8Array | undefined;
  if (options?.rawBody !== undefined) {
    body = options.rawBody;
    if (options.contentType !== null && !headers.has("Content-Type")) {
      headers.set("Content-Type", options.contentType ?? "application/json");
    }
  } else if (options?.body !== undefined) {
    body = JSON.stringify(options.body);
    if (options.contentType !== null && !headers.has("Content-Type")) {
      headers.set("Content-Type", options.contentType ?? "application/json");
    }
  } else if (options?.contentType) {
    headers.set("Content-Type", options.contentType);
  }

  return server.fetch(TEST_ORIGIN + path, {
    method,
    redirect: "manual",
    headers: Object.fromEntries(headers.entries()),
    body,
  });
}

/** Build a valid sample BuilderWorkspaceV1 for Worker integration tests. */
export function createSampleWorkspace(): BuilderWorkspaceV1 {
  return {
    format: "dominoos-builder-workspace",
    version: 1,
    document: createCoreExample(),
    scenarios: [
      {
        scenario: {
          id: "saved-delay",
          name: "Saved draft scenario",
          deliveryOverrides: [],
          alternatives: [],
        },
        validatedNetworkKey: null,
        receiptSnapshots: [],
      },
    ],
    selectedScenarioId: "saved-delay",
    workingScenario: {
      scenario: {
        id: "saved-delay",
        name: "Saved draft scenario",
        deliveryOverrides: [],
        alternatives: [],
      },
      validatedNetworkKey: null,
      receiptSnapshots: [],
    },
    source: { origin: "fictional", openedFromFile: true },
  };
}

/** Create a cloud project via POST /api/projects and assert 201 Created. */
export async function createCloudProject(
  server: CloudTestServer,
  cookie: string,
  options?: { name?: string; workspace?: BuilderWorkspaceV1 },
): Promise<ProjectMetadata> {
  const response = await sendWorkerRequest(server, "/api/projects", {
    method: "POST",
    body: {
      name: options?.name ?? "Sample",
      workspace: options?.workspace ?? createSampleWorkspace(),
    },
    cookie,
  });
  if (response.status !== 201) {
    throw new Error(
      `Expected 201 from POST /api/projects, received ${response.status}`,
    );
  }
  return ((await response.json()) as { project: ProjectMetadata }).project;
}
