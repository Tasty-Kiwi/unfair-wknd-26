import type { Dataset, Scenario } from "@/lib/types";
import { parseDataset } from "@/lib/validation";
import { compileGraph } from "./compiler";
import { revalidateScenario } from "./scenarios";
import {
  BUILDER_WORKSPACE_FORMAT,
  BUILDER_WORKSPACE_VERSION,
  type BuilderEdge,
  type BuilderNode,
  type BuilderWorkspaceOrigin,
  type BuilderWorkspaceV1,
  type ScenarioRecord,
} from "./types";

export type DatasetToWorkspaceOptions = {
  /** The selected scenario. Added to the saved scenarios when not already listed. */
  scenario?: Scenario;
  /** Named scenarios to keep as independent saved scenarios. */
  scenarios?: Scenario[];
  /** Where the data came from: "imported" (user files), "mixed" (demo data
   * with imported tables) or "fictional". Defaults to "authored". */
  origin?: BuilderWorkspaceOrigin;
  /** Override the generated workspace id (the network key is bound to it). */
  documentId?: string;
};

// Same columns and row pitch as the Build canvas uses for new items.
const COLUMN_X = {
  supplier: 0,
  receipt: 300,
  component: 600,
  product: 900,
  order: 1200,
} as const;
const ROW_HEIGHT = 150;
const FIRST_ROW_Y = 40;

const PLAIN_NUMBER = /^(?:\d+\.?\d*|\.\d+)$/;

/** The editor stores numbers as typed text. Reject (never round) values whose
 * plain decimal text would not read back as exactly the same number. */
function plainNumberText(value: number, label: string): string {
  const candidates = [String(value)];
  if (value >= 1e21) candidates.push(BigInt(value).toString());
  else if (value > 0 && value < 1e-6) {
    candidates.push(value.toFixed(20).replace(/0+$/, ""));
  }
  for (const text of candidates) {
    if (PLAIN_NUMBER.test(text) && Number(text) === value) return text;
  }
  throw new Error(
    `${label} ${value} cannot be represented as editable plain text without changing it.`,
  );
}

function generateDocumentId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `doc-${globalThis.crypto.randomUUID()}`;
  }
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const compareCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** The shape `compileGraph` is defined to produce: sorted collections, trimmed
 * text, BOM lines ordered by component. Used only to prove nothing was lost. */
