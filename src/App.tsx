import { useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Factory,
  GitBranch,
  LayoutDashboard,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  demoData,
  NORMAL_SCENARIO,
  DISRUPTION_SCENARIO,
  RECOVERY_SCENARIO,
} from "@/data/demo";
import { simulate } from "@/lib/simulation";
import { parseImportFiles, parseScenario } from "@/lib/validation";
import type { Dataset, Scenario, SimulationResult } from "@/lib/types";
import { SupplyGraph, type Selection } from "@/components/graph/SupplyGraph";
import { RecoveryComparison } from "@/components/scenarios/RecoveryComparison";
import { ScenarioPanel } from "@/components/scenarios/ScenarioPanel";
import { ImpactPanel } from "@/components/scenarios/ImpactPanel";
import "@/components/scenarios/panels.css";

const money = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
const day = (s: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${s}T00:00:00Z`));
function presetsFor(data: Dataset): Scenario[] {
  if (data === demoData)
    return [NORMAL_SCENARIO, DISRUPTION_SCENARIO, RECOVERY_SCENARIO];
  const normal: Scenario = {
    id: "baseline",
    name: "Normal operations",
    deliveryOverrides: [],
    alternatives: [],
  };
  const receipt = data.deliveries[0];
  if (!receipt)
    return [
      normal,
      { ...normal, id: "disruption", name: "Disruption" },
      { ...normal, id: "recovery", name: "Recovery" },
    ];
  const date = new Date(`${receipt.availableDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 6);
  const disruption: Scenario = {
    id: "disruption",
    name: "Critical supplier disruption",
    deliveryOverrides: [
      {
        deliveryId: receipt.id,
        quantity: receipt.quantity,
        availableDate:
          date.getUTCFullYear() > 9999
            ? "9999-12-31"
            : date.toISOString().slice(0, 10),
      },
    ],
    alternatives: [],
  };
  const alt = data.alternatives.find(
    (a) => a.approved && a.componentId === receipt.componentId,
  );
  return [
    normal,
    disruption,
    {
      ...disruption,
      id: "recovery",
      name: "Approved recovery",
      alternatives: alt
        ? [
            {
              alternativeId: alt.id,
              quantity: alt.quantity,
              availableDate: alt.availableDate,
            },
          ]
        : [],
    },
  ];
}
function download(name: string, content: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function NodeDetail({
  selection,
  data,
  result,
  onClose,
}: {
  selection: Selection;
  data: Dataset;
  result: SimulationResult;
  onClose: () => void;
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
          <span className="eyebrow">
            {kind.toUpperCase()} / {id}
          </span>
          <h3>{title}</h3>
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
        <ImpactPanel data={data} result={result} selectedOrderId={id} />
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
export default function App() {
  const [data, setData] = useState<Dataset>(demoData);
  const presets = useMemo(() => presetsFor(data), [data]);
  const [scenario, setScenario] = useState<Scenario>(NORMAL_SCENARIO);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [controlError, setControlError] = useState("");
  const orderTable = useRef<HTMLElement>(null);
  const evidence = useRef<HTMLDivElement>(null);
  const reports = useMemo(
    () => presets.map((s) => simulate(data, s)),
    [data, presets],
  );
  const result = useMemo(() => simulate(data, scenario), [data, scenario]);
  const s = result.summary;
  const activePreset = presets.findIndex(
    (p) =>
      JSON.stringify(p.deliveryOverrides) ===
        JSON.stringify(scenario.deliveryOverrides) &&
      JSON.stringify(p.alternatives) === JSON.stringify(scenario.alternatives),
  );
  const update = (next: Scenario) => {
    try {
      setScenario(parseScenario(data, next));
      setControlError("");
    } catch (e) {
      setControlError(e instanceof Error ? e.message : "Invalid scenario");
    }
  };
  const choose = (i: number) => {
    setScenario(presets[i]);
    setControlError("");
    setNotice("");
  };
  const reset = () => {
    setData(demoData);
    setScenario(NORMAL_SCENARIO);
    setSelection(null);
    setNotice("Fictional demo restored. All scenario changes cleared.");
    setControlError("");
  };
  async function importFiles(files: File[]) {
    setImporting(true);
    setImportError("");
    try {
      if (files.some((file) => file.size > 2_000_000) || files.length > 5)
        throw new Error(
          "Choose up to five CSV files, each smaller than 2 MB, or one JSON dataset.",
        );
      const next = parseImportFiles(
        await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            text: await file.text(),
          })),
        ),
        data,
      );
      const nextPresets = presetsFor(next);
      simulate(next, nextPresets[0]);
      setData(next);
      setScenario(nextPresets[0]);
      setSelection(null);
      setImportOpen(false);
      setNotice(
        `Imported ${files.map((file) => file.name).join(", ")}. Baseline loaded with ${next.orders.length} orders.`,
      );
    } catch (e) {
      setImportError(
        e instanceof Error ? e.message : "Unable to read this file.",
      );
    } finally {
      setImporting(false);
    }
  }
  return (
    <div className="app-shell">
      <aside className="nav-rail" aria-label="Workspace navigation">
        <a className="domino-mark" href="#" aria-label="DominoOS home">
          <span />
          <span />
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="rail-active"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Command center"
        >
          <GitBranch />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            orderTable.current?.scrollIntoView({ behavior: "smooth" })
          }
          aria-label="Customer orders"
        >
          <LayoutDashboard />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setImportOpen(true)}
          aria-label="Import data"
        >
          <Box />
        </Button>
        <div className="rail-bottom">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHelpOpen(true)}
            aria-label="Model assumptions"
          >
            <CircleHelp />
          </Button>
          <span className="avatar">NP</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <a href="#" className="wordmark">
            domino<span>OS</span>
            <Badge variant="outline">PROTOTYPE</Badge>
          </a>
          <div className="manufacturer">
            <Factory size={15} />
            {data.name}
            <ChevronRight size={13} />
            <span>Command center</span>
          </div>
          <div className="top-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImportOpen(true)}
            >
              <Upload data-icon="inline-start" />
              Import data
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw data-icon="inline-start" />
              Reset demo
            </Button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="live-dot" /> MANUFACTURING INTELLIGENCE
              </div>
              <h1>
                See what breaks<span> before it breaks.</span>
              </h1>
              <p>
                Turn a spreadsheet material plan into an explainable what-if.
              </p>
            </div>
            <div className="dataset-label">
              <Badge variant="outline">
                {data === demoData ? "FICTIONAL DEMO DATA" : "IMPORTED DATA"}
              </Badge>
              <span>
                Inventory as of {day(data.asOf)} {data.asOf.slice(0, 4)}
              </span>
            </div>
          </div>
          {notice && (
            <div className="notice" role="status">
              <CheckCircle2 size={16} />
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <section
            className="metrics"
            aria-label="Simulation summary"
            aria-live="polite"
          >
            <div>
              <span>Customer orders</span>
              <strong>{s.totalOrders.toString().padStart(2, "0")}</strong>
              <small>Across {data.products.length} products</small>
            </div>
            <div className={s.atRiskOrders ? "metric-risk" : ""}>
              <span>
                Orders at risk
                <TriangleAlert size={13} />
              </span>
              <strong>{s.atRiskOrders.toString().padStart(2, "0")}</strong>
              <small>
                {s.atRiskOrders
                  ? "Due to material shortage"
                  : "All material requirements covered"}
              </small>
            </div>
            <div className={s.missingUnits ? "metric-risk" : ""}>
              <span>Missing component units</span>
              <strong>{s.missingUnits.toString().padStart(2, "0")}</strong>
              <small>Uncovered by required dates</small>
            </div>
            <div>
              <span>Affected products</span>
              <strong>{s.affectedProducts.toString().padStart(2, "0")}</strong>
              <small>Of {data.products.length} in the network</small>
            </div>
          </section>
          <div className="scenario-strip">
            <div>
              <GitBranch size={16} />
              <span>SCENARIO</span>
            </div>
            <ToggleGroup
              type="single"
              value={activePreset >= 0 ? String(activePreset) : "custom"}
              onValueChange={(v) => {
                if (v && v !== "custom") choose(Number(v));
              }}
              aria-label="Scenario selector"
            >
              <ToggleGroupItem value="0">
                <span>01</span> Normal operations
              </ToggleGroupItem>
              <ToggleGroupItem value="1">
                <span>02</span> Supplier disruption
              </ToggleGroupItem>
              <ToggleGroupItem value="2">
                <span>03</span> Approved recovery
              </ToggleGroupItem>
              {activePreset < 0 && (
                <ToggleGroupItem value="custom">
                  Custom scenario
                </ToggleGroupItem>
              )}
            </ToggleGroup>
            <span className="calculation-status">
              <Activity size={13} />
              Deterministic · live
            </span>
          </div>
          <div className="workbench">
            <div className="main-column">
              <SupplyGraph
                data={data}
                result={result}
                scenario={scenario}
                onSelect={setSelection}
                selected={selection}
              />
              <section
                className={`outcome-banner ${s.atRiskOrders ? "outcome-risk" : ""}`}
                aria-live="polite"
              >
                <span className="outcome-icon">
                  {s.atRiskOrders ? <TriangleAlert /> : <ShieldCheck />}
                </span>
                <div>
                  <strong>
                    {s.atRiskOrders
                      ? `${s.atRiskOrders} order${s.atRiskOrders === 1 ? "" : "s"} at risk due to material shortage`
                      : "Every order has its required materials"}
                  </strong>
                  <p>
                    {s.atRiskOrders
                      ? `${money(s.atRiskValue)} in order value at material risk. ${s.missingUnits} component units remain uncovered.`
                      : "Material availability is covered by the required dates under this allocation policy."}
                  </p>
                </div>
                <Badge variant="outline">
                  {s.atRiskOrders ? "ACTION NEEDED" : "MATERIAL COVERED"}
                </Badge>
              </section>
              <div ref={evidence}>
                {selection ? (
                  <NodeDetail
                    selection={selection}
                    data={data}
                    result={result}
                    onClose={() => setSelection(null)}
                  />
                ) : (
                  <div className="evidence-default">
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">ALLOCATION EVIDENCE</span>
                        <h3>
                          {s.atRiskOrders
                            ? "Understand the weak link"
                            : "A plan you can inspect"}
                        </h3>
                      </div>
                      <Badge variant="secondary">AUDITABLE</Badge>
                    </div>
                    <ImpactPanel data={data} result={result} />
                  </div>
                )}
              </div>
            </div>
            <aside className="scenario-sidebar">
              <div className="sidebar-heading">
                <span className="eyebrow">WHAT-IF WORKSPACE</span>
                <h2>
                  <Zap size={19} />
                  Scenario lab
                </h2>
                <p>Change the input. Watch the chain react.</p>
              </div>
              {controlError && (
                <Alert variant="destructive">
                  <AlertTitle>Scenario not applied</AlertTitle>
                  <AlertDescription>{controlError}</AlertDescription>
                </Alert>
              )}
              <ScenarioPanel
                key={data.name + scenario.id}
                data={data}
                scenario={scenario}
                onChange={update}
              />
              <div className="policy-note">
                <ShieldCheck size={16} />
                <p>
                  <strong>Material availability only.</strong> Earliest required
                  date, then order ID. Partial kits reserve stock. Capacity and
                  shipment timing are outside this model.
                </p>
              </div>
            </aside>
          </div>
          {s.atRiskOrders > 0 && (
            <RecoveryComparison
              data={data}
              scenario={scenario}
              onApply={update}
            />
          )}
          <section className="comparison-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DECISION SNAPSHOT</span>
                <h2>Three scenarios. One clear decision.</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  download(
                    "domino-scenario-report.json",
                    JSON.stringify(
                      {
                        dataset: data.name,
                        dataProvenance:
                          data === demoData
                            ? "Fictional demonstration"
                            : "User-provided, unverified",
                        inputs: data,
                        policy:
                          "Partial component reservations, earliest required date then order ID; material availability only.",
                        scenario,
                        result,
                        comparison: reports,
                      },
                      null,
                      2,
                    ),
                  )
                }
              >
                <ArrowDownToLine data-icon="inline-start" />
                Export report
              </Button>
            </div>
            <div className="comparison-grid">
              {reports.map((r, i) => (
                <button
                  key={i}
                  className={`comparison-item comparison-${i} ${activePreset === i ? "comparison-active" : ""}`}
                  onClick={() => choose(i)}
                >
                  <div className="comparison-top">
                    <span>
                      0{i + 1} / {["BASELINE", "DISRUPTION", "RECOVERY"][i]}
                    </span>
                    {activePreset === i ? (
                      <Check size={15} />
                    ) : (
                      <ArrowRight size={15} />
                    )}
                  </div>
                  <h3>
                    {
                      [
                        "Business as usual",
                        "A delivery slips",
                        "A qualified alternative",
                      ][i]
                    }
                  </h3>
                  <div className="comparison-numbers">
                    <div>
                      <strong
                        className={r.summary.atRiskOrders ? "risk-text" : ""}
                      >
                        {r.summary.atRiskOrders}
                      </strong>
                      <span>orders at risk</span>
                    </div>
                    <div>
                      <strong>{r.summary.missingUnits}</strong>
                      <span>units missing</span>
                    </div>
                    <div>
                      <strong>{r.summary.affectedComponents}</strong>
                      <span>components</span>
                    </div>
                  </div>
                  <p>
                    {money(r.summary.atRiskValue)} order value at material risk
                  </p>
                </button>
              ))}
            </div>
          </section>
          <section className="orders-section" ref={orderTable}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">CUSTOMER COMMITMENTS</span>
                <h2>The order book</h2>
              </div>
              <span className="muted-small">
                Allocated by required date, then order ID
              </span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Order / customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Required by</th>
                    <th>Order value</th>
                    <th>Material status</th>
                    <th>
                      <span className="sr-only">Inspect order</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.orders.map((r) => {
                    const o = data.orders.find((x) => x.id === r.orderId)!;
                    return (
                      <tr
                        key={o.id}
                        className={r.status === "at-risk" ? "at-risk-row" : ""}
                      >
                        <td>
                          <strong>{o.id}</strong>
                          <span>{o.customer}</span>
                        </td>
                        <td>
                          {
                            data.products.find((p) => p.id === o.productId)
                              ?.name
                          }
                        </td>
                        <td>{o.quantity}</td>
                        <td>{day(o.requiredDate)}</td>
                        <td>{money(o.value)}</td>
                        <td>
                          <span
                            className={`order-status ${r.status === "at-risk" ? "risk-text" : "success-text"}`}
                          >
                            {r.status === "at-risk" ? (
                              <TriangleAlert size={13} />
                            ) : (
                              <CheckCircle2 size={13} />
                            )}{" "}
                            {r.status === "at-risk"
                              ? `At risk · ${r.lines.reduce((s, l) => s + l.shortage, 0)} units short`
                              : "Material covered"}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Inspect ${o.id}`}
                            onClick={() => {
                              setSelection({ kind: "order", id: o.id });
                              requestAnimationFrame(() =>
                                evidence.current?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                }),
                              );
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
            <span>
              <span className="footer-mark">▰</span> DominoOS{" "}
              <span className="muted-small">/ Unfair Weekend 2026</span>
            </span>
            <span>Deterministic inputs. Explainable decisions.</span>
            <button onClick={() => setHelpOpen(true)}>
              Model assumptions <ArrowRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bring your material plan</DialogTitle>
            <DialogDescription>
              Replace the dataset with JSON, or select spreadsheet CSV tables
              together. Everything stays in your browser.
            </DialogDescription>
          </DialogHeader>
          <div className="import-zone">
            <Upload size={26} />
            <label htmlFor="data-upload">
              {importing ? "Validating data…" : "Choose a JSON or CSV file"}
            </label>
            <input
              id="data-upload"
              type="file"
              accept=".json,.csv,application/json,text/csv"
              multiple
              disabled={importing}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) void importFiles(files);
                e.target.value = "";
              }}
            />
            <p>
              Up to five CSVs, 2 MB each. All files validate together; a failed
              import leaves your plan unchanged.
            </p>
          </div>
          {importError && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertTitle>Import rejected</AlertTitle>
              <AlertDescription className="import-error">
                {importError}
              </AlertDescription>
            </Alert>
          )}
          <p className="muted-small">
            CSV types: inventory, products, BOM, orders, deliveries. Headers
            identify each table, which replaces its existing rows. Select new
            products and their BOM together. A BOM file replaces all product
            BOMs. Suppliers, components and approved alternatives stay in the
            current catalog; use JSON to replace them.
          </p>
          <div className="flex flex-wrap gap-2">
            {["inventory", "products", "bom", "orders"].map((table) => (
              <a
                className="text-sm underline"
                key={table}
                href={`/examples/${table}.csv`}
                download
              >
                {table} template
              </a>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                download("domino-demo.json", JSON.stringify(demoData, null, 2))
              }
            >
              Download example JSON
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                download(
                  "deliveries-example.csv",
                  "id,supplierId,componentId,quantity,availableDate\n" +
                    data.deliveries
                      .map((d) =>
                        [
                          d.id,
                          d.supplierId,
                          d.componentId,
                          d.quantity,
                          d.availableDate,
                        ].join(","),
                      )
                      .join("\n"),
                  "text/csv",
                )
              }
            >
              Example CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>A clear model. Clear limits.</DialogTitle>
            <DialogDescription>
              DominoOS simulates material availability, using deterministic
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
