/**
 * SmartConnectorAnalysisPage.tsx — F4 Smart Connector post-connection analysis.
 *
 * Displayed after a source is successfully created.
 * Route: /portal/connect/source/:id/analyze
 *
 * Sections:
 *  1. Quality score — global circular gauge + 4 linear gauges
 *  2. Detected types — semantic type badges per column
 *  3. Chart suggestions — cards with "Open in Kepler" button
 */

import {
  BarChartOutlined,
  CheckCircleOutlined,
  DotChartOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  FundOutlined,
  LineChartOutlined,
  NumberOutlined,
  PieChartOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Steps,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  analyzeSourceAPI,
  type AiSourceQuality,
  type ChartSuggestion,
  type ColumnSemanticType,
  type SmartConnectorResponse,
} from "../../../services/aiService";

const { Title, Text, Paragraph } = Typography;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const scoreColor = (score: number | null): string => {
  if (score === null) return "#d9d9d9";
  if (score < 40) return "#ff4d4f";   // red
  if (score < 70) return "#faad14";   // orange
  return "#52c41a";                   // green
};

const typeConfig: Record<
  ColumnSemanticType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  time_series:  { icon: <FieldTimeOutlined />,    label: "Séries temporelles", color: "blue" },
  numeric:      { icon: <NumberOutlined />,        label: "Données numériques", color: "geekblue" },
  categorical:  { icon: <TagsOutlined />,          label: "Données catégorielles", color: "purple" },
  geographic:   { icon: <EnvironmentOutlined />,   label: "Données géographiques", color: "green" },
  boolean:      { icon: <CheckCircleOutlined />,   label: "Booléen",            color: "cyan" },
  text:         { icon: <ExclamationCircleOutlined />, label: "Texte libre",    color: "default" },
};

const chartIcon: Record<string, React.ReactNode> = {
  line:      <LineChartOutlined style={{ fontSize: 32, color: "#1677ff" }} />,
  bar:       <BarChartOutlined  style={{ fontSize: 32, color: "#52c41a" }} />,
  scatter:   <DotChartOutlined  style={{ fontSize: 32, color: "#fa8c16" }} />,
  pie:       <PieChartOutlined  style={{ fontSize: 32, color: "#eb2f96" }} />,
  histogram: <BarChartOutlined  style={{ fontSize: 32, color: "#722ed1" }} />,
  map:       <EnvironmentOutlined style={{ fontSize: 32, color: "#13c2c2" }} />,
};

