import type {
  CloudErrorCode,
  CloudErrorDetail,
  CloudErrorResponse,
} from "../src/lib/cloud/contracts";

// Bindings may be absent while cloud features are disabled in deployment.
export type CloudApiEnv = Partial<Env>;

export class HttpError extends Error {
  readonly status: number;
  readonly code: CloudErrorCode | (string & {});
  readonly headers?: HeadersInit;
  readonly details?: Omit<CloudErrorDetail, "code" | "message">;

  constructor(
    status: number,
    code: CloudErrorCode | (string & {}),
    message: string,
    options?: {
      headers?: HeadersInit;
      details?: Omit<CloudErrorDetail, "code" | "message">;
    },
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.headers = options?.headers;
    this.details = options?.details;
  }
}

export function isCloudConfigured(env: CloudApiEnv): boolean {
  const enabled = env.CLOUD_ENABLED?.trim().toLowerCase() === "true";

  if (!enabled || !env.DB) {
    return false;
  }

  if (
    typeof env.BETTER_AUTH_SECRET !== "string" ||
    env.BETTER_AUTH_SECRET.length < 32
  ) {
    return false;
  }

  if (
    typeof env.BETTER_AUTH_URL !== "string" ||
    env.BETTER_AUTH_URL.trim().length === 0
  ) {
    return false;
  }

  if (
    typeof env.GITHUB_CLIENT_ID !== "string" ||
    env.GITHUB_CLIENT_ID.trim().length === 0
  ) {
    return false;
  }

  if (
    typeof env.GITHUB_CLIENT_SECRET !== "string" ||
    env.GITHUB_CLIENT_SECRET.trim().length === 0
  ) {
    return false;
  }

  try {
    const url = new URL(env.BETTER_AUTH_URL);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function jsonResponse(
  payload: unknown,
  options?: {
    status?: number;
    headers?: HeadersInit;
    isHead?: boolean;
  },
): Response {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "private, no-store");

  if (options?.isHead) {
    return new Response(null, {
      status: options.status ?? 200,
      headers,
    });
  }

  return new Response(JSON.stringify(payload), {
    status: options?.status ?? 200,
    headers,
  });
}

export function errorResponse(
  requestId: string,
  status: number,
  code: CloudErrorCode | (string & {}),
  message: string,
  options?: {
    headers?: HeadersInit;
    details?: Omit<CloudErrorDetail, "code" | "message">;
    isHead?: boolean;
  },
): Response {
  const body: CloudErrorResponse = {
    error: {
      code,
      message,
      ...options?.details,
    },
    requestId,
  };
  return jsonResponse(body, {
    status,
    headers: options?.headers,
    isHead: options?.isHead,
  });
}

export function methodNotAllowedResponse(
  requestId: string,
  allowedMethods: readonly string[],
  isHead = false,
): Response {
  return errorResponse(
    requestId,
    405,
    "method_not_allowed",
    `Method not allowed. Allowed: ${allowedMethods.join(", ")}.`,
    {
      headers: { Allow: allowedMethods.join(", ") },
      isHead,
    },
  );
}

export function withPrivateNoStoreHeaders(
  response: Response,
  isHead = false,
): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  return new Response(isHead ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function assertSameOrigin(request: Request, env: CloudApiEnv): void {
  const originHeader = request.headers.get("Origin");
  if (!originHeader || originHeader === "null") {
    throw new HttpError(403, "origin_rejected", "Origin header is required.");
  }

  let parsedOrigin: URL;
  let expectedOrigin: URL;
  try {
    parsedOrigin = new URL(originHeader);
    expectedOrigin = new URL(env.BETTER_AUTH_URL ?? "");
  } catch {
    throw new HttpError(403, "origin_rejected", "Invalid request origin.");
  }

  if (
    originHeader !== parsedOrigin.origin ||
    parsedOrigin.origin !== expectedOrigin.origin
  ) {
    throw new HttpError(
      403,
      "origin_rejected",
      "Cross-origin request rejected.",
    );
  }
}

export function assertSupportedContentEncoding(request: Request): void {
  const encoding = request.headers.get("Content-Encoding");
  if (!encoding) return;
  const normalized = encoding.trim().toLowerCase();
  if (normalized !== "" && normalized !== "identity") {
    throw new HttpError(
      415,
      "unsupported_content_encoding",
      "Unsupported Content-Encoding.",
    );
  }
}

export function assertJsonContentType(request: Request): void {
  const contentType = request.headers.get("Content-Type");
  if (!contentType) {
    throw new HttpError(
      415,
      "unsupported_media_type",
      "Content-Type must be application/json.",
    );
  }
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (mediaType !== "application/json") {
    throw new HttpError(
      415,
      "unsupported_media_type",
      "Content-Type must be application/json.",
    );
  }
}

export async function readBoundedBody(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer>> {
  assertSupportedContentEncoding(request);

  const contentLengthHeader = request.headers.get("Content-Length");
  if (contentLengthHeader !== null) {
    const trimmed = contentLengthHeader.trim();
    if (/^\d+$/.test(trimmed)) {
      const declaredLength = Number(trimmed);
      if (Number.isSafeInteger(declaredLength) && declaredLength > maxBytes) {
        await request.body?.cancel().catch(() => {});
        throw new HttpError(
          413,
          "payload_too_large",
          `Request body exceeds ${maxBytes} bytes.`,
          { details: { maxBytes } },
        );
      }
    }
  }

  if (!request.body) {
    return new Uint8Array(0);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new HttpError(
          413,
          "payload_too_large",
          `Request body exceeds ${maxBytes} bytes.`,
          { details: { maxBytes } },
        );
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof HttpError) {
      throw err;
    }
    throw new HttpError(400, "invalid_request", "Failed to read request body.");
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

const utf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });

export async function readBoundedJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const bytes = await readBoundedBody(request, maxBytes);
  if (bytes.byteLength === 0) {
    throw new HttpError(
      400,
      "invalid_json",
      "Request body must be valid JSON.",
    );
  }

  let text: string;
  try {
    text = utf8Decoder.decode(bytes);
  } catch {
    throw new HttpError(
      400,
      "invalid_json",
      "Request body must be valid UTF-8 JSON.",
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json", "Malformed JSON request body.");
  }
}
