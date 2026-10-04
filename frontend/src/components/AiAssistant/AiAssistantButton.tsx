/**
 * AiAssistantButton.tsx — Sidebar icon button that toggles the AI chat panel.
 *
 * Designed to sit inside the left navigation sidebar (Sidebar.tsx), styled
 * consistently with the existing SBElement pattern.
 */

import { CommentOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import React from "react";
import { useAiAssistantContext } from "./AiAssistantContext";

interface AiAssistantButtonProps {
  iconSize?: number;
  showText?: boolean;
}

const AiAssistantButton: React.FC<AiAssistantButtonProps> = ({
  iconSize = 20,
  showText = false,
}) => {
  const { toggle, open } = useAiAssistantContext();

  return (
    <Tooltip title="Assistant IA" placement="right">
      <div
        onClick={toggle}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: "6px 0",
          borderRadius: 6,
          background: open ? "var(--PRIMARY_ICON_BG, rgba(24,144,255,0.12))" : "transparent",
          transition: "background 0.2s",
        }}
      >
        <CommentOutlined
          style={{
            fontSize: iconSize,
            color: open ? "var(--PRIMARY_ICON, #1890ff)" : "var(--icon-color-deafult, #8c8c8c)",
            transition: "color 0.2s",
          }}
        />
        {showText && (
          <span
            style={{
              fontSize: 9,
              marginTop: 2,
              color: open ? "var(--PRIMARY_ICON, #1890ff)" : "var(--icon-color-deafult, #8c8c8c)",
            }}
          >
            IA
          </span>
        )}
      </div>
    </Tooltip>
  );
};

export default AiAssistantButton;