const detectTypesSummary = (
  detected: Record<string, ColumnSemanticType>
): Record<ColumnSemanticType, number> => {
  const counts: Partial<Record<ColumnSemanticType, number>> = {};
  Object.values(detected).forEach((t) => {
    counts[t] = (counts[t] ?? 0) + 1;
  });
  return counts as Record<ColumnSemanticType, number>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SmartConnectorAnalysisPage: React.FC = () => {
  const { id: sourceId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SmartConnectorResponse | null>(null);

  useEffect(() => {
    if (!sourceId) return;

    const run = async () => {
      try {
        setLoading(true);
        setCurrentStep(0);

        // Simulate step progression during loading
        const stepTimer1 = setTimeout(() => setCurrentStep(1), 800);
        const stepTimer2 = setTimeout(() => setCurrentStep(2), 1800);

        const { data } = await analyzeSourceAPI(sourceId);

        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        setCurrentStep(3);
        setResult(data);
      } catch (err: any) {
        const detail =
          err?.response?.data?.detail ??
          err?.response?.data?.error ??
          "L'analyse n'a pas pu être complétée.";
        setError(detail);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [sourceId]);

  const handleOpenInKepler = (suggestion: ChartSuggestion) => {
    const params = new URLSearchParams({
      sourceId: sourceId ?? "",
      chartType: suggestion.chartType,
      columnX: suggestion.columnX,
    });
    if (suggestion.columnY) {
      params.set("columnY", suggestion.columnY);
    }
    navigate(`/portal/kepler/CHART/new?${params.toString()}`);
  };

  const handleSkip = () => {
    // Navigate to the source detail page
    navigate(`/portal/connect/source/${sourceId}`);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Analyse de votre source
          </Title>
          <Text type="secondary">
            MoveToData analyse automatiquement vos données pour vous suggérer les meilleures visualisations.
          </Text>
        </Col>
        <Col>
          <Button onClick={handleSkip} disabled={loading}>
            Ignorer et aller dans Explorer
          </Button>
        </Col>
      </Row>

      {/* Progress steps */}
      <Steps
        current={currentStep}
        status={error ? "error" : loading ? "process" : "finish"}
        style={{ marginBottom: 32 }}
        items={[
          { title: "Lecture du schéma" },
          { title: "Analyse qualité" },
          { title: "Suggestions de graphiques" },
          { title: "Terminé" },
        ]}
      />

      {error && (
        <Alert
          type="warning"
          showIcon
          message="L'analyse a rencontré un problème"
          description={error}
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" onClick={handleSkip}>
              Continuer sans analyse
            </Button>
          }
        />
      )}

      {result && (
        <>
          {/* ----------------------------------------------------------------- */}
          {/* Section 1 — Quality score                                         */}
          {/* ----------------------------------------------------------------- */}
          <Card
            title="Score qualité des données"
            style={{ marginBottom: 24 }}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Calculé sur {result.sample_size} lignes · {result.model}
              </Text>
            }
          >
            <Row gutter={[32, 16]} align="middle">
              {/* Global score */}
              <Col xs={24} sm={6} style={{ textAlign: "center" }}>
                <Progress
                  type="circle"
                  percent={result.quality_score.global ?? 0}
                  strokeColor={scoreColor(result.quality_score.global)}
                  format={(p) => (
                    <span style={{ fontSize: 22, fontWeight: 600, color: scoreColor(result.quality_score.global) }}>
                      {p}
                    </span>
                  )}
                  size={120}
                />
                <div style={{ marginTop: 8 }}>
                  <Text strong>Score global</Text>
                </div>
              </Col>

              {/* Dimension scores */}
              <Col xs={24} sm={18}>
                <Row gutter={[16, 16]}>
                  {(
                    [
                      { label: "Complétude",  value: result.quality_score.completeness,
                        tooltip: "Pourcentage moyen de valeurs non-nulles par colonne." },
                      { label: "Unicité",     value: result.quality_score.uniqueness,
                        tooltip: "100 - (% de lignes dupliquées)." },
                      { label: "Cohérence",   value: result.quality_score.consistency,
                        tooltip: "% de colonnes dont les valeurs correspondent au type SQL déclaré." },
                      {
                        label: "Faible taux d'anomalies",
                        value: result.quality_score.outlier_ratio !== null
                          ? Math.round((1 - (result.quality_score.outlier_ratio ?? 0)) * 100)
                          : null,
                        tooltip: `Taux d'outliers détecté : ${((result.quality_score.outlier_ratio ?? 0) * 100).toFixed(1)} %.`,
                      },
                    ] as Array<{ label: string; value: number | null; tooltip: string }>
                  ).map(({ label, value, tooltip }) => (
                    <Col span={12} key={label}>
                      <Tooltip title={tooltip}>
                        <div>
                          <Row justify="space-between">
                            <Text>{label}</Text>
                            <Text strong style={{ color: scoreColor(value) }}>
                              {value !== null ? `${value} %` : "—"}
                            </Text>
                          </Row>
                          <Progress
                            percent={value ?? 0}
                            strokeColor={scoreColor(value)}
                            showInfo={false}
                            size="small"
                          />
                        </div>
                      </Tooltip>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          </Card>

          {/* ----------------------------------------------------------------- */}
          {/* Section 2 — Detected types                                        */}
          {/* ----------------------------------------------------------------- */}
          {Object.keys(result.detected_types).length > 0 && (
            <Card title="Types de données détectés" style={{ marginBottom: 24 }}>
              <Space wrap>
                {(
                  Object.entries(detectTypesSummary(result.detected_types)) as Array<
                    [ColumnSemanticType, number]
                  >
                ).map(([type, count]) => {
                  const cfg = typeConfig[type] ?? { icon: null, label: type, color: "default" };
                  return (
                    <Tag
                      key={type}
                      color={cfg.color}
                      icon={cfg.icon}
                      style={{ padding: "4px 12px", fontSize: 13 }}
                    >
                      {cfg.label}
                      <Badge
                        count={count}
                        style={{
                          backgroundColor: "rgba(0,0,0,0.15)",
                          marginLeft: 6,
                          fontSize: 11,
                          boxShadow: "none",
                        }}
                      />
                    </Tag>
                  );
                })}
              </Space>
              {/* Per-column details */}
              <div style={{ marginTop: 16 }}>
                <Space wrap size={[8, 8]}>
                  {Object.entries(result.detected_types).map(([col, type]) => {
                    const cfg = typeConfig[type] ?? { icon: null, label: type, color: "default" };
                    return (
                      <Tooltip key={col} title={cfg.label}>
                        <Tag icon={cfg.icon} color={cfg.color} style={{ fontFamily: "monospace" }}>
                          {col}
                        </Tag>
                      </Tooltip>
                    );
                  })}
                </Space>
              </div>
            </Card>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Section 3 — Chart suggestions                                     */}
          {/* ----------------------------------------------------------------- */}
          {result.chart_suggestions.length > 0 && (
            <Card title="Graphiques suggérés">
              <Row gutter={[16, 16]}>
                {result.chart_suggestions.map((suggestion, idx) => (
                  <Col xs={24} sm={12} lg={8} key={idx}>
                    <Card
                      size="small"
                      style={{ height: "100%" }}
                      actions={[
                        <Button
                          key="open"
                          type="primary"
                          size="small"
                          icon={<FundOutlined />}
                          onClick={() => handleOpenInKepler(suggestion)}
                        >
                          Ouvrir dans Kepler
                        </Button>,
                      ]}
                    >
                      {/* Chart type icon */}
                      <div style={{ textAlign: "center", marginBottom: 12 }}>
                        {chartIcon[suggestion.chartType] ?? <BarChartOutlined style={{ fontSize: 32 }} />}
                      </div>

                      <Text strong style={{ display: "block", marginBottom: 4 }}>
                        {suggestion.title}
                      </Text>

                      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                        {suggestion.reason}
                      </Paragraph>

                      <Space size={4} wrap>
                        <Tag style={{ fontFamily: "monospace", fontSize: 11 }}>
                          X: {suggestion.columnX}
                        </Tag>
                        {suggestion.columnY && (
                          <Tag style={{ fontFamily: "monospace", fontSize: 11 }}>
                            Y: {suggestion.columnY}
                          </Tag>
                        )}
                        <Tag color="blue" style={{ fontSize: 11 }}>
                          {suggestion.chartType}
                        </Tag>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          {result.chart_suggestions.length === 0 && !error && (
            <Alert
              type="info"
              showIcon
              message="Pas de suggestions disponibles"
              description="L'analyse n'a pas pu identifier de graphiques pertinents pour cette source. Explorez vos données dans l'Explorer."
            />
          )}
        </>
      )}
    </div>
  );
};

export default SmartConnectorAnalysisPage;
