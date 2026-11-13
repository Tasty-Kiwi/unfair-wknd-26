import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  CLOUD_MAX_WORKSPACE_BYTES,
  type CloudErrorResponse,
  type CloudProjectDetailResponse,
  type CloudProjectListResponse,
  type CloudProjectMetadataResponse,
  CLOUD_PROJECT_LIMIT,
  canonicalizeCloudWorkspace,
} from "../src/lib/cloud/contracts";
import type { BuilderWorkspaceV1 } from "../src/lib/builder/types";
import {
  createCloudProject,
  createCloudTestHarness,
  createSampleWorkspace,
  resetCloudTables,
  seedSessionCookie,
  sendWorkerRequest,
} from "./helpers";

const { server, worker } = createCloudTestHarness();
let db: D1Database;

beforeAll(async () => {
  await server.listen();
  await worker.applyD1Migrations("DB");
  db = (await worker.getEnv()).DB;
}, 60_000);

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await resetCloudTables(db);
});

describe("project routes boundary and D1 integration", () => {
  it("enforces request framing on POST and PUT (origin, media type, encoding, JSON, raw body cap)", async () => {
    const { cookie } = await seedSessionCookie(db, "framing@example.test");
    const created = await createCloudProject(server, cookie);
    const putPath = `/api/projects/${created.id}`;
    const validCreate = { name: "Valid", workspace: createSampleWorkspace() };
    const validUpdate = { ...validCreate, expectedVersion: 1 };

    for (const [path, method, body] of [
      ["/api/projects", "POST", validCreate],
      [putPath, "PUT", validUpdate],
    ] as const) {
      // Missing Origin -> 403 origin_rejected
      const noOrigin = await sendWorkerRequest(server, path, {
        method,
        body,
        cookie,
        origin: null,
      });
      expect(noOrigin.status).toBe(403);
      expect(((await noOrigin.json()) as CloudErrorResponse).error.code).toBe(
        "origin_rejected",
      );

      // Cross-origin -> 403 origin_rejected
      const evilOrigin = await sendWorkerRequest(server, path, {
        method,
        body,
        cookie,
        origin: "https://evil.example",
      });
      expect(evilOrigin.status).toBe(403);
      expect(((await evilOrigin.json()) as CloudErrorResponse).error.code).toBe(
        "origin_rejected",
      );

      // Non-JSON Content-Type -> 415 unsupported_media_type
      const wrongType = await sendWorkerRequest(server, path, {
        method,
        rawBody: JSON.stringify(body),
        cookie,
        contentType: "text/plain",
      });
      expect(wrongType.status).toBe(415);
      expect(((await wrongType.json()) as CloudErrorResponse).error.code).toBe(
        "unsupported_media_type",
      );

      // Unsupported Content-Encoding -> 415 unsupported_content_encoding
      const badEncoding = await sendWorkerRequest(server, path, {
        method,
        body,
        cookie,
        contentEncoding: "gzip",
      });
      expect(badEncoding.status).toBe(415);
      expect(
        ((await badEncoding.json()) as CloudErrorResponse).error.code,
      ).toBe("unsupported_content_encoding");

      // Malformed JSON -> 400 invalid_json
      const malformedJson = await sendWorkerRequest(server, path, {
        method,
        rawBody: "{not-json",
        cookie,
      });
      expect(malformedJson.status).toBe(400);
      expect(
        ((await malformedJson.json()) as CloudErrorResponse).error.code,
      ).toBe("invalid_json");

      // Workspace > CLOUD_MAX_WORKSPACE_BYTES -> 413 payload_too_large
      const oversizedWorkspace = createSampleWorkspace();
      oversizedWorkspace.document.name = "";
      const overhead = canonicalizeCloudWorkspace(oversizedWorkspace).bytes;
      oversizedWorkspace.document.name = "x".repeat(
        CLOUD_MAX_WORKSPACE_BYTES - overhead + 1,
      );
      const oversizedBody =
        method === "POST"
          ? { name: "Oversized", workspace: oversizedWorkspace }
          : {
              name: "Oversized",
              workspace: oversizedWorkspace,
              expectedVersion: 1,
            };
      const oversizedRes = await sendWorkerRequest(server, path, {
        method,
        body: oversizedBody,
        cookie,
      });
      expect(oversizedRes.status).toBe(413);
      const oversizedPayload =
        (await oversizedRes.json()) as CloudErrorResponse;
      expect(oversizedPayload.error.code).toBe("payload_too_large");
      expect(oversizedPayload.error.maxBytes).toBe(CLOUD_MAX_WORKSPACE_BYTES);
    }
  });

  it("returns 405 with Allow header, empty HEAD bodies, and 404 for non-UUID project ids", async () => {
    const { cookie } = await seedSessionCookie(db, "methods@example.test");
    const created = await createCloudProject(server, cookie);

    const methodChecks = [
      { path: "/api/health", method: "POST", allow: "GET" },
      { path: "/api/health", method: "HEAD", allow: "GET" },
      { path: "/api/me", method: "POST", allow: "GET" },
      { path: "/api/me", method: "HEAD", allow: "GET" },
      { path: "/api/projects", method: "DELETE", allow: "GET, POST" },
      { path: "/api/projects", method: "HEAD", allow: "GET, POST" },
      {
        path: `/api/projects/${created.id}`,
        method: "DELETE",
        allow: "GET, PUT",
      },
      {
        path: `/api/projects/${created.id}`,
        method: "HEAD",
        allow: "GET, PUT",
      },
    ] as const;

    for (const check of methodChecks) {
      const response = await sendWorkerRequest(server, check.path, {
        method: check.method,
        cookie,
      });
      expect(response.status).toBe(405);
      expect(response.headers.get("Allow")).toBe(check.allow);
      if (check.method === "HEAD") {
        expect(await response.text()).toBe("");
      } else {
        const body = (await response.json()) as CloudErrorResponse;
        expect(body.error.code).toBe("method_not_allowed");
      }
    }

    const nonUuid = await sendWorkerRequest(
      server,
      "/api/projects/not-a-uuid",
      { cookie },
    );
    expect(nonUuid.status).toBe(404);
    expect(((await nonUuid.json()) as CloudErrorResponse).error.code).toBe(
      "not_found",
    );
  });

  it("validates pagination bounds and orders list pages by updated_at DESC, id ASC", async () => {
    const { cookie, userId } = await seedSessionCookie(
      db,
      "paging@example.test",
    );

    for (const badQuery of [
      "limit=0",
      "limit=51",
      "offset=-1",
      "offset=10001",
    ]) {
      const bad = await sendWorkerRequest(server, `/api/projects?${badQuery}`, {
        cookie,
      });
      expect(bad.status).toBe(400);
      expect(((await bad.json()) as CloudErrorResponse).error.code).toBe(
        "invalid_request",
      );
    }

    const workspaceJson = JSON.stringify(createSampleWorkspace());
    const rows = [
      {
        id: "00000000-0000-4000-8000-000000000002",
        name: "Tie B",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "00000000-0000-4000-8000-000000000001",
        name: "Tie A",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "00000000-0000-4000-8000-000000000003",
        name: "Oldest",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    for (const row of rows) {
      await db
        .prepare("INSERT INTO projects VALUES (?, ?, ?, ?, 1, ?, ?)")
        .bind(
          row.id,
          userId,
          row.name,
          workspaceJson,
          "2026-01-01T00:00:00.000Z",
          row.updatedAt,
        )
        .run();
    }

    const page1Res = await sendWorkerRequest(
      server,
      "/api/projects?limit=2&offset=0",
      { cookie },
    );
    expect(page1Res.status).toBe(200);
    const page1 = (await page1Res.json()) as CloudProjectListResponse;
    expect(page1.projects.map((p) => p.id)).toEqual([
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
    ]);
    expect(page1.nextOffset).toBe(2);

    const page2Res = await sendWorkerRequest(
      server,
      "/api/projects?limit=2&offset=2",
      { cookie },
    );
    expect(page2Res.status).toBe(200);
    const page2 = (await page2Res.json()) as CloudProjectListResponse;
    expect(page2.projects.map((p) => p.id)).toEqual([
      "00000000-0000-4000-8000-000000000003",
    ]);
    expect(page2.nextOffset).toBeNull();
  });

  it("trims project names, rejects invalid names/versions, and advances sequential CAS versions", async () => {
    const { cookie } = await seedSessionCookie(db, "cas@example.test");
    const workspace = createSampleWorkspace();

    for (const badName of ["   ", "a".repeat(121)]) {
      const bad = await sendWorkerRequest(server, "/api/projects", {
        method: "POST",
        body: { name: badName, workspace },
        cookie,
      });
      expect(bad.status).toBe(400);
      expect(((await bad.json()) as CloudErrorResponse).error.code).toBe(
        "invalid_request",
      );
    }

    const created = await createCloudProject(server, cookie, {
      name: "  Trimmed Name  ",
      workspace,
    });
    expect(created.name).toBe("Trimmed Name");
    expect(created.version).toBe(1);

    for (const badVersion of [0, -1]) {
      const bad = await sendWorkerRequest(
        server,
        `/api/projects/${created.id}`,
        {
          method: "PUT",
          body: { name: "Valid", workspace, expectedVersion: badVersion },
          cookie,
        },
      );
      expect(bad.status).toBe(400);
      expect(((await bad.json()) as CloudErrorResponse).error.code).toBe(
        "invalid_request",
      );
    }

    const v2Res = await sendWorkerRequest(
      server,
      `/api/projects/${created.id}`,
      {
        method: "PUT",
        body: { name: "  Revision 2  ", workspace, expectedVersion: 1 },
        cookie,
      },
    );
    expect(v2Res.status).toBe(200);
    const v2 = ((await v2Res.json()) as CloudProjectMetadataResponse).project;
    expect(v2.name).toBe("Revision 2");
    expect(v2.version).toBe(2);
    expect(v2.createdAt).toBe(created.createdAt);

    const v3Res = await sendWorkerRequest(
      server,
      `/api/projects/${created.id}`,
      {
        method: "PUT",
        body: { name: "Revision 3", workspace, expectedVersion: 2 },
        cookie,
      },
    );
    expect(v3Res.status).toBe(200);
    const v3 = ((await v3Res.json()) as CloudProjectMetadataResponse).project;
    expect(v3.version).toBe(3);
    expect(v3.createdAt).toBe(created.createdAt);

    const conflictRes = await sendWorkerRequest(
      server,
      `/api/projects/${created.id}`,
      {
        method: "PUT",
        body: { name: "Stale", workspace, expectedVersion: 1 },
        cookie,
      },
    );
    expect(conflictRes.status).toBe(409);
    const conflict = (await conflictRes.json()) as CloudErrorResponse;
    expect(conflict.error.code).toBe("version_conflict");
    expect(conflict.error.currentVersion).toBe(3);
    expect(conflict.error.updatedAt).toBe(v3.updatedAt);
  });

  it("round-trips incomplete drafts without dropping blank fields or null workingScenario", async () => {
    const { cookie } = await seedSessionCookie(db, "draft@example.test");
    const emptyDraft: BuilderWorkspaceV1 = {
      format: "dominoos-builder-workspace",
      version: 1,
      document: {
        id: "draft-doc",
        name: "",
        asOf: "",
        revision: 0,
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
      scenarios: [],
      selectedScenarioId: null,
      workingScenario: null,
      source: { origin: "authored", openedFromFile: false },
    };

    const created = await createCloudProject(server, cookie, {
      name: "Incomplete Draft",
      workspace: emptyDraft,
    });

    const fetched1 = await sendWorkerRequest(
      server,
      `/api/projects/${created.id}`,
      { cookie },
    );
    expect(fetched1.status).toBe(200);
    expect(
      ((await fetched1.json()) as CloudProjectDetailResponse).project.workspace,
    ).toEqual(emptyDraft);

    const updatedDraft: BuilderWorkspaceV1 = {
      ...emptyDraft,
      document: {
        ...emptyDraft.document,
        revision: 1,
        nodes: [
          {
            kind: "supplier",
            id: "sup-draft-1",
            position: { x: 40, y: 80 },
            fields: { name: "", region: "", leadTimeDays: "" },
          },
        ],
      },
    };

    const putRes = await sendWorkerRequest(
      server,
      `/api/projects/${created.id}`,
      {
        method: "PUT",
        body: {
          name: "Incomplete Draft",
          workspace: updatedDraft,
          expectedVersion: 1,
        },
        cookie,
      },
    );
    expect(putRes.status).toBe(200);

    const fetched2 = await sendWorkerRequest(
      server,
      `/api/projects/${created.id}`,
      { cookie },
    );
    expect(fetched2.status).toBe(200);
    expect(
      ((await fetched2.json()) as CloudProjectDetailResponse).project.workspace,
    ).toEqual(updatedDraft);
  });

  it("returns 500 internal_error when stored D1 workspace_json is corrupted", async () => {
    const { cookie, userId } = await seedSessionCookie(
      db,
      "corrupt@example.test",
    );
    const projectId = "00000000-0000-4000-8000-000000000099";
    await db
      .prepare("INSERT INTO projects VALUES (?, ?, ?, ?, 1, ?, ?)")
      .bind(
        projectId,
        userId,
        "Corrupt",
        "{not-valid-json",
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
      )
      .run();

    const response = await sendWorkerRequest(
      server,
      `/api/projects/${projectId}`,
      { cookie },
    );
    expect(response.status).toBe(500);
    expect(((await response.json()) as CloudErrorResponse).error.code).toBe(
      "internal_error",
    );
  });

  it("enforces the 20-project quota independently per user", async () => {
    const userA = await seedSessionCookie(db, "user-a@example.test");
    const userB = await seedSessionCookie(db, "user-b@example.test");
    const workspace = createSampleWorkspace();
    const workspaceJson = JSON.stringify(workspace);

    for (let i = 0; i < CLOUD_PROJECT_LIMIT; i++) {
      await db
        .prepare("INSERT INTO projects VALUES (?, ?, ?, ?, 1, ?, ?)")
        .bind(
          crypto.randomUUID(),
          userA.userId,
          `A-${i}`,
          workspaceJson,
          "2020-01-01T00:00:00.000Z",
          "2020-01-01T00:00:00.000Z",
        )
        .run();
    }

    const blockedA = await sendWorkerRequest(server, "/api/projects", {
      method: "POST",
      body: { name: "A-21", workspace },
      cookie: userA.cookie,
    });
    expect(blockedA.status).toBe(409);
    expect(((await blockedA.json()) as CloudErrorResponse).error.code).toBe(
      "project_limit_reached",
    );

    const createdB = await createCloudProject(server, userB.cookie, {
      name: "B-1",
      workspace,
    });
    expect(createdB.version).toBe(1);
    expect(createdB.name).toBe("B-1");
  });
});
