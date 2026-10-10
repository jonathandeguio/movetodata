import { Card } from "antd";
import { DragHandleVerticalIcon } from "assets/icons/mtdActionIcons";
import { TextIcon } from "assets/icons/mtdEditorIcons";
import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import React, { useState } from "react";
import { getLanguageLabel } from "utils/utilities";
import DashboardGridConfig from "../DashboardGridConfig";
import {
  ELEMENTS_TAB_TEXT
} from "./DashboardAddChart.constants";

interface IProps {
  dashboardId: string;
  tabId: string;
}
const DashboardAddChartMenuElementsTab = ({ dashboardId, tabId }: IProps) => {
  const [selectedTab, setSelectedTab] = useState<"elements" | "customize">(
    "elements"
  );
  return (
    <div className="kepler-container-plane-layout">
      <MtdSwitch
        style={{
          flex: "1 1 auto",
        }}
        items={[
          {
            label: getLanguageLabel("item"),
            value: "elements",
            children: (
              <Card>
                <div
                  className="kepler-container-plane-layout-container droppable-element"
                  id="layoutElement-editor"
                  draggable={true}
                  unselectable="on"
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", "layoutElement-editor")
                  }
                >
                  <div className="kepler-container-plane-layout-container-left">
                    <DragHandleVerticalIcon />
                    <TextIcon />
                  </div>
                  <div className="kepler-container-plane-layout-container-right">
                    {ELEMENTS_TAB_TEXT}
                  </div>
                </div>
                {/* <div
            className="kepler-container-plane-layout-container droppable-element"
            id="layoutElement-text"
            draggable={true}
            unselectable="on"
            onDragStart={(e) =>
              e.dataTransfer.setData("text/plain", "layoutElement-text")
            }
          >
            <div className="kepler-container-plane-layout-container-left">
              <DragHandleVerticalIcon />
              <TextIcon />
            </div>
            <div className="kepler-container-plane-layout-container-right">
              Text2
            </div>
          </div> */}
                {/* <div
            className="kepler-container-plane-layout-container droppable-element"
            id="layoutElement-header"
            draggable={true}
            unselectable="on"
            onDragStart={(e) =>
              e.dataTransfer.setData("text/plain", "layoutElement-header")
            }
          >
            <div className="kepler-container-plane-layout-container-left">
              <DragHandleVerticalIcon />
              <TextIcon />
            </div>
            <div className="kepler-container-plane-layout-container-right">
              {ELEMENTS_TAB_HEADER}
            </div>
          </div> */}
                {/* <div
                  className="kepler-container-plane-layout-container droppable-element"
                  id="layoutElement-divider"
                  draggable={true}
                  unselectable="on"
                  onDragStart={(e) =>
                    e.dataTransfer.setData(
                      "text/plain",
                      "layoutElement-divider"
                    )
                  }
                >
                  <div className="kepler-container-plane-layout-container-left">
                    <DragHandleVerticalIcon />
                    <ArrowRightIcon />
                  </div>
                  <div className="kepler-container-plane-layout-container-right">
                    {ELEMENTS_TAB_DIVIDER}
                  </div>
                </div> */}
                {/* <div
            className="kepler-container-plane-layout-container droppable-element"
            id="layoutElement-markdown"
            draggable={true}
            unselectable="on"
            onDragStart={(e) =>
              e.dataTransfer.setData("text/plain", "layoutElement-markdown")
            }
          >
            <div className="kepler-container-plane-layout-container-left">
              <DragHandleVerticalIcon />
              <MarkdownIcon />
            </div>
            <div className="kepler-container-plane-layout-container-right">
              {ELEMENTS_TAB_MARKDOWN}
            </div>
          </div> */}
              </Card>
            ),
          },
          {
            label: getLanguageLabel("customize"),
            value: "customize",
            children: (
              <DashboardGridConfig tabId={tabId} dashboardId={dashboardId} />
            ),
          },
        ]}
        value={selectedTab}
        onChange={(newVal: "elements" | "customize") => {
          setSelectedTab(newVal);
        }}
        divider
      />
    </div>
  );
};

export default DashboardAddChartMenuElementsTab;
