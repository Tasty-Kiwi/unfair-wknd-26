import { describe, expect, it } from "vitest";
import { createCloudClient } from "@/lib/cloud/client";
import { cloudDraftKey, describeCloudError } from "@/lib/cloud/useBuilderCloud";
import { saveWorkspace, WORKSPACE_STORAGE_KEY } from "@/lib/builder/storage";
import { createCoreExample } from "@/lib/builder/factories";
import {
  BUILDER_WORKSPACE_FORMAT,
  BUILDER_WORKSPACE_VERSION,
  type BuilderWorkspaceV1,
} from "@/lib/builder/types";

function jsonFetch(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", ...headers },
    });
}

const workspaceForUpdate = (): BuilderWorkspaceV1 => ({
  format: BUILDER_WORKSPACE_FORMAT,
  version: BUILDER_WORKSPACE_VERSION,
  document: createCoreExample(),
  scenarios: [],
  selectedScenarioId: null,
  workingScenario: null,
  source: { origin: "fictional", openedFromFile: false },
});

describe("cloud draft keys", () => {
  it("scopes each draft to one owner and one project", () => {
    expect(cloudDraftKey("user-1", "p1")).not.toBe(
      cloudDraftKey("user-2", "p1"),
    );
    expect(cloudDraftKey("user-1", "p1")).not.toBe(
      cloudDraftKey("user-1", "p2"),
    );
    expect(cloudDraftKey("user-1", "p1")).not.toBe(WORKSPACE_STORAGE_KEY);
  });

  it("encodes owner ids so separators cannot collide", () => {
    expect(cloudDraftKey("a:b", "p")).not.toBe(cloudDraftKey("a", "b:p"));
  });
});

describe("saveWorkspace key argument", () => {
  it("writes only to the requested slot and leaves the guest key alone", () => {
    const writes: Array<[string, string]> = [];
    const storage = {
      setItem(key: string, value: string) {
        writes.push([key, value]);
      },
    };
    const workspace: BuilderWorkspaceV1 = {
      format: BUILDER_WORKSPACE_FORMAT,
      version: BUILDER_WORKSPACE_VERSION,
      document: createCoreExample(),
      scenarios: [],
      selectedScenarioId: null,
      workingScenario: null,
      source: { origin: "fictional", openedFromFile: false },
    };
    const key = cloudDraftKey("user-1", "p1");
    const result = saveWorkspace(workspace, storage, key);
    expect(result.ok).toBe(true);
    expect(writes.map(([written]) => written)).toEqual([key]);
  });
});

describe("describeCloudError", () => {
  it("gives a neutral message for non-cloud errors without exposing details", () => {
    expect(describeCloudError(new Error("boom"))).toBe(
      "Not saved to cloud. Your work on this device is unchanged.",
    );
  });
});

describe("cloud client sign-in URL", () => {
  it("accepts only GitHub's authorization endpoint", async () => {
    const client = createCloudClient(
      jsonFetch(200, {
        url: "https://evil.example/login/oauth/authorize?x=1",
        redirect: true,
      }),
    );
    await expect(client.startGitHubSignIn()).rejects.toThrow();
  });

  it("returns the GitHub authorization URL", async () => {
    const url =
      "https://github.com/login/oauth/authorize?client_id=abc&state=s";
    const client = createCloudClient(jsonFetch(200, { url, redirect: true }));
    await expect(client.startGitHubSignIn()).resolves.toBe(url);
  });
});

describe("cloud client session check", () => {
  it("reports 401 so the editor can show a signed-out state", async () => {
    const client = createCloudClient(
      jsonFetch(401, {
        error: { code: "unauthorized", message: "Sign in." },
        requestId: "r1",
      }),
    );
    await expect(client.me()).rejects.toMatchObject({ status: 401 });
  });
});

describe("cloud availability", () => {
  it.each([true, false])(
    "accepts the explicit cloudEnabled flag %s",
    async (cloudEnabled) => {
      const client = createCloudClient(
        jsonFetch(200, { ok: true, cloudEnabled }),
      );
      await expect(client.health()).resolves.toEqual({
        ok: true,
        cloudEnabled,
      });
    },
  );

  it.each([
    { ok: true },
    { ok: true, cloudEnabled: "false" },
    { ok: false, cloudEnabled: true },
  ])("rejects malformed availability responses %j", async (body) => {
    await expect(
      createCloudClient(jsonFetch(200, body)).health(),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });
});

describe("cloud client rate limits", () => {
  it("maps a 429 without a server code to rate_limited", async () => {
    const client = createCloudClient(
      jsonFetch(
        429,
        { message: "Too many requests." },
        { "Retry-After": "12" },
      ),
    );
    await expect(client.me()).rejects.toMatchObject({
      status: 429,
      code: "rate_limited",
      retryAfterSeconds: 12,
    });
  });

  it("maps a 429 with a non-JSON body to rate_limited", async () => {
    const client = createCloudClient(
      async () => new Response("slow down", { status: 429 }),
    );
    await expect(client.me()).rejects.toMatchObject({
      status: 429,
      code: "rate_limited",
      retryAfterSeconds: undefined,
    });
  });

  it("reads X-Retry-After when Retry-After is absent", async () => {
    const client = createCloudClient(
      jsonFetch(429, { message: "Slow down." }, { "X-Retry-After": "7" }),
    );
    await expect(client.me()).rejects.toMatchObject({
      code: "rate_limited",
      retryAfterSeconds: 7,
    });
  });

  it("ignores Retry-After values that are not positive seconds", async () => {
    const client = createCloudClient(
      jsonFetch(429, {}, { "Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT" }),
    );
    await expect(client.me()).rejects.toMatchObject({
      code: "rate_limited",
      retryAfterSeconds: undefined,
    });
  });

  it("keeps a server code on a 429 instead of replacing it", async () => {
    const client = createCloudClient(
      jsonFetch(
        429,
        { error: { code: "creation_rate_limited" }, requestId: "r2" },
        { "Retry-After": "30" },
      ),
    );
    await expect(client.me()).rejects.toMatchObject({
      code: "creation_rate_limited",
      retryAfterSeconds: 30,
    });
  });

  it("preserves the 409 version fields on update", async () => {
    const client = createCloudClient(
      jsonFetch(409, {
        error: {
          code: "version_conflict",
          message: "Changed.",
          currentVersion: 4,
          updatedAt: "2026-11-13T12:30:00Z",
        },
        requestId: "r3",
      }),
    );
    await expect(
      client.updateProject("11111111-1111-4111-8111-111111111111", {
        name: "Network",
        workspace: workspaceForUpdate(),
        expectedVersion: 3,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "version_conflict",
      currentVersion: 4,
      updatedAt: "2026-11-13T12:30:00Z",
    });
  });
});
