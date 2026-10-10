import { Col, Row, Typography } from "antd";
import { DuplicateIcon } from "assets/icons/mtdActionIcons";
import { CopyIcon } from "assets/icons/mtdEditorIcons";
import axios from "axios";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModal from "components/CommonUI/MtdModalContainer";
import MtdLoader from "components/mtdLoader";
import React, { Dispatch, SetStateAction, useState } from "react";
import { useSelector } from "react-redux";
import {
  copyToClipboard,
  getLanguageLabel,
  timeConverter,
} from "utils/utilities";
const { Text } = Typography;
interface DebugInfo {
  lastUpdated?: string; // The "?" makes this property optional
  versions: Record<string, string>;
  debugInfo: string;
  userId: string;
  location: string;
}

interface Props {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const DebugInfoModal = ({ isOpen, setIsOpen }: Props) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [debugInfoText, setDebugInfoText] = useState<any>(null);
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);

  const copyDebugInfo = async () => {
    const { data } = await axios.get(`/platform/config`);
    const debugInfo: DebugInfo = {
      versions: {}, // Provide a default empty object for versions
      debugInfo: "", // Provide default values for debugInfo, userId, and location
      userId: "",
      location: "",
    };

    let debugInfoText = "";

    if (data.lastUpdatedOn) {
      debugInfo.lastUpdated = timeConverter(data.lastUpdatedOn * 1000);
      debugInfoText +=
        `${getLanguageLabel("lastUpdated")}: ${timeConverter(
          data.lastUpdatedOn * 1000
        )}` + "\n";
      debugInfoText += "\n";
    }

    for (const property in data.versions) {
      debugInfoText += `${property}: ${data.versions[property]}` + "\n";
    }
    debugInfoText += "\n";

    debugInfoText += `debug Info: ${new Date().toUTCString()}` + "\n";
    debugInfoText += "\n";
    debugInfoText += `user Id: ${user.id}` + "\n";
    debugInfoText += `location: ${window.location.href}`;

    debugInfo.versions = data.versions;
    debugInfo.debugInfo = new Date().toUTCString();
    debugInfo.userId = user.id;
    debugInfo.location = window.location.href;

    copyToClipboard(debugInfoText);

    // Optionally, you can set the JSON string in a variable
    setDebugInfo(debugInfo);

    setDebugInfoText(debugInfoText);

    //setIsOpen(true);
  };
  return (
    <>
      {isOpen && (
        <MtdModal
          headingIcon={<DuplicateIcon />}
          afterOpenChange={() => copyDebugInfo()}
          heading={
            <Row justify={"space-between"} align="middle">
              <Col>{getLanguageLabel("info")}</Col>
            </Row>
          }
          footerExtraText={getLanguageLabel("information")}
          open={isOpen}
          onCancel={() => setIsOpen(false)}
          width={600}
          extraActionHeading={
            <MtdButton
              icon={<CopyIcon />}
              onClick={() => debugInfoText && copyToClipboard(debugInfoText)}
              minimal
              icononly
            ></MtdButton>
          }
        >
          {debugInfo ? (
            <>
              {debugInfo.lastUpdated && (
                <Row
                  gutter={[16, 16]}
                  justify={"space-between"}
                  style={{
                    margin: "0.84rem",
                    // borderBottom: "1px solid var(--movetodata-border-color-default)",
                  }}
                >
                  <Col>
                    <Text type="secondary">
                      {getLanguageLabel("lastUpdated")}
                    </Text>
                  </Col>
                  <Col>
                    <Text strong>{debugInfo.lastUpdated}</Text>
                  </Col>
                </Row>
              )}

              {/* <div
                style={{
                  background: "var(--movetodata-bkg-color-muted)",
                  borderRadius: "2px",
                  boxShadow:
                    "rgba(11, 14, 22, 0.02) 0px 0px 0px 1px, rgba(11, 14, 22, 0.04) 0px 4px 8px, rgba(11, 14, 22, 0.04) 0px 18px 46px 6px",

                  margin: "0.84rem",
                  border: "1px solid var(--movetodata-border-color-default)",
                }}
              > */}
                <MtdCollapse
                  key="Versions"
                  collapsible={"HEADER"}
                  header={
                    <Row
                      gutter={[16, 16]}
                      justify={"space-between"}
                      // style={{
                      //   // margin: "0.84rem",
                      //   borderBottom:
                      //     "1px solid var(--movetodata-border-color-default)",
                      // }}
                    >
                      <Col>
                        <Text type="secondary" strong>
                          Versions{" "}
                          {debugInfo.versions.platform && (
                            <>({debugInfo.versions.platform})</>
                          )}
                        </Text>
                      </Col>
                      <Col>
                        <MtdButton
                          icon={<CopyIcon />}
                          onClick={() =>
                            debugInfo &&
                            copyToClipboard(
                              JSON.stringify(debugInfo.versions, null, 2)
                            )
                          }
                          icononly
                          minimal
                          trimicononlypadding
                        />
                      </Col>
                    </Row>
                  }
                >
                  <>
                    {Object.keys(debugInfo.versions)
                      .filter((key) => key !== "platform")
                      .filter((key) => key !== "connect")
                      .map((key) => (
                        <Row
                          gutter={[16, 16]}
                          justify={"space-between"}
                          style={{
                            marginRight: "1.84rem",
                            marginLeft: "1.84rem",
                          }}
                        >
                          <Col span={8} key={key}>
                            {key}
                          </Col>
                          <Col>
                            <Text strong>
                              {debugInfo.versions[key] === null
                                ? "-.-.-"
                                : debugInfo.versions[key]}
                            </Text>
                          </Col>
                        </Row>
                      ))}
                  </>
                </MtdCollapse>
                {/* <br />
              </div> */}
              <br />
              <Row
                gutter={[16, 16]}
                justify={"space-between"}
                style={{
                  margin: "0.84rem",
                  borderBottom: "1px solid var(--movetodata-border-color-default)",
                }}
              >
                <Col>
                  <Text type="secondary">
                    {getLanguageLabel("userName")} {getLanguageLabel("id")}
                  </Text>
                </Col>
                <Col>
                  <span className="text-and-icon-center">
                    <Text strong>{debugInfo.userId}</Text>
                    <MtdButton
                      icon={<CopyIcon />}
                      onClick={() =>
                        debugInfo && copyToClipboard(debugInfo.userId)
                      }
                      icononly
                      minimal
                      trimicononlypadding
                    />
                  </span>
                </Col>
              </Row>

              <Row
                gutter={[16, 16]}
                justify={"space-between"}
                style={{
                  margin: "0.84rem",
                  borderBottom: "1px solid var(--movetodata-border-color-default)",
                }}
              >
                <Col>
                  <Text type="secondary">{getLanguageLabel("url")}</Text>
                </Col>
                <Col>
                  <span className="text-and-icon-center">
                    <Text style={{ fontSize: "0.5rem" }} strong>
                      {debugInfo.location}
                    </Text>
                    <MtdButton
                      icon={<CopyIcon />}
                      onClick={() =>
                        debugInfo && copyToClipboard(debugInfo.location)
                      }
                      icononly
                      minimal
                      trimicononlypadding
                    />
                  </span>
                </Col>
              </Row>
            </>
          ) : (
            <MtdLoader />
          )}

          <br />
        </MtdModal>
      )}
    </>
  );
};

export default DebugInfoModal;
