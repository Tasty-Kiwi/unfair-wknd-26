import { describe, expect, it } from "vitest";
import { authOptions } from "../worker/auth-options";
import { validateAuthBaseURL } from "../worker/auth-url";

describe("auth origin configuration", () => {
  it("canonicalizes HTTPS origins on arbitrary hosts", () => {
    expect(validateAuthBaseURL("https://preview.example.net:8443/")).toBe(
      "https://preview.example.net:8443",
    );
    expect(validateAuthBaseURL("http://localhost:8787/")).toBe(
      "http://localhost:8787",
    );
    expect(validateAuthBaseURL("http://[::1]:8787")).toBe("http://[::1]:8787");
  });

  it.each([
    "http://example.com",
    "ftp://localhost",
    "https://user:pass@example.com",
    "https://example.com/path",
    "https://example.com?x=1",
    "https://example.com#frag",
    "not a URL",
  ])("rejects unsafe or malformed origin %s", (value) => {
    expect(() => validateAuthBaseURL(value)).toThrow();
  });

  it("keeps GitHub-only, non-linking session and cookie policy", () => {
    const options = authOptions("https://custom.example/", "x".repeat(32), {
      githubClientId: "id",
      githubClientSecret: "secret",
    });
    expect(options.baseURL).toBe("https://custom.example");
    expect(options.socialProviders).toHaveProperty("github");
    expect(options.emailAndPassword).toMatchObject({ enabled: false });
    expect(options.account?.accountLinking).toMatchObject({
      enabled: false,
      disableImplicitLinking: true,
    });
    expect(options.session).toMatchObject({
      expiresIn: 86400,
      disableSessionRefresh: true,
    });
    expect(options.advanced?.useSecureCookies).toBe(true);
    expect(
      authOptions("http://localhost:8787", "x".repeat(32)).advanced
        ?.useSecureCookies,
    ).toBe(false);
  });
});
