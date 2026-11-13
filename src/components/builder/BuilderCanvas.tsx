import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useInternalNode,
  useStore,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeChange,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { canConnect } from "@/lib/builder/connections";
import { nodeKey } from "@/lib/builder/factories";
import type {
  BuilderDocument,
  BuilderViewport,
  NodeKey,
} from "@/lib/builder/types";
import { BuilderNode, type BuilderFlowNode } from "./BuilderNode";
import {
  candidateFromHandles,
  RELATIONSHIP_COLORS,
  type ApplyConnectionResult,
  type BuilderSelection,
  type RelationshipCandidate,
} from "./documentEdits";

const NODE_TYPES = { builder: BuilderNode };

export type BuilderCanvasProps = {
  document: BuilderDocument;
  selection: BuilderSelection;
  revealNodeKey: NodeKey | null;
  onViewportChange: (viewport: BuilderViewport) => void;
  summaries: Map<NodeKey, { title: string; details: string[] }>;
  issueCounts: Map<NodeKey, number>;
  edgeLabels: Map<string, string>;
  onSelect: (selection: BuilderSelection) => void;
  onMoveNodes: (
    moves: { key: NodeKey; position: { x: number; y: number } }[],
  ) => void;
  onConnect: (candidate: RelationshipCandidate) => ApplyConnectionResult;
};

export function BuilderCanvas({
  document,
  selection,
  revealNodeKey,
  onViewportChange,
  summaries,
  issueCounts,
  edgeLabels,
  onSelect,
  onMoveNodes,
  onConnect,
}: BuilderCanvasProps) {
  // Positions currently being dragged. Cleared on drag stop, which commits
  // them as layout-only changes; the document revision never moves for drags.
  const [livePositions, setLivePositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const nodes = useMemo<BuilderFlowNode[]>(
    () =>
      document.nodes.map((node) => {
        const key = nodeKey(node);
        const summary = summaries.get(key) ?? { title: key, details: [] };
        return {
          id: key,
          type: "builder",
          position: livePositions[key] ?? node.position,
          selected: selection?.type === "node" && selection.key === key,
          deletable: false,
          data: {
            nodeKey: key,
            kind: node.kind,
            title: summary.title,
            details: summary.details,
            issueCount: issueCounts.get(key) ?? 0,
          },
        };
      }),
    [document.nodes, summaries, issueCounts, livePositions, selection],
  );

  const edges = useMemo<Edge[]>(
    () =>
      document.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.kind,
        targetHandle: edge.kind,
        type: "smoothstep",
        label: edgeLabels.get(edge.id),
        selected: selection?.type === "edge" && selection.id === edge.id,
        deletable: false,
        className: `builder-edge builder-edge--${edge.kind}${
          edge.kind === "bom" && !edge.quantity.trim() ? " is-missing" : ""
        }`,
        style: { "--rel": RELATIONSHIP_COLORS[edge.kind] } as CSSProperties,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: RELATIONSHIP_COLORS[edge.kind],
        },
      })),
    [document.edges, edgeLabels, selection],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<BuilderFlowNode>[]) => {
      // Only position updates matter; selection is owned by this component.
      const moving = changes.filter(
        (
          change,
        ): change is Extract<
          NodeChange<BuilderFlowNode>,
          { type: "position" }
        > => change.type === "position" && change.position !== undefined,
      );
      if (moving.length === 0) return;
      setLivePositions((previous) => {
        const next = { ...previous };
        for (const change of moving) {
          next[change.id] = change.position!;
        }
        return next;
      });
    },
    [],
  );

  const handleDragStop = useCallback<
    NonNullable<Parameters<typeof ReactFlow>[0]["onNodeDragStop"]>
  >(
    (_event, _node, dragged) => {
      onMoveNodes(
        dragged.map((node) => ({
          key: node.id,
          position: { x: node.position.x, y: node.position.y },
        })),
      );
      setLivePositions({});
    },
    [onMoveNodes],
  );

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      const candidate = candidateFromHandles(
        connection.source,
        connection.target,
        connection.sourceHandle,
        connection.targetHandle,
      );
      return candidate !== null && canConnect(document, candidate).ok;
    },
    [document],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const candidate = candidateFromHandles(
        connection.source,
        connection.target,
        connection.sourceHandle,
        connection.targetHandle,
      );
      if (!candidate) return;
      const result = onConnect(candidate);
      if (result.ok) onSelect({ type: "edge", id: result.edgeId });
    },
    [onConnect, onSelect],
  );

  const handleNodeClick = useCallback<NodeMouseHandler<BuilderFlowNode>>(
    (_event, node) => onSelect({ type: "node", key: node.id }),
    [onSelect],
  );

  const handleEdgeClick = useCallback<EdgeMouseHandler>(
    (_event, edge) => onSelect({ type: "edge", id: edge.id }),
    [onSelect],
  );

  return (
    <div className="builder-canvas" data-testid="builder-canvas">
      <ReactFlow<BuilderFlowNode, Edge>
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={handleNodesChange}
        onNodeDragStop={handleDragStop}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={() => onSelect(null)}
        deleteKeyCode={null}
        defaultViewport={document.viewport}
        fitView={!document.viewport}
        onMoveEnd={(_event, viewport) => onViewportChange(viewport)}
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        aria-label="Supply network canvas"
      >
        <RevealAddedNode nodeKey={revealNodeKey} />
        <Background gap={24} size={1} />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

/** Only an explicit palette addition changes the view. Field edits, selection
 * and manual node moves must leave the user's framing alone. */
function RevealAddedNode({ nodeKey }: { nodeKey: NodeKey | null }) {
  const node = useInternalNode(nodeKey ?? "");
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  const { setCenter, getViewport, viewportInitialized } = useReactFlow();
  const revealed = useRef<NodeKey | null>(null);
  useEffect(() => {
    const measured = node?.measured;
    if (
      !node ||
      !viewportInitialized ||
      !nodeKey ||
      revealed.current === nodeKey ||
      !measured?.width ||
      !measured.height ||
      !width ||
      !height
    )
      return;
    revealed.current = nodeKey;
    const zoom = Math.max(
      0.4,
      Math.min(
        getViewport().zoom,
        width / (measured.width + 64),
        height / (measured.height + 64),
      ),
    );
    void setCenter(
      node.internals.positionAbsolute.x + measured.width / 2,
      node.internals.positionAbsolute.y + measured.height / 2,
      { zoom },
    );
  }, [
    node,
    nodeKey,
    width,
    height,
    viewportInitialized,
    setCenter,
    getViewport,
  ]);
  return null;
}
