import { simulate } from "@/lib/simulation";
import type { Dataset, Delivery, Scenario } from "@/lib/types";

/** Shared rules for moving a planned receipt, used by the timeline and the panel. */

export const MAX_SHIFT_DAYS = 12;
export const MIN_SHIFT_DAYS = -5;
const DAY_MS = 86_400_000;

const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
export const dayDiff = (from: string, to: string) =>
  Math.round((toMs(to) - toMs(from)) / DAY_MS);
export const addDays = (iso: string, n: number) =>
  new Date(toMs(iso) + n * DAY_MS).toISOString().slice(0, 10);
export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

/**
 * Shift range in days from the planned date that the date controls offer.
 * The usual window is MIN_SHIFT_DAYS..MAX_SHIFT_DAYS, never before the
 * inventory date. A date typed outside that window (the validator only
 * forbids dates before the inventory date) widens the range to include it, so
 * sliders never report a value outside their own bounds.
 */
export function shiftRange(
  data: Dataset,
  delivery: Delivery,
  currentDate?: string,
) {
  const floor = dayDiff(delivery.availableDate, data.asOf);
  const current =
    currentDate === undefined
      ? undefined
      : dayDiff(delivery.availableDate, currentDate);
  const min = Math.max(MIN_SHIFT_DAYS, floor);
  return {
    min: current === undefined ? min : Math.max(floor, Math.min(min, current)),
    max:
      current === undefined
        ? MAX_SHIFT_DAYS
        : Math.max(MAX_SHIFT_DAYS, current),
  };
}

export function clampShift(
  data: Dataset,
  delivery: Delivery,
  shift: number,
  currentDate?: string,
) {
  const { min, max } = shiftRange(data, delivery, currentDate);
  return Math.min(max, Math.max(min, shift));
}

/**
 * Returns the scenario with one receipt moved to `date`. The current override
 * quantity is kept. Moving back to the plan with the planned quantity removes
 * the override instead of storing a no-op.
 */
export function withReceiptDate(
  data: Dataset,
  scenario: Scenario,
  deliveryId: string,
  date: string,
): Scenario {
  const delivery = data.deliveries.find((d) => d.id === deliveryId);
  if (!delivery) return scenario;
  const existing = scenario.deliveryOverrides.find(
    (o) => o.deliveryId === deliveryId,
  );
  const quantity = existing?.quantity ?? delivery.quantity;
  const rest = scenario.deliveryOverrides.filter(
    (o) => o.deliveryId !== deliveryId,
  );
  const asPlanned =
    date === delivery.availableDate && quantity === delivery.quantity;
  return {
    ...scenario,
    deliveryOverrides: asPlanned
      ? rest
      : [...rest, { deliveryId, availableDate: date, quantity }],
  };
}

const PLAN: Scenario = {
  id: "plan",
  name: "Plan",
  deliveryOverrides: [],
  alternatives: [],
};

/**
 * Order value that depends on a receipt: the extra value at risk on the
 * unmodified plan if this receipt never arrived. Independent of the current
 * scenario, so a list sorted or labelled by it stays put while the user edits.
 */
export function receiptExposure(data: Dataset, deliveryId: string): number {
  const base = simulate(data, PLAN).summary.atRiskValue;
  const without = simulate(
    { ...data, deliveries: data.deliveries.filter((d) => d.id !== deliveryId) },
    PLAN,
  ).summary.atRiskValue;
  return Math.max(0, without - base);
}

export interface TippingPoints {
  /** Latest shift (days, >= 0) that leaves every order no worse off than landing as planned. */
  latestSafe: number;
  /** First shift that leaves any order shorter than planned, if any within the window. */
  firstShort: number | null;
}

/**
 * Scans later landing dates for one receipt within the current scenario
 * (other overrides and alternatives stay as they are). A date counts as
 * harmful when any order line (order and component) ends up shorter than it
 * is with the receipt on time. Comparing only the total would miss a delay that moves a shortage
 * from one customer to another.
 */
