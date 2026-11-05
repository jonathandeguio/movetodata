import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Divider,
  Form,
  InputNumber,
  Result,
  Spin,
  Timeline,
  Typography,
} from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  TrophyOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TextArea from 'antd/es/input/TextArea';
import Input from 'antd/es/input/Input';

import {
  getDataProduct,
  getGoldCriteria,
  submitCertificationRequest,
  getCertificationHistory,
  reviewCertificationRequest,
  type CatalogDataProduct,
  type CertificationLevel,
  type CertificationStatus,
  type CertificationRequest,
  type CertificationSlaData,
  type GoldCriteriaSummary,
} from '../../../services/catalogService';
import QualityBadge from './components/QualityBadge';
import StatusPill from './components/StatusPill';
import { boslerColors } from './theme/boslerTokens';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Types locaux
// ---------------------------------------------------------------------------

type StewardDecision = Exclude<CertificationStatus, 'PENDING'>;

interface SlaFormValues {
  freshnessHours?: number;
  availabilityPercent?: number;
  support?: string;
}

// ---------------------------------------------------------------------------
// Helpers visuels
// ---------------------------------------------------------------------------

/** Renvoie la variante StatusPill à partir d'un CertificationStatus. */
function statusVariant(status: CertificationStatus): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'APPROVED':             return 'success';
    case 'REJECTED':             return 'error';
    case 'CORRECTION_REQUESTED': return 'warning';
    default:                     return 'neutral';
  }
}

/** Libellé français d'un CertificationStatus. */
function statusLabel(status: CertificationStatus): string {
  switch (status) {
    case 'PENDING':              return 'En attente';
    case 'APPROVED':             return 'Approuvée';
    case 'REJECTED':             return 'Rejetée';
    case 'CORRECTION_REQUESTED': return 'Correction demandée';
  }
}

/** Libellé français d'un CertificationLevel. */
function levelLabel(level: CertificationLevel): string {
  switch (level) {
    case 'BRONZE': return 'Bronze';
    case 'SILVER': return 'Argent';
    case 'GOLD':   return 'Or';
  }
}

