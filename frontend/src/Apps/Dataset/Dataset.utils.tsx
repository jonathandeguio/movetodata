import { Tag } from "antd";
import { DatabaseViewIcon, TreeIcon } from "assets/icons/mtdDataIcons";
import { CodeCellIcon } from "assets/icons/mtdEditorIcons";
import { DocsIcon } from "assets/icons/mtdFileIcons";
import { CalendarIcon, ComponentIcon } from "assets/icons/mtdInterfaceIcons";
import { PulseIcon } from "assets/icons/mtdMiscellaneousIcons";
import { IMtdBottomBarItem } from "common/components/MtdLayout/type";
import BuildDetailsTable from "components/Builds/BuildDetailsTable.view";
import { TBuildTrigger } from "components/Builds/Builds.types";
import { ReadOnlyCodePanel } from "components/bottomBar/ReadOnlyCodePanel/ReadOnlyCodePanel.view";
import DatasetSync from "components/bottomBar/sync/Sync.view";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import DataHealthMonitoring from "./DataHealth/DataHealthMonitoring";
import { Files } from "./bottomBar/Files";
import SchedulesDataset from "./bottomBar/SchedulesDataset";
import Schema from "./bottomBar/Schema/Schema";

export const getDatasetBottombarItems = (
  id: string,
  branch: string,
  transactionId: string,
  isBuildDataset: boolean,
  buildId: string,
  buildTrigger: TBuildTrigger
): IMtdBottomBarItem[] => {
  return [
    ...(buildId
      ? [
          {
            id: "datasetBuildLogPanel",
            icon: <ComponentIcon />,
            label: getLanguageLabel("buildLog"),
            body: BuildDetailsTable,
            type: "TAB",
            props: {
              id: buildId,
              showHeader: true,
              page: "DATASET",
            },
          },
          ...(isBuildDataset
            ? [
                {
                  id: "datasetScheduleanel",
                  icon: <CalendarIcon />,
                  label: getLanguageLabel("schedules"),
                  body: SchedulesDataset,
                  type: "TAB",
                  props: {
                    id,
                    branch,
                    transactionId,
                  },
                },
              ]
            : []),

          ...(buildTrigger == "PYTHON" || buildTrigger == "SQL"
            ? [
                {
                  id: "datasetCodePanel",
                  icon: <CodeCellIcon />,
                  label: getLanguageLabel("code"),
                  body: ReadOnlyCodePanel,

                  type: "TAB",
                  props: {
                    id: id,
                    branch: branch,
                    transactionId: transactionId,
                  },
                },
              ]
            : []),
        ]
      : ([] as any)),

    {
      id: "datasetFilePanel",
      icon: <DocsIcon />,
      label: getLanguageLabel("files"),
      body: Files,
      type: "TAB",
      props: {
        id,
        branch,
        transactionId,
      },
    },
    {
      id: "datasetSyncPanel",
      icon: <DatabaseViewIcon />,
      label: getLanguageLabel("sync"),
      body: DatasetSync,
      type: "TAB",
      props: {
        datasetId: id,
        branch,
      },
    },
    {
      id: "datasetSchemaPanel",
      icon: <TreeIcon />,
      label: getLanguageLabel("schema"),
      body: Schema,
      type: "TAB",
      props: { id, branch },
    },
    {
      id: "dataHealthPanel",
      icon: <PulseIcon />,
      label: (
        <>
          Data Health &nbsp;<Tag color="blue">Beta</Tag>
        </>
      ),
      body: DataHealthMonitoring,
      type: "TAB",
      // props: { id, branch, isBuildDataset },
    },
  ];
};
