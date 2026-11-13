import {
  DATASET_TABLES,
  type DatasetProvenance,
  type DatasetSource,
  type DatasetTable,
} from "./types";

function kindFor(
  tables: Record<DatasetTable, DatasetSource>,
): DatasetProvenance["kind"] {
  const sources = new Set(Object.values(tables));
  if (sources.size > 1) return "mixed";
  return sources.has("imported") ? "imported" : "fictional";
}

export function fictionalProvenance(): DatasetProvenance {
  return {
    kind: "fictional",
    tables: Object.fromEntries(
      DATASET_TABLES.map((table) => [table, "fictional"]),
    ) as Record<DatasetTable, DatasetSource>,
  };
}

export function provenanceAfterImport(
  current: DatasetProvenance,
  replacedTables: readonly DatasetTable[],
): DatasetProvenance {
  const tables = { ...current.tables };
  for (const table of replacedTables) tables[table] = "imported";
  return { kind: kindFor(tables), tables };
}

export function provenanceLabel(kind: DatasetProvenance["kind"]): string {
  if (kind === "fictional") return "Fictional demo data";
  if (kind === "mixed") return "Mixed demo + imported data";
  return "Fully imported data";
}
