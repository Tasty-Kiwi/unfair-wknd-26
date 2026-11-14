import "./loading-screen.css";

export function LoadingScreen() {
  return (
    <div
      className="app-loading"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="app-loading__content">
        <div className="app-loading__brand" aria-hidden="true">
          <img src="/favicon.svg" width="40" height="40" alt="" />
          <span>Needtrace</span>
        </div>
        <svg
          className="app-loading__trace"
          viewBox="0 0 280 40"
          fill="none"
          aria-hidden="true"
        >
          <path className="app-loading__track" d="M20 20H260" />
          <path
            className="app-loading__signal"
            d="M20 20H260"
            pathLength="100"
          />
          <rect x="12" y="12" width="16" height="16" rx="3" />
          <rect x="132" y="12" width="16" height="16" rx="3" />
          <rect x="252" y="12" width="16" height="16" rx="3" />
        </svg>
        <p>Loading Needtrace…</p>
      </div>
    </div>
  );
}
