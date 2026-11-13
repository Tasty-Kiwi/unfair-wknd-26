import { z } from "zod";
import { nodeKey } from "./factories";
import {
  BUILDER_WORKSPACE_FORMAT,
  BUILDER_WORKSPACE_VERSION,
  type BuilderWorkspaceV1,
} from "./types";

const finiteNumber = z
  .number()
  .refine((val) => Number.isFinite(val), "must be a finite number");

const nonBlankString = (label: string) =>
  z.string().regex(/\S/, `${label} must not be blank`);

const positionSchema = z.object({
  x: finiteNumber,
  y: finiteNumber,
});

const viewportSchema = z.object({
  x: finiteNumber,
  y: finiteNumber,
  zoom: finiteNumber.refine((z) => z > 0, "zoom must be greater than 0"),
});

const supplierNodeSchema = z.object({
  kind: z.literal("supplier"),
  id: nonBlankString("Supplier id"),
  position: positionSchema,
  fields: z.object({
    name: z.string(),
    region: z.string(),
    leadTimeDays: z.string(),
  }),
});

const componentNodeSchema = z.object({
  kind: z.literal("component"),
  id: nonBlankString("Component id"),
  position: positionSchema,
  fields: z.object({
    name: z.string(),
    unit: z.string(),
    initialStock: z.string().nullable(),
  }),
});

const receiptNodeSchema = z.object({
  kind: z.literal("receipt"),
  id: nonBlankString("Receipt id"),
  position: positionSchema,
  fields: z.object({
    quantity: z.string(),
    availableDate: z.string(),
  }),
});

const productNodeSchema = z.object({
  kind: z.literal("product"),
  id: nonBlankString("Product id"),
  position: positionSchema,
  fields: z.object({
    name: z.string(),
    sku: z.string(),
  }),
});

const orderNodeSchema = z.object({
  kind: z.literal("order"),
  id: nonBlankString("Order id"),
  position: positionSchema,
  fields: z.object({
    customer: z.string(),
    quantity: z.string(),
    requiredDate: z.string(),
    value: z.string(),
  }),
});

const builderNodeSchema = z.discriminatedUnion("kind", [
  supplierNodeSchema,
  componentNodeSchema,
  receiptNodeSchema,
  productNodeSchema,
  orderNodeSchema,
]);

const nonBomEdgeSchema = z.object({
  id: nonBlankString("Edge id"),
  kind: z.enum([
    "primarySupplier",
    "receiptSupplier",
    "receiptComponent",
    "orderedProduct",
  ]),
  source: nonBlankString("Edge source"),
  target: nonBlankString("Edge target"),
});

const bomEdgeSchema = z.object({
  id: nonBlankString("Edge id"),
  kind: z.literal("bom"),
  source: nonBlankString("Edge source"),
  target: nonBlankString("Edge target"),
  quantity: z.string(),
});

const builderEdgeSchema = z.discriminatedUnion("kind", [
  nonBomEdgeSchema,
  bomEdgeSchema,
]);

const builderDocumentSchema = z.object({
  id: nonBlankString("Document id"),
  name: z.string(),
  asOf: z.string(),
  revision: z.number().int("revision must be an integer").min(0),
  nodes: z.array(builderNodeSchema),
  edges: z.array(builderEdgeSchema),
  viewport: viewportSchema.optional(),
});

const scenarioSchema = z.object({
  id: nonBlankString("Scenario id"),
  name: z.string(),
  deliveryOverrides: z.array(
    z.object({
      deliveryId: nonBlankString("deliveryId"),
      availableDate: z.string(),
      quantity: finiteNumber,
    }),
  ),
  alternatives: z.array(
    z.object({
      alternativeId: nonBlankString("alternativeId"),
      quantity: finiteNumber,
      availableDate: z.string(),
    }),
  ),
});

const scenarioRecordSchema = z.object({
  scenario: scenarioSchema,
  validatedNetworkKey: z.string().nullable(),
  receiptSnapshots: z
    .array(
      z.object({
        deliveryId: nonBlankString("Snapshot receipt id"),
        supplier: z.object({
          id: nonBlankString("Snapshot supplier id"),
          name: z.string(),
        }),
        component: z.object({
          id: nonBlankString("Snapshot component id"),
          name: z.string(),
        }),
      }),
    )
    .optional(),
});

const builderWorkspaceV1Schema = z.object({
  format: z.literal(BUILDER_WORKSPACE_FORMAT),
  version: z.literal(BUILDER_WORKSPACE_VERSION),
  document: builderDocumentSchema,
  scenarios: z.array(scenarioRecordSchema),
  selectedScenarioId: z.string().nullable(),
  workingScenario: scenarioRecordSchema.nullable(),
  source: z.object({
    origin: z.enum(["authored", "fictional"]),
    openedFromFile: z.boolean(),
  }),
});

function formatPath(path: PropertyKey[]): string {
  return path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") return `${acc}[${segment}]`;
    return acc ? `${acc}.${String(segment)}` : String(segment);
  }, "");
}

export function parseWorkspace(input: unknown): BuilderWorkspaceV1 {
  const parsed = builderWorkspaceV1Schema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.issues
      .slice(0, 10)
      .map((issue) => `${formatPath(issue.path) || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid builder workspace: ${details}`);
  }

  const workspace = parsed.data;
  const seenNodeKeys = new Set<string>();
  for (const node of workspace.document.nodes) {
    const key = nodeKey(node);
    if (seenNodeKeys.has(key)) {
      throw new Error(
        `Invalid builder workspace: duplicate node key "${key}".`,
      );
    }
    seenNodeKeys.add(key);
  }

  const seenEdgeIds = new Set<string>();
  for (const edge of workspace.document.edges) {
    if (seenEdgeIds.has(edge.id)) {
      throw new Error(
        `Invalid builder workspace: duplicate edge id "${edge.id}".`,
      );
    }
    seenEdgeIds.add(edge.id);
  }

  const seenScenarioIds = new Set<string>();
  for (const record of workspace.scenarios) {
    if (seenScenarioIds.has(record.scenario.id)) {
      throw new Error(
        `Invalid builder workspace: duplicate scenario id "${record.scenario.id}".`,
      );
    }
    seenScenarioIds.add(record.scenario.id);
  }

  return workspace;
}
