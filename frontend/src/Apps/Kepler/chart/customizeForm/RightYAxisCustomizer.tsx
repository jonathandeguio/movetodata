import {
  Collapse,
  Divider,
  Form,
  InputNumber,
  Radio,
  Switch
} from "antd";
import {
  BottomAlignIcon,
  MiddleAlignIcon,
  TopAlignIcon,
} from "assets/icons/mtdActionIcons";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { KeplerConfig } from "../charts.config";
import { FontCustomizer } from "./FontCustomizer";
import NumberCustomizer from "./NumberCustomizer";
const { Panel } = Collapse;

export const RightYAxisCustomizer = () => {
  return (
    <MtdCollapse
      collapsible="HEADER"
      header={
        <div className="query_item__heading">
          {getLanguageLabel("rightVerticalAxis")}
        </div>
      }
      key="rightYAxisCustomizerPanel"
    >
      <div className="radioButtonPadding">
        {/* SHOW X AND Y AXIS CONTROL FOR OLY LINECHART, BARTCHART, LINEAREACHART */}
        {
          <>
            <Form.Item name="yaxisRight" label={getLanguageLabel("label")}>
              <MtdInput
                placeholder="Input Right Y Axis label"
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
              name="rightYAxisLabel"
            />

            <Form.Item
              name="yaxisRightTitleMargin"
              label={getLanguageLabel("margin")}
            >
              <InputNumber
                placeholder={getLanguageLabel("margin")}
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item
              name="yAxisRightTitlePosition"
              label={getLanguageLabel("position")}
              style={{ width: "100%" }}
            >
              {/* <Select options={verticalAlignOptionsList} /> */}
              <Radio.Group size="small">
                <Radio.Button value="start">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <TopAlignIcon />
                  </div>
                </Radio.Button>
                <Radio.Button value="middle">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <MiddleAlignIcon />
                  </div>
                </Radio.Button>
                <Radio.Button value="end">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <BottomAlignIcon />
                  </div>
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Divider />
            <FontCustomizer name="rightYAxis" />

            <Form.Item
              name="reversed"
              label={getLanguageLabel("inversedrightyaxis")}
              valuePropName="checked"
            >
              <Switch size={"small"} />
            </Form.Item>

            <NumberCustomizer name={"rightYAxis"} />
          </>
        }
      </div>
    </MtdCollapse>
  );
};
