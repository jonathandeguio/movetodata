import React, { useEffect, useState } from 'react';
import axiosInstance from 'axios';
import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  BellFilled,
  BellOutlined,
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  LockOutlined,
  NodeIndexOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

import {
  addPiiTag,
  exportDataProduct,
  exportDataProductCsv,
  getDataProduct,
  getDataProductColumns,
  getGdprDeclaration,
  getLineageGraph,
  isSubscribedToProduct,
  listAuditLog,
  listDatasetStats,
  listGlossaryTerms,
  listQualityRules,
  createQualityRule,
  deleteQualityRule,
  recordProductView,
  subscribeToProduct,
  unsubscribeFromProduct,
  type CatalogAuditLog,
  type CatalogDatasetStats,
  type CatalogGlossaryTerm,
  type CatalogQualityRule,
  type DataProduct,
  type DataProductColumn,
} from '../../../services/catalogService';
import type { CatalogGdprDeclaration } from './types/catalogTypes';
import {
  catalogQueryAPI,
  enrichDataProductAPI,
  recommendDataProductsAPI,
  suggestQualityRulesAPI,
  type CatalogQueryResponse,
  type RecommendDataProductsResponse,
} from '../../../services/aiService';
import { useAiAssistantContext } from '../../../components/AiAssistant/AiAssistantContext';

import QualityBadge from './components/QualityBadge';
import AccessBadge from './components/AccessBadge';
import PiiBadge from './components/PiiBadge';
import TrustScoreBar from './components/TrustScoreBar';
import StatusPill from './components/StatusPill';
import { boslerColors } from './theme/boslerTokens';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function trustScoreToInt(ts?: number | null): number | null {
  if (ts == null) return null;
  return ts <= 1 ? Math.round(ts * 100) : Math.round(ts);
}

// ---------------------------------------------------------------------------
// Bandeau RESTRICTED
// ---------------------------------------------------------------------------

