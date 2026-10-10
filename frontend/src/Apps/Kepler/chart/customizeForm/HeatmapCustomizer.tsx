import { Form, InputNumber, Switch } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const HeatmapCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="heatmapSettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        <>
          <Form.Item
            name="heatmapShowLabel"
            valuePropName="checked"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("showLabel") ?? "Show Cell Labels"}
              </div>
            }
          >
            <Switch size="small" />
          </Form.Item>

          <Form.Item
            name="heatmapMin"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("minValue") ?? "Min Value"}
              </div>
            }
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="heatmapMax"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("maxValue") ?? "Max Value"}
              </div>
            }
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </>
      </MtdCollapse>
    </div>
  );
};
