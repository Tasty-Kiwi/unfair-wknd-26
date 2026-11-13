import type { CloudApiEnv } from "./http";
import { createApiHandler, type SessionUser } from "./projects";

async function verifyBetterAuthSession(
  request: Request,
  env: CloudApiEnv,
): Promise<SessionUser | null> {
  const { createAuth } = await import("./auth");
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
  const { createAuth } = await import("./auth");
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
