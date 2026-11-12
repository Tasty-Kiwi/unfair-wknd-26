import { simulate } from "./simulation";
import type { Dataset, Scenario, SimulationResult } from "./types";

export interface RecoveryOption {
  id: string;
  title: string;
  assumption: string;
  scenario: Scenario;
  result: SimulationResult;
  unitsRecovered: number;
}

/** Evaluate independent what-ifs against the current inputs; never apply one implicitly. */
export function compareRecoveries(
  data: Dataset,
  scenario: Scenario,
): RecoveryOption[] {
  const current = simulate(data, scenario);
  if (!current.summary.atRiskOrders) return [];
  const missing = new Set(
    current.orders.flatMap((order) =>
      order.lines
        .filter((line) => line.shortage > 0)
        .map((line) => line.componentId),
    ),
  );
  const options: Omit<RecoveryOption, "result" | "unitsRecovered">[] = [];
  for (const override of scenario.deliveryOverrides) {
    const baseline = data.deliveries.find(
      (delivery) => delivery.id === override.deliveryId,
    )!;
    if (
      !missing.has(baseline.componentId) ||
      override.availableDate <= baseline.availableDate
    )
      continue;
    options.push({
      id: `restore-${baseline.id}`,
      title: `Restore ${baseline.id} timing`,
      assumption: `Supplier must confirm availability on ${baseline.availableDate}. Quantity stays at ${override.quantity}. No extra units are purchased.`,
      scenario: {
        ...structuredClone(scenario),
        id: "custom",
        name: `Restore ${baseline.id} timing`,
        deliveryOverrides: scenario.deliveryOverrides.map((item) =>
          item.deliveryId === baseline.id
            ? { ...item, availableDate: baseline.availableDate }
            : { ...item },
        ),
      },
    });
  }
  for (const alternative of data.alternatives) {
    const used = scenario.alternatives.find(
      (item) => item.alternativeId === alternative.id,
    );
    if (
      !alternative.approved ||
      !missing.has(alternative.componentId) ||
      (used &&
        used.quantity >= alternative.quantity &&
        used.availableDate <= alternative.availableDate)
    )
      continue;
    const supplier = data.suppliers.find(
      (item) => item.id === alternative.supplierId,
    )!;
    options.push({
      id: `alternative-${alternative.id}`,
      title: `Use ${supplier.name}`,
      assumption: `Assumes ${alternative.quantity} approved units available on ${alternative.availableDate}. Limited to approved products. Adds a purchase; price and freight costs are unknown.`,
      scenario: {
        ...structuredClone(scenario),
        id: "custom",
        name: `${supplier.name} recovery`,
        alternatives: [
          ...scenario.alternatives.filter(
            (item) => item.alternativeId !== alternative.id,
          ),
          {
            alternativeId: alternative.id,
            quantity: alternative.quantity,
            availableDate: alternative.availableDate,
          },
        ],
      },
    });
  }
  return options
    .map((option) => {
      const result = simulate(data, option.scenario);
      return {
        ...option,
        result,
        unitsRecovered:
          current.summary.missingUnits - result.summary.missingUnits,
      };
    })
    .sort(
      (a, b) =>
        b.unitsRecovered - a.unitsRecovered ||
        a.result.summary.atRiskOrders - b.result.summary.atRiskOrders ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
}
