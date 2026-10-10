import { Form, Switch } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

export const WaterFallChartCustomizer = () => {
  return (
    <MtdCollapse key={"additional"} collapsible={"HEADER"} header={<div className="query_item__heading">{getLanguageLabel("additional")}</div>} >
      <>
      <Form.Item
        label={
          <div className="query_item__heading">
            {getLanguageLabel("showTotalSum")}
          </div>
        }
        name="showTotalSum"
      >
        <Switch size="small" />
      </Form.Item>
      </>
      </MtdCollapse>
  );
};
