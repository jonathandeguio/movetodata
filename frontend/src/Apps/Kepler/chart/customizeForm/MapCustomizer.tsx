import { Collapse, ColorPicker, Form } from "antd";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { KeplerConfig } from "../charts.config";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";

const { Panel } = Collapse;

export const MapCustomizer = () => {
  return (
    <MtdCollapse
      collapsible="HEADER"
      header={
        <div className="query_item__heading">
          {`${getLanguageLabel("mapChart")} ${getLanguageLabel("options")}`}
        </div>
      }
      key="mapChartPanel"
    >
      <Form.Item
        name="scatterColor"
        label={getLanguageLabel("scatterColor")}
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
    </MtdCollapse>
  );
};
