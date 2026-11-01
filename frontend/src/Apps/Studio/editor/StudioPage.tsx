// src/Apps/Studio/editor/StudioPage.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, notification, Spin, Tabs } from 'antd';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDefinition } from '../model/types';
import { AppDefinitionSchema } from '../model/schemas';
import {
  loadDefinition,
  resetAppState,
} from '../store/studioStore';
import { getDraft, publishApp, saveDraft } from '../api/studioApi';
import StudioHeader from './StudioHeader';
import LibraryPanel from './LibraryPanel';
import CanvasView from './CanvasView';
import PropertiesPanel from './PropertiesPanel';
import AiAssistant from './AiAssistant';

type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error';

const AUTOSAVE_DELAY_MS = 1500;

const StudioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appName, setAppName] = useState('');
  const [appStatus, setAppStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const versionRef = useRef<number>(0);
  const isFirstRender = useRef(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { definition, selectedNodeId } = useSelector(
    (state: Record<string, unknown>) => {
      const studio = state['studio'] as {
        definition: AppDefinition | null;
        selectedNodeId: string | null;
      };
      return {
        definition: studio?.definition ?? null,
        selectedNodeId: studio?.selectedNodeId ?? null,
      };
    },
  );

  // ---------------------------------------------------------------------------
  // Chargement initial du brouillon
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    getDraft(id)
      .then((resp) => {
        if (cancelled) return;
        versionRef.current = resp.version;

        let parsed: AppDefinition;
        try {
          const raw: unknown = JSON.parse(resp.definition);
          parsed = AppDefinitionSchema.parse(raw) as AppDefinition;
        } catch {
          // Définition invalide — on garde la chaîne brute si elle parse comme objet
          parsed = JSON.parse(resp.definition) as AppDefinition;
        }

        dispatch(loadDefinition(parsed));
        dispatch(resetAppState());
        setAppName(parsed.name);
        setSaveStatus('saved');
        isFirstRender.current = false;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : 'Impossible de charger le brouillon';
        setLoadError(msg);
        isFirstRender.current = false;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]); // id est l'unique déclencheur souhaité — dispatch et getDraft sont stables

  // ---------------------------------------------------------------------------
  // Autosave avec debounce
  // ---------------------------------------------------------------------------

  const save = useCallback(async () => {
    if (!id || !definition) return;
    setSaveStatus('saving');
    try {
      const resp = await saveDraft(id, JSON.stringify(definition), versionRef.current);
      versionRef.current = resp.version;
      setSaveStatus('saved');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        notification.warning({
          message: 'Conflit de version détecté',
          description:
            "L'application a été modifiée par un autre utilisateur. Rechargez la page pour récupérer la dernière version.",
          duration: 0,
        });
      }
      setSaveStatus('error');
    }
  }, [id, definition]);

  useEffect(() => {
    // Ne pas sauvegarder lors du chargement initial
    if (isFirstRender.current || !definition) return;

    setSaveStatus('dirty');

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      save();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [definition, save]);

  // ---------------------------------------------------------------------------
  // Publication
  // ---------------------------------------------------------------------------

  const handlePublish = async () => {
    if (!id) return;
    try {
      await publishApp(id);
      setAppStatus('PUBLISHED');
      notification.success({ message: 'Application publiée avec succès' });
    } catch {
      notification.error({ message: 'Erreur lors de la publication' });
    }
  };

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spin size="large" tip="Chargement du Studio…" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          showIcon
          message="Impossible de charger l'application"
          description={loadError}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header fixe */}
      <StudioHeader
        appId={id ?? ''}
        appName={appName}
        status={appStatus}
        saveStatus={saveStatus}
        onPublish={handlePublish}
      />

      {/* Corps 3 panneaux */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          flexWrap: 'wrap',
        }}
      >
        {/* Panneau gauche — Bibliothèque */}
        <div
          style={{
            flex: '1 1 240px',
            maxWidth: 280,
            borderRight: '1px solid var(--movetodata-border, #e8e8e8)',
            overflowY: 'auto',
            background: 'var(--movetodata-surface, #fff)',
          }}
        >
          <LibraryPanel />
        </div>

        {/* Panneau central — Canvas */}
        <div style={{ flex: '999 1 480px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CanvasView />
        </div>

        {/* Panneau droit — Onglets Propriétés / Assistant IA */}
        <div
          style={{
            flex: '1 1 300px',
            maxWidth: 340,
            borderLeft: '1px solid var(--movetodata-border, #e8e8e8)',
            background: 'var(--movetodata-surface, #fff)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Tabs
            size="small"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            tabBarStyle={{ paddingLeft: 12, paddingRight: 12, marginBottom: 0, flexShrink: 0 }}
            items={[
              {
                key: 'assistant',
                label: 'Assistant IA',
                children: (
                  <div style={{ height: '100%', overflow: 'hidden' }}>
                    {id ? (
                      <AiAssistant appId={id} selectedNodeId={selectedNodeId} />
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'props',
                label: 'Propriétés',
                children: (
                  <div style={{ overflowY: 'auto', height: '100%' }}>
                    <PropertiesPanel />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default StudioPage;
