import CreateNewDashboardModal from "Apps/Kepler/utils/CreateNewDashboardModal";
import { Divider, Dropdown, MenuProps, Space } from "antd";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  getLanguageLabel,
  isDefined,
  isUseCaseBasedOptionActivate,
} from "utils/utilities";
import { AddIcon, LinkIcon } from "../../assets/icons/mtdActionIcons";
import { GroupedColumnIcon } from "../../assets/icons/mtdChartIcons";
import { FolderIcon } from "../../assets/icons/mtdFileIcons";
import { MonitorIcon } from "../../assets/icons/mtdMiscellaneousIcons";
import { TableIcon } from "../../assets/icons/mtdTableIcons";
import CreateNewChartModal from "../Modals/CreateNewChartModal";

import AgentModal from "Apps/Connect/Agents/AgentModal.view";
import LinkModal from "Apps/Connect/Links/LinkModal.view";
import SourceModal from "Apps/Connect/Sources/SourceModal.view";
import { KEPLER_USE_CASES } from "Apps/Kepler/chart/charts.utils";
import { ResourceType, ResourceTypeEnum } from "Apps/explorer/explorer.utils";
import { CodeCellIcon } from "assets/icons/mtdEditorIcons";
import { KeyIcon, UploadIcon } from "assets/icons/mtdInterfaceIcons";
import { FRACTAL_USE_CASES } from "components/editor/editor.constants";
import { useHotkeys } from "react-hotkeys-hook";
import { useSelector } from "react-redux";
import {
  DataAgentsIcon,
  DatabaseIcon,
} from "../../assets/icons/mtdDataIcons";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import CreateNewDatasetModal from "../Modals/CreateNewDatasetModal";
import CreateNewFolderModal from "../Modals/CreateNewFolderModal";
import CreateNewRepositoryModal from "../Modals/CreateNewRepositoryModal";
import UploadNewFileModal from "../Modals/UploadNewFileModal";

interface Props {
  parent?: string;
  type?: ResourceType[];
}

