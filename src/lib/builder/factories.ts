import type {
  BuilderDocument,
  BuilderEdge,
  BuilderNode,
  NodeKey,
  NodeKind,
  NodePosition,
} from "./types";

function generateId(prefix: string): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}-${time}-${random}`;
}

export function nodeKey(node: Pick<BuilderNode, "kind" | "id">): NodeKey {
  return `${node.kind}:${node.id}`;
}

export function createNode<K extends NodeKind>(
  kind: K,
  position?: NodePosition,
): Extract<BuilderNode, { kind: K }>;
export function createNode(
  kind: NodeKind,
  position?: NodePosition,
): BuilderNode;
export function createNode(
  kind: NodeKind,
  position: NodePosition = { x: 0, y: 0 },
): BuilderNode {
  const pos = { x: position.x, y: position.y };
  const id = generateId(kind);

  switch (kind) {
    case "supplier":
      return {
        kind: "supplier",
        id,
        position: pos,
        fields: {
          name: "",
          region: "",
          leadTimeDays: "0",
        },
      };
    case "component":
      return {
        kind: "component",
        id,
        position: pos,
        fields: {
          name: "",
          unit: "",
          initialStock: "",
        },
      };
    case "receipt":
      return {
        kind: "receipt",
        id,
        position: pos,
        fields: {
          quantity: "",
          availableDate: "",
        },
      };
    case "product":
      return {
        kind: "product",
        id,
        position: pos,
        fields: {
          name: "",
          sku: "",
        },
      };
    case "order":
      return {
        kind: "order",
        id,
        position: pos,
        fields: {
          customer: "",
          quantity: "",
          requiredDate: "",
          value: "",
        },
      };
  }
}

export function createBlankDocument(): BuilderDocument {
  return {
    id: generateId("doc"),
    name: "",
    asOf: "",
    revision: 0,
    nodes: [],
    edges: [],
  };
}

export function createCoreExample(): BuilderDocument {
  const supplier: BuilderNode = {
    kind: "supplier",
    id: "supplier-aster",
    position: { x: 60, y: 140 },
    fields: {
      name: "Aster Manufacturing",
      region: "",
      leadTimeDays: "0",
    },
  };
  const component: BuilderNode = {
    kind: "component",
    id: "component-servo-motor",
    position: { x: 340, y: 80 },
    fields: {
      name: "Servo motor",
      unit: "motors",
      initialStock: "8",
    },
  };
  const receipt: BuilderNode = {
    kind: "receipt",
    id: "receipt-servo-1",
    position: { x: 340, y: 280 },
    fields: {
      quantity: "5",
      availableDate: "2026-11-17",
    },
  };
  const product: BuilderNode = {
    kind: "product",
    id: "product-imu-001",
    position: { x: 640, y: 140 },
    fields: {
      name: "Industrial motor unit",
      sku: "IMU-001",
    },
  };
  const orderA: BuilderNode = {
    kind: "order",
    id: "order-customer-a",
    position: { x: 940, y: 60 },
    fields: {
      customer: "Customer A",
      quantity: "6",
      requiredDate: "2026-11-20",
      value: "0",
    },
  };
  const orderB: BuilderNode = {
    kind: "order",
    id: "order-customer-b",
    position: { x: 940, y: 240 },
    fields: {
      customer: "Customer B",
      quantity: "4",
      requiredDate: "2026-11-22",
      value: "0",
    },
  };

  const edges: BuilderEdge[] = [
    {
      id: "edge-primary-aster-servo",
      kind: "primarySupplier",
      source: nodeKey(supplier),
      target: nodeKey(component),
    },
    {
      id: "edge-receipt-supplier-aster",
      kind: "receiptSupplier",
      source: nodeKey(supplier),
      target: nodeKey(receipt),
    },
    {
      id: "edge-receipt-component-servo",
      kind: "receiptComponent",
      source: nodeKey(receipt),
      target: nodeKey(component),
    },
    {
      id: "edge-bom-servo-imu",
      kind: "bom",
      source: nodeKey(component),
      target: nodeKey(product),
      quantity: "1",
    },
    {
      id: "edge-order-imu-a",
      kind: "orderedProduct",
      source: nodeKey(product),
      target: nodeKey(orderA),
    },
    {
      id: "edge-order-imu-b",
      kind: "orderedProduct",
      source: nodeKey(product),
      target: nodeKey(orderB),
    },
  ];

  return {
    id: generateId("doc"),
    name: "Motor assembly network",
    asOf: "2026-11-13",
    revision: 0,
    nodes: [supplier, component, receipt, product, orderA, orderB],
    edges,
  };
}
