import type {
  AlternativeSupply,
  Component,
  CustomerOrder,
  Dataset,
  Delivery,
  Inventory,
  Product,
  Supplier,
} from "@/lib/types";
import { isIsoDate, parseDataset } from "@/lib/validation";
import { relationshipKind } from "./connections";
import { nodeKey } from "./factories";
import type {
  BuilderDocument,
  BuilderEdge,
  BuilderIssue,
  BuilderNode,
  NodeKey,
} from "./types";

const compareCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const hasNonWhitespace = (value: string): boolean => /\S/.test(value);

function parseWholeNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  return Number.isSafeInteger(num) ? num : null;
}

function parsePositiveInt(raw: string): number | null {
  const num = parseWholeNumber(raw);
  return num !== null && num >= 1 ? num : null;
}

function parseNonNegativeFinite(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

export type CompileGraphResult =
  | { ok: false; issues: BuilderIssue[] }
  | {
      ok: true;
      dataset: Dataset;
      networkKey: string;
      canSimulate: boolean;
    };

export function computeNetworkKey(
  workspaceId: string,
  dataset: Dataset,
): string {
  const canonicalMaterial = {
    v: 1,
    workspaceId,
    asOf: dataset.asOf,
    suppliers: [...dataset.suppliers]
      .sort((a, b) => compareCodePoint(a.id, b.id))
      .map((s) => s.id),
    components: [...dataset.components]
      .sort((a, b) => compareCodePoint(a.id, b.id))
      .map((c) => ({
        id: c.id,
        supplierId: c.supplierId,
        ...((c.supplierIds?.length ?? 0) > 1
          ? { supplierIds: [...c.supplierIds!].sort(compareCodePoint) }
          : {}),
      })),
    inventory: [...dataset.inventory]
      .sort((a, b) => compareCodePoint(a.componentId, b.componentId))
      .map((inv) => ({
        componentId: inv.componentId,
        quantity: inv.quantity,
      })),
    products: [...dataset.products]
      .sort((a, b) => compareCodePoint(a.id, b.id))
      .map((p) => ({
        id: p.id,
        bom: [...p.bom]
          .sort((a, b) => compareCodePoint(a.componentId, b.componentId))
          .map((line) => ({
            componentId: line.componentId,
            quantity: line.quantity,
          })),
      })),
    deliveries: [...dataset.deliveries]
      .sort((a, b) => compareCodePoint(a.id, b.id))
      .map((d) => ({
        id: d.id,
        supplierId: d.supplierId,
        componentId: d.componentId,
        quantity: d.quantity,
        availableDate: d.availableDate,
      })),
    orders: [...dataset.orders]
      .sort((a, b) => compareCodePoint(a.id, b.id))
      .map((o) => ({
        id: o.id,
        productId: o.productId,
        quantity: o.quantity,
        requiredDate: o.requiredDate,
        value: o.value,
      })),
    alternatives: [...dataset.alternatives]
      .sort((a, b) => compareCodePoint(a.id, b.id))
      .map((a) => ({
        id: a.id,
        supplierId: a.supplierId,
        componentId: a.componentId,
        quantity: a.quantity,
        availableDate: a.availableDate,
        approved: a.approved,
        approvedProductIds: [...a.approvedProductIds].sort(compareCodePoint),
      })),
  };

  return `nk1:${JSON.stringify(canonicalMaterial)}`;
}

/** Validate the approved-alternative catalog against the graph's nodes. Returns
 * the domain alternatives that are individually valid; problems are appended
 * to `issues` so a bad catalog blocks compilation explicitly. */
function compileAlternatives(
  catalog: readonly AlternativeSupply[],
  nodeByKey: ReadonlyMap<NodeKey, BuilderNode>,
  asOf: string | null,
  issues: BuilderIssue[],
): AlternativeSupply[] {
  const out: AlternativeSupply[] = [];
  const seen = new Set<string>();
  const reportedDuplicates = new Set<string>();

  for (const alt of catalog) {
    const label = hasNonWhitespace(alt.id) ? `"${alt.id}"` : "(no id)";
    const problems: { field: string; message: string }[] = [];
    const problem = (field: string, message: string) =>
      problems.push({ field, message: `Alternative ${label}: ${message}` });

    if (!hasNonWhitespace(alt.id)) {
      problem("id", "id must not be blank.");
    } else if (seen.has(alt.id)) {
      if (!reportedDuplicates.has(alt.id)) {
        problem("id", "duplicate alternative id. IDs must be unique.");
        reportedDuplicates.add(alt.id);
      }
    }
    seen.add(alt.id);

    if (!hasNonWhitespace(alt.name)) {
      problem("name", "name must not be blank.");
    }

    const supplier = nodeByKey.get(`supplier:${alt.supplierId}`);
    if (!supplier) {
      problem(
        "supplierId",
        hasNonWhitespace(alt.supplierId)
          ? `supplier "${alt.supplierId}" does not exist in this network.`
          : "choose a supplier.",
      );
    }
    const component = nodeByKey.get(`component:${alt.componentId}`);
    if (!component) {
      problem(
        "componentId",
        hasNonWhitespace(alt.componentId)
          ? `component "${alt.componentId}" does not exist in this network.`
          : "choose a component.",
      );
    }

    if (!Number.isSafeInteger(alt.quantity) || alt.quantity < 0) {
      problem("quantity", "quantity must be a whole number (0 or more).");
    }

    const date = alt.availableDate.trim();
    if (!isIsoDate(date)) {
      problem(
        "availableDate",
        "available date must be a real calendar date in YYYY-MM-DD format.",
      );
    } else if (asOf !== null && date < asOf) {
      problem(
        "availableDate",
        `available date ${date} cannot be before inventory date ${asOf}.`,
      );
    }

    if (typeof alt.approved !== "boolean") {
      problem("approved", "approval must be explicitly yes or no.");
    }

    if (alt.approvedProductIds.length === 0) {
      problem(
        "approvedProductIds",
        "list at least one product (alternatives are product-scoped).",
      );
    }
    const scoped = new Set<string>();
    for (const productId of alt.approvedProductIds) {
      if (!nodeByKey.has(`product:${productId}`)) {
        problem(
          "approvedProductIds",
          `approved product "${productId}" does not exist in this network.`,
        );
      }
      if (scoped.has(productId)) {
        problem(
          "approvedProductIds",
          `product "${productId}" is listed more than once.`,
        );
      }
      scoped.add(productId);
    }

    for (const item of problems) {
      issues.push({
        alternativeId: alt.id,
        field: item.field,
        message: item.message,
      });
    }
    if (problems.length === 0) {
      out.push({
        id: alt.id,
        name: alt.name.trim(),
        supplierId: alt.supplierId,
        componentId: alt.componentId,
        quantity: alt.quantity,
        availableDate: date,
        approved: alt.approved,
        approvedProductIds: [...alt.approvedProductIds],
      });
    }
  }
  return out;
}

export function compileGraph(doc: BuilderDocument): CompileGraphResult {
  const issues: BuilderIssue[] = [];

  if (!hasNonWhitespace(doc.id)) {
    issues.push({ field: "id", message: "Workspace id must not be blank." });
  }
  if (!hasNonWhitespace(doc.name)) {
    issues.push({
      field: "name",
      message: "Network name must not be blank.",
    });
  }

  const trimmedAsOf = doc.asOf.trim();
  const validAsOf = isIsoDate(trimmedAsOf);
  if (!validAsOf) {
    issues.push({
      field: "asOf",
      message:
        "Inventory date must be a real calendar date in YYYY-MM-DD format.",
    });
  }

  const nodeByKey = new Map<NodeKey, BuilderNode>();
  const duplicateKeys = new Set<NodeKey>();
  for (const node of doc.nodes) {
    const key = nodeKey(node);
    if (!hasNonWhitespace(node.id)) {
      issues.push({
        nodeKey: key,
        field: "id",
        message: `${node.kind} id must not be blank.`,
      });
    }
    if (nodeByKey.has(key)) {
      if (!duplicateKeys.has(key)) {
        issues.push({
          nodeKey: key,
          field: "id",
          message: `Duplicate ${node.kind} id "${node.id}". IDs must be unique per kind.`,
        });
        duplicateKeys.add(key);
      }
    } else {
      nodeByKey.set(key, node);
    }
  }

  const seenEdgeIds = new Set<string>();
  const primarySupplierByComponent = new Map<NodeKey, BuilderEdge[]>();
  const supplierByReceipt = new Map<NodeKey, BuilderEdge[]>();
  const componentByReceipt = new Map<NodeKey, BuilderEdge[]>();
  const bomEdgesByProduct = new Map<NodeKey, BuilderEdge[]>();
  const productByOrder = new Map<NodeKey, BuilderEdge[]>();
  const seenBomPairs = new Set<string>();
  const seenEdgeTriples = new Set<string>();

  for (const edge of doc.edges) {
    if (!hasNonWhitespace(edge.id)) {
      issues.push({ edgeId: edge.id, message: "Edge id must not be blank." });
    } else if (seenEdgeIds.has(edge.id)) {
      issues.push({
        edgeId: edge.id,
        message: `Duplicate edge id "${edge.id}".`,
      });
    }
    seenEdgeIds.add(edge.id);

    const sourceNode = nodeByKey.get(edge.source);
    const targetNode = nodeByKey.get(edge.target);
    if (!sourceNode || !targetNode) {
      issues.push({
        edgeId: edge.id,
        message: "Relationship references a missing node.",
      });
      continue;
    }
    if (edge.source === edge.target) {
      issues.push({
        edgeId: edge.id,
        message: "Self-loop relationships are not allowed.",
      });
      continue;
    }

    const expected = relationshipKind(sourceNode.kind, targetNode.kind);
    if (expected !== edge.kind) {
      issues.push({
        edgeId: edge.id,
        message: `Invalid relationship "${edge.kind}" between ${sourceNode.kind} and ${targetNode.kind}.`,
      });
      continue;
    }

    if (edge.kind === "bom") {
      const pairKey = `${edge.source}->${edge.target}`;
      if (seenBomPairs.has(pairKey)) {
        issues.push({
          edgeId: edge.id,
          message: "Duplicate BOM line between the same component and product.",
        });
      }
      seenBomPairs.add(pairKey);

      const list = bomEdgesByProduct.get(edge.target) ?? [];
      list.push(edge);
      bomEdgesByProduct.set(edge.target, list);
    } else {
      const tripleKey = `${edge.kind}:${edge.source}->${edge.target}`;
      if (seenEdgeTriples.has(tripleKey)) {
        issues.push({
          edgeId: edge.id,
          message: "Duplicate relationship between the same nodes.",
        });
      }
      seenEdgeTriples.add(tripleKey);

      if (edge.kind === "primarySupplier") {
        const list = primarySupplierByComponent.get(edge.target) ?? [];
        list.push(edge);
        primarySupplierByComponent.set(edge.target, list);
      } else if (edge.kind === "receiptSupplier") {
        const list = supplierByReceipt.get(edge.target) ?? [];
        list.push(edge);
        supplierByReceipt.set(edge.target, list);
      } else if (edge.kind === "receiptComponent") {
        const list = componentByReceipt.get(edge.source) ?? [];
        list.push(edge);
        componentByReceipt.set(edge.source, list);
      } else if (edge.kind === "orderedProduct") {
        const list = productByOrder.get(edge.target) ?? [];
        list.push(edge);
        productByOrder.set(edge.target, list);
      }
    }
  }

  const alternatives = compileAlternatives(
    doc.alternatives ?? [],
    nodeByKey,
    validAsOf ? trimmedAsOf : null,
    issues,
  );

  const suppliers: Supplier[] = [];
  const components: Component[] = [];
  const inventory: Inventory[] = [];
  const deliveries: Delivery[] = [];
  const products: Product[] = [];
  const orders: CustomerOrder[] = [];

  for (const node of doc.nodes) {
    const key = nodeKey(node);

    if (node.kind === "supplier") {
      if (!hasNonWhitespace(node.fields.name)) {
        issues.push({
          nodeKey: key,
          field: "name",
          message: "Supplier name must not be blank.",
        });
      }
      const leadTime = parseWholeNumber(node.fields.leadTimeDays);
      if (leadTime === null) {
        issues.push({
          nodeKey: key,
          field: "leadTimeDays",
          message:
            "Supplier lead time days must be a whole number (0 or more).",
        });
      }
      if (hasNonWhitespace(node.fields.name) && leadTime !== null) {
        suppliers.push({
          id: node.id,
          name: node.fields.name.trim(),
          region: node.fields.region.trim(),
          leadTimeDays: leadTime,
        });
      }
    } else if (node.kind === "component") {
      if (!hasNonWhitespace(node.fields.name)) {
        issues.push({
          nodeKey: key,
          field: "name",
          message: "Component name must not be blank.",
        });
      }
      if (!hasNonWhitespace(node.fields.unit)) {
        issues.push({
          nodeKey: key,
          field: "unit",
          message: "Component unit must not be blank.",
        });
      }

      let stockQty: number | null = null;
      if (node.fields.initialStock !== null) {
        stockQty = parseWholeNumber(node.fields.initialStock);
        if (stockQty === null) {
          issues.push({
            nodeKey: key,
            field: "initialStock",
            message:
              "Initial stock must be a whole number (enter 0 for empty stock).",
          });
        }
      }

      const primaryEdges = primarySupplierByComponent.get(key) ?? [];
      if (primaryEdges.length === 0) {
        issues.push({
          nodeKey: key,
          field: "primarySupplier",
          message: "Component must be connected to a primary supplier.",
        });
      }
      const rawPrimary = node.fields.primarySupplierId;
      const primaryEdge = rawPrimary
        ? primaryEdges.find((edge) => edge.source === `supplier:${rawPrimary}`)
        : primaryEdges[0];
      if (rawPrimary && !primaryEdge)
        issues.push({
          nodeKey: key,
          field: "primarySupplier",
          message: `Primary supplier "${rawPrimary}" must remain connected.`,
        });
      const supplierNode = primaryEdge
        ? nodeByKey.get(primaryEdge.source)
        : undefined;
      const supplierIds = [
        ...new Set(
          primaryEdges.map((edge) => edge.source.slice("supplier:".length)),
        ),
      ];

      if (
        hasNonWhitespace(node.fields.name) &&
        hasNonWhitespace(node.fields.unit) &&
        supplierNode?.kind === "supplier" &&
        (node.fields.initialStock === null || stockQty !== null)
      ) {
        components.push({
          id: node.id,
          name: node.fields.name.trim(),
          unit: node.fields.unit.trim(),
          supplierId: supplierNode.id,
          ...(supplierIds.length > 1 ? { supplierIds } : {}),
        });
        if (stockQty !== null) {
          inventory.push({
            componentId: node.id,
            quantity: stockQty,
          });
        }
      }
    } else if (node.kind === "receipt") {
      const qty = parseWholeNumber(node.fields.quantity);
      if (qty === null) {
        issues.push({
          nodeKey: key,
          field: "quantity",
          message: "Receipt quantity must be a whole number (0 or more).",
        });
      }

      const availDate = node.fields.availableDate.trim();
      const validDate = isIsoDate(availDate);
      if (!validDate) {
        issues.push({
          nodeKey: key,
          field: "availableDate",
          message:
            "Receipt available date must be a real calendar date in YYYY-MM-DD format.",
        });
      } else if (validAsOf && availDate < trimmedAsOf) {
        issues.push({
          nodeKey: key,
          field: "availableDate",
          message: `Receipt available date ${availDate} cannot be before inventory date ${trimmedAsOf}.`,
        });
      }

      const supplierEdges = supplierByReceipt.get(key) ?? [];
      if (supplierEdges.length === 0) {
        issues.push({
          nodeKey: key,
          field: "receiptSupplier",
          message: "Receipt must be connected from a supplier.",
        });
      } else if (supplierEdges.length > 1) {
        for (const extra of supplierEdges.slice(1)) {
          issues.push({
            nodeKey: key,
            edgeId: extra.id,
            field: "receiptSupplier",
            message: "Receipt can only have one supplier.",
          });
        }
      }

      const componentEdges = componentByReceipt.get(key) ?? [];
      if (componentEdges.length === 0) {
        issues.push({
          nodeKey: key,
          field: "receiptComponent",
          message: "Receipt must be connected to a component.",
        });
      } else if (componentEdges.length > 1) {
        for (const extra of componentEdges.slice(1)) {
          issues.push({
            nodeKey: key,
            edgeId: extra.id,
            field: "receiptComponent",
            message: "Receipt can only target one component.",
          });
        }
      }

      const supplierNode =
        supplierEdges.length === 1
          ? nodeByKey.get(supplierEdges[0].source)
          : undefined;
      const componentNode =
        componentEdges.length === 1
          ? nodeByKey.get(componentEdges[0].target)
          : undefined;

      if (
        qty !== null &&
        validDate &&
        (!validAsOf || availDate >= trimmedAsOf) &&
        supplierNode?.kind === "supplier" &&
        componentNode?.kind === "component"
      ) {
        deliveries.push({
          id: node.id,
          supplierId: supplierNode.id,
          componentId: componentNode.id,
          quantity: qty,
          availableDate: availDate,
        });
      }
    } else if (node.kind === "product") {
      if (!hasNonWhitespace(node.fields.name)) {
        issues.push({
          nodeKey: key,
          field: "name",
          message: "Product name must not be blank.",
        });
      }
      if (!hasNonWhitespace(node.fields.sku)) {
        issues.push({
          nodeKey: key,
          field: "sku",
          message: "Product SKU must not be blank.",
        });
      }

      const bomEdges = bomEdgesByProduct.get(key) ?? [];
      if (bomEdges.length === 0) {
        issues.push({
          nodeKey: key,
          field: "bom",
          message: "Product must have at least one component BOM line.",
        });
      }

      const bomLines: { componentId: string; quantity: number }[] = [];
      let bomValid = true;
      for (const edge of bomEdges) {
        if (edge.kind !== "bom") continue;
        const bomQty = parsePositiveInt(edge.quantity);
        if (bomQty === null) {
          issues.push({
            nodeKey: key,
            edgeId: edge.id,
            field: "quantity",
            message: "BOM quantity must be a whole number of at least 1.",
          });
          bomValid = false;
          continue;
        }
        const compNode = nodeByKey.get(edge.source);
        if (compNode?.kind === "component") {
          bomLines.push({
            componentId: compNode.id,
            quantity: bomQty,
          });
        } else {
          bomValid = false;
        }
      }

      if (
        hasNonWhitespace(node.fields.name) &&
        hasNonWhitespace(node.fields.sku) &&
        bomEdges.length > 0 &&
        bomValid
      ) {
        bomLines.sort((a, b) => compareCodePoint(a.componentId, b.componentId));
        products.push({
          id: node.id,
          name: node.fields.name.trim(),
          sku: node.fields.sku.trim(),
          bom: bomLines,
        });
      }
    } else if (node.kind === "order") {
      if (!hasNonWhitespace(node.fields.customer)) {
        issues.push({
          nodeKey: key,
          field: "customer",
          message: "Order customer must not be blank.",
        });
      }

      const qty = parsePositiveInt(node.fields.quantity);
      if (qty === null) {
        issues.push({
          nodeKey: key,
          field: "quantity",
          message: "Order quantity must be a whole number of at least 1.",
        });
      }

      const reqDate = node.fields.requiredDate.trim();
      const validDate = isIsoDate(reqDate);
      if (!validDate) {
        issues.push({
          nodeKey: key,
          field: "requiredDate",
          message:
            "Order required date must be a real calendar date in YYYY-MM-DD format.",
        });
      } else if (validAsOf && reqDate < trimmedAsOf) {
        issues.push({
          nodeKey: key,
          field: "requiredDate",
          message: `Order required date ${reqDate} cannot be before inventory date ${trimmedAsOf}.`,
        });
      }

      const orderValue = parseNonNegativeFinite(node.fields.value);
      if (orderValue === null) {
        issues.push({
          nodeKey: key,
          field: "value",
          message: "Order value must be a finite number (0 or more).",
        });
      }

      const productEdges = productByOrder.get(key) ?? [];
      if (productEdges.length === 0) {
        issues.push({
          nodeKey: key,
          field: "orderedProduct",
          message: "Order must be connected from a product.",
        });
      } else if (productEdges.length > 1) {
        for (const extra of productEdges.slice(1)) {
          issues.push({
            nodeKey: key,
            edgeId: extra.id,
            field: "orderedProduct",
            message: "Order can only reference one product.",
          });
        }
      }

      const productNode =
        productEdges.length === 1
          ? nodeByKey.get(productEdges[0].source)
          : undefined;

      if (
        hasNonWhitespace(node.fields.customer) &&
        qty !== null &&
        validDate &&
        (!validAsOf || reqDate >= trimmedAsOf) &&
        orderValue !== null &&
        productNode?.kind === "product"
      ) {
        orders.push({
          id: node.id,
          customer: node.fields.customer.trim(),
          productId: productNode.id,
          quantity: qty,
          requiredDate: reqDate,
          value: orderValue,
        });
      }
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  suppliers.sort((a, b) => compareCodePoint(a.id, b.id));
  components.sort((a, b) => compareCodePoint(a.id, b.id));
  inventory.sort((a, b) => compareCodePoint(a.componentId, b.componentId));
  deliveries.sort((a, b) => compareCodePoint(a.id, b.id));
  products.sort((a, b) => compareCodePoint(a.id, b.id));
  orders.sort((a, b) => compareCodePoint(a.id, b.id));
  alternatives.sort((a, b) => compareCodePoint(a.id, b.id));

  const candidateDataset: Dataset = {
    name: doc.name.trim(),
    asOf: trimmedAsOf,
    suppliers,
    components,
    products,
    inventory,
    deliveries,
    orders,
    alternatives,
  };

  try {
    const validated = parseDataset(candidateDataset);
    const networkKey = computeNetworkKey(doc.id, validated);
    return {
      ok: true,
      dataset: validated,
      networkKey,
      canSimulate: validated.orders.length > 0,
    };
  } catch (err) {
    return {
      ok: false,
      issues: [
        {
          message:
            err instanceof Error ? err.message : "Dataset validation failed.",
        },
      ],
    };
  }
}
