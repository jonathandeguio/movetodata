// src/Apps/Studio/runtime/useAppQuery.ts
// Implémentation réelle Phase 5 — remplace le bouchon Phase 4

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';
import { runQuery as apiRunQuery } from '../api/studioApi';
import { requestRefetch, setAppState } from '../store/studioStore';
import type { AppDefinition } from '../model/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppQueryResult {
  data: unknown[];
  loading: boolean;
  error: string | null;
  /** Exécute la requête avec des paramètres supplémentaires. */
  run: (params?: Record<string, unknown>) => void;
  /** Relance la requête avec les derniers paramètres. */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mappe le mode Studio vers le mode API. */
function toApiMode(mode: 'edit' | 'preview' | 'published'): 'draft' | 'published' {
  return mode === 'published' ? 'published' : 'draft';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Exécute une requête liée à un nœud du canvas.
 *
 * @param appId    UUID de l'application
 * @param queryId  identifiant de la requête (clé dans AppDefinition.queries)
 * @param mode     mode courant ('edit' | 'preview' | 'published')
 */
export function useAppQuery(
  appId: string,
  queryId: string | undefined,
  mode: 'edit' | 'preview' | 'published',
): AppQueryResult {
  const dispatch = useDispatch();

  // Récupération du token de rafraîchissement depuis le store Redux
  const refreshToken = useSelector((state: Record<string, unknown>) => {
    const studio = state['studio'] as
      | { queryRefreshTokens: Record<string, number> }
      | undefined;
    return queryId ? (studio?.queryRefreshTokens[queryId] ?? 0) : 0;
  });

  // Récupération de la définition pour les onSuccess
  const definition = useSelector((state: Record<string, unknown>) => {
    const studio = state['studio'] as { definition: AppDefinition | null } | undefined;
    return studio?.definition;
  });

  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paramètres courants (mémorisés pour refetch)
  const lastParamsRef = useRef<Record<string, unknown>>({});

  // ---------------------------------------------------------------------------
  // Fonction d'exécution principale
  // ---------------------------------------------------------------------------

  const execute = useCallback(
    (params: Record<string, unknown> = {}) => {
      if (!appId || !queryId) return;

      lastParamsRef.current = params;
      setLoading(true);
      setError(null);

      apiRunQuery(appId, queryId, params, toApiMode(mode))
        .then(({ rows }) => {
          setData(rows);

          // Traitement des actions onSuccess définies dans le QueryDef
          if (definition?.queries) {
            const queryDef = definition.queries[queryId];
            if (queryDef?.onSuccess) {
              queryDef.onSuccess.forEach((action) => {
                if (action.action === 'refetch') {
                  dispatch(requestRefetch(action.query));
                } else if (action.action === 'toast') {
                  message.success(action.message);
                } else if (action.action === 'setState') {
                  dispatch(setAppState({ key: action.key, value: action.value }));
                }
              });
            }
          }
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error
              ? err.message
              : 'Erreur lors de l\'exécution de la requête.';
          setError(msg);
        })
        .finally(() => setLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appId, queryId, mode, definition],
  );

  // ---------------------------------------------------------------------------
  // Exécution automatique au montage et sur rafraîchissement
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (appId && queryId) {
      execute(lastParamsRef.current);
    }
    // refreshToken est inclus pour déclencher le refetch quand requestRefetch est dispatché
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, queryId, mode, refreshToken]);

  // ---------------------------------------------------------------------------
  // Retour
  // ---------------------------------------------------------------------------

  return {
    data,
    loading,
    error,
    run: (params?: Record<string, unknown>) => execute(params ?? {}),
    refetch: () => execute(lastParamsRef.current),
  };
}
