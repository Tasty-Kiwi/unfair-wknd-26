import { useId, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addAlternative,
  deleteAlternative,
  documentAlternatives,
  updateAlternative,
  type AlternativeChanges,
} from "@/lib/builder/alternatives";
import { compileGraph } from "@/lib/builder/compiler";
import type {
  Alternative,
  BuilderDocument,
  BuilderIssue,
  BuilderNode,
} from "@/lib/builder/types";
import { IssueList } from "./PropertiesInspector";
import "./builder.css";
import "./alternativeCatalog.css";

export type AlternativeCatalogEditorProps = {
  document: BuilderDocument;
  onDocumentChange: (next: BuilderDocument) => void;
};

type Option = { id: string; label: string };

function options(document: BuilderDocument, kind: BuilderNode["kind"]) {
  return document.nodes
    .filter((node) => node.kind === kind)
    .map((node): Option => {
      const name =
        node.kind === "supplier" ||
        node.kind === "component" ||
        node.kind === "product"
          ? node.fields.name.trim()
          : "";
      return { id: node.id, label: name ? `${name} (${node.id})` : node.id };
    });
}

/** Approved alternative-supply catalog: add, edit and delete entries. IDs are
 * assigned once and never edited, because scenarios refer to them. */
export function AlternativeCatalogEditor({
  document,
  onDocumentChange,
}: AlternativeCatalogEditorProps) {
  const headingId = useId();
  const alternatives = documentAlternatives(document);
  const suppliers = useMemo(() => options(document, "supplier"), [document]);
  const components = useMemo(() => options(document, "component"), [document]);
  const products = useMemo(() => options(document, "product"), [document]);
  const issues = useMemo(() => {
    const compiled = compileGraph(document);
    return compiled.ok ? [] : compiled.issues;
  }, [document]);

  return (
    <section className="alt-catalog" aria-labelledby={headingId}>
      <h3 id={headingId} className="builder-inspector__title">
        Approved alternatives
      </h3>
      <p className="builder-inspector__hint">
        Backup supply that a scenario may use. Each one is approved for specific
        products only.
      </p>
      {alternatives.length === 0 ? (
        <p className="alt-catalog__empty">No approved alternatives yet.</p>
      ) : (
        <ul className="alt-catalog__list">
          {alternatives.map((alternative) => (
            <li key={alternative.id}>
              <AlternativeRow
                alternative={alternative}
                suppliers={suppliers}
                components={components}
                products={products}
                issues={issues.filter(
                  (issue) => issue.alternativeId === alternative.id,
                )}
                onChange={(changes) =>
                  onDocumentChange(
                    updateAlternative(document, alternative.id, changes),
                  )
                }
                onDelete={() =>
                  onDocumentChange(deleteAlternative(document, alternative.id))
                }
              />
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onDocumentChange(addAlternative(document).document)}
        >
          <Plus aria-hidden="true" />
          Add alternative
        </Button>
      </div>
    </section>
  );
}

function AlternativeRow({
  alternative,
  suppliers,
  components,
  products,
  issues,
  onChange,
  onDelete,
}: {
  alternative: Alternative;
  suppliers: Option[];
  components: Option[];
  products: Option[];
  issues: BuilderIssue[];
  onChange: (changes: AlternativeChanges) => void;
  onDelete: () => void;
}) {
  const base = useId();
  const [confirming, setConfirming] = useState(false);
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null);
  const quantityText = quantityDraft ?? String(alternative.quantity);
  const quantityInvalid =
    quantityDraft !== null &&
    (!/^\d+$/.test(quantityDraft.trim()) ||
      !Number.isSafeInteger(Number(quantityDraft)));
  const title = alternative.name.trim() || alternative.id;
  const fieldIssues = (field: string) =>
    issues.filter((issue) => issue.field === field);

  const select = (
    field: "supplierId" | "componentId",
    label: string,
    choices: Option[],
  ) => {
    const value = alternative[field];
    const known = choices.some((choice) => choice.id === value);
    const own = fieldIssues(field);
    return (
      <div className="builder-field" data-field={field}>
        <label htmlFor={`${base}-${field}`}>{label}</label>
        <select
          id={`${base}-${field}`}
          value={value}
          aria-invalid={own.length > 0 || undefined}
          onChange={(event) => onChange({ [field]: event.target.value })}
        >
          <option value="">Choose…</option>
          {!known && value !== "" && (
            <option value={value}>{`Missing: ${value}`}</option>
          )}
          {choices.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {choice.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const scoped = new Set(alternative.approvedProductIds);
  const unknownScope = alternative.approvedProductIds.filter(
    (id) => !products.some((product) => product.id === id),
  );

  return (
    <fieldset
      className="alt-catalog__item"
      data-alternative-id={alternative.id}
    >
      <legend>{title}</legend>
      <p className="alt-catalog__id">ID {alternative.id}</p>
      <div className="builder-field" data-field="name">
        <label htmlFor={`${base}-name`}>Alternative name</label>
        <input
          id={`${base}-name`}
          value={alternative.name}
          aria-invalid={fieldIssues("name").length > 0 || undefined}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>
      <div className="alt-catalog__grid">
        {select("supplierId", "Alternative supplier", suppliers)}
        {select("componentId", "Component supplied", components)}
        <div className="builder-field" data-field="quantity">
          <label htmlFor={`${base}-quantity`}>Quantity available</label>
          <input
            id={`${base}-quantity`}
            inputMode="numeric"
            value={quantityText}
            aria-invalid={
              quantityInvalid || fieldIssues("quantity").length > 0 || undefined
            }
            onChange={(event) => {
              const text = event.target.value;
              if (
                /^\d+$/.test(text.trim()) &&
                Number.isSafeInteger(Number(text))
              ) {
                setQuantityDraft(null);
                onChange({ quantity: Number(text) });
              } else {
                setQuantityDraft(text);
              }
            }}
            onBlur={() => setQuantityDraft(null)}
          />
          {quantityInvalid && (
            <p className="alt-catalog__field-error" role="alert">
              Enter a whole number, 0 or more.
            </p>
          )}
        </div>
        <div className="builder-field" data-field="availableDate">
          <label htmlFor={`${base}-date`}>Earliest available date</label>
          <input
            id={`${base}-date`}
            placeholder="YYYY-MM-DD"
            value={alternative.availableDate}
            aria-invalid={fieldIssues("availableDate").length > 0 || undefined}
            onChange={(event) =>
              onChange({ availableDate: event.target.value })
            }
          />
        </div>
      </div>
      <fieldset className="alt-catalog__scope">
        <legend>Approved for products</legend>
        {products.length === 0 && unknownScope.length === 0 && (
          <p className="alt-catalog__empty">
            Add a product to the network first.
          </p>
        )}
        {[
          ...products,
          ...unknownScope.map((id) => ({ id, label: `Missing: ${id}` })),
        ].map((product) => (
          <label key={product.id} className="alt-catalog__check">
            <input
              type="checkbox"
              checked={scoped.has(product.id)}
              onChange={(event) =>
                onChange({
                  approvedProductIds: event.target.checked
                    ? [...alternative.approvedProductIds, product.id]
                    : alternative.approvedProductIds.filter(
                        (id) => id !== product.id,
                      ),
                })
              }
            />
            {product.label}
          </label>
        ))}
      </fieldset>
      <label className="alt-catalog__check">
        <input
          type="checkbox"
          checked={alternative.approved}
          onChange={(event) => onChange({ approved: event.target.checked })}
        />
        Approved for use in scenarios
      </label>
      {issues.length > 0 && <IssueList issues={issues} />}
      <div className="builder-inspector__actions">
        {confirming ? (
          <>
            <p role="alert" className="builder-inspector__confirm">
              Delete {title}? Scenarios using it must be revalidated.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              Confirm delete
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Delete alternative ${title}`}
            onClick={() => setConfirming(true)}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>
    </fieldset>
  );
}
