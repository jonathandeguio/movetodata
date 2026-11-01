// src/Apps/Studio/runtime/NodeRenderer.tsx
// Composant unique partagé entre éditeur, aperçu et runtime publié — SPEC §5
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppNode } from '../model/types';
import { selectNode } from '../store/studioStore';
import { evalExpression } from './expressions';
import { useAppQuery } from './useAppQuery';

import StackWidget from './widgets/StackWidget';
import TableWidget from './widgets/TableWidget';
import FormWidget from './widgets/FormWidget';
import KpisWidget from './widgets/KpisWidget';
import ChartWidget from './widgets/ChartWidget';
import ButtonWidget from './widgets/ButtonWidget';

export interface NodeRendererProps {
  node: AppNode;
  mode: 'edit' | 'preview' | 'published';
  /** UUID de l'application — requis pour exécuter les requêtes en Phase 5. */
  appId?: string;
  /** Surcharge optionnelle de la sélection (sans Redux, ex. tests) */
  selectedNodeId?: string;
  /** Surcharge optionnelle du callback de sélection */
  onSelect?: (nodeId: string) => void;
}

const EDIT_BORDER_SELECTED = '2px solid #24527a';
const EDIT_BORDER_DEFAULT = '1px dashed transparent';
const EDIT_BORDER_HOVER = '1px dashed #24527a55';

const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  mode,
  appId,
  selectedNodeId: selectedNodeIdProp,
  onSelect: onSelectProp,
}) => {
  const dispatch = useDispatch();

  const storeSelectedNodeId = useSelector(
    (state: Record<string, unknown>) => {
      const studio = state['studio'] as { selectedNodeId: string | null } | undefined;
      return studio?.selectedNodeId ?? null;
    },
  );

  const appState = useSelector(
    (state: Record<string, unknown>) => {
      const studio = state['studio'] as { appState: Record<string, unknown> } | undefined;
      return studio?.appState ?? {};
    },
  );

  // Toujours appeler useAppQuery (règle des hooks) — queryId peut être undefined
  const { data, loading, error, run } = useAppQuery(appId ?? '', node.bind?.query, mode);

  const selectedNodeId = selectedNodeIdProp ?? storeSelectedNodeId;
  const handleSelect = onSelectProp ?? ((id: string) => dispatch(selectNode(id)));

  // Évaluation de visibleIf — si falsy, le nœud n'est pas rendu
  if (node.visibleIf) {
    try {
      const visible = evalExpression(node.visibleIf, { state: appState });
      if (!visible) return null;
    } catch {
      // En cas d'erreur d'expression, on affiche le nœud
    }
  }

  const widgetProps = { node, mode, data, loading, error, appId, run };

  const renderWidget = (): React.ReactNode => {
    switch (node.type) {
      case 'stack':
        return <StackWidget node={node} mode={mode} appId={appId} />;
      case 'table':
        return <TableWidget {...widgetProps} />;
      case 'form':
        return <FormWidget {...widgetProps} />;
      case 'kpis':
        return <KpisWidget {...widgetProps} />;
      case 'chart':
        return <ChartWidget {...widgetProps} />;
      case 'button':
        return <ButtonWidget {...widgetProps} />;
      default: {
        const _exhaustive: never = node.type;
        return (
          <div style={{ color: 'red', fontSize: 12 }}>
            Type inconnu : {String(_exhaustive)}
          </div>
        );
      }
    }
  };

  if (mode === 'edit') {
    const isSelected = selectedNodeId === node.id;
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`Sélectionner le composant ${node.type}${node.props.title ? ` « ${String(node.props.title)} »` : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect(node.id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect(node.id);
          }
        }}
        style={{
          border: isSelected ? EDIT_BORDER_SELECTED : EDIT_BORDER_DEFAULT,
          borderRadius: 2,
          padding: 4,
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s',
          boxShadow: isSelected ? '0 0 0 3px #24527a22' : 'none',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLDivElement).style.border = EDIT_BORDER_HOVER;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLDivElement).style.border = EDIT_BORDER_DEFAULT;
          }
        }}
      >
        {isSelected && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 4,
              fontSize: 10,
              color: '#24527a',
              background: '#24527a18',
              borderRadius: 2,
              padding: '0 4px',
              lineHeight: '16px',
              pointerEvents: 'none',
            }}
          >
            {node.type}
          </span>
        )}
        {renderWidget()}
      </div>
    );
  }

  return <>{renderWidget()}</>;
};

export default NodeRenderer;
