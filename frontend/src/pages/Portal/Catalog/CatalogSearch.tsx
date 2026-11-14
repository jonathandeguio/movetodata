import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Select,
  Spin,
  Typography,
} from 'antd';
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createDataProduct, searchDataProductsFaceted } from '../../../services/catalogService';
import type { CatalogSearchResult, DataProductSummary } from './types/catalogTypes';
import QualityBadge from './components/QualityBadge';
import AccessBadge from './components/AccessBadge';
import PiiBadge from './components/PiiBadge';
import TrustScoreBar from './components/TrustScoreBar';
import { boslerColors } from './theme/boslerTokens';
import { listDomains, type CatalogDomain } from '../../../services/catalogService';

const { Title, Text } = Typography;

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Composant carte résultat
// ---------------------------------------------------------------------------

interface DataProductCardProps {
  item: DataProductSummary;
}

const DataProductCard: React.FC<DataProductCardProps> = ({ item }) => {
  const alertBg = '#fff3e0';
  const alertBorder = '#f5a623';
  const hasAlert = item.driftAlert || item.trustLowAlert;

  return (
    <div
      style={{
        background: boslerColors.card,
        border: `1px solid ${boslerColors.cardBorder}`,
        borderRadius: 5,
        padding: '14px 18px',
        display: 'flex',
        gap: 24,
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      {/* Colonne gauche */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Titre + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <Link
            to={`/portal/catalog/data-product/${encodeURIComponent(item.fqn)}`}
            style={{
              color: boslerColors.primary,
              fontWeight: 600,
              fontSize: 15,
              fontFamily: '"Poppins", system-ui, sans-serif',
            }}
          >
            {item.displayName ?? item.name}
          </Link>
          {item.qualityLevel && (
            <QualityBadge
              level={item.qualityLevel.toLowerCase() as 'gold' | 'silver' | 'bronze'}
            />
          )}
          {item.accessPolicy && (
            <AccessBadge policy={item.accessPolicy} />
          )}
          {item.hasPii && <PiiBadge />}
        </div>

        {/* FQN en monospace */}
        <code
          style={{
            fontSize: 11,
            color: boslerColors.textMuted,
            fontFamily: 'ui-monospace, "Cascadia Code", Consolas, monospace',
            display: 'block',
            marginBottom: 6,
          }}
        >
          {item.fqn}
        </code>

        {/* Description (2 lignes max) */}
        {item.description && (
          <Text
            style={{
              fontSize: 13,
              color: boslerColors.textSecondary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            {item.description}
          </Text>
        )}

        {/* Chips domaine + source + tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: hasAlert ? 8 : 0 }}>
          {item.domainName && (
            <span style={chipStyle}>{item.domainName}</span>
          )}
          {item.sourceType && (
            <span style={{ ...chipStyle, background: boslerColors.accessInternalBg, color: boslerColors.accessInternalText }}>
              {item.sourceType}
            </span>
          )}
          {item.tags.map((tag) => (
            <span key={tag} style={{ ...chipStyle, fontFamily: 'ui-monospace, monospace' }}>
              #{tag}
            </span>
          ))}
        </div>

        {/* Alerte drift ou trust bas */}
        {hasAlert && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
              padding: '4px 10px',
              borderRadius: 2,
              background: alertBg,
              border: `1px solid ${alertBorder}`,
              fontSize: 12,
              color: '#7a4000',
            }}
          >
            <ExclamationCircleOutlined style={{ color: alertBorder }} />
            {item.driftAlert && <span>Drift détecté (z-score ≥ 2)</span>}
            {item.trustLowAlert && !item.driftAlert && <span>Score de confiance bas (&lt; 60)</span>}
          </div>
        )}
      </div>

      {/* Colonne droite */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          minWidth: 140,
          flexShrink: 0,
        }}
      >
        {item.trustScore != null && (
          <div style={{ marginBottom: 8 }}>
            <TrustScoreBar score={item.trustScore} width={100} />
          </div>
        )}
        {item.ownerName && (
          <Text style={{ fontSize: 12, color: boslerColors.textMuted }}>
            {item.ownerName}
          </Text>
        )}
        <Text style={{ fontSize: 12, color: boslerColors.textMuted }}>
          {formatDate(item.updatedAt)}
        </Text>
        {item.viewCount > 0 && (
          <Text style={{ fontSize: 11, color: boslerColors.textMuted }}>
            {item.viewCount.toLocaleString('fr-FR')} vues
          </Text>
        )}
      </div>
    </div>
  );
};

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 8px',
  borderRadius: 2,
  background: boslerColors.separator,
  color: boslerColors.textSecondary,
  fontSize: 11,
  border: `1px solid ${boslerColors.cardBorder}`,
};

