import { z } from "zod";
import { demoData } from "@/data/demo";
import { createBlankDocument } from "./builder/factories";
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
  // Keep the existing CSV table semantics and explicitly disclose the demo base in the UI.
  const parsed = parseImportBundle(files, demoData);
  return {
    kind: "dataset",
    replacedTables: parsed.replacedTables,
    state: {
      data: parsed.data,
      scenario: baseline,
      provenance: provenanceAfterImport(
        fictionalProvenance(),
        parsed.replacedTables,
      ),
      retainedProductBoms: parsed.retainedProductBoms,
    },
  };
}
