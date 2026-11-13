import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans-condensed/latin-500.css";
import "@fontsource/ibm-plex-sans-condensed/latin-600.css";
import "./index.css";
const App = React.lazy(() => import("./App"));
const LandingPage = React.lazy(() => import("./landing/LandingPage"));
const isLanding = window.location.pathname.replace(/\/$/, "") === "/landing";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <React.Suspense fallback={<p role="status">Loading DominoOS…</p>}>
      {isLanding ? <LandingPage /> : <App />}
    </React.Suspense>
  </React.StrictMode>,
);
