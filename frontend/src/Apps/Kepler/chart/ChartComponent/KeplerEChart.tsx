import { TooltipInfo } from "Apps/Kepler/kepler";
import { eChartDarkTheme } from "Apps/Kepler/utils/echartDarkTheme";
import { fixYAxisNameGap } from "Apps/Kepler/utils/paddingFixEChart";
import * as echarts from "echarts";
import "echarts-wordcloud";
import { useComponentSize } from "hooks/useComponentSize";
import React, { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { isCurrentConfigThemeDark, isDefined } from "utils/utilities";
import { sunBurstChartArrPrepare } from "../charts.utils";
import { ZoomOutIcon } from "assets/icons/mtdNavigationIcon";
echarts.registerTheme("dark-movetodata", eChartDarkTheme);

function KeplerEChart({
  options,
  onClickChart,
  tooltipInfo,
  setTooltip,
  id,
  chartType,
}: {
  options: any;
  onClickChart?: any;
  tooltipInfo?: TooltipInfo;
  setTooltip?: any;
  id?: string;
  chartType?: string;
}) {
  let chartInstance = useRef<any>(null);
  const chartRef = useRef<any>(null);
  const size = useComponentSize(chartRef);
  const { user } = useSelector((state: RootState) => state.userDetails);

  const nameArray: string[] = useMemo(() => {
    const nameArr: string[] = [];
    if (isDefined(options)) {
      if (chartType === "pieChart" || chartType === "wordCloudChart") {
        return options.series?.[0]?.data?.map((dElement: any) => dElement.name) ?? [];
      } else if (chartType === "VerticalAxisChart") {
        return options.xAxis?.data ?? [];
      } else if (chartType === "sunBurstChart") {
        sunBurstChartArrPrepare(options.series?.[0]?.data ?? [], nameArr);
        return nameArr;
      }
    }
    return [];
  }, [options]);

  const renderChart = () => {
    if (chartRef !== null && chartRef.current !== null) {
      const renderInstance: echarts.EChartsType | undefined =
        echarts.getInstanceByDom(chartRef.current);

      if (renderInstance) {
        chartInstance.current = renderInstance;
      } else {
        chartInstance.current = echarts.init(
          chartRef.current,
          isCurrentConfigThemeDark(user) ? "dark-movetodata" : "light",
          {}
        );
      }

      if (isDefined(setTooltip) && chartType === "VerticalAxisChart")
        [
          (options.tooltip = {
            ...options.tooltip,
            trigger: "axis",
          }),
        ];

      chartInstance.current.setOption(options, true);
      chartInstance.current.on("click", (params: any) => {
        onClickChart(params);
      });

      chartInstance.current.on("legendselectchanged", function (params: any) {
        onClickChart(params);
      });
      chartInstance.current.on("datazoom", function (params: any) {});
    }
  };

  useEffect(() => {
    if (chartRef !== null && chartRef.current !== null) {
      const chart: echarts.EChartsType | undefined = echarts.getInstanceByDom(
        chartRef.current
      );

      if (isDefined(chart) && isDefined(id) && isDefined(nameArray)) {
        let seriesIndex: any = undefined;
        const dataIndex = isDefined(tooltipInfo)
          ? nameArray.findIndex((ele) => {
              if (typeof ele == "string") {
                return ele == tooltipInfo?.name;
              } else if (Array.isArray(ele)) {
                return ele[0] == tooltipInfo?.name;
              }
            })
          : undefined;

        if (
          isDefined(tooltipInfo) &&
          tooltipInfo.id !== id &&
          dataIndex != -1
        ) {
          try {
            chart.dispatchAction({
              type: "showTip",
              seriesIndex: 0,
              dataIndex: dataIndex,
              depth: 0,
            });
          } catch (e) {}
        } else {
          try {
            chart.dispatchAction({
              type: "hideTip",
            });
            chart.dispatchAction({
              type: "downplay",
              seriesIndex: seriesIndex ?? 0,
              dataIndex: dataIndex ?? 0,
              depth: -1,
            });
          } catch (e) {}
        }
      }
    }
  }, [tooltipInfo, id, nameArray]);

  useEffect(() => {
    renderChart();

    if (chartInstance.current) fixYAxisNameGap(chartInstance.current, options);

    if (chartInstance != null) {
      // chartInstance.resize({
      //   height: size.height,
      // });

      chartInstance.current.dispatchAction({
        type: "takeGlobalCursor",
        key: "dataZoomSelect",
        dataZoomSelectActive: true,
      });

      // window.onresize = () => chartInstance.resize();

      chartInstance.current.on("mouseover", (args: any) => {
        if (isDefined(id)) {
          setTooltip?.({
            id: id,
            name: args.name,
          });
        }
      });
      chartInstance.current.on("mouseout", () => {
        setTooltip?.(undefined);
      });
    }

    return () => {
      if (chartInstance !== undefined) chartInstance.current.dispose();
    };
  }, [options, size, id]);

  return (
    <>
      <div
        id="kepler-echart"
        ref={chartRef}
        style={{
          width: "100%",
        }}
      ></div>
      {["VerticalAxisChart", "waterFallChart", "horizontalBarChart"].includes(
        chartType ?? ""
      ) && (
        <div
          className="data-zoom-reset-icon"
          onClick={() => {
            chartInstance.current?.dispatchAction({
              type: "dataZoom",
              start: 0,
              end: 100,
            });
          }}
        >
          <ZoomOutIcon size={14} />
        </div>
      )}
    </>
  );
}

export default KeplerEChart;
