import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { Popconfirm, Typography } from "antd";
import DraggableTabs from "components/CommonUI/DraggableTabs";
import { useAutoSaveReady } from "components/VersionHistory/hooks/setAutoSaveReady";
import MtdLoader from "components/mtdLoader";
import useEffectOnlyOnDependencyUpdate from "hooks/useEffectOnlyOnDependencyUpdate";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { isDefined, openNotification } from "utils/utilities";
import { CrossIcon } from "../../../../assets/icons/mtdActionIcons";
import {
  changeDashboardTab,
  updateGridConfig,
} from "../../../../redux/actions/dashboardActions";
import { EDIT_MODE } from "../../../../redux/constants/resourcePermissionConstants";
import { RootState, ThunkAppDispatch } from "../../../../redux/types/store";
import { ITabConfig } from "../Dashboard";
import {
  addTabToDashboardAPI,
  getDashboardTabsAPI,
  getTabCustomizeAPI,
  moveTabAPI,
  removeTabFromDashboardAPI,
} from "../Dashboard.api";
import DashboardGridDataFetcher from "../DashboardGridDataFetcher";
import DashboardTabName from "./DashboardTabName";
import {
  DELETE_TAB_HEADING,
  NO_TEXT,
  YES_TEXT,
} from "./DashboardTabs.constants";
import { cancelTabDeletion, confirmTabDeletion } from "./DashboardTabs.utils";
const { Text } = Typography;
type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

type dashboardTabType = {
  id: string;
  name: string;
  chartsForTabs: Array<any>;
  tabElements: Array<any>;
  createdAt: number | string;
  updatedAt: number | string | null;
  createdBy: number | string;
  updatedBy: number | string | null;
};

type selectedTabType = {
  key: string;
  id: string;
};

