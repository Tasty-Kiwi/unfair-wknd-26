import { describe, expect, it } from "vitest";
import {
  demoData,
  DISRUPTION_SCENARIO,
  NORMAL_SCENARIO,
  RECOVERY_SCENARIO,
} from "../data/demo";
import { simulate } from "../lib/simulation";
import type { Dataset, Scenario } from "../lib/types";

const emptyScenario: Scenario = {
  id: "test",
  name: "test",
  deliveryOverrides: [],
  alternatives: [],
};

describe("simulate", () => {
  it("covers the normal demo motor orders with eight units on hand and the receipt", () => {
    const result = simulate(demoData, NORMAL_SCENARIO);
    expect(
      result.orders.find((order) => order.orderId === "ORD-101")?.status,
    ).toBe("covered");
    expect(
      result.orders.find((order) => order.orderId === "ORD-102")?.status,
    ).toBe("covered");
    const line = result.orders
      .find((order) => order.orderId === "ORD-102")!
      .lines.find((item) => item.componentId === "MTR-01")!;
    expect(
      line.allocations.reduce(
        (sum, allocation) => sum + allocation.quantity,
        0,
      ),
    ).toBe(4);
    expect(line.allocations[0].sourceType).toBe("inventory");
  });

  it("flags the delayed motor receipt and its late delivery", () => {
    const result = simulate(demoData, DISRUPTION_SCENARIO);
    const second = result.orders.find((order) => order.orderId === "ORD-102")!;
    expect(second.status).toBe("at-risk");
    const motor = second.lines.find((line) => line.componentId === "MTR-01")!;
    expect(motor.shortage).toBe(2);
    expect(motor.lateDeliveries.map((delivery) => delivery.id)).toContain(
      "PO-101",
    );
    expect(result.summary.atRiskOrders).toBeGreaterThan(0);
  });

  it("uses approved alternatives only for their approved product and covers recovery", () => {
    const result = simulate(demoData, RECOVERY_SCENARIO);
    expect(
      result.orders.find((order) => order.orderId === "ORD-102")?.status,
    ).toBe("covered");
    const motor = result.orders
      .find((order) => order.orderId === "ORD-102")!
      .lines.find((line) => line.componentId === "MTR-01")!;
    expect(
      motor.allocations.some((allocation) => allocation.sourceId === "ALT-01"),
    ).toBe(true);
    const other = {
      ...demoData,
      orders: [
        {
          ...demoData.orders[1],
          id: "X",
          productId: "PRD-01",
          requiredDate: "2026-11-22",
          quantity: 4,
        },
      ],
    };
    const scoped = simulate(other, RECOVERY_SCENARIO);
    expect(
      scoped.orders[0].lines
        .find((line) => line.componentId === "MTR-01")
        ?.allocations.some((a) => a.sourceId === "ALT-01"),
    ).toBe(false);
  });

  it("allocates five of six required units and leaves an explicit one-unit shortage", () => {
    const data: Dataset = {
      ...demoData,
      asOf: "2026-11-12",
      inventory: [{ componentId: "MTR-01", quantity: 5 }],
      deliveries: [],
      alternatives: [],
      products: [
        {
          ...demoData.products[0],
          bom: [{ componentId: "MTR-01", quantity: 1 }],
        },
      ],
      orders: [
        {
          ...demoData.orders[0],
          productId: demoData.products[0].id,
          quantity: 6,
        },
      ],
    };
    const result = simulate(data, emptyScenario);
    expect(result.orders[0].lines[0]).toMatchObject({
      required: 6,
      allocated: 5,
      shortage: 1,
    });
    expect(result.orders[0].status).toBe("at-risk");
  });

  it("does not roll back a partial multi-component order reservation", () => {
    const data: Dataset = {
      ...demoData,
      asOf: "2026-11-12",
      inventory: [
        { componentId: "MTR-01", quantity: 5 },
        { componentId: "PCB-01", quantity: 0 },
      ],
      deliveries: [],
      alternatives: [],
      products: [
        {
          ...demoData.products[0],
          bom: [
            { componentId: "MTR-01", quantity: 1 },
            { componentId: "PCB-01", quantity: 1 },
          ],
        },
      ],
      orders: [
        {
          ...demoData.orders[0],
          id: "A",
          productId: "PRD-01",
          quantity: 5,
          requiredDate: "2026-11-20",
        },
        {
          ...demoData.orders[0],
          id: "B",
          productId: "PRD-01",
          quantity: 1,
          requiredDate: "2026-11-21",
        },
      ],
    };
    const result = simulate(data, emptyScenario);
    expect(result.orders[0].status).toBe("at-risk");
    expect(
      result.orders[0].lines.find((line) => line.componentId === "MTR-01"),
    ).toMatchObject({ allocated: 5, shortage: 0 });
    expect(
      result.orders[1].lines.find((line) => line.componentId === "MTR-01"),
    ).toMatchObject({ allocated: 0, shortage: 1 });
  });
});

