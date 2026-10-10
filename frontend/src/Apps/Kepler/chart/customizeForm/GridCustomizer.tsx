import { Form, InputNumber, Space } from "antd";
import {
  GaugeIcon,
  GroupedColumnIcon,
  LineChartIcon,
  MapIcon,
  PieChartIcon,
  RadarIcon,
  ScatterIcon,
  SmallAreaChartIcon,
  StackedGroupedBarIcon,
  SunburstIcon,
  TreeMapIcon,
  WaterFallIcon,
  WordCloudIcon,
} from "assets/icons/mtdChartIcons";
import { BigNumberIcon } from "assets/icons/mtdDataIcons";
import { HelpIcon } from "assets/icons/mtdMiscellaneousIcons";
import { TableCellIcon } from "assets/icons/mtdTableIcons";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

interface IGridCustomizer {
  query: any;
  type: "INNER" | "OUTER";
}

export const GridCustomizer: React.FC<IGridCustomizer> = ({ query, type }) => {
  const size = 28;
  let chartIcon = <HelpIcon size={22} color={"#FFA500"} />;

  switch (query.chartType) {
    // Charts
    case "pieChart":
      chartIcon = <PieChartIcon size={size} />;
      break;
    case "bigNumber":
      chartIcon = <BigNumberIcon size={size} />;
      break;
    case "mapChart":
      chartIcon = <MapIcon size={size} />;
      break;
    case "gaugeChart":
      chartIcon = <GaugeIcon size={size} />;
      break;
    case "radarChart":
      chartIcon = <RadarIcon size={size} />;
      break;
    case "sunBurstChart":
      chartIcon = <SunburstIcon size={size} />;
      break;
    case "table":
      chartIcon = <TableCellIcon size={size} />;
      break;
    case "lineChart":
      chartIcon = <LineChartIcon size={size} />;
      break;
    case "barChart":
      chartIcon = <GroupedColumnIcon size={size} />;
      break;
    case "lineAreaChart":
      chartIcon = <SmallAreaChartIcon size={size} />;
      break;
    case "treeMapChart":
      chartIcon = <TreeMapIcon size={size} />;
      break;
    case "wordCloudChart":
      chartIcon = <WordCloudIcon size={size} />;
      break;
    case "waterFallChart":
      chartIcon = <WaterFallIcon size={size} />;
      break;
    case "scatterChart":
      chartIcon = <ScatterIcon size={size} />;
      break;
    case "VerticalAxisChart":
      switch (query?.series?.[0].seriesType) {
        case "lineChart":
          chartIcon = <LineChartIcon size={size} />;
          break;
        case "barChart":
          chartIcon = <GroupedColumnIcon size={size} />;
          break;
        case "lineAreaChart":
          chartIcon = <SmallAreaChartIcon size={size} />;
          break;
        case "scatterChart":
          chartIcon = <ScatterIcon size={size} />;
          break;
        default:
          chartIcon = <GroupedColumnIcon size={size} color={"#FFA500"} />;
          break;
      }
      break;
    case "horizontalBarChart":
      chartIcon = <StackedGroupedBarIcon size={size} />;
      break;
    default:
      chartIcon = <GroupedColumnIcon size={size} color={"#FFA500"} />;
      break;
  }

  return (
    <MtdCollapse
      key="customizerCollapse"
      header={
        <div className="query_item__heading">
          {type == "OUTER"
            ? getLanguageLabel("canvas")
            : getLanguageLabel("innerPadding")}
        </div>
      }
      collapsible="HEADER"
    >
      <div className="gridCustomizer">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Space.Compact direction="vertical">
            {type == "OUTER" ? (
              <Form.Item name={"gridMarginTop"}>
                <InputNumber
                  min={0}
                  max={50}
                  formatter={(value) => `${value}%`}
                  placeholder="Top"
                />
              </Form.Item>
            ) : (
              <Form.Item name={"gridMarginTopInner"}>
                <InputNumber
                  min={0}
                  max={50}
                  formatter={(value) => `${value}%`}
                  placeholder="Top"
                />
              </Form.Item>
            )}
          </Space.Compact>
        </div>
        <div
          style={{
            display: "flex",
            padding: "0.7rem 0",
            justifyContent: "space-between",
          }}
        >
          <Space.Compact direction="horizontal">
            {type == "OUTER" ? (
              <Form.Item name={"gridMarginLeft"}>
                <InputNumber
                  min={0}
                  max={50}
                  formatter={(value) => `${value}%`}
                  placeholder="Left"
                />
              </Form.Item>
            ) : (
              <Form.Item name={"gridMarginLeftInner"}>
                <InputNumber
                  min={0}
                  max={50}
                  formatter={(value) => `${value}%`}
                  placeholder="Left"
                />
              </Form.Item>
            )}
          </Space.Compact>
          {chartIcon}
          <Space.Compact direction="horizontal">
            {type == "INNER" ? (
              <Form.Item name={"gridMarginRightInner"}>
                <InputNumber
                  min={0}
                  max={50}
                  formatter={(value) => `${value}%`}
                  placeholder="Right"
                />
              </Form.Item>
            ) : (
              <Form.Item name={"gridMarginRight"}>
                <InputNumber
                  min={0}
                  max={50}
                  formatter={(value) => `${value}%`}
                  placeholder="Right"
                />
              </Form.Item>
            )}
          </Space.Compact>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Space.Compact direction="vertical">
            {type == "INNER" ? (
              <Form.Item name={"gridMarginBottomInner"}>
                <InputNumber
                  min={0}
                  max={50}
                  formatter={(value) => `${value}%`}
                  placeholder="Bottom"
                />
              </Form.Item>
            ) : (
              <Form.Item name={"gridMarginBottom"}>
                <InputNumber
                  min={0}
                  max={50}
                  formatter={(value) => `${value}%`}
                  placeholder="Bottom"
                />
              </Form.Item>
            )}
          </Space.Compact>
        </div>
      </div>
    </MtdCollapse>
  );
};
