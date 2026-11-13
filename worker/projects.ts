import { z } from "zod";
import {
  CLOUD_CREATE_RATE_LIMIT_PER_MINUTE,
  CLOUD_MAX_AUTH_BODY_BYTES,
  CLOUD_MAX_PROJECT_BODY_BYTES,
  CLOUD_MAX_WORKSPACE_BYTES,
  CLOUD_PROJECT_LIMIT,
  canonicalizeCloudWorkspace,
  createProjectRequestSchema,
  isUuid,
  parseListProjectsQuery,
  updateProjectRequestSchema,
  type CloudHealthResponse,
  type CloudMeResponse,
  type CloudProjectDetailResponse,
  type CloudProjectListResponse,
  type CloudProjectMetadataResponse,
  type ProjectMetadata,
} from "../src/lib/cloud/contracts";
import type { BuilderWorkspaceV1 } from "../src/lib/builder/types";
import {
  HttpError,
  assertJsonContentType,
  assertSameOrigin,
  errorResponse,
  isCloudConfigured,
  jsonResponse,
  methodNotAllowedResponse,
  readBoundedBody,
  readBoundedJson,
  withPrivateNoStoreHeaders,
  type CloudApiEnv,
} from "./http";

export type SessionUser = {
  userId: string;
  name: string;
};

export type SessionVerifier = (
  request: Request,
  env: CloudApiEnv,
) => Promise<SessionUser | null>;

export type AuthHandler = (
  request: Request,
  env: CloudApiEnv,
) => Promise<Response>;

export interface ApiHandlerDeps {
  verifySession: SessionVerifier;
  authHandler?: AuthHandler;
}

type ProjectMetadataRow = {
  id: string;
  name: string;
  version: number;
  created_at: string;
  updated_at: string;
};

type ProjectDetailRow = ProjectMetadataRow & {
  workspace_json: string;
};

type ProjectConflictRow = {
  version: number;
  updated_at: string;
};

type CountRow = {
  total_count: number;
};

type UpdateReturningRow = {
  created_at: string;
};

const AUTH_CALLBACK_SUCCESS_PATH = "/?builder=1";
const AUTH_CALLBACK_ERROR_PATH = "/?builder=1&authError=1";

const AUTH_POST_ALLOWLIST = new Set([
  "/api/auth/sign-in/social",
  "/api/auth/sign-out",
]);

const AUTH_GET_ALLOWLIST = new Set([
  "/api/auth/callback/github",
  "/api/auth/get-session",
]);

const socialSignInRequestSchema = z.strictObject({
  provider: z.literal("github"),
  callbackURL: z.literal(AUTH_CALLBACK_SUCCESS_PATH).optional(),
  errorCallbackURL: z.literal(AUTH_CALLBACK_ERROR_PATH).optional(),
  disableRedirect: z.boolean().optional(),
});

