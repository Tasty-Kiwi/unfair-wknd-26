import type { Scenario } from "@/lib/types";

export const NODE_KINDS = [
  "supplier",
  "component",
  "receipt",
  "product",
  "order",
] as const;

export type NodeKind = (typeof NODE_KINDS)[number];

/** Canonical node identifier: `${kind}:${id}` where `id` is the immutable domain ID. */
export type NodeKey = string;

export type NodePosition = {
  x: number;
  y: number;
};

export type EditorNode<K extends NodeKind, F> = {
  kind: K;
  id: string;
  position: NodePosition;
  fields: F;
};

export type SupplierFields = {
  name: string;
  region: string;
  leadTimeDays: string;
};

export type ComponentFields = {
  name: string;
  unit: string;
  initialStock: string | null;
};

export type ReceiptFields = {
  quantity: string;
  availableDate: string;
};

export type ProductFields = {
  name: string;
  sku: string;
};

export type OrderFields = {
  customer: string;
  quantity: string;
  requiredDate: string;
  value: string;
};

export type BuilderNode =
  | EditorNode<"supplier", SupplierFields>
  | EditorNode<"component", ComponentFields>
  | EditorNode<"receipt", ReceiptFields>
  | EditorNode<"product", ProductFields>
  | EditorNode<"order", OrderFields>;

export const RELATIONSHIP_KINDS = [
  "primarySupplier",
  "receiptSupplier",
  "receiptComponent",
  "bom",
  "orderedProduct",
] as const;

export type RelationshipKind = (typeof RELATIONSHIP_KINDS)[number];

export type BuilderEdge =
  | {
      id: string;
      kind: Exclude<RelationshipKind, "bom">;
      source: NodeKey;
      target: NodeKey;
    }
  | {
      id: string;
      kind: "bom";
      source: NodeKey;
      target: NodeKey;
      quantity: string;
    };

export type BuilderViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type BuilderDocument = {
  id: string;
  name: string;
  asOf: string;
  revision: number;
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  viewport?: BuilderViewport;
};

export type BuilderIssue = {
  nodeKey?: NodeKey;
  edgeId?: string;
  field?: string;
  message: string;
};

export type ReceiptRelationshipSnapshot = {
  deliveryId: string;
  supplier: { id: string; name: string };
  component: { id: string; name: string };
};

export type ScenarioRecord = {
  scenario: Scenario;
  validatedNetworkKey: string | null;
  /** Relationships acknowledged at the last validation. Absent in older v1 files. */
  receiptSnapshots?: ReceiptRelationshipSnapshot[];
};

export type BuilderWorkspaceOrigin = "authored" | "fictional";

export type BuilderWorkspaceSource = {
  origin: BuilderWorkspaceOrigin;
  openedFromFile: boolean;
};

export const BUILDER_WORKSPACE_FORMAT = "dominoos-builder-workspace" as const;
export const BUILDER_WORKSPACE_VERSION = 1 as const;

export type BuilderWorkspaceV1 = {
  format: typeof BUILDER_WORKSPACE_FORMAT;
  version: typeof BUILDER_WORKSPACE_VERSION;
  document: BuilderDocument;
  scenarios: ScenarioRecord[];
  selectedScenarioId: string | null;
  workingScenario: ScenarioRecord | null;
  source: BuilderWorkspaceSource;
};
