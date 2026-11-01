// src/Apps/Studio/runtime/widgets/TableWidget.tsx
import React from 'react';
import { Alert, Spin, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useDispatch } from 'react-redux';
import type { AppNode } from '../../model/types';
import { setAppState } from '../../store/studioStore';

interface TableWidgetProps {
  node: AppNode;
  mode: 'edit' | 'preview' | 'published';
  data: unknown[];
  loading?: boolean;
  error?: string | null;
  appId?: string;
  run?: (params?: Record<string, unknown>) => void;
}

const TableWidget: React.FC<TableWidgetProps> = ({
  node,
  mode,
  data,
  loading,
  error,
}) => {
  const dispatch = useDispatch();

  const props = node.props as {
    title?: string;
    columns?: { key: string; label: string; format?: string }[];
    pageSize?: number;
    selectable?: boolean;
  };

  // Détecter les colonnes depuis la définition ou le premier enregistrement
  let columns: ColumnsType<Record<string, unknown>>;
  if (props.columns && props.columns.length > 0) {
    columns = props.columns.map((col) => ({
      key: col.key,
      dataIndex: col.key,
      title: col.label,
    }));
  } else if (data.length > 0) {
    columns = Object.keys(data[0] as Record<string, unknown>).map((key) => ({
      key,
      dataIndex: key,
      title: key,
    }));
  } else {
    columns = [];
  }

  const handleRowClick = (record: Record<string, unknown>) => {
    const onRowClick = node.events?.onRowClick ?? [];
    onRowClick.forEach((action) => {
      if (action.action === 'setState') {
        // Évaluation simplifiée : {{row.id}} → record['id']
        const rawValue = action.value;
        const match = /^\{\{row\.(\w+)\}\}$/.exec(rawValue.trim());
        const resolved = match ? record[match[1]] : rawValue;
        dispatch(setAppState({ key: action.key, value: resolved }));
      }
    });
  };

  const dataSource = (data as Record<string, unknown>[]).map((row, i) => ({
    ...row,
    key: String(row['id'] ?? i),
  }));

  const rowSelection = props.selectable
    ? {
        type: 'radio' as const,
        onChange: (_: React.Key[], selectedRows: Record<string, unknown>[]) => {
          if (selectedRows[0]) handleRowClick(selectedRows[0]);
        },
      }
    : undefined;

  return (
    <div>
      {props.title && (
        <Typography.Title level={5} style={{ marginBottom: 8 }}>
          {props.title}
        </Typography.Title>
      )}
      {error && (
        <Alert
          type="error"
          message="Erreur de chargement"
          description={error}
          style={{ marginBottom: 8 }}
          showIcon
        />
      )}
      <Spin spinning={loading ?? false}>
        <Table
          size="small"
          dataSource={dataSource}
          columns={columns}
          pagination={{ pageSize: props.pageSize ?? 50, hideOnSinglePage: true }}
          rowSelection={rowSelection}
          onRow={
            mode !== 'edit'
              ? (record) => ({ onClick: () => handleRowClick(record) })
              : undefined
          }
          scroll={{ x: 'max-content' }}
          bordered={false}
        />
      </Spin>
    </div>
  );
};

export default TableWidget;
