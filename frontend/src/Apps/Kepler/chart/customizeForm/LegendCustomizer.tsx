import { Collapse, Form, Select, Switch } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel } from "utils/utilities";

const { Panel } = Collapse;

export const LegendCustomizer = () => {
  const customizeForm = useSelector(
    (state: RootState) => state.kepler.customizeForm
  );
  const legendValue = Form.useWatch("legend", customizeForm);

  return (
    <MtdCollapse
      key="legendPanel"
      collapsible={legendValue === true ? "HEADER" : "DISABLED"}
      header={
        <Form.Item
          name="legend"
          label={
            <div className="query_item__heading">
              {getLanguageLabel("legend")}
            </div>
          }
          valuePropName="checked"
        >
          <Switch size={"small"} />
        </Form.Item>
      }
    >
      <>
        {/* <Form.Item name="legendType" label={getLanguageLabel("type")}>
          <Select
            options={[
              {
                label: getLanguageLabel("scroll"),
                value: "scroll",
              },
              {
                label: getLanguageLabel("plain"),
                value: "plain",
              },
            ]}
          />
        </Form.Item> */}
        <Form.Item name="legendPosition" label={getLanguageLabel("position")}>
          <Select
            options={[
              {
                label: getLanguageLabel("top"),
                value: "top",
              },
              {
                label: getLanguageLabel("right"),
                value: "right",
              },
              {
                label: getLanguageLabel("bottom"),
                value: "bottom",
              },
              {
                label: getLanguageLabel("left"),
                value: "left",
              },
            ]}
          />
        </Form.Item>
        <Form.Item name="legendAlign" label={getLanguageLabel("align")}>


          
          <Select
            options={[
              {
                label: getLanguageLabel("start"),
                value: "start",
              },
              {
                label: getLanguageLabel("middle"),
                value: "middle",
              },
              {
                label: getLanguageLabel("end"),
                value: "end",
              },
            ]}
          />
        </Form.Item>
      </>
    </MtdCollapse>
  );
};
