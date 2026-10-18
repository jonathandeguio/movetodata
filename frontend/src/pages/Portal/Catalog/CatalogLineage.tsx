// @ts-ignore — dagre n'a pas de types publiés dans ce projet
import * as dagre from "dagre";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Card,
  List,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import {
  getLineage,
  LineageData,
  LineageEdge,
  LineageEntityRef,
} from "../../../services/catalogService";

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Minimal dagre type declarations (no @types/dagre installed)
// ---------------------------------------------------------------------------

interface DagreNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DagreGraph {
  width?: number;
  height?: number;
}

interface DagreGraphInstance {
  setGraph(opts: Record<string, unknown>): void;
  setDefaultEdgeLabel(fn: () => Record<string, unknown>): void;
  setNode(id: string, opts: { width: number; height: number }): void;
  setEdge(from: string, to: string): void;
  node(id: string): DagreNode;
  graph(): DagreGraph;
}

interface DagreModule {
  graphlib: { Graph: new () => DagreGraphInstance };
  layout(g: DagreGraphInstance): void;
}

// ---------------------------------------------------------------------------
// Dagre-based SVG layout helpers
// ---------------------------------------------------------------------------
// dagre is already installed (package.json). We use it only to compute
// node positions; rendering is done with plain SVG — no extra library.
// ---------------------------------------------------------------------------

const NODE_WIDTH = 180;
const NODE_HEIGHT = 48;

interface LayoutNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
}

interface LayoutEdge {
  from: string;
  to: string;
}