const RestrictedBanner: React.FC = () => (
  <div
    role="alert"
    style={{
      background: boslerColors.accessRestrictedBg,
      border: `1px solid ${boslerColors.accessRestrictedBorder}`,
      borderRadius: 2,
      padding: '10px 16px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}
  >
    <LockOutlined style={{ color: boslerColors.accessRestrictedText, fontSize: 15 }} />
    <Text style={{ color: boslerColors.accessRestrictedText, fontSize: 13 }}>
      Votre consultation de cet asset est journalisée (utilisateur, horodatage, adresse IP, asset_id)
    </Text>
  </div>
);

// ---------------------------------------------------------------------------
// Tuile métrique
// ---------------------------------------------------------------------------

interface MetricTileProps {
  title: string;
  children: React.ReactNode;
}

const MetricTile: React.FC<MetricTileProps> = ({ title, children }) => (
  <div
    style={{
      background: boslerColors.card,
      border: `1px solid ${boslerColors.cardBorder}`,
      borderRadius: 5,
      padding: '14px 18px',
      flex: '1 1 180px',
    }}
  >
    <Text
      style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 600,
        color: boslerColors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 8,
      }}
    >
      {title}
    </Text>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const CatalogDataProduct: React.FC = () => {
  const { fqn: rawFqn } = useParams<{ fqn: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fqn = rawFqn ? decodeURIComponent(rawFqn) : '';

  // Onglet actif synchronisé dans l'URL (?tab=)
  const activeTab = searchParams.get('tab') ?? 'overview';
  const setActiveTab = (tab: string) => {
    const p = new URLSearchParams(searchParams);
    p.set('tab', tab);
    setSearchParams(p, { replace: true });
  };

  // --- État principal ---
  const [product,       setProduct]       = useState<DataProduct | null>(null);
  const [columns,       setColumns]       = useState<DataProductColumn[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  // Données secondaires
  const [qualityRules,  setQualityRules]  = useState<CatalogQualityRule[]>([]);
  const [stats,         setStats]         = useState<CatalogDatasetStats[]>([]);
  const [auditLog,      setAuditLog]      = useState<CatalogAuditLog[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<CatalogGlossaryTerm[]>([]);
  const [gdprDecl,      setGdprDecl]      = useState<CatalogGdprDeclaration | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendDataProductsResponse['recommendations']>([]);
  const [subscribed,    setSubscribed]    = useState(false);

  // Résumé lignage (Lot 5)
  const [lineageSummary, setLineageSummary] = useState<{
    datasetsCount: number;
    downstreamProductsCount: number;
    dashboardsCount: number;
  } | null>(null);

  // Actions en cours
  const [enriching,         setEnriching]         = useState(false);
  const [subscribing,       setSubscribing]        = useState(false);
  const [suggestingRules,   setSuggestingRules]    = useState(false);
  const [computingTrust,    setComputingTrust]     = useState(false);

  // Text-to-SQL
  const [queryQuestion, setQueryQuestion] = useState('');
  const [queryResult,   setQueryResult]   = useState<CatalogQueryResponse | null>(null);
  const [queryLoading,  setQueryLoading]  = useState(false);

  // Modales
  const [columnEditOpen,     setColumnEditOpen]     = useState(false);
  const [columnEditTarget,   setColumnEditTarget]   = useState<DataProductColumn | null>(null);
  const [columnEditSaving,   setColumnEditSaving]   = useState(false);
  const [columnEditForm]     = Form.useForm();

  const [addRuleOpen,  setAddRuleOpen]   = useState(false);
  const [addRuleForm]  = Form.useForm();
  const [addRuleSaving, setAddRuleSaving] = useState(false);

  const { setCatalogContext } = useAiAssistantContext();

  // -------------------------------------------------------------------------
  // Chargement initial
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!fqn) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getDataProduct(fqn)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
        recordProductView(data.name).catch(() => {});

        // Charges secondaires (non-bloquantes)
        getDataProductColumns(data.name).then((cols) => { if (!cancelled) setColumns(cols); }).catch(() => {});
        listQualityRules(data.name).then(setQualityRules).catch(() => {});
        listDatasetStats(data.name).then(setStats).catch(() => {});
        listAuditLog(data.name).then(setAuditLog).catch(() => {});
        listGlossaryTerms().then(setGlossaryTerms).catch(() => {});
        getGdprDeclaration(data.name).then(setGdprDecl).catch(() => {});
        isSubscribedToProduct(data.name).then(setSubscribed).catch(() => {});
        recommendDataProductsAPI(data.name, 5).then((r) => setRecommendations(r.data.recommendations)).catch(() => {});
        // Lignage (Lot 5) — résumé onglet 5
        getLineageGraph(data.name, 1, 1)
          .then((g) => {
            if (cancelled) return;
            setLineageSummary({
              datasetsCount:          g.nodes.filter((n) => n.type === 'DATASET').length,
              downstreamProductsCount: g.nodes.filter((n) => n.type === 'DATA_PRODUCT' && !n.isFocus).length,
              dashboardsCount:         g.nodes.filter((n) => n.type === 'DASHBOARD').length,
            });
          })
          .catch(() => {});
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [fqn]);

  // Injecter contexte IA
  useEffect(() => {
    if (!product) return;
    setCatalogContext({
      productName: product.name,
      description: product.description,
      domain: product.domain?.name ?? product.domainId,
      qualityLevel: product.qualityLevel,
      columns: columns.length > 0 ? JSON.stringify(columns) : undefined,
    });
    return () => { setCatalogContext(undefined); };
  }, [product, columns, setCatalogContext]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleSubscribeToggle = async () => {
    if (!product) return;
    setSubscribing(true);
    try {
      if (subscribed) {
        await unsubscribeFromProduct(product.name);
        setSubscribed(false);
        notification.info({ message: 'Désabonné', duration: 3 });
      } else {
        await subscribeToProduct(product.name);
        setSubscribed(true);
        notification.success({ message: 'Abonné aux alertes', duration: 3 });
      }
    } catch (e: unknown) {
      notification.error({ message: 'Erreur abonnement', description: e instanceof Error ? e.message : '', duration: 5 });
    } finally {
      setSubscribing(false);
    }
  };

  const handleExportJson = async () => {
    if (!product) return;
    try {
      const data = await exportDataProduct(product.name);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${product.name}_export.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      notification.error({ message: 'Export JSON échoué', description: e instanceof Error ? e.message : '', duration: 5 });
    }
  };

  const handleExportCsv = async () => {
    if (!product) return;
    try {
      await exportDataProductCsv(product.name);
    } catch (e: unknown) {
      notification.error({ message: 'Export CSV échoué', description: e instanceof Error ? e.message : '', duration: 5 });
    }
  };

  const handleEnrich = async () => {
    if (!product) return;
    setEnriching(true);
    try {
      await enrichDataProductAPI(product.name);
      const updated = await getDataProduct(fqn);
      setProduct(updated);
      setColumns(await getDataProductColumns(updated.name));
      notification.success({ message: 'Enrichissement terminé', duration: 5 });
    } catch (e: unknown) {
      notification.error({ message: "Erreur d'enrichissement", description: e instanceof Error ? e.message : '', duration: 6 });
    } finally {
      setEnriching(false);
    }
  };

  const handleSuggestRules = async () => {
    if (!product) return;
    setSuggestingRules(true);
    try {
      await suggestQualityRulesAPI(product.name);
      setQualityRules(await listQualityRules(product.name));
      notification.success({ message: 'Règles générées', duration: 4 });
    } catch (e: unknown) {
      notification.error({ message: 'Erreur', description: e instanceof Error ? e.message : '', duration: 5 });
    } finally {
      setSuggestingRules(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!product) return;
    try {
      await deleteQualityRule(product.name, ruleId);
      setQualityRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch {
      notification.error({ message: 'Suppression échouée', duration: 3 });
    }
  };

  const handleAddRule = async (values: { ruleType: string; expression: string; columnName?: string; severity?: string }) => {
    if (!product) return;
    setAddRuleSaving(true);
    try {
      await createQualityRule(product.name, values);
      setQualityRules(await listQualityRules(product.name));
      setAddRuleOpen(false);
      addRuleForm.resetFields();
    } catch (e: unknown) {
      notification.error({ message: "Erreur d'ajout de règle", description: e instanceof Error ? e.message : '', duration: 5 });
    } finally {
      setAddRuleSaving(false);
    }
  };

  const handleComputeTrust = async () => {
    if (!product) return;
    setComputingTrust(true);
    try {
      await axiosInstance.post(`/api/catalog/data-products/${encodeURIComponent(product.name)}/compute-trust-score`);
      const dp = await getDataProduct(fqn);
      setProduct(dp);
      notification.success({ message: 'Score recalculé', duration: 3 });
    } catch (e: unknown) {
      notification.error({ message: 'Erreur calcul score', description: e instanceof Error ? e.message : '', duration: 5 });
    } finally {
      setComputingTrust(false);
    }
  };

  const handleCatalogQuery = async () => {
    if (!product || !queryQuestion.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await catalogQueryAPI(product.name, queryQuestion);
      setQueryResult(res.data);
    } catch (e: unknown) {
      notification.error({ message: 'Erreur Query IA', description: e instanceof Error ? e.message : '', duration: 5 });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleOpenColumnEdit = (col: DataProductColumn) => {
    setColumnEditTarget(col);
    columnEditForm.setFieldsValue({ description: col.description, piiType: col.piiType });
    setColumnEditOpen(true);
  };

  const handleSaveColumnEdit = async (values: { description?: string; piiType?: string }) => {
    if (!product || !columnEditTarget) return;
    setColumnEditSaving(true);
    try {
      await addPiiTag(fqn, columnEditTarget.columnName, values.piiType ?? '');
      setColumns(await getDataProductColumns(product.name));
      setColumnEditOpen(false);
    } catch (e: unknown) {
      notification.error({ message: 'Erreur mise à jour colonne', description: e instanceof Error ? e.message : '', duration: 5 });
    } finally {
      setColumnEditSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Données dérivées
  // -------------------------------------------------------------------------

  const trustScoreInt = trustScoreToInt(product?.trustScore as unknown as number | null);
  const latestStats   = stats[0];
  const driftAlert    = stats.some((s) => s.driftAlert);
  const driftScore    = stats.find((s) => s.driftAlert)?.driftScore;

  // Niveau de certification suivant
  const nextCertLevel = (): string => {
    const current = product?.qualityLevel;
    if (!current || current === 'BRONZE') return 'SILVER';
    if (current === 'SILVER') return 'GOLD';
    return 'GOLD';
  };

  // -------------------------------------------------------------------------
  // Rendu
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="Erreur de chargement" description={error} showIcon />
      </div>
    );
  }

  if (!product) return null;

  const qualityLevelLower = (product.qualityLevel ?? '').toLowerCase() as 'gold' | 'silver' | 'bronze' | '';

  const tabItems = [
    // -------------------------------------------------------------------------
    // Onglet 1 — Aperçu
    // -------------------------------------------------------------------------
    {
      key: 'overview',
      label: 'Aperçu',
      children: (
        <div style={{ padding: '16px 0' }}>
          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            {product.descriptionSource === 'ai' && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  padding: '2px 10px',
                  borderRadius: 2,
                  background: '#f0f0ff',
                  border: '1px solid #c5c0e8',
                  fontSize: 11,
                  color: '#4b2983',
                }}
              >
                <RobotOutlined />
                Générée par IA · validée
              </div>
            )}
            <Text style={{ fontSize: 14, color: boslerColors.text, lineHeight: 1.6 }}>
              {product.description ?? <em style={{ color: boslerColors.textMuted }}>Aucune description</em>}
            </Text>
          </div>

          {/* Cas d'usage */}
          {product.useCases && (
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ fontSize: 13, color: boslerColors.textTitle }}>Cas d'usage</Text>
              <Text style={{ display: 'block', marginTop: 6, fontSize: 13, color: boslerColors.textSecondary }}>
                {product.useCases}
              </Text>
            </div>
          )}

          {/* Termes du glossaire liés */}
          {columns.some((c) => c.glossaryTermId) && (
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ fontSize: 13, color: boslerColors.textTitle }}>Termes du glossaire</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {columns
                  .filter((c) => c.glossaryTermId)
                  .map((c) => {
                    const term = glossaryTerms.find((t) => t.id === c.glossaryTermId);
                    return (
                      <Tag key={c.columnName} color="geekblue" style={{ borderRadius: 2, fontSize: 12 }}>
                        {c.columnName} → {term?.term ?? c.glossaryTermId}
                      </Tag>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Assets liés / recommandations */}
          {recommendations.length > 0 && (
            <div>
              <Text strong style={{ fontSize: 13, color: boslerColors.textTitle }}>Assets liés</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {recommendations.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: `1px solid ${boslerColors.cardBorder}`,
                      borderRadius: 5,
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/portal/catalog/data-product/${encodeURIComponent(r.name)}`)}
                  >
                    <Text style={{ fontSize: 13, color: boslerColors.primary, fontWeight: 500 }}>{r.name}</Text>
                    <Tag style={{ borderRadius: 2, fontSize: 11 }}>{(r.score * 100).toFixed(0)}% similaire</Tag>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // Onglet 2 — Schéma
    // -------------------------------------------------------------------------
    {
      key: 'schema',
      label: 'Schéma',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Table<DataProductColumn>
            rowKey="columnName"
            size="small"
            pagination={{ pageSize: 30, hideOnSinglePage: true }}
            dataSource={columns}
            locale={{ emptyText: <Empty description="Aucune colonne disponible" /> }}
            columns={[
              {
                title: 'Colonne',
                dataIndex: 'columnName',
                key: 'columnName',
                width: 200,
                render: (v: string) => (
                  <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{v}</code>
                ),
              },
              {
                title: 'Type',
                dataIndex: 'columnType',
                key: 'columnType',
                width: 120,
                render: (v?: string) => v
                  ? <Tag style={{ borderRadius: 2, fontSize: 11 }}>{v}</Tag>
                  : <span style={{ color: boslerColors.textMuted }}>—</span>,
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                render: (v?: string) => v ?? <span style={{ color: boslerColors.textMuted }}>—</span>,
              },
              {
                title: 'Tags PII',
                dataIndex: 'piiType',
                key: 'piiType',
                width: 150,
                render: (v?: string) => v
                  ? <PiiBadge label={v} />
                  : <span style={{ color: boslerColors.textMuted }}>—</span>,
              },
              {
                title: '',
                key: 'actions',
                width: 80,
                render: (_: unknown, rec: DataProductColumn) => (
                  <Button size="small" onClick={() => handleOpenColumnEdit(rec)}>
                    Modifier
                  </Button>
                ),
              },
            ] satisfies ColumnsType<DataProductColumn>}
          />

          {/* Modal inline édition colonne */}
          <Modal
            title={`Modifier la colonne « ${columnEditTarget?.columnName ?? ''} »`}
            open={columnEditOpen}
            onCancel={() => { setColumnEditOpen(false); columnEditForm.resetFields(); }}
            footer={null}
            destroyOnClose
          >
            <Form form={columnEditForm} layout="vertical" onFinish={handleSaveColumnEdit}>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="Type PII" name="piiType">
                <Select
                  allowClear
                  placeholder="Aucun"
                  options={[
                    { label: 'PII.Sensitive', value: 'PII.Sensitive' },
                    { label: 'GDPR.Sensitive', value: 'GDPR.Sensitive' },
                    { label: 'GDPR.ID', value: 'GDPR.ID' },
                  ]}
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={columnEditSaving}
                  style={{ backgroundColor: boslerColors.primary, borderColor: boslerColors.primary, borderRadius: 2 }}
                >
                  Enregistrer
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // Onglet 3 — Qualité & drift
    // -------------------------------------------------------------------------
    {
      key: 'quality',
      label: 'Qualité & drift',
      children: (() => {
        // Calculs statistiques pour l'histogramme
        const counts = stats.map((s) => Number(s.recordCount));
        const mean   = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
        const stdDev = counts.length > 1
          ? Math.sqrt(counts.reduce((acc, v) => acc + (v - mean) ** 2, 0) / counts.length)
          : 0;

        // Composantes du score calculées côté frontend
        const docScore = (() => {
          let s = 0;
          if (product.description != null && product.description.length > 0) s += 0.25;
          if (product.domainId != null) s += 0.25;
          if (product.ownerId != null) s += 0.25;
          if (product.qualityLevel != null) s += 0.25;
          return s;
        })();
        const certScore = (() => {
          if (product.qualityLevel === 'GOLD')   return 1.0;
          if (product.qualityLevel === 'SILVER') return 0.6;
          if (product.qualityLevel === 'BRONZE') return 0.3;
          return 0;
        })();
        const enabledCount = qualityRules.filter((r) => r.enabled).length;
        const qualScore = Math.min(1.0, enabledCount / 5);
        const freshScore = (() => {
          if (!latestStats) return 0;
          const daysAgo = (Date.now() - new Date(latestStats.measuredAt).getTime()) / 86_400_000;
          if (daysAgo <= 7)  return 1.0;
          if (daysAgo <= 30) return 0.5;
          return 0;
        })();
        // Usage : approximation viewCount / 100 (sans moyenne plateforme côté front)
        const usageScore = product.viewCount != null ? Math.min(1.0, (product.viewCount as unknown as number) / 100) : 0.5;

        const scoreComponents: Array<{ label: string; value: number; weight: number }> = [
          { label: 'Complétude',   value: docScore,   weight: 20 },
          { label: 'Certification', value: certScore, weight: 10 },
          { label: 'Qualité',      value: qualScore,  weight: 30 },
          { label: 'Fraîcheur',    value: freshScore, weight: 25 },
          { label: 'Usage',        value: usageScore, weight: 15 },
        ];

        const barColor = (v: number): string => {
          const pctV = Math.round(v * 100);
          if (pctV >= 85) return boslerColors.trustHigh;
          if (pctV >= 60) return boslerColors.trustMedium;
          return boslerColors.trustLow;
        };

        const handleDeleteRuleWithConfirm = (ruleId: string, expression: string) => {
          Modal.confirm({
            title: 'Supprimer cette règle ?',
            content: (
              <span>
                <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{expression}</code>
                <span style={{ display: 'block', marginTop: 8, color: boslerColors.textMuted }}>
                  Cette action est irréversible.
                </span>
              </span>
            ),
            okText: 'Supprimer',
            okType: 'danger',
            cancelText: 'Annuler',
            onOk: () => handleDeleteRule(ruleId),
          });
        };

        return (
          <div style={{ padding: '16px 0' }}>
            {driftAlert && (
              <Alert
                type="warning"
                showIcon
                message="Drift détecté"
                description={`Anomalie de volume (z-score : ${driftScore?.toFixed(2) ?? '—'}). Vérifiez le pipeline source.`}
                style={{ marginBottom: 16, borderRadius: 5 }}
              />
            )}

            {/* Histogramme des 30 derniers snapshots */}
            {stats.length > 0 ? (
              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ fontSize: 13, color: boslerColors.textTitle }}>
                  Volume des données ({stats.length} snapshot{stats.length > 1 ? 's' : ''})
                </Text>

                {stats.length < 10 && (
                  <Alert
                    type="info"
                    showIcon
                    message={`Drift non calculable (min 10 snapshots, ${stats.length} disponible${stats.length > 1 ? 's' : ''})`}
                    style={{ marginTop: 8, marginBottom: 8, borderRadius: 5 }}
                  />
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 3,
                    marginTop: 12,
                    height: 80,
                    borderBottom: `1px solid ${boslerColors.separator}`,
                    paddingBottom: 4,
                  }}
                >
                  {[...stats].reverse().map((s, i) => {
                    const maxCount = Math.max(...stats.map((x) => Number(x.recordCount)));
                    const heightPct = maxCount > 0 ? (Number(s.recordCount) / maxCount) * 100 : 0;
                    const isLast = i === stats.length - 1;
                    return (
                      <div
                        key={s.id}
                        title={`${Number(s.recordCount).toLocaleString('fr-FR')} lignes — ${formatDate(s.measuredAt)}`}
                        style={{
                          flex: 1,
                          height: `${heightPct}%`,
                          background: isLast ? boslerColors.primary : '#9fb8cf',
                          borderRadius: '2px 2px 0 0',
                          minHeight: 2,
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                  <Text style={{ fontSize: 12, color: boslerColors.textSecondary }}>
                    Moyenne : {Math.round(mean).toLocaleString('fr-FR')} lignes
                  </Text>
                  {counts.length > 1 && (
                    <Text style={{ fontSize: 12, color: boslerColors.textSecondary }}>
                      Écart-type : {Math.round(stdDev).toLocaleString('fr-FR')}
                    </Text>
                  )}
                </div>
              </div>
            ) : (
              <Alert
                type="info"
                showIcon
                message="Drift non calculable (min 10 snapshots, 0 disponible)"
                style={{ marginBottom: 16, borderRadius: 5 }}
              />
            )}

            {/* Composantes du score */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ fontSize: 13, color: boslerColors.textTitle, display: 'block', marginBottom: 10 }}>
                Composantes du score de confiance
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scoreComponents.map(({ label, value, weight }) => {
                  const pctVal = Math.round(value * weight);
                  return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Text style={{ width: 100, fontSize: 12, color: boslerColors.textSecondary, flexShrink: 0 }}>
                        {label}
                      </Text>
                      <div style={{ flex: 1, background: boslerColors.separator, borderRadius: 2, height: 8, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.round(value * 100)}%`,
                            height: '100%',
                            background: barColor(value),
                            borderRadius: 2,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <Text style={{ width: 60, fontSize: 12, color: boslerColors.textMuted, textAlign: 'right', flexShrink: 0 }}>
                        {pctVal}/{weight} pts
                      </Text>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Règles qualité */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text strong style={{ fontSize: 13, color: boslerColors.textTitle }}>Règles de qualité</Text>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="small"
                  icon={<ThunderboltOutlined />}
                  loading={suggestingRules}
                  onClick={handleSuggestRules}
                  style={{ borderRadius: 2 }}
                >
                  Suggérer (IA)
                </Button>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => setAddRuleOpen(true)}
                  style={{ backgroundColor: boslerColors.primary, borderColor: boslerColors.primary, borderRadius: 2 }}
                >
                  + Règle
                </Button>
              </div>
            </div>

            <Table<CatalogQualityRule>
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={qualityRules}
              style={{ marginBottom: 16 }}
              locale={{ emptyText: <Empty description="Aucune règle de qualité" /> }}
              columns={[
                {
                  title: 'Colonne',
                  dataIndex: 'columnName',
                  width: 160,
                  render: (v?: string) => v
                    ? <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{v}</code>
                    : <em style={{ color: boslerColors.textMuted, fontSize: 11 }}>table</em>,
                },
                {
                  title: 'Type',
                  dataIndex: 'ruleType',
                  width: 120,
                  render: (v: string) => <Tag style={{ borderRadius: 2, fontSize: 11 }}>{v}</Tag>,
                },
                {
                  title: 'Expression',
                  dataIndex: 'expression',
                  render: (v: string) => (
                    <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{v}</code>
                  ),
                },
                {
                  title: 'Statut',
                  key: 'status',
                  width: 70,
                  render: (_: unknown, rec: CatalogQualityRule) => {
                    const color = rec.enabled ? boslerColors.accessPublicText : boslerColors.textMuted;
                    const bg    = rec.enabled ? boslerColors.accessPublicBg   : boslerColors.qualitySilverBg;
                    return (
                      <span style={{
                        display: 'inline-block',
                        width: 10, height: 10,
                        borderRadius: '50%',
                        background: color,
                        border: `2px solid ${bg}`,
                        verticalAlign: 'middle',
                      }}
                        title={rec.enabled ? 'Active' : 'Inactive'}
                        aria-label={rec.enabled ? 'Règle active' : 'Règle inactive'}
                      />
                    );
                  },
                },
                {
                  title: '',
                  key: 'del',
                  width: 50,
                  render: (_: unknown, rec: CatalogQualityRule) => (
                    <Button
                      size="small"
                      danger
                      aria-label={`Supprimer la règle ${rec.expression}`}
                      onClick={() => handleDeleteRuleWithConfirm(rec.id, rec.expression)}
                    >
                      ✕
                    </Button>
                  ),
                },
              ] satisfies ColumnsType<CatalogQualityRule>}
            />

            <Button
              onClick={handleComputeTrust}
              loading={computingTrust}
              style={{ borderRadius: 2, borderColor: boslerColors.fieldBorder }}
            >
              Recalculer le score maintenant
            </Button>

            {/* Modal + règle */}
            <Modal
              title="Ajouter une règle de qualité"
              open={addRuleOpen}
              onCancel={() => { setAddRuleOpen(false); addRuleForm.resetFields(); }}
              footer={null}
              destroyOnClose
            >
              <Form form={addRuleForm} layout="vertical" onFinish={handleAddRule}>
                <Form.Item label="Type" name="ruleType" rules={[{ required: true, message: 'Sélectionnez un type' }]}>
                  <Select options={[
                    { label: 'NOT_NULL', value: 'NOT_NULL' },
                    { label: 'RANGE', value: 'RANGE' },
                    { label: 'REGEX', value: 'REGEX' },
                    { label: 'UNIQUENESS', value: 'UNIQUENESS' },
                    { label: 'CUSTOM', value: 'CUSTOM' },
                  ]} />
                </Form.Item>
                <Form.Item label="Expression de la règle" name="expression" rules={[{ required: true, message: 'Saisissez une expression' }]}>
                  <Input style={{ fontFamily: 'ui-monospace, monospace' }} placeholder="ex: column IS NOT NULL" />
                </Form.Item>
                <Form.Item label="Colonne (optionnel)" name="columnName">
                  <Select
                    allowClear
                    showSearch
                    options={columns.map((c) => ({ label: c.columnName, value: c.columnName }))}
                  />
                </Form.Item>
                <Form.Item label="Criticité" name="severity" initialValue="MEDIUM">
                  <Select options={[
                    { label: 'Critique',  value: 'CRITICAL' },
                    { label: 'Haute',     value: 'HIGH' },
                    { label: 'Moyenne',   value: 'MEDIUM' },
                    { label: 'Basse',     value: 'LOW' },
                  ]} />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={addRuleSaving}
                    style={{ backgroundColor: boslerColors.primary, borderColor: boslerColors.primary, borderRadius: 2 }}
                  >
                    Ajouter
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
          </div>
        );
      })(),
    },

    // -------------------------------------------------------------------------
    // Onglet 4 — Gouvernance
    // -------------------------------------------------------------------------
    {
      key: 'governance',
      label: 'Gouvernance',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Alert
            type="info"
            showIcon
            message="Les colonnes PII ne doivent pas être exposées sans anonymisation."
            style={{ marginBottom: 16, borderRadius: 5 }}
          />

          {/* Déclaration RGPD */}
          <Descriptions
            bordered
            column={1}
            size="small"
            title="Déclaration RGPD"
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Responsable traitement">
              {gdprDecl?.dataController ?? <em style={{ color: boslerColors.textMuted }}>—</em>}
            </Descriptions.Item>
            <Descriptions.Item label="Finalité">
              {gdprDecl?.purpose ?? <em style={{ color: boslerColors.textMuted }}>—</em>}
            </Descriptions.Item>
            <Descriptions.Item label="Base légale">
              {gdprDecl?.legalBasis ?? <em style={{ color: boslerColors.textMuted }}>—</em>}
            </Descriptions.Item>
            <Descriptions.Item label="Durée de rétention">
              {gdprDecl?.retentionDays ? `${gdprDecl.retentionDays} jours` : <em style={{ color: boslerColors.textMuted }}>—</em>}
            </Descriptions.Item>
            <Descriptions.Item label="Colonnes PII">
              {gdprDecl?.piiColumns?.length
                ? gdprDecl.piiColumns.map((c) => (
                    <Tag key={c} style={{ borderRadius: 2, border: `1px solid ${boslerColors.piiBorder}`, color: boslerColors.piiBorder, background: 'transparent' }}>{c}</Tag>
                  ))
                : <em style={{ color: boslerColors.textMuted }}>Aucune</em>}
            </Descriptions.Item>
          </Descriptions>

          {/* Politique d'accès */}
          <Descriptions bordered column={1} size="small" title="Politique d'accès">
            <Descriptions.Item label="Politique">
              {product.accessPolicy ? <AccessBadge policy={product.accessPolicy} /> : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Origine">
              {product.policyInherited
                ? <span style={{ color: boslerColors.textMuted, fontSize: 12 }}>Héritée du domaine</span>
                : <span style={{ color: boslerColors.textMuted, fontSize: 12 }}>Définie sur cet asset</span>}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // Onglet 5 — Lignage
    // -------------------------------------------------------------------------
    {
      key: 'lineage',
      label: 'Lignage',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Text style={{ fontSize: 14, color: boslerColors.textSecondary }}>
            Visualisez les dépendances en amont et en aval de ce Data Product.
          </Text>

          {/* Résumé de lignage (profondeur 1) */}
          {lineageSummary && (
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 16,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  background: boslerColors.pageBg,
                  border: `1px solid ${boslerColors.cardBorder}`,
                  borderRadius: 5,
                  padding: '10px 16px',
                  textAlign: 'center',
                  minWidth: 100,
                }}
              >
                <Text style={{ display: 'block', fontSize: 22, fontWeight: 700, color: boslerColors.primary }}>
                  {lineageSummary.datasetsCount}
                </Text>
                <Text style={{ fontSize: 11, color: boslerColors.textMuted }}>Datasets sources</Text>
              </div>
              <div
                style={{
                  background: boslerColors.pageBg,
                  border: `1px solid ${boslerColors.cardBorder}`,
                  borderRadius: 5,
                  padding: '10px 16px',
                  textAlign: 'center',
                  minWidth: 100,
                }}
              >
                <Text style={{ display: 'block', fontSize: 22, fontWeight: 700, color: boslerColors.primary }}>
                  {lineageSummary.downstreamProductsCount}
                </Text>
                <Text style={{ fontSize: 11, color: boslerColors.textMuted }}>Data Products aval</Text>
              </div>
              <div
                style={{
                  background: boslerColors.pageBg,
                  border: `1px solid ${boslerColors.cardBorder}`,
                  borderRadius: 5,
                  padding: '10px 16px',
                  textAlign: 'center',
                  minWidth: 100,
                }}
              >
                <Text style={{ display: 'block', fontSize: 22, fontWeight: 700, color: boslerColors.primary }}>
                  {lineageSummary.dashboardsCount}
                </Text>
                <Text style={{ fontSize: 11, color: boslerColors.textMuted }}>Dashboards consommateurs</Text>
              </div>
            </div>
          )}

          {product.name && (
            <div style={{ marginTop: 16 }}>
              <Link
                to={`/portal/catalog/lineage/${encodeURIComponent(product.name)}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 2,
                  background: boslerColors.primary,
                  color: '#fff',
                  fontFamily: '"Poppins", system-ui, sans-serif',
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                <NodeIndexOutlined />
                Voir le graphe complet
              </Link>
            </div>
          )}
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // Onglet 6 — Interroger (Text-to-SQL)
    // -------------------------------------------------------------------------
    {
      key: 'query',
      label: 'Interroger',
      children: (
        <div style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CodeOutlined style={{ color: boslerColors.primary, fontSize: 16 }} />
            <Text strong style={{ color: boslerColors.textTitle, fontSize: 14 }}>Text-to-SQL</Text>
          </div>

          <Input.TextArea
            value={queryQuestion}
            onChange={(e) => setQueryQuestion(e.target.value)}
            placeholder="Ex : Quelle est la moyenne des commandes par client ?"
            rows={3}
            style={{ marginBottom: 10, borderRadius: 2, fontFamily: '"Poppins", system-ui, sans-serif' }}
          />
          <Button
            type="primary"
            onClick={handleCatalogQuery}
            loading={queryLoading}
            disabled={!queryQuestion.trim()}
            style={{ backgroundColor: boslerColors.primary, borderColor: boslerColors.primary, borderRadius: 2 }}
          >
            Générer le SQL
          </Button>

          {queryResult && (
            <div style={{ marginTop: 16 }}>
              {/* Bandeau PII masqué */}
              {queryResult.piiMasked && (
                <Alert
                  type="info"
                  showIcon
                  message="Certaines colonnes PII ont été masquées selon votre rôle"
                  style={{ marginBottom: 10, borderRadius: 5 }}
                />
              )}

              {/* Alerte warning */}
              {queryResult.warning && (
                <Alert
                  type="warning"
                  showIcon
                  message={queryResult.warning}
                  style={{ marginBottom: 10, borderRadius: 5 }}
                />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Tag
                  style={{
                    borderRadius: 2,
                    background: queryResult.confidence >= 0.7
                      ? boslerColors.accessPublicBg
                      : queryResult.confidence >= 0.4
                      ? '#fff7e6'
                      : boslerColors.accessRestrictedBg,
                    color: queryResult.confidence >= 0.7
                      ? boslerColors.accessPublicText
                      : queryResult.confidence >= 0.4
                      ? '#7a4000'
                      : boslerColors.accessRestrictedText,
                    border: 'none',
                  }}
                >
                  Confiance : {(queryResult.confidence * 100).toFixed(0)}%
                </Tag>
                <Text style={{ fontSize: 11, color: boslerColors.textMuted }}>{queryResult.model}</Text>
              </div>
              <pre
                style={{
                  background: boslerColors.dark,
                  color: '#e2e8f0',
                  padding: '12px 16px',
                  borderRadius: 5,
                  fontSize: 12,
                  fontFamily: 'ui-monospace, "Cascadia Code", Consolas, monospace',
                  overflowX: 'auto',
                  margin: 0,
                }}
              >
                {queryResult.sql}
              </pre>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(queryResult.sql);
                    notification.success({ message: 'SQL copié', duration: 2 });
                  }}
                  style={{ borderRadius: 2 }}
                >
                  Copier
                </Button>
              </div>
            </div>
          )}
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // Onglet 7 — Historique & audit
    // -------------------------------------------------------------------------
    {
      key: 'history',
      label: 'Historique',
      children: (
        <div style={{ padding: '16px 0' }}>
          {auditLog.length === 0 ? (
            <Empty description="Aucune action enregistrée" />
          ) : (
            <Table<CatalogAuditLog>
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20, hideOnSinglePage: true }}
              dataSource={auditLog}
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'createdAt',
                  width: 150,
                  render: (v: string) => <span style={{ fontSize: 12 }}>{formatDate(v)}</span>,
                },
                {
                  title: 'Action',
                  dataIndex: 'action',
                  width: 130,
                  render: (v: string) => {
                    const colorMap: Record<string, string> = {
                      CERTIFY: 'gold', CREATE: 'green', UPDATE: 'blue',
                      PATCH_COLUMN: 'cyan', SUBSCRIBE: 'purple', UPDATE_GDPR: 'orange',
                    };
                    return (
                      <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
                        <Tag color={colorMap[v] ?? 'default'} style={{ borderRadius: 2 }}>{v}</Tag>
                      </code>
                    );
                  },
                },
                {
                  title: 'Détail',
                  dataIndex: 'detail',
                  render: (v?: string) => v
                    ? <span style={{ fontSize: 12 }}>{v}</span>
                    : <em style={{ color: boslerColors.textMuted, fontSize: 12 }}>—</em>,
                },
              ] satisfies ColumnsType<CatalogAuditLog>}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        background: boslerColors.pageBg,
        minHeight: '100vh',
        padding: '20px 24px',
        fontFamily: '"Poppins", system-ui, sans-serif',
      }}
    >
      {/* Bandeau RESTRICTED */}
      {product.accessPolicy === 'RESTRICTED' && <RestrictedBanner />}

      {/* En-tête */}
      <div style={{ background: boslerColors.card, border: `1px solid ${boslerColors.cardBorder}`, borderRadius: 5, padding: '20px 24px', marginBottom: 20 }}>
        {/* Titre + badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <Title level={3} style={{ margin: 0, color: boslerColors.textTitle, fontFamily: '"Poppins", system-ui, sans-serif', fontSize: 20 }}>
                {product.displayName ?? product.name}
              </Title>
              {qualityLevelLower && <QualityBadge level={qualityLevelLower} />}
              {product.accessPolicy && <AccessBadge policy={product.accessPolicy} />}
              {columns.some((c) => c.piiType) && <PiiBadge />}
            </div>
            <code style={{ fontSize: 11, color: boslerColors.textMuted, fontFamily: 'ui-monospace, "Cascadia Code", Consolas, monospace' }}>
              {product.fqn ?? product.name}
            </code>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleSubscribeToggle}
              aria-pressed={subscribed}
              disabled={subscribing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 2,
                border: `1px solid ${boslerColors.fieldBorder}`,
                background: 'transparent',
                color: subscribed ? boslerColors.primary : boslerColors.textSecondary,
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: '"Poppins", system-ui, sans-serif',
              }}
            >
              {subscribed ? <BellFilled style={{ color: boslerColors.primary }} /> : <BellOutlined />}
              {subscribed ? 'Abonné' : "S'abonner aux alertes"}
            </button>

            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleExportJson}
              style={{ borderRadius: 2, fontSize: 12 }}
            >
              JSON
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleExportCsv}
              style={{ borderRadius: 2, fontSize: 12 }}
            >
              CSV
            </Button>
            <Button
              size="small"
              onClick={() => navigate(`/portal/catalog/certify/${encodeURIComponent(fqn)}`)}
              style={{ borderRadius: 2, fontSize: 12, borderColor: boslerColors.fieldBorder }}
            >
              Modifier
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={() => navigate(`/portal/catalog/certify/${encodeURIComponent(fqn)}`)}
              style={{ backgroundColor: boslerColors.primary, borderColor: boslerColors.primary, borderRadius: 2, fontSize: 12 }}
            >
              Demander la certification {nextCertLevel()}
            </Button>
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              loading={enriching}
              onClick={handleEnrich}
              style={{ borderRadius: 2, fontSize: 12, background: '#4b2983', borderColor: '#4b2983', color: '#fff' }}
            >
              Enrichir IA
            </Button>
          </div>
        </div>

        {/* 4 tuiles métriques */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          {/* Score de confiance */}
          <MetricTile title="Score de confiance">
            {trustScoreInt != null ? (
              <>
                <TrustScoreBar score={trustScoreInt} width={110} />
                <Text style={{ display: 'block', marginTop: 4, fontSize: 20, fontWeight: 700, color: boslerColors.textTitle }}>
                  {trustScoreInt}<span style={{ fontSize: 12, fontWeight: 400, color: boslerColors.textMuted }}>/100</span>
                </Text>
              </>
            ) : (
              <Text style={{ color: boslerColors.textMuted, fontSize: 13 }}>—</Text>
            )}
          </MetricTile>

          {/* Volumétrie */}
          <MetricTile title="Volumétrie">
            {latestStats ? (
              <>
                <Text style={{ fontSize: 20, fontWeight: 700, color: boslerColors.textTitle }}>
                  {Number(latestStats.recordCount).toLocaleString('fr-FR')}
                </Text>
                <Text style={{ display: 'block', fontSize: 11, color: boslerColors.textMuted }}>
                  Lignes · snapshot du {formatDate(latestStats.measuredAt)}
                </Text>
              </>
            ) : (
              <Text style={{ color: boslerColors.textMuted, fontSize: 13 }}>Aucune donnée</Text>
            )}
          </MetricTile>

          {/* Drift */}
          <MetricTile title="Drift">
            {latestStats ? (
              <>
                {driftAlert
                  ? <StatusPill status={`Alerte z=${driftScore?.toFixed(2)}`} variant="error" />
                  : <StatusPill status={`Normal z=${latestStats.driftScore?.toFixed(2) ?? '0.00'}`} variant="success" />}
                <Text style={{ display: 'block', marginTop: 4, fontSize: 11, color: boslerColors.textMuted }}>
                  |z| &gt; 2,0 sur 30 snapshots
                </Text>
              </>
            ) : (
              <Text style={{ color: boslerColors.textMuted, fontSize: 13 }}>—</Text>
            )}
          </MetricTile>

          {/* Propriétaires */}
          <MetricTile title="Propriétaires">
            <Text style={{ fontSize: 13, color: boslerColors.textSecondary }}>
              {product.owners && product.owners.length > 0
                ? product.owners.map((o) => o.name).join(', ')
                : '—'}
            </Text>
            {product.domain && (
              <Text style={{ display: 'block', fontSize: 11, color: boslerColors.textMuted, marginTop: 4 }}>
                Domaine : {product.domain.name}
              </Text>
            )}
          </MetricTile>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ background: boslerColors.card, border: `1px solid ${boslerColors.cardBorder}`, borderRadius: 5, padding: '0 24px 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          role="tablist"
        />
      </div>
    </div>
  );
};

export default CatalogDataProduct;
