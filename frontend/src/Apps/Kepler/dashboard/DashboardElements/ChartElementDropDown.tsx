import { ResourceTypeEnum } from "Apps/explorer/explorer.utils";
import { Dropdown } from "antd";
import { RefreshIcon, SettingsIcon } from "assets/icons/mtdActionIcons";
import { GraphIcon } from "assets/icons/mtdChartIcons";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import { ZoomToFitIcon } from "assets/icons/mtdNavigationIcon";
import { TableIcon } from "assets/icons/mtdTableIcons";
import { MtdInfoPopover } from "components/CommonUI/MtdInfoPopover/MtdInfoPopover.view";
import React from "react";
import { Link, useParams } from "react-router-dom";
import { getLanguageLabel } from "utils/utilities";
import {
  CHART_HEADER_DATALINEAGE,
  CHART_HEADER_DELETE,
  CHART_HEADER_EDIT,
  CHART_HEADER_ENTER_FS,
  CHART_HEADER_EXIT_FS,
  CHART_HEADER_RELOAD,
} from "../Dashboard.contants";

const ChartElementDropDown = ({
  fullScreenMode,
  fullScreenModeSet,
  chartData,
  setChartData,
  reloadChart,
  setReloadChart,
  editable,
  removeElement,
  layout,
}: any) => {
  const { id, tabId } = useParams();
  return (
    <Dropdown
      menu={{
        items: [
          {
            key: 0,
            label: (
              <>
                <div className="text-and-icon-center">
                  <MtdInfoPopover
                    id={chartData?.chartState?.id}
                    type={ResourceTypeEnum.CHART}
                  />
                  Metadata
                </div>
              </>
            ),
          },
          {
            key: 1,
            label: (
              <>
                {fullScreenMode ? (
                  <>
                    <div className="text-and-icon-center">
                      <ZoomToFitIcon size={15} />
                      {CHART_HEADER_EXIT_FS}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-and-icon-center">
                      <ZoomToFitIcon size={15} />
                      {CHART_HEADER_ENTER_FS}
                    </div>
                  </>
                )}
              </>
            ),
            disabled: editable ? true : false,
            onClick: () => {
              fullScreenModeSet();
            },
          },
          {
            key: 2,
            label: (
              <Link
                target="_blank"
                to={`/portal/kepler/CHART/${chartData.chartState.id}`}
              >
                <div className="text-and-icon-center">
                  <EditIcon size={15} /> {CHART_HEADER_EDIT}
                </div>
              </Link>
            ),
          },
          {
            key: 3,
            label: (
              <Link
                // target="_blank"
                to={`/portal/kitab/dataset/${chartData.chartState.datasetId}/${chartData.chartState.branch}`}
              >
                <div className="text-and-icon-center">
                  <TableIcon size={15} /> {getLanguageLabel("dataset")}
                </div>
              </Link>
            ),
          },

          {
            key: 4,
            label: (
              <Link
                // target="_blank"
                to={`/portal/bezier/${chartData.chartState.datasetId}/${chartData.chartState.branch}`}
              >
                <div className="text-and-icon-center">
                  <GraphIcon size={15} /> {CHART_HEADER_DATALINEAGE}
                </div>
              </Link>
            ),
          },
          {
            key: 5,
            label: (
              <>
                <div className="text-and-icon-center">
                  <RefreshIcon size={15} /> {CHART_HEADER_RELOAD}
                </div>
              </>
            ),
            // disabled: editable ? false : true,
            onClick: () => {
              setChartData(undefined);
              setReloadChart(reloadChart + 1);
            },
          },
          {
            key: 6,
            label: (
              <>
                <div className="text-and-icon-center">
                  <TrashIcon color={"var(--movetodata-intent-danger)"} />
                  {CHART_HEADER_DELETE}
                </div>
              </>
            ),
            disabled: editable ? false : true,
            onClick: () => {
              // Remove Chart is in 3 steps just like add chart
              // Remove ELement, remove chart from dash, remove dash from chart
              removeElement(id, layout.i);

              // const payload = {
              //   dashboardId: id,
              //   tabId: window.location.href.slice(-36),
              //   chartIds: [chartData.chartState.id],
              //   action: "remove",
              // };
              // manageChartOnTabAPI(payload);
            },
          },
        ],
      }}
      trigger={["click"]}
      placement={"bottomRight"}
    >
      <div
        onMouseDown={(e: any) => {
          e.stopPropagation();
        }}
        onClick={(e: any) => {
          e.stopPropagation();
        }}
      >
        <SettingsIcon size={14}/>
      </div>
    </Dropdown>
  );
};

export default ChartElementDropDown;
