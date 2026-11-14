import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { demoData } from "@/data/demo";
import { presetsFor } from "@/lib/scenarioPresets";
import { simulate } from "@/lib/simulation";
import type { Dataset, Scenario } from "@/lib/types";
import {
  parseDataset,
  parseDeliveryCsv,
  parseImport,
  parseImportBundle,
  parseImportFiles,
  parseScenario,
} from "@/lib/validation";

function fixture(): Dataset {
  return {
    name: "Test",
    asOf: "2026-11-01",
    suppliers: [{ id: "SUP-01", name: "Main", region: "EU", leadTimeDays: 10 }],
    components: [
      { id: "MTR-01", name: "Motor", unit: "pcs", supplierId: "SUP-01" },
    ],
    products: [
      {
        id: "P-1",
        name: "Fan",
        sku: "FAN-1",
        bom: [{ componentId: "MTR-01", quantity: 2 }],
      },
    ],
    inventory: [{ componentId: "MTR-01", quantity: 8 }],
    deliveries: [
      {
        id: "PO-101",
        supplierId: "SUP-01",
        componentId: "MTR-01",
        quantity: 10,
        availableDate: "2026-11-17",
      },
    ],
    orders: [
      {
        id: "ORD-101",
        customer: "Acme",
        productId: "P-1",
        quantity: 3,
        requiredDate: "2026-11-22",
        value: 900,
      },
    ],
    alternatives: [
      {
        id: "ALT-01",
        name: "Backup",
        supplierId: "SUP-01",
        componentId: "MTR-01",
        quantity: 4,
        availableDate: "2026-11-18",
        approved: true,
        approvedProductIds: ["P-1"],
      },
    ],
  };
}

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: "S-1",
    name: "Base",
    deliveryOverrides: [],
    alternatives: [],
    ...overrides,
  };
}

describe("parseDataset", () => {
  it("accepts a valid dataset", () => {
    expect(parseDataset(fixture()).name).toBe("Test");
  });

  it("rejects non-ISO dates", () => {
    const data = fixture();
    data.deliveries[0].availableDate = "2026-02-30";
    expect(() => parseDataset(data)).toThrow(/availableDate/);
  });

  it("rejects dates before asOf", () => {
    const data = fixture();
    data.orders[0].requiredDate = "2026-10-01";
    expect(() => parseDataset(data)).toThrow(/requiredDate/);
  });

  it("rejects duplicate ids", () => {
    const data = fixture();
    data.suppliers.push({ ...data.suppliers[0], name: "Copy" });
    expect(() => parseDataset(data)).toThrow(/unique|more than once/i);
  });

  it("rejects missing references", () => {
    const data = fixture();
    data.products[0].bom[0].componentId = "NOPE";
    expect(() => parseDataset(data)).toThrow(/NOPE/);
  });

  it("rejects duplicate BOM lines", () => {
    const data = fixture();
    data.products[0].bom.push({ componentId: "MTR-01", quantity: 1 });
    expect(() => parseDataset(data)).toThrow(/bom/i);
  });

  it("rejects negative inventory and non-positive BOM quantities", () => {
    const negative = fixture();
    negative.inventory[0].quantity = -1;
    expect(() => parseDataset(negative)).toThrow();

    const zeroBom = fixture();
    zeroBom.products[0].bom[0].quantity = 0;
    expect(() => parseDataset(zeroBom)).toThrow();
  });

  it("retains unapproved catalog entries but rejects using them", () => {
    const data = fixture();
    data.alternatives[0].approved = false;
    expect(parseDataset(data).alternatives[0].approved).toBe(false);
    expect(() =>
      parseScenario(
        data,
        scenario({
          alternatives: [
            {
              alternativeId: "ALT-01",
              quantity: 2,
              availableDate: "2026-11-18",
            },
          ],
        }),
      ),
    ).toThrow(/not approved/i);
  });
  it("rejects alternatives without product scope and empty BOMs", () => {
    const data = fixture();
    data.alternatives[0].approvedProductIds = [];
    expect(() => parseDataset(data)).toThrow(/product/i);
    const empty = fixture();
    empty.products[0].bom = [];
    expect(() => parseDataset(empty)).toThrow(/material requirement/i);
  });
  it("rejects arithmetic beyond safe integer demand", () => {
    const data = fixture();
    data.orders[0].quantity = Number.MAX_SAFE_INTEGER;
    expect(() => parseDataset(data)).toThrow(/safe integer/i);
  });
});

