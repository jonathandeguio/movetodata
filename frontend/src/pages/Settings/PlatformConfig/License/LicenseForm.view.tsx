import { Col, Form, Input, Row } from "antd";

import axios from "axios";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { ErrorResponse } from "global";
import { decryptLicenseKeyAPI } from "pages/Settings/apis";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { ThunkAppDispatch } from "redux/types/store";
import {
  getLanguageLabel,
  isDefined,
  isLicenseKeyUsedValid,
  openNotification,
} from "utils/utilities";
import { updatePlatformConfig } from "../../../../redux/actions/platformSettingsActions";
import { updateLicenseInfo } from "../../../../redux/licenseInfoSlice";

const { Item } = Form;
interface Props {
  isDisabledPage: boolean;
}
export const LicenseForm = ({ isDisabledPage }: Props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [form] = Form.useForm();
  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );
  const [activateUpdateButton, setActivateUpdateButton] = useState(false);
  return (
    <Form
      form={form}
      initialValues={{ licenseKey: config.licenseKey }}
      onFinish={(values) => {
        decryptLicenseKeyAPI(values.licenseKey)
          .then(({ data }) => {
            dispatch(
              updatePlatformConfig({
                ...config,
                licenseKey: values.licenseKey,
              })
            );
            dispatch(updateLicenseInfo(data));
            if (!isLicenseKeyUsedValid(data) || isDisabledPage)
              navigate("/portal/home");
          })
          .catch((err) => {
            if (axios.isAxiosError(err) && isDefined(err.response)) {
              const data = err?.response?.data as ErrorResponse;
              const error = data.error;
              const description = data.description;

              openNotification(error, description, "error");
            }
            form.setFieldValue("licenseKey", config.licenseKey);
          })
          .finally(() => {
            setActivateUpdateButton(false);
          });
      }}
    >
      <Row justify={"space-between"} align={"middle"}>
        <Col span={24}>
          <Item
            name="licenseKey"
            label={"License Key"}
            wrapperCol={{ span: 24 }}
          >
            {/* <MtdInput
                    value={config.licenseKey}
                    placeholder="Enter Your License Key"
                    onChange={() => setActivateUpdateButton(true)}
                  /> */}

            <Input.Password
              value={config.licenseKey}
              placeholder="Enter Your License Key"
              onChange={() => setActivateUpdateButton(true)}
            />
          </Item>
        </Col>
      </Row>

      <Row justify={"center"} align={"middle"}>
        <Col>
          <Item>
            <MtdButton
              intent="primary"
              htmlType="submit"
              disabled={!activateUpdateButton}
            >
              {getLanguageLabel("update")}
            </MtdButton>
          </Item>
        </Col>
      </Row>
    </Form>
  );
};
