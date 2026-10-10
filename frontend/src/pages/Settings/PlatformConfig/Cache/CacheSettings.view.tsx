import { Col, Divider, Form, InputNumber, Row, Switch, Typography } from "antd";
import { SaveIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { getLanguageLabel, isDefined, openNotification } from "utils/utilities";
import { CacheConfig } from "./Cache";
import { getCacheConfigAPI, updateCacheConfigAPI } from "./Cache.api";

const { Text, Title } = Typography;
export const CacheSettings = () => {
  const [form] = Form.useForm();

  const [cacheConfig, setCacheConfig] = useState<CacheConfig>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCacheConfigAPI().then(({ data }) => {
      setCacheConfig({
        ...data,
        cacheExpiration: data.cacheExpiration / 86400,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="settings-center-block">
      {loading || !isDefined(cacheConfig) ? (
        <MtdLoader />
      ) : (
        <>
          <p>
            <Row>
              <Col>
                <Title level={3}>{getLanguageLabel("caching")}</Title>
                <Text type="secondary">{getLanguageLabel("cachingMsg2")}</Text>
              </Col>
            </Row>
            <Divider />
          </p>

          <Form
            form={form}
            initialValues={cacheConfig}
            onFinish={() => {
              if (
                form.getFieldValue("cacheExpiration") < 1 ||
                form.getFieldValue("cacheExpiration") > 90
              ) {
                openNotification(
                  "select a value in between 1 to 90 days",
                  "",
                  "info"
                );
                return;
              }
              updateCacheConfigAPI({
                ...form.getFieldsValue(),
                cacheExpiration: form.getFieldValue("cacheExpiration") * 86400,
              });
            }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Text type="secondary"> Allow Caching:</Text>
              </Col>

              <Col>
                <Form.Item name="cache">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
            {cacheConfig.cache && (
              <>
                <Row gutter={16} align="middle">
                  <Col span={6}>
                    <Text type="secondary">Cache Expiration</Text>
                    &nbsp;
                    <Text strong>[1,90]</Text>
                  </Col>

                  <Col>
                    <Form.Item name="cacheExpiration">
                      <InputNumber
                        min={1}
                        max={90}
                        controls={false}
                        addonAfter="Days"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16} align="middle">
                  <Col span={6}>
                    <Text type="secondary">Use Redis</Text>
                  </Col>

                  <Col>
                    <Form.Item name="useRedis">
                      <Switch checkedChildren="Yes" unCheckedChildren="No" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16} align="middle">
                  <Col span={6}>
                    <Text type="secondary">Redis Url</Text>
                  </Col>

                  <Col>
                    <Form.Item name="redisUrl">
                      <MtdInput />
                    </Form.Item>
                  </Col>
                </Row>
                
              </>
            )}
            <Row>
                  <Col span={6}></Col>
                  <Col>
                    <Form.Item>
                      <MtdButton
                        icon={<SaveIcon />}
                        intent="primary"
                        htmlType={"sumbit"}
                        textTransform="none"
                      >
                        {getLanguageLabel("update")}
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