describe("aggregate numeric safety", () => {
  const MAX = Number.MAX_SAFE_INTEGER;

  /** One component per BOM line, quantity 1 each, so an order's demand is quantity * lines. */
  function withOrders(
    quantities: number[],
    options: { bomLines?: number; values?: number[] } = {},
  ): Dataset {
    const data = fixture();
    const lines = options.bomLines ?? 1;
    data.products[0].bom = Array.from({ length: lines }, (_, i) => ({
      componentId: i === 0 ? "MTR-01" : `MTR-0${i + 1}`,
      quantity: 1,
    }));
    for (let i = 1; i < lines; i += 1) {
      data.components.push({
        id: `MTR-0${i + 1}`,
        name: `Part ${i + 1}`,
        unit: "pcs",
        supplierId: "SUP-01",
      });
    }
    data.orders = quantities.map((quantity, i) => ({
      id: `ORD-${i + 1}`,
      customer: "Acme",
      productId: "P-1",
      quantity,
      requiredDate: "2026-11-22",
      value: options.values?.[i] ?? 1,
    }));
    return data;
  }

  it("rejects finite order values whose sum overflows to Infinity", () => {
    const data = withOrders([1, 1], { values: [1e308, 1e308] });
    // Each value is finite, but the total the simulator reports would be Infinity.
    expect(data.orders.every((order) => Number.isFinite(order.value))).toBe(
      true,
    );
    expect(data.orders.reduce((sum, order) => sum + order.value, 0)).toBe(
      Infinity,
    );
    expect(() => parseDataset(data)).toThrow(/order value.*finite/i);
  });

  it("rejects ten 1e308 values, not just a pair", () => {
    const data = withOrders(Array(10).fill(1), {
      values: Array(10).fill(1e308),
    });
    expect(() => parseDataset(data)).toThrow(/order value.*finite/i);
  });

  it("accepts ordinary large finite values, including a lone 1e308", () => {
    const large = withOrders(Array(10).fill(1), {
      values: Array(10).fill(1e300),
    });
    expect(parseDataset(large).orders).toHaveLength(10);
    expect(
      Number.isFinite(simulate(large, scenario()).summary.totalValue),
    ).toBe(true);
    expect(
      parseDataset(withOrders([1], { values: [1e308] })).orders,
    ).toHaveLength(1);
  });

  it("rejects many individually safe order demands that sum beyond the safe range", () => {
    const each = Math.floor(MAX / 2);
    const data = withOrders([each, each, each]);
    const problem = /orders\[2\].*safe integer/i;
    expect(() => parseDataset(data)).toThrow(problem);
  });

  it("rejects a BOM whose lines are each safe but whose order total is not", () => {
    const data = withOrders([Math.floor(MAX / 2) + 1], { bomLines: 2 });
    expect(() => parseDataset(data)).toThrow(/orders\[0\].*safe integer/i);
  });

  it("accepts total demand exactly at the safe integer limit and rejects one over", () => {
    expect(parseDataset(withOrders([MAX - 1, 1])).orders).toHaveLength(2);
    expect(parseDataset(withOrders([MAX])).orders).toHaveLength(1);
    expect(() => parseDataset(withOrders([MAX - 1, 2]))).toThrow(
      /safe integer/i,
    );
    expect(() => parseDataset(withOrders([MAX, 1]))).toThrow(/safe integer/i);
    const twoLines = withOrders([(MAX - 1) / 2], { bomLines: 2 });
    expect(parseDataset(twoLines).orders).toHaveLength(1);
    twoLines.orders[0].quantity += 1;
    expect(() => parseDataset(twoLines)).toThrow(/safe integer/i);
  });

  it("does not cap supply or any single large demand that stays representable", () => {
    const data = withOrders([MAX]);
    data.inventory[0].quantity = MAX;
    data.deliveries.push({
      ...data.deliveries[0],
      id: "PO-102",
      quantity: MAX,
    });
    expect(parseDataset(data).deliveries).toHaveLength(2);
  });

  it("reports both problems together", () => {
    const data = withOrders([MAX, MAX], { values: [1e308, 1e308] });
    expect(() => parseDataset(data)).toThrow(/finite/i);
    expect(() => parseDataset(data)).toThrow(/safe integer/i);
  });

  it("leaves the demo dataset, shipped example and every preset unchanged", () => {
    const before = structuredClone(demoData);
    expect(parseDataset(demoData)).toEqual(demoData);
    expect(demoData).toEqual(before);
    const example = JSON.parse(
      readFileSync("public/examples/domino-demo.json", "utf8"),
    );
    expect(() => parseDataset(example)).not.toThrow();
    for (const preset of presetsFor(demoData)) {
      expect(() => parseScenario(demoData, preset)).not.toThrow();
    }
    expect(simulate(demoData, presetsFor(demoData)[1]).summary).toMatchObject({
      atRiskOrders: 1,
      missingUnits: 2,
      atRiskValue: 36000,
    });
  });

  it("applies to JSON and spreadsheet imports", () => {
    const data = withOrders([1, 1], { values: [1e308, 1e308] });
    expect(() =>
      parseImport(JSON.stringify(data), "plan.json", fixture()),
    ).toThrow(/finite/i);
    expect(() =>
      parseImportFiles(
        [
          {
            name: "orders.csv",
            text: `id,customer,productId,quantity,requiredDate,value\nA,Acme,P-1,1,2026-11-22,${"9".repeat(308)}\nB,Acme,P-1,1,2026-11-22,${"9".repeat(308)}`,
          },
        ],
        fixture(),
      ),
    ).toThrow(/finite/i);
  });
});

