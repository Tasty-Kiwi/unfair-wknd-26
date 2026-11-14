import { demoData, NORMAL_SCENARIO, DISRUPTION_SCENARIO, RECOVERY_SCENARIO } from "@/data/demo";
import type { Dataset, Scenario } from "./types";

export function presetsFor(data: Dataset): Scenario[] {
  if (data === demoData)
    return [NORMAL_SCENARIO, DISRUPTION_SCENARIO, RECOVERY_SCENARIO];
  const normal: Scenario = {
    id: "baseline",
    name: "Normal operations",
    deliveryOverrides: [],
    alternatives: [],
  };
  const receipt = data.deliveries[0];
  if (!receipt)
    return [
      normal,
      { ...normal, id: "disruption", name: "Disruption" },
      { ...normal, id: "recovery", name: "Recovery" },
    ];
  const date = new Date(`${receipt.availableDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 6);
  const disruption: Scenario = {
    id: "disruption",
    name: "Critical supplier disruption",
    deliveryOverrides: [
      {
        deliveryId: receipt.id,
        quantity: receipt.quantity,
        availableDate:
          date.getUTCFullYear() > 9999
            ? "9999-12-31"
            : date.toISOString().slice(0, 10),
      },
    ],
    alternatives: [],
  };
  const alt = data.alternatives.find(
    (a) => a.approved && a.componentId === receipt.componentId,
  );
  return [
    normal,
    disruption,
    {
      ...disruption,
      id: "recovery",
      name: "Approved recovery",
      alternatives: alt
        ? [
            {
              alternativeId: alt.id,
              quantity: alt.quantity,
              availableDate: alt.availableDate,
            },
          ]
        : [],
    },
  ];
}
