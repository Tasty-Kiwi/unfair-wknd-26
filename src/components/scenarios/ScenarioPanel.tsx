import { useEffect, useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  AlternativeSupply,
  Dataset,
  Delivery,
  Scenario,
} from "@/lib/types";
import { isIsoDate, parseScenario } from "@/lib/validation";
import "./panels.css";

export interface ScenarioPanelProps {
  data: Dataset;
  scenario: Scenario;
  onChange: (scenario: Scenario) => void;
}

const MAX_SHIFT_DAYS = 12;
const DAY_MS = 86_400_000;

function toUtcMs(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Whole days from `from` to `to` (both ISO dates). */
function dayDiff(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

function addDays(iso: string, days: number): string {
  return new Date(toUtcMs(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Returns the quantity as a whole number, or null when the draft is not a valid count. */
function parseCount(draft: string): number | null {
  const trimmed = draft.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

function describeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The scenario could not be updated.";
}

/**
 * Validates the candidate scenario with the shared parser and only then forwards it.
 * Returns an error message to show, or null on success.
 */
function commit(
  data: Dataset,
  candidate: Scenario,
  onChange: (scenario: Scenario) => void,
): string | null {
  let next: Scenario;
  try {
    next = parseScenario(data, candidate);
  } catch (error) {
    return describeError(error);
  }
  onChange(next);
  return null;
}

export function ScenarioPanel({
  data,
  scenario,
  onChange,
}: ScenarioPanelProps) {
  const baseId = useId();
  const suppliersWithDeliveries = data.suppliers.filter((supplier) =>
    data.deliveries.some((delivery) => delivery.supplierId === supplier.id),
  );

  const [supplierId, setSupplierId] = useState<string>(
    () =>
      data.deliveries[0]?.supplierId ?? suppliersWithDeliveries[0]?.id ?? "",
  );
  const [deliveryId, setDeliveryId] = useState<string>(
    () => data.deliveries[0]?.id ?? "",
  );

  const deliveriesForSupplier = data.deliveries.filter(
    (d) => d.supplierId === supplierId,
  );
  const selectedDelivery =
    deliveriesForSupplier.find((d) => d.id === deliveryId) ??
    deliveriesForSupplier[0];

  const handleSupplierChange = (nextSupplierId: string) => {
    setSupplierId(nextSupplierId);
    setDeliveryId(
      data.deliveries.find((d) => d.supplierId === nextSupplierId)?.id ?? "",
    );
  };

  return (
    <section className="scenario-panel" aria-labelledby={`${baseId}-title`}>
      <header className="scenario-panel__header">
        <h2 id={`${baseId}-title`} className="scenario-panel__title">
          Scenario: {scenario.name}
        </h2>
        <p className="scenario-panel__hint">
          Adjust delivery timing or quantity to see the impact instantly.
        </p>
      </header>

      <div className="scenario-panel__section">
        <h3 className="scenario-panel__subtitle">Delivery timing</h3>

        {selectedDelivery ? (
          <div className="scenario-panel__grid">
            <div className="scenario-field">
              <label htmlFor={`${baseId}-supplier`}>Supplier</label>
              <select
                id={`${baseId}-supplier`}
                className="scenario-control"
                value={selectedDelivery.supplierId}
                onChange={(event) => handleSupplierChange(event.target.value)}
              >
                {suppliersWithDeliveries.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.id} · {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="scenario-field">
              <label htmlFor={`${baseId}-delivery`}>Delivery</label>
              <select
                id={`${baseId}-delivery`}
                className="scenario-control"
                value={selectedDelivery.id}
                onChange={(event) => setDeliveryId(event.target.value)}
              >
                {deliveriesForSupplier.map((delivery) => (
                  <option key={delivery.id} value={delivery.id}>
                    {delivery.id} · {delivery.availableDate} ·{" "}
                    {delivery.quantity} units
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <p className="scenario-panel__empty">
            This dataset has no deliveries to adjust.
          </p>
        )}

        {selectedDelivery && (
          <DeliveryOverrideForm
            key={selectedDelivery.id}
            baseId={`${baseId}-override`}
            data={data}
            scenario={scenario}
            delivery={selectedDelivery}
            onChange={onChange}
          />
        )}

        <OverrideList data={data} scenario={scenario} onChange={onChange} />
      </div>

      <AlternativeSection
        baseId={`${baseId}-alt`}
        data={data}
        scenario={scenario}
        onChange={onChange}
      />
    </section>
  );
}

interface DeliveryOverrideFormProps {
  baseId: string;
  data: Dataset;
  scenario: Scenario;
  delivery: Delivery;
  onChange: (scenario: Scenario) => void;
}

/**
 * Keyed by delivery id by the parent, so drafts reset when the selected delivery changes
 * and survive while the user edits it.
 */
function DeliveryOverrideForm({
  baseId,
  data,
  scenario,
  delivery,
  onChange,
}: DeliveryOverrideFormProps) {
  const existing = scenario.deliveryOverrides.find(
    (o) => o.deliveryId === delivery.id,
  );
  const [date, setDate] = useState<string>(
    existing?.availableDate ?? delivery.availableDate,
  );
  const [quantityDraft, setQuantityDraft] = useState<string>(
    String(existing?.quantity ?? delivery.quantity),
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setDate(existing?.availableDate ?? delivery.availableDate);
    setQuantityDraft(String(existing?.quantity ?? delivery.quantity));
  }, [
    existing?.availableDate,
    existing?.quantity,
    delivery.availableDate,
    delivery.quantity,
  ]);

  const dateValid = isIsoDate(date);
  const offset = dateValid ? dayDiff(delivery.availableDate, date) : null;
  const minShift = Math.max(-5, dayDiff(delivery.availableDate, data.asOf));
  const sliderValue =
    offset === null ? 0 : Math.min(MAX_SHIFT_DAYS, Math.max(minShift, offset));

  const save = (nextDate = date, nextQuantity = quantityDraft) => {
    if (!isIsoDate(nextDate)) {
      setStatus(null);
      setError("Enter a real date in YYYY-MM-DD format before saving.");
      return;
    }
    const quantity = parseCount(nextQuantity);
    if (quantity === null) {
      setStatus(null);
      setError("Quantity must be a whole number, 0 or more.");
      return;
    }
    const candidate: Scenario = {
      ...scenario,
      deliveryOverrides: [
        ...scenario.deliveryOverrides.filter(
          (o) => o.deliveryId !== delivery.id,
        ),
        { deliveryId: delivery.id, availableDate: nextDate, quantity },
      ],
    };
    const problem = commit(data, candidate, onChange);
    if (problem) {
      setStatus(null);
      setError(problem);
      return;
    }
    setError(null);
    setStatus(null);
  };

  const resetToBaseline = () => {
    const candidate: Scenario = {
      ...scenario,
      deliveryOverrides: scenario.deliveryOverrides.filter(
        (o) => o.deliveryId !== delivery.id,
      ),
    };
    const problem = commit(data, candidate, onChange);
    if (problem) {
      setStatus(null);
      setError(problem);
      return;
    }
    setError(null);
    setDate(delivery.availableDate);
    setQuantityDraft(String(delivery.quantity));
    setStatus(`Reset ${delivery.id} to its baseline date and quantity.`);
  };

  return (
    <div
      className="scenario-form"
      role="group"
      aria-labelledby={`${baseId}-legend`}
    >
      <p id={`${baseId}-legend`} className="scenario-form__legend">
        Baseline: {delivery.availableDate} · {delivery.quantity} units ·{" "}
        {delivery.id}
        {existing ? " (override active)" : ""}
      </p>

      <div className="scenario-panel__grid">
        <div className="scenario-field">
          <label htmlFor={`${baseId}-date`}>Available date</label>
          <input
            id={`${baseId}-date`}
            type="date"
            className="scenario-control"
            value={date}
            aria-invalid={!dateValid}
            onChange={(event) => {
              setDate(event.target.value);
              save(event.target.value, quantityDraft);
            }}
          />
        </div>

        <div className="scenario-field">
          <label htmlFor={`${baseId}-quantity`}>Quantity</label>
          <input
            id={`${baseId}-quantity`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            className="scenario-control"
            value={quantityDraft}
            onChange={(event) => {
              setQuantityDraft(event.target.value);
              save(date, event.target.value);
            }}
          />
        </div>
      </div>

      <div className="scenario-field">
        <label htmlFor={`${baseId}-shift`}>
          Shift from baseline:{" "}
          <output htmlFor={`${baseId}-shift`} className="scenario-field__value">
            {offset === null
              ? "invalid date"
              : `${offset > 0 ? "+" : ""}${offset} days`}
          </output>
        </label>
        <input
          id={`${baseId}-shift`}
          type="range"
          min={minShift}
          max={MAX_SHIFT_DAYS}
          step={1}
          className="scenario-slider"
          value={sliderValue}
          onChange={(event) => {
            const nextDate = addDays(
              delivery.availableDate,
              Number(event.target.value),
            );
            setDate(nextDate);
            save(nextDate, quantityDraft);
          }}
        />
        <p className="scenario-field__help">
          Move from {minShift} to +{MAX_SHIFT_DAYS} days relative to baseline.
        </p>
      </div>

      <div className="scenario-actions">
        <button
          type="button"
          className="scenario-button"
          onClick={resetToBaseline}
          disabled={!existing}
        >
          Reset to baseline
        </button>
      </div>

      <FeedbackMessages error={error} status={status} />
    </div>
  );
}

function OverrideList({
  data,
  scenario,
  onChange,
}: {
  data: Dataset;
  scenario: Scenario;
  onChange: (scenario: Scenario) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  if (scenario.deliveryOverrides.length === 0) {
    return (
      <>
        <p className="scenario-panel__empty">
          No delivery overrides. Baseline dates are used.
        </p>
        <FeedbackMessages error={error} status={status} />
      </>
    );
  }

  const remove = (deliveryId: string) => {
    const candidate: Scenario = {
      ...scenario,
      deliveryOverrides: scenario.deliveryOverrides.filter(
        (o) => o.deliveryId !== deliveryId,
      ),
    };
    const problem = commit(data, candidate, onChange);
    if (problem) {
      setStatus(null);
      setError(problem);
      return;
    }
    setError(null);
    setStatus(`Removed override for ${deliveryId}.`);
  };

  return (
    <div>
      <h4 className="scenario-panel__subtitle">Active overrides</h4>
      <ul className="scenario-list">
        {scenario.deliveryOverrides.map((override) => {
          const delivery = data.deliveries.find(
            (d) => d.id === override.deliveryId,
          );
          const component = data.components.find(
            (c) => c.id === delivery?.componentId,
          );
          return (
            <li key={override.deliveryId} className="scenario-list__item">
              <span>
                <strong>{override.deliveryId}</strong>
                {component ? ` · ${component.name}` : ""}: {override.quantity}{" "}
                units on {override.availableDate}
                {delivery ? ` (baseline ${delivery.availableDate})` : ""}
              </span>
              <button
                type="button"
                className="scenario-button scenario-button--danger"
                aria-label={`Remove override for ${override.deliveryId}`}
                onClick={() => remove(override.deliveryId)}
              >
                <Trash2 aria-hidden="true" size={14} />
                Remove
              </button>
            </li>
          );
        })}
      </ul>
      <FeedbackMessages error={error} status={status} />
    </div>
  );
}

function AlternativeSection({
  baseId,
  data,
  scenario,
  onChange,
}: {
  baseId: string;
  data: Dataset;
  scenario: Scenario;
  onChange: (scenario: Scenario) => void;
}) {
  const [alternativeId, setAlternativeId] = useState<string>(
    () =>
      data.alternatives.find((a) => a.approved)?.id ??
      data.alternatives[0]?.id ??
      "",
  );
  const selected: AlternativeSupply | undefined = data.alternatives.find(
    (a) => a.id === alternativeId,
  );
  const [date, setDate] = useState<string>(
    selected?.availableDate ?? data.asOf,
  );
  const [quantityDraft, setQuantityDraft] = useState<string>(
    String(selected?.quantity ?? 0),
  );
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleAlternativeChange = (nextId: string) => {
    const next = data.alternatives.find((a) => a.id === nextId);
    setAlternativeId(nextId);
    setDate(next?.availableDate ?? data.asOf);
    setQuantityDraft(String(next?.quantity ?? 0));
    setError(null);
    setStatus(null);
  };

  const earliest = selected
    ? selected.availableDate > data.asOf
      ? selected.availableDate
      : data.asOf
    : data.asOf;

  const add = () => {
    if (!selected) {
      setError("Choose an alternative supply first.");
      return;
    }
    if (!isIsoDate(date)) {
      setStatus(null);
      setError("Enter a real date in YYYY-MM-DD format before adding.");
      return;
    }
    const quantity = parseCount(quantityDraft);
    if (quantity === null) {
      setStatus(null);
      setError("Quantity must be a whole number, 0 or more.");
      return;
    }
    const replaced = scenario.alternatives.some(
      (a) => a.alternativeId === selected.id,
    );
    const candidate: Scenario = {
      ...scenario,
      alternatives: [
        ...scenario.alternatives.filter((a) => a.alternativeId !== selected.id),
        { alternativeId: selected.id, quantity, availableDate: date },
      ],
    };
    const problem = commit(data, candidate, onChange);
    if (problem) {
      setStatus(null);
      setError(problem);
      return;
    }
    setError(null);
    setStatus(
      `${replaced ? "Updated" : "Added"} ${selected.id}: ${quantity} units from ${date}.`,
    );
  };

  const remove = (id: string) => {
    const candidate: Scenario = {
      ...scenario,
      alternatives: scenario.alternatives.filter((a) => a.alternativeId !== id),
    };
    const problem = commit(data, candidate, onChange);
    if (problem) {
      setStatus(null);
      setError(problem);
      return;
    }
    setError(null);
    setStatus(`Removed ${id} from the scenario.`);
  };

  return (
    <div className="scenario-panel__section">
      <h3 className="scenario-panel__subtitle">Alternative supply</h3>

      {data.alternatives.length === 0 ? (
        <p className="scenario-panel__empty">
          The catalog has no alternative supplies.
        </p>
      ) : (
        <div className="scenario-form">
          <div className="scenario-field">
            <label htmlFor={`${baseId}-id`}>Alternative</label>
            <select
              id={`${baseId}-id`}
              className="scenario-control"
              value={alternativeId}
              onChange={(event) => handleAlternativeChange(event.target.value)}
            >
              {data.alternatives.map((alternative) => (
                <option
                  key={alternative.id}
                  value={alternative.id}
                  disabled={!alternative.approved}
                >
                  {alternative.id} · {alternative.name}
                  {alternative.approved ? "" : " (not approved)"}
                </option>
              ))}
            </select>
            {selected && !selected.approved && (
              <p className="scenario-field__help scenario-field__help--warning">
                Not approved, so it cannot be added. Approve it in the catalog
                first.
              </p>
            )}
            {selected && selected.approved && (
              <p className="scenario-field__help">
                Catalog: up to {selected.quantity} units, earliest{" "}
                {selected.availableDate}, for{" "}
                {selected.approvedProductIds.join(", ")}.
              </p>
            )}
          </div>

          <div className="scenario-panel__grid">
            <div className="scenario-field">
              <label htmlFor={`${baseId}-date`}>Available date</label>
              <input
                id={`${baseId}-date`}
                type="date"
                className="scenario-control"
                min={earliest}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setError(null);
                }}
              />
            </div>
            <div className="scenario-field">
              <label htmlFor={`${baseId}-quantity`}>Quantity</label>
              <input
                id={`${baseId}-quantity`}
                type="number"
                inputMode="numeric"
                min={0}
                max={selected?.quantity}
                step={1}
                className="scenario-control"
                value={quantityDraft}
                onChange={(event) => {
                  setQuantityDraft(event.target.value);
                  setError(null);
                }}
              />
            </div>
          </div>

          <div className="scenario-actions">
            <button
              type="button"
              className="scenario-button scenario-button--primary"
              onClick={add}
              disabled={!selected || !selected.approved}
            >
              <Plus aria-hidden="true" size={14} />
              Add alternative
            </button>
          </div>
          <FeedbackMessages error={error} status={status} />
        </div>
      )}

      {scenario.alternatives.length === 0 ? (
        <p className="scenario-panel__empty">
          No alternative supply in this scenario.
        </p>
      ) : (
        <ul className="scenario-list">
          {scenario.alternatives.map((use) => {
            const source = data.alternatives.find(
              (a) => a.id === use.alternativeId,
            );
            return (
              <li key={use.alternativeId} className="scenario-list__item">
                <span>
                  <strong>{use.alternativeId}</strong>
                  {source ? ` · ${source.name}` : ""}: {use.quantity} units from{" "}
                  {use.availableDate}
                </span>
                <button
                  type="button"
                  className="scenario-button scenario-button--danger"
                  aria-label={`Remove alternative ${use.alternativeId}`}
                  onClick={() => remove(use.alternativeId)}
                >
                  <Trash2 aria-hidden="true" size={14} />
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FeedbackMessages({
  error,
  status,
}: {
  error: string | null;
  status: string | null;
}) {
  return (
    <>
      {status && (
        <p
          role="status"
          className="scenario-feedback scenario-feedback--status"
        >
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="scenario-feedback scenario-feedback--error">
          {error}
        </p>
      )}
    </>
  );
}