describe("parseScenario", () => {
  it("accepts an empty scenario", () => {
    expect(parseScenario(fixture(), scenario()).id).toBe("S-1");
  });

  it("accepts a delivery override within the dataset rules", () => {
    const result = parseScenario(
      fixture(),
      scenario({
        deliveryOverrides: [
          { deliveryId: "PO-101", availableDate: "2026-11-23", quantity: 10 },
        ],
      }),
    );
    expect(result.deliveryOverrides).toHaveLength(1);
  });

  it("rejects an override for an unknown delivery", () => {
    expect(() =>
      parseScenario(
        fixture(),
        scenario({
          deliveryOverrides: [
            { deliveryId: "PO-999", availableDate: "2026-11-23", quantity: 1 },
          ],
        }),
      ),
    ).toThrow(/PO-999/);
  });

  it("rejects alternative quantities above the catalog", () => {
    expect(() =>
      parseScenario(
        fixture(),
        scenario({
          alternatives: [
            {
              alternativeId: "ALT-01",
              quantity: 5,
              availableDate: "2026-11-18",
            },
          ],
        }),
      ),
    ).toThrow(/quantity/i);
  });

  it("rejects alternative dates earlier than the catalog date", () => {
    expect(() =>
      parseScenario(
        fixture(),
        scenario({
          alternatives: [
            {
              alternativeId: "ALT-01",
              quantity: 4,
              availableDate: "2026-11-10",
            },
          ],
        }),
      ),
    ).toThrow(/availableDate/);
  });

  it("rejects duplicate alternative overrides", () => {
    const alt = {
      alternativeId: "ALT-01",
      quantity: 4,
      availableDate: "2026-11-18",
    };
    expect(() =>
      parseScenario(fixture(), scenario({ alternatives: [alt, alt] })),
    ).toThrow();
  });
});

describe("parseDeliveryCsv / parseImport", () => {
  const header = "id,supplierId,componentId,quantity,availableDate";

  it("parses quoted cells and replaces deliveries", () => {
    const csv = [header, '"PO-201","SUP-01","MTR-01","5","2026-11-20"'].join(
      "\n",
    );
    const result = parseDeliveryCsv(csv, fixture());
    expect(result.deliveries).toEqual([
      {
        id: "PO-201",
        supplierId: "SUP-01",
        componentId: "MTR-01",
        quantity: 5,
        availableDate: "2026-11-20",
      },
    ]);
  });

  it("accepts a leading byte order mark", () => {
    const csv = `﻿${header}\nPO-201,SUP-01,MTR-01,5,2026-11-20`;
    expect(parseDeliveryCsv(csv, fixture()).deliveries).toHaveLength(1);
  });

  it("rejects a wrong header", () => {
    expect(() =>
      parseDeliveryCsv(
        "id,supplier,componentId,quantity,availableDate\n",
        fixture(),
      ),
    ).toThrow(/header/i);
  });

  it("rejects unknown references and bad dates with row context", () => {
    expect(() =>
      parseDeliveryCsv(
        [header, "PO-201,SUP-99,MTR-01,5,2026-11-20"].join("\n"),
        fixture(),
      ),
    ).toThrow(/SUP-99/);
    expect(() =>
      parseDeliveryCsv(
        [header, "PO-201,SUP-01,MTR-01,5,2026-13-01"].join("\n"),
        fixture(),
      ),
    ).toThrow(/2026-13-01|availableDate/);
  });

  it("dispatches JSON and CSV by filename", () => {
    const json = JSON.stringify(fixture());
    expect(parseImport(json, "data.json", fixture()).name).toBe("Test");

    const csv = [header, "PO-201,SUP-01,MTR-01,5,2026-11-20"].join("\n");
    expect(parseImport(csv, "deliveries.csv", fixture()).deliveries[0].id).toBe(
      "PO-201",
    );
  });

  it("rejects unsupported file types", () => {
    expect(() => parseImport("x", "data.xlsx", fixture())).toThrow(
      /\.json|\.csv/,
    );
  });
});

