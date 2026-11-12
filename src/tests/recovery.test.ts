import { describe, expect, it } from "vitest";
import { compareRecoveries } from "@/lib/recovery";
import { demoData, DISRUPTION_SCENARIO, NORMAL_SCENARIO } from "@/data/demo";

describe("independent recovery comparison", () => {
  it("calculates two distinct ways to cover the demo shortage, preserving all inputs", () => {
    const before = JSON.stringify({ demoData, DISRUPTION_SCENARIO });
    const options = compareRecoveries(demoData, DISRUPTION_SCENARIO);
    expect(options).toHaveLength(2);
    for (const option of options) {
      expect(option.unitsRecovered).toBe(2);
      expect(option.result.summary.atRiskOrders).toBe(0);
      expect(option.result.summary.missingUnits).toBe(0);
    }
    const alternative = options.find(
      (option) => option.id === "alternative-ALT-01",
    )!;
    expect(alternative.scenario.deliveryOverrides).toEqual(
      DISRUPTION_SCENARIO.deliveryOverrides,
    );
    expect(
      options.find((option) => option.id === "restore-PO-101")!.scenario
        .alternatives,
    ).toEqual([]);
    expect(JSON.stringify({ demoData, DISRUPTION_SCENARIO })).toBe(before);
  });
  it("shows partial recovery and never proposes unapproved supply", () => {
    const data = structuredClone(demoData);
    data.alternatives[0].quantity = 1;
    let options = compareRecoveries(data, DISRUPTION_SCENARIO);
    expect(options[0].unitsRecovered).toBe(2);
    const partial = options.find(
      (option) => option.id === "alternative-ALT-01",
    )!;
    expect(partial.unitsRecovered).toBe(1);
    expect(partial.result.summary.atRiskOrders).toBe(1);
    data.alternatives[0].approved = false;
    options = compareRecoveries(data, DISRUPTION_SCENARIO);
    expect(options).toHaveLength(1);
  });
  it("offers nothing when covered and preserves current quantity when restoring a date", () => {
    expect(compareRecoveries(demoData, NORMAL_SCENARIO)).toEqual([]);
    const scenario = structuredClone(DISRUPTION_SCENARIO);
    scenario.deliveryOverrides[0].quantity = 1;
    const restore = compareRecoveries(demoData, scenario).find(
      (option) => option.id === "restore-PO-101",
    )!;
    expect(restore.result.summary.missingUnits).toBe(1);
    expect(restore.scenario.deliveryOverrides[0].quantity).toBe(1);
  });
});
