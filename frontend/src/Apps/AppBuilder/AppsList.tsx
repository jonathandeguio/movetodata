import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Typography,
  message,
} from 'antd';
import { AppIcon } from 'assets/icons/mtdInterfaceIcons';
import {
  AppDefinition,
  createAppAPI,
  deleteAppAPI,
  listAppsAPI,
  updateAppAPI,
} from './AppBuilder.api';

const { Title, Text } = Typography;

const AppsList: React.FC = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<AppDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppDefinition | null>(null);
  const [form] = Form.useForm();

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data } = await listAppsAPI();
      setApps(data);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const openCreate = () => {
    setEditingApp(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (app: AppDefinition) => {
    setEditingApp(app);
    form.setFieldsValue({ name: app.name, description: app.description, icon: app.icon });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingApp) {
        await updateAppAPI(editingApp.uuid, values);
        message.success('Application mise à jour');
      } else {
        await createAppAPI({ ...values, fieldsJson: '[]' });
        message.success('Application créée');
      }
      setModalOpen(false);
      fetchApps();
    } catch {
      // validation error — do nothing
    }
  };

  const handleDelete = async (app: AppDefinition) => {
    Modal.confirm({
      title: `Supprimer "${app.name}" ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await deleteAppAPI(app.uuid);
          message.success('Application supprimée');
          fetchApps();
        } catch {
          message.error('Erreur lors de la suppression');
        }
      },
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <AppIcon size={22} /> Applications
        </Title>
        <Button type="primary" onClick={openCreate}>
          Nouvelle application
        </Button>
      </div>

      {apps.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <AppIcon size={48} />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Aucune application</Text>
          </div>
          <Button type="primary" style={{ marginTop: 16 }} onClick={openCreate}>
            Créer une application
          </Button>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {apps.map((app) => (
            <Col key={app.uuid} xs={24} sm={12} md={8} lg={6}>
              <Card
                bordered={false}
                style={{ borderRadius: 5, boxShadow: 'none' }}
                actions={[
                  <Button
                    key="open"
                    type="link"
                    size="small"
                    onClick={() => navigate(`/portal/applications/${app.uuid}`)}
                  >
                    Ouvrir
                  </Button>,
                  <Button
                    key="config"
                    type="link"
                    size="small"
                    onClick={() => openEdit(app)}
                  >
                    Configurer
                  </Button>,
                  <Button
                    key="builder"
                    type="link"
                    size="small"
                    onClick={() => navigate(`/portal/applications/${app.uuid}/builder`)}
                  >
                    Champs
                  </Button>,
                  <Button
                    key="delete"
                    type="link"
                    danger
                    size="small"
                    onClick={() => handleDelete(app)}
                  >
                    Supprimer
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={4}>
                  <AppIcon size={28} />
                  <Text strong>{app.name}</Text>
                  {app.description && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {app.description}
                    </Text>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingApp ? 'Modifier l\'application' : 'Nouvelle application'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Enregistrer"
        cancelText="Annuler"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Nom" rules={[{ required: true, message: 'Nom requis' }]}>
            <Input placeholder="Nom de l'application" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Description (optionnel)" />
          </Form.Item>
          <Form.Item name="icon" label="Icône">
            <Input placeholder="Identifiant d'icône (optionnel)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppsList;
