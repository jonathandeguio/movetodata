import React from "react";
import { SeriesLegend } from "./getLegendData";
import { ColorBlock } from "./SubComponents";
import { Dimensions } from "../../ChartComponent/ParentChartComponent";
import { getRelativeFontSize } from "../../chartOptionsFactory";
import { SingleChevronDownIcon } from "assets/icons/mtdNavigationIcon";

export interface Legend {
  data: SeriesLegend[];
  onClickLegend: any;
  align: string;
  customLabel: any;
  dimensions: Dimensions;
}

export const HorizontalLegend: React.FC<Legend> = ({
  data,
  onClickLegend,
  align,
  customLabel,
  dimensions,
}) => {
  return (
    <div
      style={{
        fontSize: getRelativeFontSize(16, dimensions),
        minHeight: getRelativeFontSize(16, dimensions),
        // flexBasis: getRelativeFontSize(16, dimensions),
      }}
      className={`horizontalLegend horizontalLegend_${align}`}
    >
      {data.map((series) => (
        <div className="seriesLegend">
          {(data.length > 1 || series.groupBy.length > 0) && (
            <div className="seriesLegend_meta">
              {data.length > 1 && (
                <div className="seriesName">{series.seriesName}</div>
              )}
              {series.groupBy.length > 0 && (
                <div className="groupBy">{series.groupBy.join(", ")}</div>
              )}
            </div>
          )}

          <div className="legendItem_group">
            {series.items.map((item) => (
              <div
                onClick={() => {
                  if (series.groupBy.length > 0) {
                    const splitted = item.name.split(", ");

                    const filters = series.groupBy.map((g, i) => ({
                      columnName: g,
                      FilterValue: splitted[i],
                      operator: "equal",
                      checked: true,
                    }));

                    onClickLegend(filters);
                  }
                }}
                className="legendItem"
              >
                <ColorBlock color={item.color} />{" "}
                {customLabel?.[item.name] ?? item.name}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
