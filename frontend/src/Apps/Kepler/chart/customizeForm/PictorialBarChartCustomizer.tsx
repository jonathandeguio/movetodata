import { Form, Select, Switch } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const PictorialBarChartCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="pictorialBarSettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        <>
          <Form.Item
            name="pictorialBarSymbol"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("symbol") ?? "Symbol"}
              </div>
            }
          >
            <Select
              options={[
                { label: "Circle", value: "circle" },
                { label: "Rectangle", value: "rect" },
                { label: "Rounded Rect", value: "roundRect" },
                { label: "Triangle", value: "triangle" },
                { label: "Diamond", value: "diamond" },
                { label: "Pin", value: "pin" },
                { label: "Arrow", value: "arrow" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="pictorialBarSymbolRepeat"
            valuePropName="checked"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("symbolRepeat") ?? "Repeat Symbol"}
              </div>
            }
          >
            <Switch size="small" />
          </Form.Item>
        </>
      </MtdCollapse>
    </div>
  );
};
