import { updateViewport } from "@/components/builder/documentEdits";
import { compileGraph } from "@/lib/builder/compiler";
import { describe, expect, it } from "vitest";
import {
  createBlankDocument,
  createCoreExample,
  createNode,
} from "@/lib/builder/factories";
import { parseWorkspace } from "@/lib/builder/schema";
import {
  loadWorkspace,
  MAX_WORKSPACE_BYTES,
  parseWorkspaceJson,
  saveWorkspace,
  serializeWorkspace,
  WORKSPACE_STORAGE_KEY,
} from "@/lib/builder/storage";
import {
  BUILDER_WORKSPACE_FORMAT,
  BUILDER_WORKSPACE_VERSION,
  type BuilderWorkspaceV1,
} from "@/lib/builder/types";

function makeSampleWorkspace(
  overrides?: Partial<BuilderWorkspaceV1>,
): BuilderWorkspaceV1 {
  return {
    format: BUILDER_WORKSPACE_FORMAT,
    version: BUILDER_WORKSPACE_VERSION,
    document: createCoreExample(),
    scenarios: [
      {
        scenario: {
          id: "scen-1",
          name: "Motor shortage",
          deliveryOverrides: [
            {
              deliveryId: "receipt-servo-1",
              availableDate: "2026-11-23",
              quantity: 5,
            },
          ],
          alternatives: [],
        },
        validatedNetworkKey: "nk1:placeholder",
      },
    ],
    selectedScenarioId: "scen-1",
    workingScenario: null,
    source: { origin: "fictional", openedFromFile: false },
    ...overrides,
  };
}

describe("builder schema and storage", () => {
  it("round-trips framing without changing the business revision or scenario binding", () => {
    const workspace = makeSampleWorkspace();
    const before = compileGraph(workspace.document);
    const viewport = { x: -140.5, y: 200, zoom: 0.65 };
    const document = updateViewport(workspace.document, viewport);
    expect(document.revision).toBe(workspace.document.revision);
    expect(updateViewport(document, viewport)).toBe(document);
    const restored = parseWorkspaceJson(
      serializeWorkspace({ ...workspace, document }),
    );
    expect(restored.document.viewport).toEqual(viewport);
    expect(compileGraph(restored.document)).toEqual(before);
  });
  it("accepts raw incomplete draft workspaces and preserves raw values on round-trip", () => {
    const draftDoc = createBlankDocument();
    const incompleteReceipt = createNode("receipt", { x: 42, y: 84 });
    incompleteReceipt.fields.quantity = "not-a-number";
    incompleteReceipt.fields.availableDate = "2026-02-30";
    draftDoc.nodes.push(incompleteReceipt);

    const draftWorkspace: BuilderWorkspaceV1 = {
      format: BUILDER_WORKSPACE_FORMAT,
      version: BUILDER_WORKSPACE_VERSION,
      document: draftDoc,
      scenarios: [
        {
          scenario: {
            id: "stale-1",
            name: "Stale draft",
            deliveryOverrides: [
              {
                deliveryId: "missing-receipt-id",
                availableDate: "2026-11-20",
                quantity: 2,
              },
            ],
            alternatives: [],
          },
          validatedNetworkKey: null,
        },
      ],
      selectedScenarioId: null,
      workingScenario: null,
      source: { origin: "authored", openedFromFile: false },
    };

    const store = new Map<string, string>();
    const saved = saveWorkspace(draftWorkspace, {
      setItem: (k, v) => store.set(k, v),
    });
    expect(saved).toEqual({ ok: true });

    const loaded = loadWorkspace({
      getItem: (k) => store.get(k) ?? null,
    });
    expect(loaded.error).toBeNull();
    expect(loaded.workspace).toEqual(draftWorkspace);
  });

  it("rejects malformed, unknown-version, duplicate-key, and NaN-coordinate workspaces", () => {
    const base = makeSampleWorkspace();

    expect(() =>
      parseWorkspace({ ...base, format: "wrong-format" }),
    ).toThrowError(/Invalid builder workspace/);

    expect(() => parseWorkspace({ ...base, version: 2 })).toThrowError(
      /Invalid builder workspace/,
    );

    const nanCoords = structuredClone(base);
    nanCoords.document.nodes[0].position.x = Number.NaN;
    expect(() => parseWorkspace(nanCoords)).toThrowError(
      /Invalid builder workspace/,
    );

    const dupNode = structuredClone(base);
    dupNode.document.nodes.push(structuredClone(dupNode.document.nodes[0]));
    expect(() => parseWorkspace(dupNode)).toThrowError(/duplicate node key/);

    const badKind = structuredClone(base) as unknown as Record<string, unknown>;
    (badKind.document as { nodes: Array<{ kind: string }> }).nodes[0].kind =
      "factory";
    expect(() => parseWorkspace(badKind)).toThrowError(
      /Invalid builder workspace/,
    );
  });

  it("handles empty storage and corrupt storage safely without throwing", () => {
    const empty = loadWorkspace({ getItem: () => null });
    expect(empty).toEqual({ workspace: null, error: null });

    const corrupt = loadWorkspace({ getItem: () => "{not valid json" });
    expect(corrupt.workspace).toBeNull();
    expect(corrupt.error).toMatch(/Invalid JSON/);

    const wrongVersion = loadWorkspace({
      getItem: () => JSON.stringify({ ...makeSampleWorkspace(), version: 99 }),
    });
    expect(wrongVersion.workspace).toBeNull();
    expect(wrongVersion.error).toMatch(/Invalid builder workspace/);
  });

  it("enforces the 2 MB workspace JSON limit on serialize and import", () => {
    const huge = makeSampleWorkspace();
    huge.document.name = "x".repeat(MAX_WORKSPACE_BYTES + 1024);

    expect(() => serializeWorkspace(huge)).toThrowError(/2 MB/);
    const saveRes = saveWorkspace(huge, { setItem: () => {} });
    expect(saveRes.ok).toBe(false);

    const rawTooBig = " ".repeat(MAX_WORKSPACE_BYTES + 10);
    expect(() => parseWorkspaceJson(rawTooBig)).toThrowError(/2 MB/);
  });

  it("catches storage quota errors and preserves previous stored value", () => {
    const initial = makeSampleWorkspace();
    const store = new Map<string, string>();
    store.set(WORKSPACE_STORAGE_KEY, serializeWorkspace(initial));

    const updated = makeSampleWorkspace({
      selectedScenarioId: null,
    });

    const res = saveWorkspace(updated, {
      setItem: () => {
        throw new Error("QuotaExceededError: storage full");
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain("QuotaExceededError");
    }

    // Previous stored workspace remains intact
    const reloaded = loadWorkspace({
      getItem: (k) => store.get(k) ?? null,
    });
    expect(reloaded.error).toBeNull();
    expect(reloaded.workspace).toEqual(initial);
  });
});
