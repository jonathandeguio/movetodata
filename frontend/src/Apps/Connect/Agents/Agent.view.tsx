import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Badge,
  Card,
  Col,
  Progress,
  Row,
  Tabs,
  TabsProps,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import {
  listAgentLinks,
  listAgentSources,
} from "../../../redux/actions/agentActions";

import MtdLoader from "components/mtdLoader";

import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useNavigate, useParams } from "react-router-dom";
import {
  copyToClipboard,
  getLanguageLabel,
  getTimeDisplay,
  timeConverter,
} from "utils/utilities";
import { LinkIcon, RemoveIcon } from "../../../assets/icons/mtdActionIcons";
import { DatabaseIcon } from "../../../assets/icons/mtdDataIcons";
import {
  CodeCellIcon,
  CopyIcon,
  EditIcon,
} from "../../../assets/icons/mtdEditorIcons";
import { FolderIcon } from "../../../assets/icons/mtdFileIcons";
import { TickSmallIcon } from "../../../assets/icons/mtdNavigationIcon";
import { CopyCellIcon } from "../../../assets/icons/mtdTableIcons";
import MtdButton from "../../../components/MtdComponents/ButtonComponent/MtdButton";
import { CollapserHandler } from "../../../components/MtdComponents/ResizablePane/ResizablePaneUtil";
import { ThunkAppDispatch } from "../../../redux/types/store";
import {
  getAgentStatsAPI,
  getConnectElementAPI,
  getParentAPI,
} from "../Connect.api";

import { autoFormatter } from "utils/AutoFormatter";
import LinkTable2 from "../Links/LinkTable.view";
import SourceTable2 from "../Sources/SourceTable.view";
import AgentHeader from "./AgentHeader.view";
import AgentModal from "./AgentModal.view";

const { Title, Text } = Typography;

const PUBLIC_URL = window.location.origin;

