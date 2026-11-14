import { nodeKey } from "./factories";
import type {
  BuilderDocument,
  BuilderEdge,
  BuilderNode,
  NodeKey,
  NodeKind,
  RelationshipKind,
} from "./types";

const RELATIONSHIP_MAP: Record<string, RelationshipKind> = {
  "supplier->component": "primarySupplier",
  "supplier->receipt": "receiptSupplier",
  "receipt->component": "receiptComponent",
  "component->product": "bom",
  "product->order": "orderedProduct",
};

export function relationshipKind(
  sourceKind: NodeKind,
  targetKind: NodeKind,
): RelationshipKind | null {
  return RELATIONSHIP_MAP[`${sourceKind}->${targetKind}`] ?? null;
}

function generateEdgeId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `edge-${globalThis.crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `edge-${time}-${random}`;
}

function wouldCreateCycle(
  edges: readonly BuilderEdge[],
  source: NodeKey,
  target: NodeKey,
): boolean {
  const visited = new Set<NodeKey>();
  const stack: NodeKey[] = [target];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const edge of edges) {
      if (edge.source === current && !visited.has(edge.target)) {
        stack.push(edge.target);
      }
    }
  }
  return false;
}

export type ConnectCandidate = {
  kind: RelationshipKind;
  source: string;
  target: string;
};

export type CanConnectResult = { ok: true } | { ok: false; message: string };

export function canConnect(
  doc: BuilderDocument,
  candidate: ConnectCandidate,
): CanConnectResult {
  if (candidate.source === candidate.target) {
    return { ok: false, message: "Cannot connect a node to itself." };
  }

  const nodeByKey = new Map<NodeKey, BuilderNode>();
  for (const node of doc.nodes) {
    nodeByKey.set(nodeKey(node), node);
  }

  const sourceNode = nodeByKey.get(candidate.source);
  if (!sourceNode) {
    return {
      ok: false,
      message: `Source node "${candidate.source}" does not exist.`,
    };
  }

  const targetNode = nodeByKey.get(candidate.target);
  if (!targetNode) {
    return {
      ok: false,
      message: `Target node "${candidate.target}" does not exist.`,
    };
  }

  const expectedKind = relationshipKind(sourceNode.kind, targetNode.kind);
  if (!expectedKind) {
    return {
      ok: false,
      message: `Cannot connect ${sourceNode.kind} to ${targetNode.kind}.`,
    };
  }
  if (expectedKind !== candidate.kind) {
    return {
      ok: false,
      message: `Relationship kind "${candidate.kind}" is invalid for ${sourceNode.kind} to ${targetNode.kind}; expected "${expectedKind}".`,
    };
  }

  if (wouldCreateCycle(doc.edges, candidate.source, candidate.target)) {
    return { ok: false, message: "Connection would create a cycle." };
  }

  if (candidate.kind === "bom") {
    const duplicate = doc.edges.some(
      (edge) =>
        edge.kind === "bom" &&
        edge.source === candidate.source &&
        edge.target === candidate.target,
    );
    if (duplicate) {
      return {
        ok: false,
        message:
          "A BOM line between this component and product already exists.",
      };
    }
    return { ok: true };
  }

  const duplicateExact = doc.edges.some(
    (edge) =>
      edge.kind === candidate.kind &&
      edge.source === candidate.source &&
      edge.target === candidate.target,
  );
  if (duplicateExact) {
    return { ok: false, message: "This relationship already exists." };
  }

  if (candidate.kind === "receiptSupplier") {
    const hasSupplier = doc.edges.some(
      (edge) =>
        edge.kind === "receiptSupplier" && edge.target === candidate.target,
    );
    if (hasSupplier) {
      return {
        ok: false,
        message:
          "Receipt already has a supplier. Remove the existing link first.",
      };
    }
  } else if (candidate.kind === "receiptComponent") {
    const hasComponent = doc.edges.some(
      (edge) =>
        edge.kind === "receiptComponent" && edge.source === candidate.source,
    );
    if (hasComponent) {
      return {
        ok: false,
        message:
          "Receipt already targets a component. Remove the existing link first.",
      };
    }
  } else if (candidate.kind === "orderedProduct") {
    const hasProduct = doc.edges.some(
      (edge) =>
        edge.kind === "orderedProduct" && edge.target === candidate.target,
    );
    if (hasProduct) {
      return {
        ok: false,
        message: "Order already has a product. Remove the existing link first.",
      };
    }
  }

  return { ok: true };
}

export type ConnectNodesCandidate = ConnectCandidate & {
  quantity?: string;
};

export type ConnectNodesResult =
  { ok: true; document: BuilderDocument } | { ok: false; message: string };

export function connectNodes(
  doc: BuilderDocument,
  candidate: ConnectNodesCandidate,
): ConnectNodesResult {
  const check = canConnect(doc, candidate);
  if (!check.ok) {
    return check;
  }

  const id = generateEdgeId();
  const currentPrimary =
    candidate.kind === "primarySupplier"
      ? doc.edges
          .find(
            (edge) =>
              edge.kind === "primarySupplier" &&
              edge.target === candidate.target,
          )
          ?.source.slice("supplier:".length)
      : undefined;
  const nextNodes =
    candidate.kind === "primarySupplier"
      ? doc.nodes.map((node) =>
          node.kind === "component" && nodeKey(node) === candidate.target
            ? {
                ...node,
                fields: {
                  ...node.fields,
                  primarySupplierId:
                    node.fields.primarySupplierId ??
                    currentPrimary ??
                    candidate.source.slice("supplier:".length),
                },
              }
            : node,
        )
      : doc.nodes;
  const newEdge: BuilderEdge =
    candidate.kind === "bom"
      ? {
          id,
          kind: "bom",
          source: candidate.source,
          target: candidate.target,
          quantity: candidate.quantity ?? "",
        }
      : {
          id,
          kind: candidate.kind,
          source: candidate.source,
          target: candidate.target,
        };

  return {
    ok: true,
    document: {
      ...doc,
      revision: doc.revision + 1,
      nodes: nextNodes,
      edges: [...doc.edges, newEdge],
    },
  };
}

export function deleteNode(
  doc: BuilderDocument,
  targetNodeKey: string,
): BuilderDocument {
  const nextNodes = doc.nodes.filter((node) => nodeKey(node) !== targetNodeKey);
  const nextEdges = doc.edges.filter(
    (edge) => edge.source !== targetNodeKey && edge.target !== targetNodeKey,
  );
  if (
    nextNodes.length === doc.nodes.length &&
    nextEdges.length === doc.edges.length
  ) {
    return doc;
  }
  return {
    ...doc,
    revision: doc.revision + 1,
    nodes: nextNodes,
    edges: nextEdges,
  };
}

export function deleteEdge(
  doc: BuilderDocument,
  edgeId: string,
): BuilderDocument {
  const nextEdges = doc.edges.filter((edge) => edge.id !== edgeId);
  if (nextEdges.length === doc.edges.length) {
    return doc;
  }
  return {
    ...doc,
    revision: doc.revision + 1,
    edges: nextEdges,
  };
}
