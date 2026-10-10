import { Col, Divider, Row, Tabs, Tooltip, Typography } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import { BuildIcon } from "assets/icons/mtdActionIcons";
import { PopOutIcon } from "assets/icons/mtdNavigationIcon";
import { TableIcon } from "assets/icons/mtdTableIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { CollapserHandler } from "components/MtdComponents/ResizablePane/ResizablePaneUtil";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Link, useNavigate } from "react-router-dom";
// @ts-ignore
import { AnyAction } from "../../redux";
import { getBuildLog } from "../../redux/actions/datasetActions";

import { SearchEmptyState } from "assets/Illustrations/EmptyState";
import axios from "axios";
import NoData from "components/CommonUI/NoData";
import MtdLoader from "components/mtdLoader";
import { TPlatformPage } from "global";
import { RootState } from "redux/types/store";
import {
  getLanguageLabel,
  getSocketClient,
  openNotification,
  timeConverter,
} from "utils/utilities";
import BuildDetailsSummary from "./BuildDetailsSummary";
import BuildSparkTab from "./BuildSparkTab";
import BuildSpecTab from "./BuildSpecTab";
import BuildSteps from "./BuildSteps";
import { fetchBuildSpecificationsByBuildId } from "./Builds.api";
import { ABORTED, CONNECT, DATASET, FINISHED } from "./Builds.constants";
import { TBuildLog, TBuildSpec } from "./Builds.types";
import BuildTableDatasetWritingTransactionActive from "./Components/BuildTableDatasetWritingTransactionActive";
import DetailedLog from "./DetailedLog";
import PreviewResultDataset from "./PreviewResultDataset";

const { Text } = Typography;

interface TProps {
  showHeader?: boolean;
  id: string;
  page?: TPlatformPage;
  buildType?: "PREVIEW" | "DEFAULT";
  showEmpty?: boolean;
}

