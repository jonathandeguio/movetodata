import { Form, InputNumber, Select, Switch } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { KeplerConfig } from "../charts.config";
import { FontCustomizer } from "./FontCustomizer";
import NumberCustomizer from "./NumberCustomizer";

export const SliceLabelCustomizer = ({
  chartCustomize,
}: {
  chartCustomize: any;
}) => {
  return (
    <MtdCollapse
      key="pieSiceCustomizer"
      header={
        <Form.Item
          name={"sliceLabel"}
          valuePropName="checked"
          label={
            <div className="query_item__heading">
              {getLanguageLabel("sliceLabel")}
            </div>
          }
        >
          <Switch size={"small"} />
        </Form.Item>
      }
      collapsible={chartCustomize.sliceLabel ? "HEADER" : "DISABLED"}
    >
      <>
        <Form.Item
          name={"sliceLabelConfig"}
          label={getLanguageLabel("labelConfig")}
        >
          <Select mode="multiple" options={KeplerConfig.pieLabelOptions} />
        </Form.Item>
        <FontCustomizer name="sliceLabel" />
        <Form.Item
          name={"sliceLabelPercentagePrecision"}
          label={getLanguageLabel("percentagePrecision")}
        >
          <InputNumber defaultValue={0} min={0} max={5} />
        </Form.Item>
        <NumberCustomizer name="sliceLabel" />
      </>
    </MtdCollapse>
  );
};
