import { ArrowRight, GitCompareArrows } from "lucide-react";
import { compareRecoveries } from "@/lib/recovery";
import type { Dataset, Scenario } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function RecoveryComparison({
  data,
  scenario,
  onApply,
}: {
  data: Dataset;
  scenario: Scenario;
  onApply: (scenario: Scenario) => void;
}) {
  const options = compareRecoveries(data, scenario);
  return (
    <section className="recovery-comparison" aria-label="Recovery options">
      <div className="section-heading">
        <div>
          <span className="eyebrow">DECISION SUPPORT</span>
          <h2>
            <GitCompareArrows size={18} /> Compare recovery actions
          </h2>
        </div>
      </div>
      <p className="recovery-caption">
        Each option changes your current scenario independently. Sorted by net
        units recovered. Supply must be confirmed; costs and factory capacity
        are not modeled.
      </p>
      {options.length ? (
        <div className="recovery-grid">
          {options.map((option) => (
            <article key={option.id} className="recovery-option">
              <h3>{option.title}</h3>
              <div className="recovery-numbers">
                <div>
                  <strong>{option.unitsRecovered}</strong>
                  <span>net units recovered</span>
                </div>
                <div>
                  <strong>{option.result.summary.atRiskOrders}</strong>
                  <span>orders still at risk</span>
                </div>
                <div>
                  <strong>{option.result.summary.missingUnits}</strong>
                  <span>units still missing</span>
                </div>
              </div>
              <p>{option.assumption}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApply(option.scenario)}
              >
                Apply what-if <ArrowRight size={14} />
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <p className="recovery-caption">
          No catalog alternative or delayed receipt can address this shortage.
          Review the material evidence and obtain a confirmed supply option.
        </p>
      )}
    </section>
  );
}
