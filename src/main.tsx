import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans-condensed/latin-500.css";
import "@fontsource/ibm-plex-sans-condensed/latin-600.css";
import "./index.css";
import { initTheme } from "./lib/theme";
import { CLOUD_ENABLED } from "./lib/cloud/config";
import { projectAuthReturn } from "./lib/cloud/projectReturn";
import { LoadingScreen } from "./components/LoadingScreen";

initTheme();
try {
  const returnPath = CLOUD_ENABLED
    ? projectAuthReturn(new URL(window.location.href))
    : null;
  if (returnPath)
    window.history.replaceState(window.history.state, "", returnPath);
} catch {
  /* Guest routes remain usable when session storage is unavailable. */
}
const App = React.lazy(() => import("./App"));
const LandingPage = React.lazy(() => import("./landing/LandingPage"));
const ProjectsPage = React.lazy(
  () => import("./components/projects/ProjectsPage"),
);
const ProjectPage = React.lazy(
  () => import("./components/projects/ProjectPage"),
);
const path = window.location.pathname.replace(/\/$/, "");
const legacyBuilder =
  new URLSearchParams(window.location.search).get("builder") === "1";
const projectMatch = path.match(/^\/projects\/([^/]+)$/);
const surface = projectMatch ? (
  <ProjectPage id={projectMatch[1]} />
) : legacyBuilder || path === "/demo" ? (
  <App />
) : path === "/projects" ? (
  <ProjectsPage />
) : (
  <LandingPage />
);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <React.Suspense fallback={<LoadingScreen />}>
      {surface}
    </React.Suspense>
  </React.StrictMode>,
);
