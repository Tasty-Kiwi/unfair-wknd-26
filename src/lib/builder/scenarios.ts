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
  };
}
