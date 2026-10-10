import { Form, Select, Slider } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const FunnelChartCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="funnelSettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        <>
          <Form.Item
            name="funnelSort"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("sortDirection") ?? "Sort Direction"}
              </div>
            }
          >
            <Select
              options={[
                { label: "Descending", value: "descending" },
                { label: "Ascending", value: "ascending" },
                { label: "None", value: "none" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="funnelGap"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("gap") ?? "Gap"}
              </div>
            }
          >
            <Slider min={0} max={20} tooltip={{ open: false }} />
          </Form.Item>

          <Form.Item
            name="funnelLabelPosition"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("labelPosition") ?? "Label Position"}
              </div>
            }
          >
            <Select
              options={[
                { label: "Inside", value: "inside" },
                { label: "Left", value: "left" },
                { label: "Right", value: "right" },
              ]}
            />
          </Form.Item>
        </>
      </MtdCollapse>
    </div>
  );
};
