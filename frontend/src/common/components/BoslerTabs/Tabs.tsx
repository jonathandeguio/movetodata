import { CrossIcon } from "assets/icons/mtdActionIcons";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { isDefined, isEmpty, moveElement, notEmpty } from "utils/utilities";
import {
  TabContext,
  TabContextProvider,
  initTabState,
  updateActiveKey,
} from "./MtdTabsContext";
import { ITab, ITabPane, TabsComponent } from "./types";
import { DndProvider, DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useContextMenuState } from "../ContextMenu";
import { FileExplorerContextMenuHandlerType } from "Apps/explorer/FileExplorer";
import { DraggableTabPaneHeaderItem } from "./TabHeaderItem";
import { TabsContextMenu } from "./TabsContextMenu";

export const ItemType = "TAB";

export interface TabPaneHeaderItemProps {
  paneKey: string;
  // Add other properties that your TabPaneHeaderItem might have
}

export interface DraggableTabPaneHeaderItemProps {
  item: ITabPane;
  removePin: (paneKey: string) => void;
  index: number;
  moveTab: (fromIndex: number, toIndex: number) => void;
  onContextMenu?: (x: number, y: number, paneKey: string) => void;
}

export interface DraggableTabsProps {
  items: TabPaneHeaderItemProps[];
  setItems: (items: TabPaneHeaderItemProps[]) => void;
  headerBarExtraContent?: React.ReactNode;
  fallback?: React.ReactNode;
}
const TabPane: React.FC<ITabPane> = ({
  paneKey,
  label,
  icon,
  closable,
  onOpen,
  onClose,
  children,
}) => {
  const context = useContext(TabContext);

  useEffect(() => {
    if (context?.state.activeKey === paneKey) {
      onOpen?.();
    }
  }, [context?.state.activeKey]);

  return (
    <div
      className={`tab_pane__body ${
        context?.state.activeKey === paneKey ? "tab_pane--active" : ""
      } `}
    >
      {children}
    </div>
  );
};

const MtdTabs: React.FC<ITab> = ({
  defaultActiveKey,
  fallback,
  showContextMenu = false,
  items: defaultItems,
  destroyOnClose,
  onChange,
  onMount,
  headerBarExtraContent,
}) => {
  const contextMenuStore = useContextMenuState();
  const [selected, setSelected] = useState<string[]>([]);

  const [contextMenuPaneKey, setContextMenuPaneKey] = useState<string>("");
  const contextMenuHandler = (x: number, y: number, paneKey: string) => {
    contextMenuStore.displayContextMenu(x, y);
    setContextMenuPaneKey(paneKey);
  };

  const context = useContext(TabContext);

  const [items, setItems] = useState<ITabPane[]>(defaultItems ?? []);

  const pinPane = useCallback(
    (paneKey: string) => {
      const pinnedCount = items.filter((item) => item.pinned).length;

      let updatedItems = [...items];

      const index = updatedItems.findIndex((item) => item.paneKey === paneKey);
      updatedItems[index].pinned = true;
      updatedItems = moveElement(updatedItems, index, pinnedCount);
      setItems(updatedItems);
    },
    [items]
  );

  const removePin = useCallback(
    (paneKey: string) => {
      const updatedItems = [...items];
      const index = updatedItems.findIndex((item) => item.paneKey === paneKey);
      updatedItems[index].pinned = false;
      setItems(updatedItems);
    },
    [items]
  );

  const openNewPane = useCallback(
    (panes: ITabPane[]) => {
      const newPanes: ITabPane[] = [];

      panes
        .filter((pane) =>
          isEmpty(items.find((tabPane) => tabPane.paneKey === pane.paneKey))
        )
        .forEach((pane) => {
          newPanes.push(pane);
        });
      if (newPanes.length >= 1) {
        setItems([...items, ...newPanes]);
        setActivePane(newPanes[newPanes.length - 1].paneKey);
      }
    },
    [items]
  );
  const closePane = useCallback(
    (paneKey: string) => {
      const updatedItems = items.filter(
        (tabPane) => tabPane.paneKey !== paneKey
      );

      if (notEmpty(updatedItems)) {
        setActivePane(updatedItems[updatedItems.length - 1].paneKey);
      }

      setItems(updatedItems);
    },
    [items]
  );

  const setActivePane = useCallback((paneKey: string) => {
    if (isDefined(context)) updateActiveKey(context.dispatch, paneKey);
  }, []);

  useEffect(() => {
    if (isDefined(defaultActiveKey)) {
      setActivePane(defaultActiveKey);
    }
  }, [defaultActiveKey]);

  useEffect(() => {
    if (context?.state.activeKey) {
      if (isDefined(context)) onChange?.(context.state.activeKey);
    }
  }, [context?.state.activeKey]);

  useEffect(() => {
    if (isDefined(context)) {
      const initialTabState = {
        activeKey:
          context.state.activeKey ??
          defaultActiveKey ??
          (notEmpty(items) ? items[0].paneKey : ""),
        openNewPane,
        closePane,
        setActivePane,
      };
      initTabState(context.dispatch, initialTabState);
      onMount?.(initialTabState);
    }
  }, [openNewPane, closePane, setActivePane]);

  useEffect(() => {
    if (isDefined(defaultItems)) {
      // remove already open items and add new
      const updatedItems = items.map((item) => {
        let newItem = item;
        defaultItems.forEach((defaultItem) => {
          if (item.paneKey === defaultItem.paneKey) {
            newItem = {
              ...newItem,
              ...defaultItem,
            };
          }
        });

        return newItem;
      });

      const newItems: ITabPane[] = [];
      const paneKeySet = new Set(updatedItems.map((item) => item.paneKey));

      defaultItems.forEach((item) => {
        if (!paneKeySet.has(item.paneKey)) newItems.push(item);
      });
      setItems([...updatedItems, ...newItems]);
    }
  }, [defaultItems]);

  const moveTab = (fromIndex: number, toIndex: number) => {
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setItems(updatedItems);
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="tabs__container">
          {items.length > 0 && (
            <div className="tabs__header">
              <div className="header_item__container">
                {items.map((item, index) => (
                  <DraggableTabPaneHeaderItem
                    removePin={removePin}
                    key={`${item.paneKey}-tab-pane`}
                    item={item}
                    index={index}
                    moveTab={moveTab}
                    onContextMenu={contextMenuHandler}
                  />
                ))}
              </div>
              <div className="tabs__header__action">
                {headerBarExtraContent}
              </div>
            </div>
          )}
          <div className="tab_content">
            {items.length > 0
              ? items.map((tabPane) => (
                  <TabPane key={tabPane.paneKey} {...tabPane} />
                ))
              : fallback ?? <></>}
          </div>
        </div>
      </DndProvider>
      {showContextMenu && (
        <TabsContextMenu
          pinPane={pinPane}
          removePin={removePin}
          activeKey={context?.state.activeKey}
          setActivePane={setActivePane}
          paneKey={contextMenuPaneKey}
          closePane={closePane}
          setItems={setItems}
          items={items}
          selected={selected}
          setSelected={setSelected}
          store={contextMenuStore}
        />
      )}
    </>
  );
};

const Tabs: TabsComponent = (props) => {
  return (
    <TabContextProvider>
      <MtdTabs {...props} />
    </TabContextProvider>
  );
};

Tabs.TabPane = TabPane;

export { Tabs, TabPane };
