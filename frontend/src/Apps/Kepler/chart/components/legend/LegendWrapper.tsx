import React, { useEffect, useMemo, useState } from "react";
import { HorizontalLegend } from "./HorizontalLegend";
import { VerticalLegend } from "./VerticalLegend";
import "./legend.scss";
import { getLegendData } from "./getLegendData";
import { Dimensions } from "../../ChartComponent/ParentChartComponent";
import { getRelativeFontSize } from "../../chartOptionsFactory";
import {
  SingleChevronDownIcon,
  SingleChevronLeftIcon,
  SingleChevronRightIcon,
  SingleChevronUpIcon,
} from "assets/icons/mtdNavigationIcon";
interface ILegendWrapper {
  // position: "top" | "right" | "bottom" | "left";
  children: JSX.Element;
  chartData: any;
  chartCustomization: any;
  onClickLegend: any;
  dimensions: Dimensions;
}

export const LegendWrapper: React.FC<ILegendWrapper> = ({
  // position,
  children,
  chartData,
  chartCustomization,
  onClickLegend,
  dimensions,
}) => {
  const [hidden, setHidden] = useState(false);

  const legendData = useMemo(
    () => getLegendData(chartData, chartCustomization),
    [chartData, chartCustomization]
  );

  const position = useMemo(
    () => chartCustomization.legendPosition,
    [chartCustomization]
  );

  if (!chartCustomization.legend || legendData.length === 0)
    return (
      <div
        className=""
        style={{
          width: "100%",
          flex: "1 1 0px",
          height: "100%",
          display: "flex",
        }}
      >
        {children}
      </div>
    );

  switch (position) {
    case "bottom":
      return (
        <div className="legendBottom">
          {hidden ? (
            <>
              <div
                className=""
                style={{
                  width: "100%",
                  flexGrow: 1,
                  minHeight: 0,
                  display: "flex",
                }}
              >
                {children}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <div
                  className="legendHideButton"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setHidden(false);
                  }}
                >
                  <SingleChevronUpIcon />
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                className=""
                style={{
                  width: "100%",
                  flexGrow: 1,
                  minHeight: 0,
                  display: "flex",
                }}
              >
                {children}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <div
                  className="legendHideButton"
                  onClick={() => {
                    setHidden(true);
                  }}
                >
                  <SingleChevronDownIcon />
                </div>
                <HorizontalLegend
                  align={chartCustomization.legendAlign}
                  onClickLegend={onClickLegend}
                  data={legendData}
                  customLabel={chartCustomization?.customLabel}
                  dimensions={dimensions}
                />
              </div>
            </>
          )}
        </div>
      );
    case "top":
      return (
        <div className="legendTop">
          {hidden ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <div
                  className="legendHideButton"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setHidden(false);
                  }}
                >
                  <SingleChevronDownIcon />
                </div>
              </div>
              <div
                className=""
                style={{
                  width: "100%",
                  flexGrow: 1,
                  minHeight: 0,
                  display: "flex",
                }}
              >
                {children}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <div
                  className="legendHideButton"
                  onClick={() => {
                    setHidden(true);
                  }}
                >
                  <SingleChevronUpIcon />
                </div>
                <HorizontalLegend
                  align={chartCustomization.legendAlign}
                  onClickLegend={onClickLegend}
                  data={legendData}
                  customLabel={chartCustomization?.customLabel}
                  dimensions={dimensions}
                />
              </div>
              <div
                className=""
                style={{
                  width: "100%",
                  flexGrow: 1,
                  minHeight: 0,
                  display: "flex",
                }}
              >
                {children}
              </div>
            </>
          )}
        </div>
      );
    case "right":
      return (
        <div className="legendRight">
          {hidden ? (
            <>
              <div
                style={{
                  width: "100%",
                  flexGrow: 1,
                  minHeight: 0,
                  display: "flex",
                }}
              >
                <>{children}</>
              </div>
              <>
                <div
                  className="legendHideButton"
                  onClick={() => {
                    setHidden(false);
                  }}
                >
                  <SingleChevronLeftIcon />
                </div>
              </>
            </>
          ) : (
            <>
              <div
                style={{
                  width: "100%",
                  flexGrow: 1,
                  minHeight: 0,
                  display: "flex",
                }}
              >
                {children}
              </div>
              <>
                <div
                  className="legendHideButton"
                  onClick={() => {
                    setHidden(true);
                  }}
                >
                  <SingleChevronRightIcon />
                </div>
                <VerticalLegend
                  align={chartCustomization.legendAlign}
                  onClickLegend={onClickLegend}
                  data={legendData}
                  customLabel={chartCustomization?.customLabel}
                  dimensions={dimensions}
                />
              </>
            </>
          )}
        </div>
      );
    case "left":
      return (
        <div className="legendLeft">
          {hidden ? (
            <>
              <div
                className="legendHideButton"
                onClick={() => {
                  setHidden(false);
                }}
              >
                <SingleChevronRightIcon />
              </div>
              <div
                style={{
                  width: "100%",
                  flexGrow: 1,
                  minHeight: 0,
                  display: "flex",
                }}
              >
                <>{children}</>
              </div>
            </>
          ) : (
            <>
              <>
                <VerticalLegend
                  align={chartCustomization.legendAlign}
                  onClickLegend={onClickLegend}
                  data={legendData}
                  customLabel={chartCustomization?.customLabel}
                  dimensions={dimensions}
                />
                <div
                  className="legendHideButton"
                  onClick={() => {
                    setHidden(true);
                  }}
                >
                  <SingleChevronLeftIcon />
                </div>
              </>
              <div
                className=""
                style={{
                  width: "100%",
                  flex: "1 1 0px",
                  minHeight: 0,
                  display: "flex",
                }}
              >
                {children}
              </div>
            </>
          )}
        </div>
      );
    default:
      return <></>;
  }
};
