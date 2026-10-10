import { Tabs, TabsProps, Typography } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/types/store";

import { ResourceSubTypeEnum } from "Apps/explorer/explorer.utils";
import { TreeIcon } from "assets/icons/mtdDataIcons";
import { HelpIcon } from "assets/icons/mtdMiscellaneousIcons";
import NoData from "components/CommonUI/NoData";
import MtdLoader from "components/mtdLoader";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { ResourceSubType } from "../../../explorer/explorer.utils";
import ApplySchemaBtn from "./ApplySchemaBtn";
import { getDatasetSchemaAPI, getResourceAPI } from "./Schema.api";
import SchemaEditor from "./SchemaEditor";

interface IProps {
  id: string;
  branch: string;
}

const showCustomSchema = (fileType: ResourceSubType) => {
  return (
    fileType == ResourceSubTypeEnum.CSV ||
    fileType == ResourceSubTypeEnum.XLS ||
    fileType == ResourceSubTypeEnum.RAWDATASET
  );
};

export default function Schema({ id, branch }: IProps) {
  const [currentResource, setCurrentResource] = useState<any>();
  const [items, setItems] = useState<TabsProps["items"]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  const datasetMapping = useSelector(
    (state: RootState) => state.datasetMapping[id]
  );

  const [changedSchema, setChangedSchema] = useState<string>();
  const [changedCustomSchema, setChangedCustomSchema] = useState<string>();

  const getDatasetResourceModel = (id: string) => {
    getResourceAPI(id).then(({ data }) => {
      setCurrentResource(data);
    });
  };

  const getDatasetSchema = (
    id: string,
    branch: string,
    transactionId: string
  ) => {
    setLoading(true);
    getDatasetResourceModel(id);
    getDatasetSchemaAPI(id, branch, transactionId)
      .then(({ data }) => {
        setChangedSchema(JSON.stringify(data["schema"], undefined, 2));
        setChangedCustomSchema(
          JSON.stringify(data["customSchema"], undefined, 2)
        );
      })
      .catch((error) => {
        setIsError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (datasetMapping) {
      getDatasetSchema(
        id,
        branch,
        datasetMapping?.datasetMapping?.currentTransaction
      );
    }
  }, [id, branch, datasetMapping]);

  useEffect(() => {
    if (currentResource) {
      let _items = [];
      _items.push({
        key: "1",
        label: (
          <span>
            {" "}
            <TreeIcon /> {getLanguageLabel("schema")}
          </span>
        ),
        children: (
          <div style={{ height: "100%" }} className="--m5">
            <ApplySchemaBtn
              id={id}
              branch={branch}
              datasetName={currentResource.name}
              transactionId={datasetMapping?.datasetMapping?.currentTransaction}
              changedSchema={changedSchema}
              setChangedSchema={setChangedSchema}
              changedCustomSchema={changedCustomSchema}
              setChangedCustomSchema={setChangedCustomSchema}
              tabType={"schema"}
              disabled={
                datasetMapping?.datasetMapping?.currentTransaction !=
                datasetMapping?.datasetMapping?.originalCurrentTransaction
              }
            />
            <SchemaEditor
              loading={loading}
              datasetMapping={datasetMapping}
              changedSchema={changedSchema}
              setChangedSchema={setChangedSchema}
              changedCustomSchema={changedCustomSchema}
              setChangedCustomSchema={setChangedCustomSchema}
              tabType={"schema"}
            />
          </div>
        ),
      });
      if (currentResource && showCustomSchema(currentResource.subType)) {
        _items.push({
          key: "2",
          label: (
            <span>
              <TreeIcon /> {getLanguageLabel("customSchema")}
            </span>
          ),
          children: (
            <div
              key="datasetSchemaPanel_2"
              className="--m5"
              style={{ height: "100%" }}
            >
              <ApplySchemaBtn
                id={id}
                branch={branch}
                datasetName={currentResource.name}
                transactionId={
                  datasetMapping?.datasetMapping?.currentTransaction
                }
                changedSchema={changedSchema}
                setChangedSchema={setChangedSchema}
                changedCustomSchema={changedCustomSchema}
                setChangedCustomSchema={setChangedCustomSchema}
                tabType={"custom"}
                disabled={
                  datasetMapping?.datasetMapping?.currentTransaction !=
                  datasetMapping?.datasetMapping?.originalCurrentTransaction
                }
              />
              <SchemaEditor
                loading={loading}
                datasetMapping={datasetMapping}
                changedSchema={changedSchema}
                setChangedSchema={setChangedSchema}
                changedCustomSchema={changedCustomSchema}
                setChangedCustomSchema={setChangedCustomSchema}
                tabType={"custom"}
              />
            </div>
          ),
        });
        _items.push({
          key: "3",
          label: (
            <span>
              <HelpIcon />
              {getLanguageLabel("help")}
            </span>
          ),
          children: (
            <div
              key="datasetSchemaPanel_3"
              className="--m5"
              style={{ userSelect: "none", height: "100%" }}
            >
              <Typography.Title level={4}>
                Changing datatype of a column
              </Typography.Title>
              <ul>
                <li>
                  If there's any error or date/timestamp doesn't show after
                  changing a column's data type. Make sure to change its format
                  in <Typography.Text strong>Custom Schema Tab</Typography.Text>{" "}
                  as such{" "}
                </li>
                <li>
                  You can also change the dateDefault & timestampDefault values
                  if the entire table has constant date format{" "}
                </li>
              </ul>
              <Typography.Text type="danger">
                Don't apply wrong format.{" "}
              </Typography.Text>
              <SchemaEditor
                loading={loading}
                datasetMapping={datasetMapping}
                changedSchema={changedSchema}
                setChangedSchema={setChangedSchema}
                changedCustomSchema={changedCustomSchema}
                setChangedCustomSchema={setChangedCustomSchema}
                tabType={"help"}
              />
            </div>
          ),
        });
      }
      setItems(_items);
    }
  }, [changedSchema, changedCustomSchema]);

  if (loading) {
    return <MtdLoader />;
  } else if (isError) {
    return <NoData heading="Error" subHeading="Try reloading!" />;
  }
  return <Tabs defaultActiveKey="1" type="card" items={items} />;
}
