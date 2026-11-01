// src/Apps/Studio/runtime/AppRuntimePage.tsx
// Route publique runtime — version publiée d'une app, sans éditeur (SPEC §2, Phase 7)
import React, { useEffect, useState } from 'react';
import { Alert, Spin, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import type { AppDefinition } from '../model/types';
import { AppDefinitionSchema } from '../model/schemas';
import { getPublished } from '../api/studioApi';
import NodeRenderer from './NodeRenderer';

const AppRuntimePage: React.FC = () => {
  const { id: appId } = useParams<{ id: string }>();

  const [definition, setDefinition] = useState<AppDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notPublished, setNotPublished] = useState(false);

  useEffect(() => {
    if (!appId) {
      setError('Identifiant d\'application manquant.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotPublished(false);

    getPublished(appId)
      .then((resp) => {
        if (cancelled) return;

        let parsed: AppDefinition;
        try {
          const raw: unknown = JSON.parse(resp.definition);
          parsed = AppDefinitionSchema.parse(raw) as AppDefinition;
        } catch {
          // Définition invalide côté schéma — on tente quand même en tant qu'objet brut
          try {
            parsed = JSON.parse(resp.definition) as AppDefinition;
          } catch {
            setError('La définition de l\'application publiée est invalide.');
            setLoading(false);
            return;
          }
        }

        setDefinition(parsed);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setNotPublished(true);
        } else {
          setError('Impossible de charger l\'application. Veuillez réessayer.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appId]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Spin size="large" />
        <Typography.Text type="secondary">Chargement de l'application…</Typography.Text>
      </div>
    );
  }

  if (notPublished) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: 24,
        }}
      >
        <Alert
          type="info"
          showIcon
          message="Application non publiée"
          description="Cette application n'a pas encore été publiée. Ouvrez-la dans le Studio pour la publier."
          style={{ maxWidth: 480 }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: 24,
        }}
      >
        <Alert
          type="error"
          showIcon
          message="Erreur de chargement"
          description={error}
          style={{ maxWidth: 480 }}
        />
      </div>
    );
  }

  if (!definition) {
    return null;
  }

  const root = definition.pages[0].root;

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px',
        background: 'var(--movetodata-bg, #fff)',
      }}
    >
      <NodeRenderer
        node={root}
        mode="published"
        appId={appId}
      />
    </div>
  );
};

export default AppRuntimePage;