const AgentDetails = () => {
  const primaryPanelRef = useRef<any>(null);
  const { id } = useParams();
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();
  const { agentSources, loading: agentSourcesLoading } = useSelector(
    (state) => (state as $TSFixMe).agentSourcesList
  );
  const { agentLinks, loading: agentLinksLoading } = useSelector(
    (state) => (state as $TSFixMe).agentLinksList
  );
  const [agentStats, setAgentStats] = useState();
  const [agentStatus, setAgentStatus] = useState({
    color: "var(--movetodata-intent-danger)",
    text: "Never Reported",
  });

  const [isUpdateAgentModalOpen, setIsUpdateAgentModalOpen] = useState(false);
  const [oneTimeCode, setOneTimeCode] = useState({
    modalView: false,
    code: null,
  });
  const [parent, setParent] = useState({ name: "", id: "" });
  const [agent, setAgent] = useState();

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <span>
          <LinkIcon />
          {getLanguageLabel("datasetLinks")}
        </span>
      ),
      children: (
        <LinkTable2 tableList={agentLinks} loading={agentLinksLoading} />
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <DatabaseIcon />
          {getLanguageLabel("datasetSources")}
        </span>
      ),
      children: (
        <SourceTable2 tableList={agentSources} loading={agentSourcesLoading} />
      ),
    },
  ];

  const getAgent = async () => {
    getConnectElementAPI(id as string, "agent").then(({ data }) => {
      setAgent(data);

      const currDate = new Date();
      if ((data as $TSFixMe).lastStatus) {
        const timeDifference =
          (currDate.getTime() - (data as $TSFixMe).lastStatus) / (1000 * 60);
        if (timeDifference < 2) {
          setAgentStatus({
            color: "var(--SUCCESS_COLOR)",
            text: "Online",
          });
        } else {
          setAgentStatus({
            color: "var(--WARNING_COLOR)",
            text: "Offline",
          });
        }

        getAgentStatsAPI(id as string).then(({ data }) => {
          setAgentStats(data);
        });
      } else {
        setAgentStatus({
          color: "var(--movetodata-intent-danger)",
          text: "Never Reported",
        });
      }

      getParentAPI(data.parent).then(({ data: data1 }) => {
        setParent(data1);
      });
    });
  };

  useEffect(() => {
    dispatch(listAgentSources(id));
    dispatch(listAgentLinks(id));
    getAgent();
  }, [id]);

  return (
    <>
      {agent ? (
        <div className="connect-container">
          <AgentHeader
            agentDetails={agent}
            setAgentDetails={setAgent}
            parent={parent}
            updateAgent={getAgent}
          />
          <PanelGroup direction={"horizontal"}>
            <Panel collapsible={true} defaultSize={25} ref={primaryPanelRef}>
              <div
                className="connect-container-left"
                style={{ padding: "35px" }}
              >
                <Row
                  justify="space-between"
                  align={"middle"}
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col>
                    <Text type="secondary" strong>
                      {getLanguageLabel("general").toUpperCase()}
                    </Text>
                    &nbsp;
                    {agentStats ? (
                      <>
                        <Badge
                          color={agentStatus?.color}
                          text={agentStatus?.text}
                        />
                        <Tooltip
                          title={timeConverter((agent as $TSFixMe)?.lastStatus)}
                        >
                          &nbsp;&nbsp; (
                          {getTimeDisplay((agent as $TSFixMe).lastStatus)})
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tag color="red">{getLanguageLabel("noStatus")}</Tag>
                      </>
                    )}
                  </Col>

                  <Col>
                    <MtdButton
                      icon={<EditIcon />}
                      intent="primary"
                      onClick={() => setIsUpdateAgentModalOpen(true)}
                    >
                      {getLanguageLabel("edit")}
                    </MtdButton>
                  </Col>
                </Row>

                <Row
                  justify={"space-between"}
                  align="middle"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col span={8}>
                    <Text>{getLanguageLabel("name")}</Text>
                  </Col>
                  <Col span={16}>{(agent as any).name}</Col>
                </Row>
                {(agent as any).description && (
                  <>
                    <Row
                      justify={"space-between"}
                      align="top"
                      style={{ marginTop: "10px" }}
                      gutter={[16, 16]}
                    >
                      <Col span={8}>
                        <Text>{getLanguageLabel("description")}</Text>
                      </Col>
                      <Col span={16}>{(agent as any).description}</Col>
                    </Row>
                  </>
                )}

                <Row
                  justify={"space-between"}
                  align="top"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col span={8}>
                    <Text>{getLanguageLabel("descriptionOpt")}</Text>
                  </Col>
                  <Col span={16}>
                    <MtdButton
                      intent="none"
                      icon={<FolderIcon />}
                      onClick={() =>
                        navigate(
                          `/portal/kitab/folder/${(agent as $TSFixMe).parent}`
                        )
                      }
                      fill
                    >
                      {parent.name}
                    </MtdButton>
                    <br />
                    <Text
                      type="secondary"
                      style={{
                        marginTop: "0px",
                        paddingRight: "1.5rem",
                        fontSize: "0.7rem",
                      }}
                    ></Text>
                  </Col>
                </Row>
                <Row
                  justify={"space-between"}
                  align="top"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col span={8}>
                    <Text>{getLanguageLabel("agentID")}</Text>
                  </Col>
                  <Col span={16}>
                    <MtdInput
                      value={(agent as $TSFixMe)?.id}
                      readOnly
                      suffix={
                        <Tooltip
                          title={getLanguageLabel("clickToCopyIntoClipboard")}
                        >
                          <div
                            onClick={() => {
                              copyToClipboard((agent as $TSFixMe)?.id);
                            }}
                          >
                            <CopyIcon />
                          </div>
                        </Tooltip>
                      }
                    />
                  </Col>
                </Row>
                {agentStats && (
                  <>
                    <br />
                    <Text type="secondary" strong>
                      {getLanguageLabel("agentInformation").toUpperCase()}
                    </Text>
                    <Row
                      justify={"space-between"}
                      align="top"
                      style={{ marginTop: "10px" }}
                      gutter={[16, 16]}
                    >
                      <Col span={8}>
                        <Text>{getLanguageLabel("operatingSystem")}</Text>
                      </Col>
                      <Col span={16}>{(agentStats as $TSFixMe).os}</Col>
                    </Row>
                    <Row
                      justify={"space-between"}
                      align="top"
                      style={{ marginTop: "10px" }}
                      gutter={[16, 16]}
                    >
                      <Col span={8}>
                        <Text>{getLanguageLabel("javaVersion")}</Text>
                      </Col>
                      <Col span={16}>
                        {(agentStats as $TSFixMe).javaVersion}
                      </Col>
                    </Row>

                    <Row
                      justify={"space-between"}
                      align="top"
                      style={{ marginTop: "10px" }}
                      gutter={[16, 16]}
                    >
                      <Col span={8}>
                        <Text>{getLanguageLabel("hostname")} & IP</Text>
                      </Col>
                      <Col span={16}>
                        {(agentStats as $TSFixMe).hostname} (
                        {(agentStats as $TSFixMe).ipAddress})
                      </Col>
                    </Row>
                    <Row
                      justify={"space-between"}
                      align="top"
                      style={{ marginTop: "10px" }}
                      gutter={[16, 16]}
                    >
                      <Col span={8}>
                        <Text>{getLanguageLabel("installationDirectory")}</Text>
                      </Col>
                      <Col span={16}>
                        {(agentStats as $TSFixMe)?.installDirectory}
                        <Progress
                          strokeColor={{
                            "0%": "#72CA9B",
                            "100%": "#E76A6E",
                          }}
                          size={[260, 20]}
                          style={{
                            marginBottom: "1%",
                          }}
                          strokeLinecap="square"
                          // percent={50}
                          percent={Math.ceil(
                            (((agentStats as $TSFixMe).totalSpace -
                              (agentStats as $TSFixMe).freeSpace) *
                              100) /
                              (agentStats as $TSFixMe).totalSpace
                          )}
                        />
                        <br />
                        <div style={{ overflowWrap: "anywhere" }}>
                          &nbsp; Using{" "}
                          {autoFormatter(
                            (agentStats as $TSFixMe).totalSpace -
                              (agentStats as $TSFixMe).freeSpace,
                            "bytes"
                          )}{" "}
                          of &nbsp;
                          {autoFormatter(
                            (agentStats as $TSFixMe).totalSpace,
                            "bytes"
                          )}
                        </div>
                      </Col>
                    </Row>
                  </>
                )}

                <MtdModal
                  headingIcon={<CodeCellIcon />}
                  heading={getLanguageLabel("agentDetails")}
                  open={oneTimeCode.modalView}
                  onOk={() =>
                    setOneTimeCode({ ...oneTimeCode, modalView: false })
                  }
                  onCancel={() =>
                    setOneTimeCode({ ...oneTimeCode, modalView: false })
                  }
                  okButtonProps={{ icon: <TickSmallIcon /> }}
                  cancelButtonProps={{ icon: <RemoveIcon /> }}
                  footerButtonArea={
                    <MtdButton
                      icon={<CopyCellIcon />}
                      onClick={() =>
                        copyToClipboard(
                          `bash <(/usr/bin/curl -k -s ${PUBLIC_URL}/api/connect/agent/install/${oneTimeCode.code})`
                        )
                      }
                      minimal
                    >
                      {getLanguageLabel("code")}
                    </MtdButton>
                  }
                >
                  <Text>{getLanguageLabel("agentMsg")}</Text>

                  <Card className="interactive" style={{ margin: "0.5rem 0" }}>
                    <Text strong>
                      {`bash < (/ usr/ bin/ curl -k -s ${PUBLIC_URL}/ api/ connect/ agent/ install/ ${oneTimeCode.code})`}
                      <Tooltip title={"Click to copy agent secret id"}>
                        <MtdButton
                          icon={<CopyCellIcon />}
                          onClick={() =>
                            copyToClipboard(
                              `bash <(/usr/bin/curl -k -s ${PUBLIC_URL}/api/connect/agent/install/${oneTimeCode.code})`
                            )
                          }
                          minimal
                          icononly
                        />
                      </Tooltip>
                    </Text>
                  </Card>
                </MtdModal>
              </div>
            </Panel>
            <PanelResizeHandle className="resizablePane-collapser">
              <CollapserHandler primaryPanelRef={primaryPanelRef} />
            </PanelResizeHandle>
            <Panel>
              {agent && (
                <div style={{ padding: "10px" }}>
                  <Tabs defaultActiveKey="1" type="card" items={items} />
                </div>
              )}
            </Panel>
          </PanelGroup>

          <AgentModal
            isVisible={isUpdateAgentModalOpen}
            setIsVisible={setIsUpdateAgentModalOpen}
            updateDetails={{
              agentDetails: agent,
              parent: parent,
              updateAgent: getAgent,
            }}
          />
        </div>
      ) : (
        <MtdLoader />
      )}
    </>
  );
};
export default AgentDetails;
