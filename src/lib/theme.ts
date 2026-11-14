import { useSyncExternalStore } from "react";
export type Theme = "light" | "dark";
// Compatibility: keep the existing shared preference key across the rebrand.
export const STORAGE_KEY = "dominoos.landing.theme.v2";
const listeners = new Set<() => void>();
const isLanding = () => location.pathname.replace(/\/$/, "") === "/landing";
function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}
function defaultTheme(): Theme {
  return !isLanding() &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  if (isLanding()) root.dataset.landingTheme = theme;
  else delete root.dataset.landingTheme;
  const background = theme === "dark" ? "#0d1422" : "#f2f1ec";
  root.style.backgroundColor = background;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", background);
  listeners.forEach((l) => l());
}
export const getTheme = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";
export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* works without storage */
  }
  applyTheme(theme);
}
export function initTheme() {
  applyTheme(storedTheme() ?? defaultTheme());
  window
    .matchMedia?.("(prefers-color-scheme: dark)")
    .addEventListener?.("change", () => {
      if (!storedTheme()) applyTheme(defaultTheme());
    });
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null)
      applyTheme(storedTheme() ?? defaultTheme());
  });
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light");
}
