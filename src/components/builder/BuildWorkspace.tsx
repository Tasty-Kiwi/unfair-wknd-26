import { useEffect, useMemo, useRef, useState } from "react";
import { Tooltip } from "radix-ui";
import {
  Play,
  PackageCheck,
  Plus,
  ShieldCheck,
  List,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Factory,
  Box,
  Cog,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { nodeKey } from "@/lib/builder/factories";
import { deleteEdge, deleteNode } from "@/lib/builder/connections";
import type {
  BuilderDocument,
  BuilderViewport,
  BuilderIssue,
  NodeKey,
  NodeKind,
} from "@/lib/builder/types";
import { BuilderCanvas } from "./BuilderCanvas";
import { PropertiesInspector, issueTarget } from "./PropertiesInspector";
import {
  KIND_LABELS,
  NODE_KIND_ORDER,
  addNode,
  applyConnection,
  buildLabels,
  liveSelection,
  moveNodes,
  updateViewport,
  nodeDisplayName,
  RELATIONSHIP_LABELS,
  type ApplyConnectionResult,
  type BuilderSelection,
  type RelationshipCandidate,
} from "./documentEdits";
import "./builder.css";

export type BuildWorkspaceProps = {
  document: BuilderDocument;
  onChange: (next: BuilderDocument) => void;
  issues: BuilderIssue[];
  onValidate: () => void;
  onRun: () => void;
  /** Offered in the empty canvas so newcomers can start from the example. */
  onCoreExample?: () => void;
};

const PALETTE_ICONS: Record<NodeKind, LucideIcon> = {
  supplier: Factory,
  component: Cog,
  receipt: PackageCheck,
  product: Box,
  order: ClipboardList,
};

const PALETTE_DESCRIPTIONS: Record<NodeKind, string> = {
  supplier:
    "A company that supplies components. Connect it to the components it supplies and their receipts.",
  component:
    "A material or part used to make products. Set its starting stock and connect it to the products that need it.",
  receipt:
    "An incoming delivery of a component from a supplier. Its quantity becomes available on the date you set; change that date to test a delay.",
  product:
    "An item you make for customers. Connect its required components and specify how many of each it needs.",
  order:
    "A customer’s request for a product, with a quantity and required date. The simulation checks whether materials are available in time.",
};

/** One-line facts printed on each card so the canvas reads without opening it. */
function cardDetails(
  kind: NodeKind,
  fields: Record<string, string | null>,
): string[] {
  const or = (value: string | null | undefined, fallback = "not entered") =>
    value && value.trim() ? value : fallback;
  switch (kind) {
    case "supplier":
      return [
        `Region ${or(fields.region)}`,
        `Lead time ${or(fields.leadTimeDays)} days`,
      ];
    case "component":
      return [
        `Stock ${or(fields.initialStock)}${fields.unit ? ` ${fields.unit}` : ""}`,
      ];
    case "receipt":
      return [
        `${or(fields.quantity, "No quantity")} · ${or(fields.availableDate, "no date")}`,
      ];
    case "product":
      return [`SKU ${or(fields.sku)}`];
    case "order":
      return [
        `${or(fields.quantity, "No quantity")} · due ${or(fields.requiredDate, "no date")}`,
      ];
  }
}

export function BuildWorkspace({
  document,
  onChange,
  issues,
  onValidate,
  onRun,
  onCoreExample,
}: BuildWorkspaceProps) {
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [panelOpen, setPanelOpen] = useState(
    () => !window.matchMedia("(max-width: 720px)").matches,
  );
  const [revealNodeKey, setRevealNodeKey] = useState<NodeKey | null>(null);
  const [rawSelection, setSelection] = useState<BuilderSelection>(null);
  // A deleted or replaced item must not stay selected.
  const selection = liveSelection(document, rawSelection);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        !selection ||
        (event.key !== "Delete" && event.key !== "Backspace") ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        event.defaultPrevented ||
        event.isComposing ||
        window.document.querySelector('[role="dialog"]')
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            "input, textarea, select, [contenteditable], [role='dialog']",
          ))
      )
        return;
      event.preventDefault();
      onChange(
        selection.type === "node"
          ? deleteNode(document, selection.key)
          : deleteEdge(document, selection.id),
      );
      setSelection(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [document, onChange, selection]);

  const labels = useMemo(() => buildLabels(document), [document]);
  const side = useRef<HTMLElement>(null);
  const [focusRequest, setFocusRequest] = useState<{
    issue: BuilderIssue;
  } | null>(null);
  const issueGroups = useMemo(() => {
    const groups = new Map<string, { label: string; issues: BuilderIssue[] }>();
    for (const issue of issues) {
      const key =
        issue.nodeKey ?? (issue.edgeId ? `edge:${issue.edgeId}` : "network");
      const edge = document.edges.find((item) => item.id === issue.edgeId);
      const label = issue.nodeKey
        ? (labels.get(issue.nodeKey) ?? issue.nodeKey)
        : edge
          ? `${labels.get(edge.source) ?? edge.source} → ${labels.get(edge.target) ?? edge.target}`
          : "Network settings";
      const group = groups.get(key) ?? { label, issues: [] };
      group.issues.push(issue);
      groups.set(key, group);
    }
    // Item work before metadata, rather than implying compiler order is a workflow.
    return [...groups.entries()].sort(
      ([a], [b]) => Number(a === "network") - Number(b === "network"),
    );
  }, [issues, document.edges, labels]);
  function inspectIssue(issue: BuilderIssue) {
    setPanelOpen(true);
    const target = issueTarget(document, issue);
    setSelection(target);
    if (target?.type === "node") setRevealNodeKey(target.key);
    setFocusRequest({ issue });
  }
  useEffect(() => {
    if (!focusRequest) return;
    const frame = requestAnimationFrame(() => {
      const root = side.current;
      if (!root) return;
      const field = [
        ...root.querySelectorAll<HTMLElement>(
          ".builder-inspector [data-field]",
        ),
      ].find((item) => item.dataset.field === focusRequest.issue.field);
      const control = field?.querySelector<HTMLElement>(
        "input, select, button",
      );
      control?.focus({ preventScroll: true });
      control?.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRequest]);

  const summaries = useMemo(() => {
    const map = new Map<NodeKey, { title: string; details: string[] }>();
    for (const node of document.nodes) {
      const key = nodeKey(node);
      const name = nodeDisplayName(node).trim();
      const title =
        name || (node.kind === "receipt" ? KIND_LABELS.receipt : "Unnamed");
      map.set(key, {
        title,
        details: cardDetails(
          node.kind,
          node.fields as Record<string, string | null>,
        ),
      });
    }
    return map;
  }, [document]);

  const issueCounts = useMemo(() => {
    const counts = new Map<NodeKey, number>();
    for (const issue of issues) {
      if (!issue.nodeKey) continue;
      counts.set(
        issue.nodeKey as NodeKey,
        (counts.get(issue.nodeKey as NodeKey) ?? 0) + 1,
      );
    }
    return counts;
  }, [issues]);

  const edgeLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const edge of document.edges) {
      if (edge.kind === "bom") {
        map.set(
          edge.id,
          edge.quantity.trim() ? `× ${edge.quantity}` : "× quantity?",
        );
      }
    }
    return map;
  }, [document.edges]);

  function addItem(kind: NodeKind) {
    const result = addNode(document, kind);
    onChange(result.document);
    setSelection({ type: "node", key: result.key });
    setPanelOpen(true);
    setRevealNodeKey(result.key);
  }

  function handleMove(
    moves: { key: NodeKey; position: { x: number; y: number } }[],
  ) {
    const next = moveNodes(document, moves);
    if (next !== document) onChange(next);
  }

  function handleViewport(viewport: BuilderViewport) {
    const next = updateViewport(document, viewport);
    if (next !== document) onChange(next);
  }

  function handleConnect(
    candidate: RelationshipCandidate,
  ): ApplyConnectionResult {
    const result = applyConnection(document, candidate);
    if (result.ok) onChange(result.document);
    return result;
  }

  const ready = issues.length === 0 && document.nodes.length > 0;
  const selectedKey = selection?.type === "node" ? selection.key : null;

  return (
    <div
      className={`builder is-${mobileView} ${panelOpen ? "" : "panel-closed"}`}
      data-testid="build-workspace"
    >
      <h2 className="sr-only">Build the network</h2>
      <div className="builder__mobile-switch" role="group" aria-label="View">
        <button
          type="button"
          aria-pressed={mobileView === "list"}
          onClick={() => setMobileView("list")}
        >
          <List aria-hidden size={15} /> List
        </button>
        <button
          type="button"
          aria-pressed={mobileView === "map"}
          onClick={() => {
            setMobileView("map");
            setPanelOpen(false);
          }}
        >
          <Network aria-hidden size={15} /> Map
        </button>
      </div>

      <nav className="builder__palette" aria-label="Add to network">
        <Tooltip.Provider delayDuration={350}>
          {NODE_KIND_ORDER.map((kind) => {
            const Icon = PALETTE_ICONS[kind];
            return (
              <Tooltip.Root key={kind}>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className={`builder-palette__item is-${kind}`}
                    aria-label={`Add ${KIND_LABELS[kind].toLowerCase()}`}
                    onClick={() => addItem(kind)}
                  >
                    <span className="builder-palette__swatch" aria-hidden>
                      <Icon size={15} strokeWidth={1.8} />
                    </span>
                    <span>{KIND_LABELS[kind]}</span>
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="builder-palette__tooltip"
                    side="right"
                    sideOffset={10}
                    collisionPadding={12}
                  >
                    <strong>{KIND_LABELS[kind]}</strong>
                    <span>{PALETTE_DESCRIPTIONS[kind]}</span>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </Tooltip.Provider>
      </nav>

      <section className="builder__outline" aria-label="Network items">
        {document.nodes.length === 0 && (
          <div className="builder-outline__empty">
            <p>
              <strong>Start a network.</strong> Load the fictional example, or
              add items below and connect their matching handles on the map.
            </p>
            {onCoreExample && (
              <Button type="button" size="sm" onClick={onCoreExample}>
                Core example
              </Button>
            )}
          </div>
        )}
        {NODE_KIND_ORDER.map((kind) => {
          const nodes = document.nodes.filter((node) => node.kind === kind);
          return (
            <div className={`builder-outline__group is-${kind}`} key={kind}>
              <div className="builder-outline__head">
                <h3>{KIND_LABELS[kind]}s</h3>
                <span>{nodes.length}</span>
                <button
                  type="button"
                  onClick={() => addItem(kind)}
                  aria-label={`Add ${KIND_LABELS[kind].toLowerCase()}`}
                >
                  <Plus aria-hidden size={14} /> Add
                </button>
              </div>
              {nodes.length > 0 && (
                <ul>
                  {nodes.map((node) => {
                    const key = nodeKey(node);
                    const summary = summaries.get(key);
                    const count = issueCounts.get(key) ?? 0;
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          aria-current={
                            selectedKey === key ? "true" : undefined
                          }
                          onClick={() => {
                            setSelection({ type: "node", key });
                            setPanelOpen(true);
                          }}
                        >
                          <strong>{summary?.title}</strong>
                          <span>{summary?.details.join(" · ")}</span>
                          {count > 0 && (
                            <em>
                              {count} issue{count === 1 ? "" : "s"}
                            </em>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <div className="builder__canvas-wrap">
        <BuilderCanvas
          document={document}
          selection={selection}
          revealNodeKey={revealNodeKey}
          fitMobileMap={mobileView === "map"}
          onViewportChange={handleViewport}
          summaries={summaries}
          issueCounts={issueCounts}
          edgeLabels={edgeLabels}
          onSelect={(item) => {
            setSelection(item);
            setPanelOpen(item !== null);
          }}
          onMoveNodes={handleMove}
          onConnect={handleConnect}
        />
        {document.nodes.length === 0 && (
          <div className="builder__empty">
            <p>
              <strong>Start a network.</strong> Load the fictional example, or
              add a supplier from the palette and connect it through to a
              customer order.
            </p>
            {onCoreExample && (
              <Button type="button" size="sm" onClick={onCoreExample}>
                Core example
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="builder__status" role="group" aria-label="Network checks">
        <span
          className={`builder__status-dot ${ready ? "is-ok" : issues.length ? "is-bad" : ""}`}
        />
        <span className="builder__status-text">
          {document.nodes.length === 0
            ? "Empty network"
            : issues.length
              ? `${issues.length} check${issues.length === 1 ? "" : "s"} to complete`
              : "No problems listed"}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={onValidate}>
          <ShieldCheck aria-hidden /> Check network
        </Button>
        <Button type="button" size="sm" onClick={onRun}>
          <Play aria-hidden /> Run simulation
        </Button>
      </div>

      <aside className="builder__side" ref={side} aria-label="Network details">
        {issueGroups.length > 0 && (
          <div className="builder-next-step">
            <span>Next repair · keep building in any order</span>
            <button
              type="button"
              onClick={() => inspectIssue(issueGroups[0][1].issues[0])}
            >
              Go to {issueGroups[0][1].label} →
            </button>
          </div>
        )}
        <div className="builder__side-head">
          <section className="builder-field">
            <label htmlFor="builder-edit-item">Edit item</label>
            <select
              id="builder-edit-item"
              value={
                selection === null
                  ? "network"
                  : selection.type === "node"
                    ? `node:${selection.key}`
                    : `edge:${selection.id}`
              }
              onChange={(event) => {
                const value = event.target.value;
                setSelection(
                  value === "network"
                    ? null
                    : value.startsWith("node:")
                      ? { type: "node", key: value.slice(5) }
                      : { type: "edge", id: value.slice(5) },
                );
              }}
            >
              <option value="network">Network settings</option>
              {document.nodes.map((node) => (
                <option key={nodeKey(node)} value={`node:${nodeKey(node)}`}>
                  {labels.get(nodeKey(node))}
                </option>
              ))}
              {document.edges.map((edge) => (
                <option key={edge.id} value={`edge:${edge.id}`}>
                  {RELATIONSHIP_LABELS[edge.kind]}: {labels.get(edge.source)} →{" "}
                  {labels.get(edge.target)}
                </option>
              ))}
            </select>
          </section>
          <button
            type="button"
            className="builder__side-toggle"
            aria-expanded={panelOpen}
            onClick={() => setPanelOpen((open) => !open)}
            title={panelOpen ? "Hide details panel" : "Show details panel"}
          >
            {panelOpen ? (
              <PanelRightClose aria-hidden size={16} />
            ) : (
              <PanelRightOpen aria-hidden size={16} />
            )}
            <span className="builder__side-toggle-label">
              {panelOpen ? "Hide details panel" : "Show details panel"}
            </span>
          </button>
        </div>
        <div className="builder__side-collapse" inert={!panelOpen}>
          <div className="builder__side-body">
            <PropertiesInspector
              document={document}
              selection={selection}
              labels={labels}
              issues={issues}
              onChange={onChange}
              onSelect={setSelection}
            />

            <section
              className="builder-checks"
              aria-labelledby="builder-checks-title"
            >
              <h3 id="builder-checks-title" className="builder-section-title">
                Checks
              </h3>
              {issues.length === 0 ? (
                <p className="builder-checks__ok">
                  {document.nodes.length === 0
                    ? "Start with Core example, or name your network and add a supplier. Check network when you are ready."
                    : "No problems listed. Check the network to refresh."}
                </p>
              ) : (
                <div className="builder-check-groups">
                  <p className="builder-checks__intro">
                    {issues.length} checks to complete before simulation. Choose
                    an item to repair; all fields remain editable.
                  </p>
                  {issueGroups.map(([key, group], index) => (
                    <details
                      key={key}
                      open={index === 0}
                      className="builder-check-group"
                    >
                      <summary>
                        {group.label} <span>{group.issues.length}</span>
                      </summary>
                      <ul className="builder-issues builder-checks__list">
                        {group.issues.map((issue, i) => (
                          <li key={`${i}-${issue.message}`}>
                            <button
                              type="button"
                              className="builder-checks__jump"
                              onClick={() => inspectIssue(issue)}
                            >
                              {issue.message}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
}
