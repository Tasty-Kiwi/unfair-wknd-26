import { describe, expect, it, vi } from "vitest";
import { createRevisionCompiler } from "@/lib/builder/compilation";
import { compileGraph } from "@/lib/builder/compiler";
import { createCoreExample } from "@/lib/builder/factories";
import {
  moveNodes,
  updateNodeField,
  updateViewport,
} from "@/components/builder/documentEdits";

describe("revision-based builder compilation", () => {
  it("skips compilation for node layout and viewport edits, but compiles business edits", () => {
    const engine = vi.fn(compileGraph);
    const compile = createRevisionCompiler(engine);
    const document = createCoreExample();
    const first = compile(document, 0);
    const moved = moveNodes(document, [
      { key: "supplier:supplier-aster", position: { x: 30, y: 50 } },
    ]);
    const panned = updateViewport(moved, { x: 200, y: 100, zoom: 0.7 });
    expect(compile(moved, 0)).toBe(first);
    expect(compile(panned, 0)).toBe(first);
    expect(engine).toHaveBeenCalledTimes(1);
    const changed = updateNodeField(
      panned,
      "component:component-servo-motor",
      "initialStock",
      "7",
    );
    expect(compile(changed, 0)).not.toBe(first);
    expect(engine).toHaveBeenCalledTimes(2);
  });

  it("recompiles same-ID, same-revision replacements and different documents", () => {
    const engine = vi.fn(compileGraph);
    const compile = createRevisionCompiler(engine);
    const document = createCoreExample();
    compile(document, 0);
    const replacement = structuredClone(document);
    const component = replacement.nodes.find((n) => n.kind === "component")!;
    if (component.kind !== "component") throw new Error("Missing component");
    component.fields.initialStock = "3";
    const result = compile(replacement, 1);
    expect(result.ok && result.dataset.inventory[0].quantity).toBe(3);
    expect(engine).toHaveBeenCalledTimes(2);
    compile({ ...replacement, id: "other-network" }, 1);
    expect(engine).toHaveBeenCalledTimes(3);
  });
});
