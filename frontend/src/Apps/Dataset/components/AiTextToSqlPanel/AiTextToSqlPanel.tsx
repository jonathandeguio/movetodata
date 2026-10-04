/**
 * AiTextToSqlPanel.tsx — F1 Text-to-SQL panel component.
 *
 * Renders a collapsible panel below the Dataset toolbar that lets the user
 * type a natural-language question, generates a SQL SELECT query via the
 * movetodata-ai service, and executes it against the connected JDBC source
 * using the existing previewSourceAPI.
 *
 * Sovereignty: the query goes through Boson (/api/ai/text-to-sql), which
 * introspects the source schema locally and forwards only the DDL + question
 * to a self-hosted Ollama instance (qwen2.5-coder:7b). No data cell values
 * ever leave the infrastructure.
 */
import {
  CopyOutlined,
  EditOutlined,
  PlayCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Input,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import React, { useState } from "react";

import { previewSourceAPI } from "Apps/Connect/Connect.api";
import BoslerButton from "components/BoslerComponents/ButtonComponent/BoslerButton";
import { textToSqlAPI, TextToSqlResponse } from "services/aiService";
import { encodeToBase64, getLanguageLabel } from "utils/utilities";
import "./AiTextToSqlPanel.css";

const { TextArea } = Input;
const { Text } = Typography;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiTextToSqlPanelProps {
  /** UUID of the kitab dataset resource. */
  datasetId: string;
  /** Current branch (e.g. "master"). */
  branch: string;
}

type PanelState = "idle" | "loading" | "result" | "error";

interface PreviewRow {
  [key: string]: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AiTextToSqlPanel: React.FC<AiTextToSqlPanelProps> = ({
  datasetId,
  branch,
}) => {
  const [question, setQuestion] = useState("");
  const [panelState, setPanelState] = useState<PanelState>("idle");
  const [result, setResult] = useState<TextToSqlResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // SQL editing
  const [editableSql, setEditableSql] = useState<string>("");
  const [isEditingSQL, setIsEditingSQL] = useState(false);

  // Preview execution
  const [isExecuting, setIsExecuting] = useState(false);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewError, setPreviewError] = useState<string>("");

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleGenerate = async () => {
    if (!question.trim()) return;

    setPanelState("loading");
    setResult(null);
    setPreviewColumns([]);
    setPreviewRows([]);
    setPreviewError("");
    setIsEditingSQL(false);

    try {
      const { data } = await textToSqlAPI({ datasetId, branch, question });
      setResult(data);
      setEditableSql(data.sql);
      setPanelState("result");
    } catch (err: any) {
      const status = err?.response?.status;
      const errCode = err?.response?.data?.error;

      if (status === 503 || errCode === "LLM_UNAVAILABLE") {
        setErrorMessage("LLM_UNAVAILABLE");
      } else if (errCode === "SCHEMA_UNAVAILABLE") {
        setErrorMessage("SCHEMA_UNAVAILABLE");
      } else if (errCode === "DATASET_NOT_LINKED") {
        setErrorMessage("DATASET_NOT_LINKED");
      } else {
        setErrorMessage(
          err?.response?.data?.detail ?? err?.message ?? "UNKNOWN_ERROR"
        );
      }
      setPanelState("error");
    }
  };

  const handleCopySql = () => {
    const sql = isEditingSQL ? editableSql : result?.sql ?? "";
    navigator.clipboard.writeText(sql).catch(() => {});
  };

  const handleExecute = async () => {
    const sql = isEditingSQL ? editableSql : result?.sql ?? "";
    const sourceId = result?.sourceId;
    if (!sql || !sourceId) return;

    setIsExecuting(true);
    setPreviewError("");
    setPreviewColumns([]);
    setPreviewRows([]);

    try {
      const body = { query: encodeToBase64(sql) };
      const { data } = await previewSourceAPI(sourceId, body);

      // The preview API returns { results: [{ columns: [...], data: [[...], ...] }] }
      const firstResult = data?.results?.[0];
      if (!firstResult) {
        setPreviewError("No results returned.");
        return;
      }

      const cols: string[] = firstResult.columns ?? [];
      const rows: PreviewRow[] = (firstResult.data ?? []).map(
        (row: string[]) => {
          const rowObj: PreviewRow = {};
          cols.forEach((col, i) => {
            rowObj[col] = row[i] ?? "";
          });
          return rowObj;
        }
      );

      setPreviewColumns(cols);
      setPreviewRows(rows);
    } catch (err: any) {
      setPreviewError(
        err?.response?.data?.detail ??
          err?.message ??
          "Execution failed."
      );
    } finally {
      setIsExecuting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Confidence badge
  // -------------------------------------------------------------------------

  const confidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return (
        <Tag color="success">{Math.round(confidence * 100)}% confidence</Tag>
      );
    }
    if (confidence >= 0.6) {
      return (
        <Tag color="warning">{Math.round(confidence * 100)}% confidence</Tag>
      );
    }
    return (
      <Tag color="error">{Math.round(confidence * 100)}% confidence</Tag>
    );
  };

  // -------------------------------------------------------------------------
  // Preview table columns for Ant Design Table
  // -------------------------------------------------------------------------

  const antColumns = previewColumns.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
    width: 140,
  }));

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="ai-text-to-sql-panel">
      {/* Input row */}
      <div className="ai-text-to-sql-panel__input-row">
        <TextArea
          className="ai-text-to-sql-panel__textarea"
          placeholder="Posez votre question en français ou anglais… (ex: Quel est le CA par région ce mois-ci ?)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 3 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          disabled={panelState === "loading"}
        />
        <BoslerButton
          intent="action"
          onClick={handleGenerate}
          disabled={!question.trim() || panelState === "loading"}
          icon={
            panelState === "loading" ? (
              <Spin size="small" />
            ) : (
              <RobotOutlined />
            )
          }
        >
          Générer le SQL
        </BoslerButton>
      </div>

      {/* Error states */}
      {panelState === "error" && (
        <>
          {errorMessage === "LLM_UNAVAILABLE" && (
            <Alert
              type="error"
              message="Service IA temporairement indisponible"
              description="Le service Ollama n'est pas accessible. Réessayez dans quelques instants."
              showIcon
            />
          )}
          {errorMessage === "SCHEMA_UNAVAILABLE" && (
            <Alert
              type="warning"
              message="Schéma de base de données non disponible"
              description="Le schéma de la source n'a pas pu être récupéré. Seules les sources JDBC de type PostgreSQL, MySQL, SQL Server, Oracle et Snowflake sont supportées."
              showIcon
            />
          )}
          {errorMessage === "DATASET_NOT_LINKED" && (
            <Alert
              type="warning"
              message="Dataset non lié à une source JDBC"
              description="Ce dataset n'est pas directement lié à une source de base de données."
              showIcon
            />
          )}
          {errorMessage !== "LLM_UNAVAILABLE" &&
            errorMessage !== "SCHEMA_UNAVAILABLE" &&
            errorMessage !== "DATASET_NOT_LINKED" && (
              <Alert
                type="error"
                message="Erreur lors de la génération SQL"
                description={errorMessage}
                showIcon
              />
            )}
        </>
      )}

      {/* Result */}
      {panelState === "result" && result && (
        <div className="ai-text-to-sql-panel__result">
          {/* Confidence warning */}
          {result.confidence < 0.6 && (
            <Alert
              type="warning"
              message="Vérifiez le SQL avant exécution"
              description="Le score de confiance est faible. Le SQL généré peut ne pas correspondre exactement à votre question."
              showIcon
            />
          )}

          {/* SQL block header: confidence badge + actions */}
          <div className="ai-text-to-sql-panel__sql-header">
            <Text type="secondary" style={{ fontSize: 12 }}>
              SQL généré via{" "}
              <Text code style={{ fontSize: 11 }}>
                {result.model}
              </Text>
            </Text>
            {confidenceBadge(result.confidence)}
          </div>

          {/* SQL display or editable textarea */}
          {isEditingSQL ? (
            <TextArea
              className="ai-text-to-sql-panel__sql-editable"
              value={editableSql}
              onChange={(e) => setEditableSql(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 10 }}
            />
          ) : (
            <pre className="ai-text-to-sql-panel__sql-block">{result.sql}</pre>
          )}

          {/* Action buttons */}
          <div className="ai-text-to-sql-panel__actions">
            <Tooltip title="Copier le SQL">
              <BoslerButton
                icon={<CopyOutlined />}
                icononly
                minimal
                onClick={handleCopySql}
              />
            </Tooltip>

            <Tooltip title={isEditingSQL ? "Fermer l'éditeur" : "Modifier le SQL"}>
              <BoslerButton
                icon={<EditOutlined />}
                icononly
                minimal
                intent={isEditingSQL ? "action" : undefined}
                onClick={() => setIsEditingSQL((v) => !v)}
              />
            </Tooltip>

            <BoslerButton
              icon={
                isExecuting ? (
                  <Spin size="small" />
                ) : (
                  <PlayCircleOutlined />
                )
              }
              intent="action"
              onClick={handleExecute}
              disabled={isExecuting || !(isEditingSQL ? editableSql : result.sql)}
            >
              Exécuter
            </BoslerButton>
          </div>

          {/* Preview error */}
          {previewError && (
            <Alert type="error" message={previewError} showIcon />
          )}

          {/* Preview results table */}
          {previewColumns.length > 0 && (
            <div className="ai-text-to-sql-panel__preview-table">
              <Table
                size="small"
                columns={antColumns}
                dataSource={previewRows.map((row, i) => ({ ...row, key: i }))}
                pagination={{ pageSize: 10, size: "small", showSizeChanger: false }}
                scroll={{ x: "max-content", y: 160 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiTextToSqlPanel;
