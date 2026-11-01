// src/Apps/Studio/runtime/widgets/FormWidget.tsx
import React from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Typography,
  message,
} from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import type { AppNode } from '../../model/types';
import { requestRefetch, setAppState } from '../../store/studioStore';
import { runQuery as apiRunQuery } from '../../api/studioApi';

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
  loading?: boolean;
  error?: string | null;
  appId?: string;
  run?: (params?: Record<string, unknown>) => void;
}

const FormWidget: React.FC<FormWidgetProps> = ({
  node,
  mode,
  data,
  loading,
  appId,
}) => {
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

  const apiMode = mode === 'published' ? 'published' : 'draft';

  const handleSubmit = (values: Record<string, unknown>) => {
    // Mettre à jour l'état runtime avec les valeurs du formulaire
    Object.entries(values).forEach(([key, value]) => {
      dispatch(setAppState({ key, value }));
    });

    const onSubmit = node.events?.onSubmit ?? [];
    if (onSubmit.length === 0 && (mode === 'edit' || mode === 'preview')) {
      message.success('Formulaire soumis (mode aperçu)');
      return;
    }

    onSubmit.forEach((action) => {
      if (action.action === 'toast') {
        message.success(action.message);
      } else if (action.action === 'setState') {
        const rawValue = action.value;
        const match = /^\{\{form\.(\w+)\}\}$/.exec(rawValue.trim());
        const resolved = match ? values[match[1]] : rawValue;
        dispatch(setAppState({ key: action.key, value: resolved }));
      } else if (action.action === 'refetch') {
        dispatch(requestRefetch(action.query));
      } else if (action.action === 'runQuery') {
        if (!appId) return;
        // Résolution des paramètres : {{form.x}} → valeur du champ
        const resolvedParams: Record<string, unknown> = {};
        Object.entries(action.params ?? {}).forEach(([k, v]) => {
          const m = /^\{\{form\.(\w+)\}\}$/.exec(v.trim());
          resolvedParams[k] = m ? values[m[1]] : v;
        });
        apiRunQuery(appId, action.query, resolvedParams, apiMode)
          .then(({ rowsAffected }) => {
            if (rowsAffected > 0) {
              message.success(`${rowsAffected} ligne(s) modifiée(s).`);
            }
          })
          .catch((err: unknown) => {
            const msg =
              err instanceof Error ? err.message : 'Erreur lors de la requête.';
            message.error(msg);
          });
      }
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
      <Spin spinning={loading ?? false}>
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
              rules={
                field.required
                  ? [{ required: true, message: `${field.label} est obligatoire` }]
                  : []
              }
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
      </Spin>
    </div>
  );
};

export default FormWidget;