export function tippingPoints(
  data: Dataset,
  scenario: Scenario,
  delivery: Delivery,
): TippingPoints {
  const shortageAt = (shift: number) =>
    new Map(
      simulate(
        data,
        withReceiptDate(
          data,
          scenario,
          delivery.id,
          addDays(delivery.availableDate, shift),
        ),
      ).orders.flatMap((o) =>
        o.lines.map((l) => [`${o.orderId}|${l.componentId}`, l.shortage]),
      ),
    );
  const { max } = shiftRange(data, delivery);
  const planned = shortageAt(0);
  for (let shift = 1; shift <= max; shift++) {
    for (const [line, shortage] of shortageAt(shift)) {
      if (shortage > (planned.get(line) ?? 0))
        return { latestSafe: shift - 1, firstShort: shift };
    }
  }
  return { latestSafe: max, firstShort: null };
}

export interface AxisTick {
  date: string;
  /** Text under the tick, or null for an unlabelled minor tick. */
  label: string | null;
}

/** Upper bounds that keep the axis readable at 360px and cheap to render. */
export const MAX_AXIS_TICKS = 62;
export const MAX_AXIS_LABELS = 8;

type Unit = "day" | "month" | "year";
/** Minor step and label step, in units, from finest to coarsest. */
const AXIS_LADDER: [Unit, number, number][] = [
  ["day", 1, 1],
  ["day", 1, 2],
  ["day", 1, 3],
  ["day", 1, 7],
  ["day", 7, 14],
  ["day", 7, 28],
  ["month", 1, 1],
  ["month", 1, 2],
  ["month", 1, 3],
  ["month", 3, 6],
  ["month", 3, 12],
  ["year", 1, 1],
  ["year", 1, 2],
  ["year", 1, 5],
  ["year", 5, 10],
  ["year", 10, 20],
  ["year", 10, 50],
  ["year", 100, 100],
  ["year", 100, 500],
  ["year", 1000, 1000],
];

const parts = (iso: string) =>
  iso.split("-").map(Number) as [number, number, number];
const iso = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
const monthName = (date: string, withYear: boolean) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

/** Dates on [start, end] for one rung: day steps count from start, month
 * and year steps sit on calendar boundaries. Stops early past `limit`. */
function stepDates(
  start: string,
  end: string,
  unit: Unit,
  step: number,
  limit: number,
) {
  const out: string[] = [];
  const [y0, m0] = parts(start);
  for (let i = 0; out.length <= limit; i++) {
    const d =
      unit === "day"
        ? addDays(start, i * step)
        : unit === "month"
          ? iso(y0, m0 + 1 + i * step, 1)
          : iso((Math.floor(y0 / step) + 1 + i) * step, 1, 1);
    if (d > end) break;
    out.push(d);
  }
  return out;
}

/**
 * Ticks for a dated axis from `start` to `end`. The count is bounded by
 * MAX_AXIS_TICKS whatever the span, so a plan reaching into 2099 renders
 * as quickly as a two-week one. Short spans tick daily; longer ones step to
 * weeks, months and years.
 */
export function axisTicks(start: string, end: string): AxisTick[] {
  const span = Math.max(0, dayDiff(start, end));
  for (const [unit, minor, major] of AXIS_LADDER) {
    const minors = stepDates(start, end, unit, minor, MAX_AXIS_TICKS);
    const labels = new Set(stepDates(start, end, unit, major, MAX_AXIS_LABELS));
    if (minors.length > MAX_AXIS_TICKS || labels.size > MAX_AXIS_LABELS)
      continue;
    // The start always carries the full date so the axis has an anchor.
    const ticks: AxisTick[] = [{ date: start, label: shortDate(start) }];
    let year = parts(start)[0];
    for (const date of minors) {
      if (date === start) continue;
      // Keep the first label clear of the anchor.
      const crowded = dayDiff(start, date) < span / (MAX_AXIS_LABELS * 1.5);
      let label: string | null = null;
      if (labels.has(date) && !crowded) {
        const [y, , d] = parts(date);
        label =
          unit === "year"
            ? String(y)
            : unit === "month"
              ? monthName(date, y !== year)
              : d === 1
                ? shortDate(date)
                : String(d);
        year = y;
      }
      ticks.push({ date, label });
    }
    return ticks;
  }
  return [
    { date: start, label: shortDate(start) },
    { date: end, label: String(parts(end)[0]) },
  ];
}