function toProjectMetadata(row: ProjectMetadataRow): ProjectMetadata {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requireCloudConfigured(env: CloudApiEnv): D1Database {
  if (!isCloudConfigured(env) || !env.DB) {
    throw new HttpError(
      503,
      "cloud_unavailable",
      "Cloud persistence is currently unavailable.",
    );
  }
  return env.DB;
}

async function requireSession(
  request: Request,
  env: CloudApiEnv,
  verifySession: SessionVerifier,
): Promise<SessionUser> {
  const session = await verifySession(request, env);
  if (!session || !session.userId) {
    throw new HttpError(401, "unauthorized", "Authentication is required.");
  }
  return session;
}

function formatZodEnvelopeError(
  issues: readonly { path: PropertyKey[]; message: string }[],
): string {
  const first = issues[0];
  if (!first) return "Invalid request body.";
  const path = first.path.map(String).join(".");
  return path ? `${path}: ${first.message}` : first.message;
}

function parseAndValidateWorkspace(workspaceInput: unknown): {
  json: string;
  bytes: number;
} {
  let canonical;
  try {
    canonical = canonicalizeCloudWorkspace(workspaceInput);
  } catch (err) {
    throw new HttpError(
      400,
      "invalid_workspace",
      err instanceof Error ? err.message : "Invalid builder workspace.",
    );
  }

  if (canonical.bytes > CLOUD_MAX_WORKSPACE_BYTES) {
    throw new HttpError(
      413,
      "payload_too_large",
      `Canonical workspace exceeds the ${CLOUD_MAX_WORKSPACE_BYTES} byte cloud limit.`,
      {
        details: {
          maxBytes: CLOUD_MAX_WORKSPACE_BYTES,
        },
      },
    );
  }

  return { json: canonical.json, bytes: canonical.bytes };
}

function preserveSetCookieHeaders(source: Headers): Headers {
  const headers = new Headers();
  if (typeof source.getSetCookie === "function") {
    for (const cookie of source.getSetCookie()) {
      headers.append("Set-Cookie", cookie);
    }
  } else {
    const cookie = source.get("Set-Cookie");
    if (cookie) headers.append("Set-Cookie", cookie);
  }
  return headers;
}

function sanitizeAuthCallbackResponse(
  response: Response,
  env: CloudApiEnv,
): Response {
  const trustedOrigin = new URL(env.BETTER_AUTH_URL ?? "").origin;

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("Location");
    if (location) {
      try {
        const parsed = new URL(location, trustedOrigin);
        if (parsed.origin === trustedOrigin && parsed.pathname === "/") {
          return withPrivateNoStoreHeaders(response, false);
        }
      } catch {
        // Fall through to safe error redirect.
      }
    }
  }

  const headers = preserveSetCookieHeaders(response.headers);
  headers.set("Location", AUTH_CALLBACK_ERROR_PATH);
  headers.set("Cache-Control", "private, no-store");
  return new Response(null, {
    status: 302,
    headers,
  });
}

async function minimizeGetSessionResponse(
  response: Response,
): Promise<Response> {
  if (!response.ok) {
    return withPrivateNoStoreHeaders(response, false);
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return withPrivateNoStoreHeaders(response, false);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return jsonResponse(null, {
      status: response.status,
      headers: preserveSetCookieHeaders(response.headers),
    });
  }

  if (!data || typeof data !== "object") {
    return jsonResponse(null, {
      status: response.status,
      headers: preserveSetCookieHeaders(response.headers),
    });
  }

  const record = data as {
    user?: Record<string, unknown>;
    session?: Record<string, unknown>;
  };

  if (!record.user || typeof record.user.id !== "string") {
    return jsonResponse(null, {
      status: response.status,
      headers: preserveSetCookieHeaders(response.headers),
    });
  }

  const rawName = record.user.name;
  const name =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName.trim()
      : "DominoOS user";

  const payload = {
    user: {
      id: record.user.id,
      name,
    },
    ...(record.session && typeof record.session.id === "string"
      ? {
          session: {
            id: record.session.id,
            expiresAt: record.session.expiresAt,
          },
        }
      : {}),
  };

  return jsonResponse(payload, {
    status: response.status,
    headers: preserveSetCookieHeaders(response.headers),
  });
}

