// src/Apps/Studio/runtime/widgets/ButtonWidget.tsx
import React from 'react';
import { Button, Popconfirm, message } from 'antd';
import { useDispatch } from 'react-redux';
import type { AppNode } from '../../model/types';
import { setAppState } from '../../store/studioStore';

interface ButtonWidgetProps {
  node: AppNode;
  mode: 'edit' | 'preview' | 'published';
  data: unknown[];
}

const ButtonWidget: React.FC<ButtonWidgetProps> = ({ node, mode }) => {
  const dispatch = useDispatch();

  const props = node.props as {
    title?: string;
    label?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    confirm?: string;
  };

  const label = props.label ?? 'Bouton';
  const variant = props.variant ?? 'primary';
  const confirmText = props.confirm;

  const handleClick = () => {
    const onClick = node.events?.onClick ?? [];

    if (onClick.length === 0 && mode !== 'published') {
      message.info('Aucune action configurée (mode aperçu)');
      return;
    }

    onClick.forEach((action) => {
      if (action.action === 'setState') {
        dispatch(setAppState({ key: action.key, value: action.value }));
      } else if (action.action === 'toast') {
        message.success(action.message);
      }
      // runQuery / refetch : Phase 5
    });
  };

  const btn = (
    <Button
      type={variant === 'primary' ? 'primary' : 'default'}
      danger={variant === 'danger'}
      onClick={confirmText ? undefined : handleClick}
    >
      {label}
    </Button>
  );

  if (confirmText) {
    return (
      <Popconfirm
        title={confirmText}
        onConfirm={handleClick}
        okText="Confirmer"
        cancelText="Annuler"
      >
        {btn}
      </Popconfirm>
    );
  }

  return btn;
};

export default ButtonWidget;
