// @ts-ignore — dagre n'a pas de types publiés dans ce projet
import * as dagre from 'dagre';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Breadcrumb,
  Button,
  Descriptions,
  InputNumber,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  CloseOutlined,
  FullscreenOutlined,
  NodeIndexOutlined,
  PictureOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  getLineageGraph,
  type LineageGraph,
  type LineageGraphEdge,
  type LineageGraphNode,
} from '../../../services/catalogService';
import { boslerColors } from './theme/boslerTokens';

const { Text, Title } = Typography;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NODE_WIDTH  = 180;
const NODE_HEIGHT = 84;
const PADDING     = 40;

const MARKER_FOCUS     = 'mtd-arrow-focus';
const MARKER_SECONDARY = 'mtd-arrow-secondary';

// ---------------------------------------------------------------------------
// Minimal dagre type declarations
// ---------------------------------------------------------------------------

interface DagreNode { x: number; y: number; width: number; height: number }
interface DagreGraph { width?: number; height?: number }
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
// Layout computation
// ---------------------------------------------------------------------------

interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
  svgWidth: number;
  svgHeight: number;
}

function buildLayout(nodes: LineageGraphNode[], edges: LineageGraphEdge[]): LayoutResult {
  if (nodes.length === 0) {
    return { positions: new Map(), svgWidth: 400, svgHeight: 300 };
  }

  const dagreLib = dagre as unknown as DagreModule;
  const g        = new dagreLib.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((e) => {
    // Only add valid edges (both endpoints in the node list)
    const hasSource = nodes.some((n) => n.id === e.sourceId);
    const hasTarget = nodes.some((n) => n.id === e.targetId);
    if (hasSource && hasTarget) {
      g.setEdge(e.sourceId, e.targetId);
    }
  });

  dagreLib.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => {
    const pos = g.node(n.id);
    if (pos) {
      positions.set(n.id, {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      });
    }
  });

  const info = g.graph();
  return {
    positions,
    svgWidth:  (info.width  ?? 400) + PADDING * 2,
    svgHeight: (info.height ?? 200) + PADDING * 2,
  };
}

// ---------------------------------------------------------------------------
// Node type icon (inline SVG)
// ---------------------------------------------------------------------------

function TypeIcon({
  type,
  x,
  y,
  color,
}: {
  type: string;
  x: number;
  y: number;
  color: string;
}): React.ReactElement {
  const t = `translate(${x},${y})`;
  switch (type) {
    case 'DATASET':
      // Cylinder shape
      return (
        <g transform={t} aria-hidden="true">
          <rect x="1" y="4" width="14" height="8" rx="1" fill={color} />
          <ellipse cx="8" cy="4"  rx="7" ry="2" fill={color} />
          <ellipse cx="8" cy="12" rx="7" ry="2" fill={color} />
        </g>
      );
    case 'TRANSFORMATION':
      // Gear outline
      return (
        <g transform={t} aria-hidden="true">
          <circle cx="8" cy="8" r="4.5" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="8" cy="8" r="1.5" fill={color} />
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1  = 8 + Math.cos(rad) * 4.5;
            const y1  = 8 + Math.sin(rad) * 4.5;
            const x2  = 8 + Math.cos(rad) * 7;
            const y2  = 8 + Math.sin(rad) * 7;
            return (
              <line
                key={angle}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color} strokeWidth="2.5" strokeLinecap="round"
              />
            );
          })}
        </g>
      );
    case 'DATA_PRODUCT':
      // Cube
      return (
        <g transform={t} aria-hidden="true">
          <rect x="3" y="5" width="9" height="9" rx="1" fill={color} />
          <path d="M12,5 L14,3 L7,3 L5,5" fill={color} opacity="0.7" />
          <path d="M12,5 L14,3 L14,12 L12,14" fill={color} opacity="0.5" />
        </g>
      );
    case 'DASHBOARD':
      // Bar chart
      return (
        <g transform={t} aria-hidden="true">
          <rect x="1"  y="9"  width="3" height="5" rx="0.5" fill={color} />
          <rect x="6"  y="5"  width="3" height="9" rx="0.5" fill={color} />
          <rect x="11" y="7"  width="3" height="7" rx="0.5" fill={color} />
          <line x1="1" y1="14" x2="14" y2="14" stroke={color} strokeWidth="1" />
        </g>
      );
    default:
      return <circle transform={t} cx="8" cy="8" r="6" fill={color} aria-hidden="true" />;
  }
}

