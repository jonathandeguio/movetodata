import { Collapse, CollapseProps } from "antd";
import { WarningState } from "assets/Illustrations/EmptyState";
import { CopyIcon } from "assets/icons/mtdEditorIcons";
import {
  SingleChevronDownIcon,
  SingleChevronRightIcon,
} from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import NoData from "components/CommonUI/NoData";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import {
  capitalizeFirstLetter,
  copyToClipboard,
  getLanguageLabel,
  isDefined,
  isEmpty,
} from "utils/utilities";
import { fetchDetailedLogs } from "./Builds.api";
import { FAILED, SQL } from "./Builds.constants";
import "./builds.scss";
interface IProps {
  id: string;
  buildType: string;
  buildStatus: string;
  language: string | undefined;
}

function filterLogData(logData: string) {
  const lines = logData.split("\n");

  const keywords = [
    "PREPARING",
    "INFO",
    "WARN",
    "FINISHED",
    "Cloning into",
    "Already on",
    "Exiting",
    "HEAD is now at",
    "Pod Finished",
    "Files  local://",
    "at org.apache.spark",
    "at io.movetodata",
    "at io.movetodata",
    "at java.base",
    "ERROR Running",
    "Requirement already",
    "---------------------------Starting to Install Requirements---------------------------",
    "---------------------------Finished Installing Requirements---------------------------",
  ];

  const filteredLines = lines.filter((line) => {
    return !keywords.some((keyword) => line.includes(keyword));
  });

  return filteredLines.join("\n");
}

const DetailedLog = ({ id, buildType, buildStatus, language }: IProps) => {
  const [detailedLogs, setDetailedLogs] = useState();
  const [filteredLogs, setFilteredLogs] = useState<string>();
  const [detailedLogsLoading, setDetailedLogsLoading] = useState(true);
  const { config } = useSelector((state: RootState) => state.sparkConfig);

  console.log(config.sqlBuild, language);

  const getDetailedLogs = (buildId: string) => {
    setDetailedLogsLoading(true);
    fetchDetailedLogs(buildId)
      .then(({ data }) => {
        setFilteredLogs(filterLogData(data));
        setDetailedLogs(data);
      })
      .finally(() => {
        setDetailedLogsLoading(false);
      });
  };

  const items: CollapseProps["items"] = [
    {
      key: "1",
      label: capitalizeFirstLetter(getLanguageLabel("details")),
      children: <p>{detailedLogs}</p>,
    },
  ];

  useEffect(() => {
    getDetailedLogs(id);
  }, []);

  if (detailedLogsLoading) {
    return <MtdLoader content={getLanguageLabel("loading...")} />;
  }
  if (config.sqlPreview == "local" && language && language == SQL) {
    return (
      <NoData
        icon={<WarningState />}
        heading={"No Logs for Local Sql Build"}
        subHeading="Please shift to K8 from spark config"
      />
    );
  }
  if (!isDefined(detailedLogs) || isEmpty(detailedLogs)) {
    return (
      <NoData
        icon={<WarningState />}
        heading={"No logs"}
        subHeading="Failed to get logs for the build. Please try again!"
      />
    );
  }

  return (
    <div
      style={{
        whiteSpace: "pre-wrap",
        width: "100%",
        fontFamily:
          "Space Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace",
        padding: "1rem",
        overflow: "scroll",
        height: "100%",
      }}
    >
      {buildType == "PREVIEW" &&
      filteredLogs?.length != 0 &&
      buildStatus == FAILED ? (
        <>
          <MtdButton
            icon={<CopyIcon />}
            onClick={() => filteredLogs && copyToClipboard(filteredLogs)}
            minimal
            icononly
          ></MtdButton>
          <div
            style={{
              border: "1px solid var(--movetodata-intent-danger)",
              padding: "6px",
            }}
          >
            {filteredLogs}
          </div>
          <br />
          <Collapse
            ghost
            accordion
            items={items}
            className="customizer-collapse"
            expandIcon={({ isActive }) =>
              isActive ? <SingleChevronDownIcon /> : <SingleChevronRightIcon />
            }
          />
        </>
      ) : (
        detailedLogs
      )}
    </div>
  );
};

export default DetailedLog;
