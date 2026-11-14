import { ArrowRight } from "lucide-react";
import { compareRecoveries } from "@/lib/recovery";
import type { Dataset, Scenario, SimulationResult } from "@/lib/types";
import { Button } from "@/components/ui/button";

const day = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

/** Receipts that still land after their planned date in a result. */
function stillLate(data: Dataset, result: SimulationResult) {
  return result.deliveries.filter(
    (d) =>
      d.availableDate >
      (data.deliveries.find((p) => p.id === d.id)?.availableDate ??
        d.availableDate),
  );
}

/**
 * Recovery options for the current scenario, each simulated independently.
 * The before → after figures make the outcome comparable at a glance, and the
 * "still late" note keeps material coverage distinct from supplier timing.
 */
export function RecoveryComparison({
  data,
  scenario,
  current,
  onApply,
}: {
  data: Dataset;
  scenario: Scenario;
  current: SimulationResult;
  onApply: (scenario: Scenario) => void;
}) {
  const options = compareRecoveries(data, scenario);
  const before = current.summary.missingUnits;
  return (
    <section className="recovery-comparison" aria-label="Recovery options">
      <header className="rail-heading">
        <h2>Ways to recover</h2>
        <span>Ranked by units recovered</span>
      </header>
      {options.length ? (
        <div className="recovery-grid">
          {options.map((option, index) => {
            const late = stillLate(data, option.result);
            const after = option.result.summary.missingUnits;
            return (
              <article
                key={option.id}
                className={`recovery-option ${index === 0 ? "is-first" : ""}`}
              >
                <div className="recovery-option__head">
                  <h3>{option.title}</h3>
                  <Button
                    variant={index === 0 ? "default" : "outline"}
                    size="sm"
                    onClick={() => onApply(option.scenario)}
                  >
                    Apply recovery <ArrowRight size={14} />
                  </Button>
                </div>
                <p>{option.assumption}</p>
                <div className="recovery-outcome">
                  <span className="delta is-before">{before} short</span>
                  <ArrowRight size={14} aria-label="becomes" />
                  <span className={`delta ${after ? "is-before" : "is-after"}`}>
                    {after} short
                  </span>
                  <span className="recovery-outcome__note">
                    {option.unitsRecovered} net units recovered ·{" "}
                    {option.result.summary.atRiskOrders} order
                    {option.result.summary.atRiskOrders === 1 ? "" : "s"} still
                    at risk
                    {late.length
                      ? ` · ${late.map((d) => `${d.id} still late (${day(d.availableDate)})`).join(", ")}`
                      : ""}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="recovery-caption">
          No catalog alternative or delayed receipt can address this shortage.
          Review the material evidence and obtain a confirmed supply option.
        </p>
      )}
      <p className="recovery-caption">
        Each option changes your current scenario independently. Applying it
        does not place a purchase or contact a supplier; supply must be
        confirmed, and costs and factory capacity are not modeled.
      </p>
    </section>
  );
}
