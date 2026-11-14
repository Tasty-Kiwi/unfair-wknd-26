import { useEffect, useRef, useState } from "react";
import type { Dataset, Scenario, SimulationResult } from "@/lib/types";
import {
  addDays,
  axisTicks,
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
  preferNames = false,
}: {
  data: Dataset;
  result: SimulationResult;
  scenario: Scenario;
  componentId: string;
  onMoveReceipt?: (deliveryId: string, date: string) => void;
  preferNames?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  // Track width in px, so label placement can check what actually fits.
  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    const el = track.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) =>
      setTrackWidth(entry.contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [componentId]);
  const component = data.components.find((c) => c.id === componentId);
  if (!component) return null;

  // Dates carry a year once the axis leaves the inventory date's year.
  const when = (iso: string) =>
    iso.slice(0, 4) === data.asOf.slice(0, 4)
      ? short(iso)
      : `${short(iso)} ${iso.slice(0, 4)}`;

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
        label: `planned ${when(baseline.availableDate)}`,
        kind: "planned",
      });
    marks.push({
      key: d.id,
      date: d.availableDate,
      label: preferNames
        ? `${d.quantity} units · ${data.suppliers.find((s) => s.id === d.supplierId)?.name ?? d.id}`
        : `${d.id} · ${d.quantity}`,
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
      label: preferNames
        ? `${use.quantity} units · ${data.suppliers.find((s) => s.id === alt.supplierId)?.name ?? use.alternativeId}`
        : `${use.alternativeId} · ${use.quantity}`,
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
        customer:
          data.orders.find((x) => x.id === order.orderId)?.customer ??
          order.orderId,
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
  const at = (iso: string) => days(start, iso) / span;
  const edge = (iso: string) => at(iso) > 0.62;
  // 12px semibold Plex runs about 7px a character, plus the 7px offset.
  const fits = (px: number, text: string) => px >= text.length * 7 + 14;
  const place = (from: string, to: string, text: string) => {
    if (trackWidth === 0)
      return !edge(to) ? "after" : at(from) >= 0.5 ? "flip" : "inside";
    if (fits((1 - at(to)) * trackWidth, text)) return "after";
    if (fits(at(from) * trackWidth, text)) return "flip";
    if (fits((at(to) - at(from)) * trackWidth, text)) return "inside";
    return "below";
  };
  const shortText = (n: (typeof needs)[number]) =>
    `Short ${n.shortage} by ${when(n.date)}${n.next ? `, next receipt ${when(n.next)}` : ""}`;
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
  const ticks = axisTicks(start, end);

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
            {ticks.map((t) => (
              <span
                key={t.date}
                className={`tick ${t.label ? "has-label" : ""}`}
                style={{ left: x(t.date) }}
              >
                {t.label && <em>{t.label}</em>}
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
              // A "planned" ghost label next to another receipt would overprint
              // it; keep the tick and move the words to a tooltip instead.
              const crowded =
                m.kind === "planned" &&
                marks.some(
                  (o) =>
                    o !== m &&
                    o.kind !== "planned" &&
                    Math.abs(days(o.date, m.date)) <= 2,
                );
              if (!planned || !onMoveReceipt)
                return (
                  <span
                    key={m.key}
                    className={`mark mark-${m.kind} ${edge(m.date) ? "flip" : ""}`}
                    style={{ left: x(m.date) }}
                    title={crowded ? m.label : undefined}
                  >
                    <em className={crowded ? "sr-only" : undefined}>
                      {m.label}
                      {m.kind !== "planned" && m.kind !== "stock"
                        ? ` · ${when(m.date)}`
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
                  aria-valuetext={`${planned.id} lands ${when(m.date)}, ${
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
                    {preferNames
                      ? `${when(m.date)} · ${m.label}`
                      : `${m.label} · ${when(m.date)}`}
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
            <span
              className="timeline-label"
              title={preferNames ? n.id : undefined}
            >
              {preferNames ? n.customer : n.id} needs {n.required}
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
                {!n.shortage && <em>Covered by {when(n.date)}</em>}
              </span>
              {n.shortage > 0 &&
                place(n.date, n.next ?? end, shortText(n)) !== "below" && (
                  // Never on the hatch itself: after the overrun when there is
                  // room, before it when it starts past halfway, otherwise on
                  // a solid chip at its left end.
                  <span
                    className={`need-label ${place(n.date, n.next ?? end, shortText(n))}`}
                    style={{
                      left:
                        place(n.date, n.next ?? end, shortText(n)) === "after"
                          ? x(n.next ?? end)
                          : x(n.date),
                      ...(place(n.date, n.next ?? end, shortText(n)) ===
                        "inside" && {
                        width: `calc(${x(n.next ?? end)} - ${x(n.date)})`,
                      }),
                    }}
                  >
                    <em>{shortText(n)}</em>
                  </span>
                )}
            </div>
            {n.shortage > 0 &&
              place(n.date, n.next ?? end, shortText(n)) === "below" && (
                <p className="need-note">{shortText(n)}</p>
              )}
          </li>
        ))}
      </ol>
    </div>
  );
}
