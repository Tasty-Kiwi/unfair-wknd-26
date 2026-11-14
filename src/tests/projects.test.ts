import { describe, expect, it } from "vitest";
import { demoData } from "@/data/demo";
import { fictionalProvenance } from "@/lib/provenance";
import { createCoreExample } from "@/lib/builder/factories";
import {
  loadWorkspace,
  saveWorkspace,
  WORKSPACE_STORAGE_KEY,
} from "@/lib/builder/storage";
import type { BuilderWorkspaceV1 } from "@/lib/builder/types";
import {
  createProject,
  ensureNorthstarDemoProject,
  listProjects,
  makeProjectEditable,
  NORTHSTAR_DEMO_ID,
  prepareProjectImport,
  projectWorkspaceKey,
  readProject,
  saveDatasetProject,
} from "@/lib/projects";
import {
  projectAuthReturn,
  rememberProjectReturn,
} from "@/lib/cloud/projectReturn";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    clear: () => values.clear(),
  };
}
const example = (): BuilderWorkspaceV1 => ({
  format: "dominoos-builder-workspace",
  version: 1,
  document: createCoreExample(),
  scenarios: [],
  workingScenario: null,
  selectedScenarioId: null,
  source: { origin: "fictional", openedFromFile: false },
});

describe("local projects", () => {
  it("upgrades dataset projects in place with their scenario and provenance intact", () => {
    const storage = memoryStorage();
    const imported = prepareProjectImport([
      { name: "plan.json", text: JSON.stringify(demoData) },
    ]);
    if (imported.kind !== "dataset") throw new Error("Expected dataset import");
    imported.state.scenario = {
      ...imported.state.scenario,
      deliveryOverrides: [
        { deliveryId: "PO-101", quantity: 5, availableDate: "2026-11-23" },
      ],
    };
    const project = createProject("My material plan", imported, storage);
    makeProjectEditable(project.id, storage);
    const upgraded = readProject(project.id, storage);
    expect(upgraded.kind).toBe("workspace");
    expect(upgraded.id).toBe(project.id);
    const workspace = loadWorkspace(
      storage,
      projectWorkspaceKey(project.id),
    ).workspace!;
    expect(workspace.document.name).toBe("My material plan");
    expect(workspace.workingScenario!.scenario).toEqual(
      imported.state.scenario,
    );
    expect(workspace.source.provenance).toEqual(imported.state.provenance);
    const original = JSON.parse(
      storage.getItem(`needtrace.project.v1:${project.id}`)!,
    );
    expect(original.state).toEqual(imported.state);
    const saved = storage.getItem(projectWorkspaceKey(project.id));
    makeProjectEditable(project.id, storage);
    expect(storage.getItem(projectWorkspaceKey(project.id))).toBe(saved);
  });

  it("keeps the original dataset project when its editable upgrade cannot be saved", () => {
    const storage = memoryStorage();
    const imported = prepareProjectImport([
      { name: "plan.json", text: JSON.stringify(demoData) },
    ]);
    const project = createProject("Kept plan", imported, storage);
    const original = storage.getItem(`needtrace.project.v1:${project.id}`);
    const blocked = {
      ...storage,
      setItem(key: string, value: string) {
        if (key === projectWorkspaceKey(project.id))
          throw new Error("Storage full");
        storage.setItem(key, value);
      },
    };
    expect(() => makeProjectEditable(project.id, blocked)).toThrow();
    expect(storage.getItem(`needtrace.project.v1:${project.id}`)).toBe(
      original,
    );
    expect(readProject(project.id, storage).kind).toBe("dataset");
  });
  it("opens the complete editable demo without replacing its edits or another device draft", () => {
    const storage = memoryStorage();
    saveWorkspace(example(), storage);
    const deviceDraft = storage.getItem(WORKSPACE_STORAGE_KEY);
    ensureNorthstarDemoProject(storage);
    const key = projectWorkspaceKey(NORTHSTAR_DEMO_ID);
    const workspace = loadWorkspace(storage, key).workspace!;
    expect(workspace.document.nodes).toHaveLength(40);
    expect(workspace.document.alternatives).toEqual(demoData.alternatives);
    expect(workspace.scenarios).toHaveLength(3);
    workspace.document.name = "My edited Northstar";
    saveWorkspace(workspace, storage, key);
    const edited = storage.getItem(key);
    ensureNorthstarDemoProject(storage);
    expect(storage.getItem(key)).toBe(edited);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(deviceDraft);
    expect(
      listProjects(storage).projects.some(
        (project) => project.name === "My edited Northstar",
      ),
    ).toBe(true);
  });

  it("keeps an unreadable demo workspace available for recovery instead of reseeding it", () => {
    const storage = memoryStorage();
    const key = projectWorkspaceKey(NORTHSTAR_DEMO_ID);
    storage.setItem(key, "broken saved data");
    ensureNorthstarDemoProject(storage);
    expect(storage.getItem(key)).toBe("broken saved data");
    expect(loadWorkspace(storage, key).error).toBeTruthy();
  });

  it("reimports exported scenario reports with source data and scenario intact", () => {
    const original = prepareProjectImport([
      { name: "dataset.json", text: JSON.stringify(demoData) },
    ]);
    if (original.kind !== "dataset") throw new Error("Expected dataset");
    const state = {
      ...original.state,
      scenario: {
        ...original.state.scenario,
        deliveryOverrides: [
          {
            deliveryId: demoData.deliveries[0].id,
            availableDate: "2026-11-25",
            quantity: 7,
          },
        ],
      },
    };
    const imported = prepareProjectImport([
      {
        name: "needtrace-scenario-report.json",
        text: JSON.stringify({
          inputs: state.data,
          scenario: state.scenario,
          dataProvenance: state.provenance,
          retainedProductBoms: state.retainedProductBoms,
        }),
      },
    ]);
    expect(imported.kind === "dataset" && imported.state).toEqual(state);
  });
  it("restores OAuth to the same local project, consumes it once, and rejects external paths", () => {
    const storage = memoryStorage();
    const path = "/projects/01234567-89ab-4def-8123-456789abcdef";
    rememberProjectReturn(path, storage);
    expect(
      projectAuthReturn(new URL("https://example.com/projects"), storage),
    ).toBeNull();
    expect(
      projectAuthReturn(
        new URL("https://example.com/?builder=1&authError=1"),
        storage,
      ),
    ).toBe(path + "?builder=1&authError=1");
    expect(
      projectAuthReturn(new URL("https://example.com/?builder=1"), storage),
    ).toBeNull();
    storage.setItem("needtrace.oauth.project-return.v1", "//attacker.example");
    expect(
      projectAuthReturn(new URL("https://example.com/?builder=1"), storage),
    ).toBeNull();
  });
  it("keeps new project autosaves separate and surfaces the unchanged legacy draft", () => {
    const storage = memoryStorage();
    saveWorkspace(example(), storage);
    const original = storage.getItem(WORKSPACE_STORAGE_KEY);
    const first = createProject("First", undefined, storage);
    const second = createProject("Second", undefined, storage);
    const draft = loadWorkspace(
      storage,
      projectWorkspaceKey(first.id),
    ).workspace!;
    saveWorkspace(
      { ...draft, document: { ...draft.document, name: "Renamed first" } },
      storage,
      projectWorkspaceKey(first.id),
    );
    expect(
      loadWorkspace(storage, projectWorkspaceKey(second.id)).workspace!.document
        .name,
    ).toBe("Second");
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe(original);
    expect(
      listProjects(storage).projects.map((project) => project.name),
    ).toEqual(["Motor assembly network", "Renamed first", "Second"]);
  });
  it("preserves workspace IDs, graph, scenarios and format on import", () => {
    const storage = memoryStorage();
    const workspace = example();
    workspace.scenarios = [
      {
        scenario: {
          id: "saved",
          name: "Saved scenario",
          deliveryOverrides: [],
          alternatives: [],
        },
        validatedNetworkKey: null,
      },
    ];
    const imported = prepareProjectImport([
      { name: "network.json", text: JSON.stringify(workspace) },
    ]);
    const project = createProject("Imported network", imported, storage);
    const restored = loadWorkspace(
      storage,
      projectWorkspaceKey(project.id),
    ).workspace!;
    expect(restored.document.id).toBe(workspace.document.id);
    expect(restored.document.nodes).toEqual(workspace.document.nodes);
    expect(restored.scenarios).toEqual(workspace.scenarios);
    expect(restored.source.openedFromFile).toBe(true);
    expect(restored.format).toBe("dominoos-builder-workspace");
  });
  it("restores imported datasets and saved scenario inputs without leaking into another project", () => {
    const storage = memoryStorage();
    const imported = prepareProjectImport([
      { name: "dataset.json", text: JSON.stringify(demoData) },
    ]);
    expect(imported.kind).toBe("dataset");
    const first = createProject("Imported", imported, storage);
    const second = createProject("Other", imported, storage);
    const state = readProject(first.id, storage).state!;
    state.scenario.deliveryOverrides = [
      { deliveryId: "PO-101", quantity: 5, availableDate: "2026-11-23" },
    ];
    saveDatasetProject(first.id, state, storage);
    expect(
      readProject(first.id, storage).state!.scenario.deliveryOverrides,
    ).toHaveLength(1);
    expect(
      readProject(second.id, storage).state!.scenario.deliveryOverrides,
    ).toHaveLength(0);
    expect(state.provenance.kind).toBe("imported");
  });
  it("discloses partial CSV provenance and rejects invalid bundles without writing projects", () => {
    const imported = prepareProjectImport([
      { name: "inventory.csv", text: "componentId,quantity\nMTR-01,12" },
    ]);
    if (imported.kind !== "dataset") throw new Error("Expected dataset");
    expect(imported.state.provenance.kind).toBe("mixed");
    expect(imported.state.data.inventory).toEqual([
      { componentId: "MTR-01", quantity: 12 },
    ]);
    expect(imported.state.data.suppliers).toEqual(demoData.suppliers);
    expect(() =>
      prepareProjectImport([
        { name: "bad.csv", text: "componentId,quantity\nMISSING,12" },
      ]),
    ).toThrow();
    expect(() =>
      prepareProjectImport([{ name: "big.json", text: "x".repeat(2_000_001) }]),
    ).toThrow(/2 MB/);
  });
  it("retains the active network when CSV replaces one table", () => {
    const data = structuredClone(demoData);
    data.name = "Custom factory";
    data.suppliers[0].name = "Custom supplier";
    const imported = prepareProjectImport(
      [{ name: "inventory.csv", text: "componentId,quantity\nMTR-01,12" }],
      { data, provenance: fictionalProvenance() },
    );
    if (imported.kind !== "dataset") throw new Error("Expected dataset");
    expect(imported.state.data.suppliers).toEqual(data.suppliers);
    expect(imported.state.data.name).toBe(data.name);
    expect(imported.state.data.inventory).toEqual([
      { componentId: "MTR-01", quantity: 12 },
    ]);
    expect(data.inventory).toEqual(demoData.inventory);
  });
  it("leaves unreadable drafts untouched and rolls back a failed new workspace write", () => {
    const storage = memoryStorage();
    storage.setItem(WORKSPACE_STORAGE_KEY, "broken draft");
    const failing = {
      ...storage,
      setItem(key: string, value: string) {
        if (key.startsWith("needtrace.workspace"))
          throw new Error("Storage is full");
        storage.setItem(key, value);
      },
    } as Storage;
    expect(() => createProject("Cannot save", undefined, failing)).toThrow(
      "Storage is full",
    );
    expect(listProjects(storage).projects).toHaveLength(0);
    expect(listProjects(storage).errors).toHaveLength(1);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBe("broken draft");
    expect(storage.length).toBe(1);
  });
});
