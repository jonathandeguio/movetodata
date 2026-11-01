// src/Apps/Studio/runtime/widgets/StackWidget.tsx
import React from 'react';
import type { AppNode } from '../../model/types';
import NodeRenderer from '../NodeRenderer';

interface StackWidgetProps {
  node: AppNode;
  mode: 'edit' | 'preview' | 'published';
}

const StackWidget: React.FC<StackWidgetProps> = ({ node, mode }) => {
  const gap = typeof node.props.gap === 'number' ? node.props.gap : 16;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {(node.children ?? []).map((child) => (
        <NodeRenderer key={child.id} node={child} mode={mode} />
      ))}
    </div>
  );
};

export default StackWidget;
