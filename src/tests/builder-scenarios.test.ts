import { describe, expect, it } from "vitest";
import { compileGraph } from "@/lib/builder/compiler";
import {
  connectNodes,
  deleteEdge,
  deleteNode,
} from "@/lib/builder/connections";
import {
  createCoreExample,
  createNode,
  nodeKey,
} from "@/lib/builder/factories";
import {
  isScenarioCurrent,
  receiptReviewContext,
  revalidateScenario,
} from "@/lib/builder/scenarios";
import type { BuilderDocument, ScenarioRecord } from "@/lib/builder/types";
import { simulate } from "@/lib/simulation";

describe("builder scenarios and revalidation", () => {
  it("binds valid scenario to networkKey and runs against compiled dataset without mutating baseline", () => {
    const doc = createCoreExample();
    const compiled = compileGraph(doc);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    const draft: ScenarioRecord = {
      scenario: {
        id: "scen-shortage",
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
      validatedNetworkKey: null,
    };

    expect(isScenarioCurrent(draft, compiled.networkKey)).toBe(false);

    const bound = revalidateScenario(
      compiled.dataset,
      compiled.networkKey,
      draft,
    );
    expect(isScenarioCurrent(bound, compiled.networkKey)).toBe(true);
    expect(bound.scenario).toEqual(draft.scenario);

    const res = simulate(compiled.dataset, bound.scenario);
    expect(res.summary.atRiskOrders).toBe(1);
    expect(res.summary.missingUnits).toBe(2);
    expect(compiled.dataset.deliveries[0].availableDate).toBe("2026-11-17");
  });

  it("keeps scenario current across non-material edits and requires review after material edits including same-ID retargeting", () => {
    const doc = createCoreExample();
    const c1 = compileGraph(doc);
    expect(c1.ok).toBe(true);
    if (!c1.ok) return;

    const bound = revalidateScenario(c1.dataset, c1.networkKey, {
      scenario: {
        id: "scen-1",
        name: "Delay",
        deliveryOverrides: [
          {
            deliveryId: "receipt-servo-1",
            availableDate: "2026-11-23",
            quantity: 5,
          },
        ],
        alternatives: [],
      },
      validatedNetworkKey: null,
    });

    // Non-material edit: move node and rename supplier
    const moved: BuilderDocument = {
      ...doc,
      nodes: doc.nodes.map((n) =>
        n.kind === "supplier"
          ? {
              ...n,
              position: { x: 10, y: 10 },
              fields: { ...n.fields, name: "Aster Renamed" },
            }
          : n,
      ),
    };
    const c2 = compileGraph(moved);
    expect(c2.ok).toBe(true);
    if (!c2.ok) return;
    expect(isScenarioCurrent(bound, c2.networkKey)).toBe(true);

    // Same-ID retargeting: add a second component and retarget receipt-servo-1 to it
    const sup = doc.nodes.find((n) => n.kind === "supplier")!;
    const rec = doc.nodes.find((n) => n.kind === "receipt")!;
    const recCompEdge = doc.edges.find((e) => e.kind === "receiptComponent")!;

    const comp2 = createNode("component");
    comp2.fields.name = "Alt Sensor";
    comp2.fields.unit = "pcs";
    comp2.fields.initialStock = "10";

    let retargeted = deleteEdge(doc, recCompEdge.id);
    retargeted = { ...retargeted, nodes: [...retargeted.nodes, comp2] };
    const r1 = connectNodes(retargeted, {
      kind: "primarySupplier",
      source: nodeKey(sup),
      target: nodeKey(comp2),
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const r2 = connectNodes(r1.document, {
      kind: "receiptComponent",
      source: nodeKey(rec),
      target: nodeKey(comp2),
    });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;

    const c3 = compileGraph(r2.document);
    expect(c3.ok).toBe(true);
    if (!c3.ok) return;

    // Even though receipt-servo-1 still exists, networkKey changed -> requires review!
    expect(isScenarioCurrent(bound, c3.networkKey)).toBe(false);

    const context = receiptReviewContext(c3.dataset, "receipt-servo-1");
    expect(context?.component.name).toBe("Alt Sensor");
    expect(context?.component.id).toBe(comp2.id);
    expect(context?.supplier.name).toBe("Aster Manufacturing");
    expect(context?.receipt.availableDate).toBe("2026-11-17");
    expect(bound.scenario.deliveryOverrides[0].availableDate).toBe(
      "2026-11-23",
    );

    // Explicit revalidation succeeds and binds to c3.networkKey without altering inputs
    const revalidated = revalidateScenario(c3.dataset, c3.networkKey, bound);
    expect(isScenarioCurrent(revalidated, c3.networkKey)).toBe(true);
    expect(revalidated.scenario).toEqual(bound.scenario);
  });

  it("throws on invalid scenario during revalidation without auto-pruning or clamping original inputs", () => {
    const doc = createCoreExample();
    const rec = doc.nodes.find((n) => n.kind === "receipt")!;
    const withoutReceipt = deleteNode(doc, nodeKey(rec));

    const compiled = compileGraph(withoutReceipt);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    const staleRecord: ScenarioRecord = {
      scenario: {
        id: "scen-stale",
        name: "Delay deleted receipt",
        deliveryOverrides: [
          {
            deliveryId: "receipt-servo-1",
            availableDate: "2026-11-23",
            quantity: 5,
          },
        ],
        alternatives: [],
      },
      validatedNetworkKey: "old-key",
    };

    expect(isScenarioCurrent(staleRecord, compiled.networkKey)).toBe(false);
    expect(
      receiptReviewContext(compiled.dataset, "receipt-servo-1"),
    ).toBeNull();
    expect(() =>
      revalidateScenario(compiled.dataset, compiled.networkKey, staleRecord),
    ).toThrowError(/not a delivery in this dataset/);

    // Original inputs remain unpruned and unclamped
    expect(staleRecord.scenario.deliveryOverrides).toHaveLength(1);
    expect(staleRecord.scenario.deliveryOverrides[0].deliveryId).toBe(
      "receipt-servo-1",
    );
  });
});
