import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

// Shared with the landing page (design/landing-visual-reset) so one choice
// carries across /landing and the app. The landing page applies it itself.
export const STORAGE_KEY = "dominoos.landing.theme.v2";
const THEME_COLORS: Record<Theme, string> = { light: "#e9ece8", dark: "#14181b" };
const listeners = new Set<() => void>();

function isLandingPath() {
  return window.location.pathname.replace(/\/$/, "") === "/landing";
}

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/** Applies the theme to <html>: the `dark` class drives every colour token. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[theme]);
  listeners.forEach((listener) => listener());
}

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the choice still applies now.
  }
  applyTheme(theme);
}

/** Follow the OS setting until the user makes an explicit choice. */
export function initTheme() {
  if (isLandingPath()) return;
  applyTheme(storedTheme() ?? systemTheme());
  window
    .matchMedia?.("(prefers-color-scheme: dark)")
    .addEventListener?.("change", () => {
      if (!storedTheme()) applyTheme(systemTheme());
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light");
}
