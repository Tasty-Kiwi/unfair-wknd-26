import type { BuilderWorkspaceV1 } from "../builder/types";
import {
  canonicalizeCloudWorkspace,
  CLOUD_MAX_WORKSPACE_BYTES,
  isUuid,
  projectNameSchema,
  type CloudProject,
  type CloudUser,
  type ProjectMetadata,
} from "./contracts";

export const CLOUD_REQUEST_TIMEOUT_MS = 15_000;
export const CLOUD_AUTH_TIMEOUT_MS = 10_000;
export const GITHUB_CALLBACK_URL = "/?builder=1";
export const GITHUB_ERROR_CALLBACK_URL = "/?builder=1&authError=1";

export type CloudFailureKind =
  "http" | "timeout" | "aborted" | "network" | "invalid";

export class CloudClientError extends Error {
  readonly kind: CloudFailureKind;
  readonly status: number | null;
  readonly code: string;
  readonly currentVersion?: number;
  readonly updatedAt?: string;
  readonly retryAfterSeconds?: number;

  constructor(
    kind: CloudFailureKind,
    code: string,
    message: string,
    options?: {
      status?: number | null;
      currentVersion?: number;
      updatedAt?: string;
      retryAfterSeconds?: number;
    },
  ) {
    super(message);
    this.name = "CloudClientError";
    this.kind = kind;
    this.code = code;
    this.status = options?.status ?? null;
    this.currentVersion = options?.currentVersion;
    this.updatedAt = options?.updatedAt;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

export type CloudClient = {
  me(signal?: AbortSignal): Promise<CloudUser>;
  startGitHubSignIn(signal?: AbortSignal): Promise<string>;
  signOut(signal?: AbortSignal): Promise<void>;
  listProjects(
    query: { limit: number; offset: number },
    signal?: AbortSignal,
  ): Promise<{ projects: ProjectMetadata[]; nextOffset: number | null }>;
  getProject(id: string, signal?: AbortSignal): Promise<CloudProject>;
  createProject(
    input: { name: string; workspace: BuilderWorkspaceV1 },
    signal?: AbortSignal,
  ): Promise<ProjectMetadata>;
  updateProject(
    id: string,
    input: {
      name: string;
      workspace: BuilderWorkspaceV1;
      expectedVersion: number;
    },
    signal?: AbortSignal,
  ): Promise<ProjectMetadata>;
};

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

const GITHUB_AUTHORIZE_ORIGIN = "https://github.com";
const GITHUB_AUTHORIZE_PATH = "/login/oauth/authorize";

export function validateGitHubAuthorizationUrl(raw: unknown): string {
  if (typeof raw !== "string") {
    throw invalidResponse();
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw invalidResponse();
  }
  if (
    url.origin !== GITHUB_AUTHORIZE_ORIGIN ||
    url.pathname !== GITHUB_AUTHORIZE_PATH
  ) {
    throw new CloudClientError(
      "invalid",
      "untrusted_redirect",
      "Sign-in returned an unexpected redirect.",
    );
  }
  return url.toString();
}

function invalidResponse(): CloudClientError {
  return new CloudClientError(
    "invalid",
    "invalid_response",
    "Cloud returned an unexpected response.",
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMetadata(value: unknown): ProjectMetadata {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.version !== "number" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    throw invalidResponse();
  }
  return {
    id: value.id,
    name: value.name,
    version: value.version,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

// Maps server error envelopes to safe codes. Server messages are not shown.
async function readFailure(response: Response): Promise<CloudClientError> {
  let code = "http_error";
  let currentVersion: number | undefined;
  let updatedAt: string | undefined;
  try {
    const body: unknown = await response.json();
    if (isRecord(body) && isRecord(body.error)) {
      if (typeof body.error.code === "string") code = body.error.code;
      if (typeof body.error.currentVersion === "number") {
        currentVersion = body.error.currentVersion;
      }
      if (typeof body.error.updatedAt === "string") {
        updatedAt = body.error.updatedAt;
      }
    }
  } catch {
    // Non-JSON failures keep the generic code.
  }
  const retryAfter = Number(response.headers.get("Retry-After"));
  return new CloudClientError(
    "http",
    code,
    `Cloud request failed (${response.status}).`,
    {
      status: response.status,
      currentVersion,
      updatedAt,
      retryAfterSeconds:
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    },
  );
}

type Linked = {
  signal: AbortSignal;
  timedOut: () => boolean;
  release: () => void;
};

// Combines a caller signal with a timeout so either one aborts the request.
function linkTimeout(parent: AbortSignal | undefined, ms: number): Linked {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  const onAbort = () => controller.abort();
  if (parent?.aborted) {
    controller.abort();
  } else {
    parent?.addEventListener("abort", onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    release: () => {
      clearTimeout(timer);
      parent?.removeEventListener("abort", onAbort);
    },
  };
}

export type CloudClientTimeouts = { request: number; auth: number };

export function createCloudClient(
  fetchImpl: FetchLike = (input, init) => globalThis.fetch(input, init),
  timeouts: CloudClientTimeouts = {
    request: CLOUD_REQUEST_TIMEOUT_MS,
    auth: CLOUD_AUTH_TIMEOUT_MS,
  },
): CloudClient {
  // One request path for every call. The timeout covers headers and body.
  // Returns parsed JSON, or undefined when expectJson is false.
  async function request(
    path: string,
    options: {
      method: "GET" | "POST" | "PUT";
      body?: unknown;
      signal?: AbortSignal;
      timeoutMs?: number;
      expectJson: boolean;
    },
  ): Promise<unknown> {
    const linked = linkTimeout(
      options.signal,
      options.timeoutMs ?? timeouts.request,
    );
    const headers: Record<string, string> = { Accept: "application/json" };
    let body: string | undefined;
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
    try {
      let response: Response;
      try {
        response = await fetchImpl(path, {
          method: options.method,
          credentials: "same-origin",
          headers,
          body,
          signal: linked.signal,
        });
      } catch {
        if (linked.timedOut()) {
          throw new CloudClientError(
            "timeout",
            "timeout",
            "Cloud did not respond in time.",
          );
        }
        if (options.signal?.aborted) {
          throw new CloudClientError(
            "aborted",
            "aborted",
            "Cloud request was cancelled.",
          );
        }
        throw new CloudClientError(
          "network",
          "network",
          "Cloud is unreachable.",
        );
      }
      if (!response.ok) throw await readFailure(response);
      if (!options.expectJson) return undefined;
      try {
        return await response.json();
      } catch {
        if (linked.timedOut()) {
          throw new CloudClientError(
            "timeout",
            "timeout",
            "Cloud did not respond in time.",
          );
        }
        throw invalidResponse();
      }
    } finally {
      linked.release();
    }
  }

  function call(
    path: string,
    options: {
      method: "GET" | "POST" | "PUT";
      body?: unknown;
      signal?: AbortSignal;
      timeoutMs?: number;
    },
  ): Promise<unknown> {
    return request(path, { ...options, expectJson: true });
  }

  function requireProjectId(id: string): string {
    if (!isUuid(id)) {
      throw new CloudClientError(
        "invalid",
        "invalid_id",
        "Project id is invalid.",
      );
    }
    return encodeURIComponent(id);
  }

  function requireWorkspace(workspace: BuilderWorkspaceV1) {
    let canonical;
    try {
      canonical = canonicalizeCloudWorkspace(workspace);
    } catch {
      throw new CloudClientError(
        "invalid",
        "invalid_workspace",
        "This workspace cannot be saved to cloud. Export the JSON instead.",
      );
    }
    if (canonical.bytes > CLOUD_MAX_WORKSPACE_BYTES) {
      throw new CloudClientError(
        "invalid",
        "payload_too_large",
        "This project is larger than the 1 MB cloud limit. Export the JSON instead.",
      );
    }
    return canonical;
  }

  function requireName(name: string): string {
    const parsed = projectNameSchema.safeParse(name);
    if (!parsed.success) {
      throw new CloudClientError(
        "invalid",
        "invalid_name",
        parsed.error.issues[0]?.message ?? "Project name is invalid.",
      );
    }
    return parsed.data;
  }

  return {
    async me(signal) {
      const body = await call("/api/me", {
        method: "GET",
        signal,
        timeoutMs: timeouts.auth,
      });
      if (
        !isRecord(body) ||
        !isRecord(body.user) ||
        typeof body.user.id !== "string" ||
        typeof body.user.name !== "string"
      ) {
        throw invalidResponse();
      }
      return { id: body.user.id, name: body.user.name };
    },

    async startGitHubSignIn(signal) {
      const body = await call("/api/auth/sign-in/social", {
        method: "POST",
        body: {
          provider: "github",
          callbackURL: GITHUB_CALLBACK_URL,
          errorCallbackURL: GITHUB_ERROR_CALLBACK_URL,
        },
        signal,
        timeoutMs: timeouts.auth,
      });
      if (!isRecord(body)) throw invalidResponse();
      return validateGitHubAuthorizationUrl(body.url);
    },

    async signOut(signal) {
      // No body and no Content-Type: the server accepts an empty sign-out POST.
      await request("/api/auth/sign-out", {
        method: "POST",
        signal,
        timeoutMs: timeouts.auth,
        expectJson: false,
      });
    },

    async listProjects(query, signal) {
      const params = new URLSearchParams({
        limit: String(query.limit),
        offset: String(query.offset),
      });
      const body = await call(`/api/projects?${params.toString()}`, {
        method: "GET",
        signal,
      });
      if (
        !isRecord(body) ||
        !Array.isArray(body.projects) ||
        !(typeof body.nextOffset === "number" || body.nextOffset === null)
      ) {
        throw invalidResponse();
      }
      return {
        projects: body.projects.map(parseMetadata),
        nextOffset: body.nextOffset,
      };
    },

    async getProject(id, signal) {
      const body = await call(`/api/projects/${requireProjectId(id)}`, {
        method: "GET",
        signal,
      });
      if (!isRecord(body) || !isRecord(body.project)) throw invalidResponse();
      const metadata = parseMetadata(body.project);
      let workspace: BuilderWorkspaceV1;
      try {
        workspace = canonicalizeCloudWorkspace(
          body.project.workspace,
        ).workspace;
      } catch {
        throw invalidResponse();
      }
      return { ...metadata, workspace };
    },

    async createProject(input, signal) {
      const name = requireName(input.name);
      const canonical = requireWorkspace(input.workspace);
      const body = await call("/api/projects", {
        method: "POST",
        body: { name, workspace: canonical.workspace },
        signal,
      });
      if (!isRecord(body)) throw invalidResponse();
      return parseMetadata(body.project);
    },

    async updateProject(id, input, signal) {
      const name = requireName(input.name);
      const canonical = requireWorkspace(input.workspace);
      const body = await call(`/api/projects/${requireProjectId(id)}`, {
        method: "PUT",
        body: {
          name,
          workspace: canonical.workspace,
          expectedVersion: input.expectedVersion,
        },
        signal,
      });
      if (!isRecord(body)) throw invalidResponse();
      return parseMetadata(body.project);
    },
  };
}

export const cloudClient = createCloudClient();
