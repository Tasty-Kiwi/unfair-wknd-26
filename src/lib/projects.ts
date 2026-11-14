import { z } from "zod";
import {
  demoData,
  DISRUPTION_SCENARIO,
  NORMAL_SCENARIO,
  RECOVERY_SCENARIO,
} from "@/data/demo";
import { createBlankDocument } from "./builder/factories";
import { datasetToWorkspace } from "./builder/workspaceFromDataset";
import {
  loadWorkspace,
  parseWorkspaceJson,
  saveWorkspace,
  WORKSPACE_STORAGE_KEY,
} from "./builder/storage";
import type { BuilderWorkspaceV1 } from "./builder/types";
import { fictionalProvenance, provenanceAfterImport } from "./provenance";
import {
  DATASET_TABLES,
  type Dataset,
  type DatasetProvenance,
  type Scenario,
} from "./types";
import { parseDataset, parseImportBundle, parseScenario } from "./validation";
import { presetsFor } from "./scenarioPresets";

const PROJECT_PREFIX = "needtrace.project.v1:";
const metadata = z.object({
  version: z.literal(1),
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  createdAt: z.string().datetime(),
  kind: z.enum(["workspace", "dataset"]),
});
const datasetState = z.object({
  data: z.unknown(),
  scenario: z.unknown(),
  provenance: z.object({
    kind: z.enum(["fictional", "mixed", "imported"]),
    tables: z.record(z.enum(DATASET_TABLES), z.enum(["fictional", "imported"])),
  }),
  retainedProductBoms: z.boolean(),
});

export type DatasetProjectState = {
  data: Dataset;
  scenario: Scenario;
  provenance: DatasetProvenance;
  retainedProductBoms: boolean;
};
export type LocalProject = z.infer<typeof metadata> & {
  state?: DatasetProjectState;
};
export type ProjectSummary = {
  id: string;
  name: string;
  kind: "workspace" | "dataset";
  detail: string;
};
export type ProjectImport =
  | { kind: "workspace"; workspace: BuilderWorkspaceV1 }
  | { kind: "dataset"; state: DatasetProjectState; replacedTables: string[] };

/** Stable ID of the persisted Northstar demo workspace opened at `/demo`. */
export const NORTHSTAR_DEMO_ID = "5b7a2c64-3d1e-4f8a-9c20-7e1d4a6b9f03";

/** The canonical editable Northstar network: all data, the approved alternative and three saved scenarios. */
export function northstarDemoWorkspace(): BuilderWorkspaceV1 {
  return datasetToWorkspace(demoData, {
    documentId: "doc-northstar-demo",
    scenario: NORMAL_SCENARIO,
    scenarios: [NORMAL_SCENARIO, DISRUPTION_SCENARIO, RECOVERY_SCENARIO],
    origin: "fictional",
  });
}

/**
 * Creates the Northstar demo project only where it is missing. Existing
 * workspace or metadata entries are never replaced, so edits and unreadable
 * data survive re-opening `/demo`.
 */
export function ensureNorthstarDemoProject(storage: Storage = localStorage) {
  const workspaceKey = projectWorkspaceKey(NORTHSTAR_DEMO_ID);
  if (storage.getItem(workspaceKey) === null) {
    const saved = saveWorkspace(
      northstarDemoWorkspace(),
      storage,
      workspaceKey,
    );
    if (!saved.ok) throw new Error(saved.error);
  }
  const metaKey = PROJECT_PREFIX + NORTHSTAR_DEMO_ID;
  if (storage.getItem(metaKey) === null) {
    storage.setItem(
      metaKey,
      JSON.stringify({
        version: 1,
        id: NORTHSTAR_DEMO_ID,
        name: demoData.name,
        createdAt: new Date().toISOString(),
        kind: "workspace",
      }),
    );
  }
}

export const projectWorkspaceKey = (id: string) =>
  id === "device-draft"
    ? WORKSPACE_STORAGE_KEY
    : `needtrace.workspace.v1:${id}`;
