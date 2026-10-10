/**
 * AiAssistantSidebar.tsx — F3 — Assistant IA conversationnel.
 *
 * A 380 px right-side drawer showing a persistent chat interface with the
 * MoveToData AI assistant. Uses fetch() + ReadableStream for SSE streaming
 * (axios does not support SSE natively).
 *
 * The session UUID is generated client-side (crypto.randomUUID) so it is
 * stable across page loads and survives backend restarts. A new UUID is
 * generated when the user clicks "Nouvelle conversation".
 *
 * Sovereignty: all LLM inference runs on qwen2.5:14b via a self-hosted Ollama
 * instance. No data leaves the MoveToData infrastructure.
 */

import {
  CloseOutlined,
  EditOutlined,
  LoadingOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, Button, Divider, Drawer, Input, Space, Spin, Tag, Tooltip, Typography } from "antd";
import { MTD_TOKEN } from "Authentication/constants";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAiAssistantContext } from "./AiAssistantContext";

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Quelle est la tendance des 30 derniers jours ?",
  "Quelles sont les 10 premières lignes ?",
  "Y a-t-il des valeurs anormales ?",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a UUID v4. Falls back to Math.random() in very old browsers. */
function generateUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Read the JWT from localStorage. */
function getToken(): string {
  return localStorage.getItem(MTD_TOKEN) ?? "";
}

/** Base URL for API calls (matches axios interceptors base). */
const API_BASE = process.env.REACT_APP_BASE_URL_API ?? "";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AiAssistantSidebar: React.FC = () => {
  const { open, closeSidebar, sourceId, openChartIds } = useAiAssistantContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Stable session UUID — generated once and reused
  const sessionIdRef = useRef<string>(generateUuid());
  const prevSessionIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;
      setError(null);

      const userMsg: Message = {
        id: generateUuid(),
        role: "user",
        content: text.trim(),
      };
      const assistantMsgId = generateUuid();
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setStreaming(true);

      // Build history from current messages (exclude the newly added pair)
      const historySnapshot = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payload = {
        sessionId: sessionIdRef.current,
        message: text.trim(),
        context: {
          sourceId: sourceId ?? null,
          openChartIds: openChartIds ?? [],
        },
        history: historySnapshot,
      };

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(`${API_BASE}/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep incomplete last line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (!data) continue;

            try {
              const event = JSON.parse(data) as {
                type: string;
                content?: string;
                error?: string;
                model?: string;
                tokens_used?: number;
              };

              if (event.type === "token" && event.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + event.content }
                      : m
                  )
                );
              } else if (event.type === "done") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, streaming: false } : m
                  )
                );
              } else if (event.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content:
                            event.error === "LLM_UNAVAILABLE"
                              ? "Le service IA est temporairement indisponible. Veuillez réessayer dans quelques instants."
                              : `Erreur : ${event.error}`,
                          streaming: false,
                        }
                      : m
                  )
                );
              }
            } catch {
              // Ignore malformed SSE lines
            }
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError("Impossible de contacter le service IA. Vérifiez votre connexion.");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: "Erreur de connexion au service IA.", streaming: false }
              : m
          )
        );
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [messages, streaming, sourceId, openChartIds]
  );

  // ---------------------------------------------------------------------------
  // New conversation
  // ---------------------------------------------------------------------------

  const startNewConversation = useCallback(() => {
    // Cancel any in-progress stream
    abortControllerRef.current?.abort();

    // Soft-delete current session on server (fire-and-forget)
    const oldSessionId = sessionIdRef.current;
    fetch(`${API_BASE}/api/ai/chat/session/${oldSessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {/* graceful — don't surface deletion errors */});

    prevSessionIdRef.current = oldSessionId;
    sessionIdRef.current = generateUuid();
    setMessages([]);
    setInput("");
    setError(null);
    setStreaming(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Keyboard handler (Ctrl+Enter sends)
  // ---------------------------------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const hasContext = Boolean(sourceId);

  return (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RobotOutlined style={{ color: "#1890ff" }} />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Assistant IA</span>
          {hasContext && (
            <Tag color="blue" style={{ fontSize: 11 }}>
              Source active
            </Tag>
          )}
          {openChartIds.length > 0 && (
            <Tag color="cyan" style={{ fontSize: 11 }}>
              {openChartIds.length} graphique{openChartIds.length > 1 ? "s" : ""}
            </Tag>
          )}
        </div>
      }
      placement="right"
      width={380}
      open={open}
      onClose={closeSidebar}
      mask={false}
      getContainer={false}
      style={{ position: "fixed" }}
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" } }}
      extra={
        <Tooltip title="Nouvelle conversation">
          <Button
            icon={<EditOutlined />}
            type="text"
            size="small"
            onClick={startNewConversation}
            disabled={streaming}
          />
        </Tooltip>
      }
      closeIcon={<CloseOutlined />}
    >
      {/* Error banner */}
      {error && (
        <Alert
          type="error"
          message={error}
          closable
          onClose={() => setError(null)}
          style={{ margin: "8px 12px 0" }}
        />
      )}

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 12px 0",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{ marginTop: 24 }}>
            <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 16, textAlign: "center" }}>
              Posez une question sur vos données
            </Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <Button
                  key={q}
                  type="dashed"
                  size="small"
                  style={{ textAlign: "left", whiteSpace: "normal", height: "auto", padding: "6px 10px" }}
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: msg.role === "user" ? "#1890ff" : "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {msg.role === "user" ? (
                <UserOutlined style={{ fontSize: 13, color: "#fff" }} />
              ) : (
                <RobotOutlined style={{ fontSize: 13, color: "#595959" }} />
              )}
            </div>

            {/* Bubble */}
            <div
              style={{
                maxWidth: "80%",
                padding: "8px 12px",
                borderRadius: msg.role === "user" ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                background: msg.role === "user" ? "#1890ff" : "#f5f5f5",
                color: msg.role === "user" ? "#fff" : "inherit",
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
              {msg.streaming && (
                <span
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 14,
                    background: "#595959",
                    marginLeft: 2,
                    verticalAlign: "middle",
                    animation: "blink 1s step-end infinite",
                  }}
                />
              )}
              {msg.role === "assistant" && !msg.content && msg.streaming && (
                <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} />
              )}
            </div>
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      <Divider style={{ margin: "8px 0" }} />

      {/* Input area */}
      <div style={{ padding: "0 12px 12px", display: "flex", gap: 8, alignItems: "flex-end" }}>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez votre question... (Ctrl+Entrée pour envoyer)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={streaming}
          style={{ flex: 1, resize: "none", fontSize: 13 }}
        />
        <Button
          type="primary"
          icon={streaming ? <LoadingOutlined /> : <SendOutlined />}
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
          style={{ height: 32, paddingInline: 10 }}
        />
      </div>

      {/* Blinking cursor CSS */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </Drawer>
  );
};

export default AiAssistantSidebar;