/** Niveau de certification cible (niveau suivant le niveau actuel). */
function nextLevel(current?: string): CertificationLevel {
  if (!current || current === 'BRONZE') return 'SILVER';
  if (current === 'SILVER') return 'GOLD';
  return 'GOLD';
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

const CatalogCertify: React.FC = () => {
  const { fqn: rawFqn } = useParams<{ fqn: string }>();
  const navigate         = useNavigate();
  const fqn              = rawFqn ? decodeURIComponent(rawFqn) : '';

  // ---- Données ----
  const [product,   setProduct]   = useState<CatalogDataProduct | null>(null);
  const [criteria,  setCriteria]  = useState<GoldCriteriaSummary | null>(null);
  const [history,   setHistory]   = useState<CertificationRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ---- Soumission ----
  const [slaForm]           = Form.useForm<SlaFormValues>();
  const [submitting,        setSubmitting]        = useState(false);
  const [submitDone,        setSubmitDone]        = useState(false);
  const [submitError,       setSubmitError]       = useState<string | null>(null);

  // ---- Revue steward ----
  const [reviewComment,     setReviewComment]     = useState('');
  const [reviewing,         setReviewing]         = useState(false);
  const [reviewDone,        setReviewDone]        = useState(false);
  const [reviewError,       setReviewError]       = useState<string | null>(null);

  const targetLevel = nextLevel(product?.qualityLevel);

  // -------------------------------------------------------------------------
  // Chargement initial
  // -------------------------------------------------------------------------

  const loadAll = useCallback(async () => {
    if (!fqn) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [dp, crit, hist] = await Promise.all([
        getDataProduct(fqn),
        getGoldCriteria(fqn),
        getCertificationHistory(fqn),
      ]);
      setProduct(dp);
      setCriteria(crit);
      setHistory(hist);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [fqn]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // -------------------------------------------------------------------------
  // Soumission de la demande
  // -------------------------------------------------------------------------

  const handleSubmit = async (): Promise<void> => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const values = await slaForm.validateFields();
      const slaData: CertificationSlaData = {};
      if (values.freshnessHours      != null) slaData.freshnessHours      = values.freshnessHours;
      if (values.availabilityPercent != null) slaData.availabilityPercent = values.availabilityPercent;
      if (values.support             != null) slaData.support             = values.support;

      await submitCertificationRequest(fqn, targetLevel, slaData);
      setSubmitDone(true);
      void loadAll(); // rafraîchir l'historique
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Revue steward
  // -------------------------------------------------------------------------

  const handleReview = async (decision: StewardDecision): Promise<void> => {
    const pending = history.find((r) => r.status === 'PENDING');
    if (!pending) return;
    setReviewing(true);
    setReviewError(null);
    try {
      await reviewCertificationRequest(pending.id, decision, reviewComment || undefined);
      setReviewDone(true);
      void loadAll();
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : 'Erreur lors de la revue.');
    } finally {
      setReviewing(false);
    }
  };

  // -------------------------------------------------------------------------
  // Critères non remplis (liste pour aria-describedby)
  // -------------------------------------------------------------------------

  const missingCriteria = (criteria?.criteria ?? []).filter((c) => !c.passed);
  const isGoldTarget    = targetLevel === 'GOLD';
  const submitDisabled  = isGoldTarget && (criteria == null || !criteria.allPassed);

  const pendingRequest = history.find((r) => r.status === 'PENDING');

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

  if (loadError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="Erreur de chargement" description={loadError} showIcon />
      </div>
    );
  }

  if (submitDone) {
    return (
      <div style={{ margin: '5px 0', padding: '0 16px' }}>
        <Result
          status="success"
          title="Demande de certification soumise"
          subTitle={`Votre demande de certification ${levelLabel(targetLevel)} est en attente de validation par un Data Steward.`}
          extra={[
            <Button
              key="back"
              type="primary"
              style={{ backgroundColor: boslerColors.primary, borderColor: boslerColors.primary, borderRadius: 2 }}
              onClick={() => navigate(`/portal/catalog/data-product/${encodeURIComponent(fqn)}`)}
            >
              Retour au Data Product
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ margin: '5px 0', padding: '0 16px', maxWidth: 960 }}>

      {/* Fil d'Ariane */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <span
                style={{ cursor: 'pointer', color: boslerColors.primary }}
                onClick={() => navigate('/portal/catalog/search')}
              >
                Catalogue
              </span>
            ),
          },
          {
            title: (
              <Link
                to={`/portal/catalog/data-product/${encodeURIComponent(fqn)}`}
                style={{ color: boslerColors.primary }}
              >
                {product?.displayName ?? product?.name ?? fqn}
              </Link>
            ),
          },
          { title: 'Certification' },
        ]}
      />

      {/* Titre */}
      <Title level={3} style={{ marginBottom: 20, color: boslerColors.textTitle }}>
        Certification — {product?.displayName ?? product?.name ?? fqn}
      </Title>

      {/* Niveau courant */}
      {product?.qualityLevel && (
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: boslerColors.textSecondary, marginRight: 8 }}>Niveau actuel :</Text>
          <QualityBadge level={product.qualityLevel.toLowerCase() as 'bronze' | 'silver' | 'gold'} />
        </div>
      )}

      {/* Stepper Bronze → Silver → Gold */}
      <div
        role="list"
        aria-label="Progression de certification"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          marginBottom: 28,
          userSelect: 'none',
        }}
      >
        {(['BRONZE', 'SILVER', 'GOLD'] as CertificationLevel[]).map((level, idx) => {
          const isCurrent = product?.qualityLevel === level;
          const isTarget  = level === targetLevel && !isCurrent;
          const passed    = ['BRONZE', 'SILVER', 'GOLD'].indexOf(product?.qualityLevel ?? '') > idx
                            || isCurrent;
          return (
            <React.Fragment key={level}>
              {idx > 0 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: passed ? boslerColors.primary : boslerColors.cardBorder,
                  }}
                />
              )}
              <div
                role="listitem"
                aria-current={isCurrent ? 'step' : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: isTarget
                      ? `2px dashed ${boslerColors.primary}`
                      : `2px solid ${passed ? boslerColors.primary : boslerColors.cardBorder}`,
                    background: passed ? boslerColors.primary : boslerColors.card,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: passed ? '#fff' : boslerColors.textMuted,
                  }}
                >
                  <TrophyOutlined style={{ fontSize: 16 }} />
                </div>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isCurrent || isTarget ? 600 : 400,
                    color: passed ? boslerColors.primary : boslerColors.textMuted,
                  }}
                >
                  {levelLabel(level)}
                </Text>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Zone principale */}
        <div style={{ flex: '999 1 480px', minWidth: 0 }}>

          {/* Carte critères Gold */}
          {isGoldTarget && criteria && (
            <Card
              style={{
                borderRadius: 5,
                border: `1px solid ${boslerColors.cardBorder}`,
                marginBottom: 20,
                boxShadow: 'none',
              }}
              title={
                <span style={{ color: boslerColors.text }}>
                  Critères obligatoires pour Gold &nbsp;
                  <Text
                    style={{
                      fontSize: 13,
                      color: criteria.allPassed ? boslerColors.trustHigh : boslerColors.textMuted,
                    }}
                  >
                    ({criteria.passedCount} / {criteria.totalCount} remplis)
                  </Text>
                </span>
              }
            >
              {criteria.allPassed && (
                <Alert
                  type="success"
                  message="Tous les critères sont remplis — vous pouvez soumettre votre demande."
                  showIcon
                  style={{ marginBottom: 16, borderRadius: 2 }}
                />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {criteria.criteria.map((c) => (
                  <div
                    key={c.key}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      background: c.passed ? boslerColors.accessPublicBg : boslerColors.accessRestrictedBg,
                      borderRadius: 2,
                      border: `1px solid ${c.passed ? boslerColors.accessPublicBorder : boslerColors.accessRestrictedBorder}`,
                    }}
                  >
                    {c.passed ? (
                      <CheckCircleFilled
                        style={{ color: boslerColors.trustHigh, fontSize: 16, marginTop: 2, flexShrink: 0 }}
                        aria-label="Critère validé"
                      />
                    ) : (
                      <CloseCircleFilled
                        style={{ color: boslerColors.accessRestrictedText, fontSize: 16, marginTop: 2, flexShrink: 0 }}
                        aria-label="Critère non validé"
                      />
                    )}
                    <div>
                      <Text strong style={{ color: boslerColors.text }}>{c.label}</Text>
                      <br />
                      <Text style={{ fontSize: 12, color: boslerColors.textSecondary }}>{c.explanation}</Text>
                      {c.link && !c.passed && (
                        <>
                          {' '}
                          <Link to={c.link} style={{ fontSize: 12, color: boslerColors.primary }}>
                            Voir →
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Formulaire SLA (Gold uniquement) */}
          {isGoldTarget && (
            <Card
              title="Engagements de niveau de service (SLA)"
              style={{
                borderRadius: 5,
                border: `1px solid ${boslerColors.cardBorder}`,
                marginBottom: 20,
                boxShadow: 'none',
              }}
            >
              <Form form={slaForm} layout="vertical">
                <Form.Item
                  label="Fraîcheur maximale (heures)"
                  name="freshnessHours"
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%', borderRadius: 2 }}
                    placeholder="Ex. 24"
                  />
                </Form.Item>
                <Form.Item
                  label="Disponibilité cible (%)"
                  name="availabilityPercent"
                  rules={[
                    {
                      validator(_, value) {
                        if (value == null || (value >= 0 && value <= 100)) return Promise.resolve();
                        return Promise.reject(new Error('Valeur entre 0 et 100'));
                      },
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.01}
                    style={{ width: '100%', borderRadius: 2 }}
                    placeholder="Ex. 99.9"
                  />
                </Form.Item>
                <Form.Item label="Niveau de support" name="support">
                  <Input
                    style={{ borderRadius: 2, borderColor: boslerColors.fieldBorder }}
                    placeholder="Ex. Business Hours, 24/7"
                  />
                </Form.Item>
              </Form>
            </Card>
          )}

          {/* Erreur soumission */}
          {submitError && (
            <Alert
              type="error"
              message="Erreur de soumission"
              description={submitError}
              showIcon
              closable
              style={{ marginBottom: 16, borderRadius: 2 }}
              onClose={() => setSubmitError(null)}
            />
          )}

          {/* Liste des critères manquants pour aria (accessibilité) */}
          {submitDisabled && missingCriteria.length > 0 && (
            <span
              id="cert-block-reason"
              role="alert"
              style={{
                display: 'block',
                marginBottom: 8,
                padding: '8px 12px',
                background: '#fff4e5',
                border: '1px solid #f2cf99',
                borderRadius: 2,
                color: '#8a4b00',
                fontSize: 12,
              }}
            >
              Critères non remplis :{' '}
              {missingCriteria.map((c) => c.label).join(' · ')}
            </span>
          )}

          {/* Bouton Soumettre */}
          <Button
            type="primary"
            loading={submitting}
            disabled={submitDisabled}
            aria-disabled={submitDisabled}
            aria-describedby={submitDisabled ? 'cert-block-reason' : undefined}
            onClick={() => void handleSubmit()}
            style={{
              backgroundColor: submitDisabled ? undefined : boslerColors.primary,
              borderColor: submitDisabled ? undefined : boslerColors.primary,
              borderRadius: 2,
              marginBottom: 24,
            }}
          >
            Soumettre la demande de certification {levelLabel(targetLevel)}
          </Button>

          {/* Section Data Steward */}
          {criteria?.canReview && pendingRequest && !reviewDone && (
            <Card
              title="Revue Data Steward"
              style={{
                borderRadius: 5,
                border: `1px solid ${boslerColors.cardBorder}`,
                boxShadow: 'none',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  background: boslerColors.separator,
                  borderRadius: 2,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: boslerColors.textSecondary, fontSize: 13 }}>
                  Demande en attente — cible :{' '}
                  <strong>{levelLabel(pendingRequest.targetLevel)}</strong> — soumise le{' '}
                  {new Date(pendingRequest.createdAt).toLocaleDateString('fr-FR')}
                </Text>
              </div>

              {reviewError && (
                <Alert
                  type="error"
                  message={reviewError}
                  showIcon
                  closable
                  style={{ marginBottom: 12, borderRadius: 2 }}
                  onClose={() => setReviewError(null)}
                />
              )}

              <Form.Item label="Commentaire">
                <TextArea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Justification de la décision (obligatoire pour rejet et correction)..."
                  style={{ borderColor: boslerColors.fieldBorder, borderRadius: 2 }}
                />
              </Form.Item>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button
                  type="primary"
                  loading={reviewing}
                  style={{ backgroundColor: boslerColors.primary, borderColor: boslerColors.primary, borderRadius: 2 }}
                  onClick={() => void handleReview('APPROVED')}
                  aria-label="Valider et promouvoir le Data Product"
                >
                  Valider et promouvoir
                </Button>
                <Button
                  loading={reviewing}
                  style={{ borderRadius: 2 }}
                  onClick={() => void handleReview('CORRECTION_REQUESTED')}
                  aria-label="Demander des corrections"
                >
                  Demander des corrections
                </Button>
                <Button
                  danger
                  loading={reviewing}
                  style={{ borderRadius: 2, color: boslerColors.accessRestrictedText, borderColor: boslerColors.accessRestrictedText }}
                  onClick={() => void handleReview('REJECTED')}
                  aria-label="Rejeter la demande de certification"
                >
                  Rejeter
                </Button>
              </div>
            </Card>
          )}

          {reviewDone && (
            <Alert
              type="success"
              message="Revue enregistrée avec succès."
              showIcon
              style={{ marginBottom: 16, borderRadius: 2 }}
            />
          )}
        </div>

        {/* Panneau latéral — workflow + historique */}
        <div style={{ flex: '1 1 260px', minWidth: 220 }}>

          {/* Étapes du workflow */}
          <Card
            title="Workflow"
            size="small"
            style={{
              borderRadius: 5,
              border: `1px solid ${boslerColors.cardBorder}`,
              boxShadow: 'none',
              marginBottom: 16,
            }}
          >
            <Timeline
              items={[
                { color: boslerColors.primary, children: 'Soumettre la demande' },
                {
                  color: pendingRequest ? boslerColors.primary : boslerColors.cardBorder,
                  children: 'Validation par le Data Steward',
                },
                {
                  color: history.some((r) => r.status === 'APPROVED') ? boslerColors.trustHigh : boslerColors.cardBorder,
                  children: 'Promotion du niveau',
                },
              ]}
            />
          </Card>

          {/* Historique */}
          <Card
            title="Historique"
            size="small"
            style={{
              borderRadius: 5,
              border: `1px solid ${boslerColors.cardBorder}`,
              boxShadow: 'none',
            }}
          >
            {history.length === 0 ? (
              <Text style={{ color: boslerColors.textMuted, fontSize: 12 }}>
                Aucune demande pour ce Data Product.
              </Text>
            ) : (
              history.map((req, idx) => (
                <div key={req.id}>
                  {idx > 0 && <Divider style={{ margin: '8px 0' }} />}
                  <div style={{ fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <QualityBadge level={req.targetLevel.toLowerCase() as 'bronze' | 'silver' | 'gold'} />
                      <StatusPill status={statusLabel(req.status)} variant={statusVariant(req.status)} />
                    </div>
                    <Text style={{ color: boslerColors.textMuted, fontSize: 11 }}>
                      {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                    {req.comment && (
                      <div style={{ marginTop: 4, color: boslerColors.textSecondary, fontStyle: 'italic' }}>
                        « {req.comment} »
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CatalogCertify;
