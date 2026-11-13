import { useEffect, useRef, useState } from "react";
import type { BuilderWorkspaceV1 } from "../builder/types";
import { loadWorkspace, WORKSPACE_STORAGE_KEY } from "../builder/storage";
import {
  canonicalizeCloudWorkspace,
  CLOUD_MAX_WORKSPACE_BYTES,
  CLOUD_PROJECT_LIMIT,
  projectNameSchema,
  type CloudProject,
  type CloudUser,
  type ProjectMetadata,
} from "./contracts";
import { cloudClient, CloudClientError, type CloudClient } from "./client";

export const GUEST_DRAFT_KEY = WORKSPACE_STORAGE_KEY;
export const PROJECTS_PAGE_SIZE = 50;
export const UNSAVED_DEVICE_COPY_MESSAGE =
  "This project has changes saved only on this device. Opening the cloud version replaces them. Export JSON first if you need them.";
export const UNCONFIRMED_SAVE_MESSAGE =
  "Save not confirmed. Check My Projects before saving again.";
const SIGN_IN_AGAIN_MESSAGE =
  "Sign in again to save. Your work on this device is kept.";

// Scoped by owner and project so one account never reads another's draft.
export function cloudDraftKey(ownerId: string, projectId: string): string {
  return `dominoos.builder.cloud-draft.v1:${encodeURIComponent(ownerId)}:${projectId}`;
}

export type CloudSession =
  | { kind: "unknown" }
  | { kind: "signed-out" }
  | { kind: "signed-in"; user: CloudUser };

// Cloud identity of the editor. It lives beside the workspace, never inside it.
export type CloudBinding = {
  ownerId: string;
  projectId: string;
  name: string;
  version: number;
  acknowledgedJson: string;
  updatedAt: string | null;
  // A newer cloud version exists. Saving is disabled until Save as new or Open.
  blocked: boolean;
};

export type CloudSaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "unconfirmed" }
  | { kind: "error"; message: string };

export type CloudDialog =
  { kind: "projects" } | { kind: "name"; mode: "create" | "copy" } | null;

export type CloudProjectsState = {
  // The account the items belong to. The list shows only when this matches the session user.
  ownerId: string | null;
  items: ProjectMetadata[];
  nextOffset: number | null;
  error: string | null;
  loaded: boolean;
};

// The editor owns the workspace. The hook calls these to read it and move it.
export type CloudHost = {
  current(): BuilderWorkspaceV1;
  // Synchronously writes the editor to a storage key. Shows its own error on failure.
  persist(key: string): boolean;
  // Replaces the editor with a workspace, without confirmation.
  apply(next: BuilderWorkspaceV1): void;
  // Replaces the editor with the guest draft, or blank when none exists. Returns false
  // only when the editor cannot be moved safely; the binding then stays unchanged.
  restoreGuest(): boolean;
  // One confirmation. Without a message, the builder's replace rules decide.
  confirm(message?: string): boolean;
};

export function isUnauthorized(error: unknown): boolean {
  return error instanceof CloudClientError && error.status === 401;
}

function isOutcomeUnknown(error: unknown): boolean {
  return (
    error instanceof CloudClientError &&
    (error.kind === "timeout" ||
      error.kind === "aborted" ||
      error.kind === "network")
  );
}

export function describeCloudError(error: unknown): string {
  if (!(error instanceof CloudClientError)) {
    return "Not saved to cloud. Your work on this device is unchanged.";
  }
  switch (error.code) {
    case "unauthorized":
      return "Sign in again to continue. Your work on this device is kept.";
    case "not_found":
      return "This project is no longer available.";
    case "project_limit_reached":
      return `You have ${CLOUD_PROJECT_LIMIT} cloud projects, the maximum. Deleting projects is not available yet.`;
    case "creation_rate_limited":
      return "Too many new projects right now. Try again in a minute.";
    case "payload_too_large":
      return "This project is larger than the 1 MB cloud limit. Export the JSON instead.";
    case "cloud_unavailable":
      return "Cloud is unavailable right now. Your work on this device is unchanged.";
    case "origin_rejected":
      return "Cloud rejected this request. Reload the page and try again.";
    case "rate_limited":
      return error.retryAfterSeconds
        ? `Too many attempts. Wait ${error.retryAfterSeconds} seconds and try again.`
        : "Too many attempts. Wait a minute and try again.";
  }
  if (error.kind === "invalid") return error.message;
  return "Cloud request failed. Your work on this device is unchanged.";
}

