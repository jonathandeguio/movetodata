import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Modal,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  DeleteOutlined,
  EyeOutlined,
  RocketOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
import { AppListItem, deleteApp, publishApp } from '../api/studioApi';

dayjs.extend(relativeTime);
dayjs.locale('fr');

interface AppCardProps {
  app: AppListItem;
  onRefresh: () => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, onRefresh }) => {
  const navigate = useNavigate();

  const handleDelete = () => {
    Modal.confirm({
      title: `Supprimer « ${app.name} » ?`,
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await deleteApp(app.id);
          message.success('Application supprimée');
          onRefresh();
        } catch {
          message.error('Erreur lors de la suppression');
        }
      },
    });
  };

  const handlePublish = async () => {
    try {
      await publishApp(app.id);
      message.success('Application publiée');
      onRefresh();
    } catch {
      message.error('Erreur lors de la publication');
    }
  };

  const statusTag =
    app.status === 'PUBLISHED' ? (
      <Tag color="success" style={{ borderRadius: 2 }}>
        Publiée
      </Tag>
    ) : (
      <Tag color="processing" style={{ borderRadius: 2 }}>
        Brouillon
      </Tag>
    );

  return (
    <Card
      bordered
      style={{
        borderRadius: 5,
        boxShadow: 'none',
        height: '100%',
      }}
      styles={{ body: { padding: '16px' } }}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AppstoreOutlined style={{ fontSize: 20, color: 'var(--movetodata-primary, #24527a)' }} />
          <Typography.Text strong style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {app.name}
          </Typography.Text>
        </div>

        <div>{statusTag}</div>

        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {app.nodeCount} composant{app.nodeCount !== 1 ? 's' : ''}
        </Typography.Text>

        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          Mis à jour {dayjs(app.updatedAt).fromNow()}
        </Typography.Text>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          <Tooltip title="Ouvrir le Studio">
            <Button
              size="small"
              icon={<ToolOutlined />}
              onClick={() => navigate(`/portal/applications/${app.id}/studio`)}
            >
              Studio
            </Button>
          </Tooltip>

          <Tooltip title={app.status === 'DRAFT' ? 'Publiez l\'application pour accéder à l\'aperçu' : 'Aperçu'}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              disabled={app.status === 'DRAFT'}
              onClick={() => navigate(`/portal/apps/${app.id}`)}
            >
              Aperçu
            </Button>
          </Tooltip>

          {app.status === 'DRAFT' && (
            <Tooltip title="Publier cette version">
              <Button
                size="small"
                icon={<RocketOutlined />}
                type="primary"
                onClick={handlePublish}
              >
                Publier
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Supprimer">
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={handleDelete}
              aria-label="Supprimer l'application"
            />
          </Tooltip>
        </div>
      </Space>
    </Card>
  );
};

export default AppCard;
