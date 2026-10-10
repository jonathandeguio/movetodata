import { Form, Typography } from "antd";
import {
  BuildIcon,
  CrossIcon,
  HistoricalRunsIcon,
  SyncIcon,
} from "assets/icons/mtdActionIcons";
import { TreeIcon } from "assets/icons/mtdDataIcons";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { DocsIcon } from "assets/icons/mtdFileIcons";
import { TickSmallIcon } from "assets/icons/mtdNavigationIcon";
import { TableIcon } from "assets/icons/mtdTableIcons";
import StripMenu from "common/components/StripMenu";
import { TGeneralMenuItem } from "common/types";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React, { useState } from "react";
import { useParams } from "react-router";
import { putDataHealthAPI } from "./DataHealth.api";
import { DataHealthTypeEnum, IDataHealthDTO } from "./DataHealth.types";
import BuildStatus from "./Status/BuildStatus";
import JobStatus from "./Status/JobStatus";
import SyncStatus from "./Status/SyncStatus";

const { Text } = Typography;

const DataHealthAddChecks = () => {
  const { id, branch } = useParams();
  if (!id || !branch) return <></>;

  const [form] = Form.useForm();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [dataHealthType, setDataHealthType] = useState<DataHealthTypeEnum>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [intent, setIntent] = useState<"primary" | "success" | "dangerous">(
    "primary"
  );

  const handleOpen = (type: DataHealthTypeEnum) => {
    setIsOpen(true);
    setDataHealthType(type);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSave = (dataHealthDTO: IDataHealthDTO) => {
    setIsLoading(true);
    putDataHealthAPI(id, branch, dataHealthDTO)
      .then(() => {
        setIntent("success");
      })
      .catch(() => {
        setIntent("dangerous");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getModelContent = (type: DataHealthTypeEnum | undefined) => {
    if (type == DataHealthTypeEnum.BUILDSTATUS) {
      return <BuildStatus form={form} handleSave={handleSave} />;
    } else if (type == DataHealthTypeEnum.SYNCSTATUS) {
      return <SyncStatus form={form} handleSave={handleSave} />;
    } else if (type == DataHealthTypeEnum.JOBSTATUS) {
      return <JobStatus form={form} handleSave={handleSave} />;
    } else {
      return <></>;
    }
  };

  const items: TGeneralMenuItem[] = [
    {
      key: "status",
      icon: <BuildIcon size={23} />,
      label: (
        <>
          <Text type="secondary" style={{ fontSize: "0.7rem" }}>
            Status
          </Text>
        </>
      ),
      customType: "menu",
      tooltip: "Status related checks",
      children: [
        {
          key: DataHealthTypeEnum.BUILDSTATUS,
          icon: <BuildIcon size={23} />,
          label: "Build Status",
          tooltip: "Build status check",
          onClick: () => handleOpen(DataHealthTypeEnum.BUILDSTATUS),
          customType: "menu",
        },
        {
          key: DataHealthTypeEnum.JOBSTATUS,
          icon: <BuildIcon size={23} />,
          label: "Job Status",
          tooltip: "Job status check",
          onClick: () => handleOpen(DataHealthTypeEnum.JOBSTATUS),
          customType: "menu",
        },
        {
          key: DataHealthTypeEnum.SYNCSTATUS,
          icon: <SyncIcon size={23} />,
          label: "Sync Status",
          tooltip: "Sync status check",
          onClick: () => handleOpen(DataHealthTypeEnum.SYNCSTATUS),
          customType: "menu",
        },
      ],
    },
    {
      key: "divider1",
      customType: "divider",
    },
    {
      key: "time",
      icon: <HistoricalRunsIcon size={27} />,
      label: (
        <>
          <Text type="secondary" style={{ fontSize: "0.7rem" }}>
            Time
          </Text>
        </>
      ),
      customType: "menu",
    },
    {
      key: "divider1",
      customType: "divider",
    },
    {
      key: "size",
      icon: <DocsIcon size={25} />,
      label: (
        <>
          <Text type="secondary" style={{ fontSize: "0.7rem" }}>
            Size
          </Text>
        </>
      ),
      customType: "menu",
    },
    {
      key: "divider1",
      customType: "divider",
    },
    {
      key: "content",
      icon: <TableIcon size={25} />,
      label: (
        <>
          <Text type="secondary" style={{ fontSize: "0.6rem" }}>
            Content
          </Text>
        </>
      ),
      customType: "menu",
    },
    {
      key: "divider1",
      customType: "divider",
    },
    {
      key: "schema",
      icon: <TreeIcon size={25} />,
      label: (
        <>
          <Text type="secondary" style={{ fontSize: "0.5rem" }}>
            Schema
          </Text>
        </>
      ),
      customType: "menu",
    },
  ];

  return (
    <div>
      <div className="MtdHeader1">Add Checks</div>
      <div>
        <StripMenu items={items} />
      </div>
      {
        <MtdModal
          headingIcon={<EditIcon />}
          heading={"Add Check"}
          open={isOpen}
          footerButtonArea={
            <>
              <MtdButton
                icon={<TickSmallIcon />}
                loading={isLoading}
                intent={intent}
                onClick={() => {
                  form.submit();
                  handleClose();
                }}
              >
                save
              </MtdButton>
              <MtdButton
                icon={<CrossIcon />}
                onClick={() => {
                  handleClose();
                }}
                intent="dangerous"
              >
                cancel
              </MtdButton>
            </>
          }
        >
          {getModelContent(dataHealthType)}
        </MtdModal>
      }
    </div>
  );
};

export default DataHealthAddChecks;
