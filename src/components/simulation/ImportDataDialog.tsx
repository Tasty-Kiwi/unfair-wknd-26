import { useState } from "react";
import { TriangleAlert, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { demoData } from "@/data/demo";
import { simulate } from "@/lib/simulation";
import { parseImportBundle, type ImportResult } from "@/lib/validation";
import type { Dataset, DatasetProvenance } from "@/lib/types";
import { provenanceAfterImport, provenanceLabel } from "@/lib/provenance";
import { presetsFor } from "@/lib/scenarioPresets";
import { download, tableLabel } from "./format";

export interface PendingImport extends ImportResult {
  fileNames: string[];
  provenance: DatasetProvenance;
}

/**
 * The validated import preview shared by every simulation surface. Nothing is
 * applied until the user confirms; a rejected file leaves the owner's data untouched.
 */
export function ImportDataDialog({
  open,
  onOpenChange,
  data,
  provenance,
  autosaves,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Active network: CSV tables merge into it, and example downloads come from it. */
  data: Dataset;
  provenance: DatasetProvenance;
  /** True when the owner saves edits to this device as they happen. */
  autosaves: boolean;
  onConfirm: (pending: PendingImport) => void;
}) {
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(
    null,
  );

  async function importFiles(files: File[]) {
    setImporting(true);
    setImportError("");
    setPendingImport(null);
    try {
      if (files.some((file) => file.size > 2_000_000) || files.length > 5)
        throw new Error(
          "Choose up to five CSV files, each smaller than 2 MB, or one JSON dataset.",
        );
      const parsed = parseImportBundle(
        await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            text: await file.text(),
          })),
        ),
        data,
      );
      simulate(parsed.data, presetsFor(parsed.data)[0]);
      setPendingImport({
        ...parsed,
        fileNames: files.map((file) => file.name),
        provenance: provenanceAfterImport(provenance, parsed.replacedTables),
      });
    } catch (e) {
      setImportError(
        e instanceof Error ? e.message : "Unable to read this file.",
      );
    } finally {
      setImporting(false);
    }
  }

  function confirm() {
    if (!pendingImport) return;
    onConfirm(pendingImport);
    setPendingImport(null);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setImportError("");
          setPendingImport(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bring your material plan</DialogTitle>
          <DialogDescription>
            Replace the dataset with JSON, or select spreadsheet CSV tables
            together. Everything stays in your browser.{" "}
            {autosaves
              ? "This network autosaves its changes on this device. Export your report for a portable backup, and keep your source files."
              : "Data is not saved between sessions: refreshing or closing this page clears your imported plan and scenario changes. Export your report before leaving, and keep your source files to import again."}
          </DialogDescription>
        </DialogHeader>
        <div className="import-zone">
          <Upload size={26} />
          <label htmlFor="data-upload">
            {importing ? "Validating data…" : "Choose a JSON or CSV file"}
          </label>
          <input
            id="data-upload"
            type="file"
            accept=".json,.csv,application/json,text/csv"
            multiple
            disabled={importing}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) void importFiles(files);
              e.target.value = "";
            }}
          />
          <p>
            Up to five CSVs, 2 MB each. All files validate together; a failed
            import leaves your plan unchanged.
          </p>
        </div>
        {importError && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Import rejected</AlertTitle>
            <AlertDescription className="import-error">
              {importError}
            </AlertDescription>
          </Alert>
        )}
        {pendingImport && (
          <div className="import-preview" role="region" aria-live="polite">
            <div>
              <p className="eyebrow">Import preview</p>
              <h3>{provenanceLabel(pendingImport.provenance.kind)}</h3>
              <p>
                <strong>Replace:</strong>{" "}
                {pendingImport.replacedTables.map(tableLabel).join(", ")}.
              </p>
              {pendingImport.retainedProductBoms && (
                <p>
                  <strong>Existing BOMs retained:</strong> Product names and
                  SKUs will be imported, but matching product IDs keep their
                  current bills of materials. These may include fictional demo
                  values. Import products and BOM together to replace both.
                </p>
              )}
              <p>
                <strong>Keep existing:</strong>{" "}
                {pendingImport.retainedTables.length
                  ? `${pendingImport.retainedTables.map(tableLabel).join(", ")}.`
                  : "Nothing — this is a complete dataset replacement."}
              </p>
            </div>
            {pendingImport.provenance.kind === "mixed" && (
              <Alert>
                <TriangleAlert />
                <AlertTitle>Fictional and imported data will mix</AlertTitle>
                <AlertDescription>
                  Results will combine your imported tables with retained values
                  from the fictional demo or an earlier import. Check IDs and
                  relationships before using the analysis.
                </AlertDescription>
              </Alert>
            )}
            <div className="import-preview-actions">
              <Button variant="outline" onClick={() => setPendingImport(null)}>
                Choose different files
              </Button>
              <Button onClick={confirm}>
                {pendingImport.provenance.kind === "mixed"
                  ? "Import and mix data"
                  : "Apply import"}
              </Button>
            </div>
          </div>
        )}
        <p className="muted-small">
          CSV types: inventory, products, BOM, orders, deliveries. Headers
          identify each table, which replaces its existing rows. Select new
          products and their BOM together. A BOM file replaces all product BOMs.
          Suppliers, components and approved alternatives stay in the current
          catalog; use JSON to replace them.
        </p>
        <div className="flex flex-wrap gap-2">
          {["inventory", "products", "bom", "orders"].map((table) => (
            <a
              className="text-sm underline"
              key={table}
              href={`/examples/${table}.csv`}
              download
            >
              {table} template
            </a>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              download("needtrace-demo.json", JSON.stringify(demoData, null, 2))
            }
          >
            Download example JSON
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              download(
                "deliveries-example.csv",
                "id,supplierId,componentId,quantity,availableDate\n" +
                  data.deliveries
                    .map((d) =>
                      [
                        d.id,
                        d.supplierId,
                        d.componentId,
                        d.quantity,
                        d.availableDate,
                      ].join(","),
                    )
                    .join("\n"),
                "text/csv",
              )
            }
          >
            Example CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
