import { useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  parseImportBundle,
  parseScenario,
  type ImportResult,
} from "@/lib/validation";
import type {
  Dataset,
  DatasetProvenance,
  DatasetTable,
  Scenario,
  SimulationResult,
} from "@/lib/types";
import {
  fictionalProvenance,
  provenanceAfterImport,
  provenanceLabel,
} from "@/lib/provenance";
import { withReceiptDate } from "@/lib/receipts";
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
const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
const tableLabel = (table: DatasetTable) =>
  table === "alternatives" ? "approved alternatives" : table;

interface PendingImport extends ImportResult {
  fileNames: string[];
  provenance: DatasetProvenance;
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
  const [provenance, setProvenance] = useState<DatasetProvenance>(() =>
    fictionalProvenance(),
  );
  const presets = useMemo(() => presetsFor(data), [data]);
  const [scenario, setScenario] = useState<Scenario>(NORMAL_SCENARIO);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
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
    setProvenance(fictionalProvenance());
    setScenario(NORMAL_SCENARIO);
    setSelection(null);
    setNotice("Fictional demo restored. All scenario changes cleared.");
    setControlError("");
  };
  async function importFiles(files: File[]) {
    setImporting(true);
    setImportError("");
    setPendingImport(null);
    try {
      if (files.some((file) => file.size > 2_000_000) || files.length > 5)
        throw new Error(
          "Choose up to five CSV files, each smaller than 2 MB, or one JSON dataset.",
        );
      const parsed = parseImportBundle(
        await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            text: await file.text(),
          })),
        ),
        data,
      );
      simulate(parsed.data, presetsFor(parsed.data)[0]);
      setPendingImport({
        ...parsed,
        fileNames: files.map((file) => file.name),
        provenance: provenanceAfterImport(
          provenance,
          parsed.replacedTables,
        ),
      });
    } catch (e) {
      setImportError(
        e instanceof Error ? e.message : "Unable to read this file.",
      );
    } finally {
      setImporting(false);
    }
  }
  function confirmImport() {
    if (!pendingImport) return;
    const nextPresets = presetsFor(pendingImport.data);
    setData(pendingImport.data);
    setProvenance(pendingImport.provenance);
    setScenario(nextPresets[0]);
    setSelection(null);
    setImportOpen(false);
    setNotice(
      `Imported ${pendingImport.fileNames.join(", ")}. ${provenanceLabel(pendingImport.provenance.kind)} is active with ${pendingImport.data.orders.length} orders.`,
    );
    setPendingImport(null);
  }
  const firstRisk = result.orders.find((o) => o.status === "at-risk");
  const firstShort = firstRisk?.lines.find((l) => l.shortage > 0);
  const cause = (() => {
    if (!firstRisk || !firstShort) return null;
    const order = data.orders.find((o) => o.id === firstRisk.orderId);
    const component = data.components.find(
      (c) => c.id === firstShort.componentId,
    );
    const late = firstShort.lateDeliveries[0];
    return `${firstRisk.orderId} for ${order?.customer ?? "a customer"} needs ${firstShort.required} × ${component?.name.toLowerCase() ?? firstShort.componentId} by ${day(firstRisk.requiredDate)}. ${firstShort.shortage} ${firstShort.shortage === 1 ? "is" : "are"} missing${late ? `: receipt ${late.id} now lands ${day(late.availableDate)}` : ""}.`;
  })();
  const scenarioNames = [
    "Normal operations",
    "Supplier disruption",
    "Approved recovery",
  ];
  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#" className="wordmark" aria-label="DominoOS home">
          <span className="domino-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          DominoOS
        </a>
        <p className="dataset-line">
          <span>{data.name}</span>
          <span>
            Inventory as of {day(data.asOf)} {data.asOf.slice(0, 4)}
          </span>
          <span className="dataset-kind">
            {provenanceLabel(provenance.kind)}
          </span>
        </p>
        <div className="top-actions">
          <Button variant="ghost" size="sm" onClick={() => setHelpOpen(true)}>
            <CircleHelp data-icon="inline-start" />
            <span className="label-wide">Assumptions</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setImportOpen(true)}>
            <Upload data-icon="inline-start" />
            Import data
          </Button>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw data-icon="inline-start" />
            Reset demo
          </Button>
        </div>
      </header>
      <div className="scenario-strip">
        <span className="strip-label" id="scenario-label">
          Scenario
        </span>
        <ToggleGroup
          type="single"
          value={activePreset >= 0 ? String(activePreset) : "custom"}
          onValueChange={(v) => {
            if (v && v !== "custom") choose(Number(v));
          }}
          aria-labelledby="scenario-label"
        >
          {scenarioNames.map((name, i) => (
            <ToggleGroupItem key={name} value={String(i)}>
              {name}
            </ToggleGroupItem>
          ))}
          {activePreset < 0 && (
            <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
          )}
        </ToggleGroup>
        <p
          className={`strip-status ${s.atRiskOrders ? "is-short" : ""}`}
          aria-hidden="true"
        >
          {s.atRiskOrders ? (
            <>
              <i className="hatch-chip" />
              {s.atRiskOrders} short · {s.missingUnits} units ·{" "}
              {money(s.atRiskValue)}
            </>
          ) : (
            <>
              <Check size={14} /> All {s.totalOrders} covered
            </>
          )}
        </p>
      </div>
      <main>
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
          className={`outcome-banner ${s.atRiskOrders ? "outcome-risk" : ""}`}
          aria-label="Simulation summary"
          aria-live="polite"
        >
          <div className="outcome-copy">
            <h1>
              {s.atRiskOrders
                ? `${s.atRiskOrders} order${s.atRiskOrders === 1 ? "" : "s"} at risk due to material shortage`
                : "Every order has its required materials"}
            </h1>
            <p>
              {s.atRiskOrders
                ? `${money(s.atRiskValue)} in order value at material risk. ${s.missingUnits} component units remain uncovered. ${cause ?? ""}`
                : `All material requirements covered by the required dates for ${s.totalOrders} orders across ${data.products.length} products.`}
            </p>
          </div>
          <dl className="figures">
            <div className={s.atRiskOrders ? "is-short" : ""}>
              <dt>Orders at risk</dt>
              <dd>{s.atRiskOrders}</dd>
              <dd className="figure-note">
                {s.atRiskOrders
                  ? "Due to material shortage"
                  : "All material requirements covered"}
              </dd>
            </div>
            <div className={s.missingUnits ? "is-short" : ""}>
              <dt>Units missing</dt>
              <dd>{s.missingUnits}</dd>
              <dd className="figure-note">By required dates</dd>
            </div>
            <div>
              <dt>Products affected</dt>
              <dd>{s.affectedProducts}</dd>
              <dd className="figure-note">Of {data.products.length}</dd>
            </div>
          </dl>
        </section>
        <div className="workbench">
          <div className="main-column">
            <SupplyGraph
              data={data}
              result={result}
              scenario={scenario}
              onSelect={setSelection}
              selected={selection}
              onMoveReceipt={(id, date) =>
                update(withReceiptDate(data, scenario, id, date))
              }
            />
            {s.atRiskOrders > 0 && (
              <RecoveryComparison
                data={data}
                scenario={scenario}
                onApply={update}
              />
            )}
            <div ref={evidence} className="evidence-anchor">
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
                    <h2>Allocation evidence</h2>
                    <p className="section-note">
                      Stock is reserved by required date, then order ID.
                    </p>
                  </div>
                  <ImpactPanel data={data} result={result} />
                </div>
              )}
            </div>
          </div>
          <aside className="scenario-sidebar">
            <div className="sidebar-heading">
              <h2>Change the inputs</h2>
              <p>Every change recalculates the whole order book.</p>
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
              <ShieldCheck size={16} aria-hidden="true" />
              <p>
                <strong>Material availability only.</strong> Earliest required
                date, then order ID. Partial kits reserve stock. Capacity and
                shipment timing are outside this model.
              </p>
            </div>
          </aside>
        </div>
        <section className="comparison-section" aria-labelledby="compare-title">
          <div className="section-heading">
            <h2 id="compare-title">Scenarios side by side</h2>
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
                        provenance,
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
                    Value at risk
                  </th>
                  <th scope="col">
                    <span className="sr-only">Load scenario</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr
                    key={i}
                    className={activePreset === i ? "is-current" : ""}
                    aria-current={activePreset === i ? "true" : undefined}
                  >
                    <th scope="row">
                      {scenarioNames[i]}
                      {activePreset === i && (
                        <span className="current-tag">Showing</span>
                      )}
                    </th>
                    <td
                      className={`num ${r.summary.atRiskOrders ? "short-text" : ""}`}
                    >
                      {r.summary.atRiskOrders}
                    </td>
                    <td className="num">{r.summary.missingUnits}</td>
                    <td className="num">{money(r.summary.atRiskValue)}</td>
                    <td className="row-action">
                      {activePreset !== i && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => choose(i)}
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
        <section className="orders-section" ref={orderTable}>
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
                        {data.products.find((p) => p.id === o.productId)?.name}
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
                            requestAnimationFrame(() =>
                              evidence.current?.scrollIntoView({
                                behavior: reducedMotion() ? "auto" : "smooth",
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
          <span>DominoOS · Unfair Weekend 2026</span>
          <button onClick={() => setHelpOpen(true)}>
            Model assumptions <ArrowRight size={14} />
          </button>
        </footer>
      </main>
      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) {
            setImportError("");
            setPendingImport(null);
          }
        }}
      >
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
          {pendingImport && (
            <div className="import-preview" role="region" aria-live="polite">
              <div>
                <p className="eyebrow">Import preview</p>
                <h3>{provenanceLabel(pendingImport.provenance.kind)}</h3>
                <p>
                  <strong>Replace:</strong>{" "}
                  {pendingImport.replacedTables.map(tableLabel).join(", ")}.
                </p>
                <p>
                  <strong>Keep existing:</strong>{" "}
                  {pendingImport.retainedTables.length
                    ? `${pendingImport.retainedTables.map(tableLabel).join(", ")}.`
                    : "Nothing — this is a complete dataset replacement."}
                </p>
              </div>
              {pendingImport.provenance.kind === "mixed" && (
                <Alert>
                  <TriangleAlert />
                  <AlertTitle>Fictional and imported data will mix</AlertTitle>
                  <AlertDescription>
                    Results will combine your imported tables with retained
                    values from the fictional demo or an earlier import. Check
                    IDs and relationships before using the analysis.
                  </AlertDescription>
                </Alert>
              )}
              <div className="import-preview-actions">
                <Button
                  variant="outline"
                  onClick={() => setPendingImport(null)}
                >
                  Choose different files
                </Button>
                <Button onClick={confirmImport}>
                  {pendingImport.provenance.kind === "mixed"
                    ? "Import and mix data"
                    : "Apply import"}
                </Button>
              </div>
            </div>
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
            <DialogTitle>Model assumptions</DialogTitle>
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
