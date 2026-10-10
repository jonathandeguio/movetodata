import { Form, InputNumber } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { ColorCustomizer } from "./ColorCustomizer";
import { FontCustomizer } from "./FontCustomizer";
import NumberCustomizer from "./NumberCustomizer";

export const GaugeChartCustomizer = () => {
  return (
    <div style={{ width: "100%" }}>
      <div className="customizer-subHeader">
        <MtdCollapse
          key="additionSettings"
          collapsible={"HEADER"} header={<div className="query_item__heading">{getLanguageLabel("additional")}</div>}
          >
          <>
      <Form.Item name="maxValue" label={getLanguageLabel("maximumValue")}>
        <InputNumber placeholder="Max value" />
      </Form.Item>
      <Form.Item name="goalValue" label={getLanguageLabel("goal")}>
        <InputNumber placeholder={getLanguageLabel("goal")} />
      </Form.Item>
      <Form.Item name="axisLineWidth" label={getLanguageLabel("axisLine")}>
        <InputNumber min={6} max={20} placeholder={getLanguageLabel("axisLine")} />
      </Form.Item>

      <FontCustomizer label={getLanguageLabel("font")} name={"gaugeTitle"} />
      <NumberCustomizer name={"gauge"} />

      <ColorCustomizer />
      </>
      </MtdCollapse>
      </div>
    </div>
  );
};
