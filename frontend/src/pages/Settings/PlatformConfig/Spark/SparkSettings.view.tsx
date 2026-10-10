import { Col, Divider, Form, Row, Skeleton, Typography } from "antd";
import { SparklesIcon } from "assets/icons/mtdActionIcons";

import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import React from "react";

import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import { updateSparkConfig } from "../../../../redux/sparkSlice";
import { RootState, ThunkAppDispatch } from "../../../../redux/types/store";
import { sparkSettingsSwitchInputs } from "./SparkSettings.constants";

const { Text, Title } = Typography;
const { Item } = Form;
export const SparkSettings = () => {
  const [form] = Form.useForm();
  const { config, loading } = useSelector(
    (state: RootState) => state.sparkConfig
  );
  const dispatch = useDispatch<ThunkAppDispatch>();

  const getSparkSwitch = (sparkSwitchInput: {
    label: string;
    value: string;
    isDisabled: boolean;
  }) => {
    return (
      <MtdSwitch
        isDisabled={sparkSwitchInput.isDisabled}
        items={[
          {
            label: "local",
            value: "local",
            children: <></>,
          },
          {
            label: "kubernetes",
            value: "kubernetes",
            children: <></>,
          },
        ]}
        value={form.getFieldValue(sparkSwitchInput.value)}
      />
    );
  };

  return (
    <div className="settings-center-block">
      <Form
        form={form}
        initialValues={config}
        onFieldsChange={() => {
          dispatch(updateSparkConfig(form.getFieldsValue()));
        }}
      >
        <Row>
          <Col>
            <Title level={3}>
              <SparklesIcon /> Spark
            </Title>
            <Text type="secondary">{getLanguageLabel("sparkMessage")}</Text>
          </Col>
        </Row>
        <Divider />
        <br />
        {/* <Row justify="space-between">
            <Col span={16}>
              <Text>Master</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary"></Text>
              <Item name="master">
                <MtdInput />
              </Item>
            </Col>
          </Row> */}
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          sparkSettingsSwitchInputs.map((sparkSwitchInput) => {
            return (
              <Row justify="space-between">
                <Col>
                  <Text> {sparkSwitchInput.label}</Text>
                  <br />
                  <Text type="secondary">
                    {sparkSwitchInput.isDisabled ? (
                      <>
                        Only available in{" "}
                        <strong>
                          {form.getFieldValue(sparkSwitchInput.value)}
                        </strong>
                      </>
                    ) : (
                      <>
                        Current used on the platform{" "}
                        <strong>
                          {form.getFieldValue(sparkSwitchInput.value)}
                        </strong>
                      </>
                    )}
                  </Text>
                </Col>
                <Col span={8}>
                  <Item name={sparkSwitchInput.value}>
                    {getSparkSwitch(sparkSwitchInput)}
                  </Item>
                </Col>
                {/* <Divider style={{ margin: "0px" }} /> */}
              </Row>
            );
          })
        )}
        {/* <Row justify="space-between">
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
              <Item style={{ marginBottom: 0, marginLeft: "auto" }}>
                <MtdButton
                  htmlType="submit"
                  intent={isUpdateButtonDisabled ? "none" : "primary"}
                  disabled={isUpdateButtonDisabled}
                >
                  Update Configuration
                </MtdButton>
              </Item>
            </Col>
          </Row> */}
      </Form>
    </div>
  );
};
