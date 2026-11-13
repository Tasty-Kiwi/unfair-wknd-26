import { describe, expect, it } from "vitest";
import { compileGraph } from "@/lib/builder/compiler";
import {
  canConnect,
  connectNodes,
  deleteEdge,
  deleteNode,
  relationshipKind,
} from "@/lib/builder/connections";
import {
  createBlankDocument,
  createCoreExample,
  createNode,
  nodeKey,
} from "@/lib/builder/factories";
import {
  NODE_KINDS,
  type BuilderDocument,
  type RelationshipKind,
} from "@/lib/builder/types";
import { simulate } from "@/lib/simulation";

function makeValidChain(): BuilderDocument {
  const doc = createBlankDocument();
  doc.name = "Chain";
  doc.asOf = "2026-11-13";

  const sup = createNode("supplier", { x: 0, y: 0 });
  sup.fields.name = "Sup 1";

  const comp = createNode("component", { x: 100, y: 0 });
  comp.fields.name = "Comp 1";
  comp.fields.unit = "pcs";
  comp.fields.initialStock = "1";

  const rec = createNode("receipt", { x: 100, y: 100 });
  rec.fields.quantity = "1";
  rec.fields.availableDate = "2026-11-15";

  const prod = createNode("product", { x: 200, y: 0 });
  prod.fields.name = "Prod 1";
  prod.fields.sku = "SKU-1";

  const ord = createNode("order", { x: 300, y: 0 });
  ord.fields.customer = "Cust 1";
  ord.fields.quantity = "2";
  ord.fields.requiredDate = "2026-11-16";
  ord.fields.value = "100";

  let next: BuilderDocument = {
    ...doc,
    nodes: [sup, comp, rec, prod, ord],
  };

  const links: Array<{
    kind: RelationshipKind;
    source: string;
    target: string;
    quantity?: string;
  }> = [
    { kind: "primarySupplier", source: nodeKey(sup), target: nodeKey(comp) },
    { kind: "receiptSupplier", source: nodeKey(sup), target: nodeKey(rec) },
    { kind: "receiptComponent", source: nodeKey(rec), target: nodeKey(comp) },
    {
      kind: "bom",
      source: nodeKey(comp),
      target: nodeKey(prod),
      quantity: "1",
    },
    { kind: "orderedProduct", source: nodeKey(prod), target: nodeKey(ord) },
  ];

  for (const link of links) {
    const res = connectNodes(next, link);
    if (!res.ok) throw new Error(res.message);
    next = res.document;
  }
  return next;
}

describe("builder factories", () => {
  it("creates blank document with no hidden entities and fails compile", () => {
    const blank = createBlankDocument();
    expect(blank.nodes).toEqual([]);
    expect(blank.edges).toEqual([]);
    expect(blank.revision).toBe(0);

    const compiled = compileGraph(blank);
    expect(compiled.ok).toBe(false);
    if (!compiled.ok) {
      expect(compiled.issues.some((i) => i.field === "name")).toBe(true);
      expect(compiled.issues.some((i) => i.field === "asOf")).toBe(true);
    }
  });

  it("creates all five node kinds with kind-prefixed IDs and raw fields", () => {
    for (const kind of NODE_KINDS) {
      const node = createNode(kind, { x: 10, y: 20 });
      expect(node.kind).toBe(kind);
      expect(node.id.startsWith(`${kind}-`)).toBe(true);
      expect(nodeKey(node)).toBe(`${kind}:${node.id}`);
      expect(node.position).toEqual({ x: 10, y: 20 });
    }
    const comp = createNode("component");
    if (comp.kind === "component") {
      expect(comp.fields.initialStock).toBe("");
    }
    const sup = createNode("supplier");
    if (sup.kind === "supplier") {
      expect(sup.fields.leadTimeDays).toBe("0");
    }
  });
});

