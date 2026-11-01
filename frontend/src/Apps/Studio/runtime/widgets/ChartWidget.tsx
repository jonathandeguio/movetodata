// src/Apps/Studio/runtime/widgets/ChartWidget.tsx
// Graphique en barres — implémentation HTML pure (pas de @ant-design/plots absent du repo)
import React from 'react';
import { Typography } from 'antd';
import type { AppNode } from '../../model/types';

interface ChartWidgetProps {
  node: AppNode;
  mode: 'edit' | 'preview' | 'published';
  data: unknown[];
}

const BAR_COLOR = '#24527a';
const BAR_HEIGHT = 28;
const GAP = 6;

const ChartWidget: React.FC<ChartWidgetProps> = ({ node, data }) => {
  const props = node.props as {
    title?: string;
    x?: string;
    y?: string;
    kind?: string;
  };

  const xKey = props.x ?? 'x';
  const yKey = props.y ?? 'y';

  const rows = data as Record<string, unknown>[];

  const values = rows.map((r) => Number(r[yKey] ?? 0));
  const maxVal = Math.max(...values, 1);

  return (
    <div>
      {props.title && (
        <Typography.Title level={5} style={{ marginBottom: 8 }}>
          {props.title}
        </Typography.Title>
      )}
      {rows.length === 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Aucune donnée à afficher
        </Typography.Text>
      )}
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: GAP,
            minWidth: 200,
          }}
          role="img"
          aria-label={props.title ?? 'Graphique en barres'}
        >
          {rows.map((row, i) => {
            const label = String(row[xKey] ?? i);
            const value = Number(row[yKey] ?? 0);
            const widthPct = Math.max((value / maxVal) * 100, 2);
            return (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span
                  style={{
                    width: 80,
                    fontSize: 12,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    color: 'var(--movetodata-text-secondary, #555)',
                  }}
                  title={label}
                >
                  {label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: BAR_HEIGHT,
                    background: 'var(--movetodata-border, #e8e8e8)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${widthPct}%`,
                      height: '100%',
                      background: BAR_COLOR,
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 60,
                    fontSize: 12,
                    textAlign: 'right',
                    flexShrink: 0,
                    color: 'var(--movetodata-text-secondary, #555)',
                  }}
                >
                  {value.toLocaleString('fr-FR')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChartWidget;
