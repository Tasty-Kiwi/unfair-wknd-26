import { ArrowRight, Check } from "lucide-react";
import type { Dataset, Scenario, SimulationResult } from "@/lib/types";
import { causeReceipt } from "@/lib/receipts";

const money = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
const day = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
const dayShift = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
const signed = (n: number) => `${n > 0 ? "+" : "−"}${Math.abs(n)}`;

/** What the scenario changes relative to the plan, in plain words. */
function scenarioChanges(data: Dataset, scenario: Scenario): string[] {
  const out: string[] = [];
  for (const o of scenario.deliveryOverrides) {
    const base = data.deliveries.find((d) => d.id === o.deliveryId);
    if (!base) continue;
    const shift = dayShift(base.availableDate, o.availableDate);
    if (shift > 0)
      out.push(
        `${o.deliveryId} still late: lands ${day(o.availableDate)} (${signed(shift)} days)`,
      );
    else if (shift < 0)
      out.push(
        `${o.deliveryId} lands early: ${day(o.availableDate)} (${signed(shift)} days)`,
      );
    if (o.quantity !== base.quantity)
      out.push(
        `${o.deliveryId} quantity ${o.quantity} instead of ${base.quantity}`,
      );
  }
  for (const a of scenario.alternatives) {
    const alt = data.alternatives.find((x) => x.id === a.alternativeId);
    const supplier = data.suppliers.find((s) => s.id === alt?.supplierId);
    out.push(
      `${supplier?.name ?? a.alternativeId} supplies ${a.quantity} on ${day(a.availableDate)} (approved alternative)`,
    );
  }
  return out;
}

/**
 * The first thing on the simulator: either "every order is covered" with what
 * the scenario changed, or the causal chain from supply change to the first
 * affected order, with exposure kept distinct from loss.
 */
export function OutcomeBanner({
  data,
  result,
  scenario,
  cause,
}: {
  data: Dataset;
  result: SimulationResult;
  scenario: Scenario;
  cause: string | null;
}) {
  const s = result.summary;
  const changes = scenarioChanges(data, scenario);
  if (!s.atRiskOrders)
    return (
      <section
        className="outcome-banner is-covered"
        aria-label="Simulation summary"
        aria-live="polite"
      >
        <div className="outcome-main">
          <h1>
            <Check aria-hidden="true" size={22} />
            Every order has its required materials
          </h1>
          <p>
            All material requirements covered by the required dates for{" "}
            {s.totalOrders} orders across {data.products.length} products.
          </p>
        </div>
        {changes.length > 0 && (
          <div className="outcome-changes">
            <span>What changed in this scenario</span>
            <ul>
              {changes.map((c) => (
                <li
                  key={c}
                  className={c.includes("still late") ? "is-late" : ""}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );

  const order = result.orders.find((o) => o.status === "at-risk")!;
  const line = order.lines.find((l) => l.shortage > 0)!;
  const component = data.components.find((c) => c.id === line.componentId);
  const customer = data.orders.find((o) => o.id === order.orderId)?.customer;
  // Blame the receipt that was moved, not whichever late receipt is listed first.
  const late = causeReceipt(data, line.lateDeliveries);
  const planned = late
    ? data.deliveries.find((d) => d.id === late.id)
    : undefined;
  const shift =
    late && planned ? dayShift(planned.availableDate, late.availableDate) : 0;
  const supplier = late
    ? data.suppliers.find((x) => x.id === late.supplierId)?.name
    : undefined;
  const unitWord = (component?.name ?? line.componentId).toLowerCase();

  return (
    <section
      className="outcome-banner is-risk"
      aria-label="Simulation summary"
      aria-live="polite"
    >
      <div className="outcome-main">
        <h1>
          {s.atRiskOrders} order{s.atRiskOrders === 1 ? "" : "s"} at risk due to
          material shortage
        </h1>
        <ol className="cause-chain">
          <li>
            <span className="cause-chain__k">
              {late && shift > 0 ? "Supplier delay" : "Supply change"}
            </span>
            <strong>
              {late && shift > 0
                ? `${late.id} ${signed(shift)} days`
                : late
                  ? `${late.id} lands ${day(late.availableDate)}`
                  : `${component?.name ?? line.componentId} supply`}
            </strong>
            <span className="cause-chain__sub">
              {late && planned
                ? `${supplier ? `${supplier} · ` : ""}${day(planned.availableDate)} → ${day(late.availableDate)}`
                : "No receipt arrives in time"}
            </span>
          </li>
          <li className="cause-chain__arrow" aria-hidden="true">
            <ArrowRight size={18} />
          </li>
          <li>
            <span className="cause-chain__k">Material gap</span>
            <strong>
              {line.shortage} {unitWord}
              {line.shortage === 1 || unitWord.endsWith("s") ? "" : "s"} short
            </strong>
            <span className="cause-chain__sub">
              needed by {day(order.requiredDate)}
            </span>
          </li>
          <li className="cause-chain__arrow" aria-hidden="true">
            <ArrowRight size={18} />
          </li>
          <li className="is-impact">
            <span className="cause-chain__k">Customer impact</span>
            <strong>{order.orderId} at risk</strong>
            <span className="cause-chain__sub">
              {customer ? `${customer} · ` : ""}
              {s.atRiskOrders} of {s.totalOrders} orders
            </span>
          </li>
        </ol>
        <p className="sr-only">
          {money(s.atRiskValue)} in order value at material risk.{" "}
          {s.missingUnits} component units remain uncovered. {cause ?? ""}
        </p>
      </div>
      <div className="outcome-exposure">
        <span>Order value at material risk</span>
        <strong>{money(s.atRiskValue)}</strong>
        <span>
          {s.missingUnits} component unit{s.missingUnits === 1 ? "" : "s"}{" "}
          missing · exposure, not a measured loss
        </span>
      </div>
    </section>
  );
}
