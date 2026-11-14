import { z } from "zod";
import {
  DATASET_TABLES,
  type AlternativeSupply,
  type Dataset,
  type DatasetTable,
  type Delivery,
  type Scenario,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Primitive helpers                                                           */
/* -------------------------------------------------------------------------- */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_REPORTED_PROBLEMS = 20;
const CSV_HEADERS = [
  "id",
  "supplierId",
  "componentId",
  "quantity",
  "availableDate",
] as const;

/** True when the value is a real calendar date in YYYY-MM-DD form (e.g. rejects 2026-02-30). */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const nonBlank = (label: string) =>
  z.string().regex(/\S/, `${label} must not be blank`);
const isoDate = z
  .string()
  .refine(isIsoDate, "must be a real calendar date in YYYY-MM-DD format");
const wholeCount = z
  .number()
  .int("must be a whole number")
  .min(0, "must be 0 or more");
const positiveCount = z
  .number()
  .int("must be a whole number")
  .min(1, "must be at least 1");
const money = z
  .number()
  .finite("must be a finite number")
  .min(0, "must be 0 or more");

/* -------------------------------------------------------------------------- */
/* Structural schemas (shape only; cross-record checks run afterwards)         */
/* -------------------------------------------------------------------------- */

const supplierSchema = z.object({
  id: nonBlank("Supplier id"),
  name: nonBlank("Supplier name"),
  region: z.string(),
  leadTimeDays: wholeCount,
});

const componentSchema = z.object({
  id: nonBlank("Component id"),
  name: nonBlank("Component name"),
  unit: nonBlank("Component unit"),
  supplierId: nonBlank("Component supplierId"),
  supplierIds: z.array(nonBlank("Component supplierIds entry")).optional(),
});

const bomLineSchema = z.object({
  componentId: nonBlank("BOM componentId"),
  quantity: positiveCount,
});

const productSchema = z.object({
  id: nonBlank("Product id"),
  name: nonBlank("Product name"),
  sku: nonBlank("Product sku"),
  bom: z
    .array(bomLineSchema)
    .min(1, "must contain at least one material requirement"),
});

const inventorySchema = z.object({
  componentId: nonBlank("Inventory componentId"),
  quantity: wholeCount,
});

const deliverySchema = z.object({
  id: nonBlank("Delivery id"),
  supplierId: nonBlank("Delivery supplierId"),
  componentId: nonBlank("Delivery componentId"),
  quantity: wholeCount,
  availableDate: isoDate,
});

const orderSchema = z.object({
  id: nonBlank("Order id"),
  customer: nonBlank("Order customer"),
  productId: nonBlank("Order productId"),
  quantity: positiveCount,
  requiredDate: isoDate,
  value: money,
});

const alternativeSchema = z.object({
  id: nonBlank("Alternative id"),
  name: nonBlank("Alternative name"),
  supplierId: nonBlank("Alternative supplierId"),
  componentId: nonBlank("Alternative componentId"),
  quantity: wholeCount,
  availableDate: isoDate,
  approved: z.boolean(),
  approvedProductIds: z
    .array(nonBlank("approvedProductIds entry"))
    .min(1, "must list at least one product (alternatives are product-scoped)"),
});

const datasetSchema = z.object({
  name: nonBlank("Dataset name"),
  asOf: isoDate,
  suppliers: z.array(supplierSchema),
  components: z.array(componentSchema),
  products: z.array(productSchema),
  inventory: z.array(inventorySchema),
  deliveries: z.array(deliverySchema),
  orders: z.array(orderSchema),
  alternatives: z.array(alternativeSchema),
});

const scenarioSchema = z.object({
  id: nonBlank("Scenario id"),
  name: nonBlank("Scenario name"),
  deliveryOverrides: z.array(
    z.object({
      deliveryId: nonBlank("deliveryId"),
      availableDate: isoDate,
      quantity: wholeCount,
    }),
  ),
  alternatives: z.array(
    z.object({
      alternativeId: nonBlank("alternativeId"),
      quantity: wholeCount,
      availableDate: isoDate,
    }),
  ),
});

/* -------------------------------------------------------------------------- */
/* Error formatting                                                            */
/* -------------------------------------------------------------------------- */

function formatPath(path: PropertyKey[]): string {
  return path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") return `${acc}[${segment}]`;
    return acc ? `${acc}.${String(segment)}` : String(segment);
  }, "");
}

