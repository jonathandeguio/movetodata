import { Form, Select } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const SankeyChartCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="sankeySettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        <>
          <Form.Item
            name="sankeyOrient"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("orientation") ?? "Orientation"}
              </div>
            }
          >
            <Select
              options={[
                { label: "Horizontal", value: "horizontal" },
                { label: "Vertical", value: "vertical" },
              ]}
            />
          </Form.Item>
        </>
      </MtdCollapse>
    </div>
  );
};
