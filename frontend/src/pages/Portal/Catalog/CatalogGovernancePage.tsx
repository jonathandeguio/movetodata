import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Breadcrumb,
  Button,
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
  BankOutlined,
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';

import {
  createDomain,
  createGlossaryTerm,
  deleteDomain,
  deleteGlossaryTerm,
  listDomains,
  listGlossaryTerms,
  type CatalogDomain,
  type CatalogGlossaryTerm,
} from '../../../services/catalogService';
import AccessBadge from './components/AccessBadge';
import { boslerColors } from './theme/boslerTokens';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Matrice politiques × rôles (statique)
// ---------------------------------------------------------------------------

type AccessLevel = 'Lecture' | 'Sur demande' | 'Refusé';

interface PolicyRow {
  policy: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
  roles: Record<string, AccessLevel>;
}

const POLICY_MATRIX: PolicyRow[] = [
  {
    policy: 'PUBLIC',
    roles: {
      Lecteur: 'Lecture',
      Analyste: 'Lecture',
      'Data Steward': 'Lecture',
      DPO: 'Lecture',
      Admin: 'Lecture',
    },
  },
  {
    policy: 'INTERNAL',
    roles: {
      Lecteur: 'Lecture',
      Analyste: 'Lecture',
      'Data Steward': 'Lecture',
      DPO: 'Lecture',
      Admin: 'Lecture',
    },
  },
  {
    policy: 'RESTRICTED',
    roles: {
      Lecteur: 'Refusé',
      Analyste: 'Sur demande',
      'Data Steward': 'Lecture',
      DPO: 'Lecture',
      Admin: 'Lecture',
    },
  },
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  Lecteur: <UserOutlined aria-hidden="true" />,
  Analyste: <TeamOutlined aria-hidden="true" />,
  'Data Steward': <SafetyOutlined aria-hidden="true" />,
  DPO: <EyeOutlined aria-hidden="true" />,
  Admin: <BankOutlined aria-hidden="true" />,
};

