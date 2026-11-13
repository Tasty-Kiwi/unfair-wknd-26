import { env as globalEnv } from "cloudflare:workers";
import { createAuth } from "./auth";
import { isCloudConfigured, type CloudApiEnv } from "./http";
import { createApiHandler, type SessionUser } from "./projects";

// Initialize SDK configuration during startup, outside the request CPU budget.
// Better Auth 1.7.22 initialization performs no D1/network I/O. Session lookup
// stays inside each request; this warms only the configuration/client cache.
if (isCloudConfigured(globalEnv)) {
  try {
    await createAuth(globalEnv).$context;
  } catch {
    // An auth initialization failure must not take down the public demo.
    // Protected routes still use the real verifier and fail closed.
    console.error("Authentication initialization failed");
  }
}

async function verifyBetterAuthSession(
  request: Request,
  env: CloudApiEnv,
): Promise<SessionUser | null> {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });

  const userId = session?.user?.id;
  if (typeof userId !== "string" || userId.length === 0) {
    return null;
  }

  const rawName = session?.user?.name;
  const name =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName.trim()
      : "DominoOS user";

  return { userId, name };
}

async function handleBetterAuthRequest(
  request: Request,
  env: CloudApiEnv,
): Promise<Response> {
  const auth = createAuth(env);
  return auth.handler(request);
}

const handleApiRequest = createApiHandler({
  verifySession: verifyBetterAuthSession,
  authHandler: handleBetterAuthRequest,
});

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
