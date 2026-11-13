import { useMemo, useEffect, useState, useSyncExternalStore } from "react";
import {
  ReactFlow,
  Controls,
  Handle,
  Position,
  useReactFlow,
  useStore,
  ReactFlowProvider,
  type Node,
  type NodeProps,
  type Edge,
} from "@xyflow/react";
import { Factory, Box, Cog, ClipboardList, Focus } from "lucide-react";
import type { Dataset, SimulationResult, Scenario } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ReceiptTimeline } from "./ReceiptTimeline";
import { useTheme } from "@/lib/theme";
import "@xyflow/react/dist/style.css";

export type Selection = {
  kind: "supplier" | "component" | "product" | "order";
  id: string;
};
type SupplyData = Record<string, unknown> & {
  label: string;
  sub: string;
  tag: string;
  kind: Selection["kind"];
  risk: boolean;
  active: boolean;
  flag: string;
};
type SupplyNode = Node<SupplyData, "supply">;
const icons = {
  supplier: Factory,
  component: Box,
  product: Cog,
  order: ClipboardList,
};
function SupplyNodeView({ data, selected }: NodeProps<SupplyNode>) {
  const Icon = icons[data.kind];
  return (
    <div
      className={`supply-node ${data.risk ? "is-risk" : ""} ${selected ? "is-selected" : ""} ${data.active ? "is-active" : ""}`}
    >
      {data.kind !== "supplier" && (
        <Handle type="target" position={Position.Left} />
      )}
      <div className="node-top">
        <span className="node-icon">
          <Icon size={16} aria-hidden="true" />
        </span>
        <span className="node-tag">{data.tag}</span>
        {data.risk && data.flag && (
          <span className="node-flag">{data.flag}</span>
        )}
      </div>
      <strong>{data.label}</strong>
      <span className="node-sub">{data.sub}</span>
      {data.kind !== "order" && (
        <Handle type="source" position={Position.Right} />
      )}
    </div>
  );
}
const nodeTypes = { supply: SupplyNodeView };
function FitOnChange({ signature }: { signature: string }) {
  const { fitView } = useReactFlow();
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  useEffect(() => {
    const t = setTimeout(
      () =>
        void fitView({
          padding: 0.15,
          duration: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? 0
            : 250,
          maxZoom: 1.05,
        }),
      50,
    );
    return () => clearTimeout(t);
  }, [signature, width, height, fitView]);
  return null;
}

const NARROW = "(max-width: 720px)";
function useNarrow() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(NARROW);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}
const LANES: [Selection["kind"], string][] = [
  ["supplier", "Suppliers"],
  ["component", "Components"],
  ["product", "Products"],
  ["order", "Customer orders"],
];
const shortDay = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