describe("allocation contract and demo scenarios", () => {
  const motor = (result: ReturnType<typeof simulate>, id = "ORD-102") =>
    result.orders
      .find((o) => o.orderId === id)!
      .lines.find((l) => l.componentId === "MTR-01")!;
  it("matches all three calculated scenario summaries", () => {
    expect(simulate(demoData, NORMAL_SCENARIO).summary).toMatchObject({
      totalOrders: 10,
      atRiskOrders: 0,
      missingUnits: 0,
      affectedComponents: 0,
    });
    expect(simulate(demoData, DISRUPTION_SCENARIO).summary).toMatchObject({
      atRiskOrders: 1,
      missingUnits: 2,
      affectedProducts: 1,
      affectedComponents: 1,
      atRiskValue: 36000,
    });
    expect(simulate(demoData, RECOVERY_SCENARIO).summary).toMatchObject({
      atRiskOrders: 0,
      missingUnits: 0,
      atRiskValue: 0,
    });
  });
  it("conserves stock across orders; the same eight motors cannot be reserved twice", () => {
    const result = simulate(demoData, DISRUPTION_SCENARIO);
    expect(motor(result, "ORD-101").allocations).toEqual([
      {
        sourceId: "inventory:MTR-01",
        sourceType: "inventory",
        quantity: 6,
        availableDate: demoData.asOf,
      },
    ]);
    expect(motor(result).allocated).toBe(2);
    const stockUsed = result.orders
      .flatMap((o) => o.lines)
      .flatMap((l) => l.allocations)
      .filter((a) => a.sourceId === "inventory:MTR-01")
      .reduce((sum, a) => sum + a.quantity, 0);
    expect(stockUsed).toBe(8);
  });
  it("restoring timing resolves the shortage, including on the required date", () => {
    const onDeadline = {
      ...DISRUPTION_SCENARIO,
      deliveryOverrides: [
        { deliveryId: "PO-101", availableDate: "2026-11-22", quantity: 5 },
      ],
    };
    expect(motor(simulate(demoData, onDeadline)).shortage).toBe(0);
    expect(motor(simulate(demoData, DISRUPTION_SCENARIO)).shortage).toBe(2);
    expect(
      motor(
        simulate(demoData, { ...DISRUPTION_SCENARIO, deliveryOverrides: [] }),
      ).shortage,
    ).toBe(0);
  });
  it("a one-motor alternative leaves a one-motor shortage; late alternatives cannot help", () => {
    const partial = {
      ...RECOVERY_SCENARIO,
      alternatives: [{ ...RECOVERY_SCENARIO.alternatives[0], quantity: 1 }],
    };
    expect(motor(simulate(demoData, partial))).toMatchObject({
      allocated: 3,
      shortage: 1,
    });
    const late = {
      ...RECOVERY_SCENARIO,
      alternatives: [
        { ...RECOVERY_SCENARIO.alternatives[0], availableDate: "2026-11-23" },
      ],
    };
    expect(motor(simulate(demoData, late)).shortage).toBe(2);
  });
  it("has stable tie-breaking independently of input order and repeated runs", () => {
    const data = structuredClone(demoData);
    data.orders = [data.orders[1], data.orders[0]].map((o) => ({
      ...o,
      requiredDate: "2026-11-22",
    }));
    const a = simulate(data, DISRUPTION_SCENARIO);
    const b = simulate(
      {
        ...data,
        orders: [...data.orders].reverse(),
        deliveries: [...data.deliveries].reverse(),
      },
      DISRUPTION_SCENARIO,
    );
    expect(a.orders).toEqual(b.orders);
    expect(a.orders[0].orderId).toBe("ORD-101");
    expect(JSON.stringify(simulate(data, DISRUPTION_SCENARIO))).toBe(
      JSON.stringify(a),
    );
  });
  it("keeps baseline and scenario data unchanged, even when result records are edited", () => {
    const data = structuredClone(demoData),
      scenario = structuredClone(RECOVERY_SCENARIO);
    const before = JSON.stringify(data),
      plan = JSON.stringify(scenario);
    const baseline = simulate(data, NORMAL_SCENARIO);
    const result = simulate(data, scenario);
    result.deliveries[0].quantity = 999;
    expect(JSON.stringify(data)).toBe(before);
    expect(JSON.stringify(scenario)).toBe(plan);
    expect(simulate(data, NORMAL_SCENARIO)).toEqual(baseline);
  });
  it("allocates a shared alternative only once and consumes dated supply chronologically", () => {
    const data = structuredClone(demoData);
    data.inventory.find((i) => i.componentId === "MTR-01")!.quantity = 0;
    data.orders = [
      { ...data.orders[1], id: "A", quantity: 2 },
      { ...data.orders[1], id: "B", quantity: 2 },
    ];
    const result = simulate(data, RECOVERY_SCENARIO);
    expect(motor(result, "A").allocated).toBe(2);
    expect(motor(result, "B").shortage).toBe(2);
    const normal = simulate(data, {
      ...RECOVERY_SCENARIO,
      deliveryOverrides: [
        { deliveryId: "PO-101", availableDate: "2026-11-19", quantity: 5 },
      ],
    });
    expect(motor(normal, "A").allocations[0].sourceType).toBe("alternative");
  });
  it("a second disruption in controller boards affects independently calculated orders", () => {
    const scenario = {
      ...NORMAL_SCENARIO,
      deliveryOverrides: [
        { deliveryId: "PO-102", quantity: 8, availableDate: "2026-11-25" },
      ],
    };
    const result = simulate(demoData, scenario);
    expect(result.summary.atRiskOrders).toBe(2);
    expect(result.summary.missingUnits).toBe(8);
    expect(result.orders.find((o) => o.orderId === "ORD-103")!.status).toBe(
      "at-risk",
    );
  });
});
