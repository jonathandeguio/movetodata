import { Col, Divider, Form, Row, Typography } from "antd";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdLoader from "components/mtdLoader";

import React, { useEffect, useState } from "react";
import { getLanguageLabel } from "utils/utilities";
import { GitConfig } from "./GitConfig";
import { getGitConfigAPI, updateGitConfigAPI } from "./GitConfig.api";

const { Text, Title } = Typography;
export const GitSettings = () => {
  const [form] = Form.useForm();

  const [gitConfig, setGitConfig] = useState<GitConfig>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGitConfigAPI().then(({ data }) => {
      setGitConfig(data);
      setLoading(false);
    });
  }, []);
  return (
    <div className="settings-center-block">
      {loading ? (
        <MtdLoader />
      ) : (
        <>
          <Form
            form={form}
            layout="horizontal"
            initialValues={gitConfig}
            onFinish={(values: any) => {
              updateGitConfigAPI(values);
            }}
          >
            <Row>
              <Col>
                <Title level={3}>Git</Title>
                <Text type="secondary">{getLanguageLabel("gitMessage")}</Text>
              </Col>
            </Row>
            <Divider />
            <Row justify="space-between">
              <Col span={16}>
                <Text>Host</Text>
                <br />
                <Text type="secondary">
                  This is the git host where git repositories are stored and
                  managed.
                </Text>
              </Col>
              <Col span={8}>
                <Text type="secondary"></Text>
                <Form.Item name="host">
                  <MtdInput />
                </Form.Item>
              </Col>
            </Row>
            <Row justify="space-between">
              <Col span={16}>
                <Text>API Port</Text>
                <br />
                <Text type="secondary">
                  This is the git api port used for creating initial repository.
                </Text>
              </Col>
              <Col span={8}>
                <Text type="secondary"></Text>
                <Form.Item name="apiPort">
                  <MtdInput />
                </Form.Item>
              </Col>
            </Row>
            <Row justify="space-between">
              <Col span={16}>
                <Text>Port</Text>
                <br />
                <Text type="secondary">
                  This is the git port used for git clones, commits etc.
                </Text>
              </Col>
              <Col span={8}>
                <Text type="secondary"></Text>
                <Form.Item name="port">
                  <MtdInput />
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
          </Form>
        </>
      )}
    </div>
  );
};
