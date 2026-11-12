import { useEffect, useId, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type {
  Allocation,
  Dataset,
  MaterialLine,
  OrderResult,
  SimulationResult,
} from "@/lib/types";
import "./panels.css";

export interface ImpactPanelProps {
  data: Dataset;
  result: SimulationResult;
  selectedOrderId?: string;
}

function sourceLabel(allocation: Allocation): string {
  if (allocation.sourceType === "inventory") return "Stock on hand";
  if (allocation.sourceType === "delivery")
    return `Delivery ${allocation.sourceId}`;
  return `Alternative ${allocation.sourceId}`;
}

function supplierLabel(
  supplierId: string | undefined,
  data: Dataset,
): string | null {
  if (!supplierId) return null;
  const supplier = data.suppliers.find((s) => s.id === supplierId);
  return supplier ? `${supplier.id} · ${supplier.name}` : supplierId;
}

function orderMissingUnits(order: OrderResult): number {
  return order.lines.reduce((sum, line) => sum + line.shortage, 0);
}

export function ImpactPanel({
  data,
  result,
  selectedOrderId,
}: ImpactPanelProps) {
  const baseId = useId();

  const componentName = useMemo(
    () => new Map(data.components.map((c) => [c.id, `${c.name} (${c.unit})`])),
    [data.components],
  );
  const productName = useMemo(
    () => new Map(data.products.map((p) => [p.id, p.name])),
    [data.products],
  );
  const orderCustomer = useMemo(
    () => new Map(data.orders.map((o) => [o.id, o.customer])),
    [data.orders],
  );

  const defaultOrderId =
    result.orders.find((o) => o.status === "at-risk")?.orderId ??
    result.orders[0]?.orderId;
  const [activeId, setActiveId] = useState<string | undefined>(
    selectedOrderId ?? defaultOrderId,
  );

  useEffect(() => {
    setActiveId(selectedOrderId ?? defaultOrderId);
  }, [selectedOrderId, defaultOrderId]);

  const active: OrderResult | undefined =
    result.orders.find((o) => o.orderId === activeId) ?? result.orders[0];

  return (
    <section className="impact-panel" aria-label="Order allocation evidence">
      {result.orders.length === 0 ? (
        <p className="impact-panel__empty">No orders to assess.</p>
      ) : (
        <div className="impact-panel__body">
          <div className="scenario-field">
            <label htmlFor={`${baseId}-order`}>Inspect allocation</label>
            <select
              id={`${baseId}-order`}
              className="scenario-control"
              value={active?.orderId ?? ""}
              onChange={(e) => setActiveId(e.target.value)}
            >
              {result.orders.map((order) => (
                <option key={order.orderId} value={order.orderId}>
                  {order.orderId} · {orderCustomer.get(order.orderId)}
                  {orderMissingUnits(order)
                    ? ` · ${orderMissingUnits(order)} short`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {active && (
            <div className="impact-detail" aria-live="polite">
              <header className="impact-detail__header">
                <h3 className="impact-panel__subtitle">
                  {active.orderId} ·{" "}
                  {productName.get(active.productId) ?? active.productId}
                </h3>
                <p className="impact-detail__meta">
                  {orderCustomer.get(active.orderId) ?? "Unknown customer"} ·
                  required {active.requiredDate}
                </p>
                <StatusBadge status={active.status} />
              </header>

              {active.status === "at-risk" && (
                <p className="impact-note impact-note--warning">
                  <AlertTriangle aria-hidden="true" size={16} />
                  <span>
                    Incomplete kit. Materials are reserved per component in
                    priority order. The reservations below remain held for this
                    order.
                  </span>
                </p>
              )}

              <div className="impact-lines">
                {active.lines.map((line) => (
                  <MaterialLineCard
                    key={line.componentId}
                    line={line}
                    label={
                      componentName.get(line.componentId) ?? line.componentId
                    }
                    required={active.requiredDate}
                    data={data}
                    baseId={`${baseId}-${active.orderId}-${line.componentId}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: OrderResult["status"] }) {
  if (status === "covered") {
    return (
      <span className="impact-badge impact-badge--covered">
        <CheckCircle2 aria-hidden="true" size={12} />
        Covered
      </span>
    );
  }
  return (
    <span className="impact-badge impact-badge--at-risk">
      <AlertTriangle aria-hidden="true" size={12} />
      At risk
    </span>
  );
}

function MaterialLineCard({
  line,
  label,
  required,
  data,
  baseId,
}: {
  line: MaterialLine;
  label: string;
  required: string;
  data: Dataset;
  baseId: string;
}) {
  const short = line.shortage > 0;
  return (
    <article
      className={`impact-line${short ? " impact-line--short" : ""}`}
      aria-labelledby={`${baseId}-name`}
    >
      <header className="impact-line__header">
        <h4 id={`${baseId}-name`} className="impact-line__name">
          {label}
        </h4>
        <span className="impact-line__counts">
          {line.allocated} of {line.required} allocated
          {short ? ` · short ${line.shortage}` : ""}
        </span>
      </header>

      <p className="impact-explanation">
        Requires {line.required}, with {line.allocated} available after
        earlier-priority allocations.
        {short
          ? ` ${line.shortage} ${line.shortage === 1 ? "unit is" : "units are"} missing by ${required}.`
          : ` All ${line.required} allocated by ${required}.`}
      </p>
      {line.allocations.length === 0 ? (
        <p className="impact-line__empty">No supply allocated.</p>
      ) : (
        <ul className="impact-allocations">
          {line.allocations.map((allocation, index) => (
            <li
              key={`${allocation.sourceType}-${allocation.sourceId}-${index}`}
              className="impact-allocation"
            >
              <span>
                {sourceLabel(allocation)}
                {supplierLabel(allocation.supplierId, data)
                  ? ` · ${supplierLabel(allocation.supplierId, data)}`
                  : ""}
              </span>
              <span className="impact-allocation__qty">
                {allocation.quantity} units · {allocation.availableDate}
                {allocation.availableDate > required ? " · after due date" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      {short && line.lateDeliveries.length > 0 && (
        <div className="impact-late">
          <h5 className="impact-late__title">Arriving after {required}</h5>
          <ul className="impact-allocations">
            {line.lateDeliveries.map((delivery) => (
              <li key={delivery.id} className="impact-allocation">
                <span>
                  Delivery {delivery.id} · {delivery.quantity} units
                </span>
                <span className="impact-allocation__qty">
                  available {delivery.availableDate}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
