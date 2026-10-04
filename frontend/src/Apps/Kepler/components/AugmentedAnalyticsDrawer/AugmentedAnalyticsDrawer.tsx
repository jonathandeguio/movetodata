/**
 * AugmentedAnalyticsDrawer.tsx — F2 Augmented Analytics side drawer.
 *
 * A 420px Ant Design Drawer attached to a Kepler chart, offering four tabs:
 *   1. Anomalies — IsolationForest detection (scikit-learn, local, no LLM)
 *   2. Prévision — Prophet time-series forecast (local, no LLM)
 *   3. Segments  — K-Means clustering (scikit-learn, local, no LLM)
 *   4. Résumé    — LLM-generated summary from aggregated stats only
 *
 * Sovereignty: all analytics calls go through /api/ai/insights (Boson proxy).
 * Boson fetches the JDBC data and forwards it to the self-hosted movetodata-ai
 * Python service — no data leaves the MoveToData infrastructure.
 */
import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  InputNumber,
  Radio,
  Row,
  Select,
  Slider,
  Space,
  Spin,
  Table,
  Tabs,
  Tooltip,
  Typography,
} from "antd";
import { ExperimentOutlined } from "@ant-design/icons";
import {
  AnomalyResult,
  ClusterPoint,
  ForecastPoint,
  insightsAPI,
  InsightsOptions,
  InsightsResponse,
  InsightsType,
  SummaryResult,
} from "services/aiService";
import AnomalyBadge from "./AnomalyBadge";
import InsightCard from "./InsightCard";

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AugmentedAnalyticsDrawerProps {
  /** UUID of the dataset linked to the current chart. */
  datasetId: string;
  /** Branch name (e.g. "master"). */
  branch: string;
  /**
   * All column names available in the current chart query.
   * Used to populate the column selector dropdowns.
   */
  availableColumns: string[];
  /** Initial X-axis column (pre-selected from chart configuration). */
  defaultColumnX?: string;
  /** Initial Y-axis column (pre-selected from chart configuration). */
  defaultColumnY?: string;
  /** Whether the drawer is open. */
  open: boolean;
  /** Called when the drawer should be closed. */
  onClose: () => void;
  /**
   * Optional callback fired when anomaly detection completes.
   * The parent can use this to show an AnomalyBadge on the chart.
   */
  onAnomaliesDetected?: (count: number) => void;
}

// ---------------------------------------------------------------------------
// Tab keys
// ---------------------------------------------------------------------------

type TabKey = "anomaly" | "forecast" | "cluster" | "summary";

// ---------------------------------------------------------------------------
// Cluster colour palette (10 colours for up to 10 clusters)
// ---------------------------------------------------------------------------

