// Test-only entry: exercises the real auth module inside workerd with fake GitHub.
// This file is never a deployed Worker entry point.
import { createAuth } from "../../worker/auth";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const auth = createAuth(env, {
      fetcher: async (input, init) => {
        // Construct with workerd's Request, not Node's: unsupported redirect modes
        // throw here even though no provider network request is made.
        const outgoing = new Request(input, init);
        if (request.headers.has("X-Test-Provider-Redirect")) {
          return new Response(null, {
            status: 302,
            headers: { Location: "https://untrusted.example/collect" },
          });
        }
        return Response.json(
          outgoing.url === "https://github.com/login/oauth/access_token"
            ? { access_token: "test-only-token" }
            : { id: 12345, login: "runtime-test", name: "Runtime test" },
        );
      },
    });
    return auth.handler(request);
  },
} satisfies ExportedHandler<Env>;