describe("spreadsheet table imports", () => {
  const file = (name: string, text: string) => ({ name: `${name}.csv`, text });
  it("replaces inventory, preserves the catalog and leaves baseline unchanged", () => {
    const data = fixture();
    const before = JSON.stringify(data);
    const result = parseImportFiles(
      [file("inventory", "componentId,quantity\nMTR-01,3")],
      data,
    );
    expect(result.inventory).toEqual([{ componentId: "MTR-01", quantity: 3 }]);
    expect(result.suppliers).toEqual(data.suppliers);
    expect(JSON.stringify(data)).toBe(before);
  });
  it("reports replaced and retained tables for a partial import", () => {
    const result = parseImportBundle(
      [file("inventory", "componentId,quantity\nMTR-01,3")],
      fixture(),
    );
    expect(result.replacedTables).toEqual(["inventory"]);
    expect(result.retainedTables).toEqual([
      "suppliers",
      "components",
      "products",
      "deliveries",
      "orders",
      "alternatives",
    ]);
  });
  it("reports JSON as a complete table replacement", () => {
    const result = parseImportBundle(
      [{ name: "data.json", text: JSON.stringify(fixture()) }],
      fixture(),
    );
    expect(result.replacedTables).toHaveLength(7);
    expect(result.retainedTables).toEqual([]);
    expect(result.retainedProductBoms).toBe(false);
  });
  it("discloses retained BOMs only for product imports without a BOM file", () => {
    const products = file("products", "id,name,sku\nP-1,Updated fan,FAN-2");
    const current = fixture();
    const retained = parseImportBundle([products], current);
    expect(retained.retainedProductBoms).toBe(true);
    expect(retained.data.products[0].bom).toEqual(current.products[0].bom);
    const replaced = parseImportBundle(
      [products, file("bom", "productId,componentId,quantity\nP-1,MTR-01,3")],
      current,
    );
    expect(replaced.retainedProductBoms).toBe(false);
    expect(replaced.data.products[0].bom[0].quantity).toBe(3);
  });
  it("validates related product, BOM and order files together regardless of file order", () => {
    const data = fixture();
    data.alternatives = [];
    const result = parseImportFiles(
      [
        file("bom", "productId,componentId,quantity\nP-NEW,MTR-01,3"),
        file(
          "orders",
          'id,customer,productId,quantity,requiredDate,value\nNEW-01,"Acme, Ltd",P-NEW,2,2026-11-22,1200.50',
        ),
        file("products", "id,name,sku\nP-NEW,New fan,NEW-1"),
      ],
      data,
    );
    expect(result.products[0].bom[0].quantity).toBe(3);
    expect(result.orders[0].customer).toBe("Acme, Ltd");
    expect(result.orders[0].value).toBe(1200.5);
  });
  it("rejects broken cross-references transactionally", () => {
    const data = fixture();
    const before = JSON.stringify(data);
    expect(() =>
      parseImportFiles(
        [
          file("inventory", "componentId,quantity\nMTR-01,1"),
          file(
            "orders",
            "id,customer,productId,quantity,requiredDate,value\nX,Acme,MISSING,1,2026-11-22,1",
          ),
        ],
        data,
      ),
    ).toThrow(/MISSING/);
    expect(JSON.stringify(data)).toBe(before);
  });
  it("does not produce an import result when validation fails", () => {
    expect(() =>
      parseImportBundle(
        [file("inventory", "componentId,quantity\nUNKNOWN,1")],
        fixture(),
      ),
    ).toThrow(/UNKNOWN/);
  });
  it("rejects duplicate tables, duplicate headers, invalid counts, dates and ragged rows", () => {
    const valid = file("inventory", "componentId,quantity\nMTR-01,1");
    expect(() => parseImportFiles([valid, valid], fixture())).toThrow(
      /only one/,
    );
    for (const csv of [
      "componentId,componentId",
      "componentId,quantity\nMTR-01,1.5",
      "componentId,quantity\nMTR-01,1,extra",
      "componentId,quantity\nMTR-01,-2",
    ])
      expect(() => parseImportFiles([file("bad", csv)], fixture())).toThrow();
    expect(() =>
      parseImportFiles(
        [
          file(
            "orders",
            "id,customer,productId,quantity,requiredDate,value\nX,Acme,P-1,1,2026-02-30,2",
          ),
        ],
        fixture(),
      ),
    ).toThrow(/requiredDate/);
  });
  it("rejects empty files and JSON/CSV mixtures, accepts reordered headers", () => {
    expect(() => parseImportFiles([file("empty", "\n")], fixture())).toThrow(
      /empty/,
    );
    expect(() =>
      parseImportFiles(
        [
          { name: "data.json", text: "{}" },
          file("inventory", "componentId,quantity"),
        ],
        fixture(),
      ),
    ).toThrow(/mix/);
    expect(
      parseImportFiles(
        [file("inventory", "quantity,componentId\n2,MTR-01")],
        fixture(),
      ).inventory[0].quantity,
    ).toBe(2);
  });
});
