/**
 * InsightCard.tsx — Reusable card for displaying a single AI insight.
 *
 * Used by the AugmentedAnalyticsDrawer to present forecasts, summaries, and
 * other textual AI results in a consistent, branded style.
 */
import React from "react";
import { Card, Space, Typography } from "antd";

const { Text, Title } = Typography;

export interface InsightCardDetail {
  label: string;
  value: string | number;
}

export interface InsightCardProps {
  /** Card header title. */
  title: string;
  /** Main body text or description. */
  body?: string;
  /** Optional key-value detail rows displayed below the body. */
  details?: InsightCardDetail[];
  /** Optional suffix shown in small text after the body (e.g. model name). */
  model?: string;
}

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  body,
  details = [],
  model,
}) => {
  return (
    <Card
      size="small"
      style={{
        background: "var(--movetodata-surface-2, #e8f4f8)",
        border: "1px solid var(--movetodata-border-color, #91caff)",
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <Title level={5} style={{ margin: 0, marginBottom: body ? 6 : 0 }}>
        {title}
      </Title>

      {body && (
        <Text style={{ fontSize: 13, display: "block", marginBottom: details.length ? 8 : 0 }}>
          {body}
        </Text>
      )}

      {details.length > 0 && (
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          {details.map((d, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {d.label}
              </Text>
              <Text strong style={{ fontSize: 12 }}>
                {d.value}
              </Text>
            </div>
          ))}
        </Space>
      )}

      {model && (
        <Text
          type="secondary"
          style={{ fontSize: 11, display: "block", marginTop: 6 }}
        >
          {model}
        </Text>
      )}
    </Card>
  );
};

export default InsightCard;
