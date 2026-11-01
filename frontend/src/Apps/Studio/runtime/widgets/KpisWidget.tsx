// src/Apps/Studio/runtime/widgets/KpisWidget.tsx
import React from 'react';
import { Col, Row, Statistic, Typography } from 'antd';
import type { AppNode } from '../../model/types';

interface KpiItem {
  key: string;
  label: string;
  format?: 'number' | 'currency' | 'percent';
}

interface KpisWidgetProps {
  node: AppNode;
  mode: 'edit' | 'preview' | 'published';
  data: unknown[];
}

const formatValue = (raw: unknown, format?: string): string | number => {
  const num = Number(raw);
  if (Number.isNaN(num)) return String(raw ?? '—');
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num);
    case 'percent':
      return `${(num * 100).toFixed(1)} %`;
    default:
      return new Intl.NumberFormat('fr-FR').format(num);
  }
};

const KpisWidget: React.FC<KpisWidgetProps> = ({ node, data }) => {
  const props = node.props as {
    title?: string;
    items?: KpiItem[];
  };

  const items: KpiItem[] = props.items ?? [];
  const record = (data[0] as Record<string, unknown>) ?? {};

  return (
    <div>
      {props.title && (
        <Typography.Title level={5} style={{ marginBottom: 8 }}>
          {props.title}
        </Typography.Title>
      )}
      <Row gutter={[16, 16]}>
        {items.length === 0 && (
          <Col>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Aucun KPI configuré
            </Typography.Text>
          </Col>
        )}
        {items.map((item) => (
          <Col key={item.key} xs={24} sm={12} md={8} lg={6}>
            <Statistic
              title={item.label}
              value={formatValue(record[item.key], item.format)}
              valueStyle={{ fontSize: 22, fontWeight: 600 }}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default KpisWidget;
