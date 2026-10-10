import { Form, Slider, Switch } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel } from "utils/utilities";
import { ColorCustomizer } from "./ColorCustomizer";
import { FontCustomizer } from "./FontCustomizer";
import { LabelCustomizer } from "./LabelCustomizer";
import NumberCustomizer from "./NumberCustomizer";
import { SliceLabelCustomizer } from "./SliceLabelCustomizer";

export const PieChartCustomizer = () => {
  const chartCustomize = useSelector(
    (state: RootState) => state.kepler.customize
  );
  return (
    <>
      <div className="customizer-subHeader">
        <MtdCollapse
          key="additionSettings"
          collapsible={"HEADER"}
          header={
            <div className="query_item__heading">
              {getLanguageLabel("additional")}
            </div>
          }
        >
          <>
            <Form.Item
              name={"radius"}
              label={
                <div className="query_item__heading">
                  {getLanguageLabel("radius")}
                </div>
              }
            >
              <Slider min={50} max={95} tooltip={{ open: false }} />
            </Form.Item>
            <Form.Item
              name={"innerRadius"}
              label={
                <div className="query_item__heading">
                  {getLanguageLabel("innerRadius")}
                </div>
              }
            >
              <Slider min={0} max={100} tooltip={{ open: false }} />
            </Form.Item>

            <Form.Item
              name={"nightangle"}
              valuePropName="checked"
              label={
                <div className="query_item__heading">
                  {getLanguageLabel("nightangaleChart")}
                </div>
              }
            >
              <Switch size={"small"} />
            </Form.Item>
          </>
        </MtdCollapse>
      </div>
      <ColorCustomizer />

      <LabelCustomizer />
      <SliceLabelCustomizer chartCustomize={chartCustomize} />
      <div className="customizer-subHeader">
        <MtdCollapse
          key="showSumCustomizer"
          header={
            <Form.Item
              name={"showSum"}
              valuePropName="checked"
              label={
                <div className="query_item__heading">
                  {getLanguageLabel("displaySum")}
                </div>
              }
            >
              <Switch size={"small"} />
            </Form.Item>
          }
          collapsible={chartCustomize.showSum ? "HEADER" : "DISABLED"}
        >
          <>
            <FontCustomizer name="sum" />
            <NumberCustomizer name="showSum" />
          </>
        </MtdCollapse>
      </div>
    </>
  );
};
