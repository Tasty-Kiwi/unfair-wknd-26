import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { simulate } from "@/lib/simulation";
import type { Dataset, Scenario } from "@/lib/types";
import { causeReceipt, withReceiptDate } from "@/lib/receipts";
import { SupplyGraph, type Selection } from "@/components/graph/SupplyGraph";
import { RecoveryComparison } from "@/components/scenarios/RecoveryComparison";
import { ScenarioPanel } from "@/components/scenarios/ScenarioPanel";
import { OutcomeBanner } from "@/components/scenarios/OutcomeBanner";
import { ShortageExplanation } from "@/components/scenarios/ShortageExplanation";
import { CoverageOverview } from "@/components/scenarios/CoverageOverview";
import "@/simulator.css";
import "@/components/scenarios/panels.css";
import "./surface.css";
import { NodeDetail } from "./NodeDetail";
import {
  day,
  money,
  reducedMotion,
  scenarioInputsKey,
  SCENARIO_REPORT_POLICY,
} from "./format";

/** One row of "Scenarios side by side". Owners build these from their own scenario source. */
export type ComparisonRow = {
  key: string;
  name: string;
  summary: {
    atRiskOrders: number;
    missingUnits: number;
    atRiskValue: number;
  } | null;
  unavailableReason?: string;
  current: boolean;
  onShow?: () => void;
};

export type SimulationSurfaceProps = {
  /** Validated network. Owners must not pass a stale or invalid network. */
  data: Dataset;
  /** Validated scenario for `data`. */
  scenario: Scenario;
  /** Owner validates and stores the scenario. Returns false when it was rejected. */
  onScenarioChange: (next: Scenario) => boolean;
  /** Owner's rejection message for scenario controls, shown beside the inputs. */
  scenarioError?: string;
  comparisons: ComparisonRow[];
  comparisonRequest?: number;
  /** Owner's saved-scenario controls, shown above the outcome banner. */
  scenarioSwitch?: ReactNode;
  /** Show customer and component names on the map and impact panel. Default false keeps the simulator's ID labels. */
  preferNames?: boolean;
  /** Changes whenever the owner's scenario source is replaced (resets rail state). */
  panelKey: string;
  onTestDelay: () => void;
  onNotice: (message: string) => void;
  onExportReport: () => void;
  assumptionsOpen: boolean;
  onAssumptionsOpenChange: (open: boolean) => void;
};

