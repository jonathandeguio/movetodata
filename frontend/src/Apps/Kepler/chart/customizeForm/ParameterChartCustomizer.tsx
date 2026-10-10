import { Checkbox, Form, Select } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const ParameterChartCustomizer = () => {
  return (
    <>
      <MtdCollapse
        header={
          <div className="query_item__heading">
            {getLanguageLabel("parametersChart")}
          </div>
        }
        collapsible="HEADER"
        key="parametersChart"
      >
        <>
          <Form.Item
            name="allowMultiselect"
            label={<div className="query_item__heading">{"Multiselect"}</div>}
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>

          <Form.Item
            name="layout"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("layout")}
              </div>
            }
          >
            <Select
              options={[
                {
                  label: getLanguageLabel("horizontal"),
                  value: "horizontal",
                },
                {
                  label: getLanguageLabel("vertical"),
                  value: "vertical",
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="parameterFormSize"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("size")}
              </div>
            }
          >
            <Select
              options={[
                {
                  label: getLanguageLabel("small"),
                  value: "small",
                },
                {
                  label: getLanguageLabel("medium"),
                  value: "middle",
                },
                {
                  label: getLanguageLabel("large"),
                  value: "large",
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="parameterLabelPosition"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("labelPosition")}
              </div>
            }
          >
            <Select
              options={[
                {
                  label: "Hidden",
                  value: "hidden",
                },
                {
                  label: getLanguageLabel("left"),
                  value: "left",
                },
                {
                  label: "Placeholder",
                  value: "placeholder",
                },
              ]}
            />
          </Form.Item>
        </>
      </MtdCollapse>
    </>
  );
};
