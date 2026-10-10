import MtdLoader from "components/mtdLoader";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  generateUUID,
  getLanguageLabel,
  getSocketClient,
  openNotification,
} from "utils/utilities";

import NoData from "components/CommonUI/NoData";
import useEffectOnlyOnDependencyUpdate from "hooks/useEffectOnlyOnDependencyUpdate";
import {
  EmptyChartIcon,
  TrashIcon,
} from "../../../assets/icons/mtdMiscellaneousIcons";
import {
  isChartAdded,
  isDashboardChanged,
  revertSaveDashboardStatus,
} from "../../../redux/actions/dashboardActions";
import { RootState, ThunkAppDispatch } from "../../../redux/types/store";
import { ChartReload } from "../chart/charts.utils";
import { TooltipInfo } from "../kepler";
import { getTabElementsAPI, updateTabElementAPI } from "./Dashboard.api";
import { GRID_CONFIG } from "./Dashboard.contants";
import { getDefaultMeasurementsOfElements } from "./Dashboard.utils";
import { CustomGridItemComponent } from "./DashboardElements/CustomGridItemComponent";
import DividerElement from "./DashboardElements/DividerElement";
import EditorElement from "./DashboardElements/EditorElement";
import FileElement from "./DashboardElements/FileElement";
import HeaderElement from "./DashboardElements/HeaderElement";
import MarkdownElement from "./DashboardElements/MarkdownElement";
import TextElement from "./DashboardElements/TextElement";

const { Responsive, WidthProvider } = require("react-grid-layout");

const { v4: uuidv4 } = require("uuid");
const ResponsiveGridLayout = WidthProvider(Responsive);

interface IProps {
  editable: boolean;
  tabId: string;
  dashboardId: string;
  gridRef: any;
}

