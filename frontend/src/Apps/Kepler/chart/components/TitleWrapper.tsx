import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel, isDefined, isEmpty } from "utils/utilities";
import { Dimensions } from "../ChartComponent/ParentChartComponent";
import { chartConfig } from "../charts.config";
import { getRelativeFontSize } from "../chartOptionsFactory";
import { RootState } from "redux/types/store";

interface ITitle {
  children: JSX.Element;
  chartCustomization: any;
  chartType: any;
  dimensions: Dimensions;
  darkTheme: boolean;
  customizeForm: any;
}

export const TitleWrapper: React.FC<ITitle> = ({
  children,
  chartType,
  chartCustomization,
  dimensions,
  darkTheme,
  customizeForm,
}) => {
  const skeleton = useMemo(() => chartConfig[chartType], [chartType]);
  const isKepler = useMemo(() => isDefined(customizeForm), [customizeForm]);
  const dispatch = useDispatch();

  const title = useMemo(() => {
    if (isEmpty(chartCustomization.title)) {
      return getLanguageLabel("title");
    }
    return chartCustomization.title;
  }, [chartCustomization]);
  const subTitle = useMemo(() => {
    if (isEmpty(chartCustomization.subTitle)) {
      return getLanguageLabel("subtitle");
    }
    return chartCustomization.subTitle;
  }, [chartCustomization]);

  if (!skeleton.meta.hasTitle) return children;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <div>
        {chartCustomization.titleToggle && (
          <div
            className="chart_title"
            style={{
              color:
                !isDefined(chartCustomization.chartTitleFontColor) ||
                chartCustomization.chartTitleFontColor == "#00000000"
                  ? darkTheme
                    ? "#e4e6ec"
                    : "#000000"
                  : chartCustomization.chartTitleFontColor,
              fontWeight: chartCustomization.chartTitleFontWeight,
              fontSize:
                getRelativeFontSize(
                  chartCustomization.chartTitleFontSize,
                  dimensions
                ) * 1.5,
            }}
          >
            {isKepler ? (
              <MtdInput
                debounceInterval={700}
                editText
                maxLength={60}
                style={{
                  width: "100%",
                  textAlign: chartCustomization.titleAlign,
                  fontWeight: chartCustomization.chartTitleFontWeight,
                  color:
                    !isDefined(chartCustomization.chartTitleFontColor) ||
                    chartCustomization.chartTitleFontColor == "#00000000"
                      ? darkTheme
                        ? "#e4e6ec"
                        : "#000000"
                      : chartCustomization.chartTitleFontColor,
                  opacity: isEmpty(chartCustomization.title) ? 0.5 : 1,
                }}
                fontSize={
                  getRelativeFontSize(
                    chartCustomization.chartTitleFontSize,
                    dimensions
                  ) * 1.5
                }
                variant={"borderless"}
                onChange={(e) => {
                  customizeForm.setFieldValue("title", e.target.value);
                  dispatch({
                    type: "UPDATE_CUSTOMIZE",
                    payload: {
                      title: e.target.value,
                    },
                  });
                }}
                value={title}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  textAlign: chartCustomization.titleAlign,
                  fontWeight: chartCustomization.chartTitleFontWeight,
                  color:
                    !isDefined(chartCustomization.chartTitleFontColor) ||
                    chartCustomization.chartTitleFontColor == "#00000000"
                      ? darkTheme
                        ? "#e4e6ec"
                        : "#000000"
                      : chartCustomization.chartTitleFontColor,
                  fontSize:
                    getRelativeFontSize(
                      chartCustomization.chartTitleFontSize,
                      dimensions
                    ) * 1.5,

                  opacity: isEmpty(chartCustomization.title) ? 0.5 : 1,
                }}
              >
                {title}
              </div>
            )}
          </div>
        )}
      </div>
      <div>
        {chartCustomization.subTitleToggle && (
          <div
            className="chart_subtitle"
            style={{
              width: "100%",
              color:
                !isDefined(chartCustomization.subChartTitleFontColor) ||
                chartCustomization.subChartTitleFontColor == "#00000000"
                  ? darkTheme
                    ? "#e4e6ec"
                    : "#000000"
                  : chartCustomization.subChartTitleFontColor,
              fontWeight: chartCustomization.subChartTitleFontWeight,
              fontSize:
                getRelativeFontSize(
                  chartCustomization.subChartTitleFontSize,
                  dimensions
                ) * 1.5,
            }}
          >
            {isKepler ? (
              <MtdInput
                editText
                maxLength={60}
                style={{
                  textAlign: chartCustomization.subTitleAlign,
                  fontWeight: chartCustomization.subChartTitleFontWeight,
                  color:
                    !isDefined(chartCustomization.subChartTitleFontColor) ||
                    chartCustomization.subChartTitleFontColor == "#00000000"
                      ? darkTheme
                        ? "#e4e6ec"
                        : "#000000"
                      : chartCustomization.subChartTitleFontColor,

                  opacity: isEmpty(chartCustomization.subTitle) ? 0.5 : 1,
                }}
                fontSize={
                  getRelativeFontSize(
                    chartCustomization.subChartTitleFontSize,
                    dimensions
                  ) * 1.5
                }
                debounceInterval={700}
                variant={"borderless"}
                onChange={(e) => {
                  customizeForm.setFieldValue("subTitle", e.target.value);
                  dispatch({
                    type: "UPDATE_CUSTOMIZE",
                    payload: {
                      subTitle: e.target.value,
                    },
                  });
                }}
                value={subTitle}
              />
            ) : (
              <div
                style={{
                  textAlign: chartCustomization.subTitleAlign,
                  fontWeight: chartCustomization.subChartTitleFontWeight,
                  color:
                    !isDefined(chartCustomization.subChartTitleFontColor) ||
                    chartCustomization.subChartTitleFontColor == "#00000000"
                      ? darkTheme
                        ? "#e4e6ec"
                        : "#000000"
                      : chartCustomization.subChartTitleFontColor,
                  fontSize:
                    getRelativeFontSize(
                      chartCustomization.subChartTitleFontSize,
                      dimensions
                    ) * 1.5,

                  opacity: isEmpty(chartCustomization.subTitle) ? 0.5 : 1,
                }}
              >
                {subTitle}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "1 1 0px",
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};