const NewButton: React.FC<Props> = ({ parent, type }) => {
  const { id: paramId } = useParams();

  const id: string = parent ?? paramId ?? "";

  const [value, setValue] = useState("");
  const [view, setView] = useState(false);

  const { user: connectAdmin } = useSelector(
    (state) => (state as any).connectAdmin
  );

  const { info } = useSelector((state) => (state as any).license);

  const items: MenuProps["items"] = [
    {
      key: ResourceTypeEnum.FOLDER,
      label: (
        <div style={{ marginLeft: "1.5rem" }}>{getLanguageLabel("folder")}</div>
      ),
      icon: <FolderIcon size={22} />,
      onClick: () => {
        setValue("FOLDER");
        setView(true);
      },
      disabled: false,
    },
    {
      key: ResourceTypeEnum.FILE,
      label: (
        <div style={{ marginLeft: "1.5rem" }}>
          {getLanguageLabel("fileUpload")}
        </div>
      ),
      icon: <UploadIcon size={22} />,
      onClick: () => {
        setValue("file");
        setView(true);
      },
      disabled: isDefined(type)
        ? !type.map((t) => t?.toUpperCase()).includes(ResourceTypeEnum.FILE)
        : false,
    },
    {
      key: "divider",
      label: <Divider style={{ margin: "1px" }}></Divider>,
      disabled: true,
    },
    {
      key: ResourceTypeEnum.DATASET,
      label: (
        <div style={{ marginLeft: "1.5rem" }}>
          {getLanguageLabel("dataset")}
        </div>
      ),
      icon: <TableIcon size={22} />,
      onClick: () => {
        setValue("DATASET");
        setView(true);
      },
      disabled: isDefined(type)
        ? !type.map((t) => t?.toUpperCase()).includes(ResourceTypeEnum.DATASET)
        : false,
    },
    {
      key: ResourceTypeEnum.REPOSITORY,
      label: (
        <div style={{ marginLeft: "1.5rem" }} className="text-and-icon-center">
          {getLanguageLabel("repository")}{" "}
          {!FRACTAL_USE_CASES.includes(info.product) && <KeyIcon />}
        </div>
      ),
      icon: <CodeCellIcon size={22} />,
      onClick: () => {
        setValue("repository");
        setView(true);
      },
      disabled: isDefined(type)
        ? !type
            .map((t) => t?.toUpperCase())
            .includes(ResourceTypeEnum.REPOSITORY)
        : false,
    },
    {
      key: ResourceTypeEnum.CHART,
      label: (
        <div style={{ marginLeft: "1.5rem" }} className="text-and-icon-center">
          {getLanguageLabel("chart")}
          {!KEPLER_USE_CASES.includes(info.product) && <KeyIcon />}
        </div>
      ),
      icon: <GroupedColumnIcon size={22} />,
      onClick: () => {
        setValue("chart");
        setView(true);
      },
      disabled: isDefined(type)
        ? !type.map((t) => t?.toUpperCase()).includes(ResourceTypeEnum.CHART)
        : false,
    },
    {
      key: ResourceTypeEnum.DASHBOARD,
      label: (
        <div style={{ marginLeft: "1.5rem" }} className="text-and-icon-center">
          {getLanguageLabel("dashboard")}
          {!KEPLER_USE_CASES.includes(info.product) && <KeyIcon />}
        </div>
      ),
      icon: <MonitorIcon size={22} />,
      onClick: () => {
        setValue("dashboard");
        setView(true);
      },
      disabled: isDefined(type)
        ? !type
            .map((t) => t?.toUpperCase())
            .includes(ResourceTypeEnum.DASHBOARD)
        : false,
    },
  ].filter((item) => {
    if (item.key == ResourceTypeEnum.REPOSITORY)
      return isUseCaseBasedOptionActivate(
        "FRACTAL",
        info.displayBlockedFeatures,
        info.product
      );
    if (
      item.key == ResourceTypeEnum.CHART ||
      item.key == ResourceTypeEnum.DASHBOARD
    )
      return isUseCaseBasedOptionActivate(
        "KEPLER",
        info.displayBlockedFeatures,
        info.product
      );
    return true;
  });

  const connectItems: MenuProps["items"] = [
    {
      key: "divider",
      label: (
        <Divider style={{ margin: "1px" }}>
          {/* {getLanguageLabel("connect")} */}
        </Divider>
      ),
      disabled: true,
    },
    {
      key: "7",
      label: (
        <div style={{ marginLeft: "1.5rem" }}>
          {getLanguageLabel("dataLinks")}
        </div>
      ),
      icon: <LinkIcon size={22} />,
      onClick: () => {
        setValue("link");
        setView(true);
      },
      disabled: isDefined(type)
        ? !type.map((t) => t?.toUpperCase()).includes(ResourceTypeEnum.LINK)
        : false,
    },

    {
      key: "8",
      label: (
        <div style={{ marginLeft: "1.5rem" }}>
          {getLanguageLabel("dataSource")}
        </div>
      ),
      icon: <DatabaseIcon size={22} />,
      onClick: () => {
        setValue("source");
        setView(true);
      },
      disabled: isDefined(type)
        ? !type.map((t) => t?.toUpperCase()).includes(ResourceTypeEnum.SOURCE)
        : false,
    },
    {
      key: "9",
      label: (
        <div style={{ marginLeft: "1.5rem" }}>{getLanguageLabel("agent")}</div>
      ),
      icon: <DataAgentsIcon size={22} />,
      onClick: () => {
        setValue("agent");
        setView(true);
      },
      disabled: isDefined(type)
        ? !type.map((t) => t?.toUpperCase()).includes(ResourceTypeEnum.AGENT)
        : false,
    },
  ];

  useHotkeys("1", (event: any) => {
    event.preventDefault();
    setValue("FOLDER");
    setView(true);
  });
  useHotkeys("2", (event: any) => {
    event.preventDefault();
    setValue("DATASET");
    setView(true);
  });
  useHotkeys("3", (event: any) => {
    event.preventDefault();
    if (
      isUseCaseBasedOptionActivate(
        "FRACTAL",
        info.displayBlockedFeatures,
        info.product
      )
    )
      setValue("repository");
    setView(true);
  });
  useHotkeys("4", (event: any) => {
    event.preventDefault();
    if (
      isUseCaseBasedOptionActivate(
        "KEPLER",
        info.displayBlockedFeatures,
        info.product
      )
    ) {
      setValue("chart");
      setView(true);
    }
  });
  useHotkeys("5", (event: any) => {
    event.preventDefault();
    if (
      isUseCaseBasedOptionActivate(
        "KEPLER",
        info.displayBlockedFeatures,
        info.product
      )
    ) {
      setValue("dashboard");
      setView(true);
    }
  });

  useHotkeys("6", (event: any) => {
    event.preventDefault();
    setValue("file");
    setView(true);
  });

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
      {/* TODO: WHY STRETCH IT IS CAUSING VERTICAL ALIGN ISSUES */}
      <Space style={{ alignItems: "stretch" }}>
        <Dropdown
          menu={{ items: connectAdmin ? items.concat(connectItems) : items }}
          trigger={["click"]}
        >
          <MtdButton icon={<AddIcon />} intent="action">
            {getLanguageLabel("new")}
          </MtdButton>
        </Dropdown>
        {value == "chart" && view && id != undefined && (
          <CreateNewChartModal
            defaultParent={id}
            isVisible={view}
            setIsVisible={setView}
            branch={"master"}
          />
        )}
        {value == "dashboard" && view && id != undefined && (
          <CreateNewDashboardModal
            id={id}
            createDashboardModal={view}
            setCreateDashboardModal={setView}
            redirect={true}
          />
        )}

        {value == "FOLDER" && view && id != undefined && (
          <CreateNewFolderModal
            id={id}
            isVisible={view}
            setIsVisible={setView}
          />
        )}

        {value == "repository" && view && id != undefined && (
          <CreateNewRepositoryModal
            id={id}
            isVisible={view}
            setIsVisible={setView}
          />
        )}

        {value == "DATASET" && view && id != undefined && (
          <CreateNewDatasetModal
            id={id}
            isVisible={view}
            setIsVisible={setView}
          />
        )}

        {value == "file" && view && id != undefined && (
          <UploadNewFileModal id={id} isVisible={view} setIsVisible={setView} />
        )}

        {/* FIXME */}
        {value == "link" && view && id != undefined && (
          <LinkModal
            defaultParent={id}
            isVisible={view}
            setIsVisible={setView}
          />
        )}
        {value == "agent" && view && id != undefined && (
          <AgentModal
            defaultParent={id}
            isVisible={view}
            setIsVisible={setView}
          />
        )}
        {value == "source" && view && id != undefined && (
          <SourceModal
            defaultParent={id}
            isVisible={view}
            setIsVisible={setView}
          />
        )}
      </Space>
    </div>
  );
};

export default NewButton;
