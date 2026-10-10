import {
  Alert,
  Checkbox,
  Col,
  Collapse,
  Form,
  message,
  Row,
  Select,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { getSourceDetailsAPI } from "Apps/Connect/Connect.api";
import { initialLinkDetails } from "Apps/Connect/Links/Link.constants";
import { SourceButtonPopover } from "Apps/Connect/Links/SourceButtonPopover";
import { ColumnSelectLabel } from "Apps/Kepler/chart/QueryForm/ColumnSelect";
import { getDatasetColumns } from "Apps/Kepler/dashboard/Dashboard.api";
import { AddIcon, RemoveIcon, SyncIcon } from "assets/icons/mtdActionIcons";
import { SourceIcon } from "assets/icons/mtdDataIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import { WarningState } from "assets/Illustrations/EmptyState";
import UserInfo from "common/components/UserInfo";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import NoData from "components/CommonUI/NoData";
import { TDatasetColumn } from "components/Filters/Filters.view";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NULL_UUID } from "utils/Common.constants";
import {
  generateKey,
  getLanguageLabel,
  getSourceIcon,
  getTimeDisplay,
  isDefined,
  notEmpty,
} from "utils/utilities";
import { openFileExplorerModal } from "../../../redux/ModalSlice";
import {
  deleteSyncAPI,
  getDatasetSyncAPI,
  performDatasetSyncAPI,
  putSyncAPI,
} from "./Sync.apis";
import styles from "./Sync.module.scss";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";

export interface TSync {
  datasetId: string;
  branch: string;
}

export interface TDatasetSync {
  key: string;
  id: string | undefined;
  datasetId: string;
  branch: string;
  sourceId: string | undefined;
  tableName: string;
  autoSyncOnBuild: boolean;
  createdAt: number | undefined;
  createdBy: string | undefined;
  updatedBy: string | undefined;
  updatedAt: number | undefined;
  syncIndexes: TSyncIndex[];
}

export interface TSyncIndex {
  key: string;
  id: undefined | string;
  columns: string[];
}

const SyncNowBtn = ({ datasetSync }: { datasetSync: TDatasetSync }) => {
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<"none" | "success" | "dangerous">(
    "none"
  );
  const onClickSync = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!datasetSync.id) {
      message.error("Sync id not present!");
      return;
    }
    setLoading(true);
    performDatasetSyncAPI(datasetSync.datasetId, datasetSync.id)
      .then(() => {
        setIntent("success");
      })
      .catch(() => {
        setIntent("dangerous");
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <MtdButton
      icon={<SyncIcon />}
      loading={loading}
      onClick={onClickSync}
      intent={intent}
      disabled={!datasetSync.id}
    >
      Sync
    </MtdButton>
  );
};

