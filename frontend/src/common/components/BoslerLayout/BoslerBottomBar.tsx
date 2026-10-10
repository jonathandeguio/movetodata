import { Tooltip } from "antd";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { ArrowDownIcon, ArrowUpIcon } from "assets/icons/mtdNavigationIcon";
import {
  closeBottomBarItem,
  openBottomBarItem,
  updateBottomBarItemContext,
} from "common/components/MtdLayout/bottomBarSlice";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { RootState } from "redux/types/store";
import { getLanguageLabel, isDefined, notEmpty } from "utils/utilities";
import Tabs from "../MtdTabs";
import { TabState } from "../MtdTabs/types";
import { IMtdBottomBarItem, IMtdBottomBarItemBody } from "./type";
import { bottomBarToggleAnimator } from "./MtdBottomBar.utils";

export const MtdBottomBarHeaderItem = ({
  id,
  label,
  icon,
  intent,
  type,
  onOpen,
  primaryPanelRef,
}: IMtdBottomBarItem & { primaryPanelRef: React.MutableRefObject<any> }) => {
  const dispatch = useDispatch();
  const { activeItem } = useSelector((state: RootState) => state.bottomBar);

  return (
    <MtdButton
      disabled={isDefined(intent) && intent === "DISABLED"}
      onClick={() => {
        if (type === "BUTTON") {
          onOpen?.();
        } else if (
          activeItem === id &&
          primaryPanelRef.current?.getSize() !== 0
        ) {
          dispatch(closeBottomBarItem());
        } else {
          dispatch(openBottomBarItem(id));
          primaryPanelRef.current?.expand();
          primaryPanelRef.current?.resize(30);
        }
      }}
      icon={icon}
      minimal
    >
      {label}
    </MtdButton>
  );
};

export const MtdBottomBarItem = (item: IMtdBottomBarItemBody) => {
  const dispatch = useDispatch();

  const [tabContext, setTabContext] = useState<TabState | undefined>();

  useEffect(() => {
    if (isDefined(tabContext)) {
      dispatch(
        updateBottomBarItemContext({ id: item.id, tabContext: tabContext })
      );
    }
  }, [tabContext]);

  return (
    <Tabs
      onMount={(state) => {
        setTabContext(state);
      }}
      headerBarExtraContent={
        <div style={{ display: "flex" }}>
          <Tooltip
            title={
              item.paneSize === 100
                ? getLanguageLabel("exitFullscreen")
                : getLanguageLabel("expand")
            }
          >
            <MtdButton
              minimal
              // outlined
              icononly
              intent="none"
              icon={
                item.paneSize === 100 ? (
                  <ArrowDownIcon size={20} />
                ) : (
                  <ArrowUpIcon size={20} />
                )
              }
              onClick={() => item.collapseToggle()}
            />
          </Tooltip>
          <Tooltip title={getLanguageLabel("close")}>
            <MtdButton
              minimal
              // outlined
              icononly
              intent="dangerous"
              icon={<CrossIcon size={20} />}
              onClick={() => {
                item.primaryPanelRef?.current?.collapse();
              }}
            />
          </Tooltip>
        </div>
      }
      items={[
        {
          paneKey: `${item.id}-defaultPane`,
          icon: item.icon,
          children: <item.body {...item.props} />,
          closable: false,
          label: item.label,
        },
        ...(item.tabs ?? []),
      ]}
    />
  );
};

export const MtdBottomBar = ({ children, destroyOnClose = true }: any) => {
  const [paneSize, setPaneSize] = useState(0);
  const { leftItems, rightItems, activeItem, bottomBarItems } = useSelector(
    (state: RootState) => state.bottomBar
  );
  const dispatch = useDispatch();

  const primaryPanelRef = useRef<any>(null);

  useEffect(() => {
    bottomBarToggleAnimator(activeItem, primaryPanelRef, bottomBarItems);
  }, [activeItem, primaryPanelRef]);

  const collapseToggle = useCallback(() => {
    if (paneSize === 100) {
      primaryPanelRef?.current?.resize(25);
    } else {
      primaryPanelRef?.current?.resize(100);
    }
  }, [primaryPanelRef, paneSize]);

  useEffect(() => {
    if (paneSize === 0) {
      dispatch(closeBottomBarItem());
    }
  }, [paneSize]);

  const openedOnce = useMemo(() => new Set(), []);

  useEffect(() => {
    if (notEmpty(activeItem)) {
      openedOnce.add(activeItem);
    }
  }, [activeItem]);

  return (
    <>
      <div style={{ height: "calc(100% - 2.5rem)", width: "100%" }}>
        <PanelGroup direction={"vertical"}>
          <Panel style={{ height: "calc(100% - 44px)" }} collapsible={true}>
            {children}
          </Panel>
          <PanelResizeHandle className="resizablePane-collapser resizablePane-collapser-vertical resizablePane-collapser-vertical-bottombar"></PanelResizeHandle>
          <Panel
            onResize={(size: number) => {
              setPaneSize(size);
            }}
            ref={primaryPanelRef}
            collapsible={true}
            defaultSize={40}
            // defaultSize={activeItem ? 40 : 0}
          >
            {[...leftItems, ...(rightItems ?? [])]
              .filter((item) => item.type === "TAB")
              .filter((item) =>
                destroyOnClose
                  ? openedOnce.has(item.id) || activeItem === item.id
                  : true
              )
              .map((item) => (
                <div
                  className={`bottomPane ${
                    activeItem === item.id ? "bottomPane--active" : ""
                  } `}
                >
                  <MtdBottomBarItem
                    key={`${item.id}-bottom-bar-item`}
                    paneSize={paneSize}
                    primaryPanelRef={primaryPanelRef}
                    collapseToggle={collapseToggle}
                    {...bottomBarItems[item.id]}
                  />
                </div>
              ))}
          </Panel>
        </PanelGroup>
      </div>
      <div className="bottombar">
        <div className="bottombar-left">
          <div className="bottombar-left-buttons">
            {(leftItems as IMtdBottomBarItem[]).map(
              (item: IMtdBottomBarItem) => (
                <MtdBottomBarHeaderItem
                  primaryPanelRef={primaryPanelRef}
                  key={`${item.id}-bottom-bar-header-item`}
                  {...item}
                />
              )
            )}
          </div>
        </div>
        {notEmpty(rightItems) && (
          <div className="bottombar-right">
            <div className="bottombar-right-buttons">
              {rightItems?.map((item: IMtdBottomBarItem) => (
                <MtdBottomBarHeaderItem
                  primaryPanelRef={primaryPanelRef}
                  key={`${item.id}-bottom-bar-header-item`}
                  {...item}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
