import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Check, ArrowUpRight } from "lucide-react";
import {
  demoData,
  NORMAL_SCENARIO,
  DISRUPTION_SCENARIO,
  RECOVERY_SCENARIO,
} from "../data/demo";
import { simulate } from "../lib/simulation";
import "./landing.css";

const states = [
  { name: "On time", scenario: NORMAL_SCENARIO },
  { name: "Delivery delayed", scenario: DISRUPTION_SCENARIO },
  { name: "Alternative supply applied", scenario: RECOVERY_SCENARIO },
];
const reports = states.map(({ scenario }) => simulate(demoData, scenario));
const currency = (n: number) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

function DemoLink({ secondary = false }: { secondary?: boolean }) {
  return (
    <a className={`lp-cta${secondary ? " lp-cta-light" : ""}`} href="/">
      Launch interactive demo <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}

export default function LandingPage() {
  const [active, setActive] = useState(1);
  const result = reports[active];
  const order = result.orders.find((o) => o.orderId === "ORD-102")!;
  const motor = order.lines.find((l) => l.componentId === "MTR-01")!;
  const delayed = active !== 0;
  const recovered = active === 2;
  const receipt = result.deliveries.find((d) => d.id === "PO-101")!;
  const status = motor.shortage ? "Material shortage" : "Materials covered";
  useEffect(() => {
    const title = document.title;
    document.title = "DominoOS — See what breaks before it breaks";
    return () => {
      document.title = title;
    };
  }, []);
  return (
    <div className="lp-page">
      <a href="#lp-main" className="lp-skip">
        Skip to content
      </a>
      <header className="lp-header">
        <a
          className="lp-brand"
          href="/landing"
          aria-label="DominoOS landing page"
        >
          <span className="lp-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          DominoOS
        </a>
        <span className="lp-brandline">See what breaks before it breaks.</span>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="/" className="lp-nav-demo">
            Open demo <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main id="lp-main" className="lp-main">
        <section className="lp-hero" aria-labelledby="lp-title">
          <div className="lp-intro">
            <p className="lp-eyebrow">
              <span /> Manufacturing material-availability simulator
            </p>
            <h1 id="lp-title">
              One late delivery.
              <br />
              <span>Which orders are now at risk?</span>
            </h1>
            <p className="lp-lead">
              Move a supplier receipt. See which customer commitments run short,
              trace the missing materials, and test an approved alternative.
            </p>
            <div className="lp-actions">
              <DemoLink />
              <a className="lp-text-link" href="#how-it-works">
                See how it works <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
            <p className="lp-caption">
              Fictional plan. Real calculations. No account required.
            </p>
            <p className="lp-caption">
              Imports are session-only; refresh clears your plan.
            </p>
          </div>
          <div
            className={`lp-experiment lp-state-${active}`}
            aria-label="Interactive fictional material plan"
          >
            <div className="lp-figure-head">
              <span className="lp-eyebrow">Northstar / fictional plan</span>
              <span className="lp-live">
                <span /> Calculated locally
              </span>
            </div>
            <div className="lp-figure-title">
              <h2>
                A six-day delay.
                <br />
                One order in the balance.
              </h2>
              <span className="lp-drawing-no">
                PO-101
                <br />
                NOV 2026
              </span>
            </div>
            <p className="lp-control-hint">
              Choose a scenario. Follow the change.
            </p>
            <div
              className="lp-state-controls"
              role="group"
              aria-label="Supply scenario"
            >
              {states.map((state, i) => (
                <button
                  key={state.name}
                  aria-pressed={active === i}
                  onClick={() => setActive(i)}
                >
                  <span aria-hidden="true">0{i + 1}</span>
                  {state.name}
                </button>
              ))}
            </div>
            <div className="lp-receipt">
              <span>Aster Motion · 5 motors</span>
              <div>
                <span className={delayed ? "lp-old-date" : ""}>17 Nov</span>
                {delayed && (
                  <>
                    <ArrowRight size={16} aria-hidden="true" />
                    <strong>
                      23 Nov <small>+6 days</small>
                    </strong>
                  </>
                )}
              </div>
            </div>
            <div className="lp-chain" aria-label="Supplier to customer order">
              <div className="lp-chain-node">
                <span className="lp-node-label">Supplier</span>
                <strong>Aster Motion</strong>
                <span>PO-101</span>
              </div>
              <div className="lp-chain-node">
                <span className="lp-node-label">Component</span>
                <strong>Servo motor</strong>
                <span>MTR-01</span>
              </div>
              <div className="lp-chain-node">
                <span className="lp-node-label">Product</span>
                <strong>Precision actuator</strong>
                <span>PA-410</span>
              </div>
              <div className="lp-chain-node lp-order">
                <span className="lp-node-label">Customer order</span>
                <strong>ORD-102</strong>
                <span>Due 22 Nov</span>
                <b>
                  {motor.shortage
                    ? `${motor.shortage} motors short`
                    : "Covered ✓"}
                </b>
              </div>
            </div>
            <div className={`lp-alternative ${recovered ? "lp-applied" : ""}`}>
              <span className="lp-alt-path" aria-hidden="true">
                ↳
              </span>
              <div>
                <strong>Vector Components</strong>
                <span>
                  {recovered
                    ? "2 approved motors applied · 18 Nov"
                    : "2 approved motors available · 18 Nov"}
                </span>
              </div>
              <span className="lp-alt-status">
                {recovered ? (
                  <Check size={20} aria-label="Applied" />
                ) : (
                  "Alternative"
                )}
              </span>
            </div>
            <div
              className="lp-outcome"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="lp-outcome-title">
                <span className="lp-status-mark" aria-hidden="true" />
                <strong>{status}</strong>
                <span>ORD-102</span>
              </div>
              <dl className="lp-counts">
                <div>
                  <dt>Motors required</dt>
                  <dd>{motor.required}</dd>
                </div>
                <div>
                  <dt>Allocated on time</dt>
                  <dd>{motor.allocated}</dd>
                </div>
                <div>
                  <dt>Missing</dt>
                  <dd data-testid="landing-shortage">{motor.shortage}</dd>
                </div>
              </dl>
              <p>
                <strong data-testid="landing-exposure">
                  {currency(result.summary.atRiskValue)}
                </strong>{" "}
                fictional order value at material risk{" "}
                <span>— exposure, not a predicted loss.</span>
              </p>
            </div>
            <p className="lp-figure-note">
              {recovered
                ? "Coverage restored. The original Aster receipt still arrives on 23 Nov. This changes the simulation, not a purchase order."
                : delayed
                  ? "8 motors in stock. ORD-101 reserves 6 first. Only 2 remain for ORD-102; its other 2 arrive too late."
                  : `All ${result.summary.totalOrders} orders covered. The receipt arrives on ${receipt.availableDate.slice(8)} Nov, before ORD-102 needs its motors.`}
            </p>
            <details className="lp-summary">
              <summary>Read the three-state example</summary>
              <p>
                On time: all 10 orders covered. Delayed to 23 Nov: ORD-102 needs
                4 motors by 22 Nov, receives 2 from remaining stock and is short
                2. With 2 modeled Vector motors dated 18 Nov: coverage returns
                while the Aster receipt stays delayed. Approval and availability
                are fictional inputs, not supplier confirmations.
              </p>
            </details>
          </div>
        </section>
        <section
          className="lp-consequence"
          aria-labelledby="lp-consequence-title"
        >
          <div>
            <p className="lp-eyebrow">The consequence</p>
            <h2 id="lp-consequence-title">
              A late receipt is a date.
              <br />A short order is a commitment.
            </h2>
          </div>
          <div className="lp-allocation-story">
            <p>
              Eight motors on the shelf can look like enough. Until the first
              order reserves six.
            </p>
            <div className="lp-stock" aria-hidden="true">
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} className={i < 6 ? "lp-reserved" : ""} />
              ))}
            </div>
            <div className="lp-stock-labels">
              <span>6 reserved for ORD-101</span>
              <strong>2 left for ORD-102</strong>
            </div>
            <p>
              ORD-102 needs four by <strong>22 November</strong>. Move the next
              receipt from 17 to 23 November, and two motors are missing at the
              moment they’re needed.
            </p>
          </div>
        </section>
        <section
          className="lp-method"
          id="how-it-works"
          aria-labelledby="lp-method-title"
        >
          <div className="lp-section-heading">
            <p className="lp-eyebrow">How it works</p>
            <h2 id="lp-method-title">
              Follow the consequence.
              <br />
              Then change the outcome.
            </h2>
          </div>
          <div className="lp-steps">
            {[
              [
                "Change the supply",
                "Move PO-101 from 17 to 23 November. Or adjust the quantity on a receipt. The baseline stays intact.",
              ],
              [
                "Trace the impact",
                "Follow the motor to ORD-102. Inspect what was required, what was allocated and which receipt arrives too late.",
              ],
              [
                "Compare the response",
                "Restore the original timing or model two approved Vector motors. Compare coverage and check each option’s assumptions.",
              ],
            ].map(([title, text], i) => (
              <article key={title}>
                <span className="lp-step-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="lp-product" aria-labelledby="lp-product-title">
          <div className="lp-product-copy">
            <p className="lp-eyebrow">Inside the simulator</p>
            <h2 id="lp-product-title">
              Every shortage
              <br />
              has a paper trail.
            </h2>
            <p>
              See the supplier-to-order path, dated supply and per-order
              allocation evidence in the working application.
            </p>
            <a className="lp-text-link" href="/">
              Explore the fictional plan{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
          <figure>
            <a
              href="/"
              aria-label="Open the simulator shown in this screenshot"
            >
              <img
                src="/landing/simulator.png"
                width="1440"
                height="1000"
                loading="lazy"
                alt="Actual DominoOS simulator showing the fictional motor disruption, red ORD-102 path and dated receipt controls."
              />
            </a>
            <figcaption>
              Actual local simulator · fictional Northstar dataset · six-day
              motor delay
            </figcaption>
          </figure>
        </section>
        <section className="lp-trust" aria-labelledby="lp-trust-title">
          <div>
            <p className="lp-eyebrow">A model you can inspect</p>
            <h2 id="lp-trust-title">
              Clear inputs.
              <br />
              Explainable limits.
            </h2>
          </div>
          <div>
            <dl>
              <div>
                <dt>Deterministic by design</dt>
                <dd>
                  The same inputs produce the same result. Orders reserve
                  material by required date, then order ID.
                </dd>
              </div>
              <div>
                <dt>Evidence beside the answer</dt>
                <dd>
                  Inspect reservations, missing components and late receipts.
                  Compare scenarios against the same baseline.
                </dd>
              </div>
              <div>
                <dt>Your data, with its source visible</dt>
                <dd>
                  CSV/JSON imports disclose replaced and retained data. Plans
                  stay in browser memory; refresh clears them. Export results
                  and keep your source files.
                </dd>
              </div>
            </dl>
            <p className="lp-boundary">
              Material availability only. Factory capacity, costs, supplier
              commitments and exact shipment predictions are not modeled.
              Recovery actions do not place purchases.
            </p>
          </div>
        </section>
        <section className="lp-close">
          <p className="lp-eyebrow">See what breaks before it breaks.</p>
          <h2>
            Find the short order.
            <br />
            <span>Test a way through.</span>
          </h2>
          <DemoLink secondary />
          <p className="lp-caption">
            A fictional manufacturing plan, ready to explore.
          </p>
        </section>
      </main>
      <footer className="lp-footer">
        <a className="lp-brand" href="/landing">
          DominoOS
        </a>
        <span>Unfair Weekend 2026 · Material availability, explained.</span>
        <a href="#lp-main">Back to top ↑</a>
      </footer>
    </div>
  );
}
