import { describe, expect, it } from "vitest";
import { validateAuthBaseURL } from "../worker/auth-url";
import { createAuth } from "../worker/auth";
import { createCloudTestHarness } from "./helpers";

describe("auth origin configuration", () => {
  it("canonicalizes HTTPS origins and explicit HTTP loopback", () => {
    expect(validateAuthBaseURL("https://preview.example.net:8443/")).toBe(
      "https://preview.example.net:8443",
    );
    expect(validateAuthBaseURL("http://localhost:8787/")).toBe(
      "http://localhost:8787",
    );
    expect(validateAuthBaseURL("http://127.0.0.1:8787/")).toBe(
      "http://127.0.0.1:8787",
    );
    expect(validateAuthBaseURL("http://[::1]:8787/")).toBe("http://[::1]:8787");
  });
  it.each([
    "http://example.com",
    "ftp://localhost",
    "https://u:p@example.com",
    "https://example.com/path",
    "https://example.com?x=1",
    "https://example.com#frag",
    "not a URL",
  ])("rejects unsafe or malformed origin %s", (value) => {
    expect(() => validateAuthBaseURL(value)).toThrow();
  });
  it("exposes the custom handler and session API with canonical env settings", async () => {
    const { server, worker } = createCloudTestHarness();
    await server.listen();
    try {
      await worker.applyD1Migrations("DB");
      const env = await worker.getEnv();
      expect(createAuth(env)).toMatchObject({
        handler: expect.any(Function),
        getSession: expect.any(Function),
      });
    } finally {
      await server.close();
    }
  });
});
