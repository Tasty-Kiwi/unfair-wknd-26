import { createAuth } from "./auth";
import type { CloudApiEnv } from "./http";
import { createApiHandler, type SessionUser } from "./projects";

async function verifySession(
  request: Request,
  env: CloudApiEnv,
): Promise<SessionUser | null> {
  const auth = createAuth(env);
  return auth.getSession(request);
}

async function handleAuthRequest(
  request: Request,
  env: CloudApiEnv,
): Promise<Response> {
  const auth = createAuth(env);
  return auth.handler(request);
}

const handleApiRequest = createApiHandler({
  verifySession,
  authHandler: handleAuthRequest,
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
