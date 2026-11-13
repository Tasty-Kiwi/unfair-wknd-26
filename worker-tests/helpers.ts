import { createTestHarness } from "wrangler";
import { createCoreExample } from "../src/lib/builder/factories";
import type { BuilderWorkspaceV1 } from "../src/lib/builder/types";
import type { ProjectMetadata } from "../src/lib/cloud/contracts";

export const TEST_ORIGIN = "http://localhost:5173";

// All identity setup is isolated to local test databases, never a deployed bypass.
export const CLOUD_TEST_TABLES = [
  "projects",
  "cloud_sessions",
  "oauth_attempts",
  "oauth_limits",
  "github_identities",
] as const;

export function randomTestToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    "base64url",
  );
}

export async function hashTestToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Buffer.from(digest).toString("hex");
}

export type CloudTestHarness = ReturnType<typeof createCloudTestHarness>;
export type CloudTestServer = CloudTestHarness["server"];

/** Create an isolated Wrangler test harness for a single Worker test file. */
export function createCloudTestHarness() {
  const server = createTestHarness({
    workers: [
      {
        configPath: "./wrangler.local.jsonc",
        secrets: {
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

/** Seed an opaque session in local D1; production verification still reads its hash. */
export async function seedSessionCookie(
  db: D1Database,
  label: string,
  options?: { name?: string; userId?: string; expiresAtMs?: number },
): Promise<{ cookie: string; userId: string }> {
  const userId = options?.userId ?? crypto.randomUUID();
  const token = randomTestToken();
  await db
    .prepare(
      "INSERT INTO github_identities (github_id,user_id,name) VALUES (?,?,?)",
    )
    .bind("test:" + label, userId, options?.name ?? "Test User")
    .run();
  await db
    .prepare(
      "INSERT INTO cloud_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)",
    )
    .bind(
      await hashTestToken(token),
      userId,
      options?.expiresAtMs ?? Date.now() + 86_400_000,
    )
    .run();
  return { cookie: `domino_session=${token}`, userId };
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