async function handleAuthRoute(
  request: Request,
  env: CloudApiEnv,
  pathname: string,
  requestId: string,
  authHandler?: AuthHandler,
): Promise<Response> {
  const isHead = request.method === "HEAD";

  if (AUTH_GET_ALLOWLIST.has(pathname)) {
    if (request.method !== "GET") {
      return methodNotAllowedResponse(requestId, ["GET"], isHead);
    }
    requireCloudConfigured(env);
    if (!authHandler) {
      throw new HttpError(
        503,
        "cloud_unavailable",
        "Authentication service is unavailable.",
      );
    }
    const response = await authHandler(request, env);
    if (pathname === "/api/auth/callback/github") {
      return sanitizeAuthCallbackResponse(response, env);
    }
    if (pathname === "/api/auth/get-session") {
      return minimizeGetSessionResponse(response);
    }
    return withPrivateNoStoreHeaders(response, false);
  }

  if (AUTH_POST_ALLOWLIST.has(pathname)) {
    if (request.method !== "POST") {
      return methodNotAllowedResponse(requestId, ["POST"], isHead);
    }
    requireCloudConfigured(env);
    assertSameOrigin(request, env);

    const isSocialSignIn = pathname === "/api/auth/sign-in/social";
    let bodyToForward: Uint8Array<ArrayBuffer> | string | undefined;

    if (isSocialSignIn) {
      assertJsonContentType(request);
      const rawBody = await readBoundedJson(request, CLOUD_MAX_AUTH_BODY_BYTES);
      const parsedBody = socialSignInRequestSchema.safeParse(rawBody);
      if (!parsedBody.success) {
        throw new HttpError(
          400,
          "invalid_request",
          formatZodEnvelopeError(parsedBody.error.issues),
        );
      }
      bodyToForward = JSON.stringify({
        provider: "github",
        callbackURL: AUTH_CALLBACK_SUCCESS_PATH,
        errorCallbackURL: AUTH_CALLBACK_ERROR_PATH,
        ...(parsedBody.data.disableRedirect !== undefined
          ? { disableRedirect: parsedBody.data.disableRedirect }
          : {}),
      });
    } else {
      const bodyBytes = await readBoundedBody(
        request,
        CLOUD_MAX_AUTH_BODY_BYTES,
      );
      if (bodyBytes.byteLength > 0) {
        assertJsonContentType(request);
        bodyToForward = bodyBytes;
      }
    }

    if (!authHandler) {
      throw new HttpError(
        503,
        "cloud_unavailable",
        "Authentication service is unavailable.",
      );
    }

    const headers = new Headers(request.headers);
    headers.delete("Content-Length");
    if (typeof bodyToForward === "string") {
      headers.set("Content-Type", "application/json; charset=utf-8");
    }

    const reconstructedRequest = new Request(request.url, {
      method: request.method,
      headers,
      body: bodyToForward,
    });

    const response = await authHandler(reconstructedRequest, env);
    return withPrivateNoStoreHeaders(response, false);
  }

  return errorResponse(requestId, 404, "not_found", "Not found.", { isHead });
}

