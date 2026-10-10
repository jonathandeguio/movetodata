import { Descriptions } from "antd";
import MtdResourceOverlay from "common/components/MtdResourceOverlay";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { TBuildLog, TBuildSpec } from "./Builds.types";

interface IProps {
  buildLog: TBuildLog;
  buildSpecs: TBuildSpec[] | undefined;
}

const items = (buildLog: TBuildLog, buildSpecs: TBuildSpec[] | undefined) => {
  return [
    {
      key: "1",
      label: getLanguageLabel("buildId"),
      children: <MtdResourceOverlay id={buildLog.id} type={"BUILD"} />,
    },
    {
      key: "2",
      label: getLanguageLabel("branch"),
      children: buildLog.branch,
    },
    {
      key: "3",
      label: getLanguageLabel("builder"),
      children: (
        <MtdResourceOverlay id={buildLog.builder} type={"RESOURCE"} />
      ),
    },
    {
      key: "4",
      label: getLanguageLabel("trigger"),
      children: buildLog.trigger,
    },
    {
      key: "5",
      label: "Started By",
      children: <MtdResourceOverlay id={buildLog.startedBy} type={"USER"} />,
    },
    {
      key: "5",
      label: getLanguageLabel("scriptPath"),
      children: buildLog.scriptPath ? buildLog.scriptPath : "-",
    },
    {
      key: "6",
      label: getLanguageLabel("transactions"),
      children: buildSpecs ? buildSpecs.length : 1,
    },
  ];
};

const BuildDetailsSummary = ({ buildLog, buildSpecs }: IProps) => {
  return (
    <div className="--pt5 -- pb5 --pl20 --pr20">
      <Descriptions items={items(buildLog, buildSpecs)} />
    </div>
  );
};

export default BuildDetailsSummary;
