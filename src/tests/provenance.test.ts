import { describe, expect, it } from "vitest";
import { DATASET_TABLES } from "@/lib/types";
import {
  fictionalProvenance,
  provenanceAfterImport,
  provenanceLabel,
} from "@/lib/provenance";

describe("dataset provenance", () => {
  it("starts as wholly fictional", () => {
    const provenance = fictionalProvenance();
    expect(provenance.kind).toBe("fictional");
    expect(new Set(Object.values(provenance.tables))).toEqual(
      new Set(["fictional"]),
    );
    expect(provenanceLabel(provenance.kind)).toBe("Fictional demo data");
  });

  it("becomes mixed after a partial import", () => {
    const provenance = provenanceAfterImport(fictionalProvenance(), [
      "deliveries",
    ]);
    expect(provenance.kind).toBe("mixed");
    expect(provenance.tables.deliveries).toBe("imported");
    expect(provenance.tables.orders).toBe("fictional");
    expect(provenanceLabel(provenance.kind)).toBe(
      "Mixed demo + imported data",
    );
  });

  it("becomes fully imported only when every table is imported", () => {
    const partial = provenanceAfterImport(fictionalProvenance(), [
      "deliveries",
      "orders",
    ]);
    const provenance = provenanceAfterImport(partial, DATASET_TABLES);
    expect(provenance.kind).toBe("imported");
    expect(new Set(Object.values(provenance.tables))).toEqual(
      new Set(["imported"]),
    );
    expect(provenanceLabel(provenance.kind)).toBe("Fully imported data");
  });

  it("can reset to the original fictional state", () => {
    const imported = provenanceAfterImport(
      fictionalProvenance(),
      DATASET_TABLES,
    );
    expect(imported.kind).toBe("imported");
    expect(fictionalProvenance()).toEqual(fictionalProvenance());
  });
});
