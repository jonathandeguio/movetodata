import { useNavigateHelper } from "Apps/explorer/explorer.hooks";
import { Col, Input, Row, Tooltip, Typography } from "antd";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { FolderIcon } from "assets/icons/mtdFileIcons";
import { HelpIcon } from "assets/icons/mtdMiscellaneousIcons";
import { Buffer } from "buffer";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useState } from "react";
import { getLanguageLabel, getSourceIcon } from "utils/utilities";
import { ISourceConfig } from "./Source";
import SourceModal from "./SourceModal.view";
import { TestConnectionButton } from "./TestConnection.view";

const { Text } = Typography;

interface IProps {
  source: ISourceConfig;
  getSource: () => void;
}

const SourceInfoPanel = ({ source, getSource }: IProps) => {
  const navigator = useNavigateHelper();
  const [isUpdateSourceModalOpen, setIsUpdateSourceModalOpen] = useState(false);
  return (
    <div className="--flex-col-center">
      <div
        className="--p20"
        style={{
          flex: 1,
          height: "100%",

          width: "100%",
        }}
      >
        <div className="connect-container-left" style={{ padding: "35px" }}>
          <Row justify={"space-between"} align="middle">
            <Col>
              <Text type="secondary" strong>
                {getLanguageLabel("general")}
              </Text>
            </Col>
            <Col>
              <MtdButton
                icon={<EditIcon />}
                intent="primary"
                onClick={() => setIsUpdateSourceModalOpen(true)}
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
            <Col span={16}>
              <Text>{(source as any).name}</Text>
            </Col>
          </Row>

          {(source as any).description && (
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
                <Col span={16}>
                  <Text>{(source as any).description}</Text>
                </Col>
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
              <Text>{getLanguageLabel("parentFolder")}</Text>
            </Col>
            <Col span={16}>
              <MtdButton
                intent="none"
                onClick={() => navigator(source.parent)}
                icon={<FolderIcon />}
                minimal
              >
                {parent.name}
              </MtdButton>
            </Col>
          </Row>

          {(source as $TSFixMe)?.type === "FOLDER" && (
            <>
              <br />
              <Text type="secondary" strong>
                {getLanguageLabel("folder")}
              </Text>
              <Row
                justify={"space-between"}
                align="top"
                style={{ marginTop: "10px" }}
                gutter={[16, 16]}
              >
                <Col span={8}>
                  <Text>{getLanguageLabel("path")}</Text>
                </Col>
                <Col span={16}>
                  <Text>{(source as $TSFixMe)["path"]}</Text>
                </Col>
              </Row>
              <Row
                justify={"space-between"}
                align="top"
                style={{ marginTop: "10px" }}
                gutter={[16, 16]}
              >
                <Col span={8}>
                  <Text>{getLanguageLabel("timeout")}</Text>
                </Col>
                <Col span={16}>
                  <Text>{(source as $TSFixMe)["timeout"]}</Text>
                </Col>
              </Row>
            </>
          )}

          {(source as $TSFixMe)?.type === "jdbc" && (
            <>
              <Row
                justify={"space-between"}
                align="middle"
                style={{ marginTop: "10px" }}
                gutter={[16, 16]}
              >
                <Col span={8}>
                  <Text>{getLanguageLabel("type")}</Text>
                </Col>
                <Col span={16}>
                  <Text>
                    {source &&
                      getSourceIcon(
                        (source as any)["type"],
                        (source as any)["dbmsType"]
                      )}

                    {(source as any)["type"] == "FOLDER" && "FOLDER"}
                    {(source as any)["type"] == "jdbc" &&
                      (source as any)["dbmsType"]}
                  </Text>
                </Col>
              </Row>
              <Row
                justify={"space-between"}
                align="top"
                style={{ marginTop: "10px" }}
                gutter={[16, 16]}
              >
                <Col span={8}>
                  <Text>{getLanguageLabel("connection")}</Text>
                </Col>
                <Col span={16}>
                  <Tooltip title={getLanguageLabel("sourceConnections")}>
                    <div className="text-and-icon-center">
                      {(source as $TSFixMe).directLoad
                        ? getLanguageLabel("direct")
                        : getLanguageLabel("agent")}
                      <HelpIcon />
                    </div>
                  </Tooltip>
                </Col>
              </Row>
              <Row
                justify={"space-between"}
                align="top"
                style={{ marginTop: "10px" }}
                gutter={[16, 16]}
              >
                <Col span={8}>
                  <Text>
                    {getLanguageLabel("server")} & {getLanguageLabel("port")}
                  </Text>
                </Col>

                <Col span={16}>
                  <Text>
                    {(source as $TSFixMe)["server"]} &nbsp; & &nbsp;
                    {(source as $TSFixMe)["port"]}
                  </Text>
                </Col>
              </Row>
              <Row
                justify={"space-between"}
                align="top"
                style={{ marginTop: "10px" }}
                gutter={[16, 16]}
              >
                <Col span={8}>
                  <Text>{getLanguageLabel("database")}</Text>
                </Col>
                <Col span={16}>
                  <Text>{(source as $TSFixMe)["database"]}</Text>
                </Col>
              </Row>
              <MtdCollapse
                key="additionSettings"
                collapsible={"HEADER"}
                header={
                  <div className="query_item__heading">
                    {getLanguageLabel("authentication")}
                  </div>
                }
              >
                <>
                  {/* <Text type="secondary" strong>
              {getLanguageLabel("authentication").toUpperCase()}
            </Text> */}

                  <Row
                    justify={"space-between"}
                    align="top"
                    style={{ marginTop: "10px" }}
                    gutter={[16, 16]}
                  >
                    <Col span={8}>
                      <Text>{getLanguageLabel("userName")}</Text>
                    </Col>
                    <Col span={16}>
                      <Text>{(source as $TSFixMe)["username"]}</Text>
                    </Col>
                  </Row>
                  <Row
                    justify={"space-between"}
                    align="top"
                    style={{ marginTop: "10px" }}
                    gutter={[16, 16]}
                  >
                    <Col span={8}>
                      <Text>{getLanguageLabel("password")}</Text>
                    </Col>
                    <Col span={16}>
                      <Input.Password
                        readOnly
                        // onChange={(e) => {
                        //   setSource({
                        //     ...source,
                        //     password: e.target.value,
                        //   });
                        // }}
                        value={Buffer.from(
                          (source as $TSFixMe)["password"].toString(),
                          "base64"
                        ).toString("ascii")}
                      />
                    </Col>
                  </Row>
                  {(source as $TSFixMe).directLoad && (
                    <TestConnectionButton source={source} />
                  )}
                </>
              </MtdCollapse>
            </>
          )}

          {(source as $TSFixMe)?.type === "rest" && (
            <>
              <br />
              <Text type="secondary" strong>
                {"API"}
              </Text>

              <Row
                justify={"space-between"}
                align="top"
                style={{ marginTop: "10px" }}
                gutter={[16, 16]}
              >
                <Col span={8}>
                  <Text>{getLanguageLabel("token")}</Text>
                </Col>
                <Col span={16}>
                  <Text>{(source as $TSFixMe)["token"]}</Text>
                </Col>
              </Row>

              <Row
                justify={"space-between"}
                align="top"
                style={{ marginTop: "10px" }}
                gutter={[16, 16]}
              >
                <Col span={8}>
                  <Text>
                    {"API"} {"URL"}
                  </Text>
                </Col>
                <Col span={16}>
                  <Text>{(source as $TSFixMe)["url"]}</Text>
                </Col>
              </Row>

              <Row
                justify={"space-between"}
                align="top"
                style={{ marginTop: "10px" }}
                gutter={[16, 16]}
              >
                <Col span={8}>
                  <Text>{getLanguageLabel("method")}</Text>
                </Col>
                <Col span={16}>
                  <Text>{(source as $TSFixMe)["method"]}</Text>
                </Col>
              </Row>
            </>
          )}
        </div>
      </div>
      <SourceModal
        isVisible={isUpdateSourceModalOpen}
        setIsVisible={setIsUpdateSourceModalOpen}
        defaultParent={source.id}
        updateDetails={{
          sourceDetails: source,
          parent: parent,
          updateSource: getSource,
        }}
      />
    </div>
  );
};

export default SourceInfoPanel;
