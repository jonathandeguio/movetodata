import { Card, Col, Divider, Row, Typography } from "antd";
import Meta from "antd/es/card/Meta";
import React from "react";
import {
  PySparkIcon,
  SparkSQLIcon,
} from "../../assets/icons/mtdExternalIcons";
import { LightBulbIcon } from "../../assets/icons/mtdMiscellaneousIcons";

import { getLanguageLabel } from "utils/utilities";

const { Title, Text } = Typography;

const EditorHome = () => {
  return (
    <div>
      <div
        style={{
          padding: "20px",
        }}
      >
        <Title level={3}>{getLanguageLabel("welcomeToRepository")}</Title>
        <Text type="secondary">
          {getLanguageLabel("youCanCodeDataPipelinesHereForYourProject")}
        </Text>
        <Divider />
        <Row gutter={[16, 16]}>
          <Col span={12}>
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
                    <PySparkIcon />
                    Python
                  </Title>
                  <Divider />
                  <Text type="secondary">
                    To create transformation you have to use an internal movetodata
                    package called funnel
                  </Text>
                  <br />
                  <br />
                  <code>
                    @funnel(target=target_dataset, source1=source_dataset1)
                    <br />
                    def user_transform_function(source1):
                  </code>
                  <br />
                  <br />
                  You can use multiple sources with a single target.
                  <br />
                  <br />
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
          <Col span={12}>
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
                    <SparkSQLIcon /> SQL
                  </Title>
                  <Divider />
                  <Text type="secondary">
                    MoveToData platform uses Spark for the transmation pipelines,
                    you can use Spark SQL dialect for creating SQL transform
                  </Text>
                  {/* <br /><br /> */}
                  {/* <Text>
                    CREATE TABLE `/Projects/TestSQL/Data/Join_Test/Customers_Orders_Joined`<br />
                    AS<br />
                    SELECT Name as FirstName, Email,Phone, Product, Price as Prix  FROM<br />
                    ( SELECT *<br />
                    FROM `/Projects/TestSQL/Data/Join_Test/Customers`<br />
                    where Name = 'John Doe'<br />
                    ) customers<br />
                    JOIN `/Projects/TestSQL/Data/Join_Test/Orders` orders<br />
                    ON customers.ID = orders.CustomerID<br />

                  </Text> */}
                  <br />
                  <br />
                  <br />
                  <br />
                  You can use multiple sources with a single target.
                  <br />
                  <br />
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
        <br />
        {/* <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title={
                <Title level={4}>
                  <SQLIcon /> SQL
                </Title>
              }
              className="interactive card"
              bordered={false}
            >
              <Text type="secondary">
                MoveToData platform uses Spark for the transmation pipelines, you can use Spark SQL format for creating SQL transform
              </Text>
              <br /><br />
              Please refer to documentation for more details.
            </Card>
          </Col>
        </Row> */}
      </div>
    </div>
  );
};

export default EditorHome;
