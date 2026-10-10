import { KeplerChartResponse, TooltipInfo } from "Apps/Kepler/kepler";
import { MtdShimmer } from "components/MtdShimmer";
import React, { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import {
  getLanguageLabel,
  isCurrentConfigThemeDark,
  isDefined,
  isEmpty,
} from "utils/utilities";
import EmptyChart from "../EmptyChart";
import generateChartOptions, { getColorScheme } from "../chartOptionsFactory";
import { chartConfig } from "../charts.config";
import {
  generateFilterOnLegendSelect,
  generateSeriesByName,
} from "../charts.utils";
import { TitleWrapper } from "../components/TitleWrapper";
import { LegendWrapper } from "../components/legend/LegendWrapper";
import KeplerEChart from "./KeplerEChart";
import KeplerMapChart from "./KeplerMapChart";
import KeplerTableChart from "./KeplerTableChart";
import { ParameterChart } from "./ParameterChart";

export type Dimensions = {
  width: number;
  height: number;
};

interface ChartComponentProps {
  query: any;
  customization: any;
  chartData: KeplerChartResponse;
  loading?: boolean;
  error?: any;
  onClickChart?: any;
  queryForm?: any;
  customizeForm?: any;
  tooltipInfo?: TooltipInfo;
  setTooltip?: any;
  editMode?: boolean;
}

const ParentChartComponent = ({
  chartData,
  loading,
  error,
  query,
  customization,
  onClickChart,
  customizeForm,
  queryForm,
  setTooltip,
  tooltipInfo,
  editMode = false,
}: ChartComponentProps) => {
  const chartType: string = query.chartType;
  const { user } = useSelector((state: RootState) => state.userDetails);

  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });
  const chartCustomization = useMemo(() => {
    return {
      ...customization,
      colorScheme: getColorScheme(chartData, customization, true),
    };
  }, [customization]);

  const seriesByName = useMemo(
    () => (isDefined(chartData) ? generateSeriesByName(chartData) : undefined),
    [chartData]
  );

  const chartOptions = useMemo(() => {
    return generateChartOptions({
      chartData,
      chartCustomization,
      dimensions,
      isDarkTheme: isCurrentConfigThemeDark(user),
      editMode,
    });
  }, [chartData, dimensions, chartCustomization, setTooltip, !editMode]);

  const onMountElement = useCallback(
    (ele: any) => {
      function onWindowResize(event: UIEvent): void {
        setDimensions({
          width: ele?.offsetWidth ?? 0,
          height: ele?.offsetHeight ?? 0,
        });
      }

      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });

      if (ele) {
        setDimensions({
          width: ele?.offsetWidth ?? 0,
          height: ele?.offsetHeight ?? 0,
        });

        window.addEventListener("resize", onWindowResize);

        resizeObserver.observe(ele);
      } else {
        window.removeEventListener("resize", onWindowResize);
        if (ele) {
          resizeObserver.unobserve(ele);
        }
        resizeObserver.disconnect();
      }
    },
    [setDimensions]
  );

  if (
    isEmpty(chartData?.rows) ||
    (chartData as any).rows === 0 ||
    !isDefined(chartType) ||
    error === true ||
    !isDefined(chartOptions)
  )
    return (
      <MtdShimmer loading={loading}>
        <EmptyChart
          data={
            (chartData as any)?.rows === 0
              ? getLanguageLabel("noDataFoundMatchingQuery")
              : getLanguageLabel("chartWillBeDisplayedHere")
          }
        />
      </MtdShimmer>
    );
  return (
    <MtdShimmer loading={loading}>
      <div className="fullHeightWidth chart-container" ref={onMountElement}
      style={{cursor: !editMode ? "move" : "pointer"}}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            paddingTop: `${chartCustomization?.gridMarginTop ?? 0}%`,
            paddingRight: `${chartCustomization?.gridMarginRight ?? 0}%`,
            paddingBottom: `${chartCustomization?.gridMarginBottom ?? 0}%`,
            paddingLeft: `${chartCustomization?.gridMarginLeft ?? 0}%`,
            overflow: "hidden",
          }}
        >
          <TitleWrapper
            customizeForm={customizeForm}
            chartType={chartType}
            dimensions={dimensions}
            chartCustomization={chartCustomization}
            darkTheme={isCurrentConfigThemeDark(user)}
          >
            <LegendWrapper
              chartCustomization={chartCustomization}
              chartData={chartData}
              onClickLegend={onClickChart}
              dimensions={dimensions}
            >
              <>
                {chartType === "parameterChart" && (
                  <ParameterChart
                    onClickChart={onClickChart}
                    chartOptions={chartOptions}
                  />
                )}
                {chartType === "table" && (
                  <KeplerTableChart
                    onClickChart={onClickChart}
                    chartData={chartOptions}
                    chartCustomization={chartCustomization}
                    customizeForm={customizeForm}
                    queryForm={queryForm}
                    darkTheme={isCurrentConfigThemeDark(user)}
                  />
                )}
                {chartType === "mapChart" && (
                  <KeplerMapChart
                    query={query}
                    chartData={chartOptions}
                    chartCustomization={chartCustomization}
                    key="KeplerMapChart"
                  />
                )}
                {chartConfig.eChartTypes.includes(chartType) && (
                  <KeplerEChart
                    onClickChart={(params: any) => {
                      onClickChart(
                        generateFilterOnLegendSelect(
                          params,
                          query,
                          seriesByName
                        )
                      );
                    }}
                    options={chartOptions}
                    id={chartData.request.id}
                    chartType={chartData.request.chartType}
                    tooltipInfo={tooltipInfo}
                    setTooltip={setTooltip}
                  />
                )}
              </>
            </LegendWrapper>
          </TitleWrapper>
        </div>
      </div>
    </MtdShimmer>
  );
};

export default ParentChartComponent;
