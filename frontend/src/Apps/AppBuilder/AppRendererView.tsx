import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from 'antd';
import axios from 'axios';
import { AppDefinition, FieldConfig, getAppAPI } from './AppBuilder.api';

const { Title, Text } = Typography;

const AppRendererView: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [app, setApp] = useState<AppDefinition | null>(null);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loadingApp, setLoadingApp] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [form] = Form.useForm();

  const fetchApp = async () => {
    if (!uuid) return;
    setLoadingApp(true);
    try {
      const { data } = await getAppAPI(uuid);
      setApp(data);
      try {
        setFields(JSON.parse(data.fieldsJson || '[]'));
      } catch {
        setFields([]);
      }
    } catch {
      message.error('Impossible de charger l\'application');
    } finally {
      setLoadingApp(false);
    }
  };

  const fetchData = async (appDef: AppDefinition) => {
    if (!appDef.resourceUrl) return;
    setLoadingData(true);
    try {
      const { data } = await axios.get(appDef.resourceUrl);
      setRecords(Array.isArray(data) ? data : data?.content ?? data?.items ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [uuid]);

  useEffect(() => {
    if (app) fetchData(app);
  }, [app]);

  const openCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!app?.resourceUrl) return;
    try {
      const values = await form.validateFields();
      if (editingRecord?.id) {
        await axios.put(`${app.resourceUrl}/${editingRecord.id}`, values);
        message.success('Enregistrement mis à jour');
      } else {
        await axios.post(app.resourceUrl, values);
        message.success('Enregistrement créé');
      }
      setModalOpen(false);
      fetchData(app);
    } catch {
      // validation error
    }
  };

  const handleDelete = (record: any) => {
    if (!app?.resourceUrl) return;
    Modal.confirm({
      title: 'Supprimer cet enregistrement ?',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await axios.delete(`${app.resourceUrl}/${record.id}`);
          message.success('Supprimé');
          fetchData(app);
        } catch {
          message.error('Erreur lors de la suppression');
        }
      },
    });
  };

  const renderField = (field: FieldConfig) => {
    switch (field.type) {
      case 'number':
        return <InputNumber style={{ width: '100%' }} />;
      case 'date':
        return <DatePicker style={{ width: '100%' }} />;
      case 'boolean':
        return <Switch />;
      case 'select':
        return (
          <Select
            options={(field.options ?? []).map((o) => ({ label: o, value: o }))}
            style={{ width: '100%' }}
          />
        );
      default:
        return <Input />;
    }
  };

  const visibleFields = fields.filter((f) => f.showInList);
  const tableColumns = [
    ...visibleFields.map((f) => ({
      title: f.label,
      dataIndex: f.name,
      key: f.name,
      render: (v: any) => {
        if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
        return v ?? '-';
      },
    })),
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Modifier
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record)}>
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  if (!app && !loadingApp) return null;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {app?.name ?? 'Chargement…'}
        </Title>
        <Button type="primary" onClick={openCreate} disabled={!app?.resourceUrl}>
          Nouveau
        </Button>
      </div>

      {!app?.resourceUrl && !loadingApp && (
        <div style={{ marginBottom: 16 }}>
          <Text type="warning">
            Aucune source de données configurée. Configurez l'application d'abord.
          </Text>
        </div>
      )}

      <Table
        dataSource={records}
        columns={tableColumns}
        rowKey={(r) => r.id ?? JSON.stringify(r)}
        loading={loadingApp || loadingData}
        pagination={{ pageSize: 20 }}
        bordered={false}
        size="middle"
        locale={{ emptyText: 'Aucune donnée' }}
      />

      <Modal
        title={editingRecord ? 'Modifier' : 'Nouveau'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText="Enregistrer"
        cancelText="Annuler"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {fields.map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              valuePropName={field.type === 'boolean' ? 'checked' : 'value'}
              rules={field.required ? [{ required: true, message: `${field.label} est requis` }] : []}
            >
              {renderField(field)}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default AppRendererView;