const DashboardGrid = ({ editable, tabId, dashboardId, gridRef }: IProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const fullScreenRef = useRef(null);
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | undefined>(
    undefined
  );

  const [originalLayout, setOriginalLayout] = useState<any>();
  const [tabElementsMap, setTabElementsMap] = useState<any>();

  const [chartReload, setChartReload] = useState<ChartReload>({
    chartId: "",
    reloadId: uuidv4(),
  });

  const { subscribeMenu, gridConfig, filterMenu, triggerSave } = useSelector(
    (state: RootState) => state.dashboardEdit
  );

  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[dashboardId]
  );

  function handleUpdateTabElement(
    elementId: string,
    elementType: string,
    data: string
  ) {
    tabElementsMap[elementId] = { ...tabElementsMap[elementId], data: data };
    setTabElementsMap(tabElementsMap);
  }

  function removeElement(dashboardId: string, elementId: string) {
    const newLayout = originalLayout.filter(
      (item: any) => item.i !== elementId
    );
    setOriginalLayout(newLayout);
  }

  function handleLayoutChange(layout: any, layouts: any) {
    const updatedLayout = layout.map((newItem: any) => {
      let updatedItem = newItem;
      originalLayout.map((item: any) => {
        if (item.i === newItem.i) {
          updatedItem = {
            ...item,
            h: newItem.h,
            w: newItem.w,
            x: newItem.x,
            y: newItem.y,
          };
        }
      });
      return updatedItem;
    });

    setOriginalLayout(updatedLayout);
  }

  function onDrop(layout: any, layoutItem: any, _event: any) {
    const layoutElement = _event.dataTransfer.getData("text/plain");
    const chartId = _event.dataTransfer.getData("chart");
    const file = _event.dataTransfer.getData("file");
    const layoutElementType = layoutElement.substr(
      layoutElement.indexOf("-") + 1
    );

    if (
      !(
        layoutElementType == "chart" ||
        layoutElementType == "editor" ||
        layoutElementType == "divider" ||
        layoutElementType == "file"
      )
    ) {
      return;
    }

    // Condition Check: If a chart is already added to tab
    let _isChartAlreadyAddedFlag = false;
    Object.values(tabElementsMap).forEach((value: any) => {
      if (value.data == chartId) {
        openNotification("Chart already added", "", "error");
        _isChartAlreadyAddedFlag = true;
        return;
      }
    });

    if (_isChartAlreadyAddedFlag) return;

    const measurements = getDefaultMeasurementsOfElements(layoutElementType);
    const height: number = measurements.height;
    const width: number = measurements.width;
    const minHeight: number = measurements.minHeight;
    const maxHeight: number = measurements.maxHeight;
    const minWidth: number = measurements.minWidth;
    const maxWidth: number = measurements.maxWidth;

    const elementData = () => {
      if (layoutElementType == "header") {
        return JSON.stringify(
          JSON.stringify({
            heading: "",
            fontSize: "1",
            backgroundColor: "1",
          })
        );
      } else if (layoutElementType == "divider") {
        return "#e7e7e7";
      } else if (layoutElementType == "file") {
        return file;
      } else {
        return chartId;
      }
    };
    // // In other cases no mapping is required
    // // Element creation is required for all cases
    const elementId = generateUUID();
    const elementPayload = {
      id: elementId,
      dashboardId: dashboardId,
      tabId: tabId,
      type: layoutElementType,
      position: JSON.stringify(
        JSON.stringify({
          x: layoutItem.x,
          y: layoutItem.y,
          h: height,
          w: width,
          minH: minHeight,
          minW: minWidth,
          maxH: maxHeight,
          maxW: maxWidth,
          type: layoutElementType,
        })
      ),
      data: elementData(),
      createElement: true,
    };

    const newLayout = [
      ...originalLayout,
      {
        x: layoutItem.x,
        y: layoutItem.y,
        h: height,
        w: width,
        minH: minHeight,
        minW: minWidth,
        maxH: maxHeight,
        maxW: maxWidth,
        type: layoutElementType,
        i: elementId,
        data: elementData(),
      },
    ];

    tabElementsMap[elementId] = elementPayload;
    setTabElementsMap(tabElementsMap);
    setOriginalLayout(newLayout);

    // To update the columns in filter strip for new chart dataset
    if (layoutElementType == "chart") {
      dispatch(isChartAdded(elementData()));
    }
  }

  function generateDom() {
    const layout = originalLayout;
    return layout.map((l: any) => {
      const typeElement = l.type;

      if (typeElement === "header") {
        return (
          <CustomGridItemComponent
            key={l.i}
            data-grid={l}
            style={{
              zIndex: l.zIndex,
            }}
            dashboardId={dashboardId}
            tabId={tabId}
          >
            <HeaderElement
              layout={l}
              element={tabElementsMap[l.i]}
              editable={editable}
              removeElement={removeElement}
              dashboardId={dashboardId}
              tabId={tabId}
            />
          </CustomGridItemComponent>
        );
      } else if (typeElement === "editor") {
        return (
          <CustomGridItemComponent
            key={l.i}
            data-grid={l}
            style={{
              zIndex: l.zIndex,
            }}
            dashboardId={dashboardId}
            tabId={tabId}
          >
            <EditorElement
              layout={l}
              element={tabElementsMap[l.i]}
              editable={editable}
              removeElement={removeElement}
              dashboardId={dashboardId}
              tabId={tabId}
              updateTabElement={handleUpdateTabElement}
            />
          </CustomGridItemComponent>
        );
      } else if (typeElement === "text") {
        return (
          <CustomGridItemComponent
            key={l.i}
            data-grid={l}
            style={{
              zIndex: l.zIndex,
            }}
            dashboardId={dashboardId}
            tabId={tabId}
          >
            <TextElement
              layout={l}
              element={tabElementsMap[l.i]}
              editable={editable}
              removeElement={removeElement}
              dashboardId={dashboardId}
              tabId={tabId}
            />
          </CustomGridItemComponent>
        );
      } else if (typeElement === "divider") {
        // Divider shouldnt be resizing even in editable mode
        // l.isResizable = false;
        return (
          <CustomGridItemComponent
            key={l.i}
            data-grid={l}
            style={{
              zIndex: l.zIndex,
            }}
            dashboardId={dashboardId}
            tabId={tabId}
          >
            <DividerElement
              layout={l}
              element={tabElementsMap[l.i]}
              dashboardId={dashboardId}
              tabId={tabId}
              editable={editable}
              removeElement={removeElement}
              updateTabElement={handleUpdateTabElement}
            />
          </CustomGridItemComponent>
        );
      } else if (typeElement === "file") {
        return (
          <CustomGridItemComponent
            key={l.i}
            data-grid={l}
            style={{
              zIndex: l.zIndex,
            }}
            dashboardId={dashboardId}
            tabId={tabId}
          >
            <FileElement
              layout={l}
              element={tabElementsMap[l.i]}
              dashboardId={dashboardId}
              tabId={tabId}
              editable={editable}
              removeElement={removeElement}
            />
          </CustomGridItemComponent>
        );
      } else if (typeElement === "markdown") {
        return (
          <CustomGridItemComponent
            key={l.i}
            data-grid={l}
            style={{
              zIndex: l.zIndex,
            }}
            dashboardId={dashboardId}
            tabId={tabId}
          >
            <MarkdownElement
              layout={l}
              element={tabElementsMap[l.i]}
              editable={editable}
              removeElement={removeElement}
              tabId={tabId}
              dashboardId={dashboardId}
            />
          </CustomGridItemComponent>
        );
      } else if (typeElement === "chart") {
        if (!tabElementsMap.hasOwnProperty(l.i)) {
          return;
        }
        if (tabElementsMap[l.i].data == "") {
          return (
            <div key={l.i} data-grid={l}>
              <span className="text">{l.i}</span>
              <div className="type">{"Type:" + typeElement}</div>
            </div>
          );
        }

        return (
          <CustomGridItemComponent
            key={l.i}
            data-grid={l}
            style={{
              borderRadius: "2px",
              height: "none",
              background: "var(--background-color)",
              border: !editable
                ? "0.25px solid var(--movetodata-border-color-default)"
                : "",
              zIndex: l.zIndex,
            }}
            chartId={tabElementsMap[l.i].data}
            datasetId={tabElementsMap[l.i].datasetId}
            fetchCachedData={true}
            editable={editable}
            layout={l}
            removeElement={removeElement}
            elementType="chart"
            element={tabElementsMap[l.i]}
            ref={fullScreenRef}
            setTooltipInfo={setTooltipInfo}
            tooltipInfo={tooltipInfo}
            dashboardId={dashboardId}
            tabId={tabId}
            chartReload={chartReload}
          />
        );
      } else {
        return (
          <div
            key={l.i}
            data-grid={l}
            className={
              editable ? "editableElementBorder" : "nonEditableElementBorder"
            }
          >
            <span className="text">{l.i}</span>
            <div className="type">{"Type:" + typeElement}</div>
            <div
              className="editableElementBorder-delete"
              onClick={() => removeElement(l.i, dashboardId)}
            >
              <TrashIcon />
            </div>
          </div>
        );
      }
    });
  }

  const getTabElements = async () => {
    getTabElementsAPI(dashboardId, tabId).then(
      (tabElements: any) => {
        const layout: any[] = [];
        const tabElementsMap: any = {};
        tabElements.map((element: any) => {
          const currentLayout = JSON.parse(JSON.parse(element.position));
          currentLayout.i = element.id;
          currentLayout.type = element.type;
          layout.push(currentLayout);
          tabElementsMap[element.id] = element;
        });
        setTabElementsMap(tabElementsMap);
        setOriginalLayout(layout);
      },
      (error) => {}
    );
  };

  const handleSaveDashboard = () => {
    const tabElementsPayload: any[] = [];
    originalLayout.map((layoutEle: any) => {
      tabElementsPayload.push({
        dashboardId: dashboardId,
        tabId: tabId,
        elementId: layoutEle.i,
        position: JSON.stringify(
          JSON.stringify({
            x: layoutEle.x,
            y: layoutEle.y,
            h: layoutEle.h,
            w: layoutEle.w,
            minH: layoutEle.minH,
            minW: layoutEle.minW,
            maxH: layoutEle.maxW,
            maxW: layoutEle.maxW,
            type: tabElementsMap[layoutEle.i].type,
          })
        ),
        type: tabElementsMap[layoutEle.i].type,
        data: tabElementsMap[layoutEle.i].data,
        createElement: tabElementsMap[layoutEle.i].createElement,
      });
    });

    updateTabElementAPI(dashboardId, tabId, tabElementsPayload)
      .then(() => {
        Object.values(tabElementsMap).forEach((value: any) => {
          if (value.createElement) {
            tabElementsMap[value.id].createElement = false;
          }
        });
        dispatch(revertSaveDashboardStatus(true));
      })
      .catch(() => {
        dispatch(revertSaveDashboardStatus(false));
      });
  };

  useEffect(() => {
    getTabElements();
  }, [editable]);

  /*
  https://stackoverflow.com/questions/65547160/how-can-re-render-react-grid-layout-columns-width-on-parents-resizing
  https://github.com/react-grid-layout/react-grid-layout/issues/1369
  */

  useEffect(() => {
    // when isCollapsed changes, we need to dispatch a resize event to the window to force the grid to re-render
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 200);
  }, [filterMenu, subscribeMenu, editable, resourcePermission]);

  useEffectOnlyOnDependencyUpdate(() => {
    handleSaveDashboard();
  }, [triggerSave]);

  useEffect(() => {
    const client = getSocketClient();
    client.activate();
    client.onConnect = (frame) => {
      client.subscribe(
        `/topic/dashboard/${dashboardId}/${tabId}`,
        function (mail) {
          setChartReload({
            reloadId: uuidv4(),
            chartId: JSON.parse(mail.body).message,
          });
        }
      );
    };

    return () => {
      client.deactivate();
    };
  }, [tabId]);

  if (originalLayout === undefined) {
    return <MtdLoader />;
  }

  if (!editable && originalLayout.length == 0)
    return (
      <div
        style={{
          height: "calc(100% - 36px - 3rem)",
          width: "100%",
        }}
      >
        <NoData
          icon={<EmptyChartIcon size={160} />}
          heading={getLanguageLabel("noComponentPresentAddViaEditButton")}
        />
      </div>
    );

  return (
    <div
      style={{
        // 36px reduction is for filters
        height: "calc(100% - 36px - 3rem)",
        width: "100%",
        // Pick config, else pick system default
        background: gridConfig.pageBg
          ? gridConfig.pageBg
          : "var(--movetodata-bkg-color-muted)",
        padding: `${gridConfig.topPadding}px ${gridConfig.rightPadding}px ${gridConfig.bottomPadding}px ${gridConfig.leftPadding}px`,
      }}
      ref={gridRef}
      // className={isLoading ? "dashboardShimmer" : ""}
    >
      <ResponsiveGridLayout
        {...GRID_CONFIG}
        layout={originalLayout}
        isDraggable={editable ? true : false}
        isResizable={editable ? true : false}
        isDroppable={editable ? true : false}
        onLayoutChange={() => {
          dispatch(isDashboardChanged(true));
        }}
        onDrop={onDrop}
        onDragStop={(newLayout: any, previousItem: any, newItem: any) => {
          handleLayoutChange(newLayout, null);
        }}
        onResizeStop={(newLayout: any, oldItem: any, newItem: any) => {
          handleLayoutChange(newLayout, null);
        }}
        style={
          editable
            ? {
                // border: "1px dashed var(--PRIMARY_COLOR)",
                minHeight: "calc(100% - 1rem - 3rem)",
                background: gridConfig.canvasBg
                  ? gridConfig.canvasBg
                  : "var(--movetodata-bkg-color-muted)",
              }
            : {
                background: gridConfig.canvasBg
                  ? gridConfig.canvasBg
                  : "var(--movetodata-bkg-color-muted)",
              }
        }
        draggableCancel=".cancelSelectorName"
        preventCollision={false}
      >
        {generateDom()}
      </ResponsiveGridLayout>
      {originalLayout.length == 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            color: "#80808045",
            fontSize: "2rem",
            fontKerning: "normal",
            fontWeight: "600",
          }}
        >
          {getLanguageLabel("dropComponentsInTheBox")}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default React.memo(DashboardGrid);
