import { Card, Col, Divider, Row, Tooltip, Typography } from "antd";
import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SparklesIcon } from "../../../assets/icons/mtdActionIcons";

import { getSSODetails } from "../../../redux/actions/authActions";

import { openNotification } from "utils/utilities";
import MtdButton from "../../../components/MtdComponents/ButtonComponent/MtdButton";
import { ThunkAppDispatch } from "../../../redux/types/store";
const { Text, Title } = Typography;

const DeveloperSettings = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { user: platformAdmin } = useSelector(
    (state) => (state as any).platformAdmin
  );

  useEffect(() => {
    dispatch(getSSODetails());
  }, []);

  const createSampleData = async (sampleDataType: string) => {
    try {
      const { data } = await axios.get(`/kitab/sampleData/${sampleDataType}`);
      openNotification(`Sample Data : ${sampleDataType}`, data.message, "info");
    } catch (error: any) {
      openNotification(
        `Failed to fetch Sample Data : ${sampleDataType}`,
        "",
        "error"
      );
    }
  };

  return (
    <>
      <div className="settings-center-block">
        <p>
          <Row>
            <Col>
              <Title level={3}>Developer Space</Title>
              <Text type="secondary">
                This space is designated for platform administrators and
                developers.
              </Text>
            </Col>
          </Row>
          <Divider />
        </p>

        <Row>
          <Col span={24}>
            <Card className="card">
              <Text type="secondary">
                Here you you have the ability to generate{" "}
                <strong>development</strong> sample data which encompasses a
                range of sample users, groups, tags, and projects.
              </Text>
              <br />

              <br />
              {
                // check if is platform Admin
                platformAdmin && (
                  <Tooltip
                    placement="left"
                    title="This button is intended for use exclusively by platform administrators, as it generates sample data. It is strongly advised not to utilize this button in a live production environment."
                  >
                    <div>
                      <div className="text-and-icon-center">
                        <MtdButton
                          dashed
                          intent="dangerous"
                          onClick={() => createSampleData("development")}
                          icon={<SparklesIcon />}
                        >
                          Development Sample Data
                        </MtdButton>
                      </div>
                    </div>
                  </Tooltip>
                )
              }
            </Card>
          </Col>
        </Row>
        <br />
        {/* <Row>
          <Col span={24}>
            <Card className="card">
              <Text type="secondary">
                Here you you have the ability to generate <strong>demo</strong>{" "}
                sample data which encompasses a range of sample users, groups,
                tags, and projects.
              </Text>
              <br />
              <br />
              {
                // check if is platform Admin
                platformAdmin && (
                  <Tooltip
                    placement="left"
                    title="This button is intended for use exclusively by platform administrators, as it generates sample data. It is strongly advised not to utilize this button in a live production environment."
                  >
                    <div>
                      <div className="text-and-icon-center">
                        <MtdButton
                          dashed
                          intent="dangerous"
                          onClick={() => createSampleData("demo")}
                          icon={<SparklesIcon color={"#ffffff"} />}
                        >
                          Demo Sample Data
                        </MtdButton>
                      </div>
                    </div>
                  </Tooltip>
                )
              }
            </Card>
          </Col>
        </Row> */}
      </div>
    </>
  );
};

export default DeveloperSettings;
