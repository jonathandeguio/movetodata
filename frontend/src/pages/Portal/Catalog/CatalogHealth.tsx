import React, { useEffect, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Card,
  Col,
  Descriptions,
  Empty,
  Progress,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getCatalogHealth, CatalogHealthMetrics } from "../../../services/catalogService";

const { Title, Text } = Typography;

const QUALITY_COLORS: Record<string, string> = {
  GOLD:   "#FFD700",
  SILVER: "#C0C0C0",
  BRONZE: "#CD7F32",
  NONE:   "#d9d9d9",
};

const pct = (v: number): number => Math.round(v * 100);

const CatalogHealth: React.FC = () => {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<CatalogHealthMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCatalogHealth()
      .then((data) => { if (!cancelled) setMetrics(data); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

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
      </div>

      {error && (
        <Alert type="error" message="Impossible de charger les métriques" description={error} showIcon style={{ marginBottom: 16 }} />
      )}

      <Spin spinning={loading}>
        {!loading && !error && !metrics && <Empty description="Aucune métrique disponible" />}

        {metrics && (
          <>
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
