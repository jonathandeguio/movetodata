// src/Apps/Studio/runtime/widgets/ButtonWidget.tsx
import React from 'react';
import { Button, Popconfirm, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import type { AppNode } from '../../model/types';
import { requestRefetch, setAppState } from '../../store/studioStore';
import { runQuery as apiRunQuery } from '../../api/studioApi';

interface ButtonWidgetProps {
  node: AppNode;
  mode: 'edit' | 'preview' | 'published';
  data: unknown[];
  loading?: boolean;
  error?: string | null;
  appId?: string;
  run?: (params?: Record<string, unknown>) => void;
}

const ButtonWidget: React.FC<ButtonWidgetProps> = ({ node, mode, appId }) => {
  const dispatch = useDispatch();
  const appState = useSelector((state: Record<string, unknown>) => {
    const studio = state['studio'] as { appState: Record<string, unknown> } | undefined;
    return studio?.appState ?? {};
  });

  const props = node.props as {
    title?: string;
    label?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    confirm?: string;
  };

  const label = props.label ?? 'Bouton';
  const variant = props.variant ?? 'primary';
  const confirmText = props.confirm;
  const apiMode = mode === 'published' ? 'published' : 'draft';

  const handleClick = () => {
    const onClick = node.events?.onClick ?? [];

    if (onClick.length === 0 && mode !== 'published') {
      message.info('Aucune action configurée (mode aperçu)');
      return;
    }

    onClick.forEach((action) => {
      if (action.action === 'setState') {
        // Résolution {{state.x}} → appState[x]
        const rawValue = action.value;
        const match = /^\{\{state\.(\w+)\}\}$/.exec(rawValue.trim());
        const resolved = match ? appState[match[1]] : rawValue;
        dispatch(setAppState({ key: action.key, value: resolved }));
      } else if (action.action === 'toast') {
        message.success(action.message);
      } else if (action.action === 'refetch') {
        dispatch(requestRefetch(action.query));
      } else if (action.action === 'runQuery') {
        if (!appId) return;
        // Résolution des paramètres : {{state.x}} → appState[x]
        const resolvedParams: Record<string, unknown> = {};
        Object.entries(action.params ?? {}).forEach(([k, v]) => {
          const m = /^\{\{state\.(\w+)\}\}$/.exec(v.trim());
          resolvedParams[k] = m ? appState[m[1]] : v;
        });
        apiRunQuery(appId, action.query, resolvedParams, apiMode)
          .then(({ rowsAffected }) => {
            if (rowsAffected > 0) {
              message.success(`${rowsAffected} ligne(s) modifiée(s).`);
            }
          })
          .catch((err: unknown) => {
            const msg =
              err instanceof Error ? err.message : 'Erreur lors de la requête.';
            message.error(msg);
          });
      }
    });
  };

  const btn = (
    <Button
      type={variant === 'primary' ? 'primary' : 'default'}
      danger={variant === 'danger'}
      onClick={confirmText ? undefined : handleClick}
    >
      {label}
    </Button>
  );

  if (confirmText) {
    return (
      <Popconfirm
        title={confirmText}
        onConfirm={handleClick}
        okText="Confirmer"
        cancelText="Annuler"
      >
        {btn}
      </Popconfirm>
    );
  }

  return btn;
};

export default ButtonWidget;
