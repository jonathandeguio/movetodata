import { Form, InputNumber, Select, Space } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { ColorCustomizer } from "./ColorCustomizer";

export const WordCloudChartCustomizer = () => {
  return (
    <>
    <MtdCollapse key={"additional"} collapsible={"HEADER"} header={<div className="query_item__heading">{getLanguageLabel("additional")}</div>} >
      <>
      <Form.Item name="wordCloudShape" label={getLanguageLabel("shape")}>
        <Select
          options={[
            {
              label: "Circle",
              value: "circle",
            },
            {
              label: "Cardioid",
              value: "cardioid",
            },
            {
              label: "Diamond",
              value: "diamond",
            },
            {
              label: "Triangle-forward",
              value: "triangle-forward",
            },
            {
              label: "Triangle",
              value: "triangle",
            },
            {
              label: "Pentagon",
              value: "pentagon",
            },
            {
              label: "Star",
              value: "star",
            },
          ]}
        />
      </Form.Item>
      <Space.Compact style={{ width: "100%" }}>
        <Form.Item
          style={{ width: "100%" }}
          name="wordCloudMinFontSize"
          label={getLanguageLabel("fontRange")}
        >
          <InputNumber />
        </Form.Item>
        <Form.Item name="wordCloudMaxFontSize">
          <InputNumber />
        </Form.Item>
      </Space.Compact>
      </>
      </MtdCollapse>
      <ColorCustomizer />
    </>
  );
};
