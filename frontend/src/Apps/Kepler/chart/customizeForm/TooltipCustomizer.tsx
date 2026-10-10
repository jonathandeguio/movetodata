import { Collapse, Form, Select, Switch } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel } from "utils/utilities";
import { chartConfig } from "../charts.config";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import NumberCustomizer from "./NumberCustomizer";

const { Panel } = Collapse;

interface ITooltipCustomizer {
  chartType: string;
}

export const TooltipCustomizer: React.FC<ITooltipCustomizer> = ({
  chartType,
}) => {
  const customizeForm = useSelector(
    (state: RootState) => state.kepler.customizeForm
  );
  const tooltipValue = Form.useWatch("tooltip", customizeForm);

  const querySkeleton = chartConfig[chartType];

  return (
    <MtdCollapse
      key="tooltipPanel"
      collapsible={tooltipValue === true ? "HEADER" : "DISABLED"}
      header={
        // <div className="query_item__heading">{}</div>
        <Form.Item
          name="tooltip"
          label={
            <div className="query_item__heading">
              {getLanguageLabel("tooltip")}
            </div>
          }
          valuePropName="checked"
        >
          <Switch size={"small"} />
        </Form.Item>
      }
    >
      <>
        {tooltipValue === true && querySkeleton.meta.isAxisChart && (
          <>
            <Form.Item
              name="tooltipAxisTrigger"
              label={getLanguageLabel("tooltipAxisTrigger")}
            >
              <Select
                options={[
                  {
                    label: getLanguageLabel("axis"),
                    value: "axis",
                  },
                  {
                    label: getLanguageLabel("item"),
                    value: "item",
                  },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="tooltipAxisPointer"
              label={getLanguageLabel("tooltipAxisPointer")}
              valuePropName="checked"
            >
              <Switch size={"small"} />
            </Form.Item>
          </>
        )}
        <NumberCustomizer name="tooltip" />
      </>
    </MtdCollapse>
  );
};