describe("builder connections", () => {
  const expectedPairs: Record<string, RelationshipKind | null> = {
    "supplier->component": "primarySupplier",
    "supplier->receipt": "receiptSupplier",
    "receipt->component": "receiptComponent",
    "component->product": "bom",
    "product->order": "orderedProduct",
  };

  it("maps all 25 (sourceKind, targetKind) pairs accurately", () => {
    for (const src of NODE_KINDS) {
      for (const tgt of NODE_KINDS) {
        const expected = expectedPairs[`${src}->${tgt}`] ?? null;
        expect(relationshipKind(src, tgt)).toBe(expected);
      }
    }
  });

  it("rejects wrong direction, self-loops, missing nodes, and duplicate/second-parent edges without mutating", () => {
    const doc = makeValidChain();
    const revBefore = doc.revision;
    const edgesBefore = doc.edges.length;

    const sup = doc.nodes.find((n) => n.kind === "supplier")!;
    const comp = doc.nodes.find((n) => n.kind === "component")!;
    const rec = doc.nodes.find((n) => n.kind === "receipt")!;
    const prod = doc.nodes.find((n) => n.kind === "product")!;
    const ord = doc.nodes.find((n) => n.kind === "order")!;

    // Wrong direction
    const wrongDir = connectNodes(doc, {
      kind: "primarySupplier",
      source: nodeKey(comp),
      target: nodeKey(sup),
    });
    expect(wrongDir.ok).toBe(false);

    // Self-loop
    const selfLoop = connectNodes(doc, {
      kind: "bom",
      source: nodeKey(comp),
      target: nodeKey(comp),
    });
    expect(selfLoop.ok).toBe(false);

    // Missing node
    const missing = connectNodes(doc, {
      kind: "bom",
      source: nodeKey(comp),
      target: "product:nonexistent",
    });
    expect(missing.ok).toBe(false);

    // Duplicate BOM
    const dupBom = connectNodes(doc, {
      kind: "bom",
      source: nodeKey(comp),
      target: nodeKey(prod),
      quantity: "5",
    });
    expect(dupBom.ok).toBe(false);

    // Second parent on component / receipt / order
    const sup2 = createNode("supplier");
    const comp2 = createNode("component");
    const prod2 = createNode("product");
    const extended: BuilderDocument = {
      ...doc,
      nodes: [...doc.nodes, sup2, comp2, prod2],
    };

    expect(
      canConnect(extended, {
        kind: "primarySupplier",
        source: nodeKey(sup2),
        target: nodeKey(comp),
      }).ok,
    ).toBe(false);

    expect(
      canConnect(extended, {
        kind: "receiptSupplier",
        source: nodeKey(sup2),
        target: nodeKey(rec),
      }).ok,
    ).toBe(false);

    expect(
      canConnect(extended, {
        kind: "receiptComponent",
        source: nodeKey(rec),
        target: nodeKey(comp2),
      }).ok,
    ).toBe(false);

    expect(
      canConnect(extended, {
        kind: "orderedProduct",
        source: nodeKey(prod2),
        target: nodeKey(ord),
      }).ok,
    ).toBe(false);

    expect(doc.revision).toBe(revBefore);
    expect(doc.edges.length).toBe(edgesBefore);
  });

  it("defaults new BOM quantity to empty string (compile blocker) and bumps revision on connect/delete", () => {
    const doc = makeValidChain();
    const comp2 = createNode("component");
    comp2.fields.name = "Bolt";
    comp2.fields.unit = "pcs";
    comp2.fields.initialStock = "10";

    const sup = doc.nodes.find((n) => n.kind === "supplier")!;
    const prod = doc.nodes.find((n) => n.kind === "product")!;

    let next: BuilderDocument = { ...doc, nodes: [...doc.nodes, comp2] };
    const r1 = connectNodes(next, {
      kind: "primarySupplier",
      source: nodeKey(sup),
      target: nodeKey(comp2),
    });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    next = r1.document;

    const r2 = connectNodes(next, {
      kind: "bom",
      source: nodeKey(comp2),
      target: nodeKey(prod),
    });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    next = r2.document;

    const newBom = next.edges[next.edges.length - 1];
    expect(newBom.kind).toBe("bom");
    if (newBom.kind === "bom") {
      expect(newBom.quantity).toBe("");
    }

    const compiled = compileGraph(next);
    expect(compiled.ok).toBe(false);

    const afterDeleteEdge = deleteEdge(next, newBom.id);
    expect(afterDeleteEdge.revision).toBe(next.revision + 1);
    expect(afterDeleteEdge.edges.length).toBe(next.edges.length - 1);

    const afterDeleteNode = deleteNode(afterDeleteEdge, nodeKey(comp2));
    expect(afterDeleteNode.revision).toBe(afterDeleteEdge.revision + 1);
    expect(
      afterDeleteNode.edges.some(
        (e) => e.source === nodeKey(comp2) || e.target === nodeKey(comp2),
      ),
    ).toBe(false);
    expect(compileGraph(afterDeleteNode).ok).toBe(true);
  });
});