const CLUSTER_COLORS = [
  "#2196f3", "#4caf50", "#ff9800", "#e91e63",
  "#9c27b0", "#00bcd4", "#ff5722", "#8bc34a",
  "#795548", "#607d8b",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AugmentedAnalyticsDrawer: React.FC<AugmentedAnalyticsDrawerProps> = ({
  datasetId,
  branch,
  availableColumns,
  defaultColumnX,
  defaultColumnY,
  open,
  onClose,
  onAnomaliesDetected,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("anomaly");

  // --- Shared column selectors ---
  const [columnX, setColumnX] = useState<string>(defaultColumnX ?? availableColumns[0] ?? "");
  const [columnY, setColumnY] = useState<string>(defaultColumnY ?? availableColumns[1] ?? availableColumns[0] ?? "");

  // --- Loading / error states ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Anomaly state ---
  const [contamination, setContamination] = useState<number>(0.05);
  const [anomalyResults, setAnomalyResults] = useState<AnomalyResult[] | null>(null);
  const [anomalyModel, setAnomalyModel] = useState<string>("");

  // --- Forecast state ---
  const [forecastHorizon, setForecastHorizon] = useState<number>(30);
  const [forecastResults, setForecastResults] = useState<ForecastPoint[] | null>(null);
  const [forecastModel, setForecastModel] = useState<string>("");

  // --- Cluster state ---
  const [clusterK, setClusterK] = useState<number | null>(null);
  const [clusterResults, setClusterResults] = useState<ClusterPoint[] | null>(null);
  const [clusterModel, setClusterModel] = useState<string>("");

  // --- Summary state ---
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [summaryModel, setSummaryModel] = useState<string>("");
  const [llmWarning, setLlmWarning] = useState(false);

  // -------------------------------------------------------------------------
  // Generic call helper
  // -------------------------------------------------------------------------

  const runInsights = async (
    type: InsightsType,
    options?: InsightsOptions
  ): Promise<InsightsResponse | null> => {
    if (!datasetId || !columnX || !columnY) return null;

    setLoading(true);
    setError(null);

    try {
      const { data } = await insightsAPI({
        datasetId,
        branch,
        columnX,
        columnY,
        type,
        options,
      });
      return data;
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ??
        err?.response?.data?.error ??
        err?.message ??
        "Une erreur est survenue.";
      if (err?.response?.status === 503) {
        setLlmWarning(true);
      } else {
        setError(String(detail));
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Tab handlers
  // -------------------------------------------------------------------------

  const handleDetectAnomalies = async () => {
    setAnomalyResults(null);
    const res = await runInsights("anomaly", { anomaly_contamination: contamination });
    if (res) {
      const results = res.results as AnomalyResult[];
      setAnomalyResults(results);
      setAnomalyModel(res.model);
      onAnomaliesDetected?.(results.length);
    }
  };

  const handleForecast = async () => {
    setForecastResults(null);
    const res = await runInsights("forecast", { forecast_horizon: forecastHorizon });
    if (res) {
      setForecastResults(res.results as ForecastPoint[]);
      setForecastModel(res.model);
    }
  };

  const handleCluster = async () => {
    setClusterResults(null);
    const res = await runInsights("cluster", { cluster_k: clusterK ?? undefined });
    if (res) {
      setClusterResults(res.results as ClusterPoint[]);
      setClusterModel(res.model);
    }
  };

  const handleSummary = async () => {
    setSummaryText(null);
    setLlmWarning(false);
    const res = await runInsights("summary");
    if (res) {
      const first = res.results[0] as SummaryResult;
      setSummaryText(first?.text ?? "");
      setSummaryModel(res.model);
    }
  };

  // -------------------------------------------------------------------------
  // Column selector (shared)
  // -------------------------------------------------------------------------

  const ColSelect = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div style={{ marginBottom: 8 }}>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
        {label}
      </Text>
      <Select
        size="small"
        style={{ width: "100%" }}
        value={value}
        onChange={onChange}
        options={availableColumns.map((c) => ({ label: c, value: c }))}
      />
    </div>
  );

  // -------------------------------------------------------------------------
  // Tabs
  // -------------------------------------------------------------------------

  const tabItems = [
    // ------------------------------------------------------------------
    // Tab 1: Anomalies
    // ------------------------------------------------------------------
    {
      key: "anomaly" as TabKey,
      label: "Anomalies",
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <ColSelect label="Colonne X" value={columnX} onChange={setColumnX} />
          <ColSelect label="Colonne Y (métrique)" value={columnY} onChange={setColumnY} />

          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Seuil de contamination : {(contamination * 100).toFixed(0)} %
            </Text>
            <Slider
              min={0.01}
              max={0.20}
              step={0.01}
              value={contamination}
              onChange={(v) => setContamination(v)}
              tooltip={{ formatter: (v) => `${((v ?? 0) * 100).toFixed(0)} %` }}
            />
          </div>

          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            loading={loading && activeTab === "anomaly"}
            onClick={handleDetectAnomalies}
            block
          >
            Détecter les anomalies
          </Button>

          {error && activeTab === "anomaly" && (
            <Alert type="error" message={error} showIcon />
          )}

          {anomalyResults !== null && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong>
                  {anomalyResults.length} anomalie{anomalyResults.length !== 1 ? "s" : ""} détectée{anomalyResults.length !== 1 ? "s" : ""}
                </Text>
                <AnomalyBadge count={anomalyResults.length} />
              </div>
              {anomalyResults.length > 0 && (
                <Table
                  size="small"
                  dataSource={anomalyResults.map((r, i) => ({ ...r, key: i }))}
                  pagination={{ pageSize: 10, size: "small" }}
                  columns={[
                    {
                      title: columnX,
                      dataIndex: "x_value",
                      ellipsis: true,
                      render: (v) => <Text style={{ fontSize: 12 }}>{String(v)}</Text>,
                    },
                    {
                      title: columnY,
                      dataIndex: "y_value",
                      render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
                    },
                    {
                      title: "Score",
                      dataIndex: "score",
                      width: 70,
                      render: (v) => (
                        <Text
                          strong
                          style={{
                            fontSize: 12,
                            color: v > 0.7 ? "#ff4d4f" : v > 0.4 ? "#fa8c16" : "#52c41a",
                          }}
                        >
                          {(v * 100).toFixed(0)} %
                        </Text>
                      ),
                    },
                  ]}
                />
              )}
              <Text type="secondary" style={{ fontSize: 11 }}>
                {anomalyModel}
              </Text>
            </>
          )}
        </Space>
      ),
    },

    // ------------------------------------------------------------------
    // Tab 2: Prévision
    // ------------------------------------------------------------------
    {
      key: "forecast" as TabKey,
      label: "Prévision",
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <ColSelect label="Colonne date (X)" value={columnX} onChange={setColumnX} />
          <ColSelect label="Colonne métrique (Y)" value={columnY} onChange={setColumnY} />

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              Horizon de prévision
            </Text>
            <Radio.Group
              value={forecastHorizon}
              onChange={(e) => setForecastHorizon(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value={7}>7 jours</Radio.Button>
              <Radio.Button value={30}>30 jours</Radio.Button>
              <Radio.Button value={90}>90 jours</Radio.Button>
            </Radio.Group>
          </div>

          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            loading={loading && activeTab === "forecast"}
            onClick={handleForecast}
            block
          >
            Prévoir
          </Button>

          {error && activeTab === "forecast" && (
            <Alert type="error" message={error} showIcon />
          )}

          {forecastResults !== null && forecastResults.length > 0 && (
            <>
              <InsightCard
                title={`Prévision sur ${forecastHorizon} jours`}
                body={`${forecastResults.length} point${forecastResults.length > 1 ? "s" : ""} prédit${forecastResults.length > 1 ? "s" : ""} à partir de ${forecastResults[0]?.date}.`}
                details={[
                  {
                    label: "Première date",
                    value: forecastResults[0]?.date ?? "—",
                  },
                  {
                    label: "Dernière date",
                    value: forecastResults[forecastResults.length - 1]?.date ?? "—",
                  },
                  {
                    label: "Valeur finale prédite",
                    value: forecastResults[forecastResults.length - 1]?.predicted?.toFixed(2) ?? "—",
                  },
                ]}
                model={forecastModel}
              />
              <Table
                size="small"
                dataSource={forecastResults.map((r, i) => ({ ...r, key: i }))}
                pagination={{ pageSize: 10, size: "small" }}
                columns={[
                  {
                    title: "Date",
                    dataIndex: "date",
                    render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
                  },
                  {
                    title: "Prédit",
                    dataIndex: "predicted",
                    render: (v) => <Text strong style={{ fontSize: 12 }}>{v?.toFixed(2)}</Text>,
                  },
                  {
                    title: "IC bas 80%",
                    dataIndex: "lower_80",
                    render: (v) => <Text style={{ fontSize: 12 }}>{v?.toFixed(2)}</Text>,
                  },
                  {
                    title: "IC haut 80%",
                    dataIndex: "upper_80",
                    render: (v) => <Text style={{ fontSize: 12 }}>{v?.toFixed(2)}</Text>,
                  },
                ]}
              />
            </>
          )}
        </Space>
      ),
    },

    // ------------------------------------------------------------------
    // Tab 3: Segments (Clustering)
    // ------------------------------------------------------------------
    {
      key: "cluster" as TabKey,
      label: "Segments",
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <ColSelect label="Colonne X" value={columnX} onChange={setColumnX} />
          <ColSelect label="Colonne Y" value={columnY} onChange={setColumnY} />

          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              Nombre de clusters (vide = auto)
            </Text>
            <InputNumber
              min={2}
              max={10}
              value={clusterK ?? undefined}
              onChange={(v) => setClusterK(v ?? null)}
              placeholder="Auto (elbow)"
              size="small"
              style={{ width: "100%" }}
            />
          </div>

          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            loading={loading && activeTab === "cluster"}
            onClick={handleCluster}
            block
          >
            Segmenter
          </Button>

          {error && activeTab === "cluster" && (
            <Alert type="error" message={error} showIcon />
          )}

          {clusterResults !== null && (
            <>
              <Text strong>
                {new Set(clusterResults.map((r) => r.cluster)).size} segment{new Set(clusterResults.map((r) => r.cluster)).size > 1 ? "s" : ""} identifié{new Set(clusterResults.map((r) => r.cluster)).size > 1 ? "s" : ""}
              </Text>
              <Table
                size="small"
                dataSource={clusterResults.map((r, i) => ({ ...r, key: i }))}
                pagination={{ pageSize: 10, size: "small" }}
                columns={[
                  {
                    title: columnX,
                    dataIndex: "x_value",
                    ellipsis: true,
                    render: (v) => <Text style={{ fontSize: 12 }}>{String(v)}</Text>,
                  },
                  {
                    title: columnY,
                    dataIndex: "y_value",
                    render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
                  },
                  {
                    title: "Cluster",
                    dataIndex: "cluster",
                    width: 80,
                    render: (v) => (
                      <span
                        style={{
                          background: CLUSTER_COLORS[v % CLUSTER_COLORS.length],
                          color: "#fff",
                          borderRadius: 4,
                          padding: "1px 8px",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {v + 1}
                      </span>
                    ),
                  },
                ]}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {clusterModel}
              </Text>
            </>
          )}
        </Space>
      ),
    },

    // ------------------------------------------------------------------
    // Tab 4: Résumé (LLM)
    // ------------------------------------------------------------------
    {
      key: "summary" as TabKey,
      label: "Résumé",
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Text type="secondary" style={{ fontSize: 12 }}>
            Le résumé est généré par un LLM auto-hébergé (qwen2.5:14b via Ollama)
            à partir de statistiques agrégées uniquement. Aucune donnée brute n'est
            transmise.
          </Text>

          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            loading={loading && activeTab === "summary"}
            onClick={handleSummary}
            block
          >
            Générer le résumé
          </Button>

          {llmWarning && (
            <Alert
              type="warning"
              message="Service LLM indisponible"
              description="Ollama n'est pas accessible. Vérifiez que le service est démarré et que OLLAMA_URL est correctement configuré."
              showIcon
            />
          )}

          {error && activeTab === "summary" && (
            <Alert type="error" message={error} showIcon />
          )}

          {summaryText && (
            <>
              <Card
                size="small"
                style={{
                  background: "#f5f5f5",
                  borderRadius: 8,
                  border: "1px solid #d9d9d9",
                }}
              >
                <Text style={{ fontSize: 13, lineHeight: 1.6 }}>{summaryText}</Text>
              </Card>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {summaryModel}
              </Text>
            </>
          )}
        </Space>
      ),
    },
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Drawer
      title={
        <Row align="middle" gutter={8}>
          <Col>
            <ExperimentOutlined style={{ color: "var(--movetodata-primary, #1677ff)" }} />
          </Col>
          <Col>
            <Text strong>Analytics IA</Text>
          </Col>
        </Row>
      }
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      getContainer={false}
      styles={{
        body: { padding: 16 },
        mask: { backgroundColor: "rgba(248, 250, 251, 0.6)" },
      }}
    >
      <Spin spinning={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => {
            setActiveTab(k as TabKey);
            setError(null);
          }}
          size="small"
          items={tabItems}
        />
      </Spin>
    </Drawer>
  );
};

export default AugmentedAnalyticsDrawer;
