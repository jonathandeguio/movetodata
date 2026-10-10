import { Form, Select, Switch } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const GraphChartCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="graphSettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        <>
          <Form.Item
            name="graphLayout"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("layout") ?? "Layout"}
              </div>
            }
          >
            <Select
              options={[
                { label: "Force", value: "force" },
                { label: "Circular", value: "circular" },
                { label: "None", value: "none" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="graphRoam"
            valuePropName="checked"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("roam") ?? "Enable Roam"}
              </div>
            }
          >
            <Switch size="small" />
          </Form.Item>

          <Form.Item
            name="graphShowLabel"
            valuePropName="checked"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("showLabel") ?? "Show Labels"}
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
