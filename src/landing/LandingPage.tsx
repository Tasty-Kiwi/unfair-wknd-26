import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, Sun, Moon, Check } from "lucide-react";
import {
  demoData,
  NORMAL_SCENARIO,
  DISRUPTION_SCENARIO,
  RECOVERY_SCENARIO,
} from "../data/demo";
import { simulate } from "../lib/simulation";
import "./landing.css";
const states = [
  { name: "On time", short: "On time", scenario: NORMAL_SCENARIO },
  {
    name: "Delivery delayed",
    short: "Delay +6 days",
    scenario: DISRUPTION_SCENARIO,
  },
  {
    name: "Alternative supply applied",
    short: "Recovery",
    scenario: RECOVERY_SCENARIO,
  },
];
const reports = states.map(({ scenario }) => simulate(demoData, scenario));
const currency = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
function DemoLink() {
  return (
    <a className="lp-cta" href="/">
      Launch interactive demo <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}
export default function LandingPage() {
  const [active, setActive] = useState(1);
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.landingTheme === "dark" ? "dark" : "light",
  );
  const result = reports[active];
  const order = result.orders.find((o) => o.orderId === "ORD-102")!;
  const motor = order.lines.find((l) => l.componentId === "MTR-01")!;
  const receipt = result.deliveries.find((d) => d.id === "PO-101")!;
  const delayed = receipt.availableDate === "2026-11-23";
  const recovered = active === 2;
  useEffect(() => {
    document.title = "DominoOS — See what breaks before it breaks";
    document.documentElement.dataset.landingTheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0E1519" : "#F2F1EC");
    try {
      localStorage.setItem("dominoos.landing.theme.v2", theme);
    } catch {
      /* Choice still works when storage is blocked. */
    }
  }, [theme]);
  return (
    <div className="lp-page" data-theme={theme} id="top">
      <a className="lp-skip" href="#lp-main">
        Skip to content
      </a>
      <header className="lp-header lp-wrap">
        <a className="lp-logo" href="/landing" aria-label="DominoOS home">
          <span className="lp-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          DominoOS
        </a>
        <span className="lp-brandline">See what breaks before it breaks.</span>
        <nav aria-label="Landing navigation">
          <a className="lp-how-nav" href="#how-it-works">
            The product
          </a>
          <div className="lp-theme" role="group" aria-label="Color theme">
            {["light", "dark"].map((t) => (
              <button
                key={t}
                type="button"
                aria-label={`${t === "light" ? "Light" : "Dark"} mode`}
                aria-pressed={theme === t}
                onClick={() => setTheme(t)}
              >
                {t === "light" ? (
                  <Sun size={15} aria-hidden="true" />
                ) : (
                  <Moon size={15} aria-hidden="true" />
                )}
                <span>{t === "light" ? "Light" : "Dark"}</span>
              </button>
            ))}
          </div>
          <a className="lp-open" href="/">
            Open demo <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main id="lp-main" tabIndex={-1}>
        <section className="lp-hero lp-wrap" aria-labelledby="lp-title">
          <div className="lp-intro">
            <div>
              <p className="lp-eyebrow">
                <span /> Material availability, made visible
              </p>
              <h1 id="lp-title">
                One late delivery.
                <br />
                <span>
                  Which orders are
                  <br className="lp-desktop-break" /> now at risk?
                </span>
              </h1>
            </div>
            <div className="lp-intro-side">
              <p>
                Move a supplier receipt. See which customer commitments run
                short, trace the missing materials, and test an approved
                alternative.
              </p>
              <DemoLink />
              <a className="lp-text-link" href="#how-it-works">
                See how it works <ArrowDown size={16} aria-hidden="true" />
              </a>
              <p className="lp-small">
                Fictional plan. Real calculations. No account.
              </p>
            </div>
          </div>
          <div
            className="lp-stage"
            data-state={active}
            aria-label="Interactive fictional supply scenario"
          >
            <div className="lp-stage-toolbar">
              <p>
                <span className="lp-live-dot" /> Live scenario{" "}
                <span className="lp-toolbar-muted">/ Northstar · Nov 2026</span>
              </p>
              <div
                className="lp-state-controls"
                role="group"
                aria-label="Supply scenario"
              >
                {states.map((s, i) => (
                  <button
                    type="button"
                    key={s.name}
                    aria-label={s.name}
                    aria-pressed={active === i}
                    onClick={() => setActive(i)}
                  >
                    <span className="lp-state-number">0{i + 1}</span>
                    {s.short}
                  </button>
                ))}
              </div>
            </div>
            <div className="lp-stage-body">
              <div
                className={`lp-system ${delayed ? "is-delayed" : ""} ${recovered ? "is-recovered" : ""}`}
              >
                <div
                  className="lp-axis"
                  aria-label={`Aster receipt ${delayed ? "23" : "17"} November; ORD-102 due 22 November`}
                >
                  <div className="lp-axis-title">
                    PO-101 · Aster Motion · 5 motors{" "}
                  </div>
                  <div className="lp-date-track" aria-hidden="true">
                    {Array.from({ length: 19 }, (_, i) => (
                      <i
                        key={i}
                        className="lp-minor-tick"
                        style={{ left: `${(i / 18) * 100}%` }}
                      />
                    ))}
                    {delayed && (
                      <>
                        <div className="lp-ghost" style={{ left: "27.77%" }}>
                          17 Nov
                        </div>
                        <div
                          className="lp-dimension"
                          style={{ left: "27.77%", width: "33.34%" }}
                        >
                          +6 days
                        </div>
                        <div
                          className="lp-late-gap"
                          style={{ left: "55.55%", width: "5.56%" }}
                        >
                          <span>1 day after due</span>
                        </div>
                      </>
                    )}

                    {[12, 15, 18, 21, 24, 27, 30].map((d, i) => (
                      <span
                        className="lp-tick"
                        key={d}
                        style={{ left: `${(i / 6) * 100}%` }}
                      >
                        {d}
                      </span>
                    ))}
                    <div className="lp-due" style={{ left: "55.55%" }}>
                      <span>
                        Order due
                        <br />
                        <b>22 Nov</b>
                      </span>
                    </div>
                    <div
                      className="lp-receipt"
                      style={{ left: delayed ? "61.11%" : "27.77%" }}
                    >
                      <span>PO-101 · {delayed ? "23 Nov" : "17 Nov"}</span>
                      <i />
                    </div>
                    {recovered && (
                      <div className="lp-alt-date" style={{ left: "33.33%" }}>
                        18 Nov
                        <br />
                        <b>Vector +2</b>
                      </div>
                    )}
                  </div>
                </div>
                <ol
                  className="lp-chain"
                  aria-label="Supplier to customer order"
                >
                  <li className="lp-chain-node">
                    <span className="lp-node-label">Supplier</span>
                    <strong>Aster Motion</strong>
                    <small>PO-101 · {delayed ? "23" : "17"} Nov</small>
                  </li>
                  <li className="lp-chain-node">
                    <span className="lp-node-label">Component</span>
                    <strong>Servo motor</strong>
                    <small>MTR-01</small>
                  </li>
                  <li className="lp-chain-node">
                    <span className="lp-node-label">Product</span>
                    <strong>Precision actuator</strong>
                    <small>PA-410</small>
                  </li>
                  <li
                    className={`lp-chain-node lp-order ${motor.shortage ? "is-short" : "is-covered"}`}
                  >
                    <span className="lp-node-label">Customer order</span>
                    <strong>ORD-102</strong>
                    <small>Required 22 Nov</small>
                    <span className="lp-order-status">
                      {motor.shortage ? (
                        "2 motors short"
                      ) : (
                        <>
                          <Check size={14} aria-hidden="true" /> Materials
                          covered
                        </>
                      )}
                    </span>
                  </li>
                </ol>
                <div
                  className={`lp-alternative ${recovered ? "lp-applied" : "lp-unapplied"}`}
                >
                  <span aria-hidden="true">↳</span>
                  <div>
                    <strong>Vector Components</strong>
                    <small>2 modeled approved motors · 18 Nov</small>
                  </div>
                  <span>
                    {recovered ? "Applied to scenario" : "Available to model"}
                  </span>
                </div>
              </div>
              <div
                className="lp-outcome"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <p className={motor.shortage ? "lp-risk" : "lp-covered"}>
                  {motor.shortage ? "Material shortage" : "Materials covered"}
                </p>
                <div
                  className={`lp-big-result ${motor.shortage ? "lp-risk" : ""}`}
                >
                  <strong data-testid="landing-shortage">
                    {motor.shortage}
                  </strong>
                  <span>
                    of {motor.required} motors
                    <br />
                    missing by 22 Nov
                  </span>
                </div>
                <div className="lp-allocation">
                  <span>{motor.allocated}</span> allocated on time
                </div>
                <div className="lp-exposure">
                  <strong data-testid="landing-exposure">
                    {currency(result.summary.atRiskValue)}
                  </strong>
                  <span>fictional order value at material risk</span>
                  <small>Exposure, not a predicted loss.</small>
                </div>
                <p className="lp-result-note">
                  {active === 0
                    ? "All 10 orders covered. The receipt arrives before ORD-102 needs it."
                    : recovered
                      ? "Coverage restored. The original Aster receipt still arrives on 23 Nov."
                      : ""}
                </p>
              </div>
            </div>
          </div>
          <details className="lp-summary lp-visually-hidden">
            <summary>Read the three-state example</summary>
            <p>
              On time: all ten orders have material coverage. Delayed six days:
              ORD-102 requires four motors; two are allocated, two are missing.
              Two Vector motors restore coverage in the recovery scenario.
              Approval and availability are fictional inputs. Recovery does not
              place a purchase or confirm supply.
            </p>
          </details>
        </section>
        <section className="lp-explain lp-wrap" aria-labelledby="lp-why">
          <div>
            <p className="lp-eyebrow">01 / Follow the allocation</p>
            <h2 id="lp-why">Why eight motors aren’t enough.</h2>
            <p>
              A stock count alone misses the commitment. Earlier orders reserve
              material first. DominoOS shows what remains when each order needs
              it.
            </p>
          </div>
          <div className="lp-stock-proof">
            <div className="lp-stock-label">
              <span>8 motors on hand</span>
              <span>Required-date priority</span>
            </div>
            <div className="lp-stock" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <i key={i} className={i < 6 ? "is-reserved" : ""} />
              ))}
            </div>
            <div className="lp-stock-label">
              <span>6 reserved for ORD-101</span>
              <strong>2 left for ORD-102</strong>
            </div>
            <p>
              Inspect the reservation, the missing quantity and the late
              receipt. Same inputs. Same answer.
            </p>
          </div>
        </section>
        <section
          id="how-it-works"
          className="lp-product lp-wrap"
          aria-labelledby="lp-evidence"
        >
          <div className="lp-section-heading">
            <div>
              <p className="lp-eyebrow">02 / Inside the simulator</p>
              <h2 id="lp-evidence">A shortage you can trace.</h2>
            </div>
            <p>
              Change the supply. Trace the impact. Compare the response. Every
              result connects back to a material, a date and a customer order.
            </p>
          </div>
          <a
            className="lp-product-image"
            href="/"
            aria-label="Open the simulator shown in this real screenshot"
          >
            <picture>
              <source
                media="(max-width: 900px)"
                srcSet="/landing/allocation-mobile.png"
              />
              <img
                src="/landing/simulator-detail.png"
                width="1100"
                height="760"
                loading="lazy"
                alt="Real DominoOS simulator showing the red supplier-to-ORD-102 path and the dated motor shortage timeline."
              />
            </picture>
          </a>
          <div className="lp-image-caption">
            <span>Actual application · fictional Northstar plan</span>
            <span>Light application interface in both page themes</span>
          </div>
          <div className="lp-evidence-points">
            <p>
              <b>01</b> See the affected order in the supply network.
            </p>
            <p>
              <b>02</b> Inspect exactly which materials arrive too late.
            </p>
            <p>
              <b>03</b> Model a response and recalculate coverage.
            </p>
          </div>
        </section>
        <section
          id="builder"
          className="lp-builder lp-wrap"
          aria-labelledby="lp-builder-title"
        >
          <div className="lp-builder-copy">
            <p className="lp-eyebrow">03 / Make it your own</p>
            <h2 id="lp-builder-title">
              Your network.
              <br />
              Your next what-if.
            </h2>
            <p>
              Connect suppliers, materials, products and customer orders on an
              editable canvas. Start with an example or build a network of your
              own, then simulate its material coverage.
            </p>
            <a href="/" className="lp-text-link">
              Open demo to build a network{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <p className="lp-small">
              In the simulator, choose <strong>Build a network</strong>.
            </p>
            <div className="lp-storage-note">
              <strong>Workspaces stay in this browser.</strong>
              <p>
                Builder workspaces save locally; export JSON for a portable
                copy. CSV/JSON imports in the simulator are session-only and
                clear on refresh. Neither is uploaded to a server.
              </p>
            </div>
          </div>
          <figure>
            <a
              href="/landing/builder-detail.png"
              target="_blank"
              rel="noreferrer"
              aria-label="View full-size real builder screenshot"
            >
              <img
                src="/landing/builder-detail.png"
                width="709"
                height="260"
                alt="Actual editable builder canvas showing suppliers, material stock, a dated receipt, a product and customer orders."
                loading="lazy"
              />
            </a>
            <figcaption>
              Actual builder · motor assembly example · view full size ↗
            </figcaption>
          </figure>
        </section>
        <section
          className="lp-limits lp-wrap"
          aria-labelledby="lp-limits-title"
        >
          <p className="lp-eyebrow">A model you can inspect</p>
          <h2 id="lp-limits-title">Clear inputs. Honest boundaries.</h2>
          <div className="lp-limit-columns">
            <div>
              <h3>What it calculates</h3>
              <p>
                Material coverage from stock, dated receipts and bills of
                material. Orders reserve by required date, then order ID.
                Inspect allocations and compare scenarios against the same
                baseline.
              </p>
            </div>
            <div>
              <h3>What remains a real-world decision</h3>
              <p>
                Supplier confirmation, purchasing, factory capacity, costs and
                exact shipment timing. Modeled alternatives do not place orders.
                CSV/JSON imports disclose replaced and retained data.
              </p>
            </div>
          </div>
        </section>
        <section className="lp-close lp-wrap">
          <p className="lp-eyebrow">See what breaks before it breaks.</p>
          <h2>
            Find the short order.
            <br />
            <span>Test a way through.</span>
          </h2>
          <DemoLink />
          <p className="lp-small">
            Explore a fictional plan before bringing your own.
          </p>
        </section>
      </main>
      <footer className="lp-footer lp-wrap">
        <a className="lp-logo" href="#top">
          DominoOS
        </a>
        <span>Unfair Weekend 2026 · Material availability, explained.</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </div>
  );
}
