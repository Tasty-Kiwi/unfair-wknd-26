import { validateAuthBaseURL } from "./auth-url";
import { readBoundedJson, type CloudApiEnv } from "./http";

export type AuthEnv = CloudApiEnv & {
  AUTH_URL?: string;
};

export type CreateAuthOptions = {
  fetcher?: typeof fetch;
};

export type AuthSessionUser = {
  userId: string;
  name: string;
};

export type AuthClient = {
  handler: (request: Request) => Promise<Response>;
  getSession: (request: Request) => Promise<AuthSessionUser | null>;
};

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

const AUTH_SIGN_IN_PATH = "/api/auth/sign-in/social";
const AUTH_CALLBACK_PATH = "/api/auth/callback/github";
const AUTH_SIGN_OUT_PATH = "/api/auth/sign-out";
const AUTH_GET_SESSION_PATH = "/api/auth/get-session";

const AUTH_SUCCESS_REDIRECT_PATH = "/?builder=1";
const AUTH_ERROR_REDIRECT_PATH = "/?builder=1&authError=1";

const OAUTH_ATTEMPT_TTL_MS = 10 * 60 * 1000;
const OAUTH_ATTEMPT_MAX_AGE_SECONDS = 600;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_MAX_AGE_SECONDS = 86_400;

const RATE_LIMIT_WINDOW_MS = 60_000;
const START_RATE_LIMIT_PER_MINUTE = 10;
const CALLBACK_RATE_LIMIT_PER_MINUTE = 20;

const GITHUB_FETCH_TIMEOUT_MS = 10_000;
const MAX_GITHUB_RESPONSE_BYTES = 64 * 1024;
const MAX_CALLBACK_URL_LENGTH = 4096;
const MAX_OAUTH_CODE_LENGTH = 512;
const MAX_DISPLAY_NAME_LENGTH = 120;

const OPAQUE_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const utf8Encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function generateOpaqueToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    utf8Encoder.encode(value),
  );
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

async function computePkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    utf8Encoder.encode(verifier),
  );
  return toBase64Url(new Uint8Array(digest));
}

function readOpaqueCookie(request: Request, cookieName: string): string | null {
  const rawHeader = request.headers.get("Cookie");
  if (!rawHeader) return null;

  const parts = rawHeader.split(";");
  let found: string | null = null;

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length === 0) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const name = trimmed.slice(0, eqIdx).trim();
    if (name !== cookieName) continue;

    if (found !== null) {
      return null;
    }

    const value = trimmed.slice(eqIdx + 1).trim();
    if (!OPAQUE_TOKEN_RE.test(value)) {
      return null;
    }
    found = value;
  }

  return found;
}

function formatCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
  isHttps: boolean,
): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isHttps) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function authJsonResponse(
  payload: unknown,
  status = 200,
  headers?: Headers,
): Response {
  const outHeaders = new Headers(headers);
  outHeaders.set("Content-Type", "application/json; charset=utf-8");
  outHeaders.set("Cache-Control", "private, no-store");
  return new Response(JSON.stringify(payload), { status, headers: outHeaders });
}

function redirectResponse(location: string, headers?: Headers): Response {
  const outHeaders = new Headers(headers);
  outHeaders.set("Location", location);
  outHeaders.set("Cache-Control", "private, no-store");
  return new Response(null, { status: 302, headers: outHeaders });
}

function getTrustedClientIp(request: Request): string {
  const ip = request.headers.get("CF-Connecting-IP")?.trim();
  return ip && ip.length > 0 ? ip : "unknown";
}

async function consumeRateLimit(
  db: D1Database,
  key: string,
  limit: number,
  now: number,
): Promise<{
  allowed: boolean;
  retryAfterSeconds: number;
  windowIndex: number;
}> {
  const windowIndex = Math.floor(now / RATE_LIMIT_WINDOW_MS);
  const row = await db
    .prepare(
      `INSERT INTO oauth_limits (key, window, count)
       VALUES (?, ?, 1)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE
           WHEN oauth_limits.window = excluded.window THEN oauth_limits.count + 1
           ELSE 1
         END,
         window = excluded.window
       RETURNING count;`,
    )
    .bind(key, windowIndex)
    .first<{ count: number }>();

  const count = row?.count ?? 1;
  const windowEndMs = (windowIndex + 1) * RATE_LIMIT_WINDOW_MS;
  const retryAfterSeconds = Math.max(1, Math.ceil((windowEndMs - now) / 1000));

  return {
    allowed: count <= limit,
    retryAfterSeconds,
    windowIndex,
  };
}

