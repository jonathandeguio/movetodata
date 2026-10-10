import { Form, InputNumber, Select, Slider, Switch } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React, { ReactNode, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { KeplerConfig } from "../charts.config";
import { FontCustomizer } from "./FontCustomizer";
import NumberCustomizer from "./NumberCustomizer";

interface ILabelCustomizer {
  series?: any;
}

export const LabelCustomizer: React.FC<ILabelCustomizer> = ({ series }) => {
  const { customize, query } = useSelector((state: RootState) => state.kepler);

  const showLabel = useMemo(() => {
    if (isDefined(series))
      return customize?.seriesCustomize?.[series]?.showLabel;
    else return customize.showLabel;
  }, [customize?.seriesCustomize, customize.showLabel]);

  return (
    <MtdCollapse
      collapsible={showLabel ? "HEADER" : "DISABLED"}
      key="labelCustomizer"
      header={
        <Form.Item
          name={isDefined(series) ? [series, "showLabel"] : "showLabel"}
          valuePropName="checked"
          label={
            <div className="query_item__heading">
              {getLanguageLabel("label")}
            </div>
          }
        >
          <Switch size={"small"} />
        </Form.Item>
      }
    >
      <>
        {["pieChart", "treeMapChart"].includes(query.chartType) && (
          <>
            <Form.Item
              name={isDefined(series) ? [series, "labelConfig"] : "labelConfig"}
              label={getLanguageLabel("labelConfig")}
            >
              <Select
                mode="multiple"
                options={KeplerConfig.pieLabelOptions.slice(
                  0,
                  query.chartType == "pieChart" ? 3 : 2
                )}
              />
            </Form.Item>
          </>
        )}
        {query.chartType !== "pieChart" &&
          query.chartType !== "sunBurstChart" && (
            <Form.Item
              name={
                isDefined(series) ? [series, "labelPosition"] : "labelPosition"
              }
              label={getLanguageLabel("labelPosition")}
            >
              <Select options={KeplerConfig.labelPositionOptions} />
            </Form.Item>
          )}
        <FontCustomizer
          series={isDefined(series) ? [series] : undefined}
          name="label"
        />
        <Form.Item
          name={isDefined(series) ? [series, "labelRotate"] : "labelRotate"}
          valuePropName="checked"
          label={getLanguageLabel("labelRotate")}
        >
          <Slider
            min={0}
            max={360}
            tooltip={{
              formatter: (Value: ReactNode | null) =>
                Value !== null ? <>{Value}°</> : <></>,
            }}
          />
        </Form.Item>
        {query.chartType === "pieChart" && (
          <Form.Item
            name={"pieLabelPercentagePrecision"}
            label={getLanguageLabel("percentagePrecision")}
          >
            <InputNumber defaultValue={0} min={0} max={5} />
          </Form.Item>
        )}
        <NumberCustomizer
          series={isDefined(series) ? [series] : undefined}
          name={"label"}
        />
      </>
    </MtdCollapse>
  );
};
