import { connectNodes } from "@/lib/builder/connections";
import { createNode, nodeKey } from "@/lib/builder/factories";
import {
  RELATIONSHIP_KINDS,
  type BuilderDocument,
  type BuilderViewport,
  type BuilderEdge,
  type BuilderNode,
  type NodeKey,
  type NodeKind,
  type RelationshipKind,
} from "@/lib/builder/types";

/**
 * Immutable editing helpers for the Build canvas and inspector.
 *
 * Business edits (fields, relationships, membership) bump `revision`.
 * Layout edits (node positions) never do. Field values are stored as the
 * raw text the user typed, so an empty field stays visibly empty.
 */

/** The item the user has picked on the canvas or in the relationship list. */
export type BuilderSelection =
  { type: "node"; key: NodeKey } | { type: "edge"; id: string } | null;

export const NODE_KIND_ORDER: readonly NodeKind[] = [
  "supplier",
  "component",
  "receipt",
  "product",
  "order",
];

export const KIND_LABELS: Record<NodeKind, string> = {
  supplier: "Supplier",
  component: "Component",
  receipt: "Receipt",
  product: "Product",
  order: "Customer order",
};

export const RELATIONSHIP_LABELS: Record<RelationshipKind, string> = {
  primarySupplier: "Primary supplier",
  receiptSupplier: "Receipt supplier",
  receiptComponent: "Receipt for component",
  bom: "Bill of materials",
  orderedProduct: "Ordered product",
};

/**
 * One colour per relationship kind, shared by the ports and the edges that
 * carry it, so matching ports read as "these connect". Red and blue stay
 * reserved for problems and selection.
 */
export const RELATIONSHIP_COLORS: Record<RelationshipKind, string> = {
  // Values live in index.css so each theme can tune them.
  primarySupplier: "var(--rel-primary-supplier)", // teal
  receiptSupplier: "var(--rel-receipt-supplier)", // ochre
  receiptComponent: "var(--rel-receipt-component)", // violet
  bom: "var(--rel-bom)", // olive
  orderedProduct: "var(--rel-ordered-product)", // magenta
};

/** Plain-language arrow for each relationship, used in the connection form. */
export const RELATIONSHIP_ENDS: Record<
  RelationshipKind,
  { source: NodeKind; target: NodeKind }
> = {
  primarySupplier: { source: "supplier", target: "component" },
  receiptSupplier: { source: "supplier", target: "receipt" },
  receiptComponent: { source: "receipt", target: "component" },
  bom: { source: "component", target: "product" },
  orderedProduct: { source: "product", target: "order" },
};

// Canvas column per kind, left to right along the supply chain.
const COLUMN_X: Record<NodeKind, number> = {
  supplier: 0,
  receipt: 300,
  component: 600,
  product: 900,
  order: 1200,
};
const ROW_HEIGHT = 150;

/** The user-entered name of an item; receipts have none and return "". */
export function nodeDisplayName(node: BuilderNode): string {
  switch (node.kind) {
    case "receipt":
      return "";
    case "order":
      return node.fields.customer;
    default:
      return node.fields.name;
  }
}

/**
 * Human label that stays distinct for items of the same kind, using their
 * position in the kind's list when the name is blank.
 */
export function buildLabels(doc: BuilderDocument): Map<NodeKey, string> {
  const labels = new Map<NodeKey, string>();
  for (const kind of NODE_KIND_ORDER) {
    doc.nodes
      .filter((node) => node.kind === kind)
      .forEach((node, index) => {
        const text = nodeDisplayName(node).trim();
        const ordinal = `${KIND_LABELS[kind]} ${index + 1}`;
        labels.set(
          nodeKey(node),
          text ? `${ordinal}: ${text}` : `${ordinal} (unnamed)`,
        );
      });
  }
  return labels;
}

export function findNode(
  doc: BuilderDocument,
  key: NodeKey,
): BuilderNode | undefined {
  return doc.nodes.find((node) => nodeKey(node) === key);
}

export function findEdge(
  doc: BuilderDocument,
  edgeId: string,
): BuilderEdge | undefined {
  return doc.edges.find((edge) => edge.id === edgeId);
}

export function edgesTouching(
  doc: BuilderDocument,
  key: NodeKey,
): BuilderEdge[] {
  return doc.edges.filter((edge) => edge.source === key || edge.target === key);
}

/** Next free canvas slot in the column for `kind`. */
function nextPosition(doc: BuilderDocument, kind: NodeKind) {
  const rows = doc.nodes.filter((node) => node.kind === kind).length;
  return { x: COLUMN_X[kind], y: 40 + rows * ROW_HEIGHT };
}

