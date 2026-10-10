import { Col, Divider, Row, Switch, Tabs, TabsProps, Typography } from "antd";
import MtdLoader from "components/mtdLoader";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { updatePlatformConfig } from "../../../redux/actions/platformSettingsActions";
import { ThunkAppDispatch } from "../../../redux/types/store";

const { Text, Title } = Typography;
export const UploadSettings = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );

  const uploadItems: TabsProps["items"] = [
    {
      key: "1",
      label: getLanguageLabel("settings"),
      children: (
        <>
          <br />
          <Row gutter={16}>
            <Col span={6}>
              <Text type="secondary">Allow Uploads:</Text>
            </Col>

            <Col>
              <Switch
                checkedChildren="Yes"
                unCheckedChildren="No"
                loading={loading}
                defaultChecked={isDefined(config) ? config.upload : false}
                onChange={(checked) => {
                  dispatch(
                    updatePlatformConfig({ ...config, upload: checked })
                  );
                }}
              />
            </Col>
          </Row>
          <br />
        </>
      ),
    },
  ];
  return (
    <div className="settings-center-block">
      {loading ? (
        <MtdLoader />
      ) : (
        <>
          <Row>
            <Col>
              <Title level={3}>Upload Settings</Title>
              <Text type="secondary">
                This space is designated for platform administrators and
                developers for upload Settings.
              </Text>
            </Col>
          </Row>
          <Divider />
          <Tabs defaultActiveKey="1" items={uploadItems} />
        </>
      )}
    </div>
  );
};
