import { CrossIcon, PinIcon } from "assets/icons/mtdActionIcons";
import React, { useContext } from "react";
import { DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import { useContextMenuState } from "../ContextMenu";
import { TabContext } from "./MtdTabsContext";
import { DraggableTabPaneHeaderItemProps, ItemType } from "./Tabs";
import { ITabPane } from "./types";

interface IremPin {
  removePin: (paneKey: string) => void;
}
const TabPaneHeaderItem: React.FC<IremPin & ITabPane> = ({
  pinned = false,
  removePin,
  paneKey,
  label,
  icon,
  closable,
  onClose,
}) => {
  const context = useContext(TabContext);

  return (
    <div
      className={`header_item ${
        context?.state.activeKey === paneKey ? "header_item--active" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();

        context?.state.setActivePane(paneKey);
      }}
    >
      <div className="header_item__icon">{icon}</div>
      <div className="header_item__label">{label}</div>
      {pinned && (
        <div
          className=""
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            removePin(paneKey);
          }}
        >
          <PinIcon />
        </div>
      )}
      {!pinned && closable ? (
        <div
          className="header_item__close_icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            onClose?.(paneKey);
            context?.state.closePane(paneKey);
          }}
        >
          <CrossIcon />
        </div>
      ) : (
        <div className="header_item__close_placeholder"></div>
      )}
    </div>
  );
};

export const DraggableTabPaneHeaderItem: React.FC<
  DraggableTabPaneHeaderItemProps
> = ({ item, index, removePin, moveTab, onContextMenu }) => {
  const [, ref] = useDrag({
    type: ItemType,
    item: { index },
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (draggedItem: { index: number }, monitor: DropTargetMonitor) => {
      if (draggedItem.index !== index) {
        moveTab(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <>
      <div
        onContextMenu={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onContextMenu?.(e.clientX, e.clientY, item.paneKey);
        }}
        ref={(node) => ref(drop(node))}
      >
        <TabPaneHeaderItem removePin={removePin} {...item} />
      </div>
    </>
  );
};
