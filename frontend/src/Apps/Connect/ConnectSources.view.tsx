import { Col, Divider, Modal, Row, Typography } from "antd";

import { useDispatch, useSelector } from "react-redux";

import MtdLoader from "components/mtdLoader";

import { AddIcon } from "assets/icons/mtdActionIcons";
import { DatabaseIcon } from "assets/icons/mtdDataIcons";
import { UploadIcon } from "assets/icons/mtdInterfaceIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { FileDropZone } from "components/FileImport";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLanguageLabel, openNotification } from "utils/utilities";
import { listSources } from "../../redux/actions/sourceActions";
import { ThunkAppDispatch } from "../../redux/types/store";

import SourceModal from "./Sources/SourceModal.view";
import SourceTable2 from "./Sources/SourceTable.view";

const { Title, Text } = Typography;

const ConnectSources = () => {
  const navigate = useNavigate();
  const { user: connectAdmin } = useSelector(
    (state) => (state as any).connectAdmin
  );

  const [isNewSourceModalOpen, setIsNewSourceModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const dispatch = useDispatch<ThunkAppDispatch>();

  const { sources, loading: sourceLoading } = useSelector(
    (state) => (state as $TSFixMe).sourceList
  );

  useEffect(() => {
    if (connectAdmin !== undefined && connectAdmin === false) {
      openNotification("Access Denied", " ", "error");
      navigate("/");
    }
  }, [connectAdmin]);

  useEffect(() => {
    dispatch(listSources());
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
                    <DatabaseIcon size={26} />{" "}
                    {getLanguageLabel("datasetSources")}
                  </div>
                </Title>
                <Text type="secondary">{getLanguageLabel("connectMsg")}</Text>
              </Col>
              <Col span={8}></Col>
              <Col span={8}>
                <Row justify="end" gutter={8}>
                  <Col>
                    <MtdButton
                      icon={<UploadIcon />}
                      onClick={() => setIsUploadModalOpen(true)}
                      intent="none"
                    >
                      Importer un fichier
                    </MtdButton>
                  </Col>
                  <Col>
                    <MtdButton
                      icon={<AddIcon />}
                      onClick={() => setIsNewSourceModalOpen(true)}
                      intent="action"
                    >
                      {getLanguageLabel("new")}
                    </MtdButton>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Divider />

            <SourceTable2 tableList={sources} loading={sourceLoading} />
          </div>
          <SourceModal
            isVisible={isNewSourceModalOpen}
            setIsVisible={setIsNewSourceModalOpen}
          />
          <Modal
            open={isUploadModalOpen}
            onCancel={() => setIsUploadModalOpen(false)}
            footer={null}
            title="Importer un fichier"
            width={640}
            destroyOnClose
          >
            <FileDropZone
              onComplete={(sourceId) => {
                setIsUploadModalOpen(false);
                dispatch(listSources());
                navigate(`/portal/connect/source/${sourceId}`);
              }}
            />
          </Modal>
        </React.Fragment>
      ) : (
        <MtdLoader />
      )}
    </>
  );
};

export default ConnectSources;
