import Editor from "@monaco-editor/react";
import { Checkbox, Col, Row, Select, Switch, Typography } from "antd";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { LinkIcon } from "../../../assets/icons/mtdActionIcons";
import { GitNewBranchIcon } from "../../../assets/icons/mtdExternalIcons";
import { FolderIcon } from "../../../assets/icons/mtdFileIcons";
import { KeyIcon } from "../../../assets/icons/mtdInterfaceIcons";
import {
  LibraryIcon,
  LightBulbIcon,
} from "../../../assets/icons/mtdMiscellaneousIcons";
import {
  SingleChevronRightIcon,
  TickIcon,
} from "../../../assets/icons/mtdNavigationIcon";
import { TableIcon } from "../../../assets/icons/mtdTableIcons";
import { createLink, listLinks } from "../../../redux/actions/linkActions";

import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import {
  deleteSchedulesByResourceIdAPI,
  getSchedulesAPI,
  putScheduleAPI,
} from "components/bottomBar/Schedules/api";
import CronJobInput from "components/common/CronJob";
import {
  decodeFromBase64,
  encodeToBase64,
  getLanguageLabel,
  getSourceIcon,
  isCurrentConfigThemeDark,
  isDefined,
  notEmpty,
  openNotification,
} from "utils/utilities";
import { listSources } from "../../../redux/actions/sourceActions";
import { ThunkAppDispatch } from "../../../redux/types/store";
import {
  ConnectBuildAPI,
  handleConnectUpdateAPI,
  isDatasetFreeToLinkAPI,
} from "../Connect.api";

import { ResourceTypeEnum } from "Apps/explorer/explorer.utils";
import { SourceIcon } from "assets/icons/mtdDataIcons";
import {
  JobStatusEnum,
  ScheduleTriggerType,
} from "components/bottomBar/Schedules/SchedulesModal.constants";
import { TScheduleJobInfo } from "components/bottomBar/Schedules/SchedulesModal.types";
import { useOnlyOnce } from "hooks/useEffectOnlyOnce";
import {
  useFileExplorerService,
  useResourceHook,
} from "hooks/useFileExplorerService";
import { openFileExplorerModal } from "../../../redux/ModalSlice";
import { initialLinkDetails } from "./Link.constants";
import { SourceButtonPopover } from "./SourceButtonPopover";

const { Text } = Typography;

