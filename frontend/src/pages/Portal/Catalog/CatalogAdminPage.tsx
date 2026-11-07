/**
 * CatalogAdminPage — Ingestion & audit du Data Catalog.
 *
 * Sections :
 *   1. Tuiles de santé (polling 30 s) — API, OpenSearch, TrustScoreJob, LLM
 *   2. Tableau des événements webhook avec métriques de délai
 *   3. Brouillons IA à relire (Valider / Modifier / Régénérer)
 *   4. Journal d'accès RESTRICTED avec filtre de période et export JSON
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Modal,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  Input,
} from 'antd';
import {
  AuditOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import {
  getCatalogHealth,
  listWebhookEvents,
  listAiDrafts,
  validateAiDraft,
  regenerateAiDraft,
  listRestrictedAccessLogs,
  buildRestrictedAccessLogsExportUrl,
  updateDataProduct,
  type CatalogHealthMetrics,
  type WebhookEventsPage,
  type WebhookEventDto,
  type AiDraftDto,
  type RestrictedAccessLog,
} from '../../../services/catalogService';
import StatusPill from './components/StatusPill';
import { boslerColors } from './theme/boslerTokens';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StatusVariant = 'success' | 'warning' | 'error' | 'neutral';

function webhookStateVariant(state: string, delayMs: number | null): StatusVariant {
  if (state === 'DONE') {
    return delayMs != null && delayMs > 300_000 ? 'error' : 'success';
  }
  if (state === 'RECEIVED' || state === 'PROCESSING') return 'warning';
  if (state === 'FAILED') return 'error';
  return 'neutral';
}

function webhookStateLabel(state: string, delayMs: number | null): string {
  if (state === 'DONE' && delayMs != null && delayMs > 300_000) return 'Hors délai';
  return state;
}

function accessLogVariant(result: string): StatusVariant {
  if (result === 'ALLOWED') return 'success';
  if (result === 'ALLOWED_PII_MASKED') return 'warning';
  return 'error';
}

function formatDelay(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

// ---------------------------------------------------------------------------
// Tuile de santé compacte
// ---------------------------------------------------------------------------

interface HealthTileProps {
  title: string;
  status: string;
  responseTimeMs?: number;
  extra?: React.ReactNode;
}

const HealthTile: React.FC<HealthTileProps> = ({ title, status, responseTimeMs, extra }) => {
  const variant: StatusVariant =
    status === 'UP' || status === 'OK' ? 'success' :
    status === 'DEGRADED' || status === 'UNKNOWN' ? 'warning' : 'error';

  return (
    <div
      style={{
        background: boslerColors.card,
        border: `1px solid ${boslerColors.cardBorder}`,
        borderRadius: 5,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: 600, color: boslerColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </Text>
      <StatusPill status={status} variant={variant} />
      {responseTimeMs != null && (
        <Text style={{ fontSize: 11, color: boslerColors.textSecondary }}>{responseTimeMs} ms</Text>
      )}
      {extra}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------

const CatalogAdminPage: React.FC = () => {
  // --- Santé ---
  const [health, setHealth] = useState<CatalogHealthMetrics | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const healthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Webhook events ---
  const [eventsPage, setEventsPage] = useState<WebhookEventsPage | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsCurrentPage, setEventsCurrentPage] = useState(1);

  // --- Brouillons IA ---
  const [drafts, setDrafts] = useState<AiDraftDto[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftsError, setDraftsError] = useState<string | null>(null);
  const [editModalDraft, setEditModalDraft] = useState<AiDraftDto | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [draftActionLoading, setDraftActionLoading] = useState<string | null>(null);

  // --- Journal accès RESTRICTED ---
  const [logs, setLogs] = useState<RestrictedAccessLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsDates, setLogsDates] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  // ---------------------------------------------------------------------------
  // Chargement santé (avec polling 30 s)
  // ---------------------------------------------------------------------------

  const loadHealth = useCallback(async () => {
    try {
      const data = await getCatalogHealth();
      setHealth(data);
      setHealthError(null);
    } catch {
      setHealthError('Impossible de charger les métriques de santé.');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
    healthTimerRef.current = setInterval(() => { void loadHealth(); }, 30_000);
    return () => {
      if (healthTimerRef.current) clearInterval(healthTimerRef.current);
    };
  }, [loadHealth]);

  // ---------------------------------------------------------------------------
  // Chargement webhook events
  // ---------------------------------------------------------------------------

  const loadEvents = useCallback(async (page: number) => {
    setEventsLoading(true);
    try {
      const data = await listWebhookEvents(page - 1, 20);
      setEventsPage(data);
      setEventsError(null);
    } catch {
      setEventsError('Impossible de charger les événements webhook.');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => { void loadEvents(eventsCurrentPage); }, [loadEvents, eventsCurrentPage]);

  // ---------------------------------------------------------------------------
  // Chargement brouillons IA
  // ---------------------------------------------------------------------------

  const loadDrafts = useCallback(async () => {
    setDraftsLoading(true);
    try {
      const data = await listAiDrafts();
      setDrafts(data);
      setDraftsError(null);
    } catch {
      setDraftsError('Impossible de charger les brouillons IA.');
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  useEffect(() => { void loadDrafts(); }, [loadDrafts]);

  // ---------------------------------------------------------------------------
  // Chargement journaux accès
  // ---------------------------------------------------------------------------

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const startDate = logsDates[0]?.toISOString();
      const endDate   = logsDates[1]?.toISOString();
      const data = await listRestrictedAccessLogs(startDate, endDate);
      setLogs(data);
      setLogsError(null);
    } catch {
      setLogsError('Impossible de charger le journal d\'accès.');
    } finally {
      setLogsLoading(false);
    }
  }, [logsDates]);

  useEffect(() => { void loadLogs(); }, [loadLogs]);

  // ---------------------------------------------------------------------------
  // Actions brouillons
  // ---------------------------------------------------------------------------

  const handleValidate = async (name: string) => {
    setDraftActionLoading(name + ':validate');
    try {
      await validateAiDraft(name);
      await loadDrafts();
    } catch {
      // silencieux — le tableau se rechargera
    } finally {
      setDraftActionLoading(null);
    }
  };

  const handleRegenerate = async (name: string) => {
    setDraftActionLoading(name + ':regenerate');
    try {
      await regenerateAiDraft(name);
      await loadDrafts();
    } catch {
      // silencieux
    } finally {
      setDraftActionLoading(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Export journaux
  // ---------------------------------------------------------------------------

  const handleExportLogs = () => {
    const startDate = logsDates[0]?.toISOString();
    const endDate   = logsDates[1]?.toISOString();
    const url = buildRestrictedAccessLogsExportUrl(startDate, endDate);
    window.open(url, '_blank');
  };

  // ---------------------------------------------------------------------------
  // Colonnes tableaux
  // ---------------------------------------------------------------------------

  const eventColumns: ColumnsType<WebhookEventDto> = [
    {
      title: 'Dataset',
      dataIndex: 'datasetId',
      key: 'datasetId',
      render: (v: string | null) => <Text style={{ fontSize: 13 }}>{v ?? '—'}</Text>,
    },
    {
      title: 'Reçu',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      render: (v: string | null) =>
        v ? new Date(v).toLocaleString('fr-FR') : '—',
    },
    {
      title: 'Délai',
      dataIndex: 'delayMs',
      key: 'delayMs',
      render: (v: number | null) => (
        <Text style={{ color: v != null && v > 300_000 ? boslerColors.accessRestrictedText : boslerColors.text }}>
          {formatDelay(v)}
        </Text>
      ),
    },
    {
      title: 'État',
      dataIndex: 'state',
      key: 'state',
      render: (_: string, row: WebhookEventDto) => (
        <StatusPill
          status={webhookStateLabel(row.state, row.delayMs)}
          variant={webhookStateVariant(row.state, row.delayMs)}
        />
      ),
    },
    {
      title: 'Tentatives',
      dataIndex: 'attempts',
      key: 'attempts',
      render: (v: number) => <Text style={{ fontSize: 13 }}>{v}</Text>,
    },
  ];

  const draftColumns: ColumnsType<AiDraftDto> = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <Text strong style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: 'Description générée',
      dataIndex: 'description',
      key: 'description',
      render: (v: string | null) => (
        <details style={{ maxWidth: 400 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: boslerColors.textSecondary }}>
            {v ? v.substring(0, 60) + (v.length > 60 ? '…' : '') : '—'}
          </summary>
          {v && (
            <pre style={{ fontSize: 11, fontFamily: 'monospace', background: boslerColors.tableHeader, padding: 8, borderRadius: 4, marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {v}
            </pre>
          )}
        </details>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, row: AiDraftDto) => (
        <Space size={4}>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            loading={draftActionLoading === row.name + ':validate'}
            onClick={() => { void handleValidate(row.name); }}
            aria-label={`Valider le brouillon ${row.name}`}
            style={{ borderRadius: 2, fontSize: 12 }}
          >
            Valider
          </Button>
          <Button
            size="small"
            onClick={() => { setEditModalDraft(row); setEditDesc(row.description ?? ''); }}
            aria-label={`Modifier le brouillon ${row.name}`}
            style={{ borderRadius: 2, fontSize: 12 }}
          >
            Modifier
          </Button>
          <Button
            size="small"
            icon={<RobotOutlined />}
            loading={draftActionLoading === row.name + ':regenerate'}
            onClick={() => { void handleRegenerate(row.name); }}
            aria-label={`Régénérer le brouillon IA pour ${row.name}`}
            style={{ borderRadius: 2, fontSize: 12 }}
          >
            Régénérer
          </Button>
        </Space>
      ),
    },
  ];

  const logColumns: ColumnsType<RestrictedAccessLog> = [
    {
      title: 'Horodatage',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => <Text style={{ fontSize: 12 }}>{new Date(v).toLocaleString('fr-FR')}</Text>,
    },
    {
      title: 'Utilisateur',
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (v: string | null) => <Text style={{ fontSize: 12 }}>{v ?? '—'}</Text>,
    },
    {
      title: 'Rôle',
      dataIndex: 'userRole',
      key: 'userRole',
      render: (v: string | null) => v ? <Tag style={{ borderRadius: 2 }}>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (v: string | null) => <Text style={{ fontSize: 12 }}>{v ?? '—'}</Text>,
    },
    {
      title: 'Asset',
      dataIndex: 'assetId',
      key: 'assetId',
      render: (v: string) => (
        <Tooltip title={v}>
          <Text style={{ fontSize: 12, maxWidth: 200 }} ellipsis>{v}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Résultat',
      dataIndex: 'result',
      key: 'result',
      render: (v: string) => <StatusPill status={v} variant={accessLogVariant(v)} />,
    },
  ];

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------

  const deps = health?.dependencies;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', background: boslerColors.pageBg, minHeight: '100vh' }}>
      {/* En-tête */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: 'Catalogue' },
          { title: 'Ingestion & audit' },
        ]}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <AuditOutlined style={{ fontSize: 26, color: boslerColors.primary }} aria-hidden="true" />
        <Title level={3} style={{ margin: 0, color: boslerColors.textTitle }}>
          Ingestion &amp; audit
        </Title>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 1 : Tuiles de santé                                         */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="État des dépendances" style={{ marginBottom: 32 }}>
        <Title level={5} style={{ color: boslerColors.textSecondary, marginBottom: 12 }}>
          Dépendances système
        </Title>
        {healthLoading && !health ? (
          <Spin aria-label="Chargement des métriques de santé" />
        ) : healthError ? (
          <Alert type="error" message={healthError} showIcon style={{ borderRadius: 5 }} />
        ) : deps ? (
          <Row gutter={[12, 12]} aria-live="polite">
            <Col xs={12} sm={6}>
              <HealthTile
                title="API Catalog"
                status={deps.database.status}
                responseTimeMs={deps.database.responseTimeMs}
              />
            </Col>
            <Col xs={12} sm={6}>
              <HealthTile
                title="OpenSearch"
                status={deps.opensearch.status}
                responseTimeMs={deps.opensearch.responseTimeMs}
              />
            </Col>
            <Col xs={12} sm={6}>
              <HealthTile
                title="TrustScore Job"
                status={deps.trustScoreJob.status}
                extra={
                  <Text style={{ fontSize: 11, color: boslerColors.textSecondary }}>
                    {deps.trustScoreJob.alertCount} alerte{deps.trustScoreJob.alertCount !== 1 ? 's' : ''}
                    {deps.trustScoreJob.lastRun
                      ? ` · ${new Date(deps.trustScoreJob.lastRun).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                      : ''}
                  </Text>
                }
              />
            </Col>
            <Col xs={12} sm={6}>
              <HealthTile
                title="Génération IA (LLM)"
                status={deps.llm.status}
                responseTimeMs={deps.llm.responseTimeMs}
                extra={deps.llm.model ? (
                  <Text style={{ fontSize: 11, color: boslerColors.textMuted }}>{deps.llm.model}</Text>
                ) : undefined}
              />
            </Col>
          </Row>
        ) : null}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2 : Événements webhook                                      */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="Événements webhook d'ingestion" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0, color: boslerColors.textSecondary }}>
            Catalogage automatique
          </Title>
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={() => { void loadEvents(eventsCurrentPage); }}
            aria-label="Rafraîchir les événements webhook"
            style={{ borderRadius: 2 }}
          >
            Rafraîchir
          </Button>
        </div>

        {/* Métriques */}
        {eventsPage && (
          <Row gutter={[12, 0]} style={{ marginBottom: 12 }}>
            <Col>
              <Text style={{ fontSize: 12, color: boslerColors.textSecondary }}>
                Délai médian (7 j) :{' '}
                <strong>{formatDelay(eventsPage.medianDelayMs)}</strong>
              </Text>
            </Col>
            <Col>
              <Text style={{ fontSize: 12, color: boslerColors.textSecondary }}>
                Dans les 5 min (7 j) :{' '}
                <strong>
                  {eventsPage.percentInDelay != null ? `${eventsPage.percentInDelay} %` : '—'}
                </strong>
              </Text>
            </Col>
          </Row>
        )}

        {eventsError && (
          <Alert type="error" message={eventsError} showIcon style={{ borderRadius: 5, marginBottom: 12 }} />
        )}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{ border: `1px solid ${boslerColors.cardBorder}`, borderRadius: 5, boxShadow: 'none' }}
        >
          <Table<WebhookEventDto>
            dataSource={eventsPage?.items ?? []}
            columns={eventColumns}
            rowKey="id"
            loading={eventsLoading}
            size="small"
            pagination={{
              current: eventsCurrentPage,
              pageSize: 20,
              total: eventsPage?.total ?? 0,
              onChange: (p) => setEventsCurrentPage(p),
              showSizeChanger: false,
            }}
            locale={{ emptyText: <Empty description="Aucun événement" /> }}
          />
        </Card>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3 : Brouillons IA à relire                                  */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="Brouillons IA à relire" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0, color: boslerColors.textSecondary }}>
            Brouillons IA à relire
          </Title>
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={() => { void loadDrafts(); }}
            aria-label="Rafraîchir les brouillons IA"
            style={{ borderRadius: 2 }}
          >
            Rafraîchir
          </Button>
        </div>

        {draftsError && (
          <Alert type="error" message={draftsError} showIcon style={{ borderRadius: 5, marginBottom: 12 }} />
        )}
        {draftsLoading ? (
          <Spin aria-label="Chargement des brouillons IA" />
        ) : drafts.length === 0 ? (
          <Empty description="Aucun brouillon IA en attente de validation" />
        ) : (
          <Card
            bodyStyle={{ padding: 0 }}
            style={{ border: `1px solid ${boslerColors.cardBorder}`, borderRadius: 5, boxShadow: 'none' }}
          >
            <Table<AiDraftDto>
              dataSource={drafts}
              columns={draftColumns}
              rowKey="name"
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              locale={{ emptyText: <Empty description="Aucun brouillon" /> }}
            />
          </Card>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4 : Journal accès RESTRICTED                                */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="Journal d'accès aux assets restreints">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <Title level={5} style={{ margin: 0, color: boslerColors.textSecondary }}>
            Journal d'accès RESTRICTED
          </Title>
          <Space wrap>
            <RangePicker
              value={logsDates}
              onChange={(dates) => setLogsDates(dates ?? [null, null])}
              format="DD/MM/YYYY"
              size="small"
              aria-label="Période du journal d'accès"
              style={{ borderRadius: 2 }}
            />
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={() => { void loadLogs(); }}
              aria-label="Rafraîchir le journal d'accès"
              style={{ borderRadius: 2 }}
            >
              Rafraîchir
            </Button>
            <Button
              size="small"
              onClick={handleExportLogs}
              aria-label="Exporter le journal d'accès en JSON"
              style={{ borderRadius: 2 }}
            >
              Exporter JSON
            </Button>
          </Space>
        </div>

        {logsError && (
          <Alert type="error" message={logsError} showIcon style={{ borderRadius: 5, marginBottom: 12 }} />
        )}
        {logsLoading ? (
          <Spin aria-label="Chargement du journal d'accès" />
        ) : (
          <Card
            bodyStyle={{ padding: 0 }}
            style={{ border: `1px solid ${boslerColors.cardBorder}`, borderRadius: 5, boxShadow: 'none' }}
          >
            <Table<RestrictedAccessLog>
              dataSource={logs}
              columns={logColumns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 15, showSizeChanger: false }}
              locale={{ emptyText: <Empty description="Aucun enregistrement sur la période" /> }}
              aria-live="polite"
            />
          </Card>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Modal de modification de description                                 */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        title={`Modifier la description — ${editModalDraft?.name ?? ''}`}
        open={editModalDraft !== null}
        onCancel={() => setEditModalDraft(null)}
        onOk={async () => {
          if (!editModalDraft) return;
          try {
            await updateDataProduct(editModalDraft.name, { description: editDesc });
          } catch {
            // silencieux — pas bloquant
          }
          setEditModalDraft(null);
          void loadDrafts();
        }}
        okText="Enregistrer"
        cancelText="Annuler"
        okButtonProps={{ style: { borderRadius: 2 } }}
        cancelButtonProps={{ style: { borderRadius: 2 } }}
      >
        <Input.TextArea
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          rows={5}
          placeholder="Description du Data Product…"
          aria-label="Nouvelle description du Data Product"
          style={{ borderRadius: 2 }}
        />
      </Modal>
    </div>
  );
};

export default CatalogAdminPage;
