import { useId, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteEdge, deleteNode } from "@/lib/builder/connections";
import { nodeKey } from "@/lib/builder/factories";
import type {
  BuilderDocument,
  BuilderEdge,
  BuilderIssue,
  BuilderNode,
  NodeKey,
  NodeKind,
} from "@/lib/builder/types";
import {
  KIND_LABELS,
  RELATIONSHIP_LABELS,
  edgesTouching,
  findEdge,
  findNode,
  updateBomQuantity,
  updateNetworkField,
  updateNodeField,
  type BuilderSelection,
} from "./documentEdits";

type FieldSpec = {
  field: string;
  label: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
};

// Field names match the frozen node field shapes in lib/builder/types.
const FIELDS: Record<NodeKind, FieldSpec[]> = {
  supplier: [
    { field: "name", label: "Name" },
    { field: "region", label: "Region" },
    { field: "leadTimeDays", label: "Lead time (days)", inputMode: "decimal" },
  ],
  component: [
    { field: "name", label: "Name" },
    { field: "unit", label: "Unit", placeholder: "e.g. motors" },
    {
      field: "initialStock",
      label: "Initial stock on hand",
      placeholder: "Blank means not entered",
      inputMode: "decimal",
    },
  ],
  receipt: [
    { field: "quantity", label: "Quantity", inputMode: "decimal" },
    {
      field: "availableDate",
      label: "Available date",
      placeholder: "YYYY-MM-DD",
    },
  ],
  product: [
    { field: "name", label: "Name" },
    { field: "sku", label: "SKU" },
  ],
  order: [
    { field: "customer", label: "Customer" },
    { field: "quantity", label: "Quantity", inputMode: "decimal" },
    {
      field: "requiredDate",
      label: "Required date",
      placeholder: "YYYY-MM-DD",
    },
    { field: "value", label: "Order value", inputMode: "decimal" },
  ],
};

export type PropertiesInspectorProps = {
  document: BuilderDocument;
  selection: BuilderSelection;
  labels: Map<NodeKey, string>;
  issues: BuilderIssue[];
  onChange: (next: BuilderDocument) => void;
  onSelect: (selection: BuilderSelection) => void;
};

export function PropertiesInspector(props: PropertiesInspectorProps) {
  const { selection } = props;
  // Keyed by selection so the delete confirmation never carries over.
  const resetKey =
    selection === null
      ? "network"
      : selection.type === "node"
        ? `node:${selection.key}`
        : `edge:${selection.id}`;
  if (selection?.type === "node") {
    const node = findNode(props.document, selection.key);
    if (node) return <NodeInspector key={resetKey} {...props} node={node} />;
  }
  if (selection?.type === "edge") {
    const edge = findEdge(props.document, selection.id);
    if (edge) return <EdgeInspector key={resetKey} {...props} edge={edge} />;
  }
  return <NetworkInspector key={resetKey} {...props} />;
}

function NetworkInspector({ document, onChange }: PropertiesInspectorProps) {
  const nameId = useId();
  const asOfId = useId();
  return (
    <section className="builder-inspector" aria-labelledby={`${nameId}-title`}>
      <h3 id={`${nameId}-title`} className="builder-inspector__title">
        Network
      </h3>
      <p className="builder-inspector__hint">
        Select a node or connection to edit it, or add items from the palette.
      </p>
      <div className="builder-field">
        <label htmlFor={nameId}>Network name</label>
        <input
          id={nameId}
          value={document.name}
          onChange={(event) =>
            onChange(updateNetworkField(document, "name", event.target.value))
          }
        />
      </div>
      <div className="builder-field">
        <label htmlFor={asOfId}>Inventory as of</label>
        <input
          id={asOfId}
          value={document.asOf}
          placeholder="YYYY-MM-DD"
          onChange={(event) =>
            onChange(updateNetworkField(document, "asOf", event.target.value))
          }
        />
      </div>
    </section>
  );
}

function NodeInspector({
  document,
  node,
  labels,
  issues,
  onChange,
  onSelect,
}: PropertiesInspectorProps & { node: BuilderNode }) {
  const key = nodeKey(node);
  const [confirming, setConfirming] = useState(false);
  const touching = edgesTouching(document, key);
  const nodeIssues = issues.filter((issue) => issue.nodeKey === key);
  const headingId = useId();

  return (
    <section className="builder-inspector" aria-labelledby={headingId}>
      <p className="builder-inspector__kind">{KIND_LABELS[node.kind]}</p>
      <h3 id={headingId} className="builder-inspector__title">
        {labels.get(key) ?? key}
      </h3>
      <p className="builder-inspector__id">ID {node.id}</p>

      {FIELDS[node.kind].map((spec) => (
        <FieldInput
          key={spec.field}
          spec={spec}
          nodeKey={key}
          value={String(
            (node.fields as Record<string, unknown>)[spec.field] ?? "",
          )}
          issues={nodeIssues}
          onCommit={(value) =>
            onChange(updateNodeField(document, key, spec.field, value))
          }
        />
      ))}

      {nodeIssues.some((issue) => !issue.field) && (
        <IssueList issues={nodeIssues.filter((issue) => !issue.field)} />
      )}

      <div className="builder-inspector__actions">
        {confirming ? (
          <>
            <p role="alert" className="builder-inspector__confirm">
              Delete this {KIND_LABELS[node.kind].toLowerCase()}
              {touching.length > 0 &&
                ` and ${touching.length} connection${touching.length === 1 ? "" : "s"}`}
              ?
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onChange(deleteNode(document, key));
                onSelect(null);
              }}
            >
              Confirm delete
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirming(true)}
          >
            <Trash2 aria-hidden /> Delete {KIND_LABELS[node.kind].toLowerCase()}
          </Button>
        )}
      </div>
    </section>
  );
}

