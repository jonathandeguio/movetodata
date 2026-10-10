import MtdTable from "Apps/Dataset/Table/MtdTable";
import { Files } from "Apps/Dataset/bottomBar/Files";
import Schema from "Apps/Dataset/bottomBar/Schema/Schema";
import { DatabaseViewIcon, TreeIcon } from "assets/icons/mtdDataIcons";
import { DocsIcon } from "assets/icons/mtdFileIcons";
import { IMtdBottomBarItem } from "common/components/MtdLayout/type";
import DatasetSync from "components/bottomBar/sync/Sync.view";
import React from "react";
import { NULL_UUID } from "utils/Common.constants";
import { getLanguageLabel, isDefined } from "utils/utilities";

export const getBezierBottomBarItems = (
  id: string,
  branch: string,
  type?: string
): IMtdBottomBarItem[] => {
  return [
    {
      id: "bezierDatasetPanel",
      icon: <DocsIcon />,
      label: getLanguageLabel("dataset"),
      body: MtdTable,
      intent: isDefined(type) && type === "dataset" ? "PRIMARY" : "DISABLED",
      type: "TAB",
      props: {
        id,
        branch,
        isTableFromBottomBar: true,
      },
    },
    {
      id: "bezierFilePanel",
      icon: <DocsIcon />,
      label: getLanguageLabel("files"),
      body: Files,
      intent: isDefined(type) && type === "dataset" ? "PRIMARY" : "DISABLED",
      type: "TAB",
      props: {
        id,
        branch,
        transactionId: NULL_UUID,
      },
    },
    {
      id: "bezierSyncPanel",
      icon: <DatabaseViewIcon />,
      label: getLanguageLabel("sync"),
      body: DatasetSync,
      intent: isDefined(type) && type === "dataset" ? "PRIMARY" : "DISABLED",
      type: "TAB",
      props: {
        datasetId: id,
        branch,
      },
    },
    {
      id: "bezierSchemaPanel",
      icon: <TreeIcon />,
      label: getLanguageLabel("schema"),
      body: Schema,
      intent: isDefined(type) && type === "dataset" ? "PRIMARY" : "DISABLED",
      type: "TAB",
      props: { id, branch, isBuildDataset: true, transactionId: NULL_UUID },
    },
  ];
};
