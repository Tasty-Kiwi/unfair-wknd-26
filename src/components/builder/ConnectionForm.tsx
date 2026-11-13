import { useId, useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nodeKey } from "@/lib/builder/factories";
import {
  RELATIONSHIP_KINDS,
  type BuilderDocument,
  type NodeKey,
  type RelationshipKind,
} from "@/lib/builder/types";
import {
  RELATIONSHIP_ENDS,
  RELATIONSHIP_LABELS,
  applyConnection,
  type BuilderSelection,
} from "./documentEdits";

export type ConnectionFormProps = {
  document: BuilderDocument;
  labels: Map<NodeKey, string>;
  onChange: (next: BuilderDocument) => void;
  onSelect: (selection: BuilderSelection) => void;
};

/**
 * Keyboard path for relationships: pick a type, then a source and a target of
 * the right kinds. Validation is the same one canvas drags use.
 */
export function ConnectionForm({
  document,
  labels,
  onChange,
  onSelect,
}: ConnectionFormProps) {
  const [kind, setKind] = useState<RelationshipKind>("primarySupplier");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const kindId = useId();
  const sourceId = useId();
  const targetId = useId();
  const quantityId = useId();
  const messageId = useId();

  const ends = RELATIONSHIP_ENDS[kind];
  const sources = document.nodes.filter((node) => node.kind === ends.source);
  const targets = document.nodes.filter((node) => node.kind === ends.target);

  function submit() {
    const result = applyConnection(document, {
      kind,
      source,
      target,
      ...(kind === "bom" ? { quantity } : {}),
    });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(null);
    onChange(result.document);
    onSelect({ type: "edge", id: result.edgeId });
    setSource("");
    setTarget("");
    setQuantity("");
  }

  return (
    <section className="builder-connect" aria-labelledby={`${kindId}-title`}>
      <h3 id={`${kindId}-title`} className="builder-section-title">
        <Link2 aria-hidden size={14} /> Connect
      </h3>
      <div className="builder-field">
        <label htmlFor={kindId}>Connection type</label>
        <select
          id={kindId}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as RelationshipKind);
            setSource("");
            setTarget("");
            setMessage(null);
          }}
        >
          {RELATIONSHIP_KINDS.map((option) => (
            <option key={option} value={option}>
              {RELATIONSHIP_LABELS[option]}
            </option>
          ))}
        </select>
      </div>
      <div className="builder-field">
        <label htmlFor={sourceId}>From ({ends.source})</label>
        <select
          id={sourceId}
          value={source}
          aria-describedby={messageId}
          onChange={(event) => setSource(event.target.value)}
        >
          <option value="">Choose…</option>
          {sources.map((node) => (
            <option key={nodeKey(node)} value={nodeKey(node)}>
              {labels.get(nodeKey(node)) ?? nodeKey(node)}
            </option>
          ))}
        </select>
      </div>
      <div className="builder-field">
        <label htmlFor={targetId}>To ({ends.target})</label>
        <select
          id={targetId}
          value={target}
          aria-describedby={messageId}
          onChange={(event) => setTarget(event.target.value)}
        >
          <option value="">Choose…</option>
          {targets.map((node) => (
            <option key={nodeKey(node)} value={nodeKey(node)}>
              {labels.get(nodeKey(node)) ?? nodeKey(node)}
            </option>
          ))}
        </select>
      </div>
      {kind === "bom" && (
        <div className="builder-field">
          <label htmlFor={quantityId}>Quantity per product unit</label>
          <input
            id={quantityId}
            inputMode="decimal"
            value={quantity}
            placeholder="Required — enter a quantity"
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
      )}
      <Button
        type="button"
        size="sm"
        onClick={submit}
        disabled={!source || !target}
      >
        Add connection
      </Button>
      <p
        id={messageId}
        className="builder-connect__message"
        role={message ? "alert" : undefined}
      >
        {message ?? ""}
      </p>
    </section>
  );
}
