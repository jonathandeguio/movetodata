import { ColorPicker, Form } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const CandlestickChartCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="candlestickSettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        <>
          <Form.Item
            name="candlestickBullishColor"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("bullishColor") ?? "Bullish Color"}
              </div>
            }
            getValueFromEvent={(color) => color.toHexString()}
          >
            <ColorPicker size="small" />
          </Form.Item>

          <Form.Item
            name="candlestickBearishColor"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("bearishColor") ?? "Bearish Color"}
              </div>
            }
            getValueFromEvent={(color) => color.toHexString()}
          >
            <ColorPicker size="small" />
          </Form.Item>
        </>
      </MtdCollapse>
    </div>
  );
};
