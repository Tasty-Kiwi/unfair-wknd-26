import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BuildWorkspace } from "./BuildWorkspace";
import { NamedScenarios } from "@/components/scenarios/NamedScenarios";
import {
  createBlankDocument,
  createCoreExample,
} from "@/lib/builder/factories";
import { compileGraph } from "@/lib/builder/compiler";
import {
  loadWorkspace,
  saveWorkspace,
  serializeWorkspace,
  parseWorkspaceJson,
  MAX_WORKSPACE_BYTES,
} from "@/lib/builder/storage";
import {
  isScenarioCurrent,
  receiptReviewContext,
  revalidateScenario,
} from "@/lib/builder/scenarios";
import type {
  BuilderDocument,
  BuilderWorkspaceV1,
  ScenarioRecord,
} from "@/lib/builder/types";
import { parseScenario } from "@/lib/validation";
import { simulate } from "@/lib/simulation";
import { withReceiptDate } from "@/lib/receipts";
import { SupplyGraph, type Selection } from "@/components/graph/SupplyGraph";
import { ScenarioPanel } from "@/components/scenarios/ScenarioPanel";
import { ImpactPanel } from "@/components/scenarios/ImpactPanel";
import type { Scenario } from "@/lib/types";
import "./experience.css";

const BASELINE: Scenario = {
  id: "builder-baseline",
  name: "Baseline",
  deliveryOverrides: [],
  alternatives: [],
};
const money = (value: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to complete this action.";
const clone = <T,>(value: T): T => structuredClone(value);

function blank(): BuilderWorkspaceV1 {
  return {
    format: "dominoos-builder-workspace",
    version: 1,
    document: createBlankDocument(),
    scenarios: [],
    selectedScenarioId: null,
    workingScenario: null,
    source: { origin: "authored", openedFromFile: false },
  };
}

export function BuilderExperience({ onClose }: { onClose: () => void }) {
  const [initial] = useState(() => loadWorkspace());
  const [workspace, setWorkspace] = useState<BuilderWorkspaceV1>(
    () => initial.workspace ?? blank(),
  );
  const latest = useRef(workspace);
  const lastSaved = useRef<BuilderWorkspaceV1 | null>(initial.workspace);
  const [allowSave, setAllowSave] = useState(!initial.error);
  const [saveStatus, setSaveStatus] = useState(
    initial.workspace ? "Restored locally" : "Not saved locally",
  );
  const [error, setError] = useState(initial.error ?? "");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<"build" | "simulate">("build");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [compare, setCompare] = useState(false);
  const [canvasSession, setCanvasSession] = useState(0);
  const [importing, setImporting] = useState(false);
  const compiled = useMemo(
    () => compileGraph(workspace.document),
    [workspace.document],
  );
  const record = workspace.workingScenario;
  const scenario = record?.scenario ?? BASELINE;
  const current =
    !record || (compiled.ok && isScenarioCurrent(record, compiled.networkKey));
  const savedRecord = record
    ? workspace.scenarios.find(
        (item) => item.scenario.id === record.scenario.id,
      )
    : undefined;
  const scenarioDirty =
    !!record &&
    (!savedRecord ||
      JSON.stringify(record.scenario) !== JSON.stringify(savedRecord.scenario));

  function change(
    next:
      | BuilderWorkspaceV1
      | ((previous: BuilderWorkspaceV1) => BuilderWorkspaceV1),
  ) {
    const value = typeof next === "function" ? next(latest.current) : next;
    latest.current = value;
    setWorkspace(value);
    setSaveStatus("Changes not saved");
    setNotice("");
  }

  useEffect(() => {
    if (!allowSave) return;
    setSaveStatus("Saving…");
    const timer = window.setTimeout(() => {
      const saved = saveWorkspace(workspace);
      if (latest.current !== workspace) return;
      if (saved.ok) {
        lastSaved.current = workspace;
        setSaveStatus("Saved locally");
      } else {
        setSaveStatus("Changes not saved");
        setError(saved.error);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [workspace, allowSave]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (latest.current === lastSaved.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, []);

  // Results are derived from the CURRENT validated inputs only. There is no
  // historical result state that could be paired with a new scenario or graph.
  const assessment = useMemo(() => {
    if (
      view !== "simulate" ||
      !compiled.ok ||
      !compiled.canSimulate ||
      !current
    )
      return null;
    try {
      const validated = parseScenario(compiled.dataset, scenario);
      return {
        result: simulate(compiled.dataset, validated),
        baseline: simulate(compiled.dataset, BASELINE),
        scenario: validated,
        error: null,
      };
    } catch (caught) {
      return {
        result: null,
        baseline: null,
        scenario: null,
        error: message(caught),
      };
    }
  }, [view, compiled, current, scenario]);

  function updateDocument(document: BuilderDocument) {
    change((previous) => ({ ...previous, document }));
    setSelection(null);
    setError("");
  }

  function run() {
    if (!compiled.ok) {
      setError("Fix all network issues before running.");
      return;
    }
    if (!compiled.canSimulate) {
      setError("Add at least one customer order before running.");
      return;
    }
    if (!current) {
      setError(
        "Review and revalidate this scenario before running it on the changed network.",
      );
      return;
    }
    try {
      parseScenario(compiled.dataset, scenario);
      setView("simulate");
      setError("");
      setNotice("");
    } catch (caught) {
      setError(message(caught));
    }
  }

  function updateScenario(next: Scenario) {
    if (!compiled.ok || !record || !current) return;
    try {
      const validated = parseScenario(compiled.dataset, next);
      change((previous) => ({
        ...previous,
        workingScenario: {
          scenario: validated,
          validatedNetworkKey: record.validatedNetworkKey,
        },
      }));
      setError("");
    } catch (caught) {
      setError(message(caught));
    }
  }

  function saveScenario() {
    if (!record || !compiled.ok || !compiled.canSimulate) {
      setError("Create a scenario for a complete network before saving it.");
      return;
    }
    if (!current) {
      setError(
        "Revalidate this scenario explicitly before saving it for the changed network.",
      );
      return;
    }
    try {
      const validated = parseScenario(compiled.dataset, record.scenario);
      const next: ScenarioRecord = {
        scenario: validated,
        validatedNetworkKey: compiled.networkKey,
      };
      change((previous) => ({
        ...previous,
        scenarios: [
          ...previous.scenarios.filter(
            (item) => item.scenario.id !== validated.id,
          ),
          clone(next),
        ],
        selectedScenarioId: validated.id,
        workingScenario: clone(next),
      }));
      setNotice("Scenario saved.");
      setError("");
    } catch (caught) {
      setError(message(caught));
    }
  }

  function canSwitchScenario() {
    return (
      !scenarioDirty ||
      window.confirm(
        "Discard unsaved scenario changes? Cancel to keep editing, then Save scenario to keep them.",
      )
    );
  }

  function newScenario() {
    if (!canSwitchScenario()) return;
    const next: ScenarioRecord = {
      scenario: {
        id: crypto.randomUUID(),
        name: "New scenario",
        deliveryOverrides: [],
        alternatives: [],
      },
      validatedNetworkKey: compiled.ok ? compiled.networkKey : null,
    };
    change((previous) => ({
      ...previous,
      selectedScenarioId: null,
      workingScenario: next,
    }));
    setError("");
  }

  function selectScenario(id: string | null) {
    if (id === record?.scenario.id || (!id && !record)) return;
    if (!canSwitchScenario()) return;
    const chosen = id
      ? workspace.scenarios.find((item) => item.scenario.id === id)
      : null;
    if (id && !chosen) return;
    change((previous) => ({
      ...previous,
      selectedScenarioId: id,
      workingScenario: chosen ? clone(chosen) : null,
    }));
    setError("");
  }

  function revalidate() {
    if (!compiled.ok || !record) return;
    try {
      const next = revalidateScenario(
        compiled.dataset,
        compiled.networkKey,
        record,
      );
      change((previous) => ({
        ...previous,
        workingScenario: next,
        scenarios: previous.scenarios.map((item) =>
          item.scenario.id === next.scenario.id &&
          JSON.stringify(item.scenario) === JSON.stringify(next.scenario)
            ? { ...item, validatedNetworkKey: next.validatedNetworkKey }
            : item,
        ),
      }));
      setError("");
      setNotice("Scenario revalidated against the current network.");
    } catch (caught) {
      setError(message(caught));
    }
  }

  function saveLocal() {
    if (
      !allowSave &&
      !window.confirm(
        "Replace the unreadable saved workspace with this draft? Export any data you need first.",
      )
    )
      return false;
    const saved = saveWorkspace(latest.current);
    if (!saved.ok) {
      setError(saved.error);
      setSaveStatus("Changes not saved");
      return false;
    }
    lastSaved.current = latest.current;
    setAllowSave(true);
    setSaveStatus("Saved locally");
    setError("");
    return true;
  }

  function close() {
    if (latest.current !== lastSaved.current && !saveLocal()) return;
    onClose();
  }

  function replace(next: BuilderWorkspaceV1) {
    const previous = latest.current;
    const containsWork =
      previous.document.nodes.length > 0 ||
      previous.document.name.trim() ||
      previous.document.asOf.trim() ||
      previous.scenarios.length > 0 ||
      previous.workingScenario;
    if (
      (containsWork || !allowSave) &&
      !window.confirm(
        "Replace the current network and its scenarios? Export workspace JSON first if you want to keep it.",
      )
    )
      return false;
    change(next);
    setCanvasSession((session) => session + 1);
    setAllowSave(true);
    setView("build");
    setSelection(null);
    setCompare(false);
    setError("");
    return true;
  }

  function exportJson() {
    try {
      const text = serializeWorkspace(latest.current);
      const url = URL.createObjectURL(
        new Blob([text], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "dominoos-workspace.json";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError("");
    } catch (caught) {
      setError(message(caught));
    }
  }

  async function importJson(file: File) {
    const captured = latest.current;
    setImporting(true);
    try {
      if (file.size > MAX_WORKSPACE_BYTES)
        throw new Error("Workspace file exceeds the 2 MB limit.");
      const next = parseWorkspaceJson(await file.text());
      if (latest.current !== captured)
        throw new Error(
          "Your workspace changed while reading the file. Import it again to replace the current version.",
        );
      replace({ ...next, source: { ...next.source, openedFromFile: true } });
    } catch (caught) {
      setError(message(caught));
    } finally {
      setImporting(false);
    }
  }

  const source =
    workspace.source.origin === "fictional"
      ? "Fictional example"
      : "Authored in builder";
  const issues = compiled.ok ? [] : compiled.issues;
  return (
    <main className="builder-experience" aria-label="Supply chain builder">
      <header className="builder-experience__header">
        <div>
          <p className="builder-experience__source">
            {source}
            {workspace.source.openedFromFile ? " · Imported workspace" : ""}
          </p>
          <h1>{workspace.document.name || "Build a network"}</h1>
          <p>Build your material plan, then test a named disruption.</p>
        </div>
        <Button variant="outline" onClick={close}>
          <ArrowLeft data-icon="inline-start" /> Back to Simulate
        </Button>
      </header>

      <nav
        className="builder-experience__actions"
        aria-label="Workspace actions"
      >
        <Button variant="outline" onClick={() => replace(blank())}>
          New blank
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            replace({
              ...blank(),
              document: createCoreExample(),
              source: { origin: "fictional", openedFromFile: false },
            })
          }
        >
          Core example
        </Button>
        <Button
          variant={view === "build" ? "default" : "outline"}
          aria-pressed={view === "build"}
          onClick={() => setView("build")}
        >
          Build
        </Button>
        <Button
          variant={view === "simulate" ? "default" : "outline"}
          aria-pressed={view === "simulate"}
          onClick={run}
        >
          Simulate
        </Button>
        <Button variant="outline" onClick={saveLocal}>
          <Save data-icon="inline-start" /> Save workspace
        </Button>
        <Button variant="outline" onClick={exportJson}>
          <Download data-icon="inline-start" /> Export workspace JSON
        </Button>
        <label className="builder-experience__import">
          <Upload aria-hidden size={14} /> Import workspace JSON
          <input
            type="file"
            aria-label="Import workspace JSON"
            accept="application/json,.json"
            disabled={importing}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importJson(file);
              event.target.value = "";
            }}
          />
        </label>
        <span role="status" className="builder-experience__save">
          {importing ? "Reading workspace…" : saveStatus}
        </span>
      </nav>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Action could not complete</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <p role="status" className="builder-experience__notice">
          {notice}
        </p>
      )}

      <NamedScenarios
        records={workspace.scenarios}
        selectedId={record?.scenario.id ?? null}
        name={record?.scenario.name ?? ""}
        dirty={scenarioDirty}
        networkKey={compiled.ok ? compiled.networkKey : null}
        onName={(name) => {
          if (record)
            change((previous) => ({
              ...previous,
              workingScenario: {
                ...record,
                scenario: { ...record.scenario, name },
              },
            }));
        }}
        onNew={newScenario}
        onSave={saveScenario}
        onSelect={selectScenario}
        onCompare={() => {
          setCompare(true);
          run();
        }}
      />

      {record && !current && (
        <section
          className="builder-experience__review"
          aria-label="Scenario requires review"
        >
          <h2>Scenario requires review</h2>
          <p>
            The material network changed. Your scenario inputs are unchanged.
            The same receipt may now supply different materials. Review these
            inputs before using them with this network.
          </p>
          <ul>
            {record.scenario.deliveryOverrides.map((override) => {
              const context = compiled.ok
                ? receiptReviewContext(compiled.dataset, override.deliveryId)
                : null;
              return (
                <li key={override.deliveryId}>
                  <p>
                    <strong>Receipt {override.deliveryId}</strong>
                  </p>
                  {context ? (
                    <>
                      <p>
                        Current supplier: {context.supplier.name} (
                        {context.supplier.id})
                      </p>
                      <p>
                        Current component: {context.component.name} (
                        {context.component.id})
                      </p>
                      <p>
                        Current plan: {context.receipt.quantity}{" "}
                        {context.component.unit} on{" "}
                        {context.receipt.availableDate}
                      </p>
                    </>
                  ) : (
                    <p>
                      {compiled.ok
                        ? "This receipt no longer exists in the network. Remove its override before revalidating."
                        : "Repair the network to review the receipt’s current supplier and component."}
                    </p>
                  )}
                  <p>
                    Scenario override: {override.quantity} units on{" "}
                    {override.availableDate}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      change((previous) => ({
                        ...previous,
                        workingScenario: {
                          ...record,
                          scenario: {
                            ...record.scenario,
                            deliveryOverrides:
                              record.scenario.deliveryOverrides.filter(
                                (item) =>
                                  item.deliveryId !== override.deliveryId,
                              ),
                          },
                        },
                      }))
                    }
                  >
                    Remove override {override.deliveryId}
                  </Button>
                </li>
              );
            })}
          </ul>
          <Button
            variant="outline"
            disabled={!compiled.ok}
            onClick={revalidate}
          >
            Revalidate scenario
          </Button>
        </section>
      )}

      {view === "build" ? (
        <BuildWorkspace
          key={`${workspace.document.id}:${canvasSession}`}
          document={workspace.document}
          onChange={updateDocument}
          issues={issues}
          onValidate={() => {
            if (compiled.ok) {
              setError("");
              setNotice(
                compiled.canSimulate
                  ? "Network is valid and ready to simulate."
                  : "Network is valid. Add a customer order to simulate.",
              );
            } else {
              setError("Fix the listed network issues before running.");
            }
          }}
          onRun={run}
        />
      ) : assessment?.result &&
        assessment.baseline &&
        assessment.scenario &&
        compiled.ok ? (
        <div className="builder-experience__simulation">
          <section aria-label="Simulation summary" className="outcome-banner">
            <div>
              <h2>
                {assessment.result.summary.atRiskOrders
                  ? `${assessment.result.summary.atRiskOrders} order${assessment.result.summary.atRiskOrders === 1 ? "" : "s"} at risk due to material shortage`
                  : "Every order has its required materials"}
              </h2>
              <p>
                {scenario.name}
                {scenarioDirty ? " — unsaved changes" : ""}.{" "}
                {assessment.result.summary.missingUnits} component units
                missing.
              </p>
            </div>
          </section>
          {compare && (
            <section
              aria-label="Baseline comparison"
              className="builder-experience__comparison"
            >
              <h2>Compare with baseline</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Scenario</th>
                      <th>Orders at risk</th>
                      <th>Units missing</th>
                      <th>Value at risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: "Baseline",
                        summary: assessment.baseline.summary,
                      },
                      {
                        name:
                          scenario.name +
                          (scenarioDirty ? " (unsaved changes)" : ""),
                        summary: assessment.result.summary,
                      },
                    ].map((row, index) => (
                      <tr key={index}>
                        <th scope="row">{row.name}</th>
                        <td>{row.summary.atRiskOrders}</td>
                        <td>{row.summary.missingUnits}</td>
                        <td>{money(row.summary.atRiskValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <SupplyGraph
            data={compiled.dataset}
            result={assessment.result}
            scenario={assessment.scenario}
            selected={selection}
            onSelect={setSelection}
            onMoveReceipt={
              record
                ? (id, date) =>
                    updateScenario(
                      withReceiptDate(
                        compiled.dataset,
                        assessment.scenario!,
                        id,
                        date,
                      ),
                    )
                : undefined
            }
          />
          <div className="builder-experience__panels">
            <ImpactPanel
              data={compiled.dataset}
              result={assessment.result}
              selectedOrderId={
                selection?.kind === "order" ? selection.id : undefined
              }
            />
            {record ? (
              <ScenarioPanel
                key={`${workspace.document.id}:${compiled.networkKey}:${scenario.id}`}
                data={compiled.dataset}
                scenario={assessment.scenario}
                onChange={updateScenario}
              />
            ) : (
              <section className="builder-experience__baseline">
                <h2>Baseline</h2>
                <p>
                  All receipt dates and quantities are as planned. Create a
                  scenario to change them.
                </p>
                <Button onClick={newScenario}>Create a scenario</Button>
              </section>
            )}
          </div>
        </div>
      ) : (
        <section
          className="builder-experience__review"
          aria-label="Simulation unavailable"
        >
          <h2>Simulation unavailable</h2>
          <p>
            {assessment?.error ??
              (!compiled.ok
                ? "The draft has incomplete or invalid input. Return to Build and fix the listed issues."
                : !current
                  ? "Revalidate this scenario before running it."
                  : "Add a complete customer order and run the network.")}
          </p>
          <Button variant="outline" onClick={() => setView("build")}>
            Return to Build
          </Button>
        </section>
      )}
    </main>
  );
}
