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

function jsonFetch(status: number, body: unknown) {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
}

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
