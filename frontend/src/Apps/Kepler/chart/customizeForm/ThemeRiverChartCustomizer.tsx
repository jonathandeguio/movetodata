import { Form, Select } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const ThemeRiverChartCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="themeRiverSettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        <>
          <Form.Item
            name="themeRiverEmphasis"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("emphasisMode") ?? "Emphasis Mode"}
              </div>
            }
          >
            <Select
              options={[
                { label: "Series", value: "series" },
                { label: "Item", value: "item" },
                { label: "None", value: "none" },
              ]}
            />
          </Form.Item>
        </>
      </MtdCollapse>
    </div>
  );
};
