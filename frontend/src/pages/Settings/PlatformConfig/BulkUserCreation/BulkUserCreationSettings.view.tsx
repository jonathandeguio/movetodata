import { Col, Divider, Row, Skeleton, Typography, Upload } from "antd";
import { WarningIcon } from "assets/icons/mtdActionIcons";
import { DownloadIcon, UploadIcon } from "assets/icons/mtdInterfaceIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";

import React, { useState } from "react";
import {
  getLanguageLabel,
  isDefined,
  openNotification,
  text_truncate
} from "utils/utilities";
import { BulkResult } from "./bulkCreationResult";
import { bulkUserCreationAPI } from "./BulkUserCreation.api";
import { downloadSampleUserFile } from "./BulkUserCreation.utils";
const { Text, Title } = Typography;

export const BulkUserCreationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResult[]>();
  const uploadCsvFile = (file: any) => {
    const formData = new FormData();
    formData.append("file", file as Blob);
    setLoading(true);
    bulkUserCreationAPI(formData)
      .then(({ data }) => {
        setLoading(false);
        setResults(data);
      })
      .catch((error) => {
        setLoading(false);
        openNotification("Bulk Create failed", "", "error");
      });
  };

  return (
    <div className="settings-center-block">
      <p>
        <Row>
          <Col>
            <Title level={3}>Bulk User Creation</Title>
            <Text type="secondary">
              Efficient Bulk User Creation: Streamlining the Process for
              Multiple User Accounts
            </Text>
          </Col>
        </Row>
        <Divider />
        <Row justify={"space-between"}>
          <Col span={12}>
            <Upload
              accept=".csv"
              name="avatar"
              showUploadList={false}
              customRequest={({ file }) => uploadCsvFile(file)}
            >
              <MtdButton
                intent="action"
                icon={<UploadIcon />}
                loading={loading}
              >
                Upload File
              </MtdButton>
            </Upload>
            <br />

            <Text>
              *Required 4 important fields{" "}
              <strong>( Email, UserName, FirstName, FamilyName )</strong>
            </Text>
            {isDefined(results) && (
              <>
                <br />
                <br />
                <br />
                <Row gutter={[16, 16]} justify={"space-between"}>
                  <Col>Processed {results?.length} entries (password : <Text strong>changeme</Text>)</Col>
                  <Col>
                    {/* <Text>1 Error 2 Success</Text> */}
                  </Col>
                </Row>
                <br />
              </>
            )}
            <br />
            {loading ? (
              <Skeleton />
            ) : (
              results?.map((result: BulkResult) => {
                return (
                  <>
                    <Row
                      gutter={[16, 16]}
                      style={{
                        padding: "5px",
                        background: "var(--movetodata-bkg-color-muted)",
                        borderRadius: "2px",
                        boxShadow:
                          "rgba(11, 14, 22, 0.02) 0px 0px 0px 1px, rgba(11, 14, 22, 0.04) 0px 4px 8px, rgba(11, 14, 22, 0.04) 0px 18px 46px 6px",
                        borderRight:
                          result.status == "success"
                            ? "1px solid green"
                            : "1px solid red",
                      }}
                    >
                      <Col span={24}>
                        <Row justify={"space-between"}>
                          <Col>
                            <div className="text-and-icon-center">
                              <div
                                className={
                                  result.status == "success"
                                    ? "success-tick-circle"
                                    : ""
                                }
                              >
                                {result.status == "success" ? (
                                  <TickIcon color={"#ffffff"} />
                                ) : (
                                  <WarningIcon size={22} color={"red"} />
                                )}
                              </div>
                              &nbsp; &nbsp;
                              <Text strong>
                                {text_truncate(result?.message, 50, "...")}
                              </Text>
                            </div>
                          </Col>
                          <Col>
                            {/* {capitalizeFirstLetter(result?.status)} */}
                          </Col>
                        </Row>
                        <Divider style={{ margin: "3px" }} />

                        <br />
                        <Row justify={"space-between"}>
                          <Col>{getLanguageLabel("userName")}:</Col>
                          <Col>{result?.userName}</Col>
                        </Row>
                        <Row justify={"space-between"}>
                          <Col>{getLanguageLabel("email")}:</Col>
                          <Col>{result?.email}</Col>
                        </Row>
                        <Row justify={"space-between"}>
                          <Col>{getLanguageLabel("givenName")}:</Col>
                          <Col>{result?.firstName}</Col>
                        </Row>
                        <Row justify={"space-between"}>
                          <Col>{getLanguageLabel("familyName")}:</Col>
                          <Col>{result?.familyName}</Col>
                        </Row>
                      </Col>
                    </Row>
                    <br />
                  </>
                );
              })
            )}
          </Col>
          <Col>
            {" "}
            <Row justify="space-between">
              <Col
                style={{
                  border: "1px solid var(--movetodata-border-color-muted)",
                  padding: "1rem",
                }}
              >
                <Row align={"middle"} justify="space-between">
                  <Col>
                    <Title type="secondary" level={3}>
                      Rules
                    </Title>
                  </Col>
                  <Col>
                    <Text type="secondary">
                      <MtdButton
                        onClick={downloadSampleUserFile}
                        intent="primary"
                        icon={<DownloadIcon />}
                      >
                        Sample CSV File
                      </MtdButton>
                    </Text>
                  </Col>
                </Row>

                <Row align={"middle"}>
                  <Text type="secondary">
                    • Emails and Usernames should be unique.
                  </Text>
                </Row>
                <Row align={"middle"}>
                  <Text type="secondary">
                    • All The Fields Specified in sample file are required.
                  </Text>
                </Row>
                <Row align={"middle"}>
                  <Text type="secondary">
                    • Only CSV Files are allowed to be uploaded.
                  </Text>
                </Row>
              </Col>
            </Row>
          </Col>
        </Row>
      </p>
    </div>
  );
};
