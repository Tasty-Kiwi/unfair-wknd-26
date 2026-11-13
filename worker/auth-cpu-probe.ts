/// <reference path="../auth-probe-configuration.d.ts" />
import { timingSafeEqual } from "node:crypto";
import { hashPassword, verifyPassword } from "better-auth/crypto";

const password = "DominoOS synthetic benchmark password";
// Public synthetic fixture, never a real credential.
const fixture = "6fdee6e83c958c913f990a7c5f81a458:6979183785c3983209159d983b00e2020df175f0ca62e862e93d7164966e3758806e5a0e2307e8eef7007de8845b28614d2b0dca149488fbcef8a036d177e11e";
const encoder = new TextEncoder();

export default {
  async fetch(request: Request, env: AuthProbeEnv): Promise<Response> {
    const response = (body: unknown, status = 200) => Response.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
    const provided = encoder.encode(request.headers.get("Authorization") ?? "");
    const expected = encoder.encode("Bearer " + (env.AUTH_PROBE_SECRET ?? ""));
    if (!env.AUTH_PROBE_SECRET || provided.length !== expected.length ||
        !timingSafeEqual(provided, expected)) return response({ error: "unauthorized" }, 401);
    if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
    const operation = new URL(request.url).pathname.slice(1);
    if (!["hash", "valid", "invalid"].includes(operation)) return response({ error: "not_found" }, 404);
    const started = performance.now();
    if (operation === "hash") await hashPassword(password);
    else {
      const matches = await verifyPassword({
        hash: fixture,
        password: operation === "valid" ? password : "An incorrect synthetic password",
      });
      if (matches !== (operation === "valid")) return response({ error: "verification_failed" }, 500);
    }
    // This is wall time. Actual CPU must be read from deployed invocation telemetry.
    console.log(JSON.stringify({ operation, completed: true }));
    return response({ ok: true, operation, wallTimeMs: performance.now() - started });
  },
} satisfies ExportedHandler<AuthProbeEnv>;
