/**
 * AnomalyBadge.tsx — Red badge showing the number of detected anomalies.
 *
 * Displayed as an overlay on the chart when anomalies have been detected.
 * Clicking it re-opens the drawer on the Anomalies tab.
 */
import React from "react";
import { Badge, Tooltip } from "antd";
import { WarningOutlined } from "@ant-design/icons";

export interface AnomalyBadgeProps {
  /** Number of detected anomalies. Badge is not rendered when count is 0. */
  count: number;
  /** Called when the badge is clicked. */
  onClick?: () => void;
}

const AnomalyBadge: React.FC<AnomalyBadgeProps> = ({ count, onClick }) => {
  if (count === 0) return null;

  return (
    <Tooltip title={`${count} anomalie${count > 1 ? "s" : ""} détectée${count > 1 ? "s" : ""}`}>
      <Badge
        count={count}
        style={{
          backgroundColor: "var(--movetodata-intent-danger, #ff4d4f)",
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={onClick}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 6px",
            background: "rgba(255, 77, 79, 0.12)",
            borderRadius: 4,
            cursor: onClick ? "pointer" : "default",
          }}
        >
          <WarningOutlined
            style={{ color: "var(--movetodata-intent-danger, #ff4d4f)", fontSize: 14 }}
          />
        </span>
      </Badge>
    </Tooltip>
  );
};

export default AnomalyBadge;
