import { useRef } from "react";
import type { Dataset, Scenario, SimulationResult } from "@/lib/types";
import {
  addDays,
  clampShift,
  dayDiff as days,
  shiftRange,
  shortDate as short,
} from "@/lib/receipts";

type Mark = {
  key: string;
  date: string;
  label: string;
  kind: "stock" | "receipt" | "planned" | "alternative";
  /** Set for planned receipts the user can move. */
  deliveryId?: string;
};

/**
 * A dated ruler for one component: when supply lands versus when each order
 * needs it. Shortfalls are drawn as a hatched overrun from the required date
 * to the next receipt, and also stated in words. Planned receipts are sliders:
 * drag them or use the arrow keys to move the landing date.
 */
export function ReceiptTimeline({
  data,
  result,
  scenario,
  componentId,
  onMoveReceipt,
}: {
  data: Dataset;
  result: SimulationResult;
  scenario: Scenario;
  componentId: string;
  onMoveReceipt?: (deliveryId: string, date: string) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const component = data.components.find((c) => c.id === componentId);
  if (!component) return null;

  const stock = data.inventory
    .filter((i) => i.componentId === componentId)
    .reduce((n, i) => n + i.quantity, 0);
  const marks: Mark[] = [
    {
      key: "stock",
      date: data.asOf,
      label: `${stock} on hand`,
      kind: "stock",
    },
  ];
  for (const d of result.deliveries.filter(
    (d) => d.componentId === componentId,
  )) {
    const isAlt = !data.deliveries.some((b) => b.id === d.id);
    if (isAlt) continue;
    const baseline = data.deliveries.find((b) => b.id === d.id)!;
    if (baseline.availableDate !== d.availableDate)
      marks.push({
        key: `${d.id}-planned`,
        date: baseline.availableDate,
        label: `planned ${short(baseline.availableDate)}`,
        kind: "planned",
      });
    marks.push({
      key: d.id,
      date: d.availableDate,
      label: `${d.id} · ${d.quantity}`,
      kind: "receipt",
      deliveryId: d.id,
    });
  }
  for (const use of scenario.alternatives) {
    const alt = data.alternatives.find((a) => a.id === use.alternativeId);
    if (alt?.componentId !== componentId) continue;
    marks.push({
      key: use.alternativeId,
      date: use.availableDate,
      label: `${use.alternativeId} · ${use.quantity}`,
      kind: "alternative",
    });
  }

  const needs = result.orders
    .map((o) => ({
      order: o,
      line: o.lines.find((l) => l.componentId === componentId),
    }))
    .filter((x) => x.line)
    .map(({ order, line }) => {
      const next = line!.lateDeliveries.map((d) => d.availableDate).sort()[0];
      return {
        id: order.orderId,
        date: order.requiredDate,
        required: line!.required,
        shortage: line!.shortage,
        next,
      };
    });

  const movable = data.deliveries.filter((d) => d.componentId === componentId);
  // Where each receipt lands in this scenario; it widens the range when a
  // typed date falls outside the usual drag window.
  const landsOn = (id: string) =>
    result.deliveries.find((d) => d.id === id)?.availableDate;
  const rangeFor = (d: (typeof movable)[number]) =>
    shiftRange(data, d, landsOn(d.id));
  const all = [
    ...marks.map((m) => m.date),
    ...(onMoveReceipt
      ? movable.map((d) => addDays(d.availableDate, rangeFor(d).max))
      : []),
    ...needs.flatMap((n) => [n.date, n.next ?? n.date]),
  ];
  const start = data.asOf;
  const end = addDays(
    all.reduce((a, b) => (b > a ? b : a), start),
    1,
  );
  const span = Math.max(1, days(start, end));
  const x = (iso: string) =>
    `${(Math.min(span, Math.max(0, days(start, iso))) / span) * 100}%`;
  const edge = (iso: string) => days(start, iso) / span > 0.62;
  const every = span > 16 ? 3 : span > 10 ? 2 : 1;
  const dayAt = (clientX: number) => {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width === 0) return null;
    return addDays(
      start,
      Math.round(((clientX - box.left) / box.width) * span),
    );
  };
  const move = (deliveryId: string, date: string) => {
    const planned = data.deliveries.find((d) => d.id === deliveryId);
    if (!planned || !onMoveReceipt) return;
    const next = addDays(
      planned.availableDate,
      clampShift(
        data,
        planned,
        days(planned.availableDate, date),
        landsOn(deliveryId),
      ),
    );
    if (next !== landsOn(deliveryId)) onMoveReceipt(deliveryId, next);
  };
  const ticks = Array.from({ length: span + 1 }, (_, i) => addDays(start, i));

  return (
    <div className="timeline" aria-labelledby={`timeline-${componentId}`}>
      <div className="timeline-head">
        <h3 id={`timeline-${componentId}`}>
          {component.name}: supply against need
        </h3>
        <p>
          Inventory date {short(start)}. Each order must have its{" "}
          {component.unit} on hand by its required date.
          {onMoveReceipt && movable.length > 0
            ? " Drag a receipt, or focus it and use the arrow keys, to move it."
            : ""}
        </p>
      </div>
      <ol className="timeline-rows">
        <li className="timeline-row timeline-axis" aria-hidden="true">
          <span className="timeline-label" />
          <div className="timeline-track">
            {ticks.map((t, i) => (
              <span
                key={t}
                className={`tick ${i % every === 0 ? "has-label" : ""}`}
                style={{ left: x(t) }}
              >
                {i % every === 0 && (
                  <em>
                    {i === 0 || t.endsWith("-01")
                      ? short(t)
                      : t.slice(8).replace(/^0/, "")}
                  </em>
                )}
              </span>
            ))}
          </div>
        </li>
        <li className="timeline-row">
          <span className="timeline-label">Supply in</span>
          <div className="timeline-track" ref={track}>
            {marks.map((m) => {
              const planned = m.deliveryId
                ? data.deliveries.find((d) => d.id === m.deliveryId)
                : undefined;
              if (!planned || !onMoveReceipt)
                return (
                  <span
                    key={m.key}
                    className={`mark mark-${m.kind} ${edge(m.date) ? "flip" : ""}`}
                    style={{ left: x(m.date) }}
                  >
                    <em>
                      {m.label}
                      {m.kind !== "planned" && m.kind !== "stock"
                        ? ` · ${short(m.date)}`
                        : ""}
                    </em>
                  </span>
                );
              const shift = days(planned.availableDate, m.date);
              const range = rangeFor(planned);
              const step = (n: number) => move(planned.id, addDays(m.date, n));
              return (
                <span
                  key={m.key}
                  role="slider"
                  tabIndex={0}
                  aria-label={`Move receipt ${planned.id}`}
                  aria-valuemin={range.min}
                  aria-valuemax={range.max}
                  aria-valuenow={shift}
                  aria-valuetext={`${planned.id} lands ${short(m.date)}, ${
                    shift === 0
                      ? "as planned"
                      : `${Math.abs(shift)} day${Math.abs(shift) === 1 ? "" : "s"} ${shift > 0 ? "late" : "early"}`
                  }`}
                  className={`mark mark-receipt is-movable ${edge(m.date) ? "flip" : ""}`}
                  style={{ left: x(m.date) }}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    e.currentTarget.focus();
                  }}
                  onPointerMove={(e) => {
                    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                    const date = dayAt(e.clientX);
                    if (date) move(planned.id, date);
                  }}
                  onKeyDown={(e) => {
                    const keys: Record<string, () => void> = {
                      ArrowRight: () => step(1),
                      ArrowUp: () => step(1),
                      ArrowLeft: () => step(-1),
                      ArrowDown: () => step(-1),
                      PageUp: () => step(7),
                      PageDown: () => step(-7),
                      Home: () =>
                        move(
                          planned.id,
                          addDays(planned.availableDate, range.min),
                        ),
                      End: () =>
                        move(
                          planned.id,
                          addDays(planned.availableDate, range.max),
                        ),
                    };
                    const run = keys[e.key];
                    if (!run) return;
                    e.preventDefault();
                    run();
                  }}
                >
                  <i className="grip" aria-hidden="true" />
                  <em>
                    {m.label} · {short(m.date)}
                  </em>
                </span>
              );
            })}
          </div>
        </li>
        {needs.map((n) => (
          <li
            key={n.id}
            className={`timeline-row ${n.shortage ? "is-short" : ""}`}
          >
            <span className="timeline-label">
              {n.id} needs {n.required}
            </span>
            <div className="timeline-track">
              <span className="need-run" style={{ width: x(n.date) }} />
              {n.shortage > 0 && (
                <span
                  className="overrun"
                  style={{
                    left: x(n.date),
                    width: `calc(${x(n.next ?? end)} - ${x(n.date)})`,
                  }}
                />
              )}
              <span
                className={`need ${edge(n.date) ? "flip" : ""}`}
                style={{ left: x(n.date) }}
              >
                {!n.shortage && <em>Covered by {short(n.date)}</em>}
              </span>
              {n.shortage > 0 && (
                // Anchored past the hatched overrun so it never covers it.
                <span
                  className={`need-label ${edge(n.next ?? end) ? "flip" : ""}`}
                  style={{
                    left: edge(n.next ?? end) ? x(n.date) : x(n.next ?? end),
                  }}
                >
                  <em>
                    Short {n.shortage} by {short(n.date)}
                    {n.next ? `, next receipt ${short(n.next)}` : ""}
                  </em>
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
