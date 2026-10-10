import { Col, Divider, Row, Typography } from "antd";

import { useDispatch, useSelector } from "react-redux";

import MtdLoader from "components/mtdLoader";

import { AddIcon, LinkIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLanguageLabel, openNotification } from "utils/utilities";
import { listLinks } from "../../redux/actions/linkActions";
import { ThunkAppDispatch } from "../../redux/types/store";

import LinkModal from "./Links/LinkModal.view";
import LinkTable2 from "./Links/LinkTable.view";

const { Title, Text } = Typography;

const ConnectLinks = () => {
  const navigate = useNavigate();
  const { user: connectAdmin } = useSelector(
    (state) => (state as any).connectAdmin
  );

  const dispatch = useDispatch<ThunkAppDispatch>();

  const { links, loading: linkLoading } = useSelector(
    (state) => (state as $TSFixMe).linkList
  );

  const [isNewLinkModalOpen, setIsNewLinkModalOpen] = useState(false);

  useEffect(() => {
    if (connectAdmin !== undefined && connectAdmin === false) {
      openNotification("Access Denied", " ", "error");
      navigate("/");
    }
  }, [connectAdmin]);

  useEffect(() => {
    dispatch(listLinks());
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
                    <LinkIcon size={26} /> {getLanguageLabel("datasetLinks")}
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
                      onClick={() => setIsNewLinkModalOpen(true)}
                      intent="action"
                    >
                      {getLanguageLabel("new")}
                    </MtdButton>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Divider />

            <LinkTable2 tableList={links} loading={linkLoading} />
          </div>

          <LinkModal
            isVisible={isNewLinkModalOpen}
            setIsVisible={setIsNewLinkModalOpen}
          />
        </React.Fragment>
      ) : (
        <MtdLoader />
      )}
    </>
  );
};

export default ConnectLinks;
