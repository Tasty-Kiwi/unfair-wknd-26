import { useMemo, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
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
import {
  Factory,
  Box,
  Cog,
  ClipboardList,
  Check,
  TriangleAlert,
  PackageCheck,
  Focus,
} from "lucide-react";
import type { Dataset, SimulationResult, Scenario } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
          <Icon size={16} />
        </span>
        <span className="node-tag">{data.tag}</span>
        {data.risk ? (
          <TriangleAlert size={14} className="risk-text" />
        ) : (
          <Check size={14} className="node-check" />
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
      () => void fitView({ padding: 0.15, duration: 250, maxZoom: 1.05 }),
      50,
    );
    return () => clearTimeout(t);
  }, [signature, width, height, fitView]);
  return null;
}

function GraphInner({
  data,
  result,
  scenario,
  onSelect,
  selected,
}: {
  data: Dataset;
  result: SimulationResult;
  scenario: Scenario;
  onSelect: (s: Selection) => void;
  selected: Selection | null;
}) {
  const [full, setFull] = useState(false);
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
    ) =>
      nodes.push({
        id: `${kind}:${id}`,
        type: "supply",
        position: {
          x: col * 260,
          y: i * step + ((maxRows - count) * step) / 2,
        },
        data: { label, sub, tag, kind, risk, active },
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
        animated: risk,
        style: {
          stroke: risk ? "var(--risk)" : alt ? "var(--success)" : "#485467",
          strokeWidth: risk ? 2.5 : 1.5,
          strokeDasharray: alt ? "5 4" : undefined,
        },
        className: risk ? "edge-risk" : undefined,
      });
    };
    suppliers.forEach((s, i) => {
      const impacted = components.some(
        (c) => c.supplierId === s.id && riskComponents.has(c.id),
      );
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
          ? "RECOVERY ACTIVE"
          : alt
            ? "APPROVED ALTERNATIVE"
            : "PRIMARY SUPPLIER",
        impacted,
        used,
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
        "FINISHED PRODUCT",
        riskProducts.has(p.id),
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
        `${o.customer} · ${o.requiredDate.slice(5).replace("-", "/")}`,
        shortage ? `${shortage} UNITS SHORT` : "MATERIAL COVERED",
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
        <div>
          <span className="eyebrow">DEPENDENCY MAP</span>
          <h2>
            Trace the domino effect
            <span className="live-dot" />
          </h2>
        </div>
        <div className="graph-actions">
          <label className="sr-only" htmlFor="focus-component">
            Focus component
          </label>
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
      <div className="graph-columns">
        <span>01 / SUPPLIERS</span>
        <span>02 / COMPONENTS</span>
        <span>03 / PRODUCTS</span>
        <span>04 / CUSTOMER ORDERS</span>
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
          colorMode="dark"
        >
          <Background gap={24} size={1} color="#2b3440" />
          <Controls showInteractive={false} />
          <FitOnChange signature={`${full}-${focused}-${data.name}`} />
        </ReactFlow>
      </div>
      <div className="graph-legend">
        <span>
          <i className="legend-dot covered" />
          Material covered
        </span>
        <span>
          <i className="legend-dot risk" />
          Verified shortage impact
        </span>
        <span>
          <i className="legend-dash" />
          Approved alternative
        </span>
        <span className="graph-hint">
          <PackageCheck size={13} />
          Click any node to inspect
        </span>
      </div>
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
