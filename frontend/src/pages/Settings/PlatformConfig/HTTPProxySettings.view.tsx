import { Col, Divider, Row, Switch, Typography } from "antd";
import React from "react";

import { Form } from "antd";
import MtdButton from "../../../components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "../../../components/MtdComponents/InputComponent/MtdInput";

import MtdLoader from "components/mtdLoader";
import { useDispatch, useSelector } from "react-redux";
import { isDefined } from "utils/utilities";
import { updatePlatformConfig } from "../../../redux/actions/platformSettingsActions";
import { ThunkAppDispatch } from "../../../redux/types/store";

const { Title, Text } = Typography;

const HttpProxySettings = () => {
  const [form] = Form.useForm();

  const dispatch = useDispatch<ThunkAppDispatch>();

  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );

  return (
    <div className="settings-center-block">
      <p>
        {!loading ? (
          <Form
            form={form}
            layout="horizontal"
            initialValues={config}
            onFinish={(values: any) => {
              dispatch(
                updatePlatformConfig({
                  ...config,
                  httpProxyUrl: values.httpProxyUrl,
                })
              );
            }}
          >
            <Row>
              <Col>
                <Title level={3}>HTTP Proxy</Title>
                <Text type="secondary">
                  Change the HTTP Proxy configuration for the platform from
                  here.
                </Text>
              </Col>
            </Row>

            <Divider />
            <Row justify="space-between">
              <Col span={6}>
                <Text type="secondary"> Use Proxy:</Text>
              </Col>

              <Col>
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  loading={loading}
                  defaultChecked={isDefined(config) ? config.httpProxy : false}
                  onChange={(checked) => {
                    dispatch(
                      updatePlatformConfig({ ...config, httpProxy: checked })
                    );
                  }}
                />
              </Col>
            </Row>
            {config.httpProxy && (
              <>
                <Row justify="space-between">
                  <Col span={16}>
                    <Text>HTTP Proxy</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">HTTP Proxy URL</Text>
                    <Form.Item name="httpProxyUrl">
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
              </>
            )}
          </Form>
        ) : (
          <MtdLoader />
        )}
      </p>
    </div>
  );
};
export default HttpProxySettings;
