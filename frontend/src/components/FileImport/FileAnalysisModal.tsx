/**
 * FileAnalysisModal.tsx — 4-tab modal displaying the AI analysis results.
 *
 * Tabs:
 *   1. Apercu      — first 10 rows preview (from stats), column types, null %)
 *   2. Rapport     — LLM summary + key metrics grid + correlation list
 *   3. Recommandations — LLM recommendations with priority badges
 *   4. Graphiques  — chart suggestions with "Open in Kepler" button
 *
 * Footer: "Créer un dataset" (primary) + "Fermer sans enregistrer" (secondary)
 */

import React, { useState } from "react";
import {
  Modal,
  Tabs,
  Table,
  Tag,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  List,
  Badge,
  Button,
  Space,
  message,
  Spin,
  Alert,
  Progress,
} from "antd";
import {
  AnalyzeFileResponse,
  Recommendation,
  ChartSuggestion,
  createSourceFromFileAPI,
} from "services/fileImportService";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const PRIORITY_COLORS: Record<string, string> = {
  high: "red",
  medium: "orange",
  low: "green",
};

const TYPE_COLORS: Record<string, string> = {
  time_series: "blue",
  numeric: "green",
  categorical: "purple",
  boolean: "gold",
};

const TYPE_LABELS: Record<string, string> = {
  time_series: "Date/Temps",
  numeric: "Numérique",
  categorical: "Catégoriel",
  boolean: "Booléen",
};

interface FileAnalysisModalProps {
  open: boolean;
  fileId: string;
  filename: string;
  analysis: AnalyzeFileResponse | null;
  loading?: boolean;
  onClose: () => void;
  onDatasetCreated?: (sourceId: string) => void;
}