const ACCESS_CELL_STYLE: Record<AccessLevel, React.CSSProperties> = {
  Lecture: {
    background: boslerColors.accessPublicBg,
    color: boslerColors.accessPublicText,
    border: `1px solid ${boslerColors.accessPublicBorder}`,
    borderRadius: 2,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 500,
    display: 'inline-block',
  },
  'Sur demande': {
    background: '#fff4e5',
    color: '#8a4b00',
    border: '1px solid #ffd591',
    borderRadius: 2,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 500,
    display: 'inline-block',
  },
  Refusé: {
    background: boslerColors.separator,
    color: boslerColors.textMuted,
    border: `1px solid ${boslerColors.cardBorder}`,
    borderRadius: 2,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 500,
    display: 'inline-block',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const CatalogGovernancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') ?? 'domaines';
  const setActiveTab = (tab: string) => {
    const p = new URLSearchParams(searchParams);
    p.set('tab', tab);
    setSearchParams(p, { replace: true });
  };

  // -------------------------------------------------------------------------
  // Domaines
  // -------------------------------------------------------------------------

  const [domains, setDomains] = useState<CatalogDomain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domainsError, setDomainsError] = useState<string | null>(null);

  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [domainForm] = Form.useForm();
  const [domainSaving, setDomainSaving] = useState(false);

  const loadDomains = useCallback(async () => {
    setDomainsLoading(true);
    setDomainsError(null);
    try {
      setDomains(await listDomains());
    } catch (e: unknown) {
      setDomainsError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setDomainsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'domaines') loadDomains();
  }, [activeTab, loadDomains]);

  const handleCreateDomain = async (values: {
    name: string;
    description?: string;
    defaultAccessPolicy?: string;
  }) => {
    setDomainSaving(true);
    try {
      await createDomain({
        name: values.name,
        description: values.description,
        defaultAccessPolicy: values.defaultAccessPolicy ?? 'INTERNAL',
      });
      await loadDomains();
      setDomainModalOpen(false);
      domainForm.resetFields();
      notification.success({ message: 'Domaine créé', duration: 3 });
    } catch (e: unknown) {
      notification.error({
        message: 'Erreur création domaine',
        description: e instanceof Error ? e.message : '',
        duration: 5,
      });
    } finally {
      setDomainSaving(false);
    }
  };

  const handleDeleteDomain = (name: string) => {
    Modal.confirm({
      title: `Supprimer le domaine « ${name} » ?`,
      content: 'Les Data Products associés ne seront pas supprimés.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await deleteDomain(name);
          await loadDomains();
          notification.success({ message: 'Domaine supprimé', duration: 3 });
        } catch (e: unknown) {
          notification.error({
            message: 'Erreur suppression',
            description: e instanceof Error ? e.message : '',
            duration: 5,
          });
        }
      },
    });
  };

  const domainColumns: ColumnsType<CatalogDomain> = [
    {
      title: 'Domaine',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => (
        <Text strong style={{ color: boslerColors.text, fontSize: 13 }}>
          {v}
        </Text>
      ),
    },
    {
      title: 'Data Owner',
      dataIndex: 'ownerName',
      key: 'ownerName',
      render: (v?: string) =>
        v ? (
          <span style={{ fontSize: 13, color: boslerColors.textSecondary }}>
            <UserOutlined aria-hidden="true" style={{ marginRight: 6 }} />
            {v}
          </span>
        ) : (
          <em style={{ color: boslerColors.textMuted, fontSize: 12 }}>—</em>
        ),
    },
    {
      title: 'Data Steward',
      dataIndex: 'stewardName',
      key: 'stewardName',
      render: (v?: string) =>
        v ? (
          <span style={{ fontSize: 13, color: boslerColors.textSecondary }}>
            <SafetyOutlined aria-hidden="true" style={{ marginRight: 6 }} />
            {v}
          </span>
        ) : (
          <em style={{ color: boslerColors.textMuted, fontSize: 12 }}>—</em>
        ),
    },
    {
      title: 'Data Products',
      dataIndex: 'dataProductCount',
      key: 'dataProductCount',
      width: 130,
      render: (v?: number) => (
        <Tag
          style={{
            borderRadius: 2,
            background: boslerColors.accessInternalBg,
            color: boslerColors.primary,
            border: `1px solid ${boslerColors.accessInternalBorder}`,
            fontSize: 12,
          }}
        >
          {v ?? 0}
        </Tag>
      ),
    },
    {
      title: 'Politique par défaut',
      dataIndex: 'defaultAccessPolicy',
      key: 'defaultAccessPolicy',
      width: 160,
      render: (v?: string) =>
        v ? (
          <AccessBadge policy={v as 'PUBLIC' | 'INTERNAL' | 'RESTRICTED'} />
        ) : (
          <em style={{ color: boslerColors.textMuted, fontSize: 12 }}>—</em>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: CatalogDomain) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            aria-label={`Modifier le domaine ${record.name}`}
            style={{ borderRadius: 2 }}
            onClick={() => notification.info({ message: 'Modification à venir', duration: 2 })}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Supprimer le domaine ${record.name}`}
            style={{ borderRadius: 2 }}
            onClick={() => handleDeleteDomain(record.name)}
          />
        </div>
      ),
    },
  ];

  // -------------------------------------------------------------------------
  // Glossaire
  // -------------------------------------------------------------------------

  const [glossaryTerms, setGlossaryTerms] = useState<CatalogGlossaryTerm[]>([]);
  const [glossaryLoading, setGlossaryLoading] = useState(false);
  const [glossaryError, setGlossaryError] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState('');
  const debouncedSearch = useDebounce(glossarySearch, 200);

  const [termModalOpen, setTermModalOpen] = useState(false);
  const [termForm] = Form.useForm();
  const [termSaving, setTermSaving] = useState(false);

  const loadGlossary = useCallback(async () => {
    setGlossaryLoading(true);
    setGlossaryError(null);
    try {
      setGlossaryTerms(await listGlossaryTerms());
    } catch (e: unknown) {
      setGlossaryError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setGlossaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'glossaire') loadGlossary();
  }, [activeTab, loadGlossary]);

  const filteredTerms = useMemo(() => {
    if (!debouncedSearch.trim()) return glossaryTerms;
    const q = debouncedSearch.toLowerCase();
    return glossaryTerms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        (t.definition ?? '').toLowerCase().includes(q)
    );
  }, [glossaryTerms, debouncedSearch]);

  const handleCreateTerm = async (values: {
    term: string;
    domain?: string;
    definition: string;
  }) => {
    setTermSaving(true);
    try {
      await createGlossaryTerm({
        term: values.term,
        domain: values.domain,
        definition: values.definition,
      });
      await loadGlossary();
      setTermModalOpen(false);
      termForm.resetFields();
      notification.success({ message: 'Terme créé', duration: 3 });
    } catch (e: unknown) {
      notification.error({
        message: 'Erreur création terme',
        description: e instanceof Error ? e.message : '',
        duration: 5,
      });
    } finally {
      setTermSaving(false);
    }
  };

  const handleDeleteTerm = (id: string, term: string) => {
    Modal.confirm({
      title: `Supprimer le terme « ${term} » ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await deleteGlossaryTerm(id);
          await loadGlossary();
          notification.success({ message: 'Terme supprimé', duration: 3 });
        } catch (e: unknown) {
          notification.error({
            message: 'Erreur suppression',
            description: e instanceof Error ? e.message : '',
            duration: 5,
          });
        }
      },
    });
  };

  // -------------------------------------------------------------------------
  // Rendu
  // -------------------------------------------------------------------------

  return (
    <div
      style={{
        background: boslerColors.pageBg,
        minHeight: '100vh',
        padding: '20px 24px',
        fontFamily: '"Poppins", system-ui, sans-serif',
      }}
    >
      {/* En-tête */}
      <Breadcrumb
        style={{ marginBottom: 12 }}
        items={[
          { title: 'Catalogue' },
          { title: 'Gouvernance' },
        ]}
      />
      <div
        style={{
          background: boslerColors.card,
          border: `1px solid ${boslerColors.cardBorder}`,
          borderRadius: 5,
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <BankOutlined style={{ fontSize: 24, color: boslerColors.primary }} aria-hidden="true" />
          <Title level={3} style={{ margin: 0, color: boslerColors.textTitle, fontFamily: '"Poppins", system-ui, sans-serif', fontSize: 20 }}>
            Gouvernance
          </Title>
        </div>
        <Text style={{ color: boslerColors.textSecondary, fontSize: 13 }}>
          Domaines métiers, politiques d'accès et glossaire de la Data Platform.
        </Text>
      </div>

      {/* Onglets */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        role="tablist"
        style={{ background: boslerColors.card, border: `1px solid ${boslerColors.cardBorder}`, borderRadius: 5, padding: '0 16px' }}
        items={[
          // ===================================================================
          // Onglet 1 — Domaines
          // ===================================================================
          {
            key: 'domaines',
            label: (
              <span>
                <BankOutlined aria-hidden="true" style={{ marginRight: 6 }} />
                Domaines
              </span>
            ),
            children: (
              <div style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: boslerColors.textSecondary, fontSize: 13 }}>
                    {domains.length} domaine{domains.length !== 1 ? 's' : ''} enregistré{domains.length !== 1 ? 's' : ''}
                  </Text>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setDomainModalOpen(true)}
                    style={{
                      backgroundColor: boslerColors.primary,
                      borderColor: boslerColors.primary,
                      borderRadius: 2,
                      fontSize: 13,
                    }}
                  >
                    + Domaine
                  </Button>
                </div>

                {domainsError && (
                  <Alert type="error" message={domainsError} showIcon style={{ marginBottom: 12, borderRadius: 5 }} />
                )}

                <Table<CatalogDomain>
                  rowKey="id"
                  size="small"
                  loading={domainsLoading}
                  dataSource={domains}
                  columns={domainColumns}
                  pagination={{ pageSize: 20, hideOnSinglePage: true }}
                  locale={{ emptyText: <Empty description="Aucun domaine enregistré" /> }}
                  style={{ borderRadius: 5 }}
                />

                {/* Modal création domaine */}
                <Modal
                  title="Nouveau domaine"
                  open={domainModalOpen}
                  onCancel={() => { setDomainModalOpen(false); domainForm.resetFields(); }}
                  footer={null}
                  destroyOnClose
                >
                  <Form form={domainForm} layout="vertical" onFinish={handleCreateDomain}>
                    <Form.Item
                      label="Nom"
                      name="name"
                      rules={[{ required: true, message: 'Nom obligatoire' }]}
                    >
                      <Input style={{ borderRadius: 2 }} />
                    </Form.Item>
                    <Form.Item label="Description" name="description">
                      <Input.TextArea rows={2} style={{ borderRadius: 2 }} />
                    </Form.Item>
                    <Form.Item label="Politique par défaut" name="defaultAccessPolicy" initialValue="INTERNAL">
                      <Select
                        style={{ borderRadius: 2 }}
                        options={[
                          { label: 'PUBLIC', value: 'PUBLIC' },
                          { label: 'INTERNAL', value: 'INTERNAL' },
                          { label: 'RESTRICTED', value: 'RESTRICTED' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                      <Button
                        onClick={() => { setDomainModalOpen(false); domainForm.resetFields(); }}
                        style={{ marginRight: 8, borderRadius: 2 }}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={domainSaving}
                        style={{ backgroundColor: boslerColors.primary, borderColor: boslerColors.primary, borderRadius: 2 }}
                      >
                        Créer
                      </Button>
                    </Form.Item>
                  </Form>
                </Modal>
              </div>
            ),
          },

          // ===================================================================
          // Onglet 2 — Politiques × rôles
          // ===================================================================
          {
            key: 'politiques',
            label: (
              <span>
                <SafetyOutlined aria-hidden="true" style={{ marginRight: 6 }} />
                Politiques × rôles
              </span>
            ),
            children: (
              <div style={{ padding: '16px 0' }}>
                <Text style={{ display: 'block', marginBottom: 16, fontSize: 13, color: boslerColors.textSecondary }}>
                  Matrice des droits d'accès selon la politique du Data Product et le rôle de l'utilisateur.
                </Text>

                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 13,
                    }}
                    aria-label="Matrice politiques d'accès par rôle"
                  >
                    <thead>
                      <tr style={{ background: boslerColors.tableHeader }}>
                        <th
                          style={{
                            padding: '10px 16px',
                            textAlign: 'left',
                            fontWeight: 600,
                            color: boslerColors.textSecondary,
                            border: `1px solid ${boslerColors.cardBorder}`,
                            borderRadius: 0,
                          }}
                        >
                          Politique
                        </th>
                        {Object.keys(POLICY_MATRIX[0].roles).map((role) => (
                          <th
                            key={role}
                            scope="col"
                            style={{
                              padding: '10px 16px',
                              textAlign: 'center',
                              fontWeight: 600,
                              color: boslerColors.textSecondary,
                              border: `1px solid ${boslerColors.cardBorder}`,
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 16 }}>{ROLE_ICONS[role]}</span>
                              <span>{role}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {POLICY_MATRIX.map((row) => (
                        <tr key={row.policy}>
                          <td
                            style={{
                              padding: '10px 16px',
                              border: `1px solid ${boslerColors.cardBorder}`,
                              fontWeight: 500,
                            }}
                          >
                            <AccessBadge policy={row.policy} />
                          </td>
                          {Object.entries(row.roles).map(([role, level]) => (
                            <td
                              key={role}
                              style={{
                                padding: '10px 16px',
                                textAlign: 'center',
                                border: `1px solid ${boslerColors.cardBorder}`,
                              }}
                            >
                              <span style={ACCESS_CELL_STYLE[level]}>{level}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: '10px 14px',
                    background: boslerColors.separator,
                    borderRadius: 5,
                    fontSize: 12,
                    color: boslerColors.textMuted,
                  }}
                >
                  <strong>Note :</strong> « Sur demande » signifie que l'utilisateur doit soumettre une demande d'accès explicite,
                  approuvée par le Data Steward ou le DPO avant consultation.
                  Les accès RESTRICTED sont systématiquement journalisés (utilisateur, horodatage, IP).
                </div>
              </div>
            ),
          },

          // ===================================================================
          // Onglet 3 — Glossaire
          // ===================================================================
          {
            key: 'glossaire',
            label: (
              <span>
                <BookOutlined aria-hidden="true" style={{ marginRight: 6 }} />
                Glossaire
              </span>
            ),
            children: (
              <div style={{ padding: '16px 0' }}>
                {/* Barre recherche + bouton */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <Input
                    placeholder="Rechercher un terme ou une définition…"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    allowClear
                    style={{ flex: '1 1 240px', borderRadius: 2, maxWidth: 400 }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setTermModalOpen(true)}
                    style={{
                      backgroundColor: boslerColors.primary,
                      borderColor: boslerColors.primary,
                      borderRadius: 2,
                      fontSize: 13,
                    }}
                  >
                    + Terme
                  </Button>
                </div>

                {glossaryError && (
                  <Alert type="error" message={glossaryError} showIcon style={{ marginBottom: 12, borderRadius: 5 }} />
                )}

                {glossaryLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                  </div>
                ) : filteredTerms.length === 0 ? (
                  <Empty description="Aucun terme dans le glossaire" />
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {filteredTerms.map((term) => (
                      <GlossaryCard
                        key={term.id}
                        term={term}
                        onDelete={() => handleDeleteTerm(term.id, term.term)}
                        onNavigate={(dp) =>
                          navigate(`/portal/catalog?search=${encodeURIComponent(dp)}`)
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Modal création terme */}
                <Modal
                  title="Nouveau terme de glossaire"
                  open={termModalOpen}
                  onCancel={() => { setTermModalOpen(false); termForm.resetFields(); }}
                  footer={null}
                  destroyOnClose
                >
                  <Form form={termForm} layout="vertical" onFinish={handleCreateTerm}>
                    <Form.Item
                      label="Terme"
                      name="term"
                      rules={[{ required: true, message: 'Terme obligatoire' }]}
                    >
                      <Input style={{ borderRadius: 2 }} />
                    </Form.Item>
                    <Form.Item label="Domaine" name="domain">
                      <Input style={{ borderRadius: 2 }} placeholder="ex: Finance, RH, Logistique…" />
                    </Form.Item>
                    <Form.Item
                      label="Définition"
                      name="definition"
                      rules={[{ required: true, message: 'Définition obligatoire' }]}
                    >
                      <Input.TextArea rows={4} style={{ borderRadius: 2 }} />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                      <Button
                        onClick={() => { setTermModalOpen(false); termForm.resetFields(); }}
                        style={{ marginRight: 8, borderRadius: 2 }}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={termSaving}
                        style={{ backgroundColor: boslerColors.primary, borderColor: boslerColors.primary, borderRadius: 2 }}
                      >
                        Créer
                      </Button>
                    </Form.Item>
                  </Form>
                </Modal>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// GlossaryCard — carte glossaire
// ---------------------------------------------------------------------------

interface GlossaryCardProps {
  term: CatalogGlossaryTerm;
  onDelete: () => void;
  onNavigate: (dp: string) => void;
}

const GlossaryCard: React.FC<GlossaryCardProps> = ({ term, onDelete, onNavigate }) => (
  <div
    style={{
      background: boslerColors.card,
      border: `1px solid ${boslerColors.cardBorder}`,
      borderRadius: 5,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    {/* Titre + domaine */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <Text strong style={{ fontSize: 14, color: boslerColors.textTitle, flex: 1 }}>
        {term.term}
      </Text>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          aria-label={`Supprimer le terme ${term.term}`}
          style={{ borderRadius: 2 }}
          onClick={onDelete}
        />
      </div>
    </div>

    {term.domain && (
      <Tag
        style={{
          borderRadius: 2,
          background: boslerColors.accessInternalBg,
          color: boslerColors.primary,
          border: `1px solid ${boslerColors.accessInternalBorder}`,
          fontSize: 11,
          alignSelf: 'flex-start',
        }}
      >
        {term.domain}
      </Tag>
    )}

    {/* Définition (2 lignes max) */}
    <Text
      style={{
        fontSize: 12,
        color: boslerColors.textSecondary,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        lineHeight: 1.5,
      }}
    >
      {term.definition}
    </Text>

    {/* Métriques */}
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
      {/* Data Products liés */}
      {(term.linkedDataProducts?.length ?? 0) > 0 && (
        <Tag
          style={{
            borderRadius: 2,
            background: boslerColors.accessInternalBg,
            color: boslerColors.primary,
            border: `1px solid ${boslerColors.accessInternalBorder}`,
            fontSize: 11,
            cursor: 'pointer',
          }}
          onClick={() => term.linkedDataProducts![0] && onNavigate(term.linkedDataProducts![0])}
          title="Voir les Data Products liés"
        >
          {term.linkedDataProducts!.length} Data Product{term.linkedDataProducts!.length !== 1 ? 's' : ''}
        </Tag>
      )}

      {/* Vues */}
      <span
        style={{
          fontSize: 11,
          color: boslerColors.textMuted,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <EyeOutlined aria-hidden="true" />
        {term.viewCount ?? 0} vue{(term.viewCount ?? 0) !== 1 ? 's' : ''}
      </span>
    </div>
  </div>
);

export default CatalogGovernancePage;