export function createApiHandler(deps: ApiHandlerDeps) {
  return async function handleApiRequest(
    request: Request,
    env: CloudApiEnv,
  ): Promise<Response> {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    const isHead = method === "HEAD";

    let response: Response;
    try {
      if (pathname === "/api/health") {
        if (method !== "GET") {
          response = methodNotAllowedResponse(requestId, ["GET"], isHead);
        } else {
          const payload: CloudHealthResponse = {
            ok: true,
            cloudEnabled: isCloudConfigured(env),
          };
          response = jsonResponse(payload, { status: 200 });
        }
      } else if (pathname === "/api/me") {
        if (method !== "GET") {
          response = methodNotAllowedResponse(requestId, ["GET"], isHead);
        } else {
          requireCloudConfigured(env);
          const session = await requireSession(
            request,
            env,
            deps.verifySession,
          );
          const payload: CloudMeResponse = {
            user: {
              id: session.userId,
              name: session.name,
            },
          };
          response = jsonResponse(payload, { status: 200 });
        }
      } else if (pathname === "/api/projects") {
        if (method === "GET") {
          const db = requireCloudConfigured(env);
          const session = await requireSession(
            request,
            env,
            deps.verifySession,
          );

          let query;
          try {
            query = parseListProjectsQuery(url);
          } catch (err) {
            throw new HttpError(
              400,
              "invalid_request",
              err instanceof Error ? err.message : "Invalid query parameters.",
            );
          }

          const { results } = await db
            .prepare(
              `SELECT id, name, version, created_at, updated_at
               FROM projects
               WHERE owner_id = ?
               ORDER BY updated_at DESC, id ASC
               LIMIT ? OFFSET ?;`,
            )
            .bind(session.userId, query.limit + 1, query.offset)
            .all<ProjectMetadataRow>();

          const hasMore = results.length > query.limit;
          const items = (hasMore ? results.slice(0, query.limit) : results).map(
            toProjectMetadata,
          );
          const payload: CloudProjectListResponse = {
            projects: items,
            nextOffset: hasMore ? query.offset + query.limit : null,
          };
          response = jsonResponse(payload, { status: 200 });
        } else if (method === "POST") {
          const db = requireCloudConfigured(env);
          assertSameOrigin(request, env);
          assertJsonContentType(request);
          const session = await requireSession(
            request,
            env,
            deps.verifySession,
          );

          const rawBody = await readBoundedJson(
            request,
            CLOUD_MAX_PROJECT_BODY_BYTES,
          );
          const parsedBody = createProjectRequestSchema.safeParse(rawBody);
          if (!parsedBody.success) {
            throw new HttpError(
              400,
              "invalid_request",
              formatZodEnvelopeError(parsedBody.error.issues),
            );
          }

          const { json: workspaceJson } = parseAndValidateWorkspace(
            parsedBody.data.workspace,
          );

          const projectId = crypto.randomUUID();
          const nowMs = Date.now();
          const nowIso = new Date(nowMs).toISOString();
          const oneMinuteAgoIso = new Date(nowMs - 60_000).toISOString();

          const insertResult = await db
            .prepare(
              `INSERT INTO projects (id, owner_id, name, workspace_json, version, created_at, updated_at)
               SELECT ?, ?, ?, ?, 1, ?, ?
               WHERE (SELECT COUNT(*) FROM projects WHERE owner_id = ?) < ?
                 AND (SELECT COUNT(*) FROM projects WHERE owner_id = ? AND created_at >= ?) < ?;`,
            )
            .bind(
              projectId,
              session.userId,
              parsedBody.data.name,
              workspaceJson,
              nowIso,
              nowIso,
              session.userId,
              CLOUD_PROJECT_LIMIT,
              session.userId,
              oneMinuteAgoIso,
              CLOUD_CREATE_RATE_LIMIT_PER_MINUTE,
            )
            .run();

          if ((insertResult.meta.changes ?? 0) === 1) {
            const payload: CloudProjectMetadataResponse = {
              project: {
                id: projectId,
                name: parsedBody.data.name,
                version: 1,
                createdAt: nowIso,
                updatedAt: nowIso,
              },
            };
            response = jsonResponse(payload, {
              status: 201,
              headers: {
                Location: `/api/projects/${projectId}`,
              },
            });
          } else {
            const countRow = await db
              .prepare(
                `SELECT COUNT(*) AS total_count FROM projects WHERE owner_id = ?;`,
              )
              .bind(session.userId)
              .first<CountRow>();

            if ((countRow?.total_count ?? 0) >= CLOUD_PROJECT_LIMIT) {
              throw new HttpError(
                409,
                "project_limit_reached",
                `Maximum of ${CLOUD_PROJECT_LIMIT} cloud projects per account reached.`,
                { details: { limit: CLOUD_PROJECT_LIMIT } },
              );
            }

            throw new HttpError(
              429,
              "creation_rate_limited",
              "Too many projects created recently. Please wait a minute and try again.",
              {
                headers: { "Retry-After": "60" },
                details: { limit: CLOUD_CREATE_RATE_LIMIT_PER_MINUTE },
              },
            );
          }
        } else {
          response = methodNotAllowedResponse(
            requestId,
            ["GET", "POST"],
            isHead,
          );
        }
      } else if (pathname.startsWith("/api/projects/")) {
        const rest = pathname.slice("/api/projects/".length);
        if (!rest || rest.includes("/") || !isUuid(rest)) {
          response = errorResponse(requestId, 404, "not_found", "Not found.", {
            isHead,
          });
        } else if (method === "GET") {
          const db = requireCloudConfigured(env);
          const session = await requireSession(
            request,
            env,
            deps.verifySession,
          );

          const row = await db
            .prepare(
              `SELECT id, name, workspace_json, version, created_at, updated_at
               FROM projects
               WHERE id = ? AND owner_id = ?;`,
            )
            .bind(rest, session.userId)
            .first<ProjectDetailRow>();

          if (!row) {
            throw new HttpError(404, "not_found", "Project not found.");
          }

          let workspace: BuilderWorkspaceV1;
          try {
            workspace = canonicalizeCloudWorkspace(
              JSON.parse(row.workspace_json),
            ).workspace;
          } catch {
            throw new HttpError(
              500,
              "internal_error",
              "Stored workspace data is invalid.",
            );
          }

          const payload: CloudProjectDetailResponse = {
            project: {
              ...toProjectMetadata(row),
              workspace,
            },
          };
          response = jsonResponse(payload, { status: 200 });
        } else if (method === "PUT") {
          const db = requireCloudConfigured(env);
          assertSameOrigin(request, env);
          assertJsonContentType(request);
          const session = await requireSession(
            request,
            env,
            deps.verifySession,
          );

          const rawBody = await readBoundedJson(
            request,
            CLOUD_MAX_PROJECT_BODY_BYTES,
          );
          const parsedBody = updateProjectRequestSchema.safeParse(rawBody);
          if (!parsedBody.success) {
            throw new HttpError(
              400,
              "invalid_request",
              formatZodEnvelopeError(parsedBody.error.issues),
            );
          }

          const { json: workspaceJson } = parseAndValidateWorkspace(
            parsedBody.data.workspace,
          );
          const nowIso = new Date().toISOString();

          const updateResult = await db
            .prepare(
              `UPDATE projects
               SET name = ?, workspace_json = ?, version = version + 1, updated_at = ?
               WHERE id = ? AND owner_id = ? AND version = ?
               RETURNING created_at;`,
            )
            .bind(
              parsedBody.data.name,
              workspaceJson,
              nowIso,
              rest,
              session.userId,
              parsedBody.data.expectedVersion,
            )
            .all<UpdateReturningRow>();

          const updatedRow = updateResult.results[0];
          if (updatedRow) {
            const payload: CloudProjectMetadataResponse = {
              project: {
                id: rest,
                name: parsedBody.data.name,
                version: parsedBody.data.expectedVersion + 1,
                createdAt: updatedRow.created_at,
                updatedAt: nowIso,
              },
            };
            response = jsonResponse(payload, { status: 200 });
          } else {
            const existing = await db
              .prepare(
                `SELECT version, updated_at
                 FROM projects
                 WHERE id = ? AND owner_id = ?;`,
              )
              .bind(rest, session.userId)
              .first<ProjectConflictRow>();

            if (!existing) {
              throw new HttpError(404, "not_found", "Project not found.");
            }

            throw new HttpError(
              409,
              "version_conflict",
              "Project has been modified elsewhere.",
              {
                details: {
                  currentVersion: existing.version,
                  updatedAt: existing.updated_at,
                },
              },
            );
          }
        } else {
          response = methodNotAllowedResponse(
            requestId,
            ["GET", "PUT"],
            isHead,
          );
        }
      } else if (pathname.startsWith("/api/auth/")) {
        response = await handleAuthRoute(
          request,
          env,
          pathname,
          requestId,
          deps.authHandler,
        );
      } else {
        response = errorResponse(requestId, 404, "not_found", "Not found.", {
          isHead,
        });
      }
    } catch (err) {
      if (err instanceof HttpError) {
        response = errorResponse(requestId, err.status, err.code, err.message, {
          headers: err.headers,
          details: err.details,
          isHead,
        });
      } else {
        console.error(
          JSON.stringify({
            requestId,
            method,
            path: pathname,
            status: 500,
            durationMs: Date.now() - startedAt,
            error: "Unexpected internal error",
          }),
        );
        response = errorResponse(
          requestId,
          500,
          "internal_error",
          "An unexpected error occurred.",
          { isHead },
        );
      }
    }

    return response;
  };
}
