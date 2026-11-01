import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tooltip,
  message,
} from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { createApp, listSources, SourceItem } from '../api/studioApi';

interface NewAppDialogProps {
  open: boolean;
  onClose: () => void;
}

const NewAppDialog: React.FC<NewAppDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm<{ name: string; description?: string; datasourceId: string }>();
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingSources(true);
    listSources()
      .then(setSources)
      .catch(() => setSources([]))
      .finally(() => setLoadingSources(false));
  }, [open]);

  const handleCreateEmpty = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const { id } = await createApp({ name: values.name, datasourceId: values.datasourceId });
      message.success('Application créée');
      onClose();
      form.resetFields();
      navigate(`/portal/applications/${id}/studio`);
    } catch {
      // validation errors are shown inline by Ant Design
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
    form.resetFields();
  };

  return (
    <Modal
      title="Nouvelle application"
      open={open}
      onCancel={handleCancel}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={handleCancel}>Annuler</Button>
          <Tooltip title="Disponible en Phase 6">
            <Button icon={<RobotOutlined />} disabled>
              Générer avec l'IA
            </Button>
          </Tooltip>
          <Button type="primary" loading={submitting} onClick={handleCreateEmpty}>
            Créer vide
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="Nom"
          rules={[{ required: true, message: 'Le nom est requis' }]}
        >
          <Input placeholder="Nom de l'application" maxLength={100} />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea
            rows={3}
            placeholder="Décrivez l'application (optionnel — sera utilisée par l'IA en Phase 6)"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="datasourceId"
          label="Source de données"
          rules={[{ required: true, message: 'Veuillez sélectionner une source de données' }]}
        >
          <Select
            placeholder="Sélectionner une source"
            loading={loadingSources}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={sources.map((s) => ({
              value: s.id,
              label: `${s.name} (${s.type})`,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewAppDialog;
