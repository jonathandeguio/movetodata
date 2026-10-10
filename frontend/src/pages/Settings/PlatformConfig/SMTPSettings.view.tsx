import { Col, Divider, Input, Row, Typography } from "antd";
import React, { useEffect, useState } from "react";

import { Form } from "antd";
import MtdButton from "../../../components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "../../../components/MtdComponents/InputComponent/MtdInput";

import MtdLoader from "components/mtdLoader";
import { getSmtpConfig, updateSmtpConfig } from "../apis";

const { Title, Text } = Typography;

const SMTPSettings = () => {
  const [form] = Form.useForm();

  const [smtpConfig, setSmtpConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSmtpConfig().then((initialData: any) => {
      setSmtpConfig(initialData);
      setLoading(false);
    });
  }, []);

  return (
    <div className="settings-center-block">
      <p>
        {!loading ? (
          <Form
            form={form}
            layout="horizontal"
            initialValues={smtpConfig}
            onFinish={(values: any) => {
              updateSmtpConfig(values);
            }}
          >
            <Row>
              <Col>
                <Title level={3}>Mailer Configuration</Title>
                <Text type="secondary">
                  Change the SMTP configuration for the platform from here.
                </Text>
              </Col>
            </Row>

            <Divider />

            <Row justify="space-between">
              <Col span={16}>
                <Text>Host</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">SMTP host name like smtp.gmail.com</Text>
                <Form.Item name="host">
                  <MtdInput />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="space-between">
              <Col span={16}>
                <Text>Port</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Port for the SMTP host like 587</Text>
                <Form.Item name="port">
                  <MtdInput />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="space-between">
              <Col span={16}>
                <Text>Authentication</Text>
              </Col>
              <Col span={8}>
                <Form.Item name="auth">
                  <MtdInput />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="space-between">
              <Col span={16}>
                <Text>Transport TLS</Text>
              </Col>
              <Col span={8}>
                <Form.Item name="ttls">
                  <MtdInput />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="space-between">
              <Col span={16}>
                <Text>Email</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Email for the mailer</Text>
                <Form.Item name="smtpEmail">
                  <MtdInput />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="space-between">
              <Col span={16}>
                <Text>Password</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Password for Mailer</Text>
                <Form.Item name="smtpPassword">
                  <Input.Password />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="space-between">
              <Col span={16}>
                <div
                  className="MtdSubHeader1 text-and-icon-center"
                  style={{ marginRight: "0.5rem" }}
                >
                  Only platform administrators can view or edit this
                  configuration.
                </div>
              </Col>
              <Col span={8}>
                <Form.Item style={{ marginBottom: 0, marginLeft: "auto" }}>
                  <MtdButton htmlType="submit" intent="primary">
                    Update Configuration
                  </MtdButton>
                </Form.Item>
              </Col>
            </Row>

            <br />
          </Form>
        ) : (
          <MtdLoader />
        )}
      </p>
    </div>
  );
};
export default SMTPSettings;
