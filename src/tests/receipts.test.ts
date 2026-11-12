import { describe, expect, it } from "vitest";
import { demoData, DISRUPTION_SCENARIO, NORMAL_SCENARIO } from "@/data/demo";
import { simulate } from "@/lib/simulation";
import type { Dataset } from "@/lib/types";
import {
  addDays,
  axisTicks,
  clampShift,
  MAX_AXIS_LABELS,
  MAX_AXIS_TICKS,
  receiptExposure,
  shiftRange,
  tippingPoints,
  withReceiptDate,
} from "@/lib/receipts";

const po101 = demoData.deliveries.find((d) => d.id === "PO-101")!;

describe("receipt rules", () => {
  it("finds the demo tipping point: +5 days is safe, +6 leaves ORD-102 short", () => {
    expect(tippingPoints(demoData, NORMAL_SCENARIO, po101)).toEqual({
      latestSafe: 5,
      firstShort: 6,
    });
  });

  it("reports the order value that depends on a receipt, independent of edits", () => {
    expect(receiptExposure(demoData, "PO-101")).toBe(36_000);
  });

  it("moves a receipt, keeps an overridden quantity, and drops no-op overrides", () => {
    const moved = withReceiptDate(
      demoData,
      NORMAL_SCENARIO,
      "PO-101",
      "2026-11-23",
    );
    expect(moved.deliveryOverrides).toEqual([
      { deliveryId: "PO-101", availableDate: "2026-11-23", quantity: 5 },
    ]);
    expect(
      withReceiptDate(demoData, moved, "PO-101", "2026-11-17")
        .deliveryOverrides,
    ).toEqual([]);
    const fewer = {
      ...DISRUPTION_SCENARIO,
      deliveryOverrides: [
        { deliveryId: "PO-101", availableDate: "2026-11-23", quantity: 3 },
      ],
    };
    expect(
      withReceiptDate(demoData, fewer, "PO-101", "2026-11-17")
        .deliveryOverrides,
    ).toEqual([
      { deliveryId: "PO-101", availableDate: "2026-11-17", quantity: 3 },
    ]);
  });

  it("never lets a receipt land before the inventory date or past +12 days", () => {
    expect(clampShift(demoData, po101, -30)).toBe(-5);
    expect(clampShift(demoData, po101, 40)).toBe(12);
  });

  it("widens the range to include a typed date outside the drag window", () => {
    expect(shiftRange(demoData, po101)).toEqual({ min: -5, max: 12 });
    expect(shiftRange(demoData, po101, "2026-12-07")).toEqual({
      min: -5,
      max: 20,
    });
    // A later receipt typed far earlier: the floor is still the inventory date.
    const late = { ...po101, availableDate: "2026-11-30" };
    expect(shiftRange(demoData, late, "2026-11-14")).toEqual({
      min: -16,
      max: 12,
    });
    expect(clampShift(demoData, po101, 21, "2026-12-07")).toBe(20);
  });
});

// One unit arrives; two customers need it. Delaying the receipt by two days
// moves the shortage from ORD-B to ORD-A without changing the total missing.
const swap: Dataset = {
  name: "swap",
  asOf: "2026-11-12",
  suppliers: [{ id: "S1", name: "Supplier", region: "EU", leadTimeDays: 5 }],
  components: [{ id: "C1", name: "Part", unit: "pcs", supplierId: "S1" }],
  products: [
    {
      id: "P1",
      name: "Product",
      sku: "P-1",
      bom: [{ componentId: "C1", quantity: 1 }],
    },
  ],
  inventory: [{ componentId: "C1", quantity: 0 }],
  deliveries: [
    {
      id: "R1",
      supplierId: "S1",
      componentId: "C1",
      quantity: 1,
      availableDate: "2026-11-17",
    },
  ],
  orders: [
    {
      id: "ORD-A",
      customer: "A",
      productId: "P1",
      quantity: 1,
      requiredDate: "2026-11-18",
      value: 100,
    },
    {
      id: "ORD-B",
      customer: "B",
      productId: "P1",
      quantity: 1,
      requiredDate: "2026-11-22",
      value: 100,
    },
  ],
  alternatives: [],
};

describe("tipping points look at each order, not just the total", () => {
  it("treats a delay that moves the shortage to another customer as harmful", () => {
    const r1 = swap.deliveries[0];
    const at = (shift: number) =>
      simulate(
        swap,
        withReceiptDate(
          swap,
          NORMAL_SCENARIO,
          "R1",
          addDays(r1.availableDate, shift),
        ),
      );
    // Precondition: the total is unchanged while the affected customer flips.
    expect(at(0).summary.missingUnits).toBe(1);
    expect(at(2).summary.missingUnits).toBe(1);
    expect(at(0).orders.find((o) => o.orderId === "ORD-A")!.status).toBe(
      "covered",
    );
    expect(at(2).orders.find((o) => o.orderId === "ORD-A")!.status).toBe(
      "at-risk",
    );
    expect(tippingPoints(swap, NORMAL_SCENARIO, r1)).toEqual({
      latestSafe: 1,
      firstShort: 2,
    });
  });
});

describe("axisTicks", () => {
  const labels = (start: string, end: string) =>
    axisTicks(start, end)
      .filter((t) => t.label)
      .map((t) => t.label);

  it("keeps daily ticks for the demo's few-week span", () => {
    const ticks = axisTicks("2026-11-12", "2026-11-30");
    expect(ticks).toHaveLength(19);
    expect(labels("2026-11-12", "2026-11-30")).toEqual([
      "12 Nov",
      "15",
      "18",
      "21",
      "24",
      "27",
      "30",
    ]);
  });

  it("stays bounded and in order for spans out to 2099", () => {
    for (const end of [
      "2027-02-01",
      "2027-11-13",
      "2035-01-10",
      "2099-12-31",
    ]) {
      const ticks = axisTicks("2026-11-12", end);
      expect(ticks.length).toBeLessThanOrEqual(MAX_AXIS_TICKS);
      expect(ticks.filter((t) => t.label).length).toBeLessThanOrEqual(
        MAX_AXIS_LABELS,
      );
      expect(ticks[0]).toEqual({ date: "2026-11-12", label: "12 Nov" });
      const dates = ticks.map((t) => t.date);
      expect([...dates].sort()).toEqual(dates);
      expect(new Set(dates).size).toBe(dates.length);
      expect(dates.at(-1)! <= end).toBe(true);
    }
  });

  it("switches to months, then years, for longer spans", () => {
    expect(labels("2026-11-12", "2027-11-13")).toEqual([
      "12 Nov",
      "Feb 2027",
      "Apr",
      "Jun",
      "Aug",
      "Oct",
    ]);
    expect(labels("2026-11-12", "2035-01-10")).toEqual([
      "12 Nov",
      "2028",
      "2030",
      "2032",
      "2034",
    ]);
  });
});
