import type {
  Dataset,
  DatasetProvenance,
  DatasetTable,
  Scenario,
  SimulationResult,
} from "@/lib/types";

export const money = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const day = (s: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${s}T00:00:00Z`));

export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const tableLabel = (table: DatasetTable) =>
  table === "alternatives" ? "approved alternatives" : table;

export const SCENARIO_REPORT_POLICY =
  "Partial component reservations, earliest required date then order ID; material availability only.";

/** The one scenario report shape, used by every simulation surface. */
export function scenarioReport(input: {
  data: Dataset;
  provenance: DatasetProvenance;
  retainedProductBoms: boolean;
  scenario: Scenario;
  result: SimulationResult;
  comparison: SimulationResult[];
  comparisonUnavailable?: { id: string; name: string; reason: string }[];
}) {
  return {
    dataset: input.data.name,
    dataProvenance: input.provenance,
    inputs: input.data,
    retainedProductBoms: input.retainedProductBoms,
    policy: SCENARIO_REPORT_POLICY,
    scenario: input.scenario,
    application: "Needtrace",
    result: input.result,
    comparison: input.comparison,
    comparisonUnavailable: input.comparisonUnavailable ?? [],
  };
}

/** Stable comparison of scenario content, independent of key order. */
export function scenarioKey(value: unknown): string {
  return JSON.stringify(value, (_, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : item,
  );
}

/** Presets describe material inputs; names, IDs and input order do not change them. */
export function scenarioInputsKey(scenario: Scenario): string {
  return scenarioKey({
    deliveryOverrides: [...scenario.deliveryOverrides].sort((a, b) =>
      a.deliveryId < b.deliveryId ? -1 : a.deliveryId > b.deliveryId ? 1 : 0,
    ),
    alternatives: [...scenario.alternatives].sort((a, b) =>
      a.alternativeId < b.alternativeId
        ? -1
        : a.alternativeId > b.alternativeId
          ? 1
          : 0,
    ),
  });
}