export const projectUrl = (id: string) => `/projects/${encodeURIComponent(id)}`;

export function deleteProject(id: string, storage: Storage = localStorage) {
  if (id === "device-draft") {
    storage.removeItem(WORKSPACE_STORAGE_KEY);
    return;
  }
  const project = readProject(id, storage);
  if (project.kind === "workspace") storage.removeItem(projectWorkspaceKey(id));
  storage.removeItem(PROJECT_PREFIX + id);
}
const baseline: Scenario = {
  id: "baseline",
  name: "Normal operations",
  deliveryOverrides: [],
  alternatives: [],
};

export function readProject(
  id: string,
  storage: Storage = localStorage,
): LocalProject {
  const raw = storage.getItem(PROJECT_PREFIX + id);
  if (!raw)
    throw new Error(
      "This project was not found on this device. Open Projects to choose another project.",
    );
  const input: unknown = JSON.parse(raw);
  const project = metadata.parse(input);
  if (project.id !== id)
    throw new Error("This saved project's ID does not match its address.");
  if (project.kind === "workspace") return project;
  const stored = datasetState.parse((input as { state?: unknown }).state);
  const data = parseDataset(stored.data);
  return {
    ...project,
    state: { ...stored, data, scenario: parseScenario(data, stored.scenario) },
  };
}

/** Upgrade a dataset project in place, retaining its address and original source payload. */
export function makeProjectEditable(
  id: string,
  storage: Storage = localStorage,
) {
  const project = readProject(id, storage);
  if (project.kind !== "dataset") return;
  const state = project.state!;
  const workspace = datasetToWorkspace(state.data, {
    scenario: state.scenario,
    scenarios: presetsFor(state.data).filter(
      (preset) => preset.id !== state.scenario.id,
    ),
    origin: state.provenance.kind,
  });
  workspace.document.name = project.name;
  workspace.source.provenance = state.provenance;
  workspace.source.retainedProductBoms = state.retainedProductBoms;
  const saved = saveWorkspace(workspace, storage, projectWorkspaceKey(id));
  if (!saved.ok) throw new Error(saved.error);
  const original = JSON.parse(storage.getItem(PROJECT_PREFIX + id)!);
  storage.setItem(
    PROJECT_PREFIX + id,
    JSON.stringify({ ...original, kind: "workspace" }),
  );
}

export function listProjects(storage: Storage = localStorage): {
  projects: ProjectSummary[];
  errors: string[];
} {
  const projects: ProjectSummary[] = [];
  const errors: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(PROJECT_PREFIX)) continue;
    try {
      const project = readProject(key.slice(PROJECT_PREFIX.length), storage);
      if (project.kind === "workspace") {
        const saved = loadWorkspace(storage, projectWorkspaceKey(project.id));
        if (saved.error || !saved.workspace)
          throw new Error(
            `Could not read “${project.name}”. Its saved data has been kept untouched.`,
          );
        projects.push({
          ...project,
          name: saved.workspace.document.name || project.name,
          detail: `${saved.workspace.document.nodes.length} items · ${saved.workspace.scenarios.length} saved scenarios`,
        });
      } else {
        projects.push({
          ...project,
          detail: `${project.state!.data.orders.length} orders · ${project.state!.data.products.length} products`,
        });
      }
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : "A saved project could not be read.",
      );
    }
  }
  const legacy = loadWorkspace(storage);
  if (legacy.error)
    errors.push(
      `Your existing device draft could not be read and was kept untouched. ${legacy.error}`,
    );
  if (legacy.workspace) {
    projects.unshift({
      id: "device-draft",
      name: legacy.workspace.document.name || "Existing device draft",
      kind: "workspace",
      detail: `${legacy.workspace.document.nodes.length} items · ${legacy.workspace.scenarios.length} saved scenarios`,
    });
  }
  return { projects, errors };
}

