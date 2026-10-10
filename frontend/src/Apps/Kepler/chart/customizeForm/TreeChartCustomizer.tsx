import { Form, Select } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const TreeChartCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="treeSettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        <>
          <Form.Item
            name="treeOrient"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("orientation") ?? "Orientation"}
              </div>
            }
          >
            <Select
              options={[
                { label: "Left → Right", value: "LR" },
                { label: "Right → Left", value: "RL" },
                { label: "Top → Bottom", value: "TB" },
                { label: "Bottom → Top", value: "BT" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="treeLayout"
            label={
              <div className="query_item__heading">
                {getLanguageLabel("layout") ?? "Layout"}
              </div>
            }
          >
            <Select
              options={[
                { label: "Orthogonal", value: "orthogonal" },
                { label: "Radial", value: "radial" },
              ]}
            />
          </Form.Item>
        </>
      </MtdCollapse>
    </div>
  );
};
