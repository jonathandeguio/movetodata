import { Resource } from "Apps/explorer/explorer";
import { Descriptions, Skeleton } from "antd";
import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import React, { useEffect, useState } from "react";
import { autoFormatter } from "utils/AutoFormatter";
import { getTableExplanationAPI } from "./SimpleTreePopover.api";

interface IProps {
  sourceId: string;
  tableNode: Resource;
}

interface ITableExplanation {
  rowsCount: string;
  tableSize: string;
  createdAt: string;
  updatedAt: string;
  columns: string[][];
  ddlQuery: string;
}

interface IInformationSectionProps {
  isLoading: boolean;
  data: ITableExplanation | undefined;
}

interface IDefinationSectionProps {
  isLoading: boolean;
  data: ITableExplanation | undefined;
}

type TSections = "info" | "def";

const InformationSection = ({ isLoading, data }: IInformationSectionProps) => {
  if (isLoading || !data) {
    return <Skeleton />;
  }

  return (
    <Descriptions
      column={1}
      size={"small"}
      items={[
        {
          key: 1,
          label: "Total Rows",
          children: data.rowsCount
            ? autoFormatter(Number(data.rowsCount))
            : "-",
        },
        {
          key: 2,
          label: "Table Size",
          children: data.tableSize
            ? autoFormatter(Number(data.tableSize), "bytes")
            : "-",
        },
        {
          key: 3,
          label: "Created At",
          children: data.createdAt ?? "-",
        },
        {
          key: 4,
          label: "Updated At",
          children: data.updatedAt ?? "-",
        },
      ]}
    />
  );
};

const DefinationSection = ({ isLoading, data }: IDefinationSectionProps) => {
  if (isLoading || !data) {
    return <Skeleton />;
  }

  return <>Defination</>;
};

const TreePopoverTable = ({ sourceId, tableNode }: IProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<false | string>(false);
  const [selectedSection, setSelectedSection] = useState<TSections>("info");
  const [tableExplanationData, setTableExplanationData] =
    useState<ITableExplanation>();

  const getSourceTableExplanation = (sourceId: string, tableName: string) => {
    setIsLoading(true);
    getTableExplanationAPI(sourceId, tableName)
      .then(({ data }) => {
        console.log(data);
        setTableExplanationData(data);
      })
      .catch((error) => {
        setIsError(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getSourceTableExplanation(sourceId, tableNode.name);
  }, []);

  return (
    <div
      style={{
        width: "300px",
        maxWidth: "500px",
      }}
    >
      {isError ? (
        isError
      ) : (
        <MtdSwitch
          items={[
            {
              label: "Info",
              value: "info",
              children: (
                <InformationSection
                  isLoading={isLoading}
                  data={tableExplanationData}
                />
              ),
            },
            {
              label: "Defination",
              value: "def",
              children: (
                <DefinationSection
                  isLoading={isLoading}
                  data={tableExplanationData}
                />
              ),
            },
          ]}
          value={selectedSection}
          onChange={(newVal: TSections) => {
            setSelectedSection(newVal);
          }}
        />
      )}
    </div>
  );
};

export default TreePopoverTable;
