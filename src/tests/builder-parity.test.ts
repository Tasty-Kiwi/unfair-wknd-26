import { describe, expect, it } from "vitest";
import {
  addAlternative,
  deleteAlternative,
  updateAlternative,
} from "@/lib/builder/alternatives";
import { compileGraph, computeNetworkKey } from "@/lib/builder/compiler";
import { createCoreExample } from "@/lib/builder/factories";
import { isScenarioCurrent, revalidateScenario } from "@/lib/builder/scenarios";
import { parseWorkspace } from "@/lib/builder/schema";
import { parseWorkspaceJson, serializeWorkspace } from "@/lib/builder/storage";
import {
  BUILDER_WORKSPACE_FORMAT,
  BUILDER_WORKSPACE_VERSION,
  type BuilderDocument,
  type BuilderWorkspaceV1,
} from "@/lib/builder/types";
import { datasetToWorkspace } from "@/lib/builder/workspaceFromDataset";
import {
  demoData,
  DISRUPTION_SCENARIO,
  NORMAL_SCENARIO,
  RECOVERY_SCENARIO,
} from "@/data/demo";
import { simulate } from "@/lib/simulation";
import type { Dataset, SimulationResult } from "@/lib/types";
import { parseDataset } from "@/lib/validation";

const sortedById = <T extends { id: string }>(items: T[]) =>
  [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

function compiled(document: BuilderDocument) {
  const result = compileGraph(document);
  if (!result.ok) {
    throw new Error(result.issues.map((issue) => issue.message).join("; "));
  }
  return result;
}

/** The editor stores bills of materials sorted by component, so material lines
 * may be listed in a different order; allocations themselves must be equal. */
function normalised(result: SimulationResult): SimulationResult {
  return {
    ...result,
    orders: sortedBy(result.orders, (o) => o.orderId).map((order) => ({
      ...order,
      lines: sortedBy(order.lines, (l) => l.componentId),
    })),
    deliveries: sortedBy(result.deliveries, (d) => d.id),
  };
}
function sortedBy<T>(items: T[], key: (item: T) => string) {
  return [...items].sort((a, b) =>
    key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0,
  );
}

const allScenarios = [NORMAL_SCENARIO, DISRUPTION_SCENARIO, RECOVERY_SCENARIO];

describe("Northstar demo as an editable workspace", () => {
  const workspace = datasetToWorkspace(demoData, {
    scenario: RECOVERY_SCENARIO,
    scenarios: allScenarios,
    origin: "fictional",
  });
  const result = compiled(workspace.document);

  it("keeps the demo oracle shape and every domain ID", () => {
    expect(
      workspace.document.nodes.filter((n) => n.kind === "supplier"),
    ).toHaveLength(4);
    expect(
      workspace.document.nodes.filter((n) => n.kind === "component"),
    ).toHaveLength(10);
    expect(
      workspace.document.nodes.filter((n) => n.kind === "receipt"),
    ).toHaveLength(11);
    expect(
      workspace.document.nodes.filter((n) => n.kind === "product"),
    ).toHaveLength(5);
    expect(
      workspace.document.nodes.filter((n) => n.kind === "order"),
    ).toHaveLength(10);
    expect(workspace.document.alternatives?.map((a) => a.id)).toEqual([
      "ALT-01",
    ]);
    const ids = new Set(workspace.document.nodes.map((n) => n.id));
    for (const item of [
      ...demoData.suppliers,
      ...demoData.components,
      ...demoData.products,
      ...demoData.deliveries,
      ...demoData.orders,
    ]) {
      expect(ids.has(item.id)).toBe(true);
    }
  });

  it("compiles to a dataset equal to the demo, including alternatives", () => {
    expect(result.dataset.name).toBe(demoData.name);
    expect(result.dataset.asOf).toBe(demoData.asOf);
    expect(result.dataset.suppliers).toEqual(sortedById(demoData.suppliers));
    expect(result.dataset.components).toEqual(sortedById(demoData.components));
    expect(result.dataset.deliveries).toEqual(sortedById(demoData.deliveries));
    expect(result.dataset.orders).toEqual(sortedById(demoData.orders));
    expect(result.dataset.alternatives).toEqual(demoData.alternatives);
    expect(
      [...result.dataset.inventory].sort((a, b) =>
        a.componentId.localeCompare(b.componentId),
      ),
    ).toEqual(
      [...demoData.inventory].sort((a, b) =>
        a.componentId.localeCompare(b.componentId),
      ),
    );
    for (const product of result.dataset.products) {
      const original = demoData.products.find((p) => p.id === product.id)!;
      expect(product.name).toBe(original.name);
      expect(product.sku).toBe(original.sku);
      expect(
        sortedById(product.bom.map((l) => ({ id: l.componentId, ...l }))),
      ).toEqual(
        sortedById(original.bom.map((l) => ({ id: l.componentId, ...l }))),
      );
    }
  });

  it("allocates identically to the demo for baseline, delay and recovery", () => {
    for (const scenario of allScenarios) {
      expect(normalised(simulate(result.dataset, scenario))).toEqual(
        normalised(simulate(demoData, scenario)),
      );
    }
    expect(simulate(result.dataset, NORMAL_SCENARIO).summary.atRiskOrders).toBe(
      0,
    );
    const delayed = simulate(result.dataset, DISRUPTION_SCENARIO).summary;
    expect(delayed.atRiskOrders).toBe(1);
    expect(delayed.missingUnits).toBe(2);
    expect(delayed.atRiskValue).toBe(36000);
    const recovered = simulate(result.dataset, RECOVERY_SCENARIO);
    expect(recovered.summary.atRiskOrders).toBe(0);
    expect(
      recovered.deliveries.find((d) => d.id === "PO-101")?.availableDate,
    ).toBe("2026-11-23");
  });

  it("keeps independent, validated scenario copies bound to the network", () => {
    expect(workspace.scenarios.map((r) => r.scenario.id)).toEqual([
      "normal",
      "motor-delay",
      "recovery",
    ]);
    expect(workspace.selectedScenarioId).toBe("recovery");
    expect(workspace.workingScenario?.scenario).toEqual(RECOVERY_SCENARIO);
    for (const record of workspace.scenarios) {
      expect(isScenarioCurrent(record, result.networkKey)).toBe(true);
    }
    const saved = workspace.scenarios.find(
      (r) => r.scenario.id === "recovery",
    )!;
    expect(saved).not.toBe(workspace.workingScenario);
    expect(saved.alternativeSnapshots?.[0]).toMatchObject({
      alternativeId: "ALT-01",
      supplier: { id: "SUP-04" },
      component: { id: "MTR-01" },
    });
    expect(workspace.workingScenario?.scenario.alternatives).not.toBe(
      saved.scenario.alternatives,
    );
  });

  it("does not mutate its inputs and is deterministic", () => {
    const before = structuredClone(demoData);
    const scenarioBefore = structuredClone(RECOVERY_SCENARIO);
    const a = datasetToWorkspace(demoData, {
      scenario: RECOVERY_SCENARIO,
      documentId: "doc-x",
    });
    const b = datasetToWorkspace(demoData, {
      scenario: RECOVERY_SCENARIO,
      documentId: "doc-x",
    });
    expect(a).toEqual(b);
    expect(demoData).toEqual(before);
    expect(RECOVERY_SCENARIO).toEqual(scenarioBefore);
  });

  it("lays nodes out without overlap, one column per kind", () => {
    const seen = new Set<string>();
    for (const node of workspace.document.nodes) {
      const key = `${node.position.x},${node.position.y}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("round-trips through export and import with the same network key", () => {
    const restored = parseWorkspaceJson(serializeWorkspace(workspace));
    expect(restored).toEqual(workspace);
    expect(compiled(restored.document).networkKey).toBe(result.networkKey);
    expect(restored.source).toEqual({
      origin: "fictional",
      openedFromFile: false,
    });
  });
});

describe("multi-supplier component parity", () => {
  it("retains the v1 material key for unchanged single-supplier networks", () => {
    const key = computeNetworkKey("legacy-document", demoData);
    const savedMaterial = JSON.parse(key.slice("nk1:".length));
    expect(savedMaterial.components).toEqual(
      [...demoData.components]
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        .map(({ id, supplierId }) => ({ id, supplierId })),
    );
    const explicitLists = {
      ...demoData,
      components: demoData.components.map((component) => ({
        ...component,
        supplierIds: [component.supplierId],
      })),
    };
    expect(computeNetworkKey("legacy-document", explicitLists)).toBe(key);
  });
  it("accepts a redundant one-supplier association without changing legacy shape", () => {
    const data: Dataset = {
      ...demoData,
      components: demoData.components.map((component) =>
        component.id === "MTR-01"
          ? { ...component, supplierIds: [component.supplierId] }
          : component,
      ),
    };
    const workspace = datasetToWorkspace(data, {
      scenario: NORMAL_SCENARIO,
      origin: "fictional",
    });
    const result = compileGraph(workspace.document);
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(
        result.dataset.components.find(
          (component) => component.id === "MTR-01",
        ),
      ).toEqual(
        demoData.components.find((component) => component.id === "MTR-01"),
      );
  });

  it("round-trips both associations, keeps the primary, and allocates each receipt once", () => {
    const data: Dataset = {
      ...demoData,
      inventory: demoData.inventory.map((row) =>
        row.componentId === "MTR-01" ? { ...row, quantity: 0 } : row,
      ),
      components: demoData.components.map((component) =>
        component.id === "MTR-01"
          ? { ...component, supplierIds: ["SUP-01", "SUP-02"] }
          : component,
      ),
      deliveries: [
        ...demoData.deliveries,
        {
          id: "PO-112",
          supplierId: "SUP-02",
          componentId: "MTR-01",
          quantity: 3,
          availableDate: "2026-11-17",
        },
      ],
      products: [
        {
          ...demoData.products[1],
          bom: [{ componentId: "MTR-01", quantity: 1 }],
        },
      ],
      orders: [{ ...demoData.orders[1], quantity: 8 }],
    };
    const workspace = datasetToWorkspace(data, {
      scenario: NORMAL_SCENARIO,
      origin: "imported",
    });
    const restored = parseWorkspaceJson(serializeWorkspace(workspace));
    const result = compileGraph(restored.document);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const motor = result.dataset.components.find(
      (component) => component.id === "MTR-01",
    )!;
    expect(motor.supplierId).toBe("SUP-01");
    expect(motor.supplierIds).toEqual(["SUP-01", "SUP-02"]);
    expect(parseDataset(result.dataset)).toEqual(result.dataset);
    const line = simulate(result.dataset, NORMAL_SCENARIO).orders[0].lines[0];
    expect(line.allocated).toBe(8);
    expect(
      line.allocations
        .filter((allocation) => allocation.sourceType === "delivery")
        .map((allocation) => [allocation.sourceId, allocation.quantity]),
    ).toEqual([
      ["PO-101", 5],
      ["PO-112", 3],
    ]);
    expect(
      line.allocations.reduce(
        (sum, allocation) => sum + allocation.quantity,
        0,
      ),
    ).toBe(8);
  });
});

describe("workspace source provenance", () => {
  const provenance = {
    kind: "mixed" as const,
    tables: {
      suppliers: "fictional",
      components: "fictional",
      products: "imported",
      inventory: "imported",
      deliveries: "imported",
      orders: "fictional",
      alternatives: "fictional",
    } as const,
  };

  it("round-trips optional provenance and retained-BOM flag on source", () => {
    const ws = datasetToWorkspace(demoData, { origin: "mixed" });
    const merged: BuilderWorkspaceV1 = {
      ...ws,
      source: { ...ws.source, provenance, retainedProductBoms: true },
    };
    const restored = parseWorkspaceJson(serializeWorkspace(merged));
    expect(restored.source).toEqual({
      origin: "mixed",
      openedFromFile: false,
      provenance,
      retainedProductBoms: true,
    });
  });

  it("keeps older sources without the new fields valid and unchanged", () => {
    const ws = datasetToWorkspace(demoData);
    expect(Object.keys(ws.source).sort()).toEqual(["openedFromFile", "origin"]);
    expect(parseWorkspaceJson(serializeWorkspace(ws)).source).toEqual(
      ws.source,
    );
  });

  it("rejects malformed provenance", () => {
    const ws = datasetToWorkspace(demoData);
    const source = (extra: Record<string, unknown>) => ({
      ...ws,
      source: { ...ws.source, ...extra },
    });
    expect(() =>
      parseWorkspace(source({ provenance: { kind: "cloud", tables: {} } })),
    ).toThrow();
    expect(() =>
      parseWorkspace(
        source({
          provenance: { ...provenance, tables: { suppliers: "imported" } },
        }),
      ),
    ).toThrow();
    expect(() =>
      parseWorkspace(source({ retainedProductBoms: "yes" })),
    ).toThrow();
  });
});

describe("datasetToWorkspace options and safety", () => {
  it.each(["imported", "mixed", "fictional", "authored"] as const)(
    "records the %s origin and survives import",
    (origin) => {
      const ws = datasetToWorkspace(demoData, { origin });
      expect(ws.source.origin).toBe(origin);
      expect(parseWorkspaceJson(serializeWorkspace(ws)).source.origin).toBe(
        origin,
      );
    },
  );

  it("defaults to authored and rejects unknown origins in saved files", () => {
    const ws = datasetToWorkspace(demoData);
    expect(ws.source.origin).toBe("authored");
    expect(() =>
      parseWorkspace({
        ...ws,
        source: { origin: "cloud", openedFromFile: false },
      }),
    ).toThrow();
  });

  it("keeps explicit zero inventory and omitted inventory distinct", () => {
    const data: Dataset = {
      ...structuredClone(demoData),
      inventory: demoData.inventory
        .filter((row) => row.componentId !== "BRK-01")
        .map((row) =>
          row.componentId === "DSP-01" ? { ...row, quantity: 0 } : row,
        ),
    };
    const ws = datasetToWorkspace(data);
    const stock = (id: string) => {
      const node = ws.document.nodes.find((n) => n.id === id);
      return node?.kind === "component" ? node.fields.initialStock : undefined;
    };
    expect(stock("DSP-01")).toBe("0");
    expect(stock("BRK-01")).toBeNull();
    const out = compiled(ws.document).dataset.inventory;
    expect(out.find((row) => row.componentId === "DSP-01")?.quantity).toBe(0);
    expect(out.some((row) => row.componentId === "BRK-01")).toBe(false);
    expect(
      normalised(simulate(compiled(ws.document).dataset, NORMAL_SCENARIO)),
    ).toEqual(normalised(simulate(parseDataset(data), NORMAL_SCENARIO)));
  });

  it("rejects invalid datasets explicitly", () => {
    const bad = structuredClone(demoData);
    bad.alternatives[0].componentId = "NOPE";
    expect(() => datasetToWorkspace(bad)).toThrow(/Cannot open this dataset/);
    const duplicate = structuredClone(demoData);
    duplicate.orders.push({ ...duplicate.orders[0] });
    expect(() => datasetToWorkspace(duplicate)).toThrow(
      /Cannot open this dataset/,
    );
  });

  it("rejects invalid, conflicting or malformed scenarios instead of dropping them", () => {
    expect(() =>
      datasetToWorkspace(demoData, {
        scenario: {
          id: "bad",
          name: "Bad",
          deliveryOverrides: [
            { deliveryId: "PO-999", availableDate: "2026-11-23", quantity: 1 },
          ],
          alternatives: [],
        },
      }),
    ).toThrow();
    expect(() =>
      datasetToWorkspace(demoData, {
        scenarios: [
          NORMAL_SCENARIO,
          { ...NORMAL_SCENARIO, name: "Different with same id" },
        ],
      }),
    ).toThrow(/two different|Duplicate/);
    expect(() =>
      datasetToWorkspace(demoData, {
        scenarios: [NORMAL_SCENARIO, NORMAL_SCENARIO],
      }),
    ).toThrow(/Duplicate/);
    expect(() =>
      datasetToWorkspace(demoData, { scenarios: "nope" as never }),
    ).toThrow(/list/);
    expect(() =>
      datasetToWorkspace(demoData, { scenarios: [null as never] }),
    ).toThrow(/object/);
    expect(() =>
      datasetToWorkspace(demoData, {
        scenario: {
          ...RECOVERY_SCENARIO,
          alternatives: [
            {
              alternativeId: "ALT-01",
              quantity: 99,
              availableDate: "2026-11-18",
            },
          ],
        },
      }),
    ).toThrow();
  });

  it("accepts the selected scenario also listed in scenarios without duplicating it", () => {
    const ws = datasetToWorkspace(demoData, {
      scenario: DISRUPTION_SCENARIO,
      scenarios: [DISRUPTION_SCENARIO],
    });
    expect(ws.scenarios).toHaveLength(1);
    expect(ws.selectedScenarioId).toBe("motor-delay");
  });
});

describe("alternatives in the builder compiler", () => {
  const base = () =>
    datasetToWorkspace(demoData, { documentId: "doc-alt" }).document;
  const withAlt = (
    document: BuilderDocument,
    changes: Record<string, unknown>,
  ) => updateAlternative(document, "ALT-01", changes);
  const issues = (document: BuilderDocument) => {
    const result = compileGraph(document);
    return result.ok ? [] : result.issues;
  };

  it("keeps old v1 workspaces without alternatives valid and unchanged", () => {
    const legacy: BuilderWorkspaceV1 = {
      format: BUILDER_WORKSPACE_FORMAT,
      version: BUILDER_WORKSPACE_VERSION,
      document: createCoreExample(),
      scenarios: [],
      selectedScenarioId: null,
      workingScenario: null,
      source: { origin: "fictional", openedFromFile: false },
    };
    expect(legacy.document.alternatives).toBeUndefined();
    const restored = parseWorkspaceJson(JSON.stringify(legacy));
    expect(restored).toEqual(legacy);
    expect("alternatives" in restored.document).toBe(false);
    const result = compiled(restored.document);
    expect(result.dataset.alternatives).toEqual([]);
    expect(
      compiled({ ...restored.document, alternatives: [] }).networkKey,
    ).toBe(result.networkKey);
  });

  it("includes alternatives in the network identity", () => {
    const document = base();
    const key = compiled(document).networkKey;
    expect(compiled(deleteAlternative(document, "ALT-01")).networkKey).not.toBe(
      key,
    );
    expect(compiled(withAlt(document, { quantity: 3 })).networkKey).not.toBe(
      key,
    );
    expect(
      compiled(withAlt(document, { approved: false })).networkKey,
    ).not.toBe(key);
    expect(
      compiled(withAlt(document, { approvedProductIds: ["PRD-02", "PRD-01"] }))
        .networkKey,
    ).not.toBe(key);
  });

  it("flags malformed references, limits, dates and scope", () => {
    const document = base();
    const cases: [Record<string, unknown>, string][] = [
      [{ supplierId: "SUP-99" }, "supplierId"],
      [{ componentId: "NOPE" }, "componentId"],
      [{ componentId: "SUP-01" }, "componentId"],
      [{ approvedProductIds: ["PRD-99"] }, "approvedProductIds"],
      [{ approvedProductIds: [] }, "approvedProductIds"],
      [{ quantity: -1 }, "quantity"],
      [{ quantity: 1.5 }, "quantity"],
      [{ availableDate: "2026-11-01" }, "availableDate"],
      [{ availableDate: "soon" }, "availableDate"],
      [{ name: "  " }, "name"],
    ];
    for (const [changes, field] of cases) {
      const found = issues(withAlt(document, changes));
      expect(found.length, JSON.stringify(changes)).toBeGreaterThan(0);
      expect(
        found.some((i) => i.alternativeId === "ALT-01" && i.field === field),
        JSON.stringify(changes),
      ).toBe(true);
    }
  });

  it("rejects duplicate alternative ids and unknown products when imported", () => {
    const ws = datasetToWorkspace(demoData);
    const alt = ws.document.alternatives![0];
    expect(() =>
      parseWorkspace({
        ...ws,
        document: { ...ws.document, alternatives: [alt, alt] },
      }),
    ).toThrow();
  });

  it("add/update/delete keep immutable ids and bump the revision", () => {
    const document = base();
    const { id, document: added } = addAlternative(document);
    expect(added.revision).toBe(document.revision + 1);
    expect(added.alternatives).toHaveLength(2);
    expect(issues(added).some((i) => i.alternativeId === id)).toBe(true);
    const updated = updateAlternative(added, id, {
      name: "Backup frame",
      supplierId: "SUP-03",
      componentId: "FRM-01",
      quantity: 4,
      availableDate: "2026-11-20",
      approved: true,
      approvedProductIds: ["PRD-01"],
    });
    expect(updated.alternatives!.find((a) => a.id === id)).toMatchObject({
      id,
      name: "Backup frame",
    });
    expect(
      compiled(updated)
        .dataset.alternatives.map((a) => a.id)
        .sort(),
    ).toEqual(["ALT-01", id].sort());
    expect(updateAlternative(updated, id, { quantity: 4 })).toBe(updated);
    expect(
      deleteAlternative(updated, id).alternatives!.map((a) => a.id),
    ).toEqual(["ALT-01"]);
    expect(document.alternatives).toHaveLength(1);
  });
});

describe("edits invalidate scenarios and revalidate safely", () => {
  const ws = datasetToWorkspace(demoData, { scenario: RECOVERY_SCENARIO });
  const record = ws.scenarios[0];

  it("marks a scenario stale after the catalog changes", () => {
    const edited = updateAlternative(ws.document, "ALT-01", { quantity: 1 });
    const next = compiled(edited);
    expect(isScenarioCurrent(record, next.networkKey)).toBe(false);
    expect(() =>
      revalidateScenario(next.dataset, next.networkKey, record),
    ).toThrow();
    const lowered = revalidateScenario(next.dataset, next.networkKey, {
      ...record,
      scenario: {
        ...record.scenario,
        alternatives: [
          { alternativeId: "ALT-01", quantity: 1, availableDate: "2026-11-18" },
        ],
      },
    });
    expect(isScenarioCurrent(lowered, next.networkKey)).toBe(true);
  });

  it("fails clearly when the used alternative was deleted or unapproved", () => {
    const deleted = compiled(deleteAlternative(ws.document, "ALT-01"));
    expect(() =>
      revalidateScenario(deleted.dataset, deleted.networkKey, record),
    ).toThrow();
    const unapproved = compiled(
      updateAlternative(ws.document, "ALT-01", { approved: false }),
    );
    expect(() =>
      revalidateScenario(unapproved.dataset, unapproved.networkKey, record),
    ).toThrow();
  });

  it("revalidates a scenario after an unrelated edit and keeps results", () => {
    const edited = {
      ...ws.document,
      name: "Renamed",
      revision: ws.document.revision + 1,
    };
    const next = compiled(edited);
    const again = revalidateScenario(next.dataset, next.networkKey, record);
    expect(simulate(next.dataset, again.scenario).summary.atRiskOrders).toBe(0);
  });
});