const DeleteSyncBtn = ({
  datasetSyncs,
  setDatasetSyncs,
  datasetSync,
}: {
  datasetSyncs: TDatasetSync[];
  setDatasetSyncs: any;
  datasetSync: TDatasetSync;
}) => {
  const [loading, setLoading] = useState(false);
  const onClickDeleteSync = () => {
    if (!datasetSync.id) {
      message.error("Sync id not present!");
      return;
    }
    setLoading(true);
    deleteSyncAPI(datasetSync.datasetId, datasetSync.id)
      .then(() => {
        setDatasetSyncs(
          datasetSyncs.filter((sync) => sync.id !== datasetSync.id)
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <MtdButton
      icon={<TrashIcon />}
      loading={loading}
      onClick={onClickDeleteSync}
      intent={"dangerous"}
      disabled={!datasetSync.id}
      icononly
    />
  );
};

const SyncHeader = ({
  datasetSyncs,
  setDatasetSyncs,
  datasetSync,
}: {
  datasetSyncs: TDatasetSync[];
  setDatasetSyncs: any;
  datasetSync: TDatasetSync;
}) => {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div>{datasetSync.tableName}</div>
        {datasetSync.updatedBy ? (
          <UserInfo userId={datasetSync.updatedBy} />
        ) : null}
        {datasetSync.updatedAt ? (
          <div>{getTimeDisplay(datasetSync.updatedAt)}</div>
        ) : null}
      </div>
      <div className={styles.headerRight}>
        <SyncNowBtn datasetSync={datasetSync} />
        <DeleteSyncBtn
          datasetSyncs={datasetSyncs}
          setDatasetSyncs={setDatasetSyncs}
          datasetSync={datasetSync}
        />
      </div>
    </div>
  );
};

const SyncBody = ({
  datasetSyncs,
  setDatasetSyncs,
  datasetSync,
}: {
  datasetSyncs: TDatasetSync[];
  setDatasetSyncs: any;
  datasetSync: TDatasetSync;
}) => {
  const [form] = useForm();
  const dispatch = useDispatch();
  const [intent, setIntent] = useState<"success" | "primary" | "dangerous">(
    "primary"
  );

  const [newLinkDetails, setNewLinkDetails] = useState({
    ...initialLinkDetails,
  });

  const { sources } = useSelector((state) => (state as $TSFixMe).sourceList);

  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(datasetSync.sourceId);
  const [sourceName, setSourceName] = useState<string>();
  const [selectedSource, setSelectedSource] = useState(null);
  const [sourceType, setSourceType] = useState("");
  const [columns, setColumns] = useState([]);
  const [syncIndexes, setSyncIndexes] = useState<TSyncIndex[]>(
    datasetSync.syncIndexes
  );

  const addSourceDetails = ({ id, path, name, subType }: any) => {
    setNewLinkDetails({
      ...newLinkDetails,
      sourceId: id,
    });

    const targetSource: any = sources?.find((source: any) => source.id == id);
    setSelectedSource(targetSource);
    setSourceType(targetSource.type);
  };

  const handleDeleteIndex = (key: number) => {
    const _syncIndexes: TSyncIndex[] = [];
    syncIndexes.map((syncIndex: TSyncIndex, _key: number) => {
      if (_key != key) {
        _syncIndexes.push(syncIndex);
      }
    });
    setSyncIndexes(_syncIndexes);
  };

  const handleAddIndex = () => {
    setSyncIndexes([
      ...syncIndexes,
      { key: generateKey("sync-index"), id: undefined, columns: [] },
    ]);
  };

  const getSourceDetails = (source: string) => {
    getSourceDetailsAPI(source).then(({ data }) => {
      setSourceName(data.name);
      setSelectedSource(data);
    });
  };

  const getColumns = async () => {
    const data = await getDatasetColumns(
      datasetSync.datasetId,
      datasetSync.branch,
      NULL_UUID
    );
    const _columns: any = [];
    data.map((column: any) => {
      // sync these with MtdTable and DashboardGridFetcher
      const columnObj = {
        name: column.headerName,
        value: column.headerName,
        type: column.type,
      };
      _columns.push(columnObj);
    });
    setColumns(_columns);
  };

  useEffect(() => {
    if (source) {
      getSourceDetails(source);
    }
  }, [source]);

  useEffect(() => {
    getColumns();
  }, []);

  return (
    <div>
      <Form
        form={form}
        initialValues={datasetSync}
        onChange={(values) => {
          console.log(form.getFieldsValue());
          console.log("values on change : ", values);
        }}
        onFinish={(values) => {
          console.log(values);
          const simpleSyncIndexes: string[][] = [];
          syncIndexes.map((syncIndex: TSyncIndex) => {
            simpleSyncIndexes.push(syncIndex.columns);
          });
          const payload = {
            ...datasetSync,
            ...values,
            syncIndexes: simpleSyncIndexes,
          };

          setLoading(true);
          putSyncAPI(payload)
            .then(({ data }) => {
              setIntent("success");
              const newDatasetSyncs: TDatasetSync[] = [];
              datasetSyncs.map((_datasetSync: TDatasetSync) => {
                if (_datasetSync.key == datasetSync.key) {
                  newDatasetSyncs.push(data);
                } else {
                  newDatasetSyncs.push(_datasetSync);
                }
              });

              setDatasetSyncs(newDatasetSyncs);
            })
            .catch(() => {
              setIntent("dangerous");
            })
            .finally(() => {
              setLoading(false);
            });
        }}
      >
        <Row justify={"space-between"}>
          <Col span={6}>
            <Form.Item
              label={getLanguageLabel("dataSource")}
              name="sourceId"
              rules={[{ required: true, message: "Please input your source!" }]}
            >
              {source ? (
                <SourceButtonPopover source={selectedSource}>
                  <MtdButton
                    icon={
                      selectedSource ? (
                        getSourceIcon(
                          (selectedSource as $TSFixMe)["type"],
                          (selectedSource as $TSFixMe)["dbmsType"]
                        )
                      ) : (
                        <SourceIcon />
                      )
                    }
                    onClick={() => {
                      dispatch(
                        openFileExplorerModal({
                          type: ["SOURCE"],
                          action: (data) => {
                            addSourceDetails(data);
                          },
                          activeId: datasetSync.datasetId,
                        })
                      );
                    }}
                    intent={notEmpty(selectedSource) ? "success" : "warning"}
                  >
                    {notEmpty(selectedSource)
                      ? (selectedSource as any)?.name
                      : "Select Source"}
                  </MtdButton>
                </SourceButtonPopover>
              ) : (
                <MtdButton
                  onClick={() => {
                    dispatch(
                      openFileExplorerModal({
                        type: ["SOURCE"],
                        action: (data) => {
                          form.setFieldValue("sourceId", data.id);
                          setSource(data.id);
                        },
                        activeId: datasetSync.datasetId,
                      })
                    );
                  }}
                  intent={source ? "success" : "none"}
                  icon={<SourceIcon />}
                >
                  {sourceName}
                </MtdButton>
              )}
            </Form.Item>
          </Col>
          <Col span={18}>
            <Form.Item
              label={getLanguageLabel("table")}
              name="tableName"
              rules={[
                { required: true, message: "Please input your table name!" },
              ]}
            >
              <MtdInput />
            </Form.Item>
          </Col>
        </Row>

        {syncIndexes.map((syncIndex: TSyncIndex, _key: number) => {
          return (
            <div className={styles.indexRow}>
              <Select
                mode="multiple"
                value={syncIndex.columns}
                style={{ width: "100%" }}
                placeholder="Select column for Index"
                onChange={(option) => {
                  const _syncIndexes = [...syncIndexes];
                  _syncIndexes[_key].columns = option;
                  setSyncIndexes(_syncIndexes);
                }}
                optionLabelProp="label"
                options={columns}
              >
                {columns.map((option: TDatasetColumn) => (
                  <Select.Option value={option.value}>
                    <ColumnSelectLabel
                      name={option.name}
                      type={option.type}
                      datasetId={option.datasetId}
                    />
                  </Select.Option>
                ))}
              </Select>
              <MtdButton
                intent="dangerous"
                onClick={() => handleDeleteIndex(_key)}
                icon={<RemoveIcon />}
                icononly
                minimal
              >
                DELETE
              </MtdButton>
            </div>
          );
        })}

        <div className={styles.syncBodyBottomBtns}>
          <MtdButton
            icon={<AddIcon />}
            onClick={handleAddIndex}
            size={"small"}
            minimal
          >
            {getLanguageLabel("addIndex")}
          </MtdButton>
        </div>

        <br />
        <div className={styles.syncBodyBottomBtns}>
          <Form.Item name="autoSyncOnBuild" valuePropName="checked">
            <Checkbox>{getLanguageLabel("autoSyncOnDatasetBuild")}</Checkbox>
          </Form.Item>
          <Form.Item
            style={{
              width: "fit-content",
            }}
          >
            <MtdButton
              htmlType="submit"
              icon={<SyncIcon />}
              intent={intent}
              loading={loading}
            >
              {datasetSync.id ? "update & sync" : "create & sync"}
            </MtdButton>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

const CreateSyncBtn = ({
  datasetId,
  branch,
  datasetSyncs,
  setDatasetSyncs,
}: {
  datasetId: string;
  branch: string;
  datasetSyncs: TDatasetSync[];
  setDatasetSyncs: any;
}) => {
  const createNewSync = () => {
    const newSync: TDatasetSync = {
      key: generateKey("sync"),
      tableName: "untitled_table",
      id: undefined,
      datasetId: datasetId,
      branch: branch,
      sourceId: undefined,
      autoSyncOnBuild: false,
      createdAt: undefined,
      createdBy: undefined,
      updatedBy: undefined,
      updatedAt: undefined,
      syncIndexes: [],
    };
    setDatasetSyncs([...datasetSyncs, newSync]);
  };

  return (
    <Alert
      message={getLanguageLabel("databaseSync")}
      description={getLanguageLabel("createSyncViaSelectingSource")}
      type="info"
      showIcon
      action={
        <MtdButton onClick={() => createNewSync()} icon={<AddIcon />}>
          {getLanguageLabel("create")}
        </MtdButton>
      }
    />
  );
};

const DatasetSync = ({ datasetId, branch }: TSync) => {
  const [datasetSyncs, setDatasetSyncs] = useState<TDatasetSync[]>([]);
  const [loading, setLoading] = useState(false);
  const getDatasetSyncs = () => {
    setLoading(true);
    getDatasetSyncAPI(datasetId, branch)
      .then(({ data }) => {
        setDatasetSyncs(data);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isDefined(datasetId) && isDefined(branch)) {
      getDatasetSyncs();
    }
  }, [datasetId, branch]);

  if (loading) {
    return <MtdLoader />;
  }

  return (
    <div className={styles.wrapper}>
      <CreateSyncBtn
        datasetSyncs={datasetSyncs}
        setDatasetSyncs={setDatasetSyncs}
        datasetId={datasetId}
        branch={branch}
      />
      {datasetSyncs.length == 0 ? (
        <NoData
          icon={<WarningState />}
          heading={getLanguageLabel("noSyncsPresent")}
        />
      ) : (
        <Collapse>
          {datasetSyncs.map((datasetSync: TDatasetSync, _key: number) => (
            <Collapse.Panel
              header={
                <SyncHeader
                  datasetSync={datasetSync}
                  datasetSyncs={datasetSyncs}
                  setDatasetSyncs={setDatasetSyncs}
                />
              }
              key={_key}
            >
              <SyncBody
                datasetSync={datasetSync}
                datasetSyncs={datasetSyncs}
                setDatasetSyncs={setDatasetSyncs}
              />
            </Collapse.Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
};

export default DatasetSync;
