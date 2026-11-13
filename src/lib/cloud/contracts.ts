import { z } from "zod";
import { parseWorkspace } from "../builder/schema";
import type { BuilderWorkspaceV1 } from "../builder/types";

export const CLOUD_PROJECT_LIMIT = 20;
export const CLOUD_CREATE_RATE_LIMIT_PER_MINUTE = 5;

export const CLOUD_MAX_WORKSPACE_BYTES = 1_000_000;
export const CLOUD_MAX_PROJECT_BODY_BYTES = 1_050_000;
export const CLOUD_MAX_AUTH_BODY_BYTES = 16_384;

export const CLOUD_PROJECT_NAME_MAX_CHARS = 120;
export const CLOUD_PROJECT_NAME_MAX_BYTES = 480;

export const CLOUD_PROJECTS_LIST_DEFAULT_LIMIT = 50;
export const CLOUD_PROJECTS_LIST_MAX_LIMIT = 50;
export const CLOUD_PROJECTS_LIST_MAX_OFFSET = 10_000;

export type CloudUser = {
  id: string;
  name: string;
};

export type ProjectMetadata = {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type CloudProject = ProjectMetadata & {
  workspace: BuilderWorkspaceV1;
};

export type CloudHealthResponse = {
  ok: true;
  cloudEnabled: boolean;
};

export type CloudMeResponse = {
  user: CloudUser;
};

export type CloudProjectListResponse = {
  projects: ProjectMetadata[];
  nextOffset: number | null;
};

export type CloudProjectMetadataResponse = {
  project: ProjectMetadata;
};

export type CloudProjectDetailResponse = {
  project: CloudProject;
};

export type CloudErrorCode =
  | "invalid_json"
  | "invalid_request"
  | "invalid_workspace"
  | "unauthorized"
  | "origin_rejected"
  | "unsupported_media_type"
  | "unsupported_content_encoding"
  | "not_found"
  | "method_not_allowed"
  | "version_conflict"
  | "project_limit_reached"
  | "payload_too_large"
  | "creation_rate_limited"
  | "rate_limited"
  | "internal_error"
  | "cloud_unavailable";

export type CloudErrorDetail = {
  code: CloudErrorCode | (string & {});
  message: string;
  currentVersion?: number;
  updatedAt?: string;
  maxBytes?: number;
  limit?: number;
};

export type CloudErrorResponse = {
  error: CloudErrorDetail;
  requestId: string;
};

export type CreateProjectRequest = {
  name: string;
  workspace: BuilderWorkspaceV1;
};

export type UpdateProjectRequest = {
  name: string;
  workspace: BuilderWorkspaceV1;
  expectedVersion: number;
};

const utf8Encoder = new TextEncoder();

export function utf8ByteLength(text: string): number {
  return utf8Encoder.encode(text).length;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export const projectNameSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length >= 1, "Project name must not be blank.")
  .refine(
    (value) => value.length <= CLOUD_PROJECT_NAME_MAX_CHARS,
    `Project name must be at most ${CLOUD_PROJECT_NAME_MAX_CHARS} characters.`,
  )
  .refine(
    (value) => utf8ByteLength(value) <= CLOUD_PROJECT_NAME_MAX_BYTES,
    `Project name must be at most ${CLOUD_PROJECT_NAME_MAX_BYTES} UTF-8 bytes.`,
  );

export const expectedVersionSchema = z
  .number()
  .int("expectedVersion must be an integer.")
  .min(1, "expectedVersion must be at least 1.")
  .refine(
    (value) => Number.isSafeInteger(value),
    "expectedVersion must be a positive safe integer.",
  );

export const createProjectRequestSchema = z.strictObject({
  name: projectNameSchema,
  workspace: z.unknown(),
});

export const updateProjectRequestSchema = z.strictObject({
  name: projectNameSchema,
  workspace: z.unknown(),
  expectedVersion: expectedVersionSchema,
});

export type CanonicalWorkspaceResult = {
  workspace: BuilderWorkspaceV1;
  json: string;
  bytes: number;
};

export function canonicalizeCloudWorkspace(
  input: unknown,
): CanonicalWorkspaceResult {
  const workspace = parseWorkspace(input);
  const json = JSON.stringify(workspace);
  const bytes = utf8ByteLength(json);
  return { workspace, json, bytes };
}

export type ListProjectsQuery = {
  limit: number;
  offset: number;
};

function parseBoundedIntParam(
  raw: string | null,
  name: string,
  defaultValue: number,
  min: number,
  max: number,
): number {
  if (raw === null) return defaultValue;
  if (!/^\d+$/.test(raw)) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

export function parseListProjectsQuery(url: URL): ListProjectsQuery {
  const limit = parseBoundedIntParam(
    url.searchParams.get("limit"),
    "limit",
    CLOUD_PROJECTS_LIST_DEFAULT_LIMIT,
    1,
    CLOUD_PROJECTS_LIST_MAX_LIMIT,
  );
  const offset = parseBoundedIntParam(
    url.searchParams.get("offset"),
    "offset",
    0,
    0,
    CLOUD_PROJECTS_LIST_MAX_OFFSET,
  );
  return { limit, offset };
}
