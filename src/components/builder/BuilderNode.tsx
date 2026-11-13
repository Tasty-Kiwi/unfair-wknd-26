import type { CSSProperties } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  Box,
  Cog,
  Factory,
  ClipboardList,
  PackageCheck,
  type LucideIcon,
} from "lucide-react";
import type { NodeKind, RelationshipKind } from "@/lib/builder/types";
import {
  KIND_LABELS,
  RELATIONSHIP_COLORS,
  RELATIONSHIP_LABELS,
} from "./documentEdits";

export type BuilderFlowData = {
  nodeKey: string;
  kind: NodeKind;
  title: string;
  details: string[];
  issueCount: number;
};

export type BuilderFlowNode = Node<BuilderFlowData, "builder">;

/**
 * Typed ports per kind. Each handle id is the relationship kind it carries,
 * so a connection's handles name the relationship directly.
 */
const PORTS: Record<
  NodeKind,
  { inputs: RelationshipKind[]; outputs: RelationshipKind[] }
> = {
  supplier: { inputs: [], outputs: ["primarySupplier", "receiptSupplier"] },
  component: {
    inputs: ["primarySupplier", "receiptComponent"],
    outputs: ["bom"],
  },
  receipt: { inputs: ["receiptSupplier"], outputs: ["receiptComponent"] },
  product: { inputs: ["bom"], outputs: ["orderedProduct"] },
  order: { inputs: ["orderedProduct"], outputs: [] },
};

const ICONS: Record<NodeKind, LucideIcon> = {
  supplier: Factory,
  component: Cog,
  receipt: PackageCheck,
  product: Box,
  order: ClipboardList,
};

function handleTop(index: number, count: number): string {
  return `${((index + 1) * 100) / (count + 1)}%`;
}

export function BuilderNode({ data, selected }: NodeProps<BuilderFlowNode>) {
  const Icon = ICONS[data.kind];
  const ports = PORTS[data.kind];
  return (
    <div
      className={`builder-node builder-node--${data.kind}${selected ? " is-selected" : ""}`}
      data-node-key={data.nodeKey}
      data-kind={data.kind}
      role="group"
      aria-label={`${KIND_LABELS[data.kind]} ${data.title}`}
    >
      {ports.inputs.map((kind, index) => (
        <Handle
          key={`in-${kind}`}
          type="target"
          position={Position.Left}
          id={kind}
          className="builder-handle"
          style={
            {
              top: handleTop(index, ports.inputs.length),
              "--rel": RELATIONSHIP_COLORS[kind],
            } as CSSProperties
          }
          aria-label={`${RELATIONSHIP_LABELS[kind]} input`}
        />
      ))}
      {ports.outputs.map((kind, index) => (
        <Handle
          key={`out-${kind}`}
          type="source"
          position={Position.Right}
          id={kind}
          className="builder-handle"
          style={
            {
              top: handleTop(index, ports.outputs.length),
              "--rel": RELATIONSHIP_COLORS[kind],
            } as CSSProperties
          }
          aria-label={`${RELATIONSHIP_LABELS[kind]} output`}
        />
      ))}
      <div className="builder-node__head">
        <Icon
          aria-hidden
          className="builder-node__icon"
          size={15}
          strokeWidth={1.8}
        />
        <span className="builder-node__kind">{KIND_LABELS[data.kind]}</span>
        {data.issueCount > 0 && (
          <span
            className="builder-node__issue"
            title={`${data.issueCount} to fix`}
          >
            <span aria-hidden>!</span>
            {data.issueCount} to fix
          </span>
        )}
      </div>
      <div className="builder-node__title">{data.title}</div>
      {data.details.map((line, index) => (
        <div key={index} className="builder-node__detail">
          {line}
        </div>
      ))}
    </div>
  );
}