export function SimulationSurface({
  data,
  scenario,
  onScenarioChange,
  scenarioError,
  comparisons,
  comparisonRequest = 0,
  scenarioSwitch,
  preferNames = false,
  panelKey,
  onTestDelay,
  onNotice,
  onExportReport,
  assumptionsOpen,
  onAssumptionsOpenChange,
}: SimulationSurfaceProps) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [explainId, setExplainId] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<{
    key: string;
    orderId?: string;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    setSelection(null);
    setExplainId(null);
    setRecovered(null);
    setDrawerOpen(false);
  }, [panelKey]);
  useEffect(() => {
    if (comparisonRequest > 0) setDrawerOpen(true);
  }, [comparisonRequest]);
  const rail = useRef<HTMLElement>(null);
  const evidence = useRef<HTMLDivElement>(null);
  const result = useMemo(() => simulate(data, scenario), [data, scenario]);
  const s = result.summary;
  // A recovery banner applies only to the exact scenario it produced.
  const recoveredId =
    recovered && recovered.key === `${panelKey}:${scenarioInputsKey(scenario)}`
      ? recovered.orderId
      : undefined;
  const riskOrders = result.orders.filter((o) => o.status === "at-risk");
  const firstRisk = riskOrders[0];
  const explained =
    riskOrders.find((o) => o.orderId === explainId) ?? firstRisk;
  const firstShort = firstRisk?.lines.find((l) => l.shortage > 0);
  const cause = (() => {
    if (!firstRisk || !firstShort) return null;
    const order = data.orders.find((o) => o.id === firstRisk.orderId);
    const component = data.components.find(
      (c) => c.id === firstShort.componentId,
    );
    const late = causeReceipt(data, firstShort.lateDeliveries);
    return `${firstRisk.orderId} for ${order?.customer ?? "a customer"} needs ${firstShort.required} × ${component?.name.toLowerCase() ?? firstShort.componentId} by ${day(firstRisk.requiredDate)}. ${firstShort.shortage} ${firstShort.shortage === 1 ? "is" : "are"} missing${late ? `: receipt ${late.id} now lands ${day(late.availableDate)}` : ""}.`;
  })();

  function applyRecovery(next: Scenario) {
    const recoveredResult = simulate(data, next);
    const restored = result.orders.filter(
      (order) =>
        order.status === "at-risk" &&
        recoveredResult.orders.some(
          (after) =>
            after.orderId === order.orderId && after.status === "covered",
        ),
    );
    const late = recoveredResult.deliveries.filter(
      (delivery) =>
        delivery.availableDate >
        (data.deliveries.find((original) => original.id === delivery.id)
          ?.availableDate ?? delivery.availableDate),
    );
    if (!onScenarioChange(next)) return;
    setRecovered({
      key: `${panelKey}:${scenarioInputsKey(next)}`,
      orderId: restored[0]?.orderId,
    });
    onNotice(
      `${restored.length ? `${restored.map((order) => order.orderId).join(", ")} regained material coverage in this simulation.` : "Recovery applied to this simulation."} ${recoveredResult.summary.missingUnits > 0 ? `${recoveredResult.summary.missingUnits} material unit(s) still missing across ${recoveredResult.summary.atRiskOrders} order(s) at risk.` : "All orders have material coverage."} ${late.map((delivery) => `${delivery.id} remains late (${day(delivery.availableDate)})`).join("; ") || "Receipt dates reflect this scenario"}. No purchase or supplier confirmation was made.`,
    );
  }

  return (
    <>
      {scenarioSwitch && (
        <div className="sim-scenario-switch">{scenarioSwitch}</div>
      )}
      <OutcomeBanner
        data={data}
        result={result}
        scenario={scenario}
        cause={cause}
      />
      <div className="sim-work">
        <div className="sim-stage">
          <SupplyGraph
            preferNames={preferNames}
            data={data}
            result={result}
            scenario={scenario}
            onSelect={(next) => {
              setSelection(next);
              requestAnimationFrame(() => rail.current?.scrollTo({ top: 0 }));
            }}
            selected={selection}
            onMoveReceipt={(id, date) =>
              onScenarioChange(withReceiptDate(data, scenario, id, date))
            }
          />
        </div>
        <aside
          className="sim-rail"
          ref={rail}
          aria-label="Explanation and inputs"
        >
          <div className="rail-impact" ref={evidence}>
            {selection ? (
              <NodeDetail
                selection={selection}
                data={data}
                result={result}
                onClose={() => setSelection(null)}
                preferNames={preferNames}
              />
            ) : firstRisk ? (
              <>
                {riskOrders.length > 1 && (
                  <div className="scenario-field rail-explain-pick">
                    <label htmlFor="explain-order">Explain order</label>
                    <select
                      id="explain-order"
                      className="scenario-control"
                      value={explained?.orderId}
                      onChange={(e) => setExplainId(e.target.value)}
                    >
                      {riskOrders.map((o) => (
                        <option key={o.orderId} value={o.orderId}>
                          {o.orderId} ·{" "}
                          {o.lines.reduce((n, l) => n + l.shortage, 0)} short
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {explained && (
                  <ShortageExplanation
                    data={data}
                    result={result}
                    order={explained}
                    onInspect={() =>
                      setSelection({ kind: "order", id: explained.orderId })
                    }
                  />
                )}
                <RecoveryComparison
                  data={data}
                  scenario={scenario}
                  current={result}
                  onApply={applyRecovery}
                />
              </>
            ) : (
              <CoverageOverview
                preferNames={preferNames}
                data={data}
                result={result}
                recoveredId={recoveredId}
                recovery={
                  Boolean(recoveredId) || scenario.alternatives.length > 0
                }
                onTestDelay={onTestDelay}
              />
            )}
          </div>
          <section className="rail-inputs" aria-labelledby="inputs-title">
            <header className="rail-heading">
              <h2 id="inputs-title">Change the inputs</h2>
              <span>Recalculates every order</span>
            </header>
            {scenarioError && (
              <Alert variant="destructive">
                <AlertTitle>Scenario not applied</AlertTitle>
                <AlertDescription>{scenarioError}</AlertDescription>
              </Alert>
            )}
            <ScenarioPanel
              key={`${panelKey}:${scenario.id}`}
              data={data}
              scenario={scenario}
              onChange={onScenarioChange}
            />
            <div className="policy-note">
              <ShieldCheck size={16} aria-hidden="true" />
              <p>
                <strong>Material availability only.</strong> Earliest required
                date, then order ID. Partial kits reserve stock. Capacity and
                shipment timing are outside this model.
              </p>
            </div>
          </section>
        </aside>
      </div>
      <section
        className={`order-drawer ${drawerOpen ? "is-open" : ""}`}
        aria-label="Order book and scenario comparison"
      >
        <button
          type="button"
          className="order-drawer__toggle"
          aria-expanded={drawerOpen}
          aria-controls="order-drawer-panel"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <strong>Order book</strong>
          <span className="order-drawer__count">
            {s.totalOrders} orders
            {s.atRiskOrders ? ` · ${s.atRiskOrders} short` : " · all covered"}
          </span>
          <span className="order-strip" aria-hidden="true">
            {result.orders.map((o) => (
              <i
                key={o.orderId}
                className={o.status === "at-risk" ? "is-short" : ""}
              />
            ))}
          </span>
          <span className="order-drawer__more">Compare scenarios · export</span>
          <ChevronUp
            className="order-drawer__chev"
            size={16}
            aria-hidden="true"
          />
        </button>
        <div
          id="order-drawer-panel"
          className="order-drawer__panel"
          hidden={!drawerOpen}
        >
          <section
            className="comparison-section"
            aria-labelledby="compare-title"
          >
            <div className="section-heading">
              <h2 id="compare-title">Scenarios side by side</h2>
              <Button variant="ghost" size="sm" onClick={onExportReport}>
                <ArrowDownToLine data-icon="inline-start" />
                Export report JSON
              </Button>
            </div>
            <div className="table-scroll">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th scope="col">Scenario</th>
                    <th scope="col" className="num">
                      Orders at risk
                    </th>
                    <th scope="col" className="num">
                      Units missing
                    </th>
                    <th scope="col" className="num">
                      Order value exposed
                    </th>
                    <th scope="col">
                      <span className="sr-only">Load scenario</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row) => (
                    <tr
                      key={row.key}
                      className={row.current ? "is-current" : ""}
                      aria-current={row.current ? "true" : undefined}
                    >
                      <th scope="row">
                        {row.name}
                        {row.current && (
                          <span className="current-tag">Showing</span>
                        )}
                      </th>
                      {row.summary ? (
                        <>
                          <td
                            className={`num ${row.summary.atRiskOrders ? "short-text" : ""}`}
                          >
                            {row.summary.atRiskOrders}
                          </td>
                          <td className="num">{row.summary.missingUnits}</td>
                          <td className="num">
                            {money(row.summary.atRiskValue)}
                          </td>
                        </>
                      ) : (
                        <td colSpan={3}>
                          {row.unavailableReason ?? "Requires review"}
                        </td>
                      )}
                      <td className="row-action">
                        {!row.current && row.onShow && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={row.onShow}
                          >
                            Show <ArrowRight size={14} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="orders-section">
            <div className="section-heading">
              <h2>Order book</h2>
              <p className="section-note">
                Allocated by required date, then order ID
              </p>
            </div>
            <div className="table-scroll">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Required by</th>
                    <th scope="col">Material</th>
                    <th scope="col">Product</th>
                    <th scope="col" className="num">
                      Qty
                    </th>
                    <th scope="col" className="num">
                      Value
                    </th>
                    <th scope="col">
                      <span className="sr-only">Inspect order</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.orders.map((r) => {
                    const o = data.orders.find((x) => x.id === r.orderId)!;
                    const short = r.lines.reduce((n, l) => n + l.shortage, 0);
                    return (
                      <tr
                        key={o.id}
                        className={r.status === "at-risk" ? "at-risk-row" : ""}
                      >
                        <td>
                          <strong>{o.id}</strong>
                          <span>{o.customer}</span>
                        </td>
                        <td>{day(o.requiredDate)}</td>
                        <td>
                          <span
                            className={`order-status ${r.status === "at-risk" ? "is-short" : "is-covered"}`}
                          >
                            {r.status === "at-risk" ? (
                              <>
                                <i className="hatch-chip" aria-hidden="true" />
                                Short {short}
                              </>
                            ) : (
                              <>
                                <Check size={14} aria-hidden="true" />
                                Covered
                              </>
                            )}
                          </span>
                        </td>
                        <td>
                          {
                            data.products.find((p) => p.id === o.productId)
                              ?.name
                          }
                        </td>
                        <td className="num">{o.quantity}</td>
                        <td className="num">{money(o.value)}</td>
                        <td className="row-action">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Inspect ${o.id}`}
                            onClick={() => {
                              setSelection({ kind: "order", id: o.id });
                              setDrawerOpen(false);
                              requestAnimationFrame(() => {
                                rail.current?.scrollTo({ top: 0 });
                                evidence.current?.scrollIntoView({
                                  behavior: reducedMotion() ? "auto" : "smooth",
                                  block: "nearest",
                                });
                              });
                            }}
                          >
                            <ChevronRight />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <footer>
            <span>Needtrace · Unfair Weekend 2026</span>
            <button onClick={() => onAssumptionsOpenChange(true)}>
              Model assumptions <ArrowRight size={14} />
            </button>
          </footer>
        </div>
      </section>
      <Dialog open={assumptionsOpen} onOpenChange={onAssumptionsOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Model assumptions</DialogTitle>
            <DialogDescription>
              Needtrace simulates material availability, using deterministic
              TypeScript calculations.
            </DialogDescription>
          </DialogHeader>
          <div className="assumptions">
            <p>
              <strong>Allocation:</strong> earliest required date first, then
              stable order ID. Each component is reserved independently, so
              partial kits keep their allocated materials.
            </p>
            <p>
              <strong>Dates:</strong> inventory is available as of the dataset
              date. Incoming supply arriving on the required date counts as
              available.
            </p>
            <p>
              <strong>Alternatives:</strong> only explicitly approved,
              product-scoped supply can be allocated. Catalog availability and
              quantities are limits.
            </p>
            <p>
              <strong>Order value at risk:</strong> full value of each distinct
              order with an uncovered BOM line. This is exposure, not forecast
              lost revenue or savings.
            </p>
            <p>
              <strong>Out of scope:</strong> factory capacity, labor, machine
              scheduling, production durations and exact shipping dates. The
              priority policy is not an optimizer.
            </p>
            <p>
              The starter manufacturer, suppliers, orders and prices are
              fictional. No data leaves this browser and no AI calculates the
              results.
            </p>
            <p className="muted-small">{SCENARIO_REPORT_POLICY}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
