import { betterAuth, type BetterAuthOptions } from "better-auth";
import { authOptions } from "./auth-options";
import type { CloudApiEnv } from "./http";

// Cache only the SDK client/configuration, never identities or session results.
// Better Auth 1.7.22 supports a shared D1 client across request contexts.
const clients = new WeakMap<
  D1Database,
  {
    baseURL: string;
    secret: string;
    githubClientId: string;
    githubClientSecret: string;
    client: ReturnType<
      typeof betterAuth<BetterAuthOptions & { database: D1Database }>
    >;
  }
>();

export function createAuth(env: CloudApiEnv) {
  const db = env.DB;
  const baseURL = env.BETTER_AUTH_URL;
  const secret = env.BETTER_AUTH_SECRET;
  const githubClientId = env.GITHUB_CLIENT_ID;
  const githubClientSecret = env.GITHUB_CLIENT_SECRET;

  if (!db) throw new Error("DB binding is required for authentication");
  if (typeof baseURL !== "string" || !/^https?:\/\//.test(baseURL)) {
    throw new Error("BETTER_AUTH_URL must be an absolute HTTP(S) URL");
  }
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
  }
  if (
    typeof githubClientId !== "string" ||
    githubClientId.trim().length === 0
  ) {
    throw new Error("GITHUB_CLIENT_ID is required for GitHub authentication");
  }
  if (
    typeof githubClientSecret !== "string" ||
    githubClientSecret.trim().length === 0
  ) {
    throw new Error(
      "GITHUB_CLIENT_SECRET is required for GitHub authentication",
    );
  }

  const cached = clients.get(db);
  if (
    cached &&
    cached.baseURL === baseURL &&
    cached.secret === secret &&
    cached.githubClientId === githubClientId.trim() &&
    cached.githubClientSecret === githubClientSecret.trim()
  ) {
    return cached.client;
  }

  const client = betterAuth({
    ...authOptions(baseURL, secret, {
      githubClientId: githubClientId.trim(),
      githubClientSecret: githubClientSecret.trim(),
    }),
    database: db,
  });
  clients.set(db, {
    baseURL,
    secret,
    githubClientId: githubClientId.trim(),
    githubClientSecret: githubClientSecret.trim(),
    client,
  });
  return client;
}
