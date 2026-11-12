import { describe, expect, it } from "vitest";
import { demoData, DISRUPTION_SCENARIO, NORMAL_SCENARIO } from "@/data/demo";
import {
  clampShift,
  receiptExposure,
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
});
