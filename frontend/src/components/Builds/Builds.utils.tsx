import { SyncIcon } from "assets/icons/mtdActionIcons";
import { ComponentIcon } from "assets/icons/mtdInterfaceIcons";
import { QuickStartIcon } from "assets/icons/mtdMiscellaneousIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import { RunCellSelectIcon } from "assets/icons/mtdTableIcons";
import React from "react";
import { formatDuration, getLanguageLabel } from "utils/utilities";
import {
  ABORTED,
  ACTIVE,
  CONNECT,
  FAILED,
  FINISHED,
  PREPARING,
  PYTHON,
  RUNNING,
  SQL,
  STARTING,
  SUCCESS,
} from "./Builds.constants";
import {
  TBuildLog,
  TBuildSpec,
  TBuildStatus,
  TFunnelStage,
} from "./Builds.types";

export const getBuilderLink = (buildLog: TBuildLog) => {
  if (buildLog.trigger == CONNECT) {
    return `/portal/connect/link/${buildLog.builder}`;
  } else if (buildLog.trigger == PYTHON || buildLog.trigger == SQL) {
    let branch = "master";
    if (buildLog.branch != null) {
      branch = buildLog.branch;
    }

    if (buildLog.scriptPath == null) {
      return `/portal/kitab/repository/${buildLog.builder}/${branch}`;
    } else {
      return `/portal/kitab/repository/${buildLog.builder}/${branch}/?f=${buildLog.scriptPath}`;
    }
  } else {
    return `_blank`;
  }
};

export const getRepoLinkUsingBuildSpec = (buildSpec: TBuildSpec) => {
  return `/portal/kitab/repository/${buildSpec.repository}/${buildSpec.branch}?f=${buildSpec.scriptPath}`;
};

export const syncWithLocalStatus = (status: TBuildStatus) => {
  if (status == ACTIVE) {
    return "process";
  } else if (status == ABORTED || status == FAILED) {
    return "error";
  } else if (status == SUCCESS) {
    return "finish";
  } else {
    return "wait";
  }
};

export const calculateDuration = (
  stage: TFunnelStage,
  datasetBuildLog: TBuildLog
) => {
  if (!datasetBuildLog) {
    return 0;
  }
  if (stage == STARTING) {
    return (
      datasetBuildLog.startingFinishedAt - datasetBuildLog.startingStartedAt
    );
  } else if (stage == PREPARING) {
    return (
      datasetBuildLog.preparingFinishedAt - datasetBuildLog.preparingStartedAt
    );
  } else if (stage == RUNNING) {
    return datasetBuildLog.runningFinishedAt - datasetBuildLog.runningStartedAt;
  } else if (stage == FINISHED) {
    return datasetBuildLog.finishedAt - datasetBuildLog.startedAt;
  }

  return 0;
};

export const getBuildSteps = (datasetBuildLog: TBuildLog) => {
  let buildSteps = {
    starting: {
      title: getLanguageLabel(STARTING),
      status: "wait",
      description: "",
      icon: <SyncIcon color={"#08c"} spin />,
    },
    preparing: {
      title: getLanguageLabel(PREPARING),
      status: "wait",
      description: "",
      icon: <ComponentIcon />,
    },
    running: {
      title: getLanguageLabel(RUNNING),
      status: "wait",
      description: "",
      icon: <RunCellSelectIcon />,
    },
    finished: {
      title: getLanguageLabel(FINISHED),
      status: "wait",
      description: "",
      icon: <QuickStartIcon />,
    },
  };

  if (datasetBuildLog && datasetBuildLog.stage == (STARTING as TFunnelStage)) {
    buildSteps = {
      starting: {
        ...buildSteps.starting,
        status: syncWithLocalStatus(datasetBuildLog.status),
        description: "",
        icon: <SyncIcon size={24} color={"#08c"} spin />,
      },
      preparing: {
        ...buildSteps.preparing,
        status: "wait",
        description: "",
      },
      running: {
        ...buildSteps.running,
        status: "wait",
        description: "",
      },
      finished: {
        ...buildSteps.finished,
        status: "wait",
        description: "",
      },
    };
  } else if (datasetBuildLog && datasetBuildLog.stage == PREPARING) {
    buildSteps = {
      starting: {
        ...buildSteps.starting,
        status: "finish",
        description: formatDuration(
          calculateDuration(STARTING, datasetBuildLog)
        ),
        icon: <TickIcon color="#ffffff" />,
      },
      preparing: {
        ...buildSteps.preparing,
        status: syncWithLocalStatus(datasetBuildLog.status),
        description: "",
        icon: <SyncIcon size={24} color={"#08c"} spin />,
      },
      running: {
        ...buildSteps.running,
        status: "wait",
        description: "",
      },
      finished: {
        ...buildSteps.finished,
        status: "wait",
        description: "",
      },
    };
  } else if (datasetBuildLog && datasetBuildLog.stage == RUNNING) {
    buildSteps = {
      starting: {
        ...buildSteps.starting,
        status: "finish",
        description: formatDuration(
          calculateDuration(STARTING, datasetBuildLog)
        ),
        icon: <TickIcon color="#ffffff" />,
      },
      preparing: {
        ...buildSteps.preparing,
        status: "finish",
        description: formatDuration(
          calculateDuration(PREPARING, datasetBuildLog)
        ),
        icon: <TickIcon color="#ffffff" />,
      },
      running: {
        ...buildSteps.running,
        status: syncWithLocalStatus(datasetBuildLog.status),
        description: "",
        icon: <SyncIcon size={24} color={"#08c"} spin />,
      },
      finished: {
        ...buildSteps.finished,
        status: syncWithLocalStatus(datasetBuildLog.status),
        description: datasetBuildLog.status == ACTIVE ? "" : "2",
      },
    };
  } else if (datasetBuildLog && datasetBuildLog.stage == FINISHED)
    buildSteps = {
      starting: {
        ...buildSteps.starting,
        status: "finish",
        description: formatDuration(
          calculateDuration(STARTING, datasetBuildLog)
        ),
        icon: <TickIcon color="#ffffff" />,
      },
      preparing: {
        ...buildSteps.preparing,
        status: "finish",
        description: formatDuration(
          calculateDuration(PREPARING, datasetBuildLog)
        ),
        icon: <TickIcon color="#ffffff" />,
      },
      running: {
        ...buildSteps.running,
        status: "finish",
        description: formatDuration(
          calculateDuration(RUNNING, datasetBuildLog)
        ),
        icon: <TickIcon color="#ffffff" />,
      },
      finished: {
        ...buildSteps.finished,
        status: syncWithLocalStatus(datasetBuildLog.status),
        description: formatDuration(
          datasetBuildLog.finishedAt - datasetBuildLog.startedAt
        ),
        icon: <TickIcon color="#ffffff" />,
      },
    };

  return buildSteps;
};