describe("builder compiler and motor oracle", () => {
  it("compiles core example and matches baseline and Nov 23 shortage2 through simulate()", () => {
    const core = createCoreExample();
    const compiled = compileGraph(core);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    expect(compiled.canSimulate).toBe(true);
    expect(compiled.dataset.alternatives).toEqual([]);
    expect(compiled.dataset.suppliers).toHaveLength(1);
    expect(compiled.dataset.components).toHaveLength(1);
    expect(compiled.dataset.deliveries).toHaveLength(1);
    expect(compiled.dataset.products).toHaveLength(1);
    expect(compiled.dataset.orders).toHaveLength(2);

    const baseline = simulate(compiled.dataset, {
      id: "baseline",
      name: "Baseline",
      deliveryOverrides: [],
      alternatives: [],
    });
    expect(baseline.summary.atRiskOrders).toBe(0);
    expect(baseline.summary.missingUnits).toBe(0);
    expect(baseline.orders.every((o) => o.status === "covered")).toBe(true);

    const delayed = simulate(compiled.dataset, {
      id: "motor-shortage",
      name: "Motor shortage",
      deliveryOverrides: [
        {
          deliveryId: "receipt-servo-1",
          availableDate: "2026-11-23",
          quantity: 5,
        },
      ],
      alternatives: [],
    });
    expect(delayed.summary.atRiskOrders).toBe(1);
    expect(delayed.summary.missingUnits).toBe(2);
    const orderB = delayed.orders.find((o) => o.orderId === "order-customer-b");
    expect(orderB?.status).toBe("at-risk");
    expect(orderB?.lines[0].required).toBe(4);
    expect(orderB?.lines[0].allocated).toBe(2);
    expect(orderB?.lines[0].shortage).toBe(2);
    expect(orderB?.lines[0].lateDeliveries.map((d) => d.id)).toContain(
      "receipt-servo-1",
    );

    // Baseline dataset remains unmodified
    expect(compiled.dataset.deliveries[0].availableDate).toBe("2026-11-17");
  });

  it("keeps receipt supplier independent from component primary supplier", () => {
    const doc = makeValidChain();
    const sup2 = createNode("supplier");
    sup2.fields.name = "Secondary Logistics";

    const existingReceiptSupplierEdge = doc.edges.find(
      (e) => e.kind === "receiptSupplier",
    )!;
    const rec = doc.nodes.find((n) => n.kind === "receipt")!;

    let next = deleteEdge(doc, existingReceiptSupplierEdge.id);
    next = { ...next, nodes: [...next.nodes, sup2] };
    const linked = connectNodes(next, {
      kind: "receiptSupplier",
      source: nodeKey(sup2),
      target: nodeKey(rec),
    });
    expect(linked.ok).toBe(true);
    if (!linked.ok) return;

    const compiled = compileGraph(linked.document);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    expect(compiled.dataset.components[0].supplierId).not.toBe(
      compiled.dataset.deliveries[0].supplierId,
    );
    expect(compiled.dataset.deliveries[0].supplierId).toBe(sup2.id);
  });

  it("supports multiple receipts and multiple materials per product", () => {
    const doc = makeValidChain();
    const sup = doc.nodes.find((n) => n.kind === "supplier")!;
    const comp1 = doc.nodes.find((n) => n.kind === "component")!;
    const prod = doc.nodes.find((n) => n.kind === "product")!;

    const comp2 = createNode("component");
    comp2.fields.name = "Housing";
    comp2.fields.unit = "pcs";
    comp2.fields.initialStock = "0";

    const rec2 = createNode("receipt");
    rec2.fields.quantity = "3";
    rec2.fields.availableDate = "2026-11-14";

    let next: BuilderDocument = {
      ...doc,
      nodes: [...doc.nodes, comp2, rec2],
    };
    const links: Array<{
      kind: RelationshipKind;
      source: string;
      target: string;
      quantity?: string;
    }> = [
      { kind: "primarySupplier", source: nodeKey(sup), target: nodeKey(comp2) },
      {
        kind: "bom",
        source: nodeKey(comp2),
        target: nodeKey(prod),
        quantity: "2",
      },
      { kind: "receiptSupplier", source: nodeKey(sup), target: nodeKey(rec2) },
      {
        kind: "receiptComponent",
        source: nodeKey(rec2),
        target: nodeKey(comp1),
      },
    ];
    for (const link of links) {
      const res = connectNodes(next, link);
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      next = res.document;
    }

    const compiled = compileGraph(next);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;

    expect(compiled.dataset.deliveries).toHaveLength(2);
    expect(compiled.dataset.products[0].bom).toHaveLength(2);
    // Explicit "0" stock emits an inventory row with quantity 0
    const comp2Inv = compiled.dataset.inventory.find(
      (i) => i.componentId === comp2.id,
    );
    expect(comp2Inv).toEqual({ componentId: comp2.id, quantity: 0 });
  });

  it("rejects blank numbers, invalid dates, out-of-order dates, and incomplete nodes without omitting them", () => {
    const doc = makeValidChain();

    // Blank initialStock -> error (no blank-to-zero)
    const blankStock: BuilderDocument = {
      ...doc,
      nodes: doc.nodes.map((n) =>
        n.kind === "component"
          ? { ...n, fields: { ...n.fields, initialStock: "" } }
          : n,
      ),
    };
    expect(compileGraph(blankStock).ok).toBe(false);

    // Null initialStock -> valid, omits inventory row
    const nullStock: BuilderDocument = {
      ...doc,
      nodes: doc.nodes.map((n) =>
        n.kind === "component"
          ? { ...n, fields: { ...n.fields, initialStock: null } }
          : n,
      ),
    };
    const nullCompiled = compileGraph(nullStock);
    expect(nullCompiled.ok).toBe(true);
    if (nullCompiled.ok) {
      expect(nullCompiled.dataset.inventory).toHaveLength(0);
    }

    // Invalid calendar date
    const badDate: BuilderDocument = {
      ...doc,
      nodes: doc.nodes.map((n) =>
        n.kind === "receipt"
          ? { ...n, fields: { ...n.fields, availableDate: "2026-02-30" } }
          : n,
      ),
    };
    expect(compileGraph(badDate).ok).toBe(false);

    // Date before asOf
    const earlyDate: BuilderDocument = {
      ...doc,
      nodes: doc.nodes.map((n) =>
        n.kind === "order"
          ? { ...n, fields: { ...n.fields, requiredDate: "2026-11-12" } }
          : n,
      ),
    };
    expect(compileGraph(earlyDate).ok).toBe(false);

    // Extra disconnected incomplete order -> whole graph blocked
    const strayOrder = createNode("order");
    const withStray: BuilderDocument = {
      ...doc,
      nodes: [...doc.nodes, strayOrder],
    };
    expect(compileGraph(withStray).ok).toBe(false);
  });

  it("rejects per-kind ID collisions while allowing same ID across different kinds", () => {
    const doc = makeValidChain();
    const dupComp = createNode("component");
    const existingComp = doc.nodes.find((n) => n.kind === "component")!;
    dupComp.id = existingComp.id;
    dupComp.fields.name = "Dup";
    dupComp.fields.unit = "pcs";
    dupComp.fields.initialStock = "1";

    const collision: BuilderDocument = {
      ...doc,
      nodes: [...doc.nodes, dupComp],
    };
    const res = compileGraph(collision);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.issues.some((i) => i.field === "id")).toBe(true);
    }
  });

  it("computes networkKey from material inputs only and excludes display metadata and layout", () => {
    const base = createCoreExample();
    const c1 = compileGraph(base);
    expect(c1.ok).toBe(true);
    if (!c1.ok) return;

    // Non-material edits: positions, viewport, names, region, leadTimeDays, sku, unit, customer
    const cosmetic: BuilderDocument = {
      ...base,
      name: "Renamed network",
      viewport: { x: 100, y: 200, zoom: 1.5 },
      nodes: base.nodes.map((n): typeof n => {
        const moved = { ...n, position: { x: n.position.x + 50, y: 99 } };
        if (moved.kind === "supplier") {
          return {
            ...moved,
            fields: {
              ...moved.fields,
              name: "Other Name",
              region: "US",
              leadTimeDays: "14",
            },
          };
        }
        if (moved.kind === "component") {
          return {
            ...moved,
            fields: { ...moved.fields, name: "Motor v2", unit: "ea" },
          };
        }
        if (moved.kind === "product") {
          return {
            ...moved,
            fields: { ...moved.fields, name: "Unit v2", sku: "SKU-999" },
          };
        }
        if (moved.kind === "order") {
          return {
            ...moved,
            fields: { ...moved.fields, customer: "Customer Z" },
          };
        }
        return moved;
      }),
    };
    const c2 = compileGraph(cosmetic);
    expect(c2.ok).toBe(true);
    if (!c2.ok) return;
    expect(c2.networkKey).toBe(c1.networkKey);

    // Material edit: order value or stock changes networkKey
    const material: BuilderDocument = {
      ...base,
      nodes: base.nodes.map((n) =>
        n.kind === "component"
          ? { ...n, fields: { ...n.fields, initialStock: "7" } }
          : n,
      ),
    };
    const c3 = compileGraph(material);
    expect(c3.ok).toBe(true);
    if (!c3.ok) return;
    expect(c3.networkKey).not.toBe(c1.networkKey);
  });

  it("reports canSimulate=false when network is valid but has no orders", () => {
    const doc = makeValidChain();
    const ord = doc.nodes.find((n) => n.kind === "order")!;
    const noOrders = deleteNode(doc, nodeKey(ord));
    const compiled = compileGraph(noOrders);
    expect(compiled.ok).toBe(true);
    if (compiled.ok) {
      expect(compiled.canSimulate).toBe(false);
    }
  });
});
