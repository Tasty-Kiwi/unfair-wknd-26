import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  CircleHelp,
  Download,
  LoaderCircle,
  RotateCcw,
  Save,
  Upload,
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
import { AccountControls } from "@/components/account/AccountControls";
import { CloudStatus } from "@/components/cloud/CloudStatus";
import { CloudProjectsDialog } from "@/components/cloud/CloudProjectsDialog";
import { ProjectNameDialog } from "@/components/cloud/ProjectNameDialog";
import {
  copyProjectName,
  defaultProjectName,
  describeCloudStatus,
  isUnsavedAgainst,
  GUEST_DRAFT_KEY,
  useBuilderCloud,
  type CloudHost,
} from "@/lib/cloud/useBuilderCloud";
import { BuildWorkspace } from "./BuildWorkspace";
import { AlternativeCatalogEditor } from "./AlternativeCatalogEditor";
import { datasetToWorkspace } from "@/lib/builder/workspaceFromDataset";
import {
  demoData,
  NORMAL_SCENARIO,
  DISRUPTION_SCENARIO,
  RECOVERY_SCENARIO,
} from "@/data/demo";
import { prepareProjectImport } from "@/lib/projects";
import { presetsFor } from "@/lib/scenarioPresets";
import {
  fictionalProvenance,
  provenanceAfterImport,
  provenanceLabel,
} from "@/lib/provenance";
import { NamedScenarios } from "@/components/scenarios/NamedScenarios";
import {
  SimulationSurface,
  type ComparisonRow,
} from "@/components/simulation/SimulationSurface";
import {
  ImportDataDialog,
  type PendingImport,
} from "@/components/simulation/ImportDataDialog";
import {
  scenarioReport,
  scenarioInputsKey,
} from "@/components/simulation/format";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  createBlankDocument,
  createCoreExample,
} from "@/lib/builder/factories";
import { createRevisionCompiler } from "@/lib/builder/compilation";
import {
  loadWorkspace,
  saveWorkspace,
  serializeWorkspace,
  MAX_WORKSPACE_BYTES,
  WORKSPACE_STORAGE_KEY,
} from "@/lib/builder/storage";
import {
  isScenarioCurrent,
  receiptReviewContext,
  alternativeReviewContext,
  revalidateScenario,
} from "@/lib/builder/scenarios";
import type {
  BuilderDocument,
  BuilderWorkspaceV1,
  ScenarioRecord,
} from "@/lib/builder/types";
import { parseScenario } from "@/lib/validation";
import { simulate } from "@/lib/simulation";
import { DATASET_TABLES, type Scenario } from "@/lib/types";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ToolbarPopover } from "./ToolbarPopover";
import "./experience.css";
import "./workspace.css";

/** Saved Northstar scenarios offered as the simulator's fixed presets, in guest-journey order. */
const NORTHSTAR_PRESETS = [
  { id: "normal", label: "Normal operations" },
  { id: "motor-delay", label: "Supplier disruption" },
  { id: "recovery", label: "Approved recovery" },
];

const BASELINE: Scenario = {
  id: "builder-baseline",
  name: "Baseline",
  deliveryOverrides: [],
  alternatives: [],
};
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

const REPLACE_MESSAGE =
  "Replace the current network and its scenarios? Export workspace JSON first if you want to keep it.";

