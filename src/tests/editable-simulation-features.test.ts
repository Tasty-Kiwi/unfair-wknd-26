import { describe, expect, it } from "vitest";
import { demoData, DISRUPTION_SCENARIO } from "@/data/demo";
import { simulate } from "@/lib/simulation";
import { compareRecoveries } from "@/lib/recovery";
import type { Dataset } from "@/lib/types";
import {
  addDays,
  causeReceipt,
  nextReceipt,
  receiptExposure,
  receiptUnitExposure,
} from "@/lib/receipts";

/**
 * A small arbitrary network: one component with two receipts from two suppliers,
 * one order. Shapes the receipt-selection and exposure helpers must handle without
 * relying on the Northstar demo's ordering.
 */
function network(overrides: Partial<Dataset> = {}): Dataset {
  return {
    name: "Editable probe",
    asOf: "2026-11-01",
    suppliers: [
      { id: "S-1", name: "Alpha", region: "DE", leadTimeDays: 5 },
      { id: "S-2", name: "Beta", region: "PL", leadTimeDays: 5 },
    ],
    components: [{ id: "C-1", name: "Motor", unit: "pcs", supplierId: "S-1" }],
    products: [
      {
        id: "P-1",
        name: "Drive",
        sku: "D-1",
        bom: [{ componentId: "C-1", quantity: 1 }],
      },
    ],
    inventory: [],
    deliveries: [
      {
        id: "R-LATE",
        supplierId: "S-1",
        componentId: "C-1",
        quantity: 5,
        availableDate: "2026-11-20",
      },
      {
        id: "R-EARLY",
        supplierId: "S-2",
        componentId: "C-1",
        quantity: 5,
        availableDate: "2026-11-09",
      },
    ],
    orders: [
      {
        id: "O-1",
        customer: "Acme",
        productId: "P-1",
        quantity: 5,
        requiredDate: "2026-11-10",
        value: 1000,
      },
    ],
    alternatives: [],
    ...overrides,
  };
}

const plan = {
  id: "plan",
  name: "Plan",
  deliveryOverrides: [],
  alternatives: [],
};

describe("receipt selection for arbitrary networks", () => {
  it("names the earliest late receipt as the next one, not the first listed", () => {
    const data = network({
      deliveries: [
        { ...network().deliveries[0], availableDate: "2026-11-20" },
        { ...network().deliveries[1], availableDate: "2026-11-12" },
      ],
    });
    const late = simulate(data, plan).orders[0].lines[0].lateDeliveries;
    expect(late.map((d) => d.id)).toEqual(["R-LATE", "R-EARLY"]);
    expect(nextReceipt(late)?.id).toBe("R-EARLY");
  });

  it("returns no next receipt when nothing lands late", () => {
    expect(nextReceipt([])).toBeUndefined();
  });

  it("attributes a shortage to the receipt that was moved, not a baseline-late one", () => {
    const data = network({
      deliveries: [
        {
          id: "R-LATE",
          supplierId: "S-1",
          componentId: "C-1",
          quantity: 5,
          availableDate: "2026-11-20",
        },
        {
          id: "R-MOVED",
          supplierId: "S-2",
          componentId: "C-1",
          quantity: 5,
          availableDate: "2026-11-08",
        },
      ],
    });
    const scenario = {
      ...plan,
      deliveryOverrides: [
        { deliveryId: "R-MOVED", availableDate: "2026-11-25", quantity: 5 },
      ],
    };
    const late = simulate(data, scenario).orders[0].lines[0].lateDeliveries;
    expect(late.map((d) => d.id)).toEqual(["R-LATE", "R-MOVED"]);
    expect(causeReceipt(data, late)?.id).toBe("R-MOVED");
    // With no move, the cause falls back to the earliest late receipt.
    expect(causeReceipt(data, [late[0]])?.id).toBe("R-LATE");
    expect(causeReceipt(data, [])).toBeUndefined();
  });
});

describe("exposure for zero-value orders", () => {
  it("reports units at risk when order value is zero", () => {
    const data = network({
      orders: [{ ...network().orders[0], value: 0 }],
      deliveries: [
        { ...network().deliveries[0] },
        { ...network().deliveries[1], availableDate: "2026-11-09" },
      ],
    });
    expect(receiptExposure(data, "R-EARLY")).toBe(0);
    expect(receiptUnitExposure(data, "R-EARLY")).toBe(5);
    // A receipt that is not needed adds no units at risk.
    expect(receiptUnitExposure(data, "R-LATE")).toBe(0);
  });
});

describe("date arithmetic at the calendar edges", () => {
  it("clamps instead of producing non-ISO strings past year 9999 or before year 1", () => {
    expect(addDays("9999-12-31", 1)).toBe("9999-12-31");
    expect(addDays("0001-01-01", -1)).toBe("0001-01-01");
    expect(addDays("2026-11-14", 12)).toBe("2026-11-26");
  });
});

describe("recovery offers for arbitrary networks", () => {
  it("restoring a receipt to its planned timing removes the no-op override", () => {
    const restore = compareRecoveries(demoData, DISRUPTION_SCENARIO).find(
      (option) => option.id === "restore-PO-101",
    )!;
    expect(restore.scenario.deliveryOverrides).toEqual([]);
  });

  it("does not offer an approved alternative that no at-risk order can use", () => {
    const data = structuredClone(demoData);
    data.alternatives[0].approvedProductIds = ["PRD-05"];
    const options = compareRecoveries(data, DISRUPTION_SCENARIO);
    expect(options.some((option) => option.id === "alternative-ALT-01")).toBe(
      false,
    );
    expect(options.every((option) => option.unitsRecovered > 0)).toBe(true);
  });

  it("keeps the approved alternative available as a separate option without touching the delay", () => {
    const options = compareRecoveries(demoData, DISRUPTION_SCENARIO);
    const alternative = options.find((o) => o.id === "alternative-ALT-01")!;
    expect(alternative.scenario.deliveryOverrides).toEqual(
      DISRUPTION_SCENARIO.deliveryOverrides,
    );
    expect(alternative.unitsRecovered).toBe(2);
  });

  it("a same-day receipt covers the order and is not reported as late", () => {
    const data = network({
      deliveries: [{ ...network().deliveries[0], availableDate: "2026-11-10" }],
    });
    const order = simulate(data, plan).orders[0];
    expect(order.status).toBe("covered");
    expect(order.lines[0].lateDeliveries).toEqual([]);
    expect(nextReceipt(order.lines[0].lateDeliveries)).toBeUndefined();
  });
});
