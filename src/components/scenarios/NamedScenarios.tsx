import { Button } from "@/components/ui/button";
import type { ScenarioRecord } from "@/lib/builder/types";

type Props = {
  records: ScenarioRecord[];
  selectedId: string | null;
  name: string;
  dirty: boolean;
  networkKey: string | null;
  onName: (name: string) => void;
  onNew: () => void;
  onSave: () => void;
  onSelect: (id: string | null) => void;
  onCompare: () => void;
};

export function NamedScenarios(props: Props) {
  const {
    records,
    selectedId,
    name,
    dirty,
    networkKey,
    onName,
    onNew,
    onSave,
    onSelect,
    onCompare,
  } = props;
  const unsavedNew =
    selectedId !== null &&
    !records.some((record) => record.scenario.id === selectedId);
  return (
    <section aria-label="Named scenarios" className="named-scenarios">
      <div className="scenario-field">
        <label htmlFor="builder-scenario-select">Select scenario</label>
        <select
          id="builder-scenario-select"
          className="scenario-control"
          value={selectedId === null ? "baseline" : `scenario:${selectedId}`}
          onChange={(event) =>
            onSelect(
              event.target.value === "baseline"
                ? null
                : event.target.value.slice("scenario:".length),
            )
          }
        >
          <option value="baseline">Baseline</option>
          {records.map((record) => (
            <option
              key={record.scenario.id}
              value={`scenario:${record.scenario.id}`}
            >
              {record.scenario.name}
              {record.validatedNetworkKey !== networkKey
                ? " — requires review"
                : ""}
            </option>
          ))}
          {unsavedNew && (
            <option value={`scenario:${selectedId}`}>
              {name || "Unnamed scenario"} (not saved)
            </option>
          )}
        </select>
      </div>
      <div className="scenario-field">
        <label htmlFor="builder-scenario-name">Scenario name</label>
        <input
          id="builder-scenario-name"
          className="scenario-control"
          value={name}
          disabled={selectedId === null}
          placeholder="Create a scenario first"
          onChange={(event) => onName(event.target.value)}
        />
      </div>
      <div className="named-scenarios__actions">
        <Button variant="outline" onClick={onNew}>
          New scenario
        </Button>
        <Button
          variant="outline"
          onClick={onSave}
          disabled={selectedId === null || !name.trim()}
        >
          Save scenario
        </Button>
        <Button variant="outline" onClick={onCompare}>
          Compare with baseline
        </Button>
        {dirty && (
          <span className="named-scenarios__dirty">
            Unsaved scenario changes
          </span>
        )}
      </div>
    </section>
  );
}
