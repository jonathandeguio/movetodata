import { Divider, Form, InputNumber, Radio, Select } from "antd";
import {
  CenterAlignIcon,
  LeftAlignIcon,
  RightAlignIcon,
} from "assets/icons/mtdFileIcons";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { KeplerConfig } from "../charts.config";
import { FontCustomizer } from "./FontCustomizer";
import NumberCustomizer from "./NumberCustomizer";

export const XAxisCustomizer = () => {
  return (
    <MtdCollapse
      header={
        <div className="query_item__heading">{getLanguageLabel("xAxis")}</div>
      }
      key="xAxisPanel"
      collapsible="HEADER"
    >
      <div className="radioButtonPadding">
        {/* SHOW X AND Y AXIS CONTROL FOR OLY LINECHART, BARTCHART, LINEAREACHART */}

        {
          <>
            <Form.Item name="xaxis" label={getLanguageLabel("title")}>
              <MtdInput
                placeholder={getLanguageLabel("title")}
                maxLength={KeplerConfig.chartLabelMaxLength}
                showCount={{
                  formatter: (args) => (
                    <>{KeplerConfig.chartLabelMaxLength - args.value.length}</>
                  ),
                }}
              />
            </Form.Item>

            <FontCustomizer
              label={`${getLanguageLabel("font")}`}
              name="xAxisLabel"
            />
            <Form.Item
              name="xaxisTitleMargin"
              label={getLanguageLabel("margin")}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder={getLanguageLabel("margin")}
              />
            </Form.Item>
            <Form.Item
              name="xaxisTitlePosition"
              label={getLanguageLabel("position")}
              style={{ width: "100%" }}
            >
              <Radio.Group size="small">
                <Radio.Button value="start">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <LeftAlignIcon />
                  </div>
                </Radio.Button>
                <Radio.Button value="middle">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <CenterAlignIcon />
                  </div>
                </Radio.Button>
                <Radio.Button value="end">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <RightAlignIcon />
                  </div>
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Divider />

            <FontCustomizer name="xAxis" label={getLanguageLabel("tickFont")} />
            <NumberCustomizer name={"xAxis"} />
            <Form.Item
              name="xaxisSplitLine"
              label={getLanguageLabel("splitLine")}
            >
              <Select
                options={[
                  {
                    label: getLanguageLabel("none"),
                    value: "none",
                  },
                  {
                    label: getLanguageLabel("solid"),
                    value: "solid",
                  },
                  {
                    label: getLanguageLabel("dashed"),
                    value: "dashed",
                  },
                  {
                    label: getLanguageLabel("dotted"),
                    value: "dotted",
                  },
                ]}
              />
            </Form.Item>
          </>
        }
      </div>
    </MtdCollapse>
  );
};