// ---------------------------------------------------------------------------
// Filtres latéraux
// ---------------------------------------------------------------------------

const QUALITY_OPTIONS = [
  { value: 'GOLD',   label: 'Or',      color: boslerColors.qualityGoldBg,     textColor: boslerColors.qualityGoldText,   border: boslerColors.qualityGoldBorder },
  { value: 'SILVER', label: 'Argent',  color: boslerColors.qualitySilverBg,   textColor: boslerColors.qualitySilverText, border: boslerColors.qualitySilverBorder },
  { value: 'BRONZE', label: 'Bronze',  color: boslerColors.qualityBronzeBg,   textColor: boslerColors.qualityBronzeText, border: boslerColors.qualityBronzeBorder },
];

const ACCESS_OPTIONS = [
  { value: 'PUBLIC',     label: 'Public',    color: boslerColors.accessPublicBg,     textColor: boslerColors.accessPublicText,     border: boslerColors.accessPublicBorder },
  { value: 'INTERNAL',  label: 'Interne',   color: boslerColors.accessInternalBg,   textColor: boslerColors.accessInternalText,   border: boslerColors.accessInternalBorder },
  { value: 'RESTRICTED',label: 'Restreint', color: boslerColors.accessRestrictedBg, textColor: boslerColors.accessRestrictedText, border: boslerColors.accessRestrictedBorder },
];

interface SideFiltersProps {
  qualityLevels: string[];
  accessPolicies: string[];
  domainIds: string[];
  sourceTypes: string[];
  domains: CatalogDomain[];
  facets?: CatalogSearchResult['facets'];
  onQualityChange: (v: string[]) => void;
  onAccessChange: (v: string[]) => void;
  onDomainChange: (v: string[]) => void;
  onSourceChange: (v: string[]) => void;
  onReset: () => void;
  sourceTypeOptions: string[];
}

