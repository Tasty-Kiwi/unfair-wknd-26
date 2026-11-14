import { useId } from "react";
import type { Dataset, OrderResult, SimulationResult } from "@/lib/types";
import { nextReceipt } from "@/lib/receipts";

const day = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

/** Above this many units the tiles stop being countable; use a bar instead. */
const MAX_TILES = 30;

/**
 * Explains one shortage as arithmetic and as countable units.
 *
 * The allocation policy serves orders by required date then order ID, so every
 * unit available by this order's date either went to an earlier order or to
 * this one. The tiles show exactly that split, plus the missing units. All
 * figures come from the simulation result; nothing is recalculated here.
 */
export function ShortageExplanation({
  data,
  result,
  order,
  onInspect,
}: {
  data: Dataset;
  result: SimulationResult;
  order: OrderResult;
  onInspect: () => void;
}) {
  const titleId = useId();
  const shortLines = order.lines.filter((l) => l.shortage > 0);
  const line = shortLines[0];
  if (!line) return null;
  const component = data.components.find((c) => c.id === line.componentId);
  const customer = data.orders.find((o) => o.id === order.orderId)?.customer;
  const unit = component?.unit ?? "units";
  const name = component?.name ?? line.componentId;
  const index = result.orders.findIndex((o) => o.orderId === order.orderId);
  const earlier = result.orders
    .slice(0, Math.max(index, 0))
    .map((o) => ({
      id: o.orderId,
      qty:
        o.lines.find((l) => l.componentId === line.componentId)?.allocated ?? 0,
    }))
    .filter((o) => o.qty > 0);
  const reserved = earlier.reduce((n, o) => n + o.qty, 0);
  const available = reserved + line.allocated;
  // The receipt that lands next, by date: lateDeliveries follow dataset order.
  const late = nextReceipt(line.lateDeliveries);
  const supplier = late
    ? data.suppliers.find((s) => s.id === late.supplierId)?.name
    : undefined;
  const total = available + line.shortage;
  const showTiles = total <= MAX_TILES;
  const others = shortLines.length - 1;

  return (
    <section className="shortage" aria-labelledby={titleId}>
      <header className="rail-heading">
        <h2 id={titleId}>Why {order.orderId} is short</h2>
        <span>
          {customer ? `${customer} · ` : ""}
          {line.required} {unit} by {day(order.requiredDate)}
        </span>
      </header>

      {showTiles ? (
        <div
          className="unit-tiles"
          role="img"
          aria-label={`${available} ${unit} available by ${day(order.requiredDate)}: ${reserved} reserved by earlier orders, ${line.allocated} for ${order.orderId}, ${line.shortage} missing.`}
        >
          {earlier.map((o) => (
            <div className="unit-group" key={o.id}>
              <div className="unit-row">
                {Array.from({ length: o.qty }, (_, i) => (
                  <i className="unit" key={i} />
                ))}
              </div>
              <span>
                {o.id} · {o.qty}
              </span>
            </div>
          ))}
          <div className="unit-group is-focus">
            <div className="unit-row">
              {Array.from({ length: line.allocated }, (_, i) => (
                <i className="unit is-mine" key={`a${i}`} />
              ))}
              {Array.from({ length: line.shortage }, (_, i) => (
                <i className="unit is-missing" key={`m${i}`}>
                  ?
                </i>
              ))}
            </div>
            <span>
              {order.orderId} · {line.allocated} of {line.required},{" "}
              {line.shortage} missing
            </span>
          </div>
        </div>
      ) : (
        <div className="unit-bar" aria-hidden="true">
          <i style={{ flexGrow: reserved }} />
          <i className="is-mine" style={{ flexGrow: line.allocated }} />
          <i className="is-missing" style={{ flexGrow: line.shortage }} />
        </div>
      )}

      <dl className="shortage__sum">
        <div>
          <dt>
            {name} available by {day(order.requiredDate)}
          </dt>
          <dd>{available}</dd>
        </div>
        <div>
          <dt>
            Reserved by earlier orders
            {earlier.length ? ` (${earlier.map((o) => o.id).join(", ")})` : ""}
          </dt>
          <dd>− {reserved}</dd>
        </div>
        <div className="is-total">
          <dt>Left for {order.orderId}</dt>
          <dd>
            {line.allocated} of {line.required} needed
          </dd>
        </div>
        <div className="is-total is-short">
          <dt>Missing on {day(order.requiredDate)}</dt>
          <dd>{line.shortage}</dd>
        </div>
      </dl>

      {late ? (
        <p className="shortage__late">
          Next receipt {late.id}
          {supplier ? ` from ${supplier}` : ""} lands {day(late.availableDate)},
          after {order.orderId} needs it.
        </p>
      ) : (
        <p className="shortage__late">
          No later receipt for {name} is planned.
        </p>
      )}
      <button type="button" className="text-action" onClick={onInspect}>
        {others > 0
          ? `Full allocation evidence · ${others} more component${others === 1 ? "" : "s"} short`
          : `Full allocation evidence for ${order.orderId}`}
      </button>
    </section>
  );
}
