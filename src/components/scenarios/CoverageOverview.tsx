import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dataset, SimulationResult } from "@/lib/types";
import { shortDate } from "@/lib/receipts";
import { ImpactPanel } from "./ImpactPanel";

/** Summary is derived from the current result; no separate success state. */
export function CoverageOverview({
  data,
  result,
  recoveredId,
  recovery,
  onTestDelay,
  preferNames = false,
}: {
  data: Dataset;
  result: SimulationResult;
  recoveredId?: string;
  recovery: boolean;
  onTestDelay: () => void;
  preferNames?: boolean;
}) {
  const late = result.deliveries.filter((receipt) => {
    const baseline = data.deliveries.find((item) => item.id === receipt.id);
    return baseline && receipt.availableDate > baseline.availableDate;
  });
  return (
    <div className="coverage-overview">
      <div className="coverage-overview__status">
        <CheckCircle2 size={20} aria-hidden />
        <span>
          {recovery
            ? "Material coverage restored"
            : "Your material plan is covered"}
        </span>
      </div>
      <h2>
        {result.summary.totalOrders} of {result.summary.totalOrders} orders
        covered
      </h2>
      <p>By their required dates, using the current material plan.</p>
      {recovery ? (
        <div className="coverage-overview__recovery">
          <strong>
            {recoveredId
              ? `${recoveredId} regained coverage in this simulation.`
              : "The recovery scenario covers the order book."}
          </strong>
          {late.map((receipt) => (
            <p key={receipt.id}>
              {receipt.id} still arrives {shortDate(receipt.availableDate)},
              later than the original plan.
            </p>
          ))}
          <p>No purchase has been placed or supplier availability confirmed.</p>
        </div>
      ) : (
        <div className="coverage-overview__prompt">
          <h3>What if supply changes?</h3>
          <p>
            {data.deliveries.length
              ? "Test a six-day receipt delay and follow its effect on customer orders."
              : "Add a dated receipt to your plan to test a supplier delay."}
          </p>
          {data.deliveries.length > 0 && (
            <Button onClick={onTestDelay}>
              Test a supplier delay <ArrowRight size={16} aria-hidden />
            </Button>
          )}
          <small>
            Illustrative simulation. Material coverage, not a delivery forecast.
          </small>
        </div>
      )}
      <details className="coverage-overview__evidence">
        <summary>Inspect allocations</summary>
        <p className="coverage-overview__policy">
          Reserved by required date, then order ID. Partial kits keep their
          reservations.
        </p>
        <ImpactPanel
          data={data}
          result={result}
          selectedOrderId={recoveredId}
          preferNames={preferNames}
        />
      </details>
    </div>
  );
}
