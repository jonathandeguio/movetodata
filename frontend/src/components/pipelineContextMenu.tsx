import axios from "axios";
import { PublishIcon } from "../assets/icons/mtdActionIcons";
import { DatabaseIcon } from "../assets/icons/mtdDataIcons";

import React from "react";
import { updateContextMenu } from "../redux/actions/contextMenuActions";
import Popup, { customContextMenu } from "./customContextMenu";

import { CodeCellIcon } from "assets/icons/mtdEditorIcons";
import { CalendarIcon } from "assets/icons/mtdInterfaceIcons";
import { getLanguageLabel, openNotification } from "utils/utilities";
import { BuildIcon } from "../assets/icons/mtdActionIcons";
import { GraphIcon } from "../assets/icons/mtdChartIcons";
import { DocsIcon, FolderIcon } from "../assets/icons/mtdFileIcons";
import { DATASET } from "./Builds/Builds.constants";

const BASE_URL = process.env.REACT_APP_BASE_URL;

const PipelineContextMenus = (
  event: $TSFixMe,
  record: $TSFixMe,
  dispatch: $TSFixMe,
  id: $TSFixMe,
  buildexist: $TSFixMe
) => {
  const handleRepo = async (record: $TSFixMe) => {
    try {
      const { data } = await axios.get(
        `/kitab/dataset/${record.id}/${record.branch}/${record.transactionId}`
      );
      const scriptPath = encodeURIComponent(data.scriptPath);

      window
        .open(
          `${BASE_URL}/portal/kitab/repository/${data.repository}/${data.branch}?f=${scriptPath}`,
          "_blank"
        )
        ?.focus();
    } catch (error) {
      openNotification(
        "Repository Error",
        "Failed to fetch repository",
        "error"
      );
    }
  };

  const handlePipeline = (record: $TSFixMe) => {
    window
      .open(
        `${BASE_URL}/portal/pipeline/${record.id}/${record.branch}`,
        "_blank"
      )
      ?.focus();
  };

  const menu = [
    {
      item: <>{getLanguageLabel("open")}</>,
      icon: FolderIcon,
      action: (r: $TSFixMe) => {
        let URL = "";
        const handleOpen = () => {
          switch (record.type) {
            case "PROJECT":
              URL = `${URL}/portal/kitab/folder/${record.id}`;
              break;
            case "chart":
              URL = `${URL}/portal/kepler/CHART/${record.id}`;
              break;
            case "dashboard":
              URL = `${URL}/portal/kepler/DASHBOARD/${record.id}`;
              break;
            default:
              URL = `${URL}/portal/kitab/${record.type}/${record.id}/${record.branch}`;
          }
          window.open(URL, "_blank");
        };

        handleOpen();
      },
    },
    {
      item: <>{getLanguageLabel("openCodeRepository")}</>,
      icon: <CodeCellIcon />,
      action: handleRepo,
      disabled: !buildexist,
    },
    {
      item: (
        <div style={{ display: "inline" }}>{getLanguageLabel("build")}</div>
      ),
      icon: <BuildIcon />,
      action: (record: $TSFixMe) => {
        const onBuild = async () => {
          try {
            await axios.post(`/build/build/${DATASET}`, {
              datasetId: record.id,
              branch: record.branch,
              transactionId: record.transactionId,
            });
            openNotification(
              `Build started`,
              <a href={`/portal/builds`}>Click to view logs</a>,
              "success"
            );
          } catch (error) {
            openNotification(
              `Failed to Build`,
              <a href={`/portal/builds`}>Click to view logs</a>,
              "error"
            );
          }
        };

        onBuild();
      },
      disabled: !buildexist,
    },
    {
      item: (
        <>
          {getLanguageLabel("expand")}
          <GraphIcon />
        </>
      ),
      icon: FolderIcon,
      action: handlePipeline,
      disabled: !buildexist,
    },
  ];

  customContextMenu(event, record, menu, dispatch);
};
const PipelineContextMenu = (state: {
  event: $TSFixMe;
  record: $TSFixMe;
  dispatch: $TSFixMe;
  id: $TSFixMe;
  buildexist: $TSFixMe;
}) => {
  const event = state.event;
  const record = state.record;
  const dispatch = state.dispatch;
  const id = state.id;
  const buildexist = state.buildexist;

  const handleRepo = async (record: $TSFixMe) => {
    try {
      const { data } = await axios.get(
        `/kitab/dataset/${record.id}/${record.branch}/${record.transactionId}`
      );
      const scriptPath = encodeURIComponent(data.scriptPath);

      window
        .open(
          `${BASE_URL}/portal/kitab/repository/${data.repository}/${data.branch}?f=${scriptPath}`,
          "_blank"
        )
        ?.focus();
    } catch (error) {
      openNotification(
        "Repository Error",
        "Failed to fetch repository",
        "error"
      );
    }
  };

  const handlePipeline = (record: $TSFixMe) => {
    window
      .open(
        `${BASE_URL}/portal/pipeline/${record.id}/${record.branch}`,
        "_blank"
      )
      ?.focus();
  };

  const menu = [
    {
      item: <>{getLanguageLabel("open")}</>,
      icon: FolderIcon,
      action: (record: $TSFixMe) => {
        let URL = "";

        const handleOpen = () => {
          switch (record.type) {
            case "PROJECT":
              URL = `${URL}/portal/kitab/folder/${record.id}`;
              break;
            case "chart":
              URL = `${URL}/portal/kepler/CHART/${record.id}`;
              break;
            case "dashboard":
              URL = `${URL}/portal/kepler/DASHBOARD/${record.id}`;
              break;
            default:
              URL = `${URL}/portal/kitab/${record.type}/${record.id}/${record.branch}`;
          }
          window.open(URL, "_blank");
        };

        handleOpen();
      },
    },
    {
      item: <>{getLanguageLabel("openCodeRepository")}</>,
      icon: <CodeCellIcon />,
      action: handleRepo,
      disabled: !buildexist,
    },
    {
      item: (
        <div style={{ display: "inline" }}>{getLanguageLabel("build")}</div>
      ),
      icon: <BuildIcon />,
      action: (record: $TSFixMe) => {
        const onBuild = async () => {
          try {
            await axios.post(`/build/build/${DATASET}`, {
              datasetId: record.id,
              branch: record.branch,
              transactionId: record.transactionId,
            });
            openNotification(
              `Build started`,
              <a href={`/portal/builds`}>Click to view logs</a>,
              "success"
            );
          } catch (error) {
            openNotification(
              `Failed to Build`,
              <a href={`/portal/builds`}>Click to view logs</a>,
              "error"
            );
          }
        };

        onBuild();
      },
      disabled: !buildexist,
    },
    {
      item: (
        <>
          {getLanguageLabel("expand")}
          <GraphIcon />
        </>
      ),
      icon: FolderIcon,
      action: handlePipeline,
      disabled: !buildexist,
    },
  ];

  return (
    <Popup event={event} record={record} menu={menu} dispatch={dispatch} />
  );
};
const updatePipelineContextMenu = (
  event: $TSFixMe,
  record: $TSFixMe,
  dispatch: $TSFixMe,
  id: $TSFixMe,
  buildexist: $TSFixMe
) => {
  const handleRepo = async (record: $TSFixMe) => {
    const URL = "";
    try {
      const { data } = await axios.get(
        `/kitab/dataset/${record.id}/${record.branch}/${record.transactionId}`
      );
      const scriptPath = encodeURIComponent(data.scriptPath);

      window
        .open(
          `${URL}/portal/kitab/repository/${data.repository}/${data.branch}?f=${scriptPath}`,
          "_blank"
        )
        ?.focus();
    } catch (error) {
      openNotification(
        "Repository Error",
        "Failed to fetch repository",
        "error"
      );
    }
  };

  const handlePipeline = (record: $TSFixMe) => {
    window
      .open(`${BASE_URL}/portal/bezier/${record.id}/master`, "_blank")
      ?.focus();
  };

  const menu = [
    {
      item: <>{getLanguageLabel("open")}</>,
      icon: FolderIcon,
      action: (record: $TSFixMe) => {
        let URL = "";
        const handleOpen = () => {
          switch (record.type) {
            case "PROJECT":
              URL = `${URL}/portal/kitab/folder/${record.id}`;
              break;
            case "chart":
              URL = `${URL}/portal/kepler/CHART/${record.id}`;
              break;
            case "dashboard":
              URL = `${URL}/portal/kepler/DASHBOARD/${record.id}`;
              break;
            default:
              URL = `${URL}/portal/kitab/${record.type}/${record.id}/${record.branch}`;
          }
          window.open(URL, "_blank");
        };
        handleOpen();
      },
    },
    {
      item: <>{getLanguageLabel("repository")}</>,
      icon: <CodeCellIcon />,
      action: handleRepo,
      disabled: !buildexist,
    },
    {
      item: (
        <div style={{ display: "inline" }}>{getLanguageLabel("build")}</div>
      ),
      icon: <BuildIcon />,
      action: (record: any) => {
        const onBuild = async () => {
          try {
            await axios.post(`/build/build/${DATASET}`, {
              datasetId: record.id,
              branch: record.branch,
              transactionId: record.transactionId,
            });
            openNotification(
              `Build started`,
              <a href={`/portal/builds`}>Click to view logs</a>,
              "success"
            );
          } catch (error) {
            openNotification(
              `Failed to Build`,
              <a href={`/portal/builds`}>Click to view logs</a>,
              "error"
            );
          }
        };

        onBuild();
      },
      disabled: !buildexist,
    },
    {
      item: <>{getLanguageLabel("schedules")}</>,

      icon: <CalendarIcon />,
      action: "",
      disabled: true,
    },
    {
      item: <>{getLanguageLabel("sync")}</>,

      icon: <PublishIcon />,
      action: "",
      disabled: true,
    },
    {
      item: <>{getLanguageLabel("files")}</>,

      icon: <DocsIcon />,
      action: "",
      disabled: true,
    },
    {
      item: <>{getLanguageLabel("schema")}</>,

      icon: <DatabaseIcon />,
      action: "",
      disabled: true,
    },
    {
      item: <>{getLanguageLabel("expand")}</>,
      icon: <GraphIcon />,
      action: handlePipeline,
    },
  ];

  dispatch(updateContextMenu(menu));
};
export { PipelineContextMenus, updatePipelineContextMenu };
export default PipelineContextMenu;