// ---------------------------------------------------------------------------
// Quality badge helpers
// ---------------------------------------------------------------------------

function qualityFill(level: string): string {
  if (level === 'GOLD')   return boslerColors.qualityGoldBg;
  if (level === 'SILVER') return boslerColors.qualitySilverBg;
  if (level === 'BRONZE') return boslerColors.qualityBronzeBg;
  return '#eef1f4';
}

function qualityText(level: string): string {
  if (level === 'GOLD')   return boslerColors.qualityGoldText;
  if (level === 'SILVER') return boslerColors.qualitySilverText;
  if (level === 'BRONZE') return boslerColors.qualityBronzeText;
  return boslerColors.textMuted;
}

// ---------------------------------------------------------------------------
// SVG Node component
// ---------------------------------------------------------------------------

interface NodeProps {
  node: LineageGraphNode;
  x: number;
  y: number;
  isSelected: boolean;
  onClick: (id: string) => void;
}

function SvgNode({ node, x, y, isSelected, onClick }: NodeProps): React.ReactElement {
  const isFocus = node.isFocus;
  const isTransfo = node.type === 'TRANSFORMATION';

  const fillColor    = isFocus ? boslerColors.primary : boslerColors.card;
  const strokeColor  = isSelected
    ? boslerColors.primary
    : isTransfo
    ? boslerColors.textSecondary
    : boslerColors.cardBorder;
  const strokeWidth  = isSelected ? 2 : 1;
  const strokeDash   = isTransfo ? '4' : undefined;
  const textColor    = isFocus ? '#ffffff' : boslerColors.text;
  const subTextColor = isFocus ? 'rgba(255,255,255,0.65)' : boslerColors.textMuted;
  const iconColor    = isFocus ? '#ffffff' : boslerColors.primary;

  const truncated = node.name.length > 20 ? `${node.name.slice(0, 20)}…` : node.name;

  const handleClick = () => onClick(node.id);
  const handleKeyDown = (e: React.KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(node.id);
    }
  };

  return (
    <g
      transform={`translate(${x + PADDING},${y + PADDING})`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Nœud ${node.name} (${node.type}${node.isFocus ? ', focus' : ''})`}
      aria-pressed={isSelected}
      style={{ cursor: 'pointer', outline: 'none' }}
    >
      {/* Background rect */}
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={5}
        ry={5}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
      />
      {/* Hover / focus ring (shown via CSS :focus-visible) */}
      {isSelected && (
        <rect
          width={NODE_WIDTH + 4}
          height={NODE_HEIGHT + 4}
          x={-2}
          y={-2}
          rx={6}
          ry={6}
          fill="none"
          stroke={boslerColors.primary}
          strokeWidth={1.5}
          opacity={0.4}
        />
      )}

      {/* Type icon — 16×16 at left center */}
      <TypeIcon
        type={node.type}
        x={12}
        y={(NODE_HEIGHT - 16) / 2}
        color={iconColor}
      />

      {/* Name */}
      <text
        x={36}
        y={NODE_HEIGHT / 2 - 6}
        fontSize={12}
        fontFamily='"Poppins", system-ui, -apple-system, sans-serif'
        fill={textColor}
        fontWeight={isFocus ? 600 : 400}
      >
        {truncated}
      </text>

      {/* Type label */}
      <text
        x={36}
        y={NODE_HEIGHT / 2 + 10}
        fontSize={9}
        fontFamily='"Poppins", system-ui, -apple-system, sans-serif'
        fill={subTextColor}
      >
        {node.type}
      </text>

      {/* Quality badge for DATA_PRODUCT */}
      {node.type === 'DATA_PRODUCT' && node.qualityLevel && (
        <g>
          <rect
            x={NODE_WIDTH - 46}
            y={NODE_HEIGHT - 20}
            width={38}
            height={14}
            rx={2}
            fill={qualityFill(node.qualityLevel)}
          />
          <text
            x={NODE_WIDTH - 27}
            y={NODE_HEIGHT - 9}
            textAnchor="middle"
            fontSize={8}
            fontFamily='"Poppins", system-ui, -apple-system, sans-serif'
            fill={qualityText(node.qualityLevel)}
            fontWeight={600}
          >
            {node.qualityLevel}
          </text>
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// SVG Arrow markers
// ---------------------------------------------------------------------------

function ArrowMarkers(): React.ReactElement {
  return (
    <defs>
      <marker
        id={MARKER_FOCUS}
        markerWidth="8" markerHeight="8"
        refX="7" refY="3"
        orient="auto"
      >
        <path d="M0,0 L0,6 L8,3 z" fill={boslerColors.primary} />
      </marker>
      <marker
        id={MARKER_SECONDARY}
        markerWidth="8" markerHeight="8"
        refX="7" refY="3"
        orient="auto"
      >
        <path d="M0,0 L0,6 L8,3 z" fill="#b7c2ce" />
      </marker>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Legend panel
// ---------------------------------------------------------------------------

function LegendPanel(): React.ReactElement {
  const legendNodes = [
    { type: 'DATASET',       label: 'Dataset source',     style: { border: `1px solid ${boslerColors.cardBorder}`, background: boslerColors.card } },
    { type: 'TRANSFORMATION',label: 'Transformation',      style: { border: `1px dashed ${boslerColors.textSecondary}`, background: boslerColors.card } },
    { type: 'DATA_PRODUCT',  label: 'Data Product (focus)',style: { background: boslerColors.primary, color: '#fff' } },
    { type: 'DASHBOARD',     label: 'Dashboard',           style: { border: `1px solid ${boslerColors.cardBorder}`, background: boslerColors.card } },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: boslerColors.card,
        border: `1px solid ${boslerColors.cardBorder}`,
        borderRadius: 5,
        padding: '12px 16px',
        zIndex: 10,
        minWidth: 220,
      }}
    >
      <Text strong style={{ display: 'block', marginBottom: 8, color: boslerColors.textTitle, fontSize: 12 }}>
        Légende
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {legendNodes.map((item) => (
          <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 20,
                height: 12,
                borderRadius: 2,
                flexShrink: 0,
                ...item.style,
              }}
            />
            <Text style={{ fontSize: 11, color: boslerColors.textSecondary }}>{item.label}</Text>
          </div>
        ))}
        <div style={{ marginTop: 4, borderTop: `1px solid ${boslerColors.separator}`, paddingTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="40" height="10">
              <line x1="0" y1="5" x2="38" y2="5" stroke={boslerColors.primary} strokeWidth="2" />
            </svg>
            <Text style={{ fontSize: 11, color: boslerColors.textSecondary }}>Chemin principal</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <svg width="40" height="10">
              <line x1="0" y1="5" x2="38" y2="5" stroke="#b7c2ce" strokeWidth="1" strokeDasharray="4" />
            </svg>
            <Text style={{ fontSize: 11, color: boslerColors.textSecondary }}>Dépendance secondaire</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  node: LineageGraphNode;
  nodeMap: Map<string, LineageGraphNode>;
  onClose: () => void;
  onSelectNode: (id: string) => void;
  productName: string;
}

function DetailPanel({
  node,
  nodeMap,
  onClose,
  onSelectNode,
  productName,
}: DetailPanelProps): React.ReactElement {
  const navigate = useNavigate();

  const inputNodes  = node.inputIds.map((id) => nodeMap.get(id)).filter(Boolean) as LineageGraphNode[];
  const outputNodes = node.outputIds.map((id) => nodeMap.get(id)).filter(Boolean) as LineageGraphNode[];

  const typeColors: Record<string, string> = {
    DATASET:        'blue',
    TRANSFORMATION: 'orange',
    DATA_PRODUCT:   'geekblue',
    DASHBOARD:      'green',
  };

  return (
    <div
      role="complementary"
      aria-label={`Détails du nœud ${node.name}`}
      style={{
        width: 320,
        minWidth: 320,
        borderLeft: `1px solid ${boslerColors.cardBorder}`,
        padding: '16px',
        overflowY: 'auto',
        background: boslerColors.card,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text
            strong
            style={{ fontSize: 14, color: boslerColors.textTitle, display: 'block', lineHeight: 1.4 }}
          >
            {node.name}
          </Text>
          <Tag
            color={typeColors[node.type] ?? 'default'}
            style={{ marginTop: 4, borderRadius: 2, fontSize: 11 }}
          >
            {node.type}
          </Tag>
        </div>
        <Button
          type="text"
          icon={<CloseOutlined />}
          size="small"
          onClick={onClose}
          aria-label="Fermer le panneau de détail"
          style={{ color: boslerColors.textMuted, flexShrink: 0 }}
        />
      </div>

      {/* Transformation metadata */}
      {(node.engine || node.lastRunAt || node.durationMs != null) && (
        <Descriptions
          column={1}
          size="small"
          labelStyle={{ color: boslerColors.textMuted, fontSize: 11 }}
          contentStyle={{ color: boslerColors.text, fontSize: 12 }}
          style={{ marginTop: 0 }}
        >
          {node.engine && (
            <Descriptions.Item label="Moteur">{node.engine}</Descriptions.Item>
          )}
          {node.lastRunAt && (
            <Descriptions.Item label="Dernière exécution">
              {new Date(node.lastRunAt).toLocaleString('fr-FR')}
            </Descriptions.Item>
          )}
          {node.durationMs != null && (
            <Descriptions.Item label="Durée">
              {node.durationMs < 1000
                ? `${node.durationMs} ms`
                : `${(node.durationMs / 1000).toFixed(1)} s`}
            </Descriptions.Item>
          )}
          {node.inputRows != null && (
            <Descriptions.Item label="Lignes entrée">
              {node.inputRows.toLocaleString('fr-FR')}
            </Descriptions.Item>
          )}
          {node.outputRows != null && (
            <Descriptions.Item label="Lignes sortie">
              {node.outputRows.toLocaleString('fr-FR')}
            </Descriptions.Item>
          )}
        </Descriptions>
      )}

      {/* Input nodes */}
      {inputNodes.length > 0 && (
        <div>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: boslerColors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Sources ({inputNodes.length})
          </Text>
          {inputNodes.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 0',
                cursor: 'pointer',
              }}
              onClick={() => onSelectNode(n.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelectNode(n.id); }}
              role="button"
              tabIndex={0}
              aria-label={`Aller au nœud ${n.name}`}
            >
              <Tag color={typeColors[n.type] ?? 'default'} style={{ borderRadius: 2, fontSize: 10, margin: 0 }}>
                {n.type.slice(0, 3)}
              </Tag>
              <Text
                style={{
                  fontSize: 12,
                  color: boslerColors.primary,
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 200,
                }}
              >
                {n.name}
              </Text>
            </div>
          ))}
        </div>
      )}

      {/* Output nodes */}
      {outputNodes.length > 0 && (
        <div>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: boslerColors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Destinations ({outputNodes.length})
          </Text>
          {outputNodes.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 0',
                cursor: 'pointer',
              }}
              onClick={() => onSelectNode(n.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelectNode(n.id); }}
              role="button"
              tabIndex={0}
              aria-label={`Aller au nœud ${n.name}`}
            >
              <Tag color={typeColors[n.type] ?? 'default'} style={{ borderRadius: 2, fontSize: 10, margin: 0 }}>
                {n.type.slice(0, 3)}
              </Tag>
              <Text
                style={{
                  fontSize: 12,
                  color: boslerColors.primary,
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 200,
                }}
              >
                {n.name}
              </Text>
            </div>
          ))}
        </div>
      )}

      {/* Voir la fiche button for DATA_PRODUCT */}
      {node.type === 'DATA_PRODUCT' && (
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${boslerColors.separator}` }}>
          {node.isFocus ? (
            <Text style={{ fontSize: 12, color: boslerColors.textMuted }}>
              Vous visualisez le lignage de ce Data Product.
            </Text>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<NodeIndexOutlined />}
              onClick={() => navigate(`/portal/catalog/data-product/${encodeURIComponent(node.name)}`)}
              style={{ borderRadius: 2 }}
            >
              Voir la fiche
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const CatalogLineage: React.FC = () => {
  const { id: nameParam } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Controls
  const [depthUpstream,   setDepthUpstream]   = useState(2);
  const [depthDownstream, setDepthDownstream] = useState(2);

  // Data
  const [graph,   setGraph]   = useState<LineageGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showLegend,     setShowLegend]     = useState(false);

  // Zoom / pan
  const [transform,  setTransform]  = useState({ x: PADDING, y: PADDING, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

  const svgRef = useRef<SVGSVGElement>(null);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadGraph = useCallback(() => {
    if (!nameParam) return;
    setLoading(true);
    setError(null);
    getLineageGraph(nameParam, depthUpstream, depthDownstream)
      .then((data) => {
        setGraph(data);
        // Reset pan/zoom when new data arrives
        setTransform({ x: PADDING, y: PADDING, scale: 1 });
        setSelectedNodeId(null);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(`Impossible de charger le lignage : ${msg}`);
      })
      .finally(() => setLoading(false));
  }, [nameParam, depthUpstream, depthDownstream]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // ---------------------------------------------------------------------------
  // Layout (memoized)
  // ---------------------------------------------------------------------------

  const { positions, svgWidth, svgHeight } = useMemo(
    () => (graph ? buildLayout(graph.nodes, graph.edges) : { positions: new Map(), svgWidth: 400, svgHeight: 300 }),
    [graph]
  );

  const nodeMap = useMemo(
    () => new Map<string, LineageGraphNode>((graph?.nodes ?? []).map((n) => [n.id, n])),
    [graph]
  );

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;

  // ---------------------------------------------------------------------------
  // Export PNG
  // ---------------------------------------------------------------------------

  const handleExportPng = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url      = URL.createObjectURL(svgBlob);
    const img      = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = svgEl.clientWidth  || 800;
      canvas.height = svgEl.clientHeight || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = boslerColors.pageBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a      = document.createElement('a');
      a.download   = `lineage-${nameParam ?? 'export'}.png`;
      a.href       = pngUrl;
      a.click();
    };
    img.src = url;
  };

  // ---------------------------------------------------------------------------
  // Zoom / pan handlers
  // ---------------------------------------------------------------------------

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.2, Math.min(3, prev.scale * (e.deltaY > 0 ? 0.9 : 1.1))),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only start drag when clicking on the SVG background (not on a node button)
    const target = e.target as Element;
    if (target.closest('[role="button"]')) return;
    setIsDragging(true);
    dragStartRef.current = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const { mx, my, tx, ty } = dragStartRef.current;
    setTransform((prev) => ({ ...prev, x: tx + (e.clientX - mx), y: ty + (e.clientY - my) }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleResetZoom = () => setTransform({ x: PADDING, y: PADDING, scale: 1 });

  // ---------------------------------------------------------------------------
  // Node selection
  // ---------------------------------------------------------------------------

  const handleSelectNode = (id: string) => {
    setSelectedNodeId((prev) => (prev === id ? null : id));
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const name = nameParam ?? '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        background: boslerColors.pageBg,
        overflow: 'hidden',
      }}
    >
      {/* ---- Controls bar ---- */}
      <div
        style={{
          padding: '10px 16px',
          background: boslerColors.card,
          borderBottom: `1px solid ${boslerColors.cardBorder}`,
          flexShrink: 0,
        }}
      >
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={[
            {
              title: (
                <span
                  style={{ cursor: 'pointer', color: boslerColors.primary }}
                  onClick={() => navigate('/portal/catalog/search')}
                >
                  Catalogue
                </span>
              ),
            },
            { title: 'Lignage' },
            { title: name },
          ]}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Title level={5} style={{ margin: 0, color: boslerColors.textTitle, flexShrink: 0 }}>
            Lignage — {name}
          </Title>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Depth upstream */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, color: boslerColors.textSecondary, whiteSpace: 'nowrap' }}>
                Amont :
              </Text>
              <InputNumber
                min={0}
                max={5}
                value={depthUpstream}
                onChange={(v) => setDepthUpstream(v ?? 1)}
                size="small"
                style={{ width: 56, borderRadius: 2 }}
                aria-label="Profondeur amont"
              />
            </div>

            {/* Depth downstream */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, color: boslerColors.textSecondary, whiteSpace: 'nowrap' }}>
                Aval :
              </Text>
              <InputNumber
                min={0}
                max={5}
                value={depthDownstream}
                onChange={(v) => setDepthDownstream(v ?? 1)}
                size="small"
                style={{ width: 56, borderRadius: 2 }}
                aria-label="Profondeur aval"
              />
            </div>

            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={loadGraph}
              disabled={loading}
              style={{ borderRadius: 2 }}
              aria-label="Rafraîchir le graphe"
            >
              Rafraîchir
            </Button>

            <Tooltip title="Réinitialiser le zoom">
              <Button
                size="small"
                icon={<FullscreenOutlined />}
                onClick={handleResetZoom}
                style={{ borderRadius: 2 }}
                aria-label="Réinitialiser le zoom"
              />
            </Tooltip>

            <Button
              size="small"
              icon={<PictureOutlined />}
              onClick={handleExportPng}
              disabled={!graph}
              style={{ borderRadius: 2 }}
              aria-label="Exporter en PNG"
            >
              Export PNG
            </Button>

            <Button
              size="small"
              type={showLegend ? 'primary' : 'default'}
              onClick={() => setShowLegend((v) => !v)}
              style={{ borderRadius: 2 }}
              aria-pressed={showLegend}
            >
              Légende
            </Button>
          </div>
        </div>
      </div>

      {/* ---- Main area ---- */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* SVG container */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {loading && (
            <div
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 5,
              }}
            >
              <Spin size="large" />
            </div>
          )}

          {error && (
            <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 5 }}>
              <Alert type="error" message="Erreur de chargement" description={error} showIcon />
            </div>
          )}

          {!loading && !error && graph && graph.nodes.length === 0 && (
            <div
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 8,
              }}
            >
              <NodeIndexOutlined style={{ fontSize: 32, color: boslerColors.textMuted }} />
              <Text style={{ color: boslerColors.textSecondary }}>
                Aucune dépendance de lignage trouvée pour ce Data Product.
              </Text>
              <Text style={{ color: boslerColors.textMuted, fontSize: 12 }}>
                Ajoutez des arêtes dans <code>catalog_lineage_edge</code> pour visualiser le lignage.
              </Text>
            </div>
          )}

          {!loading && !error && graph && graph.nodes.length > 0 && (
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              style={{
                display: 'block',
                cursor: isDragging ? 'grabbing' : 'grab',
                background: boslerColors.pageBg,
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              role="img"
              aria-label={`Graphe de lignage de ${name}`}
            >
              <ArrowMarkers />

              <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
                {/* Edges */}
                {graph.edges.map((edge) => {
                  const fromPos = positions.get(edge.sourceId);
                  const toPos   = positions.get(edge.targetId);
                  if (!fromPos || !toPos) return null;

                  const x1 = fromPos.x + PADDING + NODE_WIDTH;
                  const y1 = fromPos.y + PADDING + NODE_HEIGHT / 2;
                  const x2 = toPos.x + PADDING;
                  const y2 = toPos.y + PADDING + NODE_HEIGHT / 2;
                  const cx = (x1 + x2) / 2;

                  return (
                    <path
                      key={edge.id}
                      d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                      fill="none"
                      stroke={edge.isOnFocusPath ? boslerColors.primary : '#b7c2ce'}
                      strokeWidth={edge.isOnFocusPath ? 2 : 1}
                      strokeDasharray={edge.isOnFocusPath ? undefined : '4'}
                      markerEnd={`url(#${edge.isOnFocusPath ? MARKER_FOCUS : MARKER_SECONDARY})`}
                    />
                  );
                })}

                {/* Nodes */}
                {graph.nodes.map((node) => {
                  const pos = positions.get(node.id);
                  if (!pos) return null;
                  return (
                    <SvgNode
                      key={node.id}
                      node={node}
                      x={pos.x}
                      y={pos.y}
                      isSelected={node.id === selectedNodeId}
                      onClick={handleSelectNode}
                    />
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <DetailPanel
            node={selectedNode}
            nodeMap={nodeMap}
            onClose={() => setSelectedNodeId(null)}
            onSelectNode={handleSelectNode}
            productName={name}
          />
        )}
      </div>

      {/* Legend overlay */}
      {showLegend && <LegendPanel />}
    </div>
  );
};

export default CatalogLineage;