async function pruneExpiredAuthRows(
  db: D1Database,
  now: number,
  currentWindowIndex: number,
): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM oauth_attempts WHERE expires_at <= ?;").bind(now),
    db.prepare("DELETE FROM cloud_sessions WHERE expires_at <= ?;").bind(now),
    db
      .prepare("DELETE FROM oauth_limits WHERE window < ?;")
      .bind(currentWindowIndex),
  ]);
}

async function readBoundedResponseJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    throw new Error("Upstream HTTP error");
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    await response.body?.cancel().catch(() => {});
    throw new Error("Unexpected upstream Content-Type");
  }

  // Fetch may decompress upstream bytes while retaining encoding/length headers.
  // Bound the actual decoded stream, without applying upload-encoding rules.
  return readBoundedJson(
    { body: response.body, headers: new Headers() },
    MAX_GITHUB_RESPONSE_BYTES,
  );
}

async function fetchGitHubJson(
  fetcher: typeof fetch,
  url: string,
  init: RequestInit,
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, GITHUB_FETCH_TIMEOUT_MS);

  try {
    const response = await fetcher(url, {
      ...init,
      redirect: "error",
      signal: controller.signal,
    });
    return await readBoundedResponseJson(response);
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseGitHubProfile(raw: unknown): {
  githubId: string;
  name: string;
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid GitHub profile payload");
  }

  const record = raw as Record<string, unknown>;
  const id = record.id;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Invalid GitHub user ID");
  }

  const rawLogin = record.login;
  const rawName = record.name;

  if (typeof rawLogin !== "string" || rawLogin.trim().length === 0) {
    throw new Error("Invalid GitHub login");
  }

  const normalizedName =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName.trim()
      : typeof rawLogin === "string" && rawLogin.trim().length > 0
        ? rawLogin.trim()
        : null;

  if (!normalizedName) {
    throw new Error("Missing GitHub display name and login");
  }

  return {
    githubId: String(id),
    name: normalizedName.slice(0, MAX_DISPLAY_NAME_LENGTH),
  };
}

