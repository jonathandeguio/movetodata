import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Progress,
  Row,
  Spin,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  getCatalogHealth,
  type CatalogHealthMetrics,
  type DependencyStatus,
  type JobStatusInfo,
} from "../../../services/catalogService";
import StatusPill from "./components/StatusPill";
import { boslerColors } from "./theme/boslerTokens";

const { Title, Text } = Typography;

const QUALITY_COLORS: Record<string, string> = {
  GOLD:   "#FFD700",
  SILVER: "#C0C0C0",
  BRONZE: "#CD7F32",
  NONE:   "#d9d9d9",
};

const pct = (v: number): number => Math.round(v * 100);

// ---------------------------------------------------------------------------
// Helpers statut
// ---------------------------------------------------------------------------

function depStatusVariant(s: DependencyStatus | 'OK' | 'UNKNOWN'): 'success' | 'warning' | 'error' | 'neutral' {
  if (s === 'UP' || s === 'OK') return 'success';
  if (s === 'DEGRADED' || s === 'UNKNOWN') return 'warning';
  return 'error';
}

function depStatusLabel(s: string): string {
  if (s === 'UP' || s === 'OK') return 'UP';
  return s;
}

// ---------------------------------------------------------------------------
// Tuile dépendance
// ---------------------------------------------------------------------------

interface DepTileProps {
  title: string;
  status: string;
  responseTimeMs?: number;
  extra?: React.ReactNode;
}

