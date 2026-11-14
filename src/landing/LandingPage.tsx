import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Sun,
  Moon,
  Check,
  Package,
  Factory,
} from "lucide-react";
import {
  demoData,
  NORMAL_SCENARIO,
  DISRUPTION_SCENARIO,
  RECOVERY_SCENARIO,
} from "../data/demo";
import { simulate } from "../lib/simulation";
import "./landing.css";
import { setTheme, useTheme } from "../lib/theme";
const states = [
  { name: "On time", label: "On time", scenario: NORMAL_SCENARIO },
  {
    name: "Delivery delayed",
    label: "6 days late",
    scenario: DISRUPTION_SCENARIO,
  },
  {
    name: "Alternative supply applied",
    label: "Try recovery",
    scenario: RECOVERY_SCENARIO,
  },
];
const reports = states.map((s) => simulate(demoData, s.scenario));
function DemoLink() {
  return (
    <a className="lp-cta" href="/projects">
      Open projects <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}
export default function LandingPage() {
  const [active, setActive] = useState(1);
  const [showcase, setShowcase] = useState("allocation");
  const theme = useTheme();
  const result = reports[active];
  const motor = result.orders
    .find((o) => o.orderId === "ORD-102")!
    .lines.find((l) => l.componentId === "MTR-01")!;
  const recovered = active === 2;
  const delayed = active !== 0;
  useEffect(() => {
    document.title = "Needtrace — See what breaks before it breaks";
  }, []);
  return (
    <div className="lp-page" data-theme={theme} id="top">
      <a className="lp-skip" href="#lp-main">
        Skip to content
      </a>
      <header className="lp-header lp-wrap">
        <a className="lp-logo" href="/" aria-label="Needtrace home">
          <img src="/favicon.svg" width="28" height="28" alt="" />
          Needtrace
        </a>
        <nav aria-label="Landing navigation">
          <a className="lp-product-nav" href="#lp-evidence">
            The product
          </a>
          <div className="lp-theme" role="group" aria-label="Color theme">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                aria-label={`${t === "light" ? "Light" : "Dark"} mode`}
                aria-pressed={theme === t}
                onClick={() => setTheme(t)}
              >
                {t === "light" ? (
                  <Sun size={16} aria-hidden="true" />
                ) : (
                  <Moon size={16} aria-hidden="true" />
                )}
                <span>{t === "light" ? "Light" : "Dark"}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>
      <main id="lp-main" tabIndex={-1}>
        <section className="lp-hero lp-wrap" aria-labelledby="lp-title">
          <div className="lp-intro">
            <p className="lp-eyebrow">
              <span /> Manufacturing plans. Consequences, made clear.
            </p>
            <h1 id="lp-title">
              One late delivery.
              <br />
              <em>See the orders at risk.</em>
            </h1>
            <p className="lp-lead">
              Needtrace helps manufacturers see which customer orders are
              affected when supply changes—and test possible responses.
            </p>
            <div className="lp-actions">
              <DemoLink />
              <a className="lp-builder-cta" href="/projects#demo">
                Explore the demo <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div
            className={`lp-demo ${recovered ? "is-recovered" : delayed ? "is-delayed" : "is-on-time"}`}
          >
            <div className="lp-scene">
              <div className="lp-receipt">
                <div className="lp-object-icon">
                  <Factory size={22} aria-hidden="true" />
                </div>
                <span className="lp-label">SUPPLIER RECEIPT</span>
                <h2>Aster Motion</h2>
                <p className="lp-dates">
                  {delayed ? (
                    <>
                      <s>17</s> <ArrowRight size={19} aria-hidden="true" /> 23
                      Nov
                    </>
                  ) : (
                    "17 November"
                  )}
                </p>
                <span className="lp-delivery-status">
                  {delayed ? "+6 days" : "On schedule"}
                </span>
              </div>
              <span className="lp-connector" aria-hidden="true">
                <ArrowRight />
              </span>
              <div className="lp-material">
                <span className="lp-label">4 MOTORS FOR ORD-102</span>
                <div className="lp-tokens" aria-hidden="true">
                  {Array.from({ length: motor.required }, (_, i) => (
                    <span
                      key={i}
                      className={
                        i >= motor.allocated
                          ? "missing"
                          : recovered && i >= 2
                            ? "alternative"
                            : "allocated"
                      }
                    >
                      <Package size={22} />
                      {i >= motor.allocated ? <b>?</b> : <Check size={16} />}
                    </span>
                  ))}
                </div>
                <p>
                  {motor.shortage
                    ? "2 available. 2 missing."
                    : recovered
                      ? "2 in stock + 2 alternatives."
                      : "All four available on time."}
                </p>
                <div
                  className={`lp-vector ${recovered ? "lp-applied" : ""}`}
                  hidden={!recovered}
                >
                  {recovered ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">↳</span>
                  )}
                  <span>
                    {recovered
                      ? "Vector fills the gap · Applied to scenario"
                      : "An alternative to test"}
                    <small>
                      {recovered
                        ? "2 modeled motors · 18 Nov"
                        : "Vector Components · 2 motors"}
                    </small>
                  </span>
                </div>
              </div>
              <span className="lp-connector" aria-hidden="true">
                <ArrowRight />
              </span>
              <div className="lp-order" role="status" aria-live="polite">
                <div className="lp-order-top">
                  <span>ORD-102</span>
                  <span>Precision actuator</span>
                </div>
                <div className="lp-order-outcome" key={active}>
                  {motor.shortage ? (
                    <>
                      <strong data-testid="landing-shortage">
                        {motor.shortage}
                      </strong>
                      <span>motors short</span>
                    </>
                  ) : (
                    <>
                      <Check
                        className="lp-covered-icon"
                        size={48}
                        aria-hidden="true"
                      />
                      <strong className="lp-covered">Covered</strong>
                      <span
                        data-testid="landing-shortage"
                        className="lp-sr-only"
                      >
                        0
                      </span>
                    </>
                  )}
                </div>
                <p>
                  {motor.shortage
                    ? "Needed 22 Nov. Next receipt 23 Nov."
                    : recovered
                      ? "The gap closes. The delay stays."
                      : "Materials ready by the required date."}
                </p>
                <div className="lp-order-bottom">
                  <span className="lp-status-dot" />
                  {motor.shortage
                    ? "Material shortage"
                    : recovered
                      ? "Recovery simulated"
                      : "All 10 orders covered"}
                </div>
                <p className="lp-stakes">
                  {new Intl.NumberFormat("en-IE", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(result.summary.atRiskValue)}{" "}
                  fictional order value at material risk. Exposure, not loss.
                </p>
                <span className="lp-sr-only">
                  {recovered
                    ? "Applied to scenario. The original Aster receipt still arrives on 23 Nov."
                    : ""}
                </span>
              </div>
            </div>
            <div
              className="lp-state-controls"
              role="group"
              aria-label="Supply scenario"
            >
              {states.map((s, i) => (
                <button
                  key={s.name}
                  aria-label={s.name}
                  aria-pressed={active === i}
                  onClick={() => setActive(i)}
                >
                  <span className="lp-step">0{i + 1}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="lp-demo-caption">
              <span>Fictional plan. Live Needtrace calculations.</span>
              <details className="lp-summary">
                <summary>Why this result?</summary>
                <p>
                  Eight motors are in stock. ORD-101 reserves six first, leaving
                  two for ORD-102’s requirement of four on 22 November. Moving
                  PO-101 from 17 to 23 November leaves two missing. Two modeled
                  Vector motors on 18 November restore coverage; the original
                  receipt stays late.
                </p>
                <p>
                  <strong data-testid="landing-exposure">
                    {new Intl.NumberFormat("en-IE", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(result.summary.atRiskValue)}
                  </strong>{" "}
                  fictional order value at material risk. Exposure, not a
                  predicted loss. Approval and availability are fictional
                  inputs; no purchase is placed.
                </p>
              </details>
            </div>
          </div>
        </section>
        <section
          className="lp-evidence"
          id="lp-evidence"
          aria-labelledby="lp-evidence-title"
        >
          <div className="lp-wrap lp-evidence-grid">
            <div className="lp-evidence-copy">
              <p className="lp-eyebrow">GO FROM THE SIGNAL TO THE SOURCE</p>
              <h2 id="lp-evidence-title">
                No black box. <br />
                Follow the evidence.
              </h2>
              <p>
                Know which material is missing, which order needs it, and which
                supply could change the outcome.
              </p>
              <div
                className="lp-showcase-controls"
                role="group"
                aria-label="Product evidence"
              >
                <button
                  aria-pressed={showcase === "allocation"}
                  onClick={() => setShowcase("allocation")}
                >
                  01 <span>Trace a shortage</span>
                  <ArrowUpRight size={18} />
                </button>
                <button
                  aria-pressed={showcase === "network"}
                  onClick={() => setShowcase("network")}
                >
                  02 <span>See the supply network</span>
                  <ArrowUpRight size={18} />
                </button>
                <button
                  aria-pressed={showcase === "builder"}
                  onClick={() => setShowcase("builder")}
                >
                  03 <span>Build your network</span>
                  <ArrowUpRight size={18} />
                </button>
              </div>
              <p className="lp-evidence-note">
                {showcase === "allocation"
                  ? "Real reservations. Inspectable quantities. The same deterministic engine behind every scenario."
                  : showcase === "network"
                    ? "The actual supplier-to-order map. Select a node in the simulator to inspect its relationships."
                    : "Connect suppliers, materials and customer orders on an editable canvas. Workspaces save in this browser."}
              </p>
              <a className="lp-text-link" href="/projects">
                Build your network <ArrowUpRight size={16} />
              </a>
              <small>
                Opens the editable canvas. No account required for local work.
              </small>
            </div>
            <figure className={`lp-showcase lp-showcase-${showcase}`}>
              <div className="lp-window-label">
                <span />
                <span>
                  NEEDTRACE /{" "}
                  {showcase === "allocation"
                    ? "ALLOCATION EVIDENCE"
                    : showcase === "network"
                      ? "SUPPLY NETWORK"
                      : "NETWORK BUILDER"}
                </span>
                <a
                  href={
                    showcase === "allocation"
                      ? "/landing/shortage-desktop.png"
                      : showcase === "network"
                        ? "/landing/simulator-detail.png"
                        : "/landing/builder-detail.png"
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View product image full size"
                >
                  <ArrowUpRight size={16} />
                </a>
              </div>
              <div
                className="lp-image-well"
                tabIndex={showcase === "network" ? 0 : undefined}
                role={showcase === "network" ? "region" : undefined}
                aria-label={
                  showcase === "network"
                    ? "Supply network image; scroll to explore"
                    : undefined
                }
              >
                <picture>
                  {showcase === "allocation" && (
                    <source
                      media="(max-width: 900px)"
                      srcSet="/landing/shortage-mobile.png"
                    />
                  )}
                  <img
                    key={showcase}
                    src={
                      showcase === "allocation"
                        ? "/landing/shortage-desktop.png"
                        : showcase === "network"
                          ? "/landing/simulator-detail.png"
                          : "/landing/builder-detail.png"
                    }
                    alt={
                      showcase === "allocation"
                        ? "Actual simulator: ORD-102 needs four servo motors; two allocated and two short, with PO-101 arriving after the requirement."
                        : showcase === "network"
                          ? "Actual simulator supply network showing the delayed Aster receipt and ORD-102 shortage."
                          : "Actual editable builder canvas with supplier, motor stock, receipt, product and customer orders."
                    }
                    width={showcase === "allocation" ? 686 : 1418}
                    height={showcase === "allocation" ? 450 : 520}
                    loading="lazy"
                  />
                </picture>
              </div>
              <figcaption>
                Actual application · fictional example · light product interface
              </figcaption>
            </figure>
          </div>
        </section>
        <section className="lp-close lp-wrap">
          <p className="lp-eyebrow">SEE WHAT BREAKS BEFORE IT BREAKS.</p>
          <h2>
            Change the plan.
            <br />
            <em>Understand the consequence.</em>
          </h2>
          <DemoLink />
          <p className="lp-close-note">
            Material availability. Clear assumptions. Your next what-if.
          </p>
          <details className="lp-boundaries">
            <summary>What the prototype does—and where it stops</summary>
            <p>
              Deterministic material allocation and scenario comparisons.
              Factory capacity, costs, supplier confirmation and exact shipment
              predictions are outside the model. Simulated recoveries do not
              place orders.
            </p>
            <p>
              Builder workspaces save in this browser; export JSON for a
              portable copy. CSV/JSON imports in the original simulator are
              session-only and clear on refresh. Neither is uploaded to a
              server. No customer validation or measured savings are claimed.
            </p>
          </details>
        </section>
      </main>
      <footer className="lp-footer lp-wrap">
        <a className="lp-logo" href="#top">
          Needtrace
        </a>
        <span>Material availability, made visible.</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </div>
  );
}
