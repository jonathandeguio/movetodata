import { Col, Divider, Row, Tabs, Typography } from "antd";

import { useDispatch, useSelector } from "react-redux";

import MtdLoader from "components/mtdLoader";

import { AddIcon } from "assets/icons/mtdActionIcons";
import { DataAgentsIcon } from "assets/icons/mtdDataIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLanguageLabel, openNotification } from "utils/utilities";
import { listAgents } from "../../redux/actions/agentActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import AgentModal from "./Agents/AgentModal.view";
import AgentTable2 from "./Agents/AgentTable.view";

const { TabPane } = Tabs;

const { Title, Text } = Typography;

const ConnectAgents = () => {
  const navigate = useNavigate();
  const { user: connectAdmin } = useSelector(
    (state) => (state as any).connectAdmin
  );

  const [isNewAgentModalOpen, setIsNewAgentModalOpen] = useState(false);

  const dispatch = useDispatch<ThunkAppDispatch>();

  const { agents, loading: agentLoading } = useSelector(
    (state) => (state as $TSFixMe).agentList
  );

  useEffect(() => {
    if (connectAdmin !== undefined && connectAdmin === false) {
      openNotification("Access Denied", " ", "error");
      navigate("/");
    }
  }, [connectAdmin]);

  useEffect(() => {
    dispatch(listAgents());
  }, []);

  return (
    <>
      {connectAdmin ? (
        <React.Fragment>
          <div
            style={{
              margin: "5px 0",
            }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Title level={3}>
                  <div className="text-and-icon-center">
                    <DataAgentsIcon size={26} /> {getLanguageLabel("agent")}
                  </div>
                </Title>
                <Text type="secondary">{getLanguageLabel("connectMsg")}</Text>
              </Col>
              <Col span={8}></Col>
              <Col span={8}>
                <Row justify="end">
                  <Col>
                    <MtdButton
                      icon={<AddIcon />}
                      onClick={() => setIsNewAgentModalOpen(true)}
                      intent="action"
                    >
                      {getLanguageLabel("new")}
                    </MtdButton>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Divider />

            <AgentTable2 tableList={agents} loading={agentLoading} />
          </div>
          <AgentModal
            isVisible={isNewAgentModalOpen}
            setIsVisible={setIsNewAgentModalOpen}
          />
        </React.Fragment>
      ) : (
        <MtdLoader />
      )}
    </>
  );
};

export default ConnectAgents;
