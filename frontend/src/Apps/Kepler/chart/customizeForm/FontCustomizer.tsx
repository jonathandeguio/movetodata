import {
  ColorPicker,
  Form,
  InputNumber,
  Select,
  Space,
  Typography,
} from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { KeplerConfig } from "../charts.config";

const { Text } = Typography;

interface IFontCustomizer {
  name: string;
  label?: string;
  series?: string[];
  hasFormatter?: boolean;
}

export const FontCustomizer: React.FC<IFontCustomizer> = ({
  name,
  label,
  series,
  hasFormatter,
}) => {
  return (
    <>
      <Form.Item
        label={label ?? getLanguageLabel("font")}
        style={{ width: "100%" }}
      >
        <Space.Compact style={{ width: "100%" }}>
          <Form.Item
            name={
              isDefined(series)
                ? [...series, `${name}FontSize`]
                : `${name}FontSize`
            }
            style={{ width: "100%" }}
          >
            <InputNumber
              min={10}
              // formatter={(value) => `${value}px`}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            name={
              isDefined(series)
                ? [...series, `${name}FontWeight`]
                : `${name}FontWeight`
            }
            style={{ width: "100%" }}
          >
            <Select
              placeholder={"Font Weight"}
              style={{ width: "100%" }}
              options={[
                {
                  label: (
                    <Text style={{ fontWeight: "100" }}>
                      {getLanguageLabel("thin")}
                    </Text>
                  ),
                  value: 100,
                },
                {
                  label: (
                    <Text style={{ fontWeight: "500" }}>
                      {getLanguageLabel("normal")}
                    </Text>
                  ),
                  value: 500,
                },
                {
                  label: (
                    <Text style={{ fontWeight: "1000" }}>
                      {getLanguageLabel("bold")}
                    </Text>
                  ),
                  value: 1000,
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name={
              isDefined(series)
                ? [...series, `${name}FontColor`]
                : `${name}FontColor`
            }
            getValueFromEvent={(color) => {
              const hexColor = color.toHex();
              return hexColor === "00000000" ? undefined : "#" + hexColor;
            }}
          >
            <ColorPicker
              disabledAlpha
              format="rgb"
              presets={[
                {
                  label: getLanguageLabel("recommended"),
                  colors: KeplerConfig.colorPickerPreset,
                },
              ]}
            />
          </Form.Item>
        </Space.Compact>
      </Form.Item>

      {!!hasFormatter && (
        <Form.Item label={getLanguageLabel("format")} style={{ width: "100%" }}>
          <Space.Compact style={{ width: "100%" }}>
            <Form.Item
              name={
                isDefined(series)
                  ? [...series, `${name}FontPrefix`]
                  : `${name}FontPrefix`
              }
              style={{ width: "100%" }}
            >
              <MtdInput
                maxLength={5}
                showCount={{
                  formatter: (args) => <>{50 - args.value.length}</>,
                }}
                placeholder={getLanguageLabel("prefix")}
              />
            </Form.Item>
            <Form.Item
              name={
                isDefined(series)
                  ? [...series, `${name}FontSuffix`]
                  : `${name}FontSuffix`
              }
              style={{ width: "100%" }}
            >
              <MtdInput
                maxLength={5}
                showCount={{
                  formatter: (args) => <>{50 - args.value.length}</>,
                }}
                placeholder={getLanguageLabel("suffix")}
              />
            </Form.Item>
          </Space.Compact>
        </Form.Item>
      )}
    </>
  );
};