const DashboardTabs = ({ gridRef }: { gridRef: any }) => {
  const { id, tabId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!isDefined(id)) {
    throw new Error("Id is undefined, unable to load chart!");
  }

  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[id]
  );
  const { changedVersionDash } = useSelector(
    (state: RootState) => state.version
  );
  const { newVersion } = useSelector((state: RootState) => state.version);

  const editable = resourcePermission.mode == EDIT_MODE;

  const [activeKey, setActiveKey] = useState<string>("1");
  const [tabsItems, setTabsItems] = useState<any>();
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();
  const setAutoSaveReady = useAutoSaveReady();

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setTabsItems((prev: any[]) => {
        const activeIndex = prev.findIndex((i) => i.key === active.id);
        const overIndex = prev.findIndex((i) => i.key === over?.id);

        moveTabAPI(active.id as string, overIndex).then(() => {});
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  const onTabChange = (newActiveKey: string) => {
    let tabId = newActiveKey;

    getTabCustomizeAPI(tabId)
      .then((data: ITabConfig) => {
        dispatch(updateGridConfig(data));
      })
      .catch((err) => {})
      .finally(() => {
        if (searchParams.get("filter")) {
          navigate({
            pathname: `/portal/kepler/DASHBOARD/${id}/${tabId}`,
            search: `?filter=${searchParams.get("filter")}`,
          });
        } else {
          navigate(`/portal/kepler/DASHBOARD/${id}/${tabId}`, {});
        }
        dispatch(changeDashboardTab(tabId));
        setActiveKey(newActiveKey);
      });
  };

  const add = async () => {
    if (!id) return;
    setAutoSaveReady(true);
    addTabToDashboardAPI(id)
      .then((data) => {
        const len = (Number(tabsItems?.length) + 1).toString();
        setTabsItems([
          ...tabsItems,
          {
            label: data.name,
            children: (
              <DashboardGridDataFetcher
                dashId={id}
                selectedTab={{
                  key: len,
                  id: data.id,
                }}
                gridRef={gridRef}
                dashboardId={id}
              />
            ),
            key: data.id,
            uniqueId: data.id,
            closable: editable,
            name: data.name,
          },
        ]);
        onTabChange(data.id);
      })
      .catch((error) => {
        openNotification("Tab not added.", " ", "error");
      });
  };

  const remove = async (targetKey: TargetKey) => {
    if (!id) return;
    const targetIndex = tabsItems.findIndex(
      (pane: any) => pane.key === targetKey
    );
    const targetUniqueId = tabsItems[targetIndex].uniqueId;
    const newPanes = tabsItems.filter((pane: any) => pane.key !== targetKey);
    setAutoSaveReady(true);
    removeTabFromDashboardAPI(id, targetUniqueId).then((data) => {
      if (newPanes.length && targetKey === activeKey) {
        const { key } =
          newPanes[
            targetIndex === newPanes.length ? targetIndex - 1 : targetIndex
          ];
        setActiveKey(key);
      }
      setTabsItems(newPanes);
    });
  };

  const onEdit = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: "add" | "remove"
  ) => {
    if (action === "add") {
      add();
    } else {
      remove(targetKey);
    }
  };

  const getTabs = async (versionId = undefined) => {
    if (!id) return;
    const items: any[] = [];
    getDashboardTabsAPI(id, versionId)
      .then((dashboardTabs) => {
        let newActiveKey = dashboardTabs[0].id;
        if (tabId == null || tabId == undefined) {
          // if (versionId != undefined) {
          window.history.replaceState(
            {},
            "dashboard",
            `/portal/kepler/DASHBOARD/${id}/${dashboardTabs[0].id}`
          );
          // }
        }
        dashboardTabs.map((tab: any, _i: number) => {
          const index = (_i + 1).toString();
          if (tab.id == (tabId ? tabId : dashboardTabs[0].id)) {
            newActiveKey = tab.id;
            console.log("UPDATING GRID CONFIG : ", tab);
            dispatch(updateGridConfig(tab));
          }

          items.push({
            label: tab.name,
            key: tab.id,
            children: (
              <DashboardGridDataFetcher
                dashId={id}
                selectedTab={{
                  key: index,
                  id: dashboardTabs[Number(index) - 1].id,
                }}
                gridRef={gridRef}
                dashboardId={id}
              />
            ),
            closable: editable,
            uniqueId: dashboardTabs[Number(index) - 1].id,
            name: tab.name,
          });
        });
        dispatch(changeDashboardTab(newActiveKey));
        setActiveKey(newActiveKey);
        setTabsItems(items);
      })
      .catch((error) => {
        openNotification("Tabs not fetched.", " ", "error");
      });
  };

  const alterTabs = async () => {
    const items = tabsItems;
    tabsItems.map((tab: any) => {
      tab.closable = editable;
    });
    setTabsItems(items);
  };

  useEffect(() => {
    getTabs(changedVersionDash);
  }, [changedVersionDash]);

  useEffectOnlyOnDependencyUpdate(() => {
    getTabs();
  }, [newVersion]);

  useEffect(() => {
    if (tabsItems != undefined) alterTabs();
  }, [editable]);

  if (!tabsItems) return <MtdLoader />;

  tabsItems.map((tab: any, _i: any) => {
    if (activeKey == tab.key && editable) {
      tab.label = <DashboardTabName tab={tab} editable />;
    } else if (!editable) {
      tab.label = <DashboardTabName tab={tab} />;
    } else {
      tab.label = tab.name;
    }

    if (editable) {
      tab.closeIcon = (
        <Popconfirm
          title={DELETE_TAB_HEADING}
          onConfirm={confirmTabDeletion}
          onCancel={cancelTabDeletion}
          okText={YES_TEXT}
          cancelText={NO_TEXT}
        >
          <CrossIcon />
        </Popconfirm>
      );
    }
  });

  return (
    <DraggableTabs
      isDraggable={editable}
      type={editable ? "editable-card" : "card"}
      onChange={onTabChange}
      activeKey={activeKey}
      onEdit={onEdit}
      items={tabsItems}
      tabBarStyle={{
        marginBottom: 0,
      }}
      onDragEnd={onDragEnd}
    />
  );
};

export default DashboardTabs;
