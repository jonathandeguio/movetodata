/**
 * QualityBadge.tsx — Small colored badge showing the global quality score
 * of a connected source.  Used in the Connect source table.
 *
 * Loaded lazily per source via a batch API call to avoid N individual requests.
 */

import { Tooltip } from "antd";
import React from "react";
import type { AiSourceQuality } from "../../../services/aiService";

interface QualityBadgeProps {
  quality: AiSourceQuality | undefined;
}

const scoreColor = (score: number): string => {
  if (score < 40) return "#ff4d4f";
  if (score < 70) return "#faad14";
  return "#52c41a";
};

const QualityBadge: React.FC<QualityBadgeProps> = ({ quality }) => {
  if (!quality || quality.globalScore === null) {
    return null;
  }

  const score = quality.globalScore;
  const color = scoreColor(score);

  const tooltipContent = (
    <div style={{ minWidth: 160 }}>
      <div>
        <strong>Score qualité : {score} / 100</strong>
      </div>
      <div style={{ marginTop: 4 }}>
        Complétude : {quality.completeness ?? "—"} %
      </div>
      <div>Unicité : {quality.uniqueness ?? "—"} %</div>
      <div>Cohérence : {quality.consistency ?? "—"} %</div>
      {quality.outlierRatio !== null && (
        <div>
          Outliers : {((quality.outlierRatio ?? 0) * 100).toFixed(1)} %
        </div>
      )}
    </div>
  );

  return (
    <Tooltip title={tooltipContent} placement="right">
      <span
        style={{
          display: "inline-block",
          padding: "1px 8px",
          borderRadius: 10,
          backgroundColor: `${color}22`,
          border: `1px solid ${color}`,
          color,
          fontSize: 11,
          fontWeight: 600,
          cursor: "default",
          marginLeft: 6,
          verticalAlign: "middle",
          lineHeight: "18px",
        }}
      >
        {score}
      </span>
    </Tooltip>
  );
};

export default QualityBadge;
