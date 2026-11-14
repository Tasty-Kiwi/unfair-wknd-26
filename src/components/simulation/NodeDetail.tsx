import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Dataset, SimulationResult } from "@/lib/types";
import type { Selection } from "@/components/graph/SupplyGraph";
import { ImpactPanel } from "@/components/scenarios/ImpactPanel";
import { day } from "./format";

export function NodeDetail({
  selection,
  data,
  result,
  onClose,
  preferNames = false,
}: {
  selection: Selection;
  data: Dataset;
  result: SimulationResult;
  onClose: () => void;
  preferNames?: boolean;
}) {
  const { kind, id } = selection;
  const title =
    kind === "supplier"
      ? data.suppliers.find((x) => x.id === id)?.name
      : kind === "component"
        ? data.components.find((x) => x.id === id)?.name
        : kind === "product"
          ? data.products.find((x) => x.id === id)?.name
          : id;
  return (
    <div className="node-detail">
      <div className="section-heading">
        <div>
          <p className="detail-kind">
            {kind[0].toUpperCase() + kind.slice(1)} · {id}
          </p>
          <h2>{title}</h2>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Close node details"
        >
          <X />
        </Button>
      </div>
      {kind === "order" ? (
        <ImpactPanel
          data={data}
          result={result}
          selectedOrderId={id}
          preferNames={preferNames}
        />
      ) : (
        <>
          {kind === "supplier" && (
            <>
              <p>
                {data.suppliers.find((s) => s.id === id)?.region} · Typical lead
                time {data.suppliers.find((s) => s.id === id)?.leadTimeDays}{" "}
                days
              </p>
              <h4>Incoming deliveries</h4>
              {result.deliveries
                .filter((d) => d.supplierId === id)
                .map((d) => (
                  <div className="detail-row" key={d.id}>
                    <span>
                      {d.id} ·{" "}
                      {
                        data.components.find((c) => c.id === d.componentId)
                          ?.name
                      }
                    </span>
                    <strong>
                      {d.quantity} units · {day(d.availableDate)}
                    </strong>
                  </div>
                ))}
              {data.alternatives
                .filter((a) => a.supplierId === id)
                .map((a) => (
                  <div className="detail-row" key={a.id}>
                    <span>{a.name}</span>
                    <strong>
                      {a.approved ? "Preapproved" : "Not approved"} ·{" "}
                      {a.quantity} units
                    </strong>
                  </div>
                ))}
            </>
          )}
          {kind === "component" && (
            <>
              <div className="detail-row">
                <span>Opening inventory</span>
                <strong>
                  {data.inventory
                    .filter((x) => x.componentId === id)
                    .reduce((s, x) => s + x.quantity, 0)}{" "}
                  units
                </strong>
              </div>
              <h4>Order requirements</h4>
              {result.orders
                .filter((o) => o.lines.some((l) => l.componentId === id))
                .map((o) => {
                  const l = o.lines.find((x) => x.componentId === id)!;
                  return (
                    <div className="detail-row" key={o.orderId}>
                      <span>
                        {o.orderId} · {day(o.requiredDate)}
                      </span>
                      <strong
                        className={l.shortage ? "risk-text" : "success-text"}
                      >
                        {l.allocated}/{l.required} allocated
                        {l.shortage ? ` · ${l.shortage} short` : ""}
                      </strong>
                    </div>
                  );
                })}
            </>
          )}
          {kind === "product" && (
            <>
              <h4>Bill of materials / per product</h4>
              {data.products
                .find((p) => p.id === id)
                ?.bom.map((b) => (
                  <div className="detail-row" key={b.componentId}>
                    <span>
                      {
                        data.components.find((c) => c.id === b.componentId)
                          ?.name
                      }
                    </span>
                    <strong>× {b.quantity}</strong>
                  </div>
                ))}
              <h4>Customer orders</h4>
              {data.orders
                .filter((o) => o.productId === id)
                .map((o) => (
                  <div className="detail-row" key={o.id}>
                    <span>
                      {o.id} · {o.customer}
                    </span>
                    <strong>
                      {o.quantity} units · {day(o.requiredDate)}
                    </strong>
                  </div>
                ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