export function createProject(
  name: string,
  imported?: ProjectImport,
  storage: Storage = localStorage,
): LocalProject {
  const project = metadata.parse({
    version: 1,
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    kind: imported?.kind ?? "workspace",
  });
  const workspace: BuilderWorkspaceV1 | null =
    imported?.kind === "dataset"
      ? null
      : (imported?.workspace ?? {
          format: "dominoos-builder-workspace",
          version: 1,
          document: {
            ...createBlankDocument(),
            name: project.name,
            asOf: new Date().toISOString().slice(0, 10),
          },
          scenarios: [],
          selectedScenarioId: null,
          workingScenario: null,
          source: { origin: "authored", openedFromFile: false },
        });
  // Write validated metadata first and roll back only these new keys on failure.
  // Existing drafts and projects are never replaced by creation or import.
  const record: LocalProject = {
    ...project,
    ...(imported?.kind === "dataset" ? { state: imported.state } : {}),
  };
  storage.setItem(PROJECT_PREFIX + project.id, JSON.stringify(record));
  if (workspace) {
    const result = saveWorkspace(
      { ...workspace, document: { ...workspace.document, name: project.name } },
      storage,
      projectWorkspaceKey(project.id),
    );
    if (!result.ok) {
      storage.removeItem(PROJECT_PREFIX + project.id);
      throw new Error(result.error);
    }
  }
  return record;
}

export function saveDatasetProject(
  id: string,
  state: DatasetProjectState,
  storage: Storage = localStorage,
) {
  const project = readProject(id, storage);
  if (project.kind !== "dataset")
    throw new Error("This is not a dataset project.");
  storage.setItem(PROJECT_PREFIX + id, JSON.stringify({ ...project, state }));
}

export function prepareProjectImport(
  files: { name: string; text: string }[],
  base?: Pick<DatasetProjectState, "data" | "provenance">,
): ProjectImport {
  if (
    !files.length ||
    files.length > 5 ||
    files.some((file) => new TextEncoder().encode(file.text).length > 2_000_000)
  ) {
    throw new Error(
      "Choose one JSON file or up to five CSV files, each smaller than 2 MB.",
    );
  }
  if (files.length === 1 && files[0].name.toLowerCase().endsWith(".json")) {
    const input: unknown = JSON.parse(files[0].text);
    if (input && typeof input === "object" && "format" in input) {
      const workspace = parseWorkspaceJson(files[0].text);
      return {
        kind: "workspace",
        workspace: {
          ...workspace,
          source: { ...workspace.source, openedFromFile: true },
        },
      };
    }
    if (
      input &&
      typeof input === "object" &&
      "inputs" in input &&
      "scenario" in input
    ) {
      const report = input as {
        inputs: unknown;
        scenario: unknown;
        dataProvenance?: unknown;
        retainedProductBoms?: unknown;
      };
      const stored = datasetState.parse({
        data: report.inputs,
        scenario: report.scenario,
        provenance:
          report.dataProvenance ??
          provenanceAfterImport(fictionalProvenance(), DATASET_TABLES),
        retainedProductBoms: report.retainedProductBoms ?? false,
      });
      const data = parseDataset(stored.data);
      return {
        kind: "dataset",
        replacedTables: [...DATASET_TABLES],
        state: {
          ...stored,
          data,
          scenario: parseScenario(data, stored.scenario),
        },
      };
    }
  }
  // CSV replaces only the supplied tables. New projects start from the demo;
  // an open editor retains its active network, like the simulator importer.
  const parsed = parseImportBundle(files, base?.data ?? demoData);
  return {
    kind: "dataset",
    replacedTables: parsed.replacedTables,
    state: {
      data: parsed.data,
      scenario: baseline,
      provenance: provenanceAfterImport(
        base?.provenance ?? fictionalProvenance(),
        parsed.replacedTables,
      ),
      retainedProductBoms: parsed.retainedProductBoms,
    },
  };
}