const BuildDetailsTable = ({
  showHeader = true,
  id,
  page = "BUILD",
  buildType = "DEFAULT",
  showEmpty = false,
}: TProps) => {
  const user = useSelector((state: RootState) => state.userDetails.user);
  const navigate = useNavigate();
  const primaryPanelRef = useRef<any>(null);

  const [datasetBuildLog, setDatasetBuildLog] = useState<TBuildLog | undefined>(
    undefined
  );
  const [buildSpec, setBuildSpec] = useState<TBuildSpec[] | undefined>(
    undefined
  );
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("1");
  const [datasetDetails, setDatasetDetails] = useState<Map<string, string>>(
    new Map()
  );
  const [previewResultsTab, setPreviewResultsTab] = useState<
    {
      name: string;
      data: any;
    }[]
  >([]);

  const buildStatusHelper = (data: TBuildLog) => {
    Promise.all(
      [
        ...data.startingLogMessages,
        ...data.preparingLogMessages,
        ...data.runningLogMessages,
        ...data.finishedLogMessages,
      ].map(async (log: any) => {
        const match = log.message.match(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
        );
        if (match) {
          setDatasetDetails((prevDatasetDetails) => {
            let newDatasetDetails = prevDatasetDetails;

            newDatasetDetails.set(
              match[0],
              "/portal/kitab/dataset/" + match[0] + "/" + data.branch
            );
            return newDatasetDetails;
          });
        }
      })
    ).then(() => setDatasetBuildLog(data));
  };
  const buildStatus = (data?: undefined | TBuildLog) => {
    if (data) {
      buildStatusHelper(data);
    } else {
      dispatch(getBuildLog(id) as unknown as AnyAction).then((data: any) => {
        if (data) {
          buildStatusHelper(data);
        }
      });
    }
  };

  const getBuildSpecificationsByBuildId = (log: any) => {
    fetchBuildSpecificationsByBuildId(log.id).then(({ data }) => {
      setBuildSpec(data);
    });
  };

  const onBuild = async (buildId: string, buildType: "DEFAULT" | "PREVIEW") => {
    try {
      await axios
        .post(`/build/build/${DATASET}`, {
          buildId: buildId,
          buildType: buildType,
        })
        .then(({ data }: any) => {
          navigate(`/portal/builds/${data.id}`);
        })
        .catch(({ response }: any) => {
          openNotification(
            response.data.error,
            response.data.description,
            "error"
          );
        });
    } catch (error) {
      openNotification(
        `Failed to Build`,
        <a href={`/portal/builds`}>Click to view logs</a>,
        "error"
      );
    }
  };

  const createPreviewResultTab = (tabName: string, data: any) => {
    setPreviewResultsTab((_preview) => {
      return [
        ..._preview,
        {
          name: tabName,
          data: data,
        },
      ];
    });
  };

  useEffect(() => {
    const client = getSocketClient();
    client.activate();

    client.onConnect = (frame) => {
      client.subscribe(`/topic/build/${id}/${user.id}`, (mail) => {
        const msg = JSON.parse(mail.body).message;
        const information = JSON.parse(mail.body).information;
        const tabName = JSON.parse(mail.body).tabName ? (
          <div className="text-and-icon-center">
            <TableIcon color={"#4C90F0"} /> {JSON.parse(mail.body).tabName}
          </div>
        ) : (
          getLanguageLabel("result")
        );
        // if (msg === FAILED || msg === SUCCESS || msg === ABORTED)
        if (msg === "logUpdated" || msg == ABORTED) {
          console.log("USER IS : ", user.id);
          if (information) {
            buildStatus(JSON.parse(information));
          } else {
            buildStatus();
          }
        } else if (msg === "preview") {
          if (buildType == "PREVIEW") {
            setActiveTab("3");
            createPreviewResultTab(tabName, JSON.parse(information));
          }
        }
      });
      buildStatus();
    };

    return () => {
      setActiveTab("1");
      setDatasetBuildLog(undefined);
      client.deactivate();
    };
  }, [id]);

  useEffect(() => {
    setPreviewResultsTab([]);
  }, [id]);

  useEffect(() => {
    if (datasetBuildLog && datasetBuildLog.stage == FINISHED) {
      getBuildSpecificationsByBuildId(datasetBuildLog);
    }
  }, [datasetBuildLog]);

  if (showEmpty)
    return (
      <NoData
        heading={getLanguageLabel("startBuildToResultsHere")}
        icon={<SearchEmptyState />}
      />
    );

  if (!datasetBuildLog) return <MtdLoader />;

  return (
    <div
      style={{
        height: "100%",
        minHeight: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {page == "BUILD" && (
        <BuildDetailsSummary
          buildLog={datasetBuildLog}
          buildSpecs={buildSpec}
        />
      )}
      <div
        style={{
          height: "100%",
          borderTop: "1px solid var(--movetodata-border-color-muted)",
          minHeight: "0",
          flex: 1,
        }}
      >
        <PanelGroup direction={"horizontal"}>
          <Panel collapsible={true} defaultSize={20} ref={primaryPanelRef}>
            <div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",

                  padding: "0.75rem",
                  borderBottom: "1px solid var(--movetodata-border-color-muted)",
                }}
              >
                <div>
                  <Text type="secondary">
                    {getLanguageLabel("steps").toUpperCase()}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">
                    {getLanguageLabel("duration").toUpperCase()}
                  </Text>
                </div>
              </div>

              <BuildSteps datasetBuildLog={datasetBuildLog} />
            </div>
          </Panel>
          <PanelResizeHandle className="resizablePane-collapser">
            <CollapserHandler primaryPanelRef={primaryPanelRef} />
          </PanelResizeHandle>
          <Panel>
            <Tabs
              style={{
                whiteSpace: "pre-wrap",
              }}
              tabBarStyle={{
                paddingLeft: "0.5rem",
              }}
              defaultActiveKey="1"
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
              }}
              tabBarExtraContent={
                <div
                  className="text-and-icon-center"
                  style={{
                    gap: "5px",
                  }}
                >
                  {buildSpec && buildSpec.length > 0 && (
                    <MtdButton
                      icon={<BuildIcon />}
                      onClick={() => {
                        onBuild(buildSpec[0].buildId, "DEFAULT");
                      }}
                      intent={"primary"}
                    >
                      {getLanguageLabel("rebuild")}
                    </MtdButton>
                  )}
                </div>
              }
            >
              <TabPane
                tab={
                  buildType == "PREVIEW"
                    ? getLanguageLabel("preview").toUpperCase()
                    : getLanguageLabel("buildLog").toUpperCase()
                }
                key="1"
              >
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    width: "100%",
                    overflow: "scroll",
                    height: "100%",
                  }}
                >
                  {datasetBuildLog.stage != FINISHED &&
                  buildType == "PREVIEW" ? (
                    <MtdLoader
                      content={getLanguageLabel("previewIsRunning")}
                    />
                  ) : (
                    <div className="build-log-table">
                      <Row>
                        <Col
                          style={{
                            padding: "0.5rem",
                            borderBottom:
                              "1px solid var(--movetodata-border-color-default)",
                            backgroundColor: "var(--movetodata-bkg-color-muted)",
                          }}
                          span={4}
                        >
                          <Text type="secondary">
                            {getLanguageLabel("timestamp").toUpperCase()}
                          </Text>
                        </Col>
                        <Col
                          style={{
                            padding: "0.5rem",
                            borderBottom:
                              "1px solid var(--movetodata-border-color-default)",
                            backgroundColor: "var(--movetodata-bkg-color-muted)",
                          }}
                          span={20}
                        >
                          <Text type="secondary">
                            {getLanguageLabel("summary").toUpperCase()}
                          </Text>
                        </Col>
                      </Row>
                      {[
                        ...datasetBuildLog.startingLogMessages,
                        ...datasetBuildLog.preparingLogMessages,
                        ...datasetBuildLog.runningLogMessages,
                        ...datasetBuildLog.finishedLogMessages,
                      ].map((log: any) => {
                        const match = log.message.match(
                          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
                        );
                        const match0000 = log.message.match(
                          /00000000-0000-0000-0000-000000000000/
                        );
                        let beforeUUID = "",
                          afterUUID = "";
                        if (match && !match0000) {
                          const index = log.message.indexOf(match[0]);
                          beforeUUID = log.message.slice(0, index);
                          afterUUID = log.message.slice(
                            index + match[0].length
                          );
                        }
                        return (
                          <Row>
                            <Col
                              style={{
                                borderBottom:
                                  "0.2px solid var(--movetodata-border-color-default)",
                                padding: "0.2rem",
                                fontFamily:
                                  "Space Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace",
                              }}
                              span={4}
                            >
                              <>
                                <Text
                                  style={{
                                    fontSize: "14px",
                                    fontFamily:
                                      "Space Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace",
                                  }}
                                >
                                  {timeConverter(log.startedAt)}
                                </Text>
                                {log.debug != null &&
                                  log.debug != "" &&
                                  log.debug != "None" && (
                                    <>
                                      {" "}
                                      <br />{" "}
                                    </>
                                  )}
                              </>
                            </Col>
                            <Col
                              style={{
                                borderBottom:
                                  "0.2px solid var(--movetodata-border-color-default)",
                                padding: "0.2rem",
                              }}
                              span={20}
                            >
                              {match && datasetDetails.has(match[0]) ? (
                                <>
                                  {!match0000 ? (
                                    <>
                                      <Text>{beforeUUID}</Text>
                                      <Link
                                        target="_blank"
                                        to={
                                          datasetDetails &&
                                          datasetDetails.has(match[0])
                                            ? datasetDetails.get(match[0])
                                            : match[0]
                                        }
                                      >
                                        <span className="text-and-icon-center">
                                          <TableIcon color={"#4C90F0"} />
                                          <div
                                            className="pop-over-item"
                                            style={{
                                              display: "inline",
                                              color:
                                                "var(--movetodata-font-color-muted)",
                                              overflow: "hidden",
                                            }}
                                          >
                                            {datasetDetails &&
                                            datasetDetails.has(match[0])
                                              ? datasetDetails.get(match[0])
                                              : match[0]}
                                          </div>
                                        </span>
                                      </Link>
                                      <br />
                                      <Text>{afterUUID}</Text>
                                    </>
                                  ) : (
                                    "Processing preview"
                                  )}
                                </>
                              ) : (
                                <>
                                  <Text
                                    style={{
                                      fontSize: "14px",
                                      // fontFamily: "Space Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace",
                                    }}
                                  >
                                    {match0000
                                      ? "Processing preview"
                                      : log.message}
                                  </Text>
                                  {log.debug != null &&
                                  log.debug != "" &&
                                  log.debug != "None" ? (
                                    <>
                                      {" "}
                                      <br />
                                      <Text
                                        type="secondary"
                                        style={{
                                          fontSize: "12px",
                                          fontFamily:
                                            "Space Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace",
                                        }}
                                      >
                                        {getLanguageLabel("debug")} :{" "}
                                      </Text>
                                      <Text
                                        type="danger"
                                        style={{
                                          fontSize: "12px",
                                          fontFamily:
                                            "Space Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace",
                                        }}
                                      >
                                        {log.debug}
                                        <BuildTableDatasetWritingTransactionActive
                                          text={log.debug}
                                          datasetId={
                                            datasetBuildLog.checkpointDataset
                                          }
                                          branch={datasetBuildLog.branch}
                                        />
                                      </Text>{" "}
                                    </>
                                  ) : (
                                    <></>
                                  )}
                                </>
                              )}
                            </Col>
                          </Row>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabPane>
              {datasetBuildLog.stage == FINISHED &&
                datasetBuildLog.trigger != CONNECT &&
                buildSpec &&
                buildSpec.length != 0 && (
                  <TabPane
                    tab={getLanguageLabel("buildSpecification").toUpperCase()}
                    key={"buildSpec"}
                    disabled={datasetBuildLog.stage != FINISHED}
                    style={{
                      overflow: "auto",
                    }}
                  >
                    {buildSpec.map((buildSpec: TBuildSpec, key: number) => {
                      if (key != 0) {
                        return (
                          <>
                            <Divider />
                            <BuildSpecTab
                              datasetBuildLog={datasetBuildLog}
                              buildSpec={buildSpec}
                            />
                          </>
                        );
                      }
                      return (
                        <BuildSpecTab
                          datasetBuildLog={datasetBuildLog}
                          buildSpec={buildSpec}
                        />
                      );
                    })}
                  </TabPane>
                )}
              {datasetBuildLog.stage == FINISHED &&
                datasetBuildLog.trigger != CONNECT && (
                  <TabPane
                    tab={getLanguageLabel("detailedLogs").toUpperCase()}
                    key="detailedLogs"
                    destroyInactiveTabPane
                  >
                    <DetailedLog
                      id={id}
                      buildType={buildType}
                      buildStatus={datasetBuildLog.status}
                      language={
                        buildSpec && buildSpec[0].language
                          ? buildSpec[0].language
                          : datasetBuildLog.trigger
                      }
                    />
                  </TabPane>
                )}
              {datasetBuildLog.sparkApplicationId && (
                <TabPane
                  tab={
                    <span className="text-and-icon-center">
                      {getLanguageLabel("sparkDetails").toUpperCase()}
                      <Tooltip title={getLanguageLabel("openInNewTab")}>
                        <Link
                          to={`/builds/${datasetBuildLog.sparkApplicationId}`}
                          target="_blank"
                        >
                          <PopOutIcon />
                        </Link>
                      </Tooltip>
                    </span>
                  }
                  key="3"
                >
                  <BuildSparkTab
                    sparkApplicationId={datasetBuildLog.sparkApplicationId}
                  />
                </TabPane>
              )}
              {previewResultsTab.map(
                (tab: { name: string; data: any }, _key: number) => {
                  return (
                    <TabPane tab={tab.name} key={(_key + 3).toString()}>
                      <PreviewResultDataset data={tab.data} />
                    </TabPane>
                  );
                }
              )}
            </Tabs>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default BuildDetailsTable;
