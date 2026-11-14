import type { Dataset } from "@/lib/types";
import { parseScenario } from "@/lib/validation";
import type { AlternativeRelationshipSnapshot, ScenarioRecord } from "./types";

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
  const alternativeSnapshots: AlternativeRelationshipSnapshot[] =
    validated.alternatives.map(({ alternativeId }) => {
      const context = alternativeReviewContext(data, alternativeId)!;
      return {
        alternativeId,
        name: context.alternative.name,
        supplier: { id: context.supplier.id, name: context.supplier.name },
        component: { id: context.component.id, name: context.component.name },
      };
    });
  return {
    scenario: validated,
    validatedNetworkKey: networkKey,
    // Only scenarios that use the catalog carry alternative snapshots, so
    // records without alternatives keep their original shape.
    ...(alternativeSnapshots.length > 0 ? { alternativeSnapshots } : {}),
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

/** Resolve the current catalog entry and its supplier/component names. A
 * catalog entry that no longer exists stays explicit (null). */
export function alternativeReviewContext(data: Dataset, alternativeId: string) {
  const alternative = data.alternatives.find(
    (item) => item.id === alternativeId,
  );
  if (!alternative) return null;
  return {
    alternative,
    supplier: data.suppliers.find(
      (item) => item.id === alternative.supplierId,
    )!,
    component: data.components.find(
      (item) => item.id === alternative.componentId,
    )!,
  };
}
