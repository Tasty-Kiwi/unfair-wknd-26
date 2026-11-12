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
