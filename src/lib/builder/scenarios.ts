import type { Dataset } from "@/lib/types";
import { parseScenario } from "@/lib/validation";
import type { ScenarioRecord } from "./types";

export function isScenarioCurrent(
  record: ScenarioRecord,
  networkKey: string,
): boolean {
  return (
    record.validatedNetworkKey !== null &&
    record.validatedNetworkKey === networkKey
  );
}

export function revalidateScenario(
  data: Dataset,
  networkKey: string,
  record: ScenarioRecord,
): ScenarioRecord {
  const validated = parseScenario(data, record.scenario);
  return {
    scenario: validated,
    validatedNetworkKey: networkKey,
    receiptSnapshots: validated.deliveryOverrides.map(({ deliveryId }) => {
      const context = receiptReviewContext(data, deliveryId)!;
      return {
        deliveryId,
        supplier: { id: context.supplier.id, name: context.supplier.name },
        component: { id: context.component.id, name: context.component.name },
      };
    }),
  };
}

/** Resolve the current business meaning, including same-ID receipt retargets.
 * Missing receipts remain explicit; review never invents a replacement. */
export function receiptReviewContext(data: Dataset, deliveryId: string) {
  const receipt = data.deliveries.find((item) => item.id === deliveryId);
  if (!receipt) return null;
  return {
    receipt,
    supplier: data.suppliers.find((item) => item.id === receipt.supplierId)!,
    component: data.components.find((item) => item.id === receipt.componentId)!,
  };
}