const FileAnalysisModal: React.FC<FileAnalysisModalProps> = ({
  open,
  fileId,
  filename,
  analysis,
  loading = false,
  onClose,
  onDatasetCreated,
}) => {
  const [creatingDataset, setCreatingDataset] = useState(false);

  const handleCreateDataset = async () => {
    if (!analysis) return;
    setCreatingDataset(true);
    try {
      const res = await createSourceFromFileAPI({
        fileId,
        sourceName: filename.replace(/\.[^/.]+$/, ""),
      });
      message.success(`Dataset "${res.data.sourceName}" créé avec succès.`);
      onDatasetCreated?.(res.data.sourceId);
      onClose();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Erreur lors de la création du dataset."
      );
    } finally {
      setCreatingDataset(false);
    }
  };

  const footer = [
    <Button key="close" onClick={onClose}>
      Fermer sans enregistrer
    </Button>,
    <Button
      key="create"
      type="primary"
      loading={creatingDataset}
      disabled={!analysis || loading}
      onClick={handleCreateDataset}
    >
      Créer un dataset
    </Button>,
  ];

  return (
    <Modal
      open={open}
      title={`Analyse IA — ${filename}`}
      width={900}
      footer={footer}
      onCancel={onClose}
      destroyOnClose
    >
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Analyse en cours...</Text>
            <Progress
              percent={66}
              status="active"
              style={{ maxWidth: 400, margin: "12px auto 0" }}
            />
          </div>
        </div>
      )}

      {!loading && !analysis && (
        <Alert
          type="error"
          message="L'analyse a échoué ou n'est pas encore disponible."
          showIcon
        />
      )}

      {!loading && analysis && (
        <Tabs defaultActiveKey="preview">
          {/* ---- Tab 1: Aperçu ---- */}
          <TabPane tab="Aperçu" key="preview">
            <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
              {Object.entries(analysis.stats.detectedTypes).map(
                ([col, type]) => (
                  <Col key={col}>
                    <Tag color={TYPE_COLORS[type] || "default"}>
                      {col} — {TYPE_LABELS[type] || type}
                    </Tag>
                  </Col>
                )
              )}
            </Row>

            <Title level={5}>Valeurs manquantes par colonne</Title>
            <Table
              size="small"
              pagination={false}
              dataSource={Object.entries(analysis.stats.missingByColumn).map(
                ([col, ratio]) => ({ col, ratio })
              )}
              columns={[
                { title: "Colonne", dataIndex: "col", key: "col" },
                {
                  title: "% de nulls",
                  dataIndex: "ratio",
                  key: "ratio",
                  render: (v: number) => (
                    <span
                      style={{ color: v > 0.1 ? "#ff4d4f" : "inherit" }}
                    >
                      {(v * 100).toFixed(1)} %
                    </span>
                  ),
                },
              ]}
              rowKey="col"
            />
          </TabPane>

          {/* ---- Tab 2: Rapport ---- */}
          <TabPane tab="Rapport" key="report">
            <Card
              style={{ background: "#fafafa", marginBottom: 16 }}
              bordered={false}
            >
              <Paragraph>{analysis.summary}</Paragraph>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Modèle : {analysis.model}
              </Text>
            </Card>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="Lignes"
                  value={analysis.stats.rows.toLocaleString("fr-FR")}
                />
              </Col>
              <Col span={6}>
                <Statistic title="Colonnes" value={analysis.stats.columns} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Doublons"
                  value={analysis.stats.duplicates}
                  valueStyle={{
                    color: analysis.stats.duplicates > 0 ? "#faad14" : undefined,
                  }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Colonnes avec nulls"
                  value={
                    Object.values(analysis.stats.missingByColumn).filter(
                      (v) => v > 0
                    ).length
                  }
                />
              </Col>
            </Row>

            {analysis.stats.topCorrelations.length > 0 && (
              <>
                <Title level={5}>Top corrélations</Title>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={analysis.stats.topCorrelations}
                  columns={[
                    { title: "Colonne 1", dataIndex: "col1", key: "col1" },
                    { title: "Colonne 2", dataIndex: "col2", key: "col2" },
                    {
                      title: "r (Pearson)",
                      dataIndex: "r",
                      key: "r",
                      render: (v: number) => v.toFixed(4),
                    },
                  ]}
                  rowKey={(r) => `${r.col1}-${r.col2}`}
                />
              </>
            )}
          </TabPane>

          {/* ---- Tab 3: Recommandations ---- */}
          <TabPane tab="Recommandations" key="recommendations">
            {analysis.recommendations.length === 0 ? (
              <Text type="secondary">
                Aucune recommandation disponible.
              </Text>
            ) : (
              <List
                dataSource={analysis.recommendations}
                renderItem={(rec: Recommendation) => (
                  <List.Item key={rec.action}>
                    <Card
                      style={{ width: "100%" }}
                      size="small"
                      extra={
                        <Tag color={PRIORITY_COLORS[rec.priority]}>
                          {rec.priority.toUpperCase()}
                        </Tag>
                      }
                      title={rec.action}
                    >
                      <Text type="secondary">{rec.reason}</Text>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </TabPane>

          {/* ---- Tab 4: Graphiques ---- */}
          <TabPane tab="Graphiques" key="charts">
            {analysis.chartSuggestions.length === 0 ? (
              <Text type="secondary">
                Aucune suggestion de graphique disponible.
              </Text>
            ) : (
              <Row gutter={[16, 16]}>
                {analysis.chartSuggestions.map(
                  (chart: ChartSuggestion, idx: number) => (
                    <Col key={idx} span={12}>
                      <Card
                        size="small"
                        title={chart.title}
                        extra={
                          <Tag color="blue">{chart.chartType.toUpperCase()}</Tag>
                        }
                        actions={[
                          <Button type="link" size="small" key="kepler">
                            Ouvrir dans Kepler
                          </Button>,
                        ]}
                      >
                        <div
                          style={{
                            background: "#f5f5f5",
                            height: 150,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 4,
                          }}
                        >
                          <Space direction="vertical" align="center">
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              X : {chart.columnX}
                            </Text>
                            {chart.columnY && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Y : {chart.columnY}
                              </Text>
                            )}
                          </Space>
                        </div>
                      </Card>
                    </Col>
                  )
                )}
              </Row>
            )}
          </TabPane>
        </Tabs>
      )}
    </Modal>
  );
};

export default FileAnalysisModal;
