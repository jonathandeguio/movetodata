import React from "react";
import { Legend } from "./HorizontalLegend";
import { ColorBlock } from "./SubComponents";
import { getRelativeFontSize } from "../../chartOptionsFactory";
import { MtdTypography } from "components/CommonUI/MtdTypography";

export const VerticalLegend: React.FC<Legend> = ({
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
        // flexBasis: getRelativeFontSize(16, dimensions),
      }}
      className={`verticalLegend verticalLegend_${align}`}
    >
      {data.map((series) => (
        <div className="seriesLegend">
          {(data.length > 1 || series.groupBy.length > 0) && (
            <>
              <div className="seriesLegend_meta">
                {data.length > 1 && (
                  <div className="seriesName">{series.seriesName}</div>
                )}
                {series.groupBy.length > 0 && (
                  <div className="groupBy">{series.groupBy.join(", ")}</div>
                )}
              </div>
              <div style={{ height: "2.2rem" }}>{""}</div>
            </>
          )}

          <div className="legendItem_group">
            {series.items.map((item) => (
              <div
                onClick={() => {
                  if (series.groupBy.length > 0) {
                    const splitted = item.name.split(", ");
                    const filters = series.groupBy.map((g, i) => ({
                      columnName: g,
                      value: splitted[i],
                    }));
                    onClickLegend(filters);
                  }
                }}
                className="legendItem"
              >
                <ColorBlock color={item.color} />{" "}
                <MtdTypography>
                  {customLabel?.[item.name] ?? item.name}
                </MtdTypography>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