export function BuilderExperience({
  onClose,
  registerNavigationGuard,
  storageKey = WORKSPACE_STORAGE_KEY,
  closeLabel = "Back to demo",
  initialView = "build",
  fallbackWorkspace,
  initialSaveError,
  demoProject = false,
}: {
  onClose: () => void;
  registerNavigationGuard?: (guard: () => boolean) => () => void;
  storageKey?: string;
  closeLabel?: string;
  initialView?: "build" | "simulate";
  fallbackWorkspace?: BuilderWorkspaceV1;
  initialSaveError?: string;
  demoProject?: boolean;
}) {
  const [initial] = useState(() => loadWorkspace(undefined, storageKey));
  const [workspace, setWorkspace] = useState<BuilderWorkspaceV1>(
    () => initial.workspace ?? fallbackWorkspace ?? blank(),
  );
  const latest = useRef(workspace);
  const lastSaved = useRef<BuilderWorkspaceV1 | null>(initial.workspace);
  const [allowSave, setAllowSave] = useState(
    !initial.error && !initialSaveError,
  );
  const [saveStatus, setSaveStatus] = useState(
    initial.workspace ? "Restored locally" : "Not saved locally",
  );
  const [error, setError] = useState(initial.error ?? initialSaveError ?? "");
  const [notice, setNotice] = useState("");
  const [validationRequested, setValidationRequested] = useState(false);
  const [view, setView] = useState<"build" | "simulate">(initialView);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [comparisonRequest, setComparisonRequest] = useState(0);
  const [canvasSession, setCanvasSession] = useState(0);
  const [importing, setImporting] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const [compile] = useState(() => createRevisionCompiler());
  // Mirrors allowSave for the cloud host, which runs between renders.
  const allowSaveRef = useRef(allowSave);
  allowSaveRef.current = allowSave;
  // The cloud hook reads and moves the editor through this host.
  const cloudHost: CloudHost = {
    current: () => latest.current,
    persist(key) {
      if (key === storageKey && !allowSaveRef.current) {
        setError(
          "Your saved device draft could not be read, so it was kept untouched. Save workspace to replace it, or export first.",
        );
        return false;
      }
      const saved = saveWorkspace(latest.current, undefined, key);
      if (!saved.ok) {
        setError(saved.error);
        return false;
      }
      lastSaved.current = latest.current;
      return true;
    },
    apply: (next) => adopt(next, true),
    restoreGuest() {
      const guest = loadWorkspace(undefined, storageKey);
      if (guest.error) {
        // An unreadable guest draft stays untouched: the editor is blank and autosave is off.
        adopt(
          blank(),
          false,
          `${guest.error} Your device draft was kept untouched.`,
        );
        return true;
      }
      adopt(guest.workspace ?? blank(), true);
      return true;
    },
    confirm(prompt) {
      if (prompt !== undefined) return window.confirm(prompt);
      return !replaceNeedsConfirm() || window.confirm(REPLACE_MESSAGE);
    },
  };
  const cloud = useBuilderCloud({
    host: cloudHost,
    workspace,
    guestDraftKey: storageKey,
  });
  const draftKey = cloud.draftKey;
  const draftKeyRef = useRef(draftKey);
  draftKeyRef.current = draftKey;
  const boundProjectId = cloud.binding?.projectId ?? null;
  const cloudGuard = useRef(cloud.binding);
  cloudGuard.current = cloud.binding;

  function hasCloudChanges() {
    const binding = cloudGuard.current;
    return (
      !!binding &&
      (binding.blocked ||
        isUnsavedAgainst(latest.current, binding.acknowledgedJson))
    );
  }
  const compiled = compile(workspace.document, canvasSession);
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
    // The slot is captured with the workspace. A context switch re-runs this effect and cancels the timer.
    const key = draftKey;
    setSaveStatus("Saving…");
    const timer = window.setTimeout(() => {
      if (latest.current !== workspace) return;
      const saved = saveWorkspace(workspace, undefined, key);
      if (saved.ok) {
        lastSaved.current = workspace;
        setSaveStatus(
          key === GUEST_DRAFT_KEY ? "Saved locally" : "Saved on this device",
        );
      } else {
        setSaveStatus("Changes not saved");
        setError(saved.error);
      }
    }, 500);
    return () => window.clearTimeout(timer);
    // draftKey is read from the same render as workspace.
  }, [workspace, allowSave, draftKey]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (latest.current !== lastSaved.current && allowSaveRef.current) {
        const saved = saveWorkspace(
          latest.current,
          undefined,
          draftKeyRef.current,
        );
        if (saved.ok) lastSaved.current = latest.current;
        else {
          setSaveStatus("Changes not saved");
          setError(saved.error);
        }
      }
      if (latest.current === lastSaved.current && !hasCloudChanges()) return;
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
    setError("");
  }

  function run() {
    setValidationRequested(true);
    if (!compiled.ok) {
      setError("Fix the listed network issues before running.");
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

  /** Validates a scenario change against the current network. With no saved or working scenario, a change creates one. */
  function updateScenario(next: Scenario): boolean {
    if (!compiled.ok) return false;
    const matching =
      next.id === "custom"
        ? workspace.scenarios.find(
            (item) =>
              isScenarioCurrent(item, compiled.networkKey) &&
              scenarioInputsKey(item.scenario) === scenarioInputsKey(next),
          )
        : undefined;
    if (matching) {
      change((previous) => ({
        ...previous,
        selectedScenarioId: matching.scenario.id,
        workingScenario: clone(matching),
      }));
      setError("");
      return true;
    }
    if (!record) {
      try {
        const created = revalidateScenario(
          compiled.dataset,
          compiled.networkKey,
          {
            scenario: {
              ...next,
              id: crypto.randomUUID(),
              name: next.id === BASELINE.id ? "New scenario" : next.name,
            },
            validatedNetworkKey: null,
          },
        );
        change((previous) => ({
          ...previous,
          selectedScenarioId: null,
          workingScenario: created,
        }));
        setError("");
        return true;
      } catch (caught) {
        setError(message(caught));
        return false;
      }
    }
    if (!current) return false;
    try {
      const validated = revalidateScenario(
        compiled.dataset,
        compiled.networkKey,
        {
          ...record,
          scenario: {
            ...next,
            id: record.scenario.id,
            name: record.scenario.name,
          },
        },
      );
      change((previous) => ({
        ...previous,
        workingScenario: validated,
      }));
      setError("");
      return true;
    } catch (caught) {
      setError(message(caught));
      return false;
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
      const next = revalidateScenario(
        compiled.dataset,
        compiled.networkKey,
        record,
      );
      const validated = next.scenario;
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
      workspace.scenarios.some(
        (item) =>
          scenarioInputsKey(item.scenario) === scenarioInputsKey(scenario),
      ) ||
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
            ? clone(next)
            : item,
        ),
      }));
      setError("");
      setNotice("Scenario revalidated against the current network.");
    } catch (caught) {
      setError(message(caught));
    }
  }

  function setSaveAllowed(value: boolean) {
    allowSaveRef.current = value;
    setAllowSave(value);
  }

  // Replaces the editor content with no prompt. Callers confirm first.
  function adopt(next: BuilderWorkspaceV1, allow: boolean, note = "") {
    setValidationRequested(false);
    change(next);
    setSaveAllowed(allow);
    setCanvasSession((session) => session + 1);
    setView("build");
    setError(note);
  }

  // Matches the replace rule: prompt only when the editor holds work or an unreadable draft.
  function replaceNeedsConfirm(): boolean {
    const previous = latest.current;
    const containsWork =
      previous.document.nodes.length > 0 ||
      !!previous.document.name.trim() ||
      !!previous.document.asOf.trim() ||
      previous.scenarios.length > 0 ||
      !!previous.workingScenario;
    return containsWork || !allowSaveRef.current;
  }

  function saveLocal() {
    if (
      !allowSave &&
      initial.error &&
      !window.confirm(
        "Replace the unreadable saved workspace with this draft? Export any data you need first.",
      )
    )
      return false;
    const saved = saveWorkspace(latest.current, undefined, draftKey);
    if (!saved.ok) {
      setError(saved.error);
      setSaveStatus("Changes not saved");
      return false;
    }
    lastSaved.current = latest.current;
    setSaveAllowed(true);
    setSaveStatus(
      draftKey === GUEST_DRAFT_KEY ? "Saved locally" : "Saved on this device",
    );
    setError("");
    return true;
  }

  function prepareClose() {
    if (
      hasCloudChanges() &&
      !window.confirm(
        "Your cloud changes are saved only on this device. Leave the builder? Export JSON first if you need a backup.",
      )
    )
      return false;
    if (latest.current !== lastSaved.current && !saveLocal()) return false;
    return true;
  }

  function close() {
    if (!prepareClose()) return false;
    onClose();
    return true;
  }

  useEffect(() => {
    if (!registerNavigationGuard) return;
    return registerNavigationGuard(prepareClose);
  }, [registerNavigationGuard, workspace, allowSave, draftKey]);

  // New blank, example and import all come through here. They detach any cloud binding.
  function replace(next: BuilderWorkspaceV1, confirmed = false) {
    if (!confirmed && replaceNeedsConfirm() && !window.confirm(REPLACE_MESSAGE))
      return false;
    if (!cloud.detachForReplace()) return false;
    adopt(next, true);
    return true;
  }

  function loadCoreExample() {
    return replace({
      ...blank(),
      document: createCoreExample(),
      source: { origin: "fictional", openedFromFile: false },
    });
  }

  function loadDemoExample() {
    return replace(
      datasetToWorkspace(demoData, {
        scenarios: [NORMAL_SCENARIO, DISRUPTION_SCENARIO, RECOVERY_SCENARIO],
        scenario: NORMAL_SCENARIO,
        origin: "fictional",
      }),
    );
  }

  /** Applies a reviewed import preview to the editor. Replacement still confirms first when work would be lost. */
  function applyImportedDataset(pending: PendingImport) {
    try {
      const presets = presetsFor(pending.data);
      const next = datasetToWorkspace(pending.data, {
        scenario: { ...presets[0], id: `editable-${crypto.randomUUID()}` },
        scenarios: presets,
        origin: pending.provenance.kind,
      });
      next.source.provenance = pending.provenance;
      next.source.retainedProductBoms = pending.replacedTables.includes(
        "products",
      )
        ? pending.retainedProductBoms
        : (workspace.source.retainedProductBoms ?? false);
      if (
        replace(
          { ...next, source: { ...next.source, openedFromFile: true } },
          true,
        )
      ) {
        setView("simulate");
        setNotice(
          `Imported ${pending.fileNames.join(", ")}. ${pending.provenance.kind === "mixed" ? "Mixed demo and imported data" : "Imported data"} is active with ${pending.data.orders.length} orders.`,
        );
      }
    } catch (caught) {
      setError(message(caught));
    }
  }

  function exportSimulation(kind: "dataset" | "report") {
    if (!compiled.ok) return;
    try {
      if (kind === "report" && !assessment?.result)
        throw new Error(
          "Run and revalidate the scenario before exporting a report.",
        );
      const value =
        kind === "dataset"
          ? compiled.dataset
          : scenarioReport({
              data: compiled.dataset,
              provenance: sourceProvenance(),
              retainedProductBoms:
                workspace.source.retainedProductBoms ?? false,
              scenario: assessment!.scenario!,
              result: assessment!.result!,
              comparison: [
                ...fixedPresets,
                ...workspace.scenarios
                  .filter(
                    (item) =>
                      isScenarioCurrent(item, compiled.networkKey) &&
                      !fixedPresets.some(
                        (preset) =>
                          scenarioInputsKey(preset) ===
                          scenarioInputsKey(item.scenario),
                      ),
                  )
                  .map((item) => item.scenario),
              ].map((item) => simulate(compiled.dataset, item)),
              comparisonUnavailable: workspace.scenarios
                .filter((item) => !isScenarioCurrent(item, compiled.networkKey))
                .map((item) => ({
                  id: item.scenario.id,
                  name: item.scenario.name,
                  reason: "Requires review against the changed network",
                })),
            });
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(value, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download =
        kind === "report"
          ? "needtrace-scenario-report.json"
          : "needtrace-dataset.json";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError("");
    } catch (caught) {
      setError(message(caught));
    }
  }

  function sourceProvenance() {
    return (
      workspace.source.provenance ??
      (workspace.source.origin === "fictional"
        ? fictionalProvenance()
        : provenanceAfterImport(fictionalProvenance(), DATASET_TABLES))
    );
  }

  function exportJson() {
    try {
      const text = serializeWorkspace(latest.current);
      const url = URL.createObjectURL(
        new Blob([text], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "needtrace-workspace.json";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError("");
    } catch (caught) {
      setError(message(caught));
    }
  }

  async function importJson(files: File[]) {
    const captured = latest.current;
    setImporting(true);
    try {
      if (
        files.length > 5 ||
        files.some((file) => file.size > MAX_WORKSPACE_BYTES)
      )
        throw new Error(
          "Choose one JSON file or up to five CSV files, each smaller than 2 MB.",
        );
      const inputs = await Promise.all(
        files.map(async (file) => ({
          name: /\.(json|csv)$/i.test(file.name)
            ? file.name
            : `${file.name}.json`,
          text: await file.text(),
        })),
      );
      const imported = prepareProjectImport(
        inputs,
        compiled.ok
          ? {
              data: compiled.dataset,
              provenance: sourceProvenance(),
            }
          : undefined,
      );
      const next =
        imported.kind === "workspace"
          ? imported.workspace
          : datasetToWorkspace(imported.state.data, {
              scenario: {
                ...imported.state.scenario,
                id: `editable-${crypto.randomUUID()}`,
              },
              scenarios: presetsFor(imported.state.data),
              origin: imported.state.provenance.kind,
            });
      if (imported.kind === "dataset") {
        next.source.provenance = imported.state.provenance;
        next.source.retainedProductBoms = imported.state.retainedProductBoms;
      }
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
    workspace.source.origin === "authored"
      ? "Authored in builder"
      : provenanceLabel(sourceProvenance().kind);
  const issues = compiled.ok ? [] : compiled.issues;
  const namedScenarios = (
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
        run();
        setComparisonRequest((value) => value + 1);
      }}
    />
  );
  const fixedPresets = compiled.ok
    ? presetsFor(compiled.dataset).slice(
        0,
        compiled.dataset.deliveries.length ? 3 : 1,
      )
    : [];
  const activePreset = fixedPresets.findIndex(
    (preset) => scenarioInputsKey(preset) === scenarioInputsKey(scenario),
  );
  function choosePreset(index: number) {
    if (!compiled.ok) return;
    const preset = fixedPresets[index];
    if (!preset || !canSwitchScenario()) return;
    const saved = workspace.scenarios.find(
      (item) =>
        isScenarioCurrent(item, compiled.networkKey) &&
        scenarioInputsKey(item.scenario) === scenarioInputsKey(preset),
    );
    const next = saved
      ? clone(saved)
      : revalidateScenario(compiled.dataset, compiled.networkKey, {
          scenario: {
            ...preset,
            id: crypto.randomUUID(),
            name: NORTHSTAR_PRESETS[index].label,
          },
          validatedNetworkKey: null,
        });
    change((previous) => ({
      ...previous,
      selectedScenarioId: saved?.scenario.id ?? null,
      workingScenario: next,
    }));
    setError("");
  }
  const presetToggle =
    fixedPresets.length > 0 ? (
      <ToggleGroup
        type="single"
        className="scenario-switch"
        value={activePreset < 0 ? "custom" : String(activePreset)}
        onValueChange={(value) => {
          if (value && value !== "custom") choosePreset(Number(value));
        }}
        aria-label="Scenario presets"
      >
        {fixedPresets.map((_, index) => (
          <ToggleGroupItem key={index} value={String(index)}>
            {NORTHSTAR_PRESETS[index].label}
          </ToggleGroupItem>
        ))}
        {activePreset < 0 && (
          <ToggleGroupItem value="custom">Custom</ToggleGroupItem>
        )}
      </ToggleGroup>
    ) : null;
  const comparisonRows: ComparisonRow[] =
    compiled.ok && assessment?.result
      ? [
          ...fixedPresets.map((preset, index) => ({
            key: `preset:${index}`,
            name: NORTHSTAR_PRESETS[index].label,
            summary: simulate(compiled.dataset, preset).summary,
            current: activePreset === index,
            onShow: () => choosePreset(index),
          })),
          ...(activePreset < 0
            ? [
                {
                  key: "working",
                  name:
                    scenario.name + (scenarioDirty ? " (unsaved changes)" : ""),
                  summary: assessment.result.summary,
                  current: true,
                },
              ]
            : []),
          ...workspace.scenarios
            .filter(
              (item) =>
                !isScenarioCurrent(item, compiled.networkKey) ||
                (item.scenario.id !== record?.scenario.id &&
                  !fixedPresets.some(
                    (preset) =>
                      scenarioInputsKey(preset) ===
                      scenarioInputsKey(item.scenario),
                  )),
            )
            .map((item) => ({
              key: `saved:${item.scenario.id}`,
              name: item.scenario.name,
              summary: isScenarioCurrent(item, compiled.networkKey)
                ? simulate(compiled.dataset, item.scenario).summary
                : null,
              unavailableReason: "Requires review against the changed network",
              current: false,
              onShow: () => selectScenario(item.scenario.id),
            })),
        ]
      : [];
  function testDelay() {
    if (!compiled.ok) return;
    // The disruption preset is derived from the network's first receipt, so it works for any valid network.
    const delay = presetsFor(compiled.dataset)[1];
    updateScenario({
      ...scenario,
      deliveryOverrides: delay.deliveryOverrides,
      alternatives: [],
    });
  }
  const untouchedBlank =
    !workspace.document.name.trim() &&
    !workspace.document.asOf &&
    workspace.document.nodes.length === 0 &&
    workspace.document.edges.length === 0;
  return (
    <main className="builder-experience" aria-label="Supply chain builder">
      <header className="builder-bar">
        <a
          className="builder-bar__mark"
          href="/"
          aria-label="Needtrace home"
          onClick={(event) => {
            if (
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            event.preventDefault();
            if (prepareClose()) window.location.assign("/");
          }}
        >
          <img src="/favicon.svg" width="26" height="26" alt="" />
        </a>
        <div className="builder-bar__title">
          {view === "build" ? (
            <h1>{workspace.document.name || "Build a network"}</h1>
          ) : (
            <h2>{workspace.document.name || "Build a network"}</h2>
          )}
          <p className="builder-experience__source">
            Needtrace · <span>{source}</span>
            {workspace.source.openedFromFile ? " · Imported workspace" : ""}
          </p>
        </div>
        <div
          className="builder-bar__modes"
          role="group"
          aria-label="Builder mode"
        >
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={view === "build"}
            onClick={() => setView("build")}
          >
            Build
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={view === "simulate"}
            onClick={run}
          >
            Simulate
          </Button>
        </div>
        {view === "simulate" && (
          <>
            {demoProject && (
              <Button
                variant="outline"
                size="sm"
                title="Reset demo"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw data-icon="inline-start" />
                <span className="label-narrow">Reset demo</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              title="Import data"
              onClick={() => setImportOpen(true)}
            >
              <Upload data-icon="inline-start" />
              <span className="label-narrow">Import data</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Model assumptions"
              onClick={() => setAssumptionsOpen(true)}
            >
              <CircleHelp data-icon="inline-start" />
              <span className="label-wide">Assumptions</span>
            </Button>
          </>
        )}
        {view === "build" && (
          <ToolbarPopover
            className="builder-bar__scenario"
            align="start"
            title="Named scenarios"
            label={
              <>
                <span className="builder-bar__k">Scenario</span>
                <span className="builder-bar__v">
                  {record
                    ? record.scenario.name || "Unnamed scenario"
                    : "Baseline"}
                  {scenarioDirty && (
                    <CircleAlert
                      size={14}
                      aria-label="Unsaved scenario changes"
                    />
                  )}
                </span>
              </>
            }
          >
            {() => namedScenarios}
          </ToolbarPopover>
        )}
        <span
          role="status"
          className="builder-experience__save"
          data-error={saveStatus === "Changes not saved" || undefined}
          title={importing ? "Reading workspace…" : saveStatus}
          aria-label={importing ? "Reading workspace…" : saveStatus}
        >
          {importing || saveStatus === "Saving…" ? (
            <LoaderCircle aria-hidden="true" />
          ) : saveStatus === "Changes not saved" ? (
            <>
              <CircleAlert aria-hidden="true" /> {saveStatus}
            </>
          ) : (
            <Check aria-hidden="true" />
          )}
          {saveStatus !== "Changes not saved" && (
            <span className="sr-only">
              {importing ? "Reading workspace…" : saveStatus}
            </span>
          )}
        </span>
        <ToolbarPopover label="Alternatives" className="builder-alternatives">
          {() => (
            <AlternativeCatalogEditor
              document={workspace.document}
              onDocumentChange={updateDocument}
            />
          )}
        </ToolbarPopover>
        <ToolbarPopover
          className="builder-bar__file"
          label="File"
          title="Workspace file actions"
        >
          {(closeMenu) => (
            <div className="builder-file-menu" aria-label="Workspace actions">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  replace(blank());
                }}
              >
                New blank
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  loadCoreExample();
                }}
              >
                Core example
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  loadDemoExample();
                }}
              >
                Northstar demo
              </button>
              <hr />
              <button
                type="button"
                title="Save on this device; does not upload to cloud"
                onClick={() => {
                  closeMenu();
                  saveLocal();
                }}
              >
                <Save aria-hidden size={15} /> Save workspace
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  exportJson();
                }}
              >
                <Download aria-hidden size={15} /> Export workspace JSON
              </button>
              <p>
                Import workspace or dataset JSON, scenario reports, or CSV
                tables. CSV imports retain the current valid network’s other
                tables, or use the Northstar demo when this draft is incomplete.
              </p>
              <button
                type="button"
                disabled={!compiled.ok}
                onClick={() => {
                  closeMenu();
                  exportSimulation("dataset");
                }}
              >
                Export dataset JSON
              </button>
              <button
                type="button"
                disabled={!assessment?.result}
                onClick={() => {
                  closeMenu();
                  exportSimulation("report");
                }}
              >
                Export scenario report
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  setImportOpen(true);
                }}
              >
                <Upload aria-hidden size={15} /> Import data…
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={() => {
                  closeMenu();
                  importInput.current?.click();
                }}
              >
                <Upload aria-hidden size={15} /> Import workspace JSON…
              </button>
            </div>
          )}
        </ToolbarPopover>
        <input
          ref={importInput}
          className="sr-only"
          tabIndex={-1}
          type="file"
          aria-label="Import workspace JSON"
          accept="application/json,text/csv,.json,.csv"
          multiple
          disabled={importing}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) void importJson(files);
            event.target.value = "";
          }}
        />
        <ThemeToggle />
        <Button
          className="builder-bar__backbtn"
          variant="outline"
          size="sm"
          onClick={close}
        >
          <ArrowLeft data-icon="inline-start" />
          <span className="builder-bar__back">{closeLabel}</span>
        </Button>
      </header>

      {cloud.availability === "failed" && (
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <span className="text-sm">
            Cloud is unavailable right now. Your work on this device is
            unchanged.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={cloud.actions.retryCloudConnection}
          >
            Retry cloud connection
          </Button>
        </div>
      )}

      {cloud.cloudAvailable && (
        <section
          className="flex flex-wrap items-center gap-2 pb-3"
          aria-label="Cloud"
        >
          <AccountControls
            session={cloud.session}
            busy={cloud.busy}
            onSignIn={cloud.actions.signIn}
            onSignOut={cloud.actions.signOut}
            onMyProjects={cloud.actions.openProjects}
            onSaveToCloud={cloud.actions.saveToCloud}
          />
          {(cloud.binding ||
            cloud.session.kind === "signed-in" ||
            cloud.message ||
            cloud.conflict) && (
            <CloudStatus
              text={describeCloudStatus({
                session: cloud.session,
                binding: cloud.binding,
                dirty: cloud.dirty,
                save: cloud.save,
              })}
              message={cloud.message}
              conflict={cloud.conflict}
              onKeepLocal={cloud.actions.keepLocal}
              onSaveAsNew={() => cloud.actions.openNameDialog("copy")}
              onOpenRemote={
                boundProjectId
                  ? () => cloud.actions.openProject(boundProjectId)
                  : undefined
              }
            />
          )}
        </section>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>
            {error === "Fix the listed network issues before running."
              ? "Your network is still in progress"
              : "Action could not complete"}
          </AlertTitle>
          <AlertDescription>
            {error === "Fix the listed network issues before running."
              ? "Use Next repair in the details panel, or open a group in Checks. You can keep building in any order; simulation waits until all checks pass."
              : error}
          </AlertDescription>
        </Alert>
      )}
      {notice && (
        <p role="status" className="builder-experience__notice notice">
          {notice}
        </p>
      )}
      {workspace.source.retainedProductBoms && (
        <p role="status" className="builder-experience__notice">
          Product names and SKUs are imported; existing BOMs were retained and
          may include fictional demo values. Import products and BOM together to
          replace both.
        </p>
      )}
      {!allowSave &&
        (initial.error || initialSaveError) &&
        error !== (initial.error ?? initialSaveError) && (
          <Alert variant="destructive">
            <AlertTitle>Changes not saved</AlertTitle>
            <AlertDescription>
              {initial.error ?? initialSaveError}
            </AlertDescription>
          </Alert>
        )}

      {record && !current && (
        <section
          className="builder-experience__review"
          aria-label="Scenario requires review"
        >
          <details>
            <summary>
              Scenario requires review <span>Show / hide details</span>
            </summary>
            <div className="builder-experience__review-details">
              <p>
                The material network changed. Your scenario inputs are
                unchanged. The same receipt may now supply different materials.
                Review these inputs before using them with this network.
              </p>
              <ul>
                {record.scenario.deliveryOverrides.map((override) => {
                  const context = compiled.ok
                    ? receiptReviewContext(
                        compiled.dataset,
                        override.deliveryId,
                      )
                    : null;
                  const previous = record.receiptSnapshots?.find(
                    (item) => item.deliveryId === override.deliveryId,
                  );
                  return (
                    <li key={override.deliveryId}>
                      <p>
                        <strong>Receipt {override.deliveryId}</strong>
                      </p>
                      {previous ? (
                        <div
                          aria-label={`Previously validated relationship for ${override.deliveryId}`}
                        >
                          <p>
                            Previously validated supplier:{" "}
                            {previous.supplier.name} ({previous.supplier.id})
                          </p>
                          <p>
                            Previously validated component:{" "}
                            {previous.component.name} ({previous.component.id})
                          </p>
                        </div>
                      ) : (
                        <p>
                          Previous relationship was not recorded for this
                          scenario.
                        </p>
                      )}
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
                {record.scenario.alternatives.map((use) => {
                  const context = compiled.ok
                    ? alternativeReviewContext(
                        compiled.dataset,
                        use.alternativeId,
                      )
                    : null;
                  const previous = record.alternativeSnapshots?.find(
                    (item) => item.alternativeId === use.alternativeId,
                  );
                  return (
                    <li key={`alternative:${use.alternativeId}`}>
                      <p>
                        <strong>Alternative {use.alternativeId}</strong>
                      </p>
                      {previous && (
                        <p>
                          Previously validated: {previous.supplier.name} (
                          {previous.supplier.id}) → {previous.component.name} (
                          {previous.component.id})
                        </p>
                      )}
                      {context ? (
                        <>
                          <p>
                            Current catalog: {context.supplier.name} (
                            {context.supplier.id}) → {context.component.name} (
                            {context.component.id})
                          </p>
                          <p>
                            {context.alternative.approved
                              ? "Approved"
                              : "Not approved"}
                            ; up to {context.alternative.quantity} units from{" "}
                            {context.alternative.availableDate}. Product scope:{" "}
                            {context.alternative.approvedProductIds.join(", ")}.
                          </p>
                        </>
                      ) : (
                        <p>
                          This alternative is missing or the network needs
                          repair. Remove its use or repair the catalog before
                          revalidating.
                        </p>
                      )}
                      <p>
                        Scenario use: {use.quantity} units on{" "}
                        {use.availableDate}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          change((previousWorkspace) => ({
                            ...previousWorkspace,
                            workingScenario: {
                              ...record,
                              scenario: {
                                ...record.scenario,
                                alternatives:
                                  record.scenario.alternatives.filter(
                                    (item) =>
                                      item.alternativeId !== use.alternativeId,
                                  ),
                              },
                            },
                          }))
                        }
                      >
                        Remove alternative {use.alternativeId}
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
            </div>
          </details>
        </section>
      )}

      {view === "build" ? (
        <BuildWorkspace
          key={`${workspace.document.id}:${canvasSession}`}
          document={workspace.document}
          onChange={updateDocument}
          issues={untouchedBlank && !validationRequested ? [] : issues}
          onValidate={() => {
            setValidationRequested(true);
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
          onCoreExample={() => void loadCoreExample()}
        />
      ) : assessment?.result &&
        assessment.baseline &&
        assessment.scenario &&
        compiled.ok ? (
        <div className="sim builder-sim">
          <SimulationSurface
            comparisonRequest={comparisonRequest}
            scenarioError={error}
            data={compiled.dataset}
            scenario={assessment.scenario}
            onScenarioChange={updateScenario}
            comparisons={comparisonRows}
            scenarioSwitch={
              <>
                {presetToggle}
                {namedScenarios}
              </>
            }
            preferNames
            panelKey={`${workspace.document.id}:${compiled.networkKey}`}
            onTestDelay={testDelay}
            onNotice={setNotice}
            onExportReport={() => exportSimulation("report")}
            assumptionsOpen={assumptionsOpen}
            onAssumptionsOpenChange={setAssumptionsOpen}
          />
        </div>
      ) : (
        <section
          className="builder-experience__unavailable"
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
      <ImportDataDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        data={compiled.ok ? compiled.dataset : demoData}
        provenance={sourceProvenance()}
        autosaves={allowSave}
        onConfirm={applyImportedDataset}
      />
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {workspace.source.origin === "fictional"
                ? "Reset this demo?"
                : "Replace your imported plan?"}
            </DialogTitle>
            <DialogDescription>
              This replaces this network and its saved scenarios with the
              original fictional Northstar demo. Export workspace JSON first to
              keep your edits.
            </DialogDescription>
          </DialogHeader>
          <div className="import-preview-actions">
            <Button
              variant="outline"
              autoFocus
              onClick={() => setResetOpen(false)}
            >
              Keep my plan
            </Button>
            <Button
              onClick={() => {
                if (
                  replace(
                    datasetToWorkspace(demoData, {
                      scenario: NORMAL_SCENARIO,
                      scenarios: [
                        NORMAL_SCENARIO,
                        DISRUPTION_SCENARIO,
                        RECOVERY_SCENARIO,
                      ],
                      origin: "fictional",
                    }),
                    true,
                  )
                ) {
                  setView("simulate");
                  setNotice(
                    "Fictional demo restored. All scenario changes cleared.",
                  );
                  setResetOpen(false);
                }
              }}
            >
              Reset to fictional demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <CloudProjectsDialog
        open={cloud.dialog?.kind === "projects"}
        projects={cloud.projects}
        userId={
          cloud.session.kind === "signed-in" ? cloud.session.user.id : null
        }
        busy={cloud.busy !== null}
        canSaveAsNew={cloud.binding !== null}
        onOpenProject={cloud.actions.openProject}
        onLoadMore={cloud.actions.loadMoreProjects}
        onSaveAsNew={() => cloud.actions.openNameDialog("copy")}
        onSignOut={cloud.actions.signOut}
        onClose={cloud.actions.closeDialog}
      />
      <ProjectNameDialog
        open={cloud.dialog?.kind === "name"}
        mode={cloud.dialog?.kind === "name" ? cloud.dialog.mode : "create"}
        initialName={
          cloud.dialog?.kind === "name" &&
          cloud.dialog.mode === "copy" &&
          cloud.binding
            ? copyProjectName(cloud.binding.name)
            : defaultProjectName(workspace)
        }
        error={cloud.nameError}
        busy={cloud.busy !== null}
        onSubmit={cloud.actions.createCloudProject}
        onClose={cloud.actions.closeDialog}
      />
    </main>
  );
}