function EdgeInspector({
  document,
  edge,
  labels,
  issues,
  onChange,
  onSelect,
}: PropertiesInspectorProps & { edge: BuilderEdge }) {
  const [confirming, setConfirming] = useState(false);
  const quantityId = useId();
  const headingId = useId();
  const edgeIssues = issues.filter((issue) => issue.edgeId === edge.id);
  const isBom = edge.kind === "bom";

  return (
    <section className="builder-inspector" aria-labelledby={headingId}>
      <p className="builder-inspector__kind">Connection</p>
      <h3 id={headingId} className="builder-inspector__title">
        {RELATIONSHIP_LABELS[edge.kind]}
      </h3>
      <p className="builder-inspector__id">
        {labels.get(edge.source) ?? edge.source} →{" "}
        {labels.get(edge.target) ?? edge.target}
      </p>

      {isBom && (
        <div className="builder-field">
          <label htmlFor={quantityId}>Quantity per product unit</label>
          <input
            id={quantityId}
            data-edge-id={edge.id}
            inputMode="decimal"
            aria-invalid={
              edgeIssues.some((issue) => issue.field === "quantity") ||
              undefined
            }
            aria-describedby={
              edgeIssues.length ? `${quantityId}-issue` : undefined
            }
            value={edge.quantity}
            placeholder="Required — enter a quantity"
            onChange={(event) =>
              onChange(updateBomQuantity(document, edge.id, event.target.value))
            }
          />
          {edgeIssues.length > 0 && (
            <IssueList id={`${quantityId}-issue`} issues={edgeIssues} />
          )}
        </div>
      )}
      {!isBom && edgeIssues.length > 0 && <IssueList issues={edgeIssues} />}

      <div className="builder-inspector__actions">
        {confirming ? (
          <>
            <p role="alert" className="builder-inspector__confirm">
              Remove this connection?
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onChange(deleteEdge(document, edge.id));
                onSelect(null);
              }}
            >
              Confirm remove
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirming(true)}
          >
            <Trash2 aria-hidden /> Remove connection
          </Button>
        )}
      </div>
    </section>
  );
}

function FieldInput({
  spec,
  nodeKey: key,
  value,
  issues,
  onCommit,
}: {
  spec: FieldSpec;
  nodeKey: NodeKey;
  value: string;
  issues: BuilderIssue[];
  onCommit: (value: string) => void;
}) {
  const id = useId();
  const fieldIssues = issues.filter((issue) => issue.field === spec.field);
  const issueId = `${id}-issue`;
  return (
    <div className="builder-field" data-field={spec.field} data-node-key={key}>
      <label htmlFor={id}>{spec.label}</label>
      <input
        id={id}
        name={spec.field}
        value={value}
        placeholder={spec.placeholder}
        inputMode={spec.inputMode}
        aria-invalid={fieldIssues.length > 0 || undefined}
        aria-describedby={fieldIssues.length > 0 ? issueId : undefined}
        // Raw text is stored as typed, so an empty field stays visibly empty.
        onChange={(event) => onCommit(event.target.value)}
      />
      {fieldIssues.length > 0 && (
        <IssueList id={issueId} issues={fieldIssues} />
      )}
    </div>
  );
}

export function IssueList({
  issues,
  id,
}: {
  issues: BuilderIssue[];
  id?: string;
}) {
  if (issues.length === 0) return null;
  return (
    <ul className="builder-issues" id={id}>
      {issues.map((issue, index) => (
        <li key={`${index}-${issue.message}`}>{issue.message}</li>
      ))}
    </ul>
  );
}

/** Finds the node or edge a stored issue points at, for jump-to actions. */
export function issueTarget(
  document: BuilderDocument,
  issue: BuilderIssue,
): BuilderSelection {
  if (issue.edgeId && findEdge(document, issue.edgeId)) {
    return { type: "edge", id: issue.edgeId };
  }
  if (issue.nodeKey && findNode(document, issue.nodeKey)) {
    return { type: "node", key: issue.nodeKey };
  }
  return null;
}
