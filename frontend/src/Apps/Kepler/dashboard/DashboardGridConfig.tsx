import { ColorPicker, Form, InputNumber, Switch } from "antd";
import { Color } from "antd/es/color-picker";
import { useForm } from "antd/es/form/Form";
import { AppIcon } from "assets/icons/mtdInterfaceIcons";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import { updateGridConfig } from "../../../redux/actions/dashboardActions";
import { RootState, ThunkAppDispatch } from "../../../redux/types/store";
import { KeplerConfig } from "../chart/charts.config";
import { ITabConfig } from "./Dashboard";
import { updateTabCustomizeAPI } from "./Dashboard.api";

interface IProps {
  tabId: string;
  dashboardId: string;
}
const DashboardGridConfig = ({ tabId, dashboardId }: IProps) => {
  const [form] = useForm();
  const gridConfig = useSelector(
    (state: RootState) => state.dashboardEdit.gridConfig
  );

  const dispatch = useDispatch<ThunkAppDispatch>();
  const labelCol = { span: 10, offset: 2 }; // Adjust the span value to fit your label length
  const wrapperCol = { span: 20, offset: 2 }; // Adjust the span value to fit your input length

  useEffect(() => {
    form.setFieldsValue(gridConfig);
    return () => {
      form.resetFields();
    };
  }, [tabId]);

  const updateConfig = (
    value?: string | number | boolean,
    configType?: keyof ITabConfig
  ) => {
    if (value && configType) {
      form.setFieldValue(configType, value);
    }
    updateTabCustomizeAPI(tabId, dashboardId, form.getFieldsValue());
    dispatch(updateGridConfig(form.getFieldsValue()));
  };

  return (
    <Form form={form} layout="horizontal" initialValues={gridConfig}>
      <MtdCollapse
        collapsible="HEADER"
        header={getLanguageLabel("canvas")}
        key={`canvas`}
      >
        <>
          <div className="form-canvas">
            <div className="form-item top">
              <Form.Item
                name="topPadding"
                labelCol={labelCol}
                wrapperCol={wrapperCol}
                colon={false}
                rules={[
                  {
                    required: true,
                    message: "This field is required",
                  },
                ]}
              >
                <InputNumber
                  size="small"
                  min={0}
                  max={500}
                  onChange={() => updateConfig()}
                />
              </Form.Item>
            </div>
            <div className="form-row">
              <div className="form-item left">
                <Form.Item
                  name="leftPadding"
                  labelCol={labelCol}
                  wrapperCol={wrapperCol}
                  colon={false}
                  rules={[
                    {
                      required: true,
                      message: "This field is required",
                    },
                  ]}
                >
                  <InputNumber
                    size="small"
                    min={0}
                    max={500}
                    onChange={() => updateConfig()}
                  />
                </Form.Item>
              </div>
              <AppIcon />
              <div className="form-item right">
                <Form.Item
                  name="rightPadding"
                  labelCol={labelCol}
                  wrapperCol={wrapperCol}
                  colon={false}
                  rules={[
                    {
                      required: true,
                      message: "This field is required",
                    },
                  ]}
                >
                  <InputNumber
                    size="small"
                    min={0}
                    max={500}
                    onChange={() => updateConfig()}
                  />
                </Form.Item>
              </div>
            </div>
            <div className="form-item bottom">
              <Form.Item
                name="bottomPadding"
                labelCol={labelCol}
                wrapperCol={wrapperCol}
                colon={false}
                rules={[
                  {
                    required: true,
                    message: "This field is required",
                  },
                ]}
              >
                <InputNumber
                  size="small"
                  min={0}
                  max={500}
                  onChange={() => updateConfig()}
                />
              </Form.Item>
            </div>
          </div>
        </>
      </MtdCollapse>

      <MtdCollapse
        collapsible="HEADER"
        header={getLanguageLabel("dashboard")}
        key={`dashboard`}
      >
        <>
          <Form.Item
            name="pageBg"
            label={
              <div className="mtdFormLabel">{getLanguageLabel("page")}</div>
            }
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            colon={false}
            rules={[
              {
                required: true,
                message: "This field is required",
              },
            ]}
          >
            <ColorPicker
              disabledAlpha
              size="small"
              presets={[
                {
                  label: getLanguageLabel("recommended"),
                  colors: KeplerConfig.colorPickerPreset,
                },
              ]}
              format="hex"
              onChange={(value: Color, hex: string) => {
                updateConfig(hex, "pageBg");
              }}
            />
          </Form.Item>
          <Form.Item
            name="canvasBg"
            label={
              <div className="mtdFormLabel">
                {getLanguageLabel("canvas")}
              </div>
            }
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            colon={false}
            rules={[
              {
                required: true,
                message: "This field is required",
              },
            ]}
          >
            <ColorPicker
              disabledAlpha
              size="small"
              presets={[
                {
                  label: getLanguageLabel("recommended"),
                  colors: KeplerConfig.colorPickerPreset,
                },
              ]}
              onChange={(value: Color, hex: string) => {
                updateConfig(hex, "canvasBg");
              }}
            />
          </Form.Item>
        </>
      </MtdCollapse>

      <MtdCollapse
        collapsible="HEADER"
        header={getLanguageLabel("chart")}
        key={`chart`}
      >
        <>
          <Form.Item
            name="chartBodyBg"
            label={
              <div className="mtdFormLabel">
                {getLanguageLabel("background")}
              </div>
            }
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            colon={false}
            rules={[
              {
                required: true,
                message: "This field is required",
              },
            ]}
          >
            <ColorPicker
              disabledAlpha
              size="small"
              presets={[
                {
                  label: getLanguageLabel("recommended"),
                  colors: KeplerConfig.colorPickerPreset,
                },
              ]}
              onChange={(value: Color, hex: string) => {
                updateConfig(hex, "chartBodyBg");
              }}
            />
          </Form.Item>
          <Form.Item
            name="chartHeadingTextColor"
            label={
              <div className="mtdFormLabel">{getLanguageLabel("text")}</div>
            }
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            colon={false}
            rules={[
              {
                required: true,
                message: "This field is required",
              },
            ]}
          >
            <ColorPicker
              disabledAlpha
              size="small"
              presets={[
                {
                  label: getLanguageLabel("recommended"),
                  colors: KeplerConfig.colorPickerPreset,
                },
              ]}
              onChange={(value: Color, hex: string) => {
                updateConfig(hex, "chartHeadingTextColor");
              }}
            />
          </Form.Item>
          <Form.Item
            name="chartHeadingBg"
            label={
              <div className="mtdFormLabel">
                {getLanguageLabel("headingBackground")}
              </div>
            }
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            colon={false}
            rules={[
              {
                required: true,
                message: "This field is required",
              },
            ]}
          >
            <ColorPicker
              disabledAlpha
              size="small"
              presets={[
                {
                  label: getLanguageLabel("recommended"),
                  colors: KeplerConfig.colorPickerPreset,
                },
              ]}
              onChange={(value: Color, hex: string) => {
                updateConfig(hex, "chartHeadingBg");
              }}
            />
          </Form.Item>
        </>
      </MtdCollapse>

      <MtdCollapse
        collapsible="HEADER"
        header={getLanguageLabel("responsiveGrid")}
        key={`grid`}
      >
        <>
          <Form.Item
            name="preventCollision"
            label={
              <div className="mtdFormLabel">
                {getLanguageLabel("preventCollision")}
              </div>
            }
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            colon={false}
            rules={[
              {
                required: true,
                message: "This field is required",
              },
            ]}
            valuePropName="checked"
          >
            <Switch
              size="small"
              onChange={(value) => updateConfig(value, "preventCollision")}
            />
          </Form.Item>

          <Form.Item
            name="allowOverlap"
            label={
              <div className="mtdFormLabel">
                {getLanguageLabel("allowOverlap")}
              </div>
            }
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            colon={false}
            rules={[
              {
                required: true,
                message: "This field is required",
              },
            ]}
            valuePropName="checked"
          >
            <Switch
              size="small"
              onChange={(value) => updateConfig(value, "allowOverlap")}
            />
          </Form.Item>
        </>
      </MtdCollapse>
    </Form>
  );
};

export default DashboardGridConfig;