function GraphInner({
  data,
  result,
  scenario,
  onSelect,
  selected,
  onMoveReceipt,
}: {
  data: Dataset;
  result: SimulationResult;
  scenario: Scenario;
  onSelect: (s: Selection) => void;
  selected: Selection | null;
  onMoveReceipt?: (deliveryId: string, date: string) => void;
}) {
  const narrow = useNarrow();
  const [full, setFull] = useState(false);
  const theme = useTheme();
  const [componentFocus, setComponentFocus] = useState("MTR-01");
  const focused = data.components.some((c) => c.id === componentFocus)
    ? componentFocus
    : data.components[0]?.id;
  const { nodes, edges } = useMemo(() => {
    const riskLines = result.orders.flatMap((o) =>
      o.lines.filter((l) => l.shortage > 0),
    );
    const riskComponents = new Set(riskLines.map((l) => l.componentId));
    const riskProducts = new Set(
      result.orders
        .filter((o) => o.status === "at-risk")
        .map((o) => o.productId),
    );
    const components = data.components.filter((c) => full || c.id === focused);
    const componentIds = new Set(components.map((c) => c.id));
    const products = data.products.filter((p) =>
      p.bom.some((b) => componentIds.has(b.componentId)),
    );
    const productIds = new Set(products.map((p) => p.id));
    const suppliers = data.suppliers.filter(
      (s) =>
        components.some((c) => c.supplierId === s.id) ||
        result.deliveries.some(
          (d) => d.supplierId === s.id && componentIds.has(d.componentId),
        ) ||
        data.alternatives.some(
          (a) => a.supplierId === s.id && componentIds.has(a.componentId),
        ),
    );
    const orders = data.orders.filter((o) => productIds.has(o.productId));
    const nodes: SupplyNode[] = [];
    const edges: Edge[] = [];
    const maxRows = Math.max(
      suppliers.length,
      components.length,
      products.length,
      orders.length,
    );
    const step = full ? 130 : 160;
    const add = (
      kind: Selection["kind"],
      id: string,
      i: number,
      count: number,
      col: number,
      label: string,
      sub: string,
      tag: string,
      risk = false,
      active = false,
      flag = "",
    ) =>
      nodes.push({
        id: `${kind}:${id}`,
        type: "supply",
        position: {
          x: col * 260,
          y: i * step + ((maxRows - count) * step) / 2,
        },
        data: { label, sub, tag, kind, risk, active, flag },
        selected: selected?.kind === kind && selected.id === id,
      });
    const edge = (
      source: string,
      target: string,
      risk: boolean,
      alt = false,
    ) => {
      if (edges.some((e) => e.id === `${source}>${target}`)) return;
      edges.push({
        id: `${source}>${target}`,
        source,
        target,
        type: "smoothstep",
        style: {
          stroke: risk ? "var(--short)" : alt ? "var(--alt)" : "var(--rule)",
          strokeWidth: risk ? 3 : 1.5,
          strokeDasharray: alt ? "5 4" : undefined,
        },
        className: risk ? "edge-risk" : undefined,
      });
    };
    suppliers.forEach((s, i) => {
      const impacted = components.some(
        (c) => c.supplierId === s.id && riskComponents.has(c.id),
      );
      // Only say "Late" when a receipt from this supplier actually lands after
      // its planned date. A shortage can also come from quantity or demand.
      const own = result.deliveries.filter(
        (d) => d.supplierId === s.id && riskComponents.has(d.componentId),
      );
      const planned = (id: string) => data.deliveries.find((d) => d.id === id);
      const late = own.some(
        (d) =>
          d.availableDate > (planned(d.id)?.availableDate ?? d.availableDate),
      );
      const reduced = own.some(
        (d) => d.quantity < (planned(d.id)?.quantity ?? d.quantity),
      );
      const flag = late ? "Late" : reduced ? "Reduced" : "Supply gap";
      const alt = data.alternatives.some(
        (a) => a.supplierId === s.id && a.approved,
      );
      const used = data.alternatives.some(
        (a) =>
          a.supplierId === s.id &&
          scenario.alternatives.some((x) => x.alternativeId === a.id),
      );
      add(
        "supplier",
        s.id,
        i,
        suppliers.length,
        0,
        s.name,
        s.region,
        used
          ? "Recovery active"
          : alt
            ? "Approved alternative"
            : "Primary supplier",
        impacted,
        used,
        flag,
      );
    });
    components.forEach((c, i) => {
      const stock = data.inventory
        .filter((x) => x.componentId === c.id)
        .reduce((s, x) => s + x.quantity, 0);
      const demand = result.orders
        .flatMap((o) => o.lines)
        .filter((l) => l.componentId === c.id)
        .reduce((s, l) => s + l.required, 0);
      add(
        "component",
        c.id,
        i,
        components.length,
        1,
        c.name,
        `${stock} on hand · ${demand} required`,
        c.id,
        riskComponents.has(c.id),
        false,
        "Short",
      );
      const sources = new Set([
        c.supplierId,
        ...result.deliveries
          .filter((d) => d.componentId === c.id)
          .map((d) => d.supplierId),
      ]);
      sources.forEach((s) =>
        edge(
          `supplier:${s}`,
          `component:${c.id}`,
          riskComponents.has(c.id) && s === c.supplierId,
        ),
      );
      data.alternatives
        .filter(
          (a) =>
            a.componentId === c.id && a.approved && !sources.has(a.supplierId),
        )
        .forEach((a) =>
          edge(`supplier:${a.supplierId}`, `component:${c.id}`, false, true),
        );
    });
    products.forEach((p, i) => {
      add(
        "product",
        p.id,
        i,
        products.length,
        2,
        p.name,
        p.sku,
        "Finished product",
        riskProducts.has(p.id),
        false,
        "At risk",
      );
      p.bom
        .filter((b) => componentIds.has(b.componentId))
        .forEach((b) =>
          edge(
            `component:${b.componentId}`,
            `product:${p.id}`,
            result.orders.some(
              (o) =>
                o.productId === p.id &&
                o.lines.some(
                  (l) => l.componentId === b.componentId && l.shortage > 0,
                ),
            ),
          ),
        );
    });
    orders.forEach((o, i) => {
      const r = result.orders.find((x) => x.orderId === o.id)!;
      const shortage = r.lines.reduce((s, l) => s + l.shortage, 0);
      add(
        "order",
        o.id,
        i,
        orders.length,
        3,
        o.id,
        `${o.customer} · needed ${shortDay(o.requiredDate)}`,
        shortage
          ? `Short ${shortage} unit${shortage === 1 ? "" : "s"}`
          : "Covered",
        r.status === "at-risk",
      );
      edge(`product:${o.productId}`, `order:${o.id}`, r.status === "at-risk");
    });
    return { nodes, edges };
  }, [data, result, scenario, full, focused, selected]);
  return (
    <section
      className="graph-section"
      aria-label="Interactive supply chain dependencies"
    >
      <div className="graph-toolbar">
        <h2>From supplier to customer order</h2>
        <div className="graph-actions">
          <label htmlFor="focus-component">Component</label>
          <select
            id="focus-component"
            value={focused}
            onChange={(e) => {
              setComponentFocus(e.target.value);
              setFull(false);
            }}
          >
            {data.components.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => setFull(!full)}>
            <Focus data-icon="inline-start" />
            {full ? "Focus chain" : "Full network"}
          </Button>
        </div>
      </div>
      {narrow ? (
        <div className="chain-list">
          {LANES.map(([kind, title]) => (
            <div key={kind} className="chain-lane">
              <h3>{title}</h3>
              <ul>
                {nodes
                  .filter((n) => n.data.kind === kind)
                  .map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        data-id={n.id}
                        className={`chain-item supply-node ${n.data.risk ? "is-risk" : ""} ${n.data.active ? "is-active" : ""}`}
                        onClick={() =>
                          onSelect({
                            kind: n.data.kind,
                            id: n.id.slice(n.id.indexOf(":") + 1),
                          })
                        }
                      >
                        <strong>{n.data.label}</strong>
                        <span className="node-sub">{n.data.sub}</span>
                        <span className="node-tag">
                          {n.data.tag}
                          {n.data.risk && n.data.flag
                            ? ` · ${n.data.flag}`
                            : ""}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="graph-columns" aria-hidden="true">
            {LANES.map(([kind, title]) => (
              <span key={kind}>{title}</span>
            ))}
          </div>
          <div className="graph-canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              edgesFocusable={false}
              onNodeClick={(_, n) =>
                onSelect({
                  kind: n.data.kind,
                  id: n.id.slice(n.id.indexOf(":") + 1),
                })
              }
              fitView
              minZoom={0.15}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
              colorMode={theme}
            >
              <Controls showInteractive={false} />
              <FitOnChange signature={`${full}-${focused}-${data.name}`} />
            </ReactFlow>
          </div>
        </>
      )}
      <div className="graph-legend">
        <span>
          <i className="legend-swatch covered" aria-hidden="true" />
          Covered
        </span>
        <span>
          <i className="legend-swatch hatch" aria-hidden="true" />
          Short or late
        </span>
        <span>
          <i className="legend-dash" aria-hidden="true" />
          Approved alternative
        </span>
        <span className="graph-hint">Select any card for its details</span>
      </div>
      {focused && (
        <ReceiptTimeline
          data={data}
          result={result}
          scenario={scenario}
          componentId={focused}
          onMoveReceipt={onMoveReceipt}
        />
      )}
    </section>
  );
}
export function SupplyGraph(props: Parameters<typeof GraphInner>[0]) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}
