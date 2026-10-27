import React, { useEffect, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Descriptions,
  Empty,
  Form,
  InputNumber,
  Modal,
  notification,
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { LockOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import {
  addPiiTag,
  getDataProduct,
  getDataProductColumns,
  listQualityRules,
  createQualityRule,
  deleteQualityRule,
  listDatasetStats,
  DataProduct,
  DataProductColumn,
  CatalogQualityRule,
  CatalogDatasetStats,
} from "../../../services/catalogService";
import { enrichDataProductAPI, suggestQualityRulesAPI } from "../../../services/aiService";
import { useAiAssistantContext } from "../../../components/AiAssistant/AiAssistantContext";

const { Title } = Typography;

// ---------------------------------------------------------------------------
// Access policy badge
// ---------------------------------------------------------------------------

function AccessPolicyBadge({
  policy,
}: {
  policy: DataProduct["accessPolicy"];
}): JSX.Element {
  if (policy === "PUBLIC") {
    return <Tag color="green">PUBLIC</Tag>;
  }
  if (policy === "INTERNAL") {
    return <Tag color="blue">INTERNAL</Tag>;
  }
  if (policy === "RESTRICTED") {
    return (
      <Tag color="red" icon={<LockOutlined />}>
        RESTRICTED
      </Tag>
    );
  }
  return <span>—</span>;
}

// ---------------------------------------------------------------------------
// Quality level badge
// ---------------------------------------------------------------------------

const QUALITY_COLORS: Record<string, string> = {
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFD700",
};

function QualityLevelBadge({
  level,
}: {
  level: DataProduct["qualityLevel"] | string | undefined;
}): JSX.Element {
  if (!level) return <span>—</span>;
  const color = QUALITY_COLORS[level] ?? "#888";
  return (
    <Tag style={{ backgroundColor: color, color: "#0d1117", borderColor: color, borderRadius: 2 }}>
      {level.charAt(0) + level.slice(1).toLowerCase()}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// PII column type
// ---------------------------------------------------------------------------

interface PiiRow {
  key: string;
  columnName: string;
  piiType: string;
  retention: string;
}

function buildPiiRows(cols: DataProductColumn[]): PiiRow[] {
  return cols
    .filter((c) => c.piiType != null && c.piiType !== "")
    .map((c) => ({
      key: c.columnName,
      columnName: c.columnName,
      piiType: c.piiType ?? "—",
      retention: c.retentionDays != null ? `${c.retentionDays} j` : "—",
    }));
}

const PII_TAG_OPTIONS = [
  { label: "PII.Sensitive", value: "PII.Sensitive" },
  { label: "GDPR.Sensitive", value: "GDPR.Sensitive" },
  { label: "GDPR.ID", value: "GDPR.ID" },
];

interface PiiFormValues {
  columnName: string;
  tagFqn: string;
  retentionDays: number;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const CatalogDataProduct: React.FC = () => {
  const { fqn: rawFqn } = useParams<{ fqn: string }>();
  const navigate = useNavigate();

  const fqn = rawFqn ? decodeURIComponent(rawFqn) : "";

  const [product, setProduct] = useState<DataProduct | null>(null);
  const [columns, setColumns] = useState<DataProductColumn[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [enriching, setEnriching] = useState<boolean>(false);
  const [qualityRules, setQualityRules] = useState<CatalogQualityRule[]>([]);
  const [stats, setStats] = useState<CatalogDatasetStats[]>([]);
  const [suggestingRules, setSuggestingRules] = useState<boolean>(false);

  const [piiModalOpen, setPiiModalOpen] = useState<boolean>(false);
  const [piiForm] = Form.useForm<PiiFormValues>();
  const [piiSubmitting, setPiiSubmitting] = useState<boolean>(false);
  const [piiError, setPiiError] = useState<string | null>(null);

  const { setCatalogContext } = useAiAssistantContext();

  useEffect(() => {
    if (!fqn) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDataProduct(fqn)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        return getDataProductColumns(data.name);
      })
      .then((cols) => {
        if (!cancelled && cols != null) setColumns(cols);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Erreur inconnue";
          setError(
            `Impossible de charger le Data Product : ${message}.`
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // Load quality rules and stats (non-blocking)
    getDataProduct(fqn)
      .then((data) => Promise.all([
        listQualityRules(data.name).catch(() => [] as CatalogQualityRule[]),
        listDatasetStats(data.name).catch(() => [] as CatalogDatasetStats[]),
      ]))
      .then(([rules, statsData]) => {
        if (!cancelled) {
          setQualityRules(rules);
          setStats(statsData);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fqn]);

  // Inject catalog context into the AI assistant sidebar while this page is open
  useEffect(() => {
    if (!product) return;
    setCatalogContext({
      productName: product.name,
      description: product.description,
      domain: product.domain?.name ?? product.domainId,
      qualityLevel: product.qualityLevel ?? product.extension?.qualityLevel,
      columns: columns.length > 0 ? JSON.stringify(columns) : undefined,
    });
    return () => {
      setCatalogContext(undefined);
    };
  }, [product, columns, setCatalogContext]);

  const handleEnrich = async (): Promise<void> => {
    if (!product) return;
    setEnriching(true);
    try {
      const res = await enrichDataProductAPI(product.name);
      const updated = await getDataProduct(fqn);
      setProduct(updated);
      const updatedCols = await getDataProductColumns(updated.name);
      setColumns(updatedCols);
      notification.success({
        message: "Enrichissement terminé",
        description: `Description mise à jour. ${res.data.piiUpdates.length} colonne(s) PII détectée(s).`,
        duration: 6,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      notification.error({
        message: "Erreur d'enrichissement",
        description: `Impossible d'enrichir le Data Product : ${message}`,
        duration: 8,
      });
    } finally {
      setEnriching(false);
    }
  };

  const handleSuggestRules = async (): Promise<void> => {
    if (!product) return;
    setSuggestingRules(true);
    try {
      await suggestQualityRulesAPI(product.name);
      const updated = await listQualityRules(product.name);
      setQualityRules(updated);
      notification.success({
        message: "Règles générées",
        description: `${updated.length} règle(s) de qualité disponibles.`,
        duration: 5,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      notification.error({
        message: "Erreur",
        description: `Impossible de générer les règles : ${message}`,
        duration: 8,
      });
    } finally {
      setSuggestingRules(false);
    }
  };

  const handleDeleteRule = async (ruleId: string): Promise<void> => {
    if (!product) return;
    try {
      await deleteQualityRule(product.name, ruleId);
      setQualityRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch {
      notification.error({ message: "Suppression échouée", duration: 4 });
    }
  };

  const handleLineage = (): void => {
    if (product?.id) {
      navigate(`/portal/catalog/lineage/${product.id}`);
    }
  };

  const handleCertify = (): void => {
    navigate(`/portal/catalog/certify/${encodeURIComponent(fqn)}`);
  };

  const handlePiiSubmit = async (values: PiiFormValues): Promise<void> => {
    setPiiSubmitting(true);
    setPiiError(null);
    try {
      await addPiiTag(fqn, values.columnName, values.tagFqn);
      setPiiModalOpen(false);
      piiForm.resetFields();
      if (product) {
        const updatedCols = await getDataProductColumns(product.name);
        setColumns(updatedCols);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setPiiError(`Impossible d'ajouter le tag PII : ${message}`);
    } finally {
      setPiiSubmitting(false);
    }
  };

  // PII table columns definition
  const piiTableColumns: ColumnsType<PiiRow> = [
    {
      title: "Nom de la colonne",
      dataIndex: "columnName",
      key: "columnName",
    },
    {
      title: "Type PII",
      dataIndex: "piiType",
      key: "piiType",
      render: (value: string) => {
        if (value === "—") return <span>—</span>;
        const color = value.startsWith("GDPR") ? "orange" : "red";
        return (
          <Tag color={color} style={{ borderRadius: 2 }}>
            {value}
          </Tag>
        );
      },
    },
    {
      title: "Durée de rétention",
      dataIndex: "retention",
      key: "retention",
    },
  ];

  // Column options for PII modal
  const columnOptions = columns.map(
    (c: DataProductColumn) => ({ label: c.columnName, value: c.columnName })
  );

  const piiRows = buildPiiRows(columns);

  return (
    <div
      className="site-card-wrapper"
      style={{ margin: "5px 0", padding: "0 16px" }}
    >
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
          {
            title: (
              <span
                style={{ cursor: "pointer", color: "#24527a" }}
                onClick={() => navigate("/portal/catalog/search")}
              >
                Recherche
              </span>
            ),
          },
          { title: product?.displayName ?? product?.name ?? fqn },
        ]}
      />

      <Title level={3} style={{ marginBottom: 16 }}>
        {product?.displayName ?? product?.name ?? "Data Product"}
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
        {product && (
          <Tabs
            defaultActiveKey="overview"
            items={[
              // ---------------------------------------------------------------
              // Tab 1 — Vue d'ensemble
              // ---------------------------------------------------------------
              {
                key: "overview",
                label: "Vue d'ensemble",
                children: (
                  <>
                    <Descriptions
                      bordered
                      column={1}
                      size="small"
                      style={{ marginBottom: 16 }}
                    >
                      <Descriptions.Item label="Nom">
                        {product.name}
                      </Descriptions.Item>

                      {product.displayName && (
                        <Descriptions.Item label="Nom affiché">
                          {product.displayName}
                        </Descriptions.Item>
                      )}

                      <Descriptions.Item label="FQN">
                        <code style={{ fontSize: 12 }}>{product.fqn}</code>
                      </Descriptions.Item>

                      {product.description && (
                        <Descriptions.Item label="Description">
                          {product.description}
                        </Descriptions.Item>
                      )}

                      {product.dataProductType && (
                        <Descriptions.Item label="Type">
                          {product.dataProductType}
                        </Descriptions.Item>
                      )}

                      {product.trustScore !== undefined && (
                        <Descriptions.Item label="Trust Score">
                          <Tag
                            color={
                              product.trustScore >= 0.8
                                ? "green"
                                : product.trustScore >= 0.5
                                ? "orange"
                                : "red"
                            }
                            style={{ borderRadius: 2 }}
                          >
                            Score : {(product.trustScore * 100).toFixed(0)}%
                          </Tag>
                        </Descriptions.Item>
                      )}

                      {product.domain && (
                        <Descriptions.Item label="Domaine">
                          {product.domain.name}
                        </Descriptions.Item>
                      )}

                      {product.owners && product.owners.length > 0 && (
                        <Descriptions.Item label="Propriétaires">
                          {product.owners.map((o) => o.name).join(", ")}
                        </Descriptions.Item>
                      )}

                      {product.tags && product.tags.length > 0 && (
                        <Descriptions.Item label="Tags">
                          {product.tags.map((t) => (
                            <Tag
                              key={t.tagFQN}
                              color="blue"
                              style={{ borderRadius: 2 }}
                            >
                              {t.tagFQN}
                            </Tag>
                          ))}
                        </Descriptions.Item>
                      )}
                    </Descriptions>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {product.id && (
                        <Button
                          type="primary"
                          style={{
                            backgroundColor: "#24527a",
                            borderColor: "#24527a",
                            borderRadius: 5,
                          }}
                          onClick={handleLineage}
                        >
                          Voir le lignage
                        </Button>
                      )}
                      <Button
                        icon={<ThunderboltOutlined />}
                        loading={enriching}
                        style={{
                          backgroundColor: "#4b2983",
                          borderColor: "#4b2983",
                          color: "#fff",
                          borderRadius: 5,
                        }}
                        onClick={handleEnrich}
                      >
                        Enrichir avec l'IA
                      </Button>
                    </div>
                  </>
                ),
              },

              // ---------------------------------------------------------------
              // Tab 2 — Accès (F13.8)
              // ---------------------------------------------------------------
              {
                key: "access",
                label: "Accès",
                children: (
                  <>
                    <Descriptions
                      bordered
                      column={1}
                      size="small"
                      style={{ marginBottom: 16 }}
                    >
                      <Descriptions.Item label="Politique d'accès">
                        <AccessPolicyBadge policy={product.accessPolicy} />
                      </Descriptions.Item>
                      <Descriptions.Item label="Niveau de qualité">
                        <QualityLevelBadge
                          level={
                            product.qualityLevel ??
                            product.extension?.qualityLevel
                          }
                        />
                      </Descriptions.Item>
                    </Descriptions>

                    <Button
                      type="default"
                      style={{
                        borderColor: "#24527a",
                        color: "#24527a",
                        borderRadius: 5,
                      }}
                      onClick={handleCertify}
                    >
                      Modifier la certification
                    </Button>
                  </>
                ),
              },

              // ---------------------------------------------------------------
              // Tab 3 — Qualité prédictive (Phase 4)
              // ---------------------------------------------------------------
              {
                key: "quality",
                label: "Qualité",
                children: (
                  <>
                    {stats.some((s) => s.driftAlert) && (
                      <Alert
                        type="warning"
                        message="Drift détecté"
                        description={`Anomalie de volume détectée (z-score: ${stats.find((s) => s.driftAlert)?.driftScore?.toFixed(2) ?? "—"}). Vérifiez le pipeline source.`}
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}

                    <Table<CatalogQualityRule>
                      rowKey="id"
                      size="small"
                      pagination={false}
                      style={{ marginBottom: 16 }}
                      dataSource={qualityRules}
                      locale={{ emptyText: <Empty description="Aucune règle de qualité" /> }}
                      columns={[
                        {
                          title: "Colonne",
                          dataIndex: "columnName",
                          key: "columnName",
                          render: (v: string | undefined) => v ?? <em style={{ color: "#888" }}>table</em>,
                          width: 160,
                        },
                        {
                          title: "Type",
                          dataIndex: "ruleType",
                          key: "ruleType",
                          render: (v: string) => <Tag color="blue" style={{ borderRadius: 2 }}>{v}</Tag>,
                          width: 110,
                        },
                        {
                          title: "Expression",
                          dataIndex: "expression",
                          key: "expression",
                        },
                        {
                          title: "",
                          key: "actions",
                          width: 60,
                          render: (_: unknown, record: CatalogQualityRule) => (
                            <Button
                              size="small"
                              danger
                              onClick={() => handleDeleteRule(record.id)}
                            >
                              ✕
                            </Button>
                          ),
                        },
                      ]}
                    />

                    <Button
                      icon={<ThunderboltOutlined />}
                      loading={suggestingRules}
                      style={{
                        backgroundColor: "#4b2983",
                        borderColor: "#4b2983",
                        color: "#fff",
                        borderRadius: 5,
                      }}
                      onClick={handleSuggestRules}
                    >
                      Suggérer des règles IA
                    </Button>
                  </>
                ),
              },

              // ---------------------------------------------------------------
              // Tab 4 — Gouvernance RGPD (F13.9)
              // ---------------------------------------------------------------
              {
                key: "gdpr",
                label: "Gouvernance RGPD",
                children: (
                  <>
                    <Alert
                      type="info"
                      message="Les colonnes marquées PII ne doivent pas être exposées sans anonymisation."
                      showIcon
                      style={{ marginBottom: 16 }}
                    />

                    <Table<PiiRow>
                      columns={piiTableColumns}
                      dataSource={piiRows}
                      pagination={false}
                      size="small"
                      style={{ marginBottom: 16 }}
                      locale={{
                        emptyText: (
                          <Empty description="Aucune colonne PII détectée" />
                        ),
                      }}
                    />

                    <Descriptions
                      bordered
                      column={1}
                      size="small"
                      style={{ marginBottom: 16 }}
                    >
                      <Descriptions.Item label="Responsable traitement">
                        {product.extension?.dataController ?? "—"}
                      </Descriptions.Item>
                    </Descriptions>

                    <Button
                      type="primary"
                      style={{
                        backgroundColor: "#24527a",
                        borderColor: "#24527a",
                        borderRadius: 5,
                      }}
                      onClick={() => {
                        setPiiError(null);
                        setPiiModalOpen(true);
                      }}
                    >
                      Déclarer une colonne PII
                    </Button>
                  </>
                ),
              },
            ]}
          />
        )}
      </Spin>

      {/* PII declaration modal */}
      <Modal
        title="Déclarer une colonne PII"
        open={piiModalOpen}
        onCancel={() => {
          setPiiModalOpen(false);
          piiForm.resetFields();
          setPiiError(null);
        }}
        footer={null}
        destroyOnClose
      >
        {piiError && (
          <Alert
            type="error"
            message={piiError}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          form={piiForm}
          layout="vertical"
          onFinish={handlePiiSubmit}
        >
          <Form.Item
            label="Colonne"
            name="columnName"
            rules={[{ required: true, message: "Veuillez sélectionner une colonne" }]}
          >
            <Select
              placeholder="Sélectionner une colonne"
              options={columnOptions}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label="Type PII"
            name="tagFqn"
            rules={[{ required: true, message: "Veuillez sélectionner un type PII" }]}
          >
            <Select placeholder="Sélectionner un type PII" options={PII_TAG_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="Durée de rétention (jours)"
            name="retentionDays"
            rules={[{ required: true, message: "Veuillez indiquer la durée de rétention" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={piiSubmitting}
              style={{
                backgroundColor: "#24527a",
                borderColor: "#24527a",
                borderRadius: 5,
              }}
            >
              Valider
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CatalogDataProduct;