function formatProblems(label: string, problems: string[]): Error {
  const shown = problems
    .slice(0, MAX_REPORTED_PROBLEMS)
    .map((problem) => `- ${problem}`);
  const hidden = problems.length - shown.length;
  if (hidden > 0) shown.push(`- ...and ${hidden} more`);
  return new Error(
    `${label} failed validation. Fix these and try again:\n${shown.join("\n")}`,
  );
}

function formatZodError(label: string, error: z.ZodError): Error {
  const problems = error.issues.map((issue) => {
    const path = formatPath(issue.path);
    return `${path || "(root)"}: ${issue.message}`;
  });
  return formatProblems(label, problems);
}

function reportDuplicates(
  problems: string[],
  collection: string,
  ids: string[],
): void {
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const id of ids) {
    if (seen.has(id) && !reported.has(id)) {
      problems.push(
        `${collection}: id "${id}" appears more than once. Ids must be unique.`,
      );
      reported.add(id);
    }
    seen.add(id);
  }
}

function requireRef(
  problems: string[],
  path: string,
  value: string,
  known: Set<string>,
  collection: string,
): void {
  if (!known.has(value)) {
    problems.push(
      `${path} is "${value}", which does not exist in ${collection}. Add it or correct the id.`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Dataset semantic checks                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The simulator adds up order values and BOM-expanded demand (missing units are bounded by
 * total demand). Each term can be valid on its own while the sum is not representable, which
 * would surface as Infinity (exported as null) or silently lose precision. There is no business
 * maximum here: demand must remain a safe integer and summed values must remain finite.
 */
function checkOrderTotals(problems: string[], data: Dataset): void {
  const unitsPerProduct = new Map(
    data.products.map((product) => [
      product.id,
      product.bom.reduce((sum, line) => sum + line.quantity, 0),
    ]),
  );
  let demand = 0;
  let value = 0;
  let demandProblem = false;
  let valueProblem = false;

  data.orders.forEach((order, i) => {
    value += order.value;
    if (!valueProblem && !Number.isFinite(value)) {
      valueProblem = true;
      problems.push(
        `orders[${i}].value: the summed order value across all orders is not a finite number. Reduce the order values.`,
      );
    }

    demand += order.quantity * (unitsPerProduct.get(order.productId) ?? 0);
    if (!demandProblem && !Number.isSafeInteger(demand)) {
      demandProblem = true;
      problems.push(
        `orders[${i}]: total component demand across orders exceeds the safe integer range (${Number.MAX_SAFE_INTEGER}). Reduce the order or BOM quantities.`,
      );
    }
  });
}

function checkDataset(data: Dataset): string[] {
  const problems: string[] = [];

  const supplierIds = new Set(data.suppliers.map((s) => s.id));
  const componentIds = new Set(data.components.map((c) => c.id));
  const productIds = new Set(data.products.map((p) => p.id));

  reportDuplicates(
    problems,
    "suppliers",
    data.suppliers.map((s) => s.id),
  );
  reportDuplicates(
    problems,
    "components",
    data.components.map((c) => c.id),
  );
  reportDuplicates(
    problems,
    "products",
    data.products.map((p) => p.id),
  );
  reportDuplicates(
    problems,
    "deliveries",
    data.deliveries.map((d) => d.id),
  );
  reportDuplicates(
    problems,
    "orders",
    data.orders.map((o) => o.id),
  );
  reportDuplicates(
    problems,
    "alternatives",
    data.alternatives.map((a) => a.id),
  );

  data.components.forEach((component, i) => {
    requireRef(
      problems,
      `components[${i}].supplierId`,
      component.supplierId,
      supplierIds,
      "suppliers",
    );
    const associations = component.supplierIds ?? [component.supplierId];
    const seen = new Set<string>();
    associations.forEach((id) => {
      if (seen.has(id))
        problems.push(
          `components[${i}].supplierIds: supplier "${id}" is listed more than once.`,
        );
      seen.add(id);
      requireRef(
        problems,
        `components[${i}].supplierIds`,
        id,
        supplierIds,
        "suppliers",
      );
    });
    if (!associations.includes(component.supplierId))
      problems.push(
        `components[${i}].supplierIds must include primary supplierId "${component.supplierId}".`,
      );
  });

  data.products.forEach((product, i) => {
    const seenComponents = new Set<string>();
    product.bom.forEach((line, j) => {
      const path = `products[${i}].bom[${j}].componentId`;
      requireRef(problems, path, line.componentId, componentIds, "components");
      if (seenComponents.has(line.componentId)) {
        problems.push(
          `products[${i}].bom: component "${line.componentId}" is listed more than once. Merge the lines into one BOM line.`,
        );
      }
      seenComponents.add(line.componentId);
    });
  });

  const inventoryComponents = data.inventory.map((item) => item.componentId);
  reportDuplicates(problems, "inventory (componentId)", inventoryComponents);
  data.inventory.forEach((item, i) => {
    requireRef(
      problems,
      `inventory[${i}].componentId`,
      item.componentId,
      componentIds,
      "components",
    );
  });

  data.deliveries.forEach((delivery, i) => {
    requireRef(
      problems,
      `deliveries[${i}].supplierId`,
      delivery.supplierId,
      supplierIds,
      "suppliers",
    );
    requireRef(
      problems,
      `deliveries[${i}].componentId`,
      delivery.componentId,
      componentIds,
      "components",
    );
    if (delivery.availableDate < data.asOf) {
      problems.push(
        `deliveries[${i}].availableDate ${delivery.availableDate} is before the dataset as-of date ${data.asOf}.`,
      );
    }
  });

  data.orders.forEach((order, i) => {
    requireRef(
      problems,
      `orders[${i}].productId`,
      order.productId,
      productIds,
      "products",
    );
    if (order.requiredDate < data.asOf) {
      problems.push(
        `orders[${i}].requiredDate ${order.requiredDate} is before the dataset as-of date ${data.asOf}.`,
      );
    }
  });

  checkOrderTotals(problems, data);

  data.alternatives.forEach((alternative, i) => {
    requireRef(
      problems,
      `alternatives[${i}].supplierId`,
      alternative.supplierId,
      supplierIds,
      "suppliers",
    );
    requireRef(
      problems,
      `alternatives[${i}].componentId`,
      alternative.componentId,
      componentIds,
      "components",
    );
    if (alternative.availableDate < data.asOf) {
      problems.push(
        `alternatives[${i}].availableDate ${alternative.availableDate} is before the dataset as-of date ${data.asOf}.`,
      );
    }
    const seenProducts = new Set<string>();
    alternative.approvedProductIds.forEach((productId, j) => {
      requireRef(
        problems,
        `alternatives[${i}].approvedProductIds[${j}]`,
        productId,
        productIds,
        "products",
      );
      if (seenProducts.has(productId)) {
        problems.push(
          `alternatives[${i}].approvedProductIds lists "${productId}" more than once.`,
        );
      }
      seenProducts.add(productId);
    });
  });

  return problems;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Validates an untrusted value as a full dataset. Returns a new, independent object.
 * Throws an Error listing every problem found (capped) so the caller can keep its current data.
 */
export function parseDataset(input: unknown): Dataset {
  const parsed = datasetSchema.safeParse(input);
  if (!parsed.success) throw formatZodError("Dataset", parsed.error);

  const data = parsed.data as Dataset;
  const problems = checkDataset(data);
  if (problems.length > 0) throw formatProblems("Dataset", problems);
  return data;
}

/**
 * Validates a scenario against a dataset that has already passed parseDataset.
 * Overrides must target existing deliveries; alternatives must exist, be approved,
 * and stay within the catalog quantity and earliest available date.
 */
export function parseScenario(data: Dataset, input: unknown): Scenario {
  const parsed = scenarioSchema.safeParse(input);
  if (!parsed.success) throw formatZodError("Scenario", parsed.error);

  const scenario = parsed.data as Scenario;
  const problems: string[] = [];

  const deliveryIds = new Set(data.deliveries.map((d) => d.id));
  const catalog = new Map<string, AlternativeSupply>(
    data.alternatives.map((a) => [a.id, a]),
  );

  reportDuplicates(
    problems,
    "deliveryOverrides",
    scenario.deliveryOverrides.map((o) => o.deliveryId),
  );
  reportDuplicates(
    problems,
    "alternatives",
    scenario.alternatives.map((a) => a.alternativeId),
  );

  scenario.deliveryOverrides.forEach((override, i) => {
    const path = `deliveryOverrides[${i}]`;
    if (!deliveryIds.has(override.deliveryId)) {
      problems.push(
        `${path}.deliveryId is "${override.deliveryId}", which is not a delivery in this dataset.`,
      );
    }
    if (override.availableDate < data.asOf) {
      problems.push(
        `${path}.availableDate ${override.availableDate} is before the dataset as-of date ${data.asOf}.`,
      );
    }
  });

  scenario.alternatives.forEach((use, i) => {
    const path = `alternatives[${i}]`;
    const source = catalog.get(use.alternativeId);
    if (!source) {
      problems.push(
        `${path}.alternativeId is "${use.alternativeId}", which is not in the alternative catalog.`,
      );
      return;
    }
    if (!source.approved) {
      problems.push(
        `${path}: alternative ${source.id} is not approved. Approve it in the catalog or remove it from the scenario.`,
      );
    }
    if (use.quantity > source.quantity) {
      problems.push(
        `${path}: quantity ${use.quantity} exceeds the catalog quantity ${source.quantity} for ${source.id}.`,
      );
    }
    if (use.availableDate < source.availableDate) {
      problems.push(
        `${path}: availableDate ${use.availableDate} is earlier than the catalog date ${source.availableDate} for ${source.id}.`,
      );
    }
    if (use.availableDate < data.asOf) {
      problems.push(
        `${path}.availableDate ${use.availableDate} is before the dataset as-of date ${data.asOf}.`,
      );
    }
  });

  if (problems.length > 0)
    throw formatProblems(`Scenario "${scenario.name}"`, problems);
  return scenario;
}

/* -------------------------------------------------------------------------- */
/* CSV and file import                                                         */
/* -------------------------------------------------------------------------- */

/** RFC 4180-style parser: quoted cells may contain commas, newlines and doubled quotes. */
function parseCsvRows(text: string): string[][] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        cell += ch;
        i += 1;
      }
      continue;
    }

    if (ch === '"' && cell.length === 0) {
      inQuotes = true;
      i += 1;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
    } else if (ch === "\r" || ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += ch === "\r" && source[i + 1] === "\n" ? 2 : 1;
    } else {
      cell += ch;
      i += 1;
    }
  }

  if (inQuotes) {
    throw new Error(
      "CSV has an unclosed quote. Close every quoted cell with a matching double quote.",
    );
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const isBlankRow = (cells: string[]) =>
  cells.every((cell) => cell.trim() === "");

/**
 * Parses a deliveries CSV (header: id,supplierId,componentId,quantity,availableDate) and
 * returns the dataset with its deliveries replaced by the file contents. Transactional:
 * any problem throws and `current` is left untouched.
 */
export function parseDeliveryCsv(text: string, current: Dataset): Dataset {
  if (text.trim() === "") {
    throw new Error(
      `Deliveries CSV is empty. Include a header row: ${CSV_HEADERS.join(",")}.`,
    );
  }

  const rows = parseCsvRows(text);
  const headerIndex = rows.findIndex((cells) => !isBlankRow(cells));
  if (headerIndex < 0) throw new Error("CSV is empty. Include a header row.");
  const header = rows[headerIndex].map((cell) => cell.trim());

  const missing = CSV_HEADERS.filter((name) => !header.includes(name));
  const unexpected = header.filter(
    (name) => !(CSV_HEADERS as readonly string[]).includes(name),
  );
  const duplicated = header.length !== new Set(header).size;
  if (missing.length > 0 || unexpected.length > 0 || duplicated) {
    const details = [
      missing.length > 0 ? `missing: ${missing.join(", ")}` : "",
      unexpected.length > 0 ? `unexpected: ${unexpected.join(", ")}` : "",
      duplicated ? "a column is repeated" : "",
    ].filter(Boolean);
    throw new Error(
      `Deliveries CSV header must be exactly ${CSV_HEADERS.join(",")} (${details.join("; ")}).`,
    );
  }

  const column = (name: string) => header.indexOf(name);
  const supplierIds = new Set(current.suppliers.map((s) => s.id));
  const componentIds = new Set(current.components.map((c) => c.id));
  const problems: string[] = [];
  const deliveries: Delivery[] = [];
  const lineById = new Map<string, number>();

  for (let r = headerIndex + 1; r < rows.length; r += 1) {
    const cells = rows[r];
    const line = r + 1;
    if (isBlankRow(cells)) continue;

    if (cells.length !== header.length) {
      problems.push(
        `line ${line}: has ${cells.length} cells but the header has ${header.length}. Quote any value that contains a comma.`,
      );
      continue;
    }

    const get = (name: string) => cells[column(name)].trim();
    const id = get("id");
    const supplierId = get("supplierId");
    const componentId = get("componentId");
    const quantityText = get("quantity");
    const availableDate = get("availableDate");

    if (id === "") problems.push(`line ${line}: id is blank.`);
    else if (lineById.has(id)) {
      problems.push(
        `line ${line}: id "${id}" already appears on line ${lineById.get(id)}. Ids must be unique.`,
      );
    } else lineById.set(id, line);

    if (!supplierIds.has(supplierId)) {
      problems.push(
        `line ${line}: supplierId "${supplierId}" is not a supplier in the dataset.`,
      );
    }
    if (!componentIds.has(componentId)) {
      problems.push(
        `line ${line}: componentId "${componentId}" is not a component in the dataset.`,
      );
    }

    const quantity = /^\d+$/.test(quantityText)
      ? Number(quantityText)
      : Number.NaN;
    if (!Number.isSafeInteger(quantity)) {
      problems.push(
        `line ${line}: quantity "${quantityText}" must be a whole number, 0 or more.`,
      );
    }

    if (!isIsoDate(availableDate)) {
      problems.push(
        `line ${line}: availableDate "${availableDate}" must be a real date in YYYY-MM-DD format.`,
      );
    } else if (availableDate < current.asOf) {
      problems.push(
        `line ${line}: availableDate ${availableDate} is before the dataset as-of date ${current.asOf}.`,
      );
    }

    deliveries.push({
      id,
      supplierId,
      componentId,
      quantity,
      availableDate,
    });
  }

  if (problems.length > 0) {
    throw formatProblems("Deliveries CSV", problems);
  }

  // Full dataset validation guarantees the result is consistent and independent of `current`.
  return parseDataset({ ...current, deliveries });
}

/**
 * Imports a file by extension: `.json` is a full dataset, `.csv` replaces the deliveries.
 * Throws for unsupported files, leaving `current` unchanged.
 */
export function parseImport(
  text: string,
  filename: string,
  current: Dataset,
): Dataset {
  const lower = filename.trim().toLowerCase();

  if (lower.endsWith(".json")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "unknown parse error";
      throw new Error(
        `${filename} is not valid JSON (${reason}). Fix the syntax and import again.`,
      );
    }
    return parseDataset(parsed);
  }

  if (lower.endsWith(".csv")) {
    return parseImportFiles([{ name: filename, text }], current);
  }

  throw new Error(
    `Cannot import "${filename}". Choose a .json dataset file or a .csv deliveries file.`,
  );
}

export const TABLE_HEADERS = {
  deliveries: ["id", "supplierId", "componentId", "quantity", "availableDate"],
  inventory: ["componentId", "quantity"],
  products: ["id", "name", "sku"],
  bom: ["productId", "componentId", "quantity"],
  orders: ["id", "customer", "productId", "quantity", "requiredDate", "value"],
} as const;

export interface ImportResult {
  data: Dataset;
  replacedTables: DatasetTable[];
  retainedTables: DatasetTable[];
  retainedProductBoms: boolean;
}

function importResult(
  data: Dataset,
  replacedTables: DatasetTable[],
  retainedProductBoms = false,
): ImportResult {
  const replaced = new Set(replacedTables);
  return {
    data,
    replacedTables,
    retainedTables: DATASET_TABLES.filter((table) => !replaced.has(table)),
    retainedProductBoms,
  };
}

/** Apply related spreadsheet tables atomically; cross-references validate after all files. */
export function parseImportFiles(
  files: { name: string; text: string }[],
  current: Dataset,
): Dataset {
  return parseImportBundle(files, current).data;
}

/** Validates an import atomically and describes exactly which tables it replaces. */
export function parseImportBundle(
  files: { name: string; text: string }[],
  current: Dataset,
): ImportResult {
  if (files.length === 0) throw new Error("Choose at least one file.");
  if (files.length === 1 && files[0].name.toLowerCase().endsWith(".json")) {
    return importResult(parseImport(files[0].text, files[0].name, current), [
      ...DATASET_TABLES,
    ]);
  }
  const tables = new Map<
    keyof typeof TABLE_HEADERS,
    Record<string, string>[]
  >();
  for (const file of files) {
    if (!file.name.toLowerCase().endsWith(".csv"))
      throw new Error(
        "Choose one JSON dataset, or CSV tables together. Do not mix JSON and CSV.",
      );
    const rows = parseCsvRows(file.text);
    const start = rows.findIndex((row) => !isBlankRow(row));
    if (start < 0) throw new Error(`${file.name}: CSV is empty.`);
    const header = rows[start].map((cell) => cell.trim());
    const kind = (
      Object.keys(TABLE_HEADERS) as (keyof typeof TABLE_HEADERS)[]
    ).find(
      (key) =>
        TABLE_HEADERS[key].length === header.length &&
        TABLE_HEADERS[key].every((col) => header.includes(col)),
    );
    if (!kind || new Set(header).size !== header.length)
      throw new Error(
        `${file.name}: unsupported CSV header. Use an inventory, products, BOM, orders or deliveries template.`,
      );
    if (tables.has(kind))
      throw new Error(`Choose only one ${kind} CSV per import.`);
    const records: Record<string, string>[] = [];
    for (let i = start + 1; i < rows.length; i++) {
      if (isBlankRow(rows[i])) continue;
      if (rows[i].length !== header.length)
        throw new Error(
          `${file.name}, line ${i + 1}: expected ${header.length} cells, got ${rows[i].length}.`,
        );
      records.push(
        Object.fromEntries(header.map((col, j) => [col, rows[i][j].trim()])),
      );
    }
    tables.set(kind, records);
  }
  const next = structuredClone(current);
  const integer = (s: string) => (/^\d+$/.test(s) ? Number(s) : Number.NaN);
  if (tables.has("deliveries"))
    next.deliveries = tables.get("deliveries")!.map((r) => ({
      id: r.id,
      supplierId: r.supplierId,
      componentId: r.componentId,
      quantity: integer(r.quantity),
      availableDate: r.availableDate,
    }));
  if (tables.has("inventory"))
    next.inventory = tables.get("inventory")!.map((r) => ({
      componentId: r.componentId,
      quantity: integer(r.quantity),
    }));
  if (tables.has("products"))
    next.products = tables.get("products")!.map((r) => ({
      id: r.id,
      name: r.name,
      sku: r.sku,
      bom: next.products.find((p) => p.id === r.id)?.bom ?? [],
    }));
  if (tables.has("bom")) {
    for (const product of next.products) product.bom = [];
    for (const row of tables.get("bom")!) {
      const product = next.products.find((p) => p.id === row.productId);
      if (!product)
        throw new Error(
          `BOM CSV: productId "${row.productId}" is not in the products table.`,
        );
      product.bom.push({
        componentId: row.componentId,
        quantity: integer(row.quantity),
      });
    }
  }
  if (tables.has("orders"))
    next.orders = tables.get("orders")!.map((r) => ({
      id: r.id,
      customer: r.customer,
      productId: r.productId,
      quantity: integer(r.quantity),
      requiredDate: r.requiredDate,
      value: /^\d+(\.\d+)?$/.test(r.value) ? Number(r.value) : Number.NaN,
    }));
  const csvToDatasetTable: Record<keyof typeof TABLE_HEADERS, DatasetTable> = {
    deliveries: "deliveries",
    inventory: "inventory",
    products: "products",
    bom: "products",
    orders: "orders",
  };
  return importResult(
    parseDataset(next),
    [...new Set([...tables.keys()].map((table) => csvToDatasetTable[table]))],
    tables.has("products") && !tables.has("bom"),
  );
}
