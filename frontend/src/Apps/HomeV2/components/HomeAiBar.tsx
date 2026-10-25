/**
 * HomeAiBar — Question bar on the home page that opens the AI assistant sidebar
 * pre-loaded with the user's question. Displays 3 contextual suggestion chips.
 */

import { RobotOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import { useAiAssistantContext } from "components/AiAssistant/AiAssistantContext";
import React, { useState } from "react";

const SUGGESTIONS = [
  "Résume l'activité récente de la plateforme",
  "Quels pipelines sont en erreur ?",
  "Quels datasets ont été modifiés aujourd'hui ?",
];

const HomeAiBar: React.FC = () => {
  const { openWithMessage } = useAiAssistantContext();
  const [value, setValue] = useState("");

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setValue("");
    openWithMessage(q);
  };

  return (
    <div className="home-ai-bar">
      <div className="home-ai-bar__input-row">
        <RobotOutlined className="home-ai-bar__robot-icon" />
        <Input
          className="home-ai-bar__input"
          placeholder="Posez une question à l'assistant IA…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPressEnter={() => send(value)}
          suffix={
            <Button
              type="text"
              size="small"
              icon={<SendOutlined />}
              disabled={!value.trim()}
              onClick={() => send(value)}
              className="home-ai-bar__send-btn"
            />
          }
        />
      </div>
      <div className="home-ai-bar__suggestions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className="home-ai-bar__chip"
            onClick={() => send(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeAiBar;
