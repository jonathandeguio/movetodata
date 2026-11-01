// src/Apps/Studio/editor/CanvasView.tsx
import React from 'react';
import { Typography } from 'antd';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDefinition, AppNode } from '../model/types';
import { applyOps } from '../store/studioStore';
import NodeRenderer from '../runtime/NodeRenderer';

// ---------------------------------------------------------------------------
// Élément sortable (wrappé autour de chaque enfant direct du canvas)
// ---------------------------------------------------------------------------

interface SortableNodeItemProps {
  nodeId: string;
  nodeLabel?: string;
  children: React.ReactNode;
  mode: 'edit' | 'preview';
}

const SortableNodeItem: React.FC<SortableNodeItemProps> = ({ nodeId, nodeLabel, children, mode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: nodeId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: mode === 'edit' ? 'grab' : 'default',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      aria-label={mode === 'edit' ? `Composant ${nodeLabel ?? nodeId} — déplaçable` : undefined}
      {...(mode === 'edit' ? { ...attributes, ...listeners } : {})}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// CanvasView
// ---------------------------------------------------------------------------

const CanvasView: React.FC = () => {
  const dispatch = useDispatch();

  const { definition, mode } = useSelector(
    (state: Record<string, unknown>) => {
      const studio = state['studio'] as {
        definition: AppDefinition | null;
        mode: 'edit' | 'preview';
      };
      return studio;
    },
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!definition) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography.Text type="secondary">Chargement de l'application…</Typography.Text>
      </div>
    );
  }

  const page = definition.pages[0];
  const root: AppNode = page.root;
  const children: AppNode[] = root.children ?? [];
  const childIds = children.map((c) => c.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = childIds.indexOf(String(active.id));
    const newIndex = childIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    dispatch(
      applyOps([
        { op: 'moveNode', nodeId: String(active.id), parentId: root.id, index: newIndex },
      ]),
    );
  };

  const canvasBackground = mode === 'edit'
    ? 'var(--movetodata-canvas-bg, #f5f7fa)'
    : 'transparent';

  return (
    <div
      style={{
        flex: '999 1 480px',
        height: '100%',
        overflowY: 'auto',
        background: canvasBackground,
        padding: mode === 'edit' ? '16px' : '0',
      }}
      onClick={() => {
        // Désélectionner en cliquant dans le vide
      }}
    >
      {mode === 'edit' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {children.length === 0 && (
                <div
                  style={{
                    border: '2px dashed var(--movetodata-border, #d0d0d0)',
                    borderRadius: 5,
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: 'var(--movetodata-text-secondary, #aaa)',
                  }}
                >
                  <Typography.Text type="secondary">
                    Canvas vide — ajoutez un composant depuis la bibliothèque
                  </Typography.Text>
                </div>
              )}
              {children.map((child) => (
                <SortableNodeItem key={child.id} nodeId={child.id} nodeLabel={String(child.props.title ?? child.type)} mode={mode}>
                  <NodeRenderer node={child} mode={mode} />
                </SortableNodeItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        // Mode aperçu — rendu direct sans DnD
        <NodeRenderer node={root} mode={mode} />
      )}
    </div>
  );
};

export default CanvasView;
