import React from "react";
import { DragHandleVerticalIcon } from "../../../assets/icons/mtdActionIcons";
import "./ResizablePane.scss";

const CollapserHandler = ({ primaryPanelRef }: { primaryPanelRef: any }) => {
  const handleToggleCollapse = () => {
    if (primaryPanelRef.current) {
      if (!primaryPanelRef.current.isCollapsed()) {
        primaryPanelRef.current.collapse();
      } else {
        primaryPanelRef.current.expand();
      }
    }
  };

  return (
    <div className="resizablePane-collapser-box">
      <button
        className="resizablePane-collapser-box-button"
        onClick={() => {
          handleToggleCollapse();
        }}
      >
        <DragHandleVerticalIcon />
      </button>
    </div>
  );
};

export { CollapserHandler };