export function addNode(
  doc: BuilderDocument,
  kind: NodeKind,
): { document: BuilderDocument; key: NodeKey } {
  const node = createNode(kind, nextPosition(doc, kind));
  return {
    key: nodeKey(node),
    document: {
      ...doc,
      revision: doc.revision + 1,
      nodes: [...doc.nodes, node],
    },
  };
}

/** Business field edit. Returns the same document when the value is unchanged. */
export function updateNodeField(
  doc: BuilderDocument,
  key: NodeKey,
  field: string,
  value: string,
): BuilderDocument {
  let changed = false;
  const nodes = doc.nodes.map((node): BuilderNode => {
    if (nodeKey(node) !== key) return node;
    const fields = node.fields as Record<string, unknown>;
    if (!(field in fields) || fields[field] === value) return node;
    changed = true;
    return {
      ...node,
      fields: { ...node.fields, [field]: value },
    } as BuilderNode;
  });
  return changed ? { ...doc, revision: doc.revision + 1, nodes } : doc;
}

export function updateBomQuantity(
  doc: BuilderDocument,
  edgeId: string,
  quantity: string,
): BuilderDocument {
  let changed = false;
  const edges = doc.edges.map((edge): BuilderEdge => {
    if (
      edge.id !== edgeId ||
      edge.kind !== "bom" ||
      edge.quantity === quantity
    ) {
      return edge;
    }
    changed = true;
    return { ...edge, quantity };
  });
  return changed ? { ...doc, revision: doc.revision + 1, edges } : doc;
}

export function updateNetworkField(
  doc: BuilderDocument,
  field: "name" | "asOf",
  value: string,
): BuilderDocument {
  if (doc[field] === value) return doc;
  return { ...doc, revision: doc.revision + 1, [field]: value };
}

/** Layout-only update: no business revision change. */
export function moveNodes(
  doc: BuilderDocument,
  moves: readonly { key: NodeKey; position: { x: number; y: number } }[],
): BuilderDocument {
  if (moves.length === 0) return doc;
  const byKey = new Map(moves.map((move) => [move.key, move.position]));
  let changed = false;
  const nodes = doc.nodes.map((node) => {
    const next = byKey.get(nodeKey(node));
    if (!next) return node;
    if (next.x === node.position.x && next.y === node.position.y) return node;
    changed = true;
    return { ...node, position: { x: next.x, y: next.y } } as BuilderNode;
  });
  return changed ? { ...doc, nodes } : doc;
}

export type RelationshipCandidate = {
  kind: RelationshipKind;
  source: NodeKey;
  target: NodeKey;
  quantity?: string;
};

export type ApplyConnectionResult =
  | { ok: true; document: BuilderDocument; edgeId: string }
  | { ok: false; message: string };

/**
 * The single connect path for canvas drags and the relationship form.
 * Validation runs before any mutation; the created edge id is returned so the
 * caller can select it.
 */
export function applyConnection(
  doc: BuilderDocument,
  candidate: RelationshipCandidate,
): ApplyConnectionResult {
  const result = connectNodes(doc, candidate);
  if (!result.ok) return result;
  const created = result.document.edges[result.document.edges.length - 1];
  return { ok: true, document: result.document, edgeId: created.id };
}

/** Narrow a React Flow handle pair to a relationship candidate, or null. */
export function candidateFromHandles(
  source: string,
  target: string,
  sourceHandle: string | null | undefined,
  targetHandle: string | null | undefined,
): RelationshipCandidate | null {
  const kind = sourceHandle ?? "";
  if (!(RELATIONSHIP_KINDS as readonly string[]).includes(kind)) return null;
  if (targetHandle !== kind) return null;
  return { kind: kind as RelationshipKind, source, target };
}

/** Drops a selection whose node or edge no longer exists in the document. */
export function liveSelection(
  doc: BuilderDocument,
  selection: BuilderSelection,
): BuilderSelection {
  if (!selection) return null;
  const present =
    selection.type === "node"
      ? findNode(doc, selection.key) !== undefined
      : findEdge(doc, selection.id) !== undefined;
  return present ? selection : null;
}

/** Canvas framing is saved with the draft, without invalidating scenarios. */
export function updateViewport(
  doc: BuilderDocument,
  viewport: BuilderViewport,
): BuilderDocument {
  if (
    doc.viewport?.x === viewport.x &&
    doc.viewport.y === viewport.y &&
    doc.viewport.zoom === viewport.zoom
  )
    return doc;
  return { ...doc, viewport: { ...viewport } };
}
