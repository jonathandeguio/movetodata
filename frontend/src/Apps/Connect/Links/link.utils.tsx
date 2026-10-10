import { ComponentIcon } from "assets/icons/mtdInterfaceIcons";
import { TableIcon } from "assets/icons/mtdTableIcons";
import { IMtdBottomBarItem } from "common/components/MtdLayout/type";
import BuildDetailsTable from "components/Builds/BuildDetailsTable.view";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import PipelineTable from "./bottomBar/PipelineTable";
import PreviewLink from "./bottomBar/PreviewLink";

export const getLinkBottombarItems = (
  datasetId: string,
  linkId: string,
  branch: string,
  dataLiveLoad: boolean,
  buildID: string | undefined,
  source: any,
  code: any
): IMtdBottomBarItem[] => {
  return [
    {
      id: "datasetBuildLogPanel",
      icon: <ComponentIcon />,
      label: getLanguageLabel("buildLog"),
      body: BuildDetailsTable,
      type: "TAB",
      props: {
        id: buildID,
        showHeader: false,
        page: "LINK",
        showEmpty: true,
        data: [],
      },
    },
    ...(!dataLiveLoad
      ? [
          {
            id: "linkDatasetPanel",
            icon: <TableIcon color={"#4C90F0"} />,
            label: getLanguageLabel("dataset"),
            body: PipelineTable,
            type: "TAB",
            props: {
              id: datasetId,
              branch,
            },
          },
        ]
      : []),
    ...(source.directLoad
      ? [
          {
            id: "datasetPreviewPanel",
            icon: <ComponentIcon />,
            label: getLanguageLabel("preview"),
            body: PreviewLink,
            type: "TAB",
            props: {
              id: linkId,
              showHeader: false,
              code,
            },
          },
        ]
      : ([] as any)),
  ];
};