// True when the editor's canonical JSON differs from the last acknowledged cloud JSON.
export function isUnsavedAgainst(
  workspace: BuilderWorkspaceV1,
  acknowledgedJson: string,
): boolean {
  try {
    return canonicalizeCloudWorkspace(workspace).json !== acknowledgedJson;
  } catch {
    return true;
  }
}

export function defaultProjectName(workspace: BuilderWorkspaceV1): string {
  const name = workspace.document.name.trim();
  return (name || "Untitled project").slice(0, 120);
}

export function copyProjectName(name: string): string {
  return `${name} (copy)`.slice(0, 120);
}

// Compares a device draft in a project's scoped slot with the cloud JSON.
export function scopedDraftDiffers(
  ownerId: string,
  projectId: string,
  cloudJson: string,
): boolean {
  const draft = loadWorkspace(undefined, cloudDraftKey(ownerId, projectId));
  if (draft.error) return true;
  if (!draft.workspace) return false;
  try {
    return canonicalizeCloudWorkspace(draft.workspace).json !== cloudJson;
  } catch {
    return true;
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function describeCloudStatus(input: {
  session: CloudSession;
  binding: CloudBinding | null;
  dirty: boolean;
  save: CloudSaveState;
}): string {
  const { session, binding, dirty, save } = input;
  if (save.kind === "saving") return "Saving to cloud…";
  if (save.kind === "unconfirmed") return UNCONFIRMED_SAVE_MESSAGE;
  if (save.kind === "error") return `Not saved to cloud: ${save.message}`;
  if (!binding) return "Not saved to cloud";
  if (binding.blocked) {
    return "Kept on this device. The cloud project has a newer version.";
  }
  if (session.kind === "signed-out") return SIGN_IN_AGAIN_MESSAGE;
  const time = formatTime(binding.updatedAt);
  const saved = time ? `Saved to cloud · ${time}` : "Saved to cloud";
  return dirty ? `${saved} · Unsaved cloud changes` : saved;
}

type Token = {
  controller: AbortController;
  epoch: number;
  kind: string;
};

export type CloudConflict = {
  currentVersion: number;
  updatedAt: string | null;
};

export function useBuilderCloud({
  host,
  workspace,
  client = cloudClient,
}: {
  host: CloudHost;
  workspace: BuilderWorkspaceV1;
  client?: CloudClient;
}) {
  const hostRef = useRef(host);
  hostRef.current = host;

  const [session, setSession] = useState<CloudSession>({ kind: "unknown" });
  // Fail closed for cloud UI until the public configuration check succeeds.
  const [cloudAvailable, setCloudAvailable] = useState(false);
  const [binding, setBinding] = useState<CloudBinding | null>(null);
  const bindingRef = useRef<CloudBinding | null>(null);
  const [save, setSave] = useState<CloudSaveState>({ kind: "idle" });
  const [conflict, setConflict] = useState<CloudConflict | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [dialog, setDialog] = useState<CloudDialog>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [projects, setProjects] = useState<CloudProjectsState>({
    ownerId: null,
    items: [],
    nextOffset: null,
    error: null,
    loaded: false,
  });
  const [dirty, setDirty] = useState(false);

  // Context generation, abort set and one-op lock. A switch bumps the epoch and
  // aborts everything, so older completions can see they are stale.
  const epochRef = useRef(0);
  const controllersRef = useRef(new Set<AbortController>());
  const pendingRef = useRef<string | null>(null);
  const signingOutRef = useRef(false);

  function commitBinding(next: CloudBinding | null) {
    bindingRef.current = next;
    setBinding(next);
    setDirty(false);
  }

  function beginOp(kind: string): Token | null {
    if (pendingRef.current !== null) return null;
    const controller = new AbortController();
    controllersRef.current.add(controller);
    pendingRef.current = kind;
    setBusy(kind);
    return { controller, epoch: epochRef.current, kind };
  }

  function endOp(token: Token) {
    controllersRef.current.delete(token.controller);
    if (token.epoch === epochRef.current && pendingRef.current === token.kind) {
      pendingRef.current = null;
      setBusy(null);
    }
  }

  function isCurrent(token: Token): boolean {
    return token.epoch === epochRef.current;
  }

  function invalidate() {
    epochRef.current += 1;
    for (const controller of controllersRef.current) controller.abort();
    controllersRef.current.clear();
    pendingRef.current = null;
    setBusy(null);
  }

  function slotKeyOf(value: CloudBinding | null): string {
    return value
      ? cloudDraftKey(value.ownerId, value.projectId)
      : GUEST_DRAFT_KEY;
  }

  // Flushes the editor, drops the cloud binding and restores the guest draft.
  // Returns false when the flush fails, and nothing changes.
  function leaveCloud(note: string | null): boolean {
    const previous = bindingRef.current;
    if (!previous) return true;
    // Flush and restore before the binding moves. A failure leaves the binding intact,
    // so cloud content can never autosave into the guest slot.
    if (!hostRef.current.persist(slotKeyOf(previous))) return false;
    if (!hostRef.current.restoreGuest()) return false;
    invalidate();
    commitBinding(null);
    setConflict(null);
    setSave({ kind: "idle" });
    setDialog(null);
    setMessage(note);
    return true;
  }

  // Confirms the signed-in user before cloud actions. An account change leaves the cloud.
  async function ensureUser(
    token: Token,
  ): Promise<CloudUser | "signed-out" | null> {
    try {
      const user = await client.me(token.controller.signal);
      if (!isCurrent(token)) return null;
      setSession({ kind: "signed-in", user });
      const previous = bindingRef.current;
      if (previous && previous.ownerId !== user.id) {
        leaveCloud("Your account changed. Your device draft was restored.");
        return null;
      }
      return user;
    } catch (error) {
      if (!isCurrent(token)) return null;
      if (isUnauthorized(error)) {
        setSession({ kind: "signed-out" });
        if (bindingRef.current) setMessage(SIGN_IN_AGAIN_MESSAGE);
        return "signed-out";
      }
      setMessage(describeCloudError(error));
      return null;
    }
  }

  // Keeps the dirty flag current without parsing the workspace on every keystroke.
  useEffect(() => {
    if (!binding) return;
    const ack = binding.acknowledgedJson;
    const timer = window.setTimeout(() => {
      setDirty(isUnsavedAgainst(workspace, ack));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [workspace, binding]);

  async function signIn() {
    const token = beginOp("signin");
    if (!token) return;
    try {
      if (session.kind === "unknown") {
        // Already signed in (for example, a fresh builder mount after a return)?
        const user = await ensureUser(token);
        if (!isCurrent(token)) return;
        if (user && user !== "signed-out") {
          setMessage(`Signed in as ${user.name}.`);
          return;
        }
        if (user === null) return;
      }
      if (!hostRef.current.persist(slotKeyOf(bindingRef.current))) return;
      const url = await client.startGitHubSignIn(token.controller.signal);
      if (!isCurrent(token)) return;
      window.location.assign(url);
    } catch (error) {
      if (isCurrent(token)) setMessage(describeCloudError(error));
    } finally {
      endOp(token);
    }
  }

  async function signOut() {
    if (signingOutRef.current) return;
    if (!hostRef.current.persist(slotKeyOf(bindingRef.current))) return;
    // Restore first. If the guest draft cannot be restored, sign-out pauses and the binding stays.
    if (!hostRef.current.restoreGuest()) {
      setMessage(
        "Sign-out paused: your device draft could not be restored. Your work is kept.",
      );
      return;
    }
    signingOutRef.current = true;
    invalidate();
    const token = beginOp("signout");
    if (!token) {
      signingOutRef.current = false;
      return;
    }
    commitBinding(null);
    setConflict(null);
    setSave({ kind: "idle" });
    setDialog(null);
    setSession({ kind: "signed-out" });
    try {
      await client.signOut(token.controller.signal);
      if (isCurrent(token))
        setMessage("Signed out. Your device draft is restored.");
    } catch {
      if (isCurrent(token))
        setMessage(
          "Server sign-out not confirmed. Your session may still be active until it expires.",
        );
    } finally {
      signingOutRef.current = false;
      endOp(token);
    }
  }

  async function loadProjects(reset: boolean) {
    const token = beginOp("list");
    if (!token) return;
    try {
      // Same owner guard as Open and Save: confirm the account before listing.
      const user = await ensureUser(token);
      if (!isCurrent(token)) return;
      if (!user || user === "signed-out") {
        if (user === "signed-out") {
          setProjects((previous) => ({
            ...previous,
            error: "Sign in with GitHub to see your projects.",
            loaded: true,
          }));
        }
        return;
      }
      // A different owner than the list shows always starts from the first page.
      const restart = reset || projects.ownerId !== user.id;
      const offset = restart ? 0 : projects.nextOffset;
      if (offset === null) return;
      const page = await client.listProjects(
        { limit: PROJECTS_PAGE_SIZE, offset },
        token.controller.signal,
      );
      if (!isCurrent(token)) return;
      setProjects((previous) => ({
        ownerId: user.id,
        items:
          restart || previous.ownerId !== user.id
            ? page.projects
            : [...previous.items, ...page.projects],
        nextOffset: page.nextOffset,
        error: null,
        loaded: true,
      }));
    } catch (error) {
      if (!isCurrent(token)) return;
      if (isUnauthorized(error)) {
        setSession({ kind: "signed-out" });
        setProjects((previous) => ({
          ...previous,
          error: "Sign in with GitHub to see your projects.",
          loaded: true,
        }));
      } else {
        setProjects((previous) => ({
          ...previous,
          error: describeCloudError(error),
          loaded: true,
        }));
      }
    } finally {
      endOp(token);
    }
  }

  function openProjects() {
    setDialog({ kind: "projects" });
    setProjects({
      ownerId: null,
      items: [],
      nextOffset: null,
      error: null,
      loaded: false,
    });
    void loadProjects(true);
  }

  async function openProject(projectId: string) {
    const token = beginOp("open");
    if (!token) return;
    const captured = hostRef.current.current();
    try {
      const user = await ensureUser(token);
      if (!user || user === "signed-out") {
        if (user === "signed-out" && isCurrent(token)) {
          setMessage("Sign in with GitHub to open cloud projects.");
        }
        return;
      }
      const project: CloudProject = await client.getProject(
        projectId,
        token.controller.signal,
      );
      if (!isCurrent(token)) return;
      if (hostRef.current.current() !== captured) {
        setMessage("Your edits changed while opening. Open it again.");
        return;
      }
      const cloudJson = canonicalizeCloudWorkspace(project.workspace).json;
      // The bound project's edits may not be flushed to its slot yet, so compare
      // the live editor in memory. Other targets keep the stored-draft check.
      const bound = bindingRef.current;
      const sameProject =
        bound !== null &&
        bound.ownerId === user.id &&
        bound.projectId === projectId;
      const draftDiffers = sameProject
        ? isUnsavedAgainst(captured, cloudJson)
        : scopedDraftDiffers(user.id, projectId, cloudJson);
      if (
        !hostRef.current.confirm(
          draftDiffers ? UNSAVED_DEVICE_COPY_MESSAGE : undefined,
        )
      ) {
        return;
      }
      if (!hostRef.current.persist(slotKeyOf(bindingRef.current))) return;
      commitBinding({
        ownerId: user.id,
        projectId: project.id,
        name: project.name,
        version: project.version,
        acknowledgedJson: cloudJson,
        updatedAt: project.updatedAt,
        blocked: false,
      });
      setConflict(null);
      setSave({ kind: "idle" });
      setDialog(null);
      setMessage(`Opened ${project.name}.`);
      hostRef.current.apply(project.workspace);
    } catch (error) {
      if (isCurrent(token)) setMessage(describeCloudError(error));
    } finally {
      endOp(token);
    }
  }

  async function saveToCloud() {
    const current = bindingRef.current;
    if (!current) {
      setDialog({ kind: "name", mode: "create" });
      setNameError(null);
      return;
    }
    if (current.blocked) {
      setMessage(
        "This project has a newer cloud version. Save as new project, or Open it from My Projects.",
      );
      return;
    }
    const token = beginOp("save");
    if (!token) return;
    try {
      let snapshot: ReturnType<typeof canonicalizeCloudWorkspace>;
      try {
        snapshot = canonicalizeCloudWorkspace(hostRef.current.current());
      } catch {
        setSave({
          kind: "error",
          message:
            "This workspace cannot be saved to cloud. Export the JSON instead.",
        });
        return;
      }
      if (snapshot.bytes > CLOUD_MAX_WORKSPACE_BYTES) {
        setSave({
          kind: "error",
          message:
            "This project is larger than the 1 MB cloud limit. Export the JSON instead.",
        });
        return;
      }
      if (snapshot.json === current.acknowledgedJson) {
        setSave({ kind: "idle" });
        setMessage("No changes since the last cloud save.");
        return;
      }
      setSave({ kind: "saving" });
      const user = await ensureUser(token);
      if (!user || user === "signed-out") {
        if (isCurrent(token)) setSave({ kind: "idle" });
        return;
      }
      setSave({ kind: "saving" });
      const project = await client.updateProject(
        current.projectId,
        {
          name: current.name,
          workspace: snapshot.workspace,
          expectedVersion: current.version,
        },
        token.controller.signal,
      );
      if (!isCurrent(token)) return;
      // Acknowledge only the snapshot that was sent. Later edits stay dirty.
      commitBinding({
        ...current,
        name: project.name,
        version: project.version,
        acknowledgedJson: snapshot.json,
        updatedAt: project.updatedAt,
      });
      setSave({ kind: "idle" });
      setMessage(null);
    } catch (error) {
      if (!isCurrent(token)) return;
      if (
        error instanceof CloudClientError &&
        error.code === "version_conflict"
      ) {
        const latest = bindingRef.current;
        if (latest) commitBinding({ ...latest, blocked: true });
        setConflict({
          currentVersion: error.currentVersion ?? current.version + 1,
          updatedAt: error.updatedAt ?? null,
        });
        setSave({ kind: "idle" });
      } else if (isOutcomeUnknown(error)) {
        setSave({ kind: "unconfirmed" });
      } else if (isUnauthorized(error)) {
        setSession({ kind: "signed-out" });
        setSave({ kind: "idle" });
      } else {
        setSave({ kind: "error", message: describeCloudError(error) });
      }
    } finally {
      endOp(token);
    }
  }

  // Creates a project from the editor and binds to it. Used for first save and for save as new.
  async function createCloudProject(name: string): Promise<boolean> {
    const parsed = projectNameSchema.safeParse(name);
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? "Enter a project name.");
      return false;
    }
    const token = beginOp("create");
    if (!token) {
      setNameError("Wait for the current cloud request to finish.");
      return false;
    }
    try {
      let snapshot: ReturnType<typeof canonicalizeCloudWorkspace>;
      try {
        snapshot = canonicalizeCloudWorkspace(hostRef.current.current());
      } catch {
        setNameError(
          "This workspace cannot be saved to cloud. Export the JSON instead.",
        );
        return false;
      }
      if (snapshot.bytes > CLOUD_MAX_WORKSPACE_BYTES) {
        setNameError(
          "This project is larger than the 1 MB cloud limit. Export the JSON instead.",
        );
        return false;
      }
      setNameError(null);
      const user = await ensureUser(token);
      if (!user || user === "signed-out") {
        setDialog(null);
        return false;
      }
      // Keep the current slot's content before anything is created on the server.
      if (!hostRef.current.persist(slotKeyOf(bindingRef.current))) {
        setNameError(
          "Could not keep your work on this device. Nothing was created in cloud.",
        );
        return false;
      }
      const project = await client.createProject(
        { name: parsed.data, workspace: snapshot.workspace },
        token.controller.signal,
      );
      if (!isCurrent(token)) return false;
      // Bind only when the new slot is written. A failure keeps the current binding and draft.
      if (!hostRef.current.persist(cloudDraftKey(user.id, project.id))) {
        setDialog(null);
        setMessage(
          `Created ${project.name} in cloud, but this device could not keep a copy. Open it from My Projects.`,
        );
        return false;
      }
      commitBinding({
        ownerId: user.id,
        projectId: project.id,
        name: project.name,
        version: project.version,
        acknowledgedJson: snapshot.json,
        updatedAt: project.updatedAt,
        blocked: false,
      });
      setConflict(null);
      setSave({ kind: "idle" });
      setDialog(null);
      setMessage(`Saved to cloud as ${project.name}.`);
      return true;
    } catch (error) {
      if (!isCurrent(token)) return false;
      if (isOutcomeUnknown(error)) {
        // The server may have created it. Close the form and ask the user to check My Projects.
        setDialog(null);
        setMessage(UNCONFIRMED_SAVE_MESSAGE);
      } else {
        setNameError(describeCloudError(error));
      }
      return false;
    } finally {
      endOp(token);
    }
  }

  // Leaves the cloud project without a server call. Used by the replace paths.
  // The caller applies the new workspace right after this returns true.
  function detachForReplace(): boolean {
    const previous = bindingRef.current;
    if (!previous) return true;
    if (!hostRef.current.persist(slotKeyOf(previous))) return false;
    invalidate();
    commitBinding(null);
    setConflict(null);
    setSave({ kind: "idle" });
    setMessage(null);
    return true;
  }

  function switchToDeviceDraft() {
    leaveCloud("Switched to your device draft.");
  }

  // Probe public availability on builder mount. Session/project endpoints are
  // untouched until cloud is configured; guest editing never waits for this.
  useEffect(() => {
    const url = new URL(window.location.href);
    const authError = url.searchParams.get("authError") === "1";
    const returned = url.searchParams.get("builder") === "1";
    // The return flags are removed only after the check finishes. A StrictMode
    // remount then still sees them and repeats the check, instead of losing it.
    const clearFlags = () => {
      const next = new URL(window.location.href);
      next.searchParams.delete("authError");
      next.searchParams.delete("builder");
      window.history.replaceState(window.history.state, "", next.toString());
    };
    if (authError) {
      setMessage(
        "GitHub sign-in did not finish. Your work on this device is unchanged.",
      );
      const next = new URL(window.location.href);
      next.searchParams.delete("authError");
      window.history.replaceState(window.history.state, "", next.toString());
    }
    const token = beginOp("availability");
    if (token) {
      void (async () => {
        try {
          const health = await client.health(token.controller.signal);
          if (!isCurrent(token)) return;
          setCloudAvailable(health.cloudEnabled);
          if (health.cloudEnabled && returned) {
            const user = await ensureUser(token);
            if (!isCurrent(token)) return;
            if (user && user !== "signed-out") {
              setMessage(`Signed in as ${user.name}.`);
            }
          }
          if (returned) clearFlags();
        } catch {
          if (!isCurrent(token)) return;
          setCloudAvailable(false);
          if (returned) clearFlags();
        } finally {
          endOp(token);
        }
      })();
    }
    return () => invalidate();
    // Runs once per mount. Callbacks read refs, so stale closures are not a risk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    draftKey: slotKeyOf(binding),
    cloudAvailable,
    session,
    binding,
    dirty,
    save,
    conflict,
    message,
    busy,
    dialog,
    nameError,
    projects,
    atProjectLimit: projects.items.length >= CLOUD_PROJECT_LIMIT,
    detachForReplace,
    actions: {
      signIn,
      signOut,
      openProjects,
      loadMoreProjects: () => void loadProjects(false),
      openProject: (id: string) => void openProject(id),
      saveToCloud: () => void saveToCloud(),
      createCloudProject: (name: string) => createCloudProject(name),
      openNameDialog: (mode: "create" | "copy") => {
        setNameError(null);
        setDialog({ kind: "name", mode });
      },
      closeDialog: () => {
        setDialog(null);
        setNameError(null);
      },
      keepLocal: () => setConflict(null),
      switchToDeviceDraft,
    },
  };
}
