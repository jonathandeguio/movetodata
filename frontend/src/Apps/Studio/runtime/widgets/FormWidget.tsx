// src/Apps/Studio/runtime/widgets/FormWidget.tsx
import React from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  message,
} from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import type { AppNode } from '../../model/types';
import { setAppState } from '../../store/studioStore';

interface FormField {
  name: string;
  label: string;
  widget: 'text' | 'number' | 'select' | 'date';
  options?: string[];
  required?: boolean;
}

interface FormWidgetProps {
  node: AppNode;
  mode: 'edit' | 'preview' | 'published';
  data: unknown[];
}

const FormWidget: React.FC<FormWidgetProps> = ({ node, mode, data }) => {
  const dispatch = useDispatch();
  const appState = useSelector((state: Record<string, unknown>) => {
    const studio = state['studio'] as { appState: Record<string, unknown> } | undefined;
    return studio?.appState ?? {};
  });
  const [form] = Form.useForm();

  const props = node.props as {
    title?: string;
    fields?: FormField[];
    submitLabel?: string;
  };

  const fields: FormField[] = props.fields ?? [];
  const submitLabel = props.submitLabel ?? 'Enregistrer';

  // Pré-remplir le formulaire depuis les données liées (premier enregistrement)
  const initialValues = (data[0] as Record<string, unknown>) ?? {};

  const initialValuesKey = JSON.stringify(initialValues);
  React.useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValuesKey]); // dépendance stabilisée par stringify

  const handleSubmit = (values: Record<string, unknown>) => {
    // Mettre à jour l'état runtime avec les valeurs du formulaire
    Object.entries(values).forEach(([key, value]) => {
      dispatch(setAppState({ key, value }));
    });

    const onSubmit = node.events?.onSubmit ?? [];
    if (onSubmit.length === 0 && (mode === 'edit' || mode === 'preview')) {
      message.success('Formulaire soumis (mode aperçu)');
    }

    onSubmit.forEach((action) => {
      if (action.action === 'toast') {
        message.success(action.message);
      }
      // runQuery et refetch : Phase 5
    });
  };

  // Mettre à jour le champ form.x dans l'état
  const handleValuesChange = (changed: Record<string, unknown>) => {
    Object.entries(changed).forEach(([key, value]) => {
      dispatch(setAppState({ key: `form_${key}`, value }));
    });
  };

  return (
    <div>
      {props.title && (
        <Typography.Title level={5} style={{ marginBottom: 8 }}>
          {props.title}
        </Typography.Title>
      )}
      {fields.length === 0 && mode === 'edit' && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Aucun champ configuré — ajoutez des champs dans le panneau Propriétés
        </Typography.Text>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        initialValues={appState}
        size="small"
      >
        {fields.map((field) => (
          <Form.Item
            key={field.name}
            name={field.name}
            label={field.label}
            rules={field.required ? [{ required: true, message: `${field.label} est obligatoire` }] : []}
          >
            {field.widget === 'text' && <Input />}
            {field.widget === 'number' && <InputNumber style={{ width: '100%' }} />}
            {field.widget === 'select' && (
              <Select>
                {(field.options ?? []).map((opt) => (
                  <Select.Option key={opt} value={opt}>
                    {opt}
                  </Select.Option>
                ))}
              </Select>
            )}
            {field.widget === 'date' && <DatePicker style={{ width: '100%' }} />}
          </Form.Item>
        ))}
        {fields.length > 0 && (
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">
              {submitLabel}
            </Button>
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export default FormWidget;