const DepTile: React.FC<DepTileProps> = ({ title, status, responseTimeMs, extra }) => {
  const variant = depStatusVariant(status as DependencyStatus);
  return (
    <div
      style={{
        background: boslerColors.card,
        border: `1px solid ${boslerColors.cardBorder}`,
        borderRadius: 5,
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 160,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: 600, color: boslerColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusPill status={depStatusLabel(status)} variant={variant} />
      </div>
      {responseTimeMs != null && (
        <Text style={{ fontSize: 12, color: boslerColors.textSecondary }}>
          {responseTimeMs} ms
        </Text>
      )}
      {extra && <div style={{ fontSize: 12, color: boslerColors.textSecondary }}>{extra}</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tuile TrustScoreJob
// ---------------------------------------------------------------------------

const JobTile: React.FC<{ job: JobStatusInfo }> = ({ job }) => {
  const variant = depStatusVariant(job.status);
  const lastRunLabel = job.lastRun
    ? new Date(job.lastRun).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : 'jamais';

  return (
    <div
      style={{
        background: boslerColors.card,
        border: `1px solid ${boslerColors.cardBorder}`,
        borderRadius: 5,
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 160,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: 600, color: boslerColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        TrustScore Job
      </Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusPill status={job.status === 'OK' ? 'OK' : job.status} variant={variant} />
      </div>
      <Text style={{ fontSize: 12, color: boslerColors.textSecondary }}>
        {job.alertCount} alerte{job.alertCount !== 1 ? 's' : ''}
      </Text>
      <Text style={{ fontSize: 12, color: boslerColors.textMuted }}>
        Dernier run : {lastRunLabel}
      </Text>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 30_000;

const CatalogHealth: React.FC = () => {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<CatalogHealthMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError]     = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await getCatalogHealth();
      setMetrics(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetrics(false);
    intervalRef.current = setInterval(() => { void fetchMetrics(true); }, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMetrics]);

  const overallStatus = metrics?.status ?? 'UNKNOWN';
  const overallVariant: 'success' | 'warning' | 'error' | 'neutral' = depStatusVariant(overallStatus as DependencyStatus);

  return (
    <div style={{ margin: "5px 0", padding: "0 16px" }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <a onClick={() => navigate("/portal/catalog/search")}>Catalogue</a>
            ),
          },
          { title: "Santé du Catalogue" },
        ]}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          Santé du Catalogue
        </Title>
        <Tag icon={<RobotOutlined />} color="#24527a" style={{ borderRadius: 2 }}>
          Métriques plateforme
        </Tag>
        {metrics && (
          <StatusPill
            status={overallStatus}
            variant={overallVariant}
          />
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: boslerColors.textMuted }}>
            Mise à jour toutes les 30 s
          </Text>
          <Tooltip title="Rafraîchir">
            <Button
              size="small"
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={() => void fetchMetrics(true)}
              style={{ borderRadius: 2 }}
              aria-label="Rafraîchir les métriques"
            >
              Rafraîchir
            </Button>
          </Tooltip>
        </div>
      </div>

      {error && (
        <Alert type="error" message="Impossible de charger les métriques" description={error} showIcon style={{ marginBottom: 16 }} />
      )}

      <Spin spinning={loading}>
        {!loading && !error && !metrics && <Empty description="Aucune métrique disponible" />}

        {metrics && (
          <>
            {/* ------------------------------------------------------------------ */}
            {/* Tuiles dépendances système */}
            {/* ------------------------------------------------------------------ */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', fontSize: 13, color: boslerColors.textTitle, marginBottom: 10 }}>
                Dépendances système
              </Text>
              <div
                style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
                aria-live="polite"
                aria-label="Statut des dépendances système"
              >
                {metrics.dependencies && (
                  <>
                    <DepTile
                      title="Database"
                      status={metrics.dependencies.database?.status ?? 'UNKNOWN'}
                      responseTimeMs={metrics.dependencies.database?.responseTimeMs}
                    />
                    <DepTile
                      title="OpenSearch"
                      status={metrics.dependencies.opensearch?.status ?? 'UNKNOWN'}
                      responseTimeMs={metrics.dependencies.opensearch?.responseTimeMs}
                    />
                    <JobTile job={metrics.dependencies.trustScoreJob ?? { status: 'UNKNOWN', lastRun: null, alertCount: 0 }} />
                    <DepTile
                      title="LLM"
                      status={metrics.dependencies.llm?.status ?? 'UNKNOWN'}
                      responseTimeMs={metrics.dependencies.llm?.responseTimeMs}
                      extra={metrics.dependencies.llm?.model
                        ? <span>{metrics.dependencies.llm.model}</span>
                        : undefined}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Alertes actives */}
            {(metrics.productsInDrift > 0 || metrics.productsWithLowTrust > 0) && (
              <Alert
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                message={
                  <span>
                    {metrics.productsInDrift > 0 && (
                      <span style={{ marginRight: 16 }}>
                        {metrics.productsInDrift} Data Product(s) en drift détecté
                      </span>
                    )}
                    {metrics.productsWithLowTrust > 0 && (
                      <span>
                        {metrics.productsWithLowTrust} Data Product(s) avec Trust Score &lt; 30%
                      </span>
                    )}
                  </span>
                }
                style={{ marginBottom: 20 }}
              />
            )}

            {/* KPI cards — row 1 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Data Products"
                    value={metrics.totalProducts}
                    valueStyle={{ color: "#24527a" }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Trust Score moyen"
                    value={pct(metrics.avgTrustScore)}
                    suffix="%"
                    valueStyle={{
                      color: metrics.avgTrustScore >= 0.6 ? "#52c41a"
                           : metrics.avgTrustScore >= 0.3 ? "#faad14"
                           : "#ff4d4f",
                    }}
                    prefix={metrics.avgTrustScore >= 0.6 ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic
                    title="En drift"
                    value={metrics.productsInDrift}
                    valueStyle={{ color: metrics.productsInDrift > 0 ? "#faad14" : "#52c41a" }}
                    prefix={metrics.productsInDrift > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card size="small">
                  <Statistic
                    title="Règles qualité"
                    value={metrics.totalQualityRules}
                    valueStyle={{ color: "#24527a" }}
                    prefix={<SafetyOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Coverage bars */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} md={12}>
                <Card size="small" title="Couverture documentation">
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {metrics.withDescription} / {metrics.totalProducts} avec description
                    </Text>
                  </div>
                  <Progress
                    percent={pct(metrics.descriptionCoverage)}
                    strokeColor={pct(metrics.descriptionCoverage) >= 70 ? "#52c41a" : "#faad14"}
                    format={(p) => `${p}%`}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Couverture PII">
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {metrics.piiColumns} colonnes PII / {metrics.totalColumns} colonnes totales
                    </Text>
                  </div>
                  <Progress
                    percent={pct(metrics.piiCoverage)}
                    strokeColor="#722ed1"
                    format={(p) => `${p}%`}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Couverture glossaire">
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {metrics.glossaryMappedColumns} colonnes mappées · {metrics.totalGlossaryTerms} termes
                    </Text>
                  </div>
                  <Progress
                    percent={pct(metrics.glossaryCoverage)}
                    strokeColor="#1890ff"
                    format={(p) => `${p}%`}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Distribution certification">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    {Object.entries(metrics.qualityDistribution).map(([level, count]) => (
                      <div key={level} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 56 }}>
                        <Tag
                          style={{
                            backgroundColor: QUALITY_COLORS[level] ?? "#d9d9d9",
                            color: level === "GOLD" ? "#594000" : "#333",
                            border: "none",
                            borderRadius: 2,
                            fontWeight: 600,
                            marginBottom: 2,
                          }}
                        >
                          {level}
                        </Tag>
                        <Text style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>{count}</Text>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Detail table */}
            <Card
              size="small"
              title={
                <span>
                  <ThunderboltOutlined style={{ marginRight: 6, color: "#4b2983" }} />
                  Détail des métriques
                </span>
              }
            >
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="Total colonnes">{metrics.totalColumns}</Descriptions.Item>
                <Descriptions.Item label="Colonnes PII détectées">{metrics.piiColumns}</Descriptions.Item>
                <Descriptions.Item label="Colonnes mappées glossaire">{metrics.glossaryMappedColumns}</Descriptions.Item>
                <Descriptions.Item label="Termes dans le glossaire">{metrics.totalGlossaryTerms}</Descriptions.Item>
                <Descriptions.Item label="Règles qualité actives">{metrics.totalQualityRules}</Descriptions.Item>
                <Descriptions.Item label="Trust Score &lt; 30%">{metrics.productsWithLowTrust}</Descriptions.Item>
              </Descriptions>
            </Card>
          </>
        )}
      </Spin>
    </div>
  );
};

export default CatalogHealth;
