// src/Apps/Studio/editor/PropertiesPanel.tsx
import React from 'react';
import {
  Checkbox,
  Form,
  Input,
  InputNumber,
  Select,
  Tabs,
  Typography,
} from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDefinition, AppNode, NodeType } from '../model/types';
import { applyOps } from '../store/studioStore';

// ---------------------------------------------------------------------------
// Helpers pour récupérer un nœud par id
// ---------------------------------------------------------------------------

function findNodeById(root: AppNode, id: string): AppNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Formulaire de props générique
// ---------------------------------------------------------------------------

interface PropField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
}

const PROP_FIELDS: Record<NodeType, PropField[]> = {
  stack: [{ key: 'gap', label: 'Espacement (gap)', type: 'number' }],
  table: [
    { key: 'title', label: 'Titre', type: 'string' },
    { key: 'pageSize', label: 'Lignes par page', type: 'number' },
    { key: 'selectable', label: 'Sélection de ligne', type: 'boolean' },
  ],
  form: [
    { key: 'title', label: 'Titre', type: 'string' },
    { key: 'submitLabel', label: 'Libellé du bouton', type: 'string' },
  ],
  kpis: [{ key: 'title', label: 'Titre', type: 'string' }],
  chart: [
    { key: 'title', label: 'Titre', type: 'string' },
    { key: 'x', label: 'Colonne X (axe)', type: 'string' },
    { key: 'y', label: 'Colonne Y (valeur)', type: 'string' },
  ],
  button: [
    { key: 'label', label: 'Libellé', type: 'string' },
    { key: 'variant', label: 'Variante', type: 'string' },
    { key: 'confirm', label: 'Texte de confirmation', type: 'string' },
  ],
};

interface NodePropsFormProps {
  node: AppNode;
}

const NodePropsForm: React.FC<NodePropsFormProps> = ({ node }) => {
  const dispatch = useDispatch();
  const fields = PROP_FIELDS[node.type] ?? [];

  const handleChange = (key: string, value: unknown) => {
    dispatch(applyOps([{ op: 'updateNode', nodeId: node.id, props: { [key]: value } }]));
  };

  if (fields.length === 0) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Aucune propriété configurable pour ce composant.
      </Typography.Text>
    );
  }

  return (
    <Form layout="vertical" size="small">
      {fields.map((field) => {
        const currentValue = node.props[field.key];

        if (field.key === 'variant' && node.type === 'button') {
          return (
            <Form.Item key={field.key} label={field.label}>
              <Select
                value={String(currentValue ?? 'primary')}
                onChange={(val) => handleChange(field.key, val)}
              >
                <Select.Option value="primary">Primaire</Select.Option>
                <Select.Option value="secondary">Secondaire</Select.Option>
                <Select.Option value="danger">Danger</Select.Option>
              </Select>
            </Form.Item>
          );
        }

        if (field.type === 'boolean') {
          return (
            <Form.Item key={field.key} label={field.label} valuePropName="checked">
              <Checkbox
                checked={Boolean(currentValue)}
                onChange={(e) => handleChange(field.key, e.target.checked)}
              />
            </Form.Item>
          );
        }

        if (field.type === 'number') {
          return (
            <Form.Item key={field.key} label={field.label}>
              <InputNumber
                style={{ width: '100%' }}
                value={typeof currentValue === 'number' ? currentValue : undefined}
                onChange={(val) => handleChange(field.key, val)}
              />
            </Form.Item>
          );
        }

        return (
          <Form.Item key={field.key} label={field.label}>
            <Input
              value={typeof currentValue === 'string' ? currentValue : ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
          </Form.Item>
        );
      })}
    </Form>
  );
};

// ---------------------------------------------------------------------------
// Onglet Données
// ---------------------------------------------------------------------------

interface NodeDataTabProps {
  node: AppNode;
  queries: Record<string, { id: string; kind: string }>;
}

const NodeDataTab: React.FC<NodeDataTabProps> = ({ node, queries }) => {
  const dispatch = useDispatch();

  const queryIds = Object.keys(queries);

  return (
    <Form layout="vertical" size="small">
      <Form.Item label="Requête liée">
        <Select
          allowClear
          placeholder="Aucune requête"
          value={node.bind?.query}
          onChange={(val) =>
            dispatch(
              applyOps([
                {
                  op: 'updateNode',
                  nodeId: node.id,
                  bind: val ? { query: val } : undefined,
                },
              ]),
            )
          }
        >
          {queryIds.map((qid) => (
            <Select.Option key={qid} value={qid}>
              {qid} ({queries[qid].kind})
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      {node.bind?.query && (
        <Form.Item label="SQL (lecture seule — modifiable dans l'onglet requête)">
          <Input.TextArea
            readOnly
            rows={4}
            value={(queries[node.bind.query] as { sql?: string })?.['sql'] ?? ''}
            style={{ fontFamily: 'monospace', fontSize: 11 }}
          />
        </Form.Item>
      )}
    </Form>
  );
};

// ---------------------------------------------------------------------------
// PropertiesPanel principal
// ---------------------------------------------------------------------------

const PropertiesPanel: React.FC = () => {
  const { selectedNodeId, definition } = useSelector(
    (state: Record<string, unknown>) => {
      const studio = state['studio'] as {
        selectedNodeId: string | null;
        definition: AppDefinition | null;
      };
      return studio;
    },
  );

  if (!definition || !selectedNodeId) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 16,
          textAlign: 'center',
        }}
      >
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Sélectionnez un composant dans le canvas pour afficher ses propriétés
        </Typography.Text>
      </div>
    );
  }

  const selectedNode = findNodeById(definition.pages[0].root, selectedNodeId);
  if (!selectedNode) {
    return (
      <div style={{ padding: 16 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Composant introuvable.
        </Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--movetodata-border, #e8e8e8)' }}>
        <Typography.Text strong style={{ fontSize: 13 }}>
          {selectedNode.type}
          {selectedNode.props.title ? ` — ${String(selectedNode.props.title)}` : ''}
        </Typography.Text>
        <br />
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          id: {selectedNode.id}
        </Typography.Text>
      </div>
      <Tabs
        size="small"
        style={{ padding: '0 12px' }}
        items={[
          {
            key: 'props',
            label: 'Propriétés',
            children: <NodePropsForm node={selectedNode} />,
          },
          {
            key: 'data',
            label: 'Données',
            children: (
              <NodeDataTab node={selectedNode} queries={definition.queries as Record<string, { id: string; kind: string; sql?: string }>} />
            ),
          },
        ]}
      />
    </div>
  );
};

export default PropertiesPanel;
