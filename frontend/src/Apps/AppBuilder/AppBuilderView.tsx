import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from 'antd';
import { AppDefinition, FieldConfig, getAppAPI, updateAppAPI } from './AppBuilder.api';

const { Title, Text } = Typography;

const FIELD_TYPES = [
  { label: 'Texte', value: 'text' },
  { label: 'Nombre', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'Booléen', value: 'boolean' },
  { label: 'Sélection', value: 'select' },
];

const AppBuilderView: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<AppDefinition | null>(null);
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchApp = async () => {
    if (!uuid) return;
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [uuid]);

  const handleAddField = async () => {
    try {
      const values = await form.validateFields();
      const newField: FieldConfig = {
        name: values.name,
        label: values.label,
        type: values.type,
        required: values.required ?? false,
        showInList: values.showInList ?? true,
        options: values.options
          ? values.options.split(',').map((o: string) => o.trim()).filter(Boolean)
          : undefined,
      };
      setFields((prev) => [...prev, newField]);
      form.resetFields();
      setModalOpen(false);
    } catch {
      // validation error
    }
  };

  const handleDeleteField = (name: string) => {
    setFields((prev) => prev.filter((f) => f.name !== name));
  };

  const handleSave = async () => {
    if (!uuid) return;
    setSaving(true);
    try {
      await updateAppAPI(uuid, { fieldsJson: JSON.stringify(fields) });
      message.success('Configuration enregistrée');
    } catch {
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: 'Nom', dataIndex: 'name', key: 'name' },
    { title: 'Label', dataIndex: 'label', key: 'label' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    {
      title: 'Requis',
      dataIndex: 'required',
      key: 'required',
      render: (v: boolean) => (v ? 'Oui' : 'Non'),
    },
    {
      title: 'Visible en liste',
      dataIndex: 'showInList',
      key: 'showInList',
      render: (v: boolean) => (v ? 'Oui' : 'Non'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: FieldConfig) => (
        <Button danger size="small" onClick={() => handleDeleteField(record.name)}>
          Supprimer
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {app ? app.name : 'Chargement…'}
          </Title>
          <Text type="secondary">Configuration des champs</Text>
        </div>
        <Space>
          <Button onClick={() => navigate(`/portal/applications/${uuid}`)}>
            Aperçu
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            Ajouter un champ
          </Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Enregistrer
          </Button>
        </Space>
      </div>

      <Table
        dataSource={fields}
        columns={columns}
        rowKey="name"
        loading={loading}
        pagination={false}
        bordered={false}
        size="middle"
      />

      <Modal
        title="Ajouter un champ"
        open={modalOpen}
        onOk={handleAddField}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText="Ajouter"
        cancelText="Annuler"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Nom du champ"
            rules={[
              { required: true, message: 'Nom requis' },
              { pattern: /^\S+$/, message: 'Pas d\'espace autorisé' },
            ]}
          >
            <Input placeholder="ex: firstName" />
          </Form.Item>
          <Form.Item name="label" label="Label" rules={[{ required: true, message: 'Label requis' }]}>
            <Input placeholder="ex: Prénom" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Type requis' }]} initialValue="text">
            <Select options={FIELD_TYPES} />
          </Form.Item>
          <Form.Item name="required" label="Requis" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
          <Form.Item name="showInList" label="Visible en liste" valuePropName="checked" initialValue={true}>
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, cur) => prev.type !== cur.type}
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === 'select' ? (
                <Form.Item name="options" label="Options (séparées par virgule)">
                  <Input placeholder="ex: Option1, Option2, Option3" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppBuilderView;
