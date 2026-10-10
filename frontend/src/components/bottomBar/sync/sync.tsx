import { Collapse, message, Select, Typography } from "antd";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteSync, getSync } from "../../../redux/actions/datasetActions";
import { ThunkAppDispatch } from "../../../redux/types/store";

import { useNavigate } from "react-router-dom";

import {
  favIconLoading,
  getDefaultFavicon,
} from "components/mtdLoader/FavIconLoader";
import MtdModal from "components/CommonUI/MtdModalContainer";
import {
  getLanguageLabel,
  getSocketClient,
  isDefined,
  openNotification,
} from "utils/utilities";
import { CrossIcon, SyncIcon } from "../../../assets/icons/mtdActionIcons";
import MtdButton from "../../MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "../../mtdLoader";
import DatasetSync from "./Sync.view";

const { Text } = Typography;

const uuid = require("uuid");

interface TSync {
  id: string;
  branch: string;
  view: boolean;
}

export default function Sync({ id, branch, view }: TSync) {
  const navigate = useNavigate();
  const [createuser, setcreateuser] = useState("");
  const [updateuser, setupdateuser] = useState("");
  const [syncuser, setsyncuser] = useState("");
  const [refreshData, setRefreshData] = useState(false);

  const [webSocketConnection, setWebSocketConnection] = useState(false);

  const user_data = async (id: $TSFixMe, type: $TSFixMe) => {
    try {
      const { data } = await axios.get(`/passport/users/${id}`);
      if (type === "create") {
        setcreateuser(data);
      } else if (type === "update") {
        setupdateuser(data);
      } else if (type === "sync") {
        setsyncuser(data);
      }
    } catch (error) {
      openNotification(
        `Failed to access user details. Type : ${type}`,
        " ",
        "error"
      );
    }
  };

  useEffect(() => {
    dispatch(getSync(id, branch, message));

    const client = getSocketClient();

    client.onConnect = (frame) => {
      setWebSocketConnection(true);
      client.subscribe(`/topic/postgresSync/${id}/${branch}`, function (mail) {
        setSyncStatus(JSON.parse(mail.body).message);
        if (JSON.parse(mail.body).message === "success") {
          setRefreshData(true);
          dispatch(getSync(id, branch, message));
        }
      });
    };
    // For preventing multiple connections
    if (!webSocketConnection) {
      client.activate();
    }
  }, []);

  const [visible, setVisible] = useState(view);
  const { Panel } = Collapse;
  const { Option } = Select;
  const [datasetName, setDatasetName] = useState("");
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { data: datasetTable } = useSelector(
    (state) => (state as $TSFixMe).datasetTable
  );
  const { data: datasetSync, loading } = useSelector(
    (state) => (state as $TSFixMe).datasetSync
  );

  const [Index, setIndex] = useState(0);
  const [IndexData, setIndexData] = useState<any[]>();
  const [TableName, setTableName] = useState(
    datasetSync ? datasetSync.tableName : datasetName
  );
  const [enabled, setenabled] = useState(
    datasetSync ? datasetSync.enabled : true
  );

  const [syncStatus, setSyncStatus] = useState(
    datasetSync ? datasetSync.syncStatus : false
  );

  const columns: $TSFixMe = [];
  if (datasetTable && datasetTable.cols)
    datasetTable.cols.map((col: $TSFixMe) =>
      columns.push(<Option key={col.key}>{col.key}</Option>)
    );

  const syncNow = async () => {
    if (!datasetSync) {
      if (TableName === "") {
        openNotification(
          "Table Name cant be empty!",
          "Please enter any value into the table",
          "error"
        );
        return;
      }
      try {
        const { data } = await axios.get(
          `/synchro/PostgresSync/existsTable/${TableName}`
        );
        let Table = TableName;

        if (
          data &&
          (!datasetSync || (datasetSync && datasetSync.tableName !== TableName))
        ) {
          openNotification(
            "Table Name Already Exists",
            "Please enter any other name for the table",
            "warning"
          );
          let temp = uuid.v4();
          temp = temp.split("-").join("");
          Table = Table + temp;
        }

        await axios.post(`/synchro/PostgresSync`, {
          datasetId: id,
          branch: branch,
          tableName: Table,
          indexNames: IndexData?.slice(0, Index),
          enabled: enabled,
        });
        // setRefreshData(true);
        // dispatch(getSync(id, branch, message));
        setTableName(Table);
      } catch (error) {
        openNotification(
          "Failed to create Sync",
          "Sync creation failed",
          "error"
        );
      }
    } else {
      try {
        const { data } = await axios.get(
          `/synchro/PostgresSync/${id}/${branch}/perform`
        );
      } catch (error) {
        openNotification("Failed to perform Sync", " ", "error");
      }
    }
  };
  const deleteSyncFunc = () => {
    setRefreshData(true);
    dispatch(deleteSync(id, branch, message));
    setTableName(datasetName);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const loadName = async () => {
    try {
      const { data: datasetData } = await axios.get(`/kitab/${id}`);
      setDatasetName(datasetData.name);
    } catch (error) {
      openNotification(`Failed to fetch name`, " ", "error");
    }
  };

  const onAddIndex = () => {
    setIndex(Index + 1);
  };
  const onRemoveIndex = () => {
    setIndex(Index === 0 ? 0 : Index - 1);
  };
  const tableNameData = (e: $TSFixMe) => {
    const name = e.target.value;
    if (name.match("^[_a-zA-Z][a-zA-Z0-9 _-]*$")) {
      setTableName(name);
    } else {
      openNotification(
        "Invalid character",
        "Please enter a valid character",
        "error"
      );
    }
  };
  function onCheck(e: $TSFixMe) {
    setenabled(e.target.checked);
  }

  useEffect(() => {
    if (isDefined(id)) loadName();
  }, [id]);

  useEffect(() => {
    if (datasetSync) {
      setTableName(datasetSync.tableName);
      user_data(datasetSync.createdBy, "create");

      if (datasetSync.syncedBy !== null) {
        user_data(datasetSync.syncedBy, "sync");
      }

      if (datasetSync.updatedAt !== null && datasetSync.updatedBy)
        user_data(datasetSync.updatedBy, "update");
    } else {
      setTableName(datasetName);
    }
  }, [datasetSync]);

  useEffect(() => {
    favIconLoading(loading === true && !refreshData);
    return () => {
      let favicon = document.querySelector('link[rel="icon"]') as any;
      favicon.href = getDefaultFavicon();
    };
  }, [loading]);

  if (loading === true && !refreshData) return <MtdLoader />;

  return (
    <>
      <MtdModal
        headingIcon={<SyncIcon />}
        heading={getLanguageLabel("datasetSynchronistionStatus")}
        open={visible}
        onCancel={handleCancel}
        // className="dataset-sync"
        footerButtonArea={
          <MtdButton
            icon={<CrossIcon />}
            intent="none"
            key="back"
            onClick={() => handleCancel()}
          >
            {getLanguageLabel("close")}{" "}
          </MtdButton>
        }
      >
        <DatasetSync datasetId={id} branch={branch} />
        {/* <Collapse defaultActiveKey={["1"]}>
          <Panel
            header={getLanguageLabel("syncToPostgres")}
            key="1"
            // className="dataset-sync-row1"
          >
            <div className="dataset-sync-row1-subhead">
              <h6>{getLanguageLabel("syncPostgreMsg")}</h6>
            </div>
            <div className="dataset-sync-row1-create">
              <div className="dataset-sync-row1-create-table">
                <MtdInput
                  placeholder={getLanguageLabel("enterTableName")}
                  prefix={<TableIcon />}
                  suffix={
                    <Popover
                      title={getLanguageLabel("postgresTableName")}
                      content={getLanguageLabel("syncTableMsg1")}
                    >
                      <InfoIcon />
                    </Popover>
                  }
                  value={TableName}
                  onChange={tableNameData}
                />
              </div>
              <Text type="secondary">{getLanguageLabel("syncTableMsg2")}</Text>
              <div className="dataset-sync-row1-create-index">
                <h4>{getLanguageLabel("indexing")} &nbsp;</h4>
                <Tooltip title={getLanguageLabel("addIndexing")}>
                  <MtdButton
                    icononly
                    size="small"
                    // shape="circle"
                    icon={<AddIcon />}
                    onClick={onAddIndex}
                  />
                </Tooltip>
                &nbsp;
                <Tooltip title={getLanguageLabel("removeIndexing")}>
                  <MtdButton
                    icononly
                    size="small"
                    icon={<CrossIcon />}
                    onClick={onRemoveIndex}
                    intent={"dangerous"}
                  />
                </Tooltip>
              </div>

              {[...Array(Index)].map((e, i) => (
                <div style={{ display: "flex" }}>
                  <h5>
                    {getLanguageLabel("index")} {i} &nbsp;: &nbsp;{" "}
                  </h5>
                  <Select
                    mode="multiple"
                    maxTagCount="responsive"
                    allowClear
                    placeholder="Please select"
                    defaultValue={[]}
                    style={{
                      width: "fit-content",
                      marginBottom: "1rem",
                      minWidth: "10vw",
                    }}
                    onChange={(value) => {
                      const temp = [IndexData];
                      if (temp.length < i) temp.push([]);
                      temp[i] = value;
                      setIndexData(temp);
                    }}
                  >
                    {columns}
                  </Select>
                </div>
              ))}

              <Checkbox
                onChange={onCheck}
                checked={enabled}
                style={{ width: "fit-content" }}
              >
                {getLanguageLabel("enable")}
              </Checkbox>
            </div>

            <div className="dataset-sync-row1-btns">
              <div style={{ marginTop: "1%" }}>
                {syncStatus === "active" ? (
                  <Text type="secondary">
                    <div className="text-and-icon-center">
                      <MtdLoader size="small" />
                      {getLanguageLabel("datasetSynchronisationInProgess")}
                    </div>
                  </Text>
                ) : (
                  <>
                    <MtdButton
                      icon={datasetSync ? <RefreshIcon /> : <AddIcon />}
                      intent="action"
                      onClick={() => syncNow()}
                    >
                      {datasetSync
                        ? getLanguageLabel("syncNow")
                        : getLanguageLabel("createSync")}
                    </MtdButton>
                    &nbsp;
                    {datasetSync ? (
                      <MtdButton
                        icon={<TrashIcon />}
                        intent="dangerous"
                        onClick={() => deleteSyncFunc()}
                      >
                        {" "}
                        {getLanguageLabel("deleteSync")}{" "}
                      </MtdButton>
                    ) : (
                      ""
                    )}
                  </>
                )}
              </div>

              {datasetSync ? (
                <Alert
                  message={getLanguageLabel("syncPresent")}
                  type="success"
                  showIcon
                />
              ) : (
                <Alert
                  message={getLanguageLabel("syncNotPresent")}
                  type="error"
                  showIcon
                />
              )}
            </div>

            {datasetSync ? (
              <div className="dataset-sync-row1-information">
                <table width="calc(365vw+ 0%)">
                  <tbody>
                    {datasetSync.finishedAt ? (
                      <tr>
                        <th>{getLanguageLabel("synced")} </th>
                        &nbsp; &nbsp;
                        <td>
                          <div style={{ display: "inline" }}>
                            <Tooltip
                              title={timeConverter(
                                datasetSync?.finishedAt as $TSFixMe
                              )}
                            >
                              {getTimeDisplay(
                                datasetSync?.finishedAt as $TSFixMe
                              )}
                            </Tooltip>
                            {", took "}{" "}
                            {millisecondsToStr(
                              datasetSync.finishedAt - datasetSync.startedAt
                            )}
                            {datasetSync.syncedBy ? (
                              <UserInfo userId={datasetSync.syncedBy} />
                            ) : (
                              <></>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <></>
                    )}
                    <tr>
                      <th>{getLanguageLabel("created")}</th>
                      &nbsp; &nbsp;
                      <td>
                        <>
                          <Tooltip
                            title={timeConverter(
                              datasetSync?.createdAt as $TSFixMe
                            )}
                          >
                            {getTimeDisplay(datasetSync?.createdAt as $TSFixMe)}
                          </Tooltip>
                          {" by "}
                          <UserInfo userId={datasetSync.createdBy} />
                        </>
                      </td>
                    </tr>
                    {datasetSync.updatedAt ? (
                      <tr>
                        <th>{getLanguageLabel("updated")} </th>
                        &nbsp; &nbsp;
                        <td>
                          <div style={{ display: "inline" }}>
                            {datasetSync?.updatedAt ? (
                              <Tooltip
                                title={timeConverter(
                                  datasetSync?.updatedAt as $TSFixMe
                                )}
                              >
                                {getTimeDisplay(
                                  datasetSync?.updatedAt as $TSFixMe
                                )}
                              </Tooltip>
                            ) : (
                              "--"
                            )}
                            {" by "}
                            &nbsp;
                            <UserInfo userId={datasetSync.updatedBy} />
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <></>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <></>
            )}
          </Panel>
        </Collapse> */}
      </MtdModal>
    </>
  );
}
