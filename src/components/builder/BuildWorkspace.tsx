import { useMemo, useState } from "react";
import {
  Play,
  PackageCheck,
  Plus,
  ShieldCheck,
  Factory,
  Box,
  Cog,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { nodeKey } from "@/lib/builder/factories";
import type {
  BuilderDocument,
  BuilderViewport,
  BuilderIssue,
  NodeKey,
  NodeKind,
} from "@/lib/builder/types";
import { BuilderCanvas } from "./BuilderCanvas";
import { ConnectionForm } from "./ConnectionForm";
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
};

const PALETTE_ICONS: Record<NodeKind, LucideIcon> = {
  supplier: Factory,
  component: Cog,
  receipt: PackageCheck,
  product: Box,
  order: ClipboardList,
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
}: BuildWorkspaceProps) {
  const [revealNodeKey, setRevealNodeKey] = useState<NodeKey | null>(null);
  const [rawSelection, setSelection] = useState<BuilderSelection>(null);
  // A deleted or replaced item must not stay selected.
  const selection = liveSelection(document, rawSelection);

  const labels = useMemo(() => buildLabels(document), [document]);

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

  return (
    <div className="builder" data-testid="build-workspace">
      <header className="builder__toolbar">
        <div className="builder__title">
          <h2>Build the network</h2>
          <p>
            Draw suppliers, components, receipts, products and orders, then run
            the engine on the whole network.
          </p>
          <p className="builder-mobile-hint">
            On a phone, pan or zoom the canvas. Use Edit item and Connect below
            to edit without dragging.
          </p>
        </div>
        <div className="builder__actions">
          <Button type="button" variant="outline" onClick={onValidate}>
            <ShieldCheck aria-hidden /> Check network
          </Button>
          <Button type="button" onClick={onRun}>
            <Play aria-hidden /> Run simulation
          </Button>
        </div>
      </header>

      <nav className="builder__palette" aria-label="Add to network">
        {NODE_KIND_ORDER.map((kind) => {
          const Icon = PALETTE_ICONS[kind];
          return (
            <button
              key={kind}
              type="button"
              className="builder-palette__item"
              aria-label={`Add ${KIND_LABELS[kind].toLowerCase()}`}
              onClick={() => addItem(kind)}
            >
              <Icon aria-hidden size={15} strokeWidth={1.8} />
              <span>{KIND_LABELS[kind]}</span>
              <Plus aria-hidden size={13} />
            </button>
          );
        })}
      </nav>

      <div className="builder__canvas-wrap">
        <BuilderCanvas
          document={document}
          selection={selection}
          revealNodeKey={revealNodeKey}
          onViewportChange={handleViewport}
          summaries={summaries}
          issueCounts={issueCounts}
          edgeLabels={edgeLabels}
          onSelect={setSelection}
          onMoveNodes={handleMove}
          onConnect={handleConnect}
        />
        {document.nodes.length === 0 && (
          <p className="builder__empty">
            Start with Core example above, or add a supplier from the palette to
            build your own network.
          </p>
        )}
      </div>

      <aside className="builder__side" aria-label="Network details">
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
            <ul className="builder-issues builder-checks__list">
              {issues.map((issue, index) => {
                const target = issueTarget(document, issue);
                return (
                  <li key={`${index}-${issue.message}`}>
                    {target ? (
                      <button
                        type="button"
                        className="builder-checks__jump"
                        onClick={() => setSelection(target)}
                      >
                        {issue.message}
                      </button>
                    ) : (
                      issue.message
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <PropertiesInspector
          document={document}
          selection={selection}
          labels={labels}
          issues={issues}
          onChange={onChange}
          onSelect={setSelection}
        />

        <ConnectionForm
          document={document}
          labels={labels}
          onChange={onChange}
          onSelect={setSelection}
        />
      </aside>
    </div>
  );
}