export function createAuth(
  env: AuthEnv,
  options?: CreateAuthOptions,
): AuthClient {
  const db = env.DB;
  const baseURL = env.AUTH_URL;
  const rawClientId = env.GITHUB_CLIENT_ID;
  const rawClientSecret = env.GITHUB_CLIENT_SECRET;

  if (!db) {
    throw new Error("DB binding is required for authentication");
  }
  if (typeof baseURL !== "string") {
    throw new Error("AUTH_URL is required");
  }
  const canonicalBaseURL = validateAuthBaseURL(baseURL);

  if (typeof rawClientId !== "string" || rawClientId.trim().length === 0) {
    throw new Error("GITHUB_CLIENT_ID is required for GitHub authentication");
  }
  if (
    typeof rawClientSecret !== "string" ||
    rawClientSecret.trim().length === 0
  ) {
    throw new Error(
      "GITHUB_CLIENT_SECRET is required for GitHub authentication",
    );
  }

  const githubClientId = rawClientId.trim();
  const githubClientSecret = rawClientSecret.trim();
  const fetcher: typeof fetch =
    options?.fetcher ??
    ((input: RequestInfo | URL, init?: RequestInit) =>
      globalThis.fetch(input, init));

  const isHttps = canonicalBaseURL.startsWith("https://");
  const sessionCookieName = isHttps
    ? "__Host-domino_session"
    : "domino_session";
  const oauthCookieName = isHttps ? "__Host-domino_oauth" : "domino_oauth";
  const callbackURL = `${canonicalBaseURL}${AUTH_CALLBACK_PATH}`;

  async function getSession(request: Request): Promise<AuthSessionUser | null> {
    const token = readOpaqueCookie(request, sessionCookieName);
    if (!token) return null;

    const tokenHash = await sha256Hex(token);
    const now = Date.now();

    const row = await db!
      .prepare(
        `SELECT gi.user_id, gi.name
         FROM cloud_sessions cs
         INNER JOIN github_identities gi ON gi.user_id = cs.user_id
         WHERE cs.token_hash = ? AND cs.expires_at > ?;`,
      )
      .bind(tokenHash, now)
      .first<{ user_id: string; name: string }>();

    if (!row || typeof row.user_id !== "string" || row.user_id.length === 0) {
      return null;
    }

    const name =
      typeof row.name === "string" && row.name.trim().length > 0
        ? row.name.trim()
        : "DominoOS user";

    return { userId: row.user_id, name };
  }

  async function handleSignIn(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return authJsonResponse(
        { error: "Method not allowed" },
        405,
        new Headers({ Allow: "POST" }),
      );
    }

    const now = Date.now();
    const clientIp = getTrustedClientIp(request);
    const rate = await consumeRateLimit(
      db!,
      `start:${clientIp}`,
      START_RATE_LIMIT_PER_MINUTE,
      now,
    );

    if (!rate.allowed) {
      return authJsonResponse(
        { error: "Too many sign-in attempts" },
        429,
        new Headers({ "Retry-After": String(rate.retryAfterSeconds) }),
      );
    }

    const state = generateOpaqueToken();
    const browserNonce = generateOpaqueToken();
    const codeVerifier = generateOpaqueToken();

    const [stateHash, browserHash, codeChallenge] = await Promise.all([
      sha256Hex(state),
      sha256Hex(browserNonce),
      computePkceChallenge(codeVerifier),
    ]);

    const expiresAt = now + OAUTH_ATTEMPT_TTL_MS;

    await db!
      .prepare(
        `INSERT INTO oauth_attempts (state_hash, browser_hash, code_verifier, expires_at)
         VALUES (?, ?, ?, ?);`,
      )
      .bind(stateHash, browserHash, codeVerifier, expiresAt)
      .run();

    await pruneExpiredAuthRows(db!, now, rate.windowIndex).catch(() => {});

    const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("client_id", githubClientId);
    authorizeUrl.searchParams.set("redirect_uri", callbackURL);
    authorizeUrl.searchParams.set("scope", "read:user");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("code_challenge", codeChallenge);
    authorizeUrl.searchParams.set("code_challenge_method", "S256");

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      formatCookie(
        oauthCookieName,
        browserNonce,
        OAUTH_ATTEMPT_MAX_AGE_SECONDS,
        isHttps,
      ),
    );

    return authJsonResponse(
      { url: authorizeUrl.toString(), redirect: true },
      200,
      headers,
    );
  }

  async function handleCallback(request: Request): Promise<Response> {
    if (request.method !== "GET") {
      return authJsonResponse(
        { error: "Method not allowed" },
        405,
        new Headers({ Allow: "GET" }),
      );
    }

    const now = Date.now();
    const clientIp = getTrustedClientIp(request);
    const rate = await consumeRateLimit(
      db!,
      `callback:${clientIp}`,
      CALLBACK_RATE_LIMIT_PER_MINUTE,
      now,
    );

    if (!rate.allowed) {
      return authJsonResponse(
        { error: "Too many callback attempts" },
        429,
        new Headers({ "Retry-After": String(rate.retryAfterSeconds) }),
      );
    }

    const clearOauthHeaders = new Headers();
    clearOauthHeaders.append(
      "Set-Cookie",
      formatCookie(oauthCookieName, "", 0, isHttps),
    );

    if (request.url.length > MAX_CALLBACK_URL_LENGTH) {
      return redirectResponse(AUTH_ERROR_REDIRECT_PATH, clearOauthHeaders);
    }

    let url: URL;
    try {
      url = new URL(request.url);
    } catch {
      return redirectResponse(AUTH_ERROR_REDIRECT_PATH, clearOauthHeaders);
    }

    if (url.searchParams.has("error")) {
      return redirectResponse(AUTH_ERROR_REDIRECT_PATH, clearOauthHeaders);
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const browserNonce = readOpaqueCookie(request, oauthCookieName);

    if (
      !code ||
      url.searchParams.getAll("code").length !== 1 ||
      url.searchParams.getAll("state").length !== 1 ||
      code.length === 0 ||
      code.length > MAX_OAUTH_CODE_LENGTH ||
      /[\s\x00-\x1f\x7f]/.test(code) ||
      !state ||
      !OPAQUE_TOKEN_RE.test(state) ||
      !browserNonce
    ) {
      return redirectResponse(AUTH_ERROR_REDIRECT_PATH, clearOauthHeaders);
    }

    const [stateHash, browserHash] = await Promise.all([
      sha256Hex(state),
      sha256Hex(browserNonce),
    ]);

    const attempt = await db!
      .prepare(
        `DELETE FROM oauth_attempts
         WHERE state_hash = ? AND browser_hash = ? AND expires_at > ?
         RETURNING code_verifier;`,
      )
      .bind(stateHash, browserHash, now)
      .first<{ code_verifier: string }>();

    await pruneExpiredAuthRows(db!, now, rate.windowIndex).catch(() => {});

    if (
      !attempt ||
      typeof attempt.code_verifier !== "string" ||
      !OPAQUE_TOKEN_RE.test(attempt.code_verifier)
    ) {
      return redirectResponse(AUTH_ERROR_REDIRECT_PATH, clearOauthHeaders);
    }

    try {
      const tokenBody = new URLSearchParams({
        client_id: githubClientId,
        client_secret: githubClientSecret,
        code,
        redirect_uri: callbackURL,
        code_verifier: attempt.code_verifier,
      });

      const tokenPayload = await fetchGitHubJson(fetcher, GITHUB_TOKEN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "domino-os",
        },
        body: tokenBody.toString(),
      });

      if (
        !tokenPayload ||
        typeof tokenPayload !== "object" ||
        Array.isArray(tokenPayload)
      ) {
        throw new Error("Invalid token payload");
      }

      const tokenRecord = tokenPayload as Record<string, unknown>;
      const accessToken = tokenRecord.access_token;
      if (
        typeof accessToken !== "string" ||
        accessToken.trim().length === 0 ||
        typeof tokenRecord.error === "string"
      ) {
        throw new Error("Missing GitHub access token");
      }

      const profilePayload = await fetchGitHubJson(fetcher, GITHUB_USER_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "domino-os",
        },
      });

      const profile = parseGitHubProfile(profilePayload);
      const candidateUserId = crypto.randomUUID();

      const identity = await db!
        .prepare(
          `INSERT INTO github_identities (github_id, user_id, name)
           VALUES (?, ?, ?)
           ON CONFLICT(github_id) DO UPDATE SET
             name = excluded.name
           RETURNING user_id;`,
        )
        .bind(profile.githubId, candidateUserId, profile.name)
        .first<{ user_id: string }>();

      if (!identity || typeof identity.user_id !== "string") {
        throw new Error("Failed to persist GitHub identity");
      }

      const sessionToken = generateOpaqueToken();
      const sessionTokenHash = await sha256Hex(sessionToken);
      const sessionExpiresAt = now + SESSION_TTL_MS;

      await db!
        .prepare(
          `INSERT INTO cloud_sessions (token_hash, user_id, expires_at)
           VALUES (?, ?, ?);`,
        )
        .bind(sessionTokenHash, identity.user_id, sessionExpiresAt)
        .run();

      const headers = new Headers();
      headers.append(
        "Set-Cookie",
        formatCookie(
          sessionCookieName,
          sessionToken,
          SESSION_MAX_AGE_SECONDS,
          isHttps,
        ),
      );
      headers.append(
        "Set-Cookie",
        formatCookie(oauthCookieName, "", 0, isHttps),
      );

      return redirectResponse(AUTH_SUCCESS_REDIRECT_PATH, headers);
    } catch {
      return redirectResponse(AUTH_ERROR_REDIRECT_PATH, clearOauthHeaders);
    }
  }

  async function handleSignOut(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return authJsonResponse(
        { error: "Method not allowed" },
        405,
        new Headers({ Allow: "POST" }),
      );
    }

    const token = readOpaqueCookie(request, sessionCookieName);
    if (token) {
      const tokenHash = await sha256Hex(token);
      await db!
        .prepare("DELETE FROM cloud_sessions WHERE token_hash = ?;")
        .bind(tokenHash)
        .run();
    }

    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      formatCookie(sessionCookieName, "", 0, isHttps),
    );
    headers.append("Set-Cookie", formatCookie(oauthCookieName, "", 0, isHttps));

    return authJsonResponse({ success: true }, 200, headers);
  }

  async function handleGetSession(request: Request): Promise<Response> {
    if (request.method !== "GET") {
      return authJsonResponse(
        { error: "Method not allowed" },
        405,
        new Headers({ Allow: "GET" }),
      );
    }

    const session = await getSession(request);
    if (!session) {
      return authJsonResponse(null, 200);
    }

    return authJsonResponse(
      {
        user: {
          id: session.userId,
          name: session.name,
        },
      },
      200,
    );
  }

  async function handler(request: Request): Promise<Response> {
    if (
      request.method === "POST" &&
      request.headers.get("Origin") !== canonicalBaseURL
    ) {
      return authJsonResponse({ error: { code: "origin_rejected" } }, 403);
    }
    const pathname = new URL(request.url).pathname;

    switch (pathname) {
      case AUTH_SIGN_IN_PATH:
        return handleSignIn(request);
      case AUTH_CALLBACK_PATH:
        return handleCallback(request);
      case AUTH_SIGN_OUT_PATH:
        return handleSignOut(request);
      case AUTH_GET_SESSION_PATH:
        return handleGetSession(request);
      default:
        return authJsonResponse({ error: "Not found" }, 404);
    }
  }

  return {
    handler,
    getSession,
  };
}