const SideFilters: React.FC<SideFiltersProps> = ({
  qualityLevels, accessPolicies, domainIds, sourceTypes,
  domains, facets, onQualityChange, onAccessChange, onDomainChange, onSourceChange,
  onReset, sourceTypeOptions,
}) => {
  const toggleQuality = (v: string) => {
    onQualityChange(qualityLevels.includes(v)
      ? qualityLevels.filter((x) => x !== v)
      : [...qualityLevels, v]);
  };
  const toggleAccess = (v: string) => {
    onAccessChange(accessPolicies.includes(v)
      ? accessPolicies.filter((x) => x !== v)
      : [...accessPolicies, v]);
  };

  return (
    <aside style={{ width: 240, flexShrink: 0, padding: '0 0 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text strong style={{ color: boslerColors.textTitle, fontSize: 13 }}>Filtres</Text>
        <button
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            color: boslerColors.primary,
            cursor: 'pointer',
            fontSize: 12,
            padding: 0,
          }}
        >
          Réinitialiser
        </button>
      </div>

      {/* Niveau qualité */}
      <div style={filterSectionStyle}>
        <Text style={filterLabelStyle}>Niveau de qualité</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {QUALITY_OPTIONS.map((opt) => {
            const count = facets?.qualityLevel?.[opt.value];
            const active = qualityLevels.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleQuality(opt.value)}
                aria-pressed={active}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: 2,
                  border: `1px solid ${active ? opt.border : boslerColors.cardBorder}`,
                  background: active ? opt.color : 'transparent',
                  color: active ? opt.textColor : boslerColors.text,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: '"Poppins", system-ui, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                <span>{opt.label}</span>
                {count != null && (
                  <span style={{ fontSize: 11, color: boslerColors.textMuted }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Politique d'accès */}
      <div style={filterSectionStyle}>
        <Text style={filterLabelStyle}>Politique d'accès</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {ACCESS_OPTIONS.map((opt) => {
            const count = facets?.accessPolicy?.[opt.value];
            const active = accessPolicies.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleAccess(opt.value)}
                aria-pressed={active}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: 2,
                  border: `1px solid ${active ? opt.border : boslerColors.cardBorder}`,
                  background: active ? opt.color : 'transparent',
                  color: active ? opt.textColor : boslerColors.text,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: '"Poppins", system-ui, sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                <span>{opt.label}</span>
                {count != null && (
                  <span style={{ fontSize: 11, color: boslerColors.textMuted }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Domaine métier */}
      {domains.length > 0 && (
        <div style={filterSectionStyle}>
          <Text style={filterLabelStyle}>Domaine métier</Text>
          <div style={{ marginTop: 8 }}>
            <Checkbox.Group
              value={domainIds}
              onChange={(vals) => onDomainChange(vals as string[])}
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              {domains.map((d) => {
                const count = facets?.domainName?.[d.name];
                return (
                  <Checkbox key={d.id} value={d.id} style={{ fontSize: 12 }}>
                    <span style={{ color: boslerColors.text }}>{d.name}</span>
                    {count != null && (
                      <span style={{ fontSize: 11, color: boslerColors.textMuted, marginLeft: 4 }}>
                        ({count})
                      </span>
                    )}
                  </Checkbox>
                );
              })}
            </Checkbox.Group>
          </div>
        </div>
      )}

      {/* Type de source */}
      {sourceTypeOptions.length > 0 && (
        <div style={filterSectionStyle}>
          <Text style={filterLabelStyle}>Type de source</Text>
          <div style={{ marginTop: 8 }}>
            <Checkbox.Group
              value={sourceTypes}
              onChange={(vals) => onSourceChange(vals as string[])}
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              {sourceTypeOptions.map((st) => {
                const count = facets?.sourceType?.[st];
                return (
                  <Checkbox key={st} value={st} style={{ fontSize: 12 }}>
                    <span style={{ color: boslerColors.text }}>{st}</span>
                    {count != null && (
                      <span style={{ fontSize: 11, color: boslerColors.textMuted, marginLeft: 4 }}>
                        ({count})
                      </span>
                    )}
                  </Checkbox>
                );
              })}
            </Checkbox.Group>
          </div>
        </div>
      )}
    </aside>
  );
};

const filterSectionStyle: React.CSSProperties = {
  borderTop: `1px solid ${boslerColors.separator}`,
  paddingTop: 14,
  marginBottom: 14,
};

const filterLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: boslerColors.textTitle,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

// ---------------------------------------------------------------------------
// Page principale CatalogSearch
// ---------------------------------------------------------------------------

const SORT_OPTIONS = [
  { label: 'Pertinence', value: 'RELEVANCE' },
  { label: 'Score de confiance', value: 'TRUST_SCORE' },
  { label: 'Dernière mise à jour', value: 'UPDATED_AT' },
  { label: 'Popularité', value: 'POPULARITY' },
];

const CatalogSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- État synchronisé avec l'URL ---
  const getParamList = (key: string) => searchParams.getAll(key);
  const getParam     = (key: string, def: string) => searchParams.get(key) ?? def;

  const [q,              setQ]              = useState(() => getParam('q', ''));
  const [qualityLevels,  setQualityLevels]  = useState<string[]>(() => getParamList('quality'));
  const [accessPolicies, setAccessPolicies] = useState<string[]>(() => getParamList('access'));
  const [domainIds,      setDomainIds]      = useState<string[]>(() => getParamList('domain'));
  const [sourceTypes,    setSourceTypes]    = useState<string[]>(() => getParamList('source'));
  const [sort,           setSort]           = useState<string>(() => getParam('sort', 'RELEVANCE'));
  const [page,           setPage]           = useState<number>(() => parseInt(getParam('page', '1'), 10));

  const [result,         setResult]         = useState<CatalogSearchResult | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [domains,        setDomains]        = useState<CatalogDomain[]>([]);

  const [createModalOpen,  setCreateModalOpen]  = useState(false);
  const [createLoading,    setCreateLoading]    = useState(false);
  const [createError,      setCreateError]      = useState<string | null>(null);
  const [createForm]       = Form.useForm();

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Charger les domaines une seule fois
  useEffect(() => {
    listDomains().then(setDomains).catch(() => {});
  }, []);

  // Synchroniser URL → recherche
  const doSearch = useCallback(
    async (params: {
      q: string; qualityLevels: string[]; accessPolicies: string[];
      domainIds: string[]; sourceTypes: string[]; sort: string; page: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchDataProductsFaceted({
          q: params.q || undefined,
          qualityLevel: params.qualityLevels,
          accessPolicy: params.accessPolicies,
          domainId: params.domainIds,
          sourceType: params.sourceTypes,
          sort: params.sort as 'RELEVANCE' | 'TRUST_SCORE' | 'UPDATED_AT' | 'POPULARITY',
          page: params.page,
          size: PAGE_SIZE,
        });
        setResult(res);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Erreur de recherche';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounce sur q, déclenchement immédiat sur les filtres
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const p = new URLSearchParams();
      if (q)                    p.set('q', q);
      qualityLevels.forEach((v)  => p.append('quality', v));
      accessPolicies.forEach((v) => p.append('access', v));
      domainIds.forEach((v)      => p.append('domain', v));
      sourceTypes.forEach((v)    => p.append('source', v));
      if (sort !== 'RELEVANCE') p.set('sort', sort);
      if (page > 1)             p.set('page', String(page));
      setSearchParams(p, { replace: true });
      doSearch({ q, qualityLevels, accessPolicies, domainIds, sourceTypes, sort, page });
    }, DEBOUNCE_MS);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  // eslint-disable-next-line
  }, [q, qualityLevels, accessPolicies, domainIds, sourceTypes, sort, page]);

  const handleReset = () => {
    setQ('');
    setQualityLevels([]);
    setAccessPolicies([]);
    setDomainIds([]);
    setSourceTypes([]);
    setSort('RELEVANCE');
    setPage(1);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (val: string[]) => {
      setter(val);
      setPage(1);
    };

  const activeFiltersCount = qualityLevels.length + accessPolicies.length + domainIds.length + sourceTypes.length;

  // Options de sourceType extraites des facettes
  const sourceTypeOptions = useMemo(() => {
    if (result?.facets?.sourceType) return Object.keys(result.facets.sourceType);
    return [];
  }, [result]);

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      setCreateError(null);
      const created = await createDataProduct({
        name:            values.name,
        displayName:     values.displayName || undefined,
        description:     values.description || undefined,
        domainId:        values.domainId    || undefined,
        accessPolicy:    values.accessPolicy || undefined,
        dataProductType: values.dataProductType || undefined,
      });
      setCreateModalOpen(false);
      navigate(`/portal/catalog/data-product/${encodeURIComponent(created.name)}`);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création';
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Title
          level={2}
          style={{
            margin: 0,
            color: boslerColors.textTitle,
            fontFamily: '"Poppins", system-ui, sans-serif',
            fontSize: 22,
          }}
        >
          Catalogue de Data Products
        </Title>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            onClick={() => navigate('/portal/catalog/governance?tab=glossaire')}
            style={{
              borderColor: boslerColors.fieldBorder,
              borderRadius: 2,
              color: boslerColors.textSecondary,
              fontSize: 13,
            }}
          >
            Glossaire
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setCreateError(null); createForm.resetFields(); setCreateModalOpen(true); }}
            style={{
              backgroundColor: boslerColors.primary,
              borderColor: boslerColors.primary,
              borderRadius: 2,
              fontSize: 13,
            }}
          >
            Nouveau Data Product
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 52,
          background: boslerColors.card,
          border: `1px solid ${boslerColors.fieldBorder}`,
          borderRadius: 5,
          padding: '0 16px',
          marginBottom: 24,
          gap: 12,
        }}
      >
        <SearchOutlined style={{ color: boslerColors.textMuted, fontSize: 16 }} />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Full-text · nom + description + tags"
          aria-label="Rechercher des Data Products"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: boslerColors.text,
            fontFamily: '"Poppins", system-ui, sans-serif',
            background: 'transparent',
          }}
        />
        {loading && <Spin size="small" />}
      </div>

      {/* Corps : filtres + résultats */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* Filtres latéraux */}
        <SideFilters
          qualityLevels={qualityLevels}
          accessPolicies={accessPolicies}
          domainIds={domainIds}
          sourceTypes={sourceTypes}
          domains={domains}
          facets={result?.facets}
          onQualityChange={handleFilterChange(setQualityLevels)}
          onAccessChange={handleFilterChange(setAccessPolicies)}
          onDomainChange={handleFilterChange(setDomainIds)}
          onSourceChange={handleFilterChange(setSourceTypes)}
          onReset={handleReset}
          sourceTypeOptions={sourceTypeOptions}
        />

        {/* Résultats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Sous-titre + tri */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <Text style={{ color: boslerColors.textSecondary, fontSize: 13 }}>
              {result != null
                ? `${result.total.toLocaleString('fr-FR')} Data Product${result.total > 1 ? 's' : ''}`
                : ' '}
              {activeFiltersCount > 0 && (
                <span style={{ color: boslerColors.textMuted }}>
                  {' · '}{activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </Text>
            <Select
              value={sort}
              onChange={(v) => { setSort(v); setPage(1); }}
              options={SORT_OPTIONS}
              size="small"
              style={{ width: 190, fontSize: 12 }}
            />
          </div>

          {/* Erreur */}
          {error && (
            <Alert
              type="error"
              message="Erreur de recherche"
              description={error}
              showIcon
              style={{ marginBottom: 16, borderRadius: 5 }}
            />
          )}

          {/* Liste des cartes */}
          {result?.items.length === 0 && !loading && (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: boslerColors.card,
                border: `1px solid ${boslerColors.cardBorder}`,
                borderRadius: 5,
              }}
            >
              <Empty
                description={
                  <span style={{ color: boslerColors.textSecondary }}>
                    Aucun Data Product trouvé.{' '}
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={handleReset}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: boslerColors.primary,
                          cursor: 'pointer',
                          fontSize: 'inherit',
                          padding: 0,
                        }}
                      >
                        Effacer les filtres
                      </button>
                    )}
                  </span>
                }
              />
            </div>
          )}

          {result?.items.map((item) => (
            <DataProductCard key={item.name} item={item} />
          ))}

          {/* Pagination */}
          {result != null && result.total > PAGE_SIZE && (
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination
                current={page}
                total={result.total}
                pageSize={PAGE_SIZE}
                onChange={(p) => setPage(p)}
                showTotal={(t) => `${t} résultat(s)`}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      </div>
      {/* Modale création Data Product */}
      <Modal
        open={createModalOpen}
        title={<span style={{ color: boslerColors.textTitle, fontFamily: '"Poppins", system-ui, sans-serif' }}>Nouveau Data Product</span>}
        okText="Créer"
        cancelText="Annuler"
        confirmLoading={createLoading}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalOpen(false)}
        styles={{
          content: { background: boslerColors.card, borderRadius: 5 },
          header: { background: boslerColors.card, borderBottom: `1px solid ${boslerColors.separator}` },
          footer: { background: boslerColors.card, borderTop: `1px solid ${boslerColors.separator}` },
          mask:   { backgroundColor: 'rgba(0,0,0,0.6)' },
        }}
        width={520}
      >
        {createError && (
          <Alert
            type="error"
            message={createError}
            showIcon
            style={{ marginBottom: 16, borderRadius: 5 }}
          />
        )}
        <Form
          form={createForm}
          layout="vertical"
          requiredMark={false}
          style={{ fontFamily: '"Poppins", system-ui, sans-serif' }}
        >
          <Form.Item
            name="name"
            label={<span style={{ color: boslerColors.textSecondary, fontSize: 13 }}>Nom technique *</span>}
            rules={[
              { required: true, message: 'Le nom technique est obligatoire' },
              { pattern: /^[a-z0-9_-]+$/, message: 'Minuscules, chiffres, tirets et underscores uniquement' },
            ]}
          >
            <Input
              placeholder="ex. ventes_emea_2024"
              style={{ background: boslerColors.pageBg, borderColor: boslerColors.fieldBorder, color: boslerColors.text, borderRadius: 3 }}
            />
          </Form.Item>

          <Form.Item
            name="displayName"
            label={<span style={{ color: boslerColors.textSecondary, fontSize: 13 }}>Nom d'affichage</span>}
          >
            <Input
              placeholder="ex. Ventes EMEA 2024"
              style={{ background: boslerColors.pageBg, borderColor: boslerColors.fieldBorder, color: boslerColors.text, borderRadius: 3 }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ color: boslerColors.textSecondary, fontSize: 13 }}>Description</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Décrivez ce Data Product…"
              style={{ background: boslerColors.pageBg, borderColor: boslerColors.fieldBorder, color: boslerColors.text, borderRadius: 3 }}
            />
          </Form.Item>

          <Form.Item
            name="domainId"
            label={<span style={{ color: boslerColors.textSecondary, fontSize: 13 }}>Domaine métier</span>}
          >
            <Select
              placeholder="Sélectionner un domaine"
              allowClear
              style={{ width: '100%' }}
              options={domains.map((d) => ({ value: d.id, label: d.name }))}
              dropdownStyle={{ background: boslerColors.card }}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item
              name="accessPolicy"
              label={<span style={{ color: boslerColors.textSecondary, fontSize: 13 }}>Politique d'accès</span>}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Sélectionner"
                allowClear
                dropdownStyle={{ background: boslerColors.card }}
                options={[
                  { value: 'PUBLIC',     label: 'Public' },
                  { value: 'INTERNAL',   label: 'Interne' },
                  { value: 'RESTRICTED', label: 'Restreint' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="dataProductType"
              label={<span style={{ color: boslerColors.textSecondary, fontSize: 13 }}>Type</span>}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Sélectionner"
                allowClear
                dropdownStyle={{ background: boslerColors.card }}
                options={[
                  { value: 'SOURCE_ALIGNED',     label: 'Source alignée' },
                  { value: 'AGGREGATE',           label: 'Agrégat' },
                  { value: 'CONSUMER_ALIGNED',    label: 'Consommateur aligné' },
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CatalogSearch;
