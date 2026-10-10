import { Tooltip, Typography } from "antd";
import { CopyIcon } from "assets/icons/mtdEditorIcons";
import UserInfo from "common/components/UserInfo";
import React, { useState } from "react";
import {
  copyToClipboard,
  getLanguageLabel,
  getTimeDisplay,
} from "utils/utilities";
import { TBuildLog, TBuildSpec } from "./Builds.types";
const { Text } = Typography;
interface TProps {
  datasetBuildLog: TBuildLog;
  buildSpec: TBuildSpec;
}
const BuildSpecTab = ({ datasetBuildLog, buildSpec }: TProps) => {
  const [tooltipTitle, setTooltipTitle] = useState(
    getLanguageLabel("clickToCopyIntoClipboard")
  );
  return (
    <div
      className="--p20"
      style={{
        overflow: "auto",
      }}
    >
      <table
        style={{
          textAlign: "left",
          fontSize: "15px",
          width: "100%",
        }}
      >
        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("buildId")}
            </Text>
          </th>
          <td>
            <div
              onClick={() => {
                copyToClipboard(datasetBuildLog.id);
              }}
              style={{ cursor: "pointer" }}
            >
              <Tooltip title={tooltipTitle}>
                <Text>
                  <CopyIcon />
                  &nbsp;{datasetBuildLog.id}
                </Text>
              </Tooltip>
            </div>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("status")}
            </Text>
          </th>
          <td>
            <Text>{datasetBuildLog.status}</Text>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("datasetId")}
            </Text>
          </th>
          <td>
            <div
              onClick={() => {
                copyToClipboard(buildSpec.datasetId, setTooltipTitle);
              }}
              style={{ cursor: "pointer" }}
            >
              <Tooltip title={tooltipTitle}>
                <Text>
                  <CopyIcon />
                  &nbsp;{buildSpec.datasetId}
                </Text>
              </Tooltip>
            </div>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("id")}
            </Text>
          </th>
          <td>
            <div
              onClick={() => {
                copyToClipboard(buildSpec.commitId, setTooltipTitle);
              }}
              style={{ cursor: "pointer" }}
            >
              <Tooltip title={tooltipTitle}>
                <Text>
                  <CopyIcon />
                  &nbsp;
                  {buildSpec.commitId}
                </Text>
              </Tooltip>
            </div>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("builder")}
            </Text>
          </th>
          <td>
            <div
              onClick={() => {
                copyToClipboard(datasetBuildLog.builder, setTooltipTitle);
              }}
              style={{ cursor: "pointer" }}
            >
              <Tooltip title={tooltipTitle}>
                <Text>
                  <CopyIcon />
                  &nbsp;
                  {datasetBuildLog.builder}
                </Text>
              </Tooltip>
            </div>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("branch")}
            </Text>
          </th>
          <td>
            <Text>{buildSpec.branch}</Text>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("language")}
            </Text>
          </th>
          <td>
            <Text>{buildSpec.language}</Text>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("scriptPath")}
            </Text>
          </th>
          <td>
            <Text>{buildSpec.scriptPath}</Text>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("createdBy")}
            </Text>
          </th>
          <td>
            <Text>
              <UserInfo userId={buildSpec.createdBy} />
            </Text>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("createdAt")}
            </Text>
          </th>
          <td>
            <Text>{getTimeDisplay(buildSpec.createdAt)}</Text>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("updatedBy")}
            </Text>
          </th>
          <td>
            <Text>
              <UserInfo userId={buildSpec.updatedBy} />
            </Text>
          </td>
        </tr>

        <tr>
          <th>
            <Text style={{ color: "var(--color)" }}>
              {getLanguageLabel("updatedAt")}
            </Text>
          </th>
          <td>
            <Text>
              {buildSpec.updatedAt ? getTimeDisplay(buildSpec.updatedAt) : "--"}
            </Text>
          </td>
        </tr>
      </table>
    </div>
  );
};

export default BuildSpecTab;
