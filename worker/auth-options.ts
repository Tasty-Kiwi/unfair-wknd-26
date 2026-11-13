import type { BetterAuthOptions } from "better-auth";
import { validateAuthBaseURL } from "./auth-url";

export type AuthProviderCredentials = {
  githubClientId: string;
  githubClientSecret: string;
};

// Shared by the runtime and the offline schema generator. No credential fallbacks.
export function authOptions(
  baseURL: string,
  secret: string,
  credentials?: AuthProviderCredentials,
): BetterAuthOptions {
  const origin = validateAuthBaseURL(baseURL);
  const isHttps = new URL(origin).protocol === "https:";
  const errorURL = `${origin}/?builder=1&authError=1`;

  return {
    appName: "DominoOS",
    baseURL: origin,
    secret,
    trustedOrigins: [origin],
    emailAndPassword: {
      enabled: false,
    },
    ...(credentials
      ? {
          socialProviders: {
            github: {
              clientId: credentials.githubClientId,
              clientSecret: credentials.githubClientSecret,
            },
          },
        }
      : {}),
    session: {
      expiresIn: 86_400,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    account: {
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: false,
        disableImplicitLinking: true,
        trustedProviders: [],
      },
    },
    user: { changeEmail: { enabled: false }, deleteUser: { enabled: false } },
    onAPIError: {
      errorURL,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/social": { window: 60, max: 10 },
        "/callback/github": { window: 60, max: 20 },
      },
    },
    advanced: {
      useSecureCookies: isHttps,
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
      crossSubDomainCookies: { enabled: false },
    },
    logger: { disabled: true },
    telemetry: { enabled: false },
  };
}
