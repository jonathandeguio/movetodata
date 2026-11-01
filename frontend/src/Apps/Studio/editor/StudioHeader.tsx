// src/Apps/Studio/editor/StudioHeader.tsx
import React from 'react';
import { Button, Segmented, Space, Tag, Tooltip, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  RedoOutlined,
  RocketOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { redo, setMode, undo } from '../store/studioStore';

interface StudioHeaderProps {
  appId: string;
  appName: string;
  status: 'DRAFT' | 'PUBLISHED';
  saveStatus: 'saved' | 'saving' | 'dirty' | 'error';
  onPublish: () => void;
}

const StudioHeader: React.FC<StudioHeaderProps> = ({
  appId: _appId,
  appName,
  status,
  saveStatus,
  onPublish,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { past, future, mode } = useSelector(
    (state: Record<string, unknown>) => {
      const studio = state['studio'] as {
        past: unknown[];
        future: unknown[];
        mode: 'edit' | 'preview';
      };
      return studio;
    },
  );

  const saveLabel: Record<typeof saveStatus, string> = {
    saved: 'Enregistré',
    saving: 'Enregistrement…',
    dirty: 'Modification en cours…',
    error: 'Erreur d\'enregistrement',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 48,
        borderBottom: '1px solid var(--movetodata-border, #e8e8e8)',
        background: 'var(--movetodata-surface, #fff)',
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      {/* Fil d'Ariane */}
      <Space size={4} align="center">
        <Tooltip title="Retour aux applications">
          <Button
            type="text"
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/portal/applications')}
            aria-label="Retour aux applications"
          />
        </Tooltip>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Applications
        </Typography.Text>
        <Typography.Text style={{ fontSize: 13 }}>/</Typography.Text>
        <Typography.Text strong style={{ fontSize: 13 }}>
          {appName}
        </Typography.Text>
        {status === 'PUBLISHED' ? (
          <Tag color="success" style={{ borderRadius: 2, marginLeft: 4 }}>
            Publiée
          </Tag>
        ) : (
          <Tag color="processing" style={{ borderRadius: 2, marginLeft: 4 }}>
            Brouillon
          </Tag>
        )}
      </Space>

      {/* Centre : toggle Édition / Aperçu */}
      <Segmented
        size="small"
        value={mode}
        options={[
          { label: 'Édition', value: 'edit' },
          { label: 'Aperçu', value: 'preview' },
        ]}
        onChange={(val) => dispatch(setMode(val as 'edit' | 'preview'))}
      />

      {/* Droite : Undo/Redo + statut sauvegarde + Publier */}
      <Space size={8} align="center">
        <Typography.Text
          type={saveStatus === 'error' ? 'danger' : 'secondary'}
          style={{ fontSize: 11 }}
        >
          {saveLabel[saveStatus]}
        </Typography.Text>

        <Tooltip title={`Annuler (${past.length} étape${past.length !== 1 ? 's' : ''})`}>
          <Button
            size="small"
            icon={<UndoOutlined />}
            disabled={past.length === 0}
            onClick={() => dispatch(undo())}
            aria-label="Annuler"
          />
        </Tooltip>

        <Tooltip title={`Rétablir (${future.length} étape${future.length !== 1 ? 's' : ''})`}>
          <Button
            size="small"
            icon={<RedoOutlined />}
            disabled={future.length === 0}
            onClick={() => dispatch(redo())}
            aria-label="Rétablir"
          />
        </Tooltip>

        <Button
          type="primary"
          size="small"
          icon={<RocketOutlined />}
          disabled={status === 'PUBLISHED'}
          onClick={onPublish}
        >
          Publier
        </Button>
      </Space>
    </div>
  );
};

export default StudioHeader;