function buildLayout(
  lineage: LineageData
): { nodes: LayoutNode[]; edges: LayoutEdge[]; width: number; height: number } {
  const dagreLib = dagre as unknown as DagreModule;

  const g = new dagreLib.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  const nodeMap = new Map<string, LineageEntityRef>();

  // Central entity
  const center: LineageEntityRef = {
    id: lineage.entity.id,
    name: lineage.entity.name,
    type: "dataProduct",
  };
  nodeMap.set(center.id, center);

  (lineage.upstreamEdges ?? []).forEach((e: LineageEdge) => {
    nodeMap.set(e.fromEntity.id, e.fromEntity);
    nodeMap.set(e.toEntity.id, e.toEntity);
  });
  (lineage.downstreamEdges ?? []).forEach((e: LineageEdge) => {
    nodeMap.set(e.fromEntity.id, e.fromEntity);
    nodeMap.set(e.toEntity.id, e.toEntity);
  });

  nodeMap.forEach((_, id) => {
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  const layoutEdges: LayoutEdge[] = [];

  (lineage.upstreamEdges ?? []).forEach((e: LineageEdge) => {
    g.setEdge(e.fromEntity.id, e.toEntity.id);
    layoutEdges.push({ from: e.fromEntity.id, to: e.toEntity.id });
  });
  (lineage.downstreamEdges ?? []).forEach((e: LineageEdge) => {
    g.setEdge(e.fromEntity.id, e.toEntity.id);
    const already = layoutEdges.find(
      (le) => le.from === e.fromEntity.id && le.to === e.toEntity.id
    );
    if (!already) {
      layoutEdges.push({ from: e.fromEntity.id, to: e.toEntity.id });
    }
  });

  dagreLib.layout(g);

  const nodes: LayoutNode[] = [];
  nodeMap.forEach((ref, id) => {
    const pos = g.node(id);
    nodes.push({
      id,
      label: ref.name,
      type: ref.type,
      x: pos.x - NODE_WIDTH / 2,
      y: pos.y - NODE_HEIGHT / 2,
    });
  });

  const graphInfo = g.graph();
  const width = (graphInfo.width ?? 400) + 40;
  const height = (graphInfo.height ?? 200) + 40;

  return { nodes, edges: layoutEdges, width, height };
}

// ---------------------------------------------------------------------------
// SVG arrow marker
// ---------------------------------------------------------------------------

const MARKER_ID = "mtd-arrow";

function ArrowMarker(): React.ReactElement {
  return (
    <defs>
      <marker
        id={MARKER_ID}
        markerWidth="8"
        markerHeight="8"
        refX="7"
        refY="3"
        orient="auto"
      >
        <path d="M0,0 L0,6 L8,3 z" fill="#24527a" />
      </marker>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// SVG graph component
// ---------------------------------------------------------------------------

interface LineageGraphProps {
  lineage: LineageData;
}

const LineageGraph: React.FC<LineageGraphProps> = ({ lineage }) => {
  const { nodes, edges, width, height } = buildLayout(lineage);

  const nodeById = new Map<string, LayoutNode>(nodes.map((n) => [n.id, n]));
  const centerId = lineage.entity.id;

  return (
    <svg
      width={width + 20}
      height={height + 20}
      style={{ display: "block", overflow: "visible" }}
    >
      <ArrowMarker />

      {/* Edges */}
      {edges.map((e, i) => {
        const from = nodeById.get(e.from);
        const to = nodeById.get(e.to);
        if (!from || !to) return null;
        const x1 = from.x + NODE_WIDTH;
        const y1 = from.y + NODE_HEIGHT / 2;
        const x2 = to.x;
        const y2 = to.y + NODE_HEIGHT / 2;
        const cx = (x1 + x2) / 2;
        return (
          <path
            key={i}
            d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
            fill="none"
            stroke="#24527a"
            strokeWidth={1.5}
            markerEnd={`url(#${MARKER_ID})`}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const isCenter = node.id === centerId;
        return (
          <g key={node.id} transform={`translate(${node.x + 10},${node.y + 10})`}>
            <rect
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={5}
              ry={5}
              fill={isCenter ? "#24527a" : "#f0f5ff"}
              stroke={isCenter ? "#0d1117" : "#24527a"}
              strokeWidth={isCenter ? 2 : 1}
            />
            <text
              x={NODE_WIDTH / 2}
              y={NODE_HEIGHT / 2 + 4}
              textAnchor="middle"
              fontSize={12}
              fontFamily="Poppins, sans-serif"
              fill={isCenter ? "#ffffff" : "#0d1117"}
            >
              {node.label.length > 22
                ? `${node.label.slice(0, 20)}…`
                : node.label}
            </text>
            {!isCenter && (
              <text
                x={NODE_WIDTH / 2}
                y={NODE_HEIGHT - 6}
                textAnchor="middle"
                fontSize={9}
                fontFamily="Poppins, sans-serif"
                fill="#24527a"
              >
                {node.type}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const CatalogLineage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lineage, setLineage] = useState<LineageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getLineage(id)
      .then((data) => {
        if (!cancelled) setLineage(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Erreur inconnue";
          setError(
            `Impossible de charger le lignage : ${message}. Vérifiez que REACT_APP_OPENMETADATA_URL est correctement configurée.`
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const upstreamNodes = lineage?.upstreamEdges?.map((e) => e.fromEntity) ?? [];
  const downstreamNodes = lineage?.downstreamEdges?.map((e) => e.toEntity) ?? [];

  return (
    <div className="site-card-wrapper" style={{ margin: "5px 0", padding: "0 16px" }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <span
                style={{ cursor: "pointer", color: "#24527a" }}
                onClick={() => navigate("/portal/catalog/search")}
              >
                Catalogue
              </span>
            ),
          },
          { title: "Lignage" },
        ]}
      />

      <Title level={3} style={{ marginBottom: 16 }}>
        Lignage — {lineage?.entity?.name ?? id}
      </Title>

      {error && (
        <Alert
          type="error"
          message="Erreur de chargement"
          description={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        {lineage && (
          <>
            {/* SVG graph */}
            <Card
              bordered={false}
              style={{ marginBottom: 16, overflowX: "auto" }}
            >
              <LineageGraph lineage={lineage} />
            </Card>

            {/* Textual lists */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Card
                title={
                  <Text strong>
                    Upstream{" "}
                    <Tag color="geekblue" style={{ borderRadius: 2 }}>
                      {upstreamNodes.length}
                    </Tag>
                  </Text>
                }
                bordered={false}
              >
                {upstreamNodes.length === 0 ? (
                  <Text type="secondary">Aucun nœud upstream</Text>
                ) : (
                  <List
                    size="small"
                    dataSource={upstreamNodes}
                    renderItem={(node) => (
                      <List.Item key={node.id}>
                        <Text>{node.name}</Text>
                        <Tag
                          style={{ marginLeft: 8, borderRadius: 2 }}
                          color="default"
                        >
                          {node.type}
                        </Tag>
                      </List.Item>
                    )}
                  />
                )}
              </Card>

              <Card
                title={
                  <Text strong>
                    Downstream{" "}
                    <Tag color="green" style={{ borderRadius: 2 }}>
                      {downstreamNodes.length}
                    </Tag>
                  </Text>
                }
                bordered={false}
              >
                {downstreamNodes.length === 0 ? (
                  <Text type="secondary">Aucun nœud downstream</Text>
                ) : (
                  <List
                    size="small"
                    dataSource={downstreamNodes}
                    renderItem={(node) => (
                      <List.Item key={node.id}>
                        <Text>{node.name}</Text>
                        <Tag
                          style={{ marginLeft: 8, borderRadius: 2 }}
                          color="default"
                        >
                          {node.type}
                        </Tag>
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </div>
          </>
        )}
      </Spin>
    </div>
  );
};

export default CatalogLineage;
