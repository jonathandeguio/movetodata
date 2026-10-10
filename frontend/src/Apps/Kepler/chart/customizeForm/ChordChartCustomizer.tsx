import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

/**
 * Chord chart customizer.
 * This chart is currently disabled (requires ECharts >= 6.0.0, current: 5.4.3).
 * The customizer is a placeholder and will be expanded once ECharts is upgraded.
 */
export const ChordChartCustomizer = () => {
  return (
    <div className="customizer-subHeader">
      <MtdCollapse
        key="chordSettings"
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("additional") ?? "Additional"}
          </div>
        }
      >
        <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", padding: "8px" }}>
          {getLanguageLabel("chordChartDisabled") ??
            "Chord chart requires ECharts 6. Upgrade echarts to enable this chart type."}
        </span>
      </MtdCollapse>
    </div>
  );
};
