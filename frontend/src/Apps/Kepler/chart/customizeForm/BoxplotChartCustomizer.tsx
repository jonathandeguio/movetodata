import { Form } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const BoxplotChartCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="boxplotSettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        {/* Box color is driven by the theme selector above */}
        <Form.Item
          label={
            <div className="query_item__heading">
              {getLanguageLabel("colorTheme") ?? "Color"}
            </div>
          }
        >
          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            {getLanguageLabel("useThemeSelector") ?? "Use the theme selector above to change colors."}
          </span>
        </Form.Item>
      </MtdCollapse>
    </div>
  );
};
