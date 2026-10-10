import { Form, Slider } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const ParallelChartCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="parallelSettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        <>
          <Form.Item
            name="parallelLineOpacity"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("opacity") ?? "Line Opacity"}
              </div>
            }
          >
            <Slider min={0} max={1} step={0.05} tooltip={{ open: false }} />
          </Form.Item>
        </>
      </MtdCollapse>
    </div>
  );
};
