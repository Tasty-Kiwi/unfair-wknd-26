const RETURN_KEY = "needtrace.oauth.project-return.v1";
const projectPath = /^\/projects\/(?:[0-9a-f-]{36}|device-draft)$/i;

// OAuth keeps its existing server callback; this tab remembers the local project.
export function rememberProjectReturn(
  path: string,
  storage: Storage = sessionStorage,
) {
  if (projectPath.test(path)) storage.setItem(RETURN_KEY, path);
  else storage.removeItem(RETURN_KEY);
}

export function projectAuthReturn(
  url: URL,
  storage: Storage = sessionStorage,
): string | null {
  if (url.pathname !== "/" || url.searchParams.get("builder") !== "1")
    return null;
  const path = storage.getItem(RETURN_KEY);
  storage.removeItem(RETURN_KEY);
  return path && projectPath.test(path) ? path + url.search : null;
}
