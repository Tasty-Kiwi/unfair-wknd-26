/** Validate the OAuth application's public origin and return its canonical origin. */
export function validateAuthBaseURL(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "AUTH_URL must be an absolute HTTPS URL (or HTTP on loopback)",
    );
  }

  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(
    url.hostname.toLowerCase(),
  );
  if (
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== "" ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new Error(
      "AUTH_URL must be an HTTPS origin (HTTP is allowed on loopback)",
    );
  }
  return url.origin;
}
