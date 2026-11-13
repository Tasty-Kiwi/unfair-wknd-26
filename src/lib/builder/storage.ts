import { parseWorkspace } from "./schema";
import type { BuilderWorkspaceV1 } from "./types";

export const WORKSPACE_STORAGE_KEY = "dominoos.builder.workspace.v1";
export const MAX_WORKSPACE_BYTES = 2 * 1024 * 1024;

function utf8ByteLength(text: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(text).length;
  }
  return text.length * 2;
}

function resolveDefaultStorage(): Storage | null {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return globalThis.localStorage;
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeWorkspace(workspace: BuilderWorkspaceV1): string {
  const validated = parseWorkspace(workspace);
  const json = JSON.stringify(validated);
  const bytes = utf8ByteLength(json);
  if (bytes > MAX_WORKSPACE_BYTES) {
    throw new Error(`Workspace exceeds the 2 MB size limit (${bytes} bytes).`);
  }
  return json;
}

export function parseWorkspaceJson(raw: string): BuilderWorkspaceV1 {
  const bytes = utf8ByteLength(raw);
  if (bytes > MAX_WORKSPACE_BYTES) {
    throw new Error(
      `Workspace JSON exceeds the 2 MB size limit (${bytes} bytes).`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? `Invalid JSON: ${err.message}`
        : "Invalid workspace JSON.",
    );
  }
  return parseWorkspace(parsed);
}

export type LoadWorkspaceResult = {
  workspace: BuilderWorkspaceV1 | null;
  error: string | null;
};

export function loadWorkspace(
  storage?: Pick<Storage, "getItem">,
  key: string = WORKSPACE_STORAGE_KEY,
): LoadWorkspaceResult {
  try {
    const target = storage ?? resolveDefaultStorage();
    if (!target) {
      return {
        workspace: null,
        error: "Browser localStorage is unavailable.",
      };
    }
    const raw = target.getItem(key);
    if (raw === null || raw === "") {
      return { workspace: null, error: null };
    }
    const workspace = parseWorkspaceJson(raw);
    return { workspace, error: null };
  } catch (err) {
    return {
      workspace: null,
      error:
        err instanceof Error
          ? err.message
          : "Failed to load builder workspace.",
    };
  }
}

export type SaveWorkspaceResult = { ok: true } | { ok: false; error: string };

export function saveWorkspace(
  workspace: BuilderWorkspaceV1,
  storage?: Pick<Storage, "setItem">,
  key: string = WORKSPACE_STORAGE_KEY,
): SaveWorkspaceResult {
  try {
    const serialized = serializeWorkspace(workspace);
    const target = storage ?? resolveDefaultStorage();
    if (!target) {
      return {
        ok: false,
        error: "Browser localStorage is unavailable.",
      };
    }
    target.setItem(key, serialized);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to save builder workspace.",
    };
  }
}
