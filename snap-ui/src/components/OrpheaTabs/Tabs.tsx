import { CrossIcon } from "assets/icons/movetodataActionIcons";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { isDefined, isEmpty, notEmpty } from "utils/utilities";
import {
  TabContext,
  TabContextProvider,
  initTabState,
  updateActiveKey,
} from "./OrpheaTabsContext";
import { ITab, ITabPane, TabsComponent } from "./types";

const TabPaneHeaderItem: React.FC<ITabPane> = ({
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
      {closable ? (
        <div
          className="header_item__close_icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            onClose?.();
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

const MoveToDataTabs: React.FC<ITab> = ({
  defaultActiveKey,
  fallback,
  items: defaultItems,
  destroyOnClose,
  onChange,
  onMount,
  headerBarExtraContent,
}) => {
  const context = useContext(TabContext);

  const [items, setItems] = useState<ITabPane[]>(defaultItems ?? []);

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
  }, []);

  useEffect(() => {
    if (isDefined(defaultItems)) {
      // remove already open items and add new
      const itemsCopy = items.map((item) => {
        let newItem = item;
        defaultItems.forEach((defaultItem) => {
          if (item.paneKey === defaultItem.paneKey) {
            newItem = defaultItem;
          }
        });

        return newItem;
      });
      setItems([...itemsCopy]);
    }
  }, [defaultItems]);

  return (
    <div className="tabs__container">
      {notEmpty(items) && (
        <div className="tabs__header">
          <div className="header_item__container ">
            {items.map((item) => (
              <TabPaneHeaderItem key={`${item.paneKey}-tab-pane`} {...item} />
            ))}
          </div>
          <div className="tabs__header__action">{headerBarExtraContent}</div>
        </div>
      )}
      <div className="tab_content">
        {notEmpty(items)
          ? items.map((tabPane) => <TabPane {...tabPane} />)
          : fallback ?? <></>}
      </div>
    </div>
  );
};

const Tabs: TabsComponent = (props) => {
  return (
    <TabContextProvider>
      <MoveToDataTabs {...props} />
    </TabContextProvider>
  );
};

Tabs.TabPane = TabPane;

export { Tabs, TabPane };
