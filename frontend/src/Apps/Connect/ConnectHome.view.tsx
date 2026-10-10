import { Card, Col, Divider, Row, Typography } from "antd";

import { useDispatch, useSelector } from "react-redux";

import MtdLoader from "components/mtdLoader";

import Meta from "antd/es/card/Meta";
import { LinkIcon, PublishIcon } from "assets/icons/mtdActionIcons";
import { DataAgentsIcon, DatabaseIcon } from "assets/icons/mtdDataIcons";
import { LightBulbIcon } from "assets/icons/mtdMiscellaneousIcons";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLanguageLabel, openNotification } from "utils/utilities";
import Connect from "../../assets/images/Connect.png";
import { ThunkAppDispatch } from "../../redux/types/store";

const { Title, Text } = Typography;

const ConnectHome = () => {
  const navigate = useNavigate();
  const { user: connectAdmin } = useSelector(
    (state) => (state as any).connectAdmin
  );

  const dispatch = useDispatch<ThunkAppDispatch>();

  useEffect(() => {
    if (connectAdmin !== undefined && connectAdmin === false) {
      openNotification("Access Denied", " ", "error");
      navigate("/");
    }
  }, [connectAdmin]);

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
                    <PublishIcon size={26} /> {getLanguageLabel("connect")}
                  </div>
                </Title>
                <Text type="secondary">{getLanguageLabel("connectMsg")}</Text>
              </Col>
              <Col span={8}></Col>
              <Col span={8}>
                <Row justify="end">
                  <Col></Col>
                </Row>
              </Col>
            </Row>

            <Divider />
            <Row gutter={16} justify="space-around">
              <Col span={8}>
                <Card
                  style={{
                    pointerEvents: "auto",
                    background: "var(--background-color)",
                    borderRadius: "3px",
                    cursor: "pointer",
                    minHeight: "20rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  onClick={() => window.open("/learn/", "_blank")}
                  cover={
                    <div style={{ padding: "1rem" }}>
                      <Title level={4}>
                        <div className="text-and-icon-center">
                          <LinkIcon /> {getLanguageLabel("datasetLinks")}
                        </div>
                      </Title>
                      <Divider />
                      <Text type="secondary">
                        A Link is responsible for obtaining specific data from a
                        Source and incorporating it into MoveToData. For instance,
                        if a Postgres database Source contains various tables,
                        it is possible to configure a Link to ingest a
                        particular table into MoveToData. Once a Link has been
                        executed successfully, the outcome within MoveToData will be
                        a dataset, which can be utilized across all of MoveToData's
                        data processing, model development, and analytical
                        tools.
                      </Text>
                    </div>
                  }
                >
                  <Meta
                    title="Please refer to documentation for more details."
                    description={
                      <div className="text-and-icon-center">
                        <LightBulbIcon />

                        <>{getLanguageLabel("tutorials")}</>
                      </div>
                    }
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  style={{
                    pointerEvents: "auto",
                    background: "var(--background-color)",
                    borderRadius: "3px",
                    cursor: "pointer",
                    minHeight: "20rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  onClick={() => window.open("/learn/", "_blank")}
                  cover={
                    <div style={{ padding: "1rem" }}>
                      <Title level={4}>
                        <div className="text-and-icon-center">
                          <DatabaseIcon /> {getLanguageLabel("datasetSources")}
                        </div>
                      </Title>
                      <Divider />
                      <Text type="secondary">
                        To establish a connection with MoveToData, it is necessary
                        to utilize an external data system known as a Source.
                        These sources can include, among others, a Postgres
                        database, an S3 bucket, a file system on a Linux server,
                        an SAP instance, and a REST API on the internet. It
                        should be noted that prior to making a connection to
                        MoveToData, the Source must be appropriately configured.
                      </Text>
                    </div>
                  }
                >
                  <Meta
                    title="Please refer to documentation for more details."
                    description={
                      <div className="text-and-icon-center">
                        <LightBulbIcon />

                        <>{getLanguageLabel("tutorials")}</>
                      </div>
                    }
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  style={{
                    pointerEvents: "auto",
                    background: "var(--background-color)",
                    borderRadius: "3px",
                    cursor: "pointer",
                    minHeight: "20rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  onClick={() => window.open("/learn/", "_blank")}
                  cover={
                    <div style={{ padding: "1rem" }}>
                      <Title level={4}>
                        <div className="text-and-icon-center">
                          <DataAgentsIcon /> {getLanguageLabel("agent")}
                        </div>
                      </Title>
                      <Divider />
                      <Text type="secondary">
                        The Agent, a software component that runs within an
                        organization's network, serves as a secure intermediary
                        between the organization's data sources and the MoveToData
                        instance. It is required for connecting to certain data
                        sources, unless the data source is a cloud-based one
                        that MoveToData can access directly.
                      </Text>
                    </div>
                  }
                >
                  <Meta
                    title="Please refer to documentation for more details."
                    description={
                      <div className="text-and-icon-center">
                        <LightBulbIcon />

                        <>{getLanguageLabel("tutorials")}</>
                      </div>
                    }
                  />
                </Card>
              </Col>
            </Row>
            <br />
            <Row>
              <Col>
                <img src={Connect} style={{ width: "100%", height: "auto" }} />
              </Col>
            </Row>
          </div>
        </React.Fragment>
      ) : (
        <MtdLoader />
      )}
    </>
  );
};

export default ConnectHome;
