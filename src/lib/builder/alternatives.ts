import type { Alternative, BuilderDocument } from "./types";

/**
 * Immutable edits for the approved-alternative catalog on a document.
 *
 * Every business change bumps `revision` (so scenarios become stale) and
 * leaves the alternative's ID untouched: scenarios refer to it by that ID.
 * Edits that change nothing return the same document.
 */

function generateAlternativeId(taken: ReadonlySet<string>): string {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix =
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const id = `alternative-${suffix}`;
    if (!taken.has(id)) return id;
  }
  throw new Error("Could not generate a unique alternative id.");
}

export function documentAlternatives(doc: BuilderDocument): Alternative[] {
  return doc.alternatives ?? [];
}

export function createBlankAlternative(
  doc: BuilderDocument,
  id?: string,
): Alternative {
  const taken = new Set(documentAlternatives(doc).map((alt) => alt.id));
  return {
    id: id ?? generateAlternativeId(taken),
    name: "",
    supplierId: "",
    componentId: "",
    quantity: 0,
    availableDate: "",
    approved: false,
    approvedProductIds: [],
  };
}

export function addAlternative(
  doc: BuilderDocument,
  alternative?: Alternative,
): { document: BuilderDocument; id: string } {
  const next = alternative ?? createBlankAlternative(doc);
  if (documentAlternatives(doc).some((alt) => alt.id === next.id)) {
    throw new Error(`Alternative id "${next.id}" already exists.`);
  }
  return {
    id: next.id,
    document: {
      ...doc,
      revision: doc.revision + 1,
      alternatives: [...documentAlternatives(doc), structuredClone(next)],
    },
  };
}

export type AlternativeChanges = Partial<Omit<Alternative, "id">>;

export function updateAlternative(
  doc: BuilderDocument,
  id: string,
  changes: AlternativeChanges,
): BuilderDocument {
  let changed = false;
  const alternatives = documentAlternatives(doc).map((alt) => {
    if (alt.id !== id) return alt;
    const next: Alternative = { ...alt };
    for (const key of Object.keys(changes) as (keyof AlternativeChanges)[]) {
      const value = changes[key];
      if (value === undefined) continue;
      if (JSON.stringify(value) === JSON.stringify(alt[key])) continue;
      (next as unknown as Record<string, unknown>)[key] =
        key === "approvedProductIds" ? [...(value as string[])] : value;
      changed = true;
    }
    return changed ? next : alt;
  });
  return changed ? { ...doc, revision: doc.revision + 1, alternatives } : doc;
}

export function deleteAlternative(
  doc: BuilderDocument,
  id: string,
): BuilderDocument {
  const current = documentAlternatives(doc);
  const alternatives = current.filter((alt) => alt.id !== id);
  if (alternatives.length === current.length) return doc;
  return { ...doc, revision: doc.revision + 1, alternatives };
}