const LinkModal = ({
  isVisible,
  setIsVisible,
  updateDetails,
  defaultParent,
  defaultSource,
}: any) => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);

  const [newLinkDetails, setNewLinkDetails] = useState({
    ...initialLinkDetails,
  });

  const { getFileIndex, fetchResource } = useFileExplorerService();

  const { sources } = useSelector((state) => (state as $TSFixMe).sourceList);

  const [selectedDataset, setSelectedDataset] = useState(null);
  const [sourceType, setSourceType] = useState("");
  const [code, setCode] = useState("");
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [parentPath, setParentPath] = useState<any[]>([]);

  const addDataset = ({ id, path, name }: any) => {
    isDatasetFreeToLinkAPI(id).then(({ data }) => {
      if (data) {
        setNewLinkDetails({ ...newLinkDetails, datasetId: id });
        setSelectedDataset(name);
      } else openNotification("Dataset Already Connected", "", "error");
    });
  };

  const addSourceDetails = ({ id, path, name, subType }: any) => {
    setNewLinkDetails({
      ...newLinkDetails,
      sourceId: id,
    });
    const targetSource: any = sources?.find((source: any) => source.id == id);
    setSelectedSource(targetSource);
    setSourceType(targetSource.type);
  };
  const addParentFolder = ({ id, path, name }: any) => {
    setNewLinkDetails({ ...newLinkDetails, parent: id });
    setSelectedParent(name);
    setParentPath(path);
  };

  const build = (id: $TSFixMe) => {
    ConnectBuildAPI(id)
      .then(({ data }) =>
        openNotification(
          "Build Started",
          <a href={`/portal/builds/${data.id}`}>Click to view logs</a>,
          "success"
        )
      )
      .catch((error) =>
        openNotification(
          "Build Failed",
          <a href={`/portal/builds`}>Click to view logs</a>,
          "warning"
        )
      );
  };

  const setCronExpression = (exp: $TSFixMe) => {
    setNewLinkDetails({ ...newLinkDetails, cronExpression: exp });
  };

  const resetState = () => {
    setIsVisible(false);
    setSelectedParent(null);
    setSelectedDataset(null);
    setNewLinkDetails({ ...initialLinkDetails });
    console.log("CULPRIT 5");
  };

  useOnlyOnce(
    () => {
      if (!sources) {
        console.log("CULPRIT 4 ", sources);
        dispatch(listSources());
      }
    },
    () => sources
  );

  const handleOk = async () => {
    if (sourceType === "FOLDER" && !newLinkDetails.script) {
      openNotification(
        "Details Incomplete",
        "Sub Folder is not defined.",
        "warning"
      );
      return;
    } else if (sourceType === "jdbc" && !code) {
      openNotification(
        "Details Incomplete",
        "There has to be a simple SQL query",
        "warning"
      );
      return;
    }
    if (
      !(newLinkDetails.name && newLinkDetails.sourceId && newLinkDetails.parent)
    ) {
      openNotification(
        "Details incomplete",
        "Please enter the complete details.",
        "warning"
      );
      return;
    }
    if (!newLinkDetails.dataLiveLoad) {
      if (!(newLinkDetails.datasetId && newLinkDetails.branch)) {
        openNotification(
          "Details incomplete",
          "Dataset and branch needs to be selected for Store.",
          "warning"
        );
        return;
      }

      if (
        newLinkDetails.trigger === ScheduleTriggerType.CRON &&
        !newLinkDetails.trigger
      ) {
        openNotification(
          "Details incomplete",
          "Please schedule details.",
          "warning"
        );
        return;
      }
    }
    let script;
    if (sourceType === "FOLDER") {
      newLinkDetails.type = "FOLDER";
      script = newLinkDetails.script;
    } else if (sourceType === "jdbc") {
      newLinkDetails.type = "JDBC";
      script = encodeToBase64(code);
    }

    await dispatch(
      createLink({
        name: newLinkDetails.name,
        description: newLinkDetails.description,
        script: script,
        type: newLinkDetails.type,
        datasetId: newLinkDetails.datasetId,
        branch: newLinkDetails.branch,
        sourceId: newLinkDetails.sourceId,
        parent: newLinkDetails.parent,
        dataLiveLoad: newLinkDetails.dataLiveLoad,
        saveMode: newLinkDetails.saveMode,
        trigger: newLinkDetails.trigger,
        cronExpression: newLinkDetails.cronExpression,
      })
    ).then((data: $TSFixMe) => {
      fetchResource(data.id);
      if (newLinkDetails.trigger == ScheduleTriggerType.CRON) {
        const schedulePayload: TScheduleJobInfo = {
          resourceId: data.id,
          resourceType: ResourceTypeEnum.CONNECT,
          branch: "master",
          jobStatus: JobStatusEnum.RUNNING,
          jobClass: "connect",
          triggerType: ScheduleTriggerType.CRON,
          triggers: [
            {
              triggerValue: newLinkDetails.cronExpression,
            },
          ],
        };

        putScheduleAPI(schedulePayload).then(() => {
          if (newLinkDetails.build) {
            build(data.id);
          }

          dispatch(listLinks());
          resetState();
        });
      } else {
        if (newLinkDetails.build) {
          build(data.id);
        }

        dispatch(listLinks());
        resetState();
      }
    });
  };

  const handleUpdate = async () => {
    if (sourceType === "FOLDER" && !newLinkDetails.script) {
      openNotification(
        "Details Incomplete",
        "Please enter Sub Folder directory.",
        "warning"
      );
      return;
    } else if (sourceType === "jdbc" && !code) {
      openNotification(
        "Details Incomplete",
        "There has to be a simple SQL query",
        "warning"
      );
      return;
    }
    if (
      !(newLinkDetails.name && newLinkDetails.sourceId && newLinkDetails.parent)
    ) {
      openNotification(
        "Details incomplete",
        "Please enter the complete details.",
        "warning"
      );
      return;
    }

    if (!newLinkDetails.dataLiveLoad) {
      if (!(newLinkDetails.datasetId && newLinkDetails.branch)) {
        openNotification(
          "Details incomplete",
          "Dataset and branch needs to be selected for Store.",
          "warning"
        );
        return;
      }

      if (
        newLinkDetails.trigger === ScheduleTriggerType.CRON &&
        !newLinkDetails.trigger
      ) {
        openNotification(
          "Details incomplete",
          "Please schedule details.",
          "warning"
        );
        return;
      }
    }
    let script;
    if (sourceType === "FOLDER") {
      newLinkDetails.type = "FOLDER";
      script = newLinkDetails.script;
    } else if (sourceType === "jdbc") {
      newLinkDetails.type = "JDBC";
      script = encodeToBase64(code);
    }

    const body = {
      id: updateDetails.linkDetails.id,
      name: newLinkDetails.name,
      description: newLinkDetails.description,
      script: script,
      type: newLinkDetails.type,
      datasetId: newLinkDetails.datasetId,
      branch: newLinkDetails.branch,
      sourceId: newLinkDetails.sourceId,
      dataLiveLoad: newLinkDetails.dataLiveLoad,
      parent: newLinkDetails.parent,
      saveMode: newLinkDetails.saveMode,
      trigger: newLinkDetails.trigger,
      cronExpression: newLinkDetails.cronExpression,
    };
    handleConnectUpdateAPI("link", JSON.stringify(body)).then(
      async ({ data }) => {
        if (
          isDefined(data) &&
          isDefined(data.status) &&
          data.status === "FAILED"
        ) {
          openNotification("Error", data.message, "error");
          return;
        }

        if (newLinkDetails.trigger == ScheduleTriggerType.CRON) {
          const result = await getSchedulesAPI(
            updateDetails.linkDetails.id,
            "master",
            ResourceTypeEnum.CONNECT
          );
          let currentSchedule = null;
          if (result.length != 0) {
            currentSchedule = result[0];
          }

          const schedulePayload: TScheduleJobInfo = {
            resourceId: updateDetails.linkDetails.id,
            resourceType: ResourceTypeEnum.CONNECT,
            branch: "master",
            jobStatus: JobStatusEnum.RUNNING,
            jobClass: "connect",
            triggerType: ScheduleTriggerType.CRON,
            triggers: [
              {
                triggerValue: newLinkDetails.cronExpression,
              },
            ],
          };

          if (currentSchedule) {
            schedulePayload.jobId = currentSchedule.jobId;
          }

          putScheduleAPI(schedulePayload);
        } else {
          deleteSchedulesByResourceIdAPI(updateDetails.linkDetails.id);
        }

        if (newLinkDetails.build) {
          build(updateDetails.linkDetails.id);
        }

        dispatch(listLinks());
        updateDetails.updateLink();
        resetState();
      }
    );
  };

  useResourceHook(defaultParent, {
    resolveCallback: (data: { name: React.SetStateAction<string | null> }) => {
      setSelectedParent(data.name);
      setNewLinkDetails({ ...newLinkDetails, parent: defaultParent });
      console.log("CULPRIT 3");
    },
  });

  useOnlyOnce(
    () => {
      if (notEmpty(defaultSource) && notEmpty(sources)) {
        let _source = sources?.find(
          (source: any) => source.id == defaultSource
        );

        setSelectedSource(_source);
        setSourceType(_source.type);
        setNewLinkDetails({ ...newLinkDetails, sourceId: defaultSource });

        if (!defaultParent && selectedParent == undefined && _source.parent) {
          getFileIndex(_source.parent).then((data) => {
            setSelectedParent(data.name);
            setNewLinkDetails({ ...newLinkDetails, parent: _source.parent });
          });
        }
      }
      console.log("CULPRIT 1");
    },
    () => notEmpty(defaultSource) && notEmpty(sources)
  );

  useEffect(() => {
    if (updateDetails) {
      setSelectedSource(updateDetails.source);
      setNewLinkDetails({ ...updateDetails.linkDetails });
      if (
        updateDetails.source.type == "jdbc" &&
        isDefined(updateDetails.linkDetails.script)
      )
        setCode(decodeFromBase64(updateDetails.linkDetails.script));
      if (updateDetails.parent) setSelectedParent(updateDetails.parent.name);
      if (updateDetails.dataset) setSelectedDataset(updateDetails.dataset.name);
      if (updateDetails.source) setSourceType(updateDetails.source.type);
    }
    console.log("CULPRIT 2");
  }, []);

  // console.log("FOUND IT 2");

  return (
    <>
      <MtdModal
        destroyOnClose
        headingIcon={<LinkIcon />}
        heading={getLanguageLabel("dataLink")}
        // Add subheading {LINK_MESSAGE}
        extraActionHeading={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {!newLinkDetails.dataLiveLoad && (
              <>
                {getLanguageLabel("buildNow")}
                <Switch
                  size="small"
                  defaultChecked={newLinkDetails.build}
                  // defaultChecked={true}
                  onChange={(val: boolean) => {
                    setNewLinkDetails({ ...newLinkDetails, build: val });
                  }}
                />
              </>
            )}
          </div>
        }
        footerExtraText={getLanguageLabel("connectAdminOnlyMessage")}
        footerButtonArea={
          <MtdButton
            intent="primary"
            onClick={updateDetails ? handleUpdate : handleOk}
            icon={<TickIcon />}
            textTransform="none"
          >
            {updateDetails
              ? getLanguageLabel("update")
              : getLanguageLabel("create")}
          </MtdButton>
        }
        information={
          <div style={{ width: "300px" }}>
            <div style={{ padding: "20px" }}>
              <div className="text-and-icon-align">
                <LightBulbIcon />
                <Text strong>{getLanguageLabel("datasetLinks")}</Text>
              </div>
              <div style={{ paddingTop: "10px", paddingLeft: "20px" }}>
                {getLanguageLabel("linkInfo")}
              </div>
            </div>
            <div style={{ padding: "20px" }}>
              <div className="text-and-icon-align">
                <LibraryIcon />
                <Text strong>{getLanguageLabel("learn")}</Text>
              </div>
              <div style={{ paddingTop: "10px", paddingLeft: "20px" }}>
                <Link to="/learn/">DataConnection Guidelines</Link>
                <br />
                <Link to="/learn/">Best Practices</Link>
                <br />
                <Link to="/learn/">Data Transfer Security</Link>
                <br />
                <Link to="/learn/">Governance Policy and Guidelines</Link>
              </div>
            </div>
            <div style={{ padding: "20px" }}>
              <div className="text-and-icon-align">
                <KeyIcon />
                <Text strong>{getLanguageLabel("access")}</Text>
              </div>
              <div style={{ paddingTop: "10px", paddingLeft: "20px" }}>
                {getLanguageLabel("dataIngestionRestriction")}
              </div>
            </div>
          </div>
        }
        open={isVisible}
        onOk={handleOk}
        width={900}
        onCancel={() => setIsVisible(false)}
      >
        <Text type="secondary" strong>
          {getLanguageLabel("general").toUpperCase()}
        </Text>
        <Row
          justify={"space-between"}
          align="middle"
          style={{ marginTop: "5px" }}
          gutter={[16, 16]}
        >
          <Col span={8}>
            <Text>{getLanguageLabel("name")}</Text>
          </Col>
          <Col span={16}>
            <MtdInput
              variant="borderless"
              autofocus
              onChange={(e) =>
                setNewLinkDetails({
                  ...newLinkDetails,
                  name: e.target.value,
                })
              }
              value={newLinkDetails.name}
              required
            />
          </Col>
        </Row>

        <Row
          justify={"space-between"}
          align="top"
          style={{ marginTop: "10px" }}
          gutter={[16, 16]}
        >
          <Col span={8}>
            <Text>{getLanguageLabel("description")}</Text>
          </Col>
          <Col span={16}>
            <MtdInput
              onChange={(e) =>
                setNewLinkDetails({
                  ...newLinkDetails,
                  description: e.target.value,
                })
              }
              value={newLinkDetails.description}
              required
            />
          </Col>
        </Row>
        <Row
          justify={"space-between"}
          align="top"
          gutter={[16, 16]}
          style={{
            marginTop: "5px",
          }}
        >
          <Col span={8}>{getLanguageLabel("parentFolder")}</Col>
          <Col span={16}>
            <MtdButton
              icon={<FolderIcon />}
              onClick={() => {
                dispatch(
                  openFileExplorerModal({
                    type: ["FOLDER"],
                    action: (data) => {
                      addParentFolder(data);
                    },
                    activeId: defaultParent,
                  })
                );
              }}
              intent={selectedParent ? "success" : "warning"}
            >
              {selectedParent
                ? selectedParent
                : getLanguageLabel("parentFolder")}
            </MtdButton>

            {notEmpty(parentPath) ? (
              <Text
                type="secondary"
                style={{
                  marginTop: "5px",
                  fontSize: "0.7rem",
                }}
              >
                <div
                  style={{
                    flexDirection: "row",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginRight: "1rem",
                      fontSize: "0.7rem",
                    }}
                  >
                    {getLanguageLabel("selected")}:
                  </div>
                  {parentPath?.map((p, idx) => (
                    <div style={{ display: "flex", fontSize: "0.7rem" }}>
                      <>{p.name}</>
                      {idx + 1 != parentPath.length && (
                        <SingleChevronRightIcon />
                      )}
                    </div>
                  ))}
                </div>
              </Text>
            ) : (
              <Text
                type="secondary"
                style={{
                  marginTop: "5px",
                  fontSize: "0.7rem",
                }}
              >
                {getLanguageLabel("folderPlacement")}
              </Text>
            )}
          </Col>
        </Row>
        <br />

        <Row
          style={{
            marginTop: "5px",
          }}
          gutter={[16, 16]}
        >
          <Col span={8}>
            <Text type="secondary" strong>
              {"Data Loading".toUpperCase()}
            </Text>
          </Col>
          <Col span={16}>
            <Switch
              size="small"
              defaultChecked={newLinkDetails.dataLiveLoad}
              onChange={(val: boolean) =>
                setNewLinkDetails({
                  ...newLinkDetails,
                  dataLiveLoad: val,
                  datasetId: "",
                  build: false,
                })
              }
              checkedChildren={"LINK"}
              unCheckedChildren={"STORE"}
            />{" "}
            <Text type="secondary" style={{ fontSize: "0.8rem" }}>
              {newLinkDetails.dataLiveLoad
                ? getLanguageLabel("directDataAccess")
                : getLanguageLabel("storeData")}
            </Text>
          </Col>
        </Row>
        {!newLinkDetails.dataLiveLoad && (
          <Row
            gutter={[16, 16]}
            style={{
              marginTop: "1rem",
            }}
          >
            <Col span={8}>
              <Text>
                {getLanguageLabel("dataset")} & {getLanguageLabel("branch")}
              </Text>
            </Col>
            <Col span={16}>
              <Row gutter={[16, 16]}>
                <Col span={16}>
                  <MtdButton
                    fill
                    intent={selectedDataset ? "success" : "warning"}
                    icon={<TableIcon />}
                    onClick={() => {
                      dispatch(
                        openFileExplorerModal({
                          type: ["DATASET"],
                          action: (data) => {
                            addDataset(data);
                          },
                          activeId: defaultParent,
                        })
                      );
                    }}
                  >
                    {selectedDataset
                      ? selectedDataset
                      : getLanguageLabel("dataset")}
                  </MtdButton>
                </Col>
                <Col span={8}>
                  <div className="text-and-icon-center">
                    <MtdInput
                      // prefix={}
                      value={newLinkDetails.branch}
                      onChange={(e) =>
                        setNewLinkDetails({
                          ...newLinkDetails,
                          branch: e.target.value,
                        })
                      }
                      required
                      readOnly
                      suffix={<GitNewBranchIcon />}
                    />
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        )}

        <br />

        <Text type="secondary" strong>
          {getLanguageLabel("dataSource").toUpperCase()}
        </Text>
        <Row
          gutter={[16, 16]}
          style={{
            marginTop: "5px",
          }}
        >
          <Col span={8}>
            <Text>{getLanguageLabel("dataSource")}</Text>
          </Col>
          <Col span={16}>
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
                      activeId: defaultParent,
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
          </Col>
        </Row>

        {sourceType == "FOLDER" || sourceType == "rest" ? (
          <Row
            gutter={[16, 16]}
            style={{
              marginTop: "5px",
            }}
          >
            <Col span={8}>
              <Text>{getLanguageLabel("subFolder")}</Text>
            </Col>
            <Col span={16}>
              <MtdInput
                onChange={(e) =>
                  setNewLinkDetails({
                    ...newLinkDetails,
                    script: e.target.value,
                  })
                }
                value={newLinkDetails.script}
                required
              />
            </Col>
          </Row>
        ) : (
          sourceType == "jdbc" && (
            <Row
              gutter={[16, 16]}
              style={{
                marginTop: "5px",
              }}
            >
              <Col span={8} style={{ display: "flex", alignItems: "center" }}>
                <Text>{getLanguageLabel("query")}</Text>
              </Col>
              <Col span={16}>
                <div
                  style={{
                    border: "1px solid var(--movetodata-border-color-default)",
                  }}
                >
                  <Editor
                    height="20vh"
                    defaultLanguage="sql"
                    theme={isCurrentConfigThemeDark(user) ? "vs-dark" : "light"}
                    onChange={(value, event) => {
                      setCode(value as string);
                    }}
                    value={code}
                    options={{
                      minimap: {
                        enabled: false,
                      },
                      fontSize:
                        isDefined(user.preferences) &&
                        isDefined(user.preferences.fontSize)
                          ? user.preferences.fontSize
                          : "16",
                      lineHeight: 19,
                      lineNumbersMinChars: 2,

                      fontFamily:
                        '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
                    }}

                    // onChange={(e) =>
                    //   setNewLinkDetails({
                    //     ...newLinkDetails,
                    //     query: e.target.value,
                    //   })
                    // }
                  />
                </div>

                {/* <TextArea
                        onChange={(e) =>
                          setNewLinkDetails({
                            ...newLinkDetails,
                            query: e.target.value,
                          })
                        }
                        value={newLinkDetails.query}
                        required
                        style={{ width: "20vw", minWidth: "300px" }}
                      /> */}
              </Col>
            </Row>
          )
        )}
        <br />

        {!newLinkDetails.dataLiveLoad && (
          <>
            <Text type="secondary" strong>
              {getLanguageLabel("additional").toUpperCase()} (
              {getLanguageLabel("optional").toUpperCase()})
            </Text>

            {sourceType == "FOLDER" && (
              <>
                <Row
                  gutter={[16, 16]}
                  style={{
                    marginTop: "5px",
                  }}
                >
                  <Col span={8}>
                    <Text>{getLanguageLabel("delete")}</Text>
                  </Col>
                  <Col span={16}>
                    <Checkbox
                      onChange={(e) =>
                        setNewLinkDetails({
                          ...newLinkDetails,
                          deleteFilesAfterUpload:
                            newLinkDetails.deleteFilesAfterUpload,
                        })
                      }
                      defaultChecked={newLinkDetails.deleteFilesAfterUpload}
                    />
                    &nbsp;&nbsp;
                    <Text
                      style={{
                        marginTop: "0px",
                        fontSize: "0.7rem",
                      }}
                    >
                      {getLanguageLabel("deleteFilesAfterUpload")}
                    </Text>
                  </Col>
                </Row>
              </>
            )}

            <Row
              gutter={[16, 16]}
              style={{
                marginTop: "5px",
              }}
            >
              <Col span={8}>
                <Text>{getLanguageLabel("saveMode")}</Text>
              </Col>
              <Col span={16}>
                <Select
                  id="saveMode"
                  value={newLinkDetails.saveMode}
                  onChange={(e) => {
                    setNewLinkDetails({
                      ...newLinkDetails,
                      saveMode: e,
                    });
                  }}
                  style={{ width: "100%" }}
                >
                  <Select.Option value="overwrite">
                    {getLanguageLabel("snapshot")}
                  </Select.Option>
                  <Select.Option value="append">
                    {getLanguageLabel("incremental")}
                  </Select.Option>
                </Select>
              </Col>
            </Row>

            <Row
              gutter={[16, 16]}
              style={{
                marginTop: "5px",
              }}
            >
              <Col span={8}>
                <Text>{getLanguageLabel("trigger")}</Text>
              </Col>
              <Col span={16}>
                <Select
                  id="trigger"
                  value={newLinkDetails.trigger}
                  onChange={(e) =>
                    setNewLinkDetails({
                      ...newLinkDetails,
                      trigger: e,
                    })
                  }
                  style={{ width: "100%" }}
                >
                  <Select.Option value={ScheduleTriggerType.NONE}>
                    {getLanguageLabel("none")}
                  </Select.Option>
                  <Select.Option value={ScheduleTriggerType.CRON}>
                    {getLanguageLabel("schedules")}
                  </Select.Option>
                </Select>
              </Col>
            </Row>

            {newLinkDetails.trigger === ScheduleTriggerType.CRON && (
              <Row
                gutter={[16, 16]}
                style={{
                  marginTop: "5px",
                }}
              >
                <Col span={8}>
                  <Text>Cron</Text>
                </Col>
                <Col span={16}>
                  <CronJobInput
                    cronExpression={newLinkDetails.cronExpression}
                    setCronExpression={setCronExpression}
                  />
                </Col>
              </Row>
            )}
            <br />
          </>
        )}
      </MtdModal>
    </>
  );
};

export default LinkModal;
