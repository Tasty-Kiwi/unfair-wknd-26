import { compileGraph } from "./compiler";
import type { BuilderDocument } from "./types";

/** A workspace owns one cache. Business edits bump revision; replacements bump
 * generation even when an imported document reuses both its ID and revision. */
export function createRevisionCompiler(compile = compileGraph) {
  let cached:
    | {
        id: string;
        revision: number;
        generation: number;
        result: ReturnType<typeof compileGraph>;
      }
    | undefined;
  return (document: BuilderDocument, generation: number) => {
    if (
      cached?.id === document.id &&
      cached.revision === document.revision &&
      cached.generation === generation
    )
      return cached.result;
    const result = compile(document);
    cached = {
      id: document.id,
      revision: document.revision,
      generation,
      result,
    };
    return result;
  };
}
