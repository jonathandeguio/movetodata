import { Col, Input, Popover, Row, Tooltip, Typography } from "antd";
import { HelpIcon } from "assets/icons/mtdMiscellaneousIcons";
import { Buffer } from "buffer";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { MtdTag } from "components/Tag/Tag";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  capitalizeFirstLetter,
  getLanguageLabel,
  getSourceIcon,
  notEmpty,
} from "utils/utilities";
import { TestConnectionButton } from "../Sources/TestConnection.view";

import { ThunkAppDispatch } from "redux/types/store";
import { isPlatformAdmin } from "../../../redux/actions/userActions";

interface SourceButtonPopoverProps {
  source: any;
  children: React.ReactNode;
}

const { Text } = Typography;

export const SourceButtonPopover: React.FC<SourceButtonPopoverProps> = ({
  source,
  children,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { user: platformAdmin } = useSelector(
    (state) => (state as any).platformAdmin
  );

  useEffect(() => {
    dispatch(isPlatformAdmin());
  }, []);

  if (notEmpty(source)) {
    return (
      <Popover
        placement="right"
        content={
          <>
            <Row
              justify={"space-between"}
              align="middle"
              style={{
                borderBottom: "1px solid var(--movetodata-border-color-default)",
              }}
              gutter={[16, 16]}
            >
              <Col>
                <MtdButton
                  onClick={() =>
                    navigate(
                      `/portal/connect/source/${(source as $TSFixMe).id}`
                    )
                  }
                  icon={getSourceIcon(
                    (source as $TSFixMe)["type"],
                    (source as $TSFixMe)["dbmsType"]
                  )}
                  minimal
                >
                  {(source as $TSFixMe).name}
                </MtdButton>
              </Col>
              <Col>
                <MtdTag color={"var(--SUCCESS_COLOR)"}>
                  {(source as $TSFixMe)["dbmsType"] &&
                    capitalizeFirstLetter((source as $TSFixMe)["dbmsType"])}
                </MtdTag>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col>
                <Text type="secondary" strong>
                  {getLanguageLabel("connection")}
                </Text>
              </Col>
              <Col>
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
            {(source as $TSFixMe)["type"] == "FOLDER" && (
              <>
                <Row
                  justify={"space-between"}
                  align="middle"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col>
                    <Text type="secondary" strong>
                      {getLanguageLabel("path")}
                    </Text>
                  </Col>
                  <Col>
                    <Text strong>{(source as $TSFixMe)["path"]}</Text>
                  </Col>
                </Row>
              </>
            )}
            {(source as $TSFixMe)["type"] == "jdbc" && (
              <>
                <Row
                  justify={"space-between"}
                  align="middle"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col>
                    <Text type="secondary" strong>
                      {getLanguageLabel("database")}
                    </Text>
                  </Col>
                  <Col>
                    <Text strong>{(source as $TSFixMe)["dbmsType"]}</Text>
                  </Col>
                </Row>
                <Row
                  justify={"space-between"}
                  align="middle"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col>
                    <Text type="secondary" strong>
                      {getLanguageLabel("server")} & {getLanguageLabel("port")}
                    </Text>
                  </Col>
                  <Col>
                    <Text strong>
                      {(source as $TSFixMe)["server"]} &{" "}
                      {(source as $TSFixMe)["port"]}
                    </Text>
                  </Col>
                </Row>
                <Row
                  justify={"space-between"}
                  align="middle"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col>
                    <Text type="secondary" strong>
                      {getLanguageLabel("database")}
                    </Text>
                  </Col>
                  <Col>
                    <Text strong>{(source as $TSFixMe)["database"]}</Text>
                  </Col>
                </Row>
                <Row
                  justify={"space-between"}
                  align="middle"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col>
                    <Text type="secondary" strong>
                      {getLanguageLabel("userName")}
                    </Text>
                  </Col>
                  <Col>
                    <Text strong>{(source as $TSFixMe)["username"]}</Text>
                  </Col>
                </Row>
                {platformAdmin && (
                  <Row
                    justify={"space-between"}
                    align="middle"
                    style={{ marginTop: "10px" }}
                    gutter={[16, 16]}
                  >
                    <Col>
                      <Text type="secondary" strong>
                        {getLanguageLabel("password")}...
                      </Text>
                    </Col>
                    <Col>
                      <Text strong>
                        {
                          <Input.Password
                            className="input"
                            placeholder={getLanguageLabel("password")}
                            defaultValue={
                              (source as any)["password"] !== undefined
                                ? Buffer.from(
                                    (source as any)["password"],
                                    "base64"
                                  ).toString("ascii")
                                : ""
                            }
                          />
                        }
                      </Text>
                    </Col>
                  </Row>
                )}

                {(source as $TSFixMe).directLoad && (
                  <Row
                    align={"middle"}
                    justify="center"
                    style={{ marginTop: "10px" }}
                  >
                    <TestConnectionButton source={source} />
                  </Row>
                )}
              </>
            )}
          </>
        }
      >
        {children}
      </Popover>
    );
  }
  return <>{children}</>;
};
