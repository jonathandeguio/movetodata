import React, { useEffect, useState } from "react";

import { Skeleton, Tooltip } from "antd";

import { CommentState } from "assets/Illustrations/EmptyState";
import NoData from "components/CommonUI/NoData";
import { Link } from "react-router-dom";
import { getLanguageLabel, timeConverter } from "utils/utilities";
import { ProjectIcon } from "../../../assets/icons/mtdDataIcons";
import { GitNewBranchIcon } from "../../../assets/icons/mtdExternalIcons";
import { FolderIcon } from "../../../assets/icons/mtdFileIcons";
import { AppIcon, CalendarIcon } from "../../../assets/icons/mtdInterfaceIcons";
import { TableCellIcon } from "../../../assets/icons/mtdTableIcons";
import { getChartPopOverInfoAPI } from "./Dashboard.api";
import { getChartIcon } from "./DashboardAddChartMenu/DashboardAddChart.utils";

interface Props {
  chartId: string;
  chartType: string;
  series: any;
}

interface popOverType {
  name: string;
  branch: string;
  path: string;
  projectName: string;
  description: string;
  datasetId: number;
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
  error?: string;
}

const DashboardPopover: React.FC<Props> = (props) => {
  const [popOverData, setPopOverData] = useState<popOverType>();
  const [loading, setLoading] = useState<boolean>(true);

  const getPopOverData = async () => {
    setLoading(true);
    getChartPopOverInfoAPI(props.chartId)
      .then((chartData) => {
        setPopOverData(chartData);
      })
      .catch((error) => {})
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getPopOverData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          width: "30vw",
        }}
      >
        <Skeleton />
      </div>
    );
  }

  if (!popOverData) {
    return (
      <div
        style={{
          width: "30vw",
        }}
      >
        <NoData
          heading={getLanguageLabel("noDataFound")}
          icon={<CommentState />}
        />
      </div>
    );
  }

  return (
    <div className="info-container">
      <div className="info-container-header">
        <div className="info-container-header-row">
          <div className="text-and-icon-center">
            {getChartIcon(props.chartType, props.series)}
            &nbsp; {popOverData.name}
          </div>
        </div>
        <div className="info-container-header-row">
          <GitNewBranchIcon />
          &nbsp; {popOverData.branch}
        </div>
      </div>
      {popOverData.description != "" && (
        <div className="info-container-header-row">
          <AppIcon /> &nbsp; {popOverData.description}
        </div>
      )}
      <div className="info-container-header-row">
        <Tooltip title={getLanguageLabel("dataset")}>
          <Link
            to={`/portal/kitab/dataset/${popOverData.datasetId}/${popOverData.branch}`}
          >
            <TableCellIcon /> &nbsp; {popOverData.datasetId}
          </Link>
        </Tooltip>
      </div>
      <div className="info-container-header-row">
        <Tooltip title="The Project to which this chart is belong.">
          <ProjectIcon /> &nbsp; {popOverData.projectName}
        </Tooltip>
      </div>

      <div className="info-container-header-row">
        <Tooltip title="The Folder to which this chart is resides in.">
          <FolderIcon />
          &nbsp; {popOverData.path}
        </Tooltip>
      </div>
      {/* <div className="info-container-header-row">
        <CalendarIcon />
        &nbsp; {getLanguageLabel("createdAt")} &nbsp;
        {getTimeDisplay(popOverData.createdAt)} by {popOverData.createdBy}  
      </div> */}
      {popOverData.updatedAt && popOverData.updatedAt != null && (
        <div className="info-container-header-row">
          <CalendarIcon /> &nbsp;{getLanguageLabel("updatedAt")} &nbsp;
          {popOverData.updatedAt
            ? <Tooltip title={timeConverter(popOverData.updatedAt)}>getTimeDisplay(popOverData.updatedAt)</Tooltip>
            : "--" + " by " + popOverData.updatedBy}
        </div>
      )}
    </div>
  );
};

export default DashboardPopover;
