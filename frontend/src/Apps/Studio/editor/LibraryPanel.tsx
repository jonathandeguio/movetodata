// src/Apps/Studio/editor/LibraryPanel.tsx
import React from 'react';
import { Tooltip, Typography } from 'antd';
import {
  BarChartOutlined,
  BarsOutlined,
  FormOutlined,
  FundOutlined,
  PlayCircleOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import type { AppNode, NodeType } from '../model/types';
import { genNodeId } from '../model/ids';
import { applyOps } from '../store/studioStore';

interface ComponentEntry {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const COMPONENTS: ComponentEntry[] = [
  {
    type: 'table',
    label: 'Tableau',
    description: 'Affiche des données en grille',
    icon: <TableOutlined />,
  },
  {
    type: 'form',
    label: 'Formulaire',
    description: 'Saisie et modification de données',
    icon: <FormOutlined />,
  },
  {
    type: 'kpis',
    label: 'KPIs',
    description: 'Indicateurs clés sous forme de statistiques',
    icon: <FundOutlined />,
  },
  {
    type: 'chart',
    label: 'Graphique',
    description: 'Visualisation en barres',
    icon: <BarChartOutlined />,
  },
  {
    type: 'button',
    label: 'Bouton',
    description: 'Déclencheur d\'action',
    icon: <PlayCircleOutlined />,
  },
  {
    type: 'stack',
    label: 'Conteneur',
    description: 'Empile des composants verticalement',
    icon: <BarsOutlined />,
  },
];

const buildDefaultNode = (type: NodeType): AppNode => {
  const id = genNodeId('n');
  switch (type) {
    case 'table':
      return { id, type, props: { title: 'Tableau', pageSize: 50, selectable: false } };
    case 'form':
      return { id, type, props: { title: 'Formulaire', fields: [], submitLabel: 'Enregistrer' } };
    case 'kpis':
      return { id, type, props: { title: 'KPIs', items: [] } };
    case 'chart':
      return { id, type, props: { title: 'Graphique', x: 'x', y: 'y', kind: 'bar' } };
    case 'button':
      return { id, type, props: { title: 'Bouton', label: 'Cliquer', variant: 'primary' } };
    case 'stack':
      return { id, type, props: { gap: 16 }, children: [] };
  }
};

const LibraryPanel: React.FC = () => {
  const dispatch = useDispatch();

  const rootId = useSelector((state: Record<string, unknown>) => {
    const studio = state['studio'] as {
      definition: { pages: [{ root: { id: string } }] } | null;
    };
    return studio?.definition?.pages[0]?.root?.id ?? null;
  });

  const handleAdd = (type: NodeType) => {
    if (!rootId) return;
    const node = buildDefaultNode(type);
    dispatch(applyOps([{ op: 'addNode', parentId: rootId, node }]));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 8px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <Typography.Text
        type="secondary"
        style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, padding: '0 4px', marginBottom: 4 }}
      >
        Composants
      </Typography.Text>

      {COMPONENTS.map((comp) => (
        <Tooltip key={comp.type} title={comp.description} placement="right">
          <button
            type="button"
            aria-label={`Ajouter un composant ${comp.label}`}
            onClick={() => handleAdd(comp.type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              border: '1px solid var(--movetodata-border, #e8e8e8)',
              borderRadius: 5,
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontSize: 13,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'var(--movetodata-primary-light, #24527a18)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <span style={{ color: 'var(--movetodata-primary, #24527a)', fontSize: 16 }}>
              {comp.icon}
            </span>
            <span>{comp.label}</span>
          </button>
        </Tooltip>
      ))}
    </div>
  );
};

export default LibraryPanel;