function canonicalDataset(data: Dataset): Dataset {
  const byId = <T extends { id: string }>(items: T[]) =>
    [...items].sort((a, b) => compareCodePoint(a.id, b.id));
  return {
    name: data.name.trim(),
    asOf: data.asOf,
    suppliers: byId(data.suppliers).map((s) => ({
      ...s,
      name: s.name.trim(),
      region: s.region.trim(),
    })),
    components: byId(data.components).map((c) => ({
      ...c,
      name: c.name.trim(),
      unit: c.unit.trim(),
    })),
    products: byId(data.products).map((p) => ({
      ...p,
      name: p.name.trim(),
      sku: p.sku.trim(),
      bom: [...p.bom].sort((a, b) =>
        compareCodePoint(a.componentId, b.componentId),
      ),
    })),
    inventory: [...data.inventory].sort((a, b) =>
      compareCodePoint(a.componentId, b.componentId),
    ),
    deliveries: byId(data.deliveries),
    orders: byId(data.orders).map((o) => ({
      ...o,
      customer: o.customer.trim(),
    })),
    alternatives: byId(data.alternatives).map((a) => ({
      ...a,
      name: a.name.trim(),
    })),
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => compareCodePoint(a, b),
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Convert a validated domain dataset into an editable v1 builder workspace.
 *
 * - Every dataset field becomes a node, relationship, alternative catalog
 *   entry or document field; domain IDs are the node IDs.
 * - A component without an inventory row gets `initialStock: null` (not
 *   entered), while an explicit zero row stays `"0"`.
 * - Layout is deterministic: one column per kind, in dataset order.
 * - Scenarios are independent validated copies bound to the compiled network.
 * - Invalid datasets, unrepresentable numbers, invalid scenarios and any
 *   conversion that would change the compiled dataset throw explicit errors.
 *   Only surrounding whitespace in display text is normalised (as the editor
 *   always does).
 */
export function datasetToWorkspace(
  dataset: Dataset,
  options: DatasetToWorkspaceOptions = {},
): BuilderWorkspaceV1 {
  let data: Dataset;
  try {
    data = parseDataset(structuredClone(dataset));
  } catch (error) {
    throw new Error(
      `Cannot open this dataset in the builder. ${error instanceof Error ? error.message : "It is not a valid dataset."}`,
    );
  }

  const nodes: BuilderNode[] = [];
  const edges: BuilderEdge[] = [];
  const row = { supplier: 0, receipt: 0, component: 0, product: 0, order: 0 };
  const place = (kind: keyof typeof COLUMN_X) => ({
    x: COLUMN_X[kind],
    y: FIRST_ROW_Y + row[kind]++ * ROW_HEIGHT,
  });
  const link = (
    kind: BuilderEdge["kind"],
    source: string,
    target: string,
    quantity?: number,
  ) => {
    const id = `edge-${kind}:${source}->${target}`;
    edges.push(
      kind === "bom"
        ? { id, kind, source, target, quantity: String(quantity) }
        : ({ id, kind, source, target } as BuilderEdge),
    );
  };

  const stock = new Map(data.inventory.map((i) => [i.componentId, i.quantity]));

  for (const s of data.suppliers) {
    nodes.push({
      kind: "supplier",
      id: s.id,
      position: place("supplier"),
      fields: {
        name: s.name,
        region: s.region,
        leadTimeDays: String(s.leadTimeDays),
      },
    });
  }
  for (const d of data.deliveries) {
    nodes.push({
      kind: "receipt",
      id: d.id,
      position: place("receipt"),
      fields: {
        quantity: String(d.quantity),
        availableDate: d.availableDate,
      },
    });
  }
  for (const c of data.components) {
    const quantity = stock.get(c.id);
    nodes.push({
      kind: "component",
      id: c.id,
      position: place("component"),
      fields: {
        name: c.name,
        unit: c.unit,
        initialStock: quantity === undefined ? null : String(quantity),
      },
    });
  }
  for (const p of data.products) {
    nodes.push({
      kind: "product",
      id: p.id,
      position: place("product"),
      fields: { name: p.name, sku: p.sku },
    });
  }
  for (const o of data.orders) {
    nodes.push({
      kind: "order",
      id: o.id,
      position: place("order"),
      fields: {
        customer: o.customer,
        quantity: String(o.quantity),
        requiredDate: o.requiredDate,
        value: plainNumberText(o.value, `Order ${o.id} value`),
      },
    });
  }

  for (const c of data.components) {
    link("primarySupplier", `supplier:${c.supplierId}`, `component:${c.id}`);
  }
  for (const d of data.deliveries) {
    link("receiptSupplier", `supplier:${d.supplierId}`, `receipt:${d.id}`);
    link("receiptComponent", `receipt:${d.id}`, `component:${d.componentId}`);
  }
  for (const p of data.products) {
    for (const line of p.bom) {
      link(
        "bom",
        `component:${line.componentId}`,
        `product:${p.id}`,
        line.quantity,
      );
    }
  }
  for (const o of data.orders) {
    link("orderedProduct", `product:${o.productId}`, `order:${o.id}`);
  }

  const document = {
    id: options.documentId ?? generateDocumentId(),
    name: data.name,
    asOf: data.asOf,
    revision: 0,
    nodes,
    edges,
    alternatives: structuredClone(data.alternatives),
  };

  const compiled = compileGraph(document);
  if (!compiled.ok) {
    throw new Error(
      `Cannot open this dataset in the builder: ${compiled.issues.map((i) => i.message).join("; ")}`,
    );
  }
  if (
    stableStringify(compiled.dataset) !==
    stableStringify(canonicalDataset(data))
  ) {
    throw new Error(
      "Cannot open this dataset in the builder: converting it would change its contents.",
    );
  }

  // Scenarios: independent copies, validated against the compiled network.
  const records: ScenarioRecord[] = [];
  const seen = new Set<string>();
  const addScenario = (scenario: Scenario): ScenarioRecord => {
    const copy = structuredClone(scenario);
    const sameId = records.find((r) => r.scenario.id === copy.id);
    if (sameId) {
      if (stableStringify(sameId.scenario) !== stableStringify(copy)) {
        throw new Error(
          `Scenario id "${copy.id}" is used by two different scenarios.`,
        );
      }
      return sameId;
    }
    if (seen.has(copy.id))
      throw new Error(`Duplicate scenario id "${copy.id}".`);
    const record = revalidateScenario(compiled.dataset, compiled.networkKey, {
      scenario: copy,
      validatedNetworkKey: null,
    });
    seen.add(copy.id);
    records.push(record);
    return record;
  };
  if (options.scenarios !== undefined && !Array.isArray(options.scenarios)) {
    throw new Error("Scenarios must be provided as a list.");
  }
  for (const scenario of options.scenarios ?? []) {
    if (!scenario || typeof scenario !== "object") {
      throw new Error("Every scenario must be an object.");
    }
    if (seen.has(scenario.id)) {
      throw new Error(`Duplicate scenario id "${scenario.id}".`);
    }
    addScenario(scenario);
  }
  if (
    options.scenario !== undefined &&
    (options.scenario === null || typeof options.scenario !== "object")
  ) {
    throw new Error("The selected scenario must be an object.");
  }
  const selected = options.scenario ? addScenario(options.scenario) : null;

  return {
    format: BUILDER_WORKSPACE_FORMAT,
    version: BUILDER_WORKSPACE_VERSION,
    document,
    scenarios: records,
    selectedScenarioId: selected ? selected.scenario.id : null,
    workingScenario: selected ? structuredClone(selected) : null,
    source: { origin: options.origin ?? "authored", openedFromFile: false },
  };
}
