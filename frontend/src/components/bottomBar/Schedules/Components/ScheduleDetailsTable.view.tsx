import { Col, Row, Skeleton, Tabs, Tooltip, Typography } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import { SyncIcon, WarningIcon } from "assets/icons/mtdActionIcons";
import { InfoIcon } from "assets/icons/mtdMiscellaneousIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import { CollapserHandler } from "components/MtdComponents/ResizablePane/ResizablePaneUtil";
import NoData from "components/CommonUI/NoData";
import React, { useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  formatDuration,
  getLanguageLabel,
  getTimeDisplay,
  timeConverter,
} from "utils/utilities";
import {
  IScheduleLog,
  JobExecutionStatusEnum,
  TScheduleJobInfo,
} from "../SchedulesModal.types";
import ScheduleLoggingPagination from "./ScheduleLoggingPagination";

const { Title, Text } = Typography;

interface IProps {
  id: string;
  jobInfo: TScheduleJobInfo;
}

const ScheduleDetailsTable = ({ id, jobInfo }: IProps) => {
  const primaryPanelRef = useRef(null);
  const [activeTab, setActiveTab] = useState("1");
  const [currentLog, setCurrentLog] = useState<IScheduleLog>();

  return (
    <>
      <div style={{ backgroundColor: "var(--background-color)" }}>
        {jobInfo ? (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between",
              padding: "1rem",
              border: "1px solid var(--movetodata-border-color-muted)",
            }}
          >
            <div style={{ flex: "0 0 40%" }}>
              <div style={{ fontSize: "30px" }}>
                {currentLog?.jobExecutionStatus ===
                JobExecutionStatusEnum.COMPLETED ? (
                  <div className="text-and-icon-center">
                    <Title level={5}>
                      <div className="success-tick-circle text-and-icon-center">
                        <TickIcon color="#ffffff" />
                      </div>
                      &nbsp;
                      {getLanguageLabel("success")}
                    </Title>
                  </div>
                ) : currentLog?.jobExecutionStatus ===
                  JobExecutionStatusEnum.FAILED ? (
                  <div className="text-and-icon-center">
                    <WarningIcon
                      size={24}
                      color="var(--movetodata-intent-danger)"
                    />
                    <Text style={{ fontSize: "1.2rem" }} type="danger">
                      {getLanguageLabel("buildFailed")}
                    </Text>
                  </div>
                ) : currentLog?.jobExecutionStatus ===
                  JobExecutionStatusEnum.RUNNING ? (
                  <Text type="warning">
                    <SyncIcon size={24} color={"#08c"} spin />{" "}
                    {getLanguageLabel("buildInProgress")}
                  </Text>
                ) : (
                  <>
                    <InfoIcon size={32} /> Choose a log
                  </>
                )}
                <br />
                <Text style={{ color: "var(--color)" }}>
                  {getLanguageLabel("logId")}:{" "}
                </Text>
                <Text copyable>{currentLog?.id}</Text>
              </div>
            </div>
            <div
              style={{
                fontSize: "13px",
                flex: "1",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <div>
                <Text style={{ color: "var(--color)" }}>
                  {getLanguageLabel("duration")}:{" "}
                </Text>
                <Text>
                  {currentLog?.endedAt != null
                    ? formatDuration(currentLog.endedAt - currentLog.startedAt)
                    : "--"}
                </Text>
              </div>
              <div>
                <Text style={{ color: "var(--color)" }}>
                  {getLanguageLabel("startTime")}:{" "}
                </Text>

                {currentLog?.startedAt != null ? (
                  <Tooltip title={timeConverter(currentLog.startedAt)}>
                    <Text>{getTimeDisplay(currentLog.startedAt)}</Text>
                  </Tooltip>
                ) : (
                  "--"
                )}

                <br />
                <Text style={{ color: "var(--color)" }}>
                  {getLanguageLabel("finishedTime")}:{" "}
                </Text>
                {currentLog?.endedAt != null ? (
                  <Tooltip title={timeConverter(currentLog.endedAt)}>
                    <Text>{getTimeDisplay(currentLog.endedAt)}</Text>
                  </Tooltip>
                ) : (
                  "--"
                )}
              </div>

              <div>
                <Text style={{ color: "var(--color)" }}>
                  {getLanguageLabel("success")}
                </Text>
                <br />
                <Text>{jobInfo.successExecutionCount}</Text>
              </div>
              <div>
                <Text style={{ color: "var(--color)" }}>
                  {getLanguageLabel("fail")}
                </Text>
                <br />
                <Text>{jobInfo.failureExecutionCount}</Text>
              </div>
              <div>
                <Text style={{ color: "var(--color)" }}>
                  {getLanguageLabel("lastExecutionAt")}
                </Text>
                <br />
                {jobInfo.lastExecution != null ? (
                  <span>
                    <Tooltip title={getTimeDisplay(jobInfo.lastExecution)}>
                      <Text>{getTimeDisplay(jobInfo.lastExecution)}</Text>
                    </Tooltip>
                  </span>
                ) : (
                  "--"
                )}
              </div>
            </div>
          </div>
        ) : (
          <Skeleton />
        )}
        <div
          style={{
            display: "flex",
            paddingRight: "6px",
            borderRight: "1px solid var(--movetodata-border-color-muted)",
            borderBottom: "1px solid var(--movetodata-border-color-muted)",
            borderLeft: "1px solid var(--movetodata-border-color-muted)",
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
                <ScheduleLoggingPagination
                  jobId={id}
                  currentLog={currentLog}
                  setCurrentLog={setCurrentLog}
                />
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
              >
                <TabPane
                  tab={getLanguageLabel("buildLog").toUpperCase()}
                  key="1"
                >
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      width: "100%",
                      overflow: "scroll",
                      height: "73vh",
                    }}
                  >
                    <div className="build-log-table">
                      <Row>
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
                      {currentLog &&
                      currentLog.executionLogsDetails &&
                      currentLog.executionLogsDetails.length > 0 ? (
                        currentLog.executionLogsDetails.map(
                          (message: string) => {
                            return (
                              <Row>
                                <Col
                                  style={{
                                    borderBottom:
                                      "0.2px solid var(--movetodata-border-color-default)",
                                    padding: "0.2rem",
                                  }}
                                  span={20}
                                >
                                  <Text
                                    style={{
                                      fontSize: "14px",
                                    }}
                                  >
                                    {message}
                                  </Text>
                                </Col>
                              </Row>
                            );
                          }
                        )
                      ) : (
                        <NoData
                          heading="No data"
                          subHeading="Choose another log"
                          icon={<WarningIcon />}
                        />
                      )}
                    </div>
                  </div>
                </TabPane>
              </Tabs>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </>
  );
};

export default ScheduleDetailsTable;
