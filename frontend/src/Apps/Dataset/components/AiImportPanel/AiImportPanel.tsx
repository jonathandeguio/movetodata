/**
 * AiImportPanel.tsx — F6 AI Import Panel.
 *
 * Displayed in DatasetUpload after a CSV/Excel file is selected and before
 * the user clicks Upload. Provides three analyses:
 *
 *  1. Auto-description — name, description, tags (API call, optional)
 *  2. Quality detection — missing values, duplicates, mixed types (JS, offline)
 *  3. Schema suggestion — detected type per column (JS, offline)
 *
 * Sovereignty note: quality and schema analyses run entirely in the browser.
 * The description call goes to /api/ai/describe-dataset (Boson proxy → self-hosted
 * Ollama). No data leaves the MoveToData infrastructure.
 */

import { RobotOutlined } from "@ant-design/icons";
import { Alert, Card, Collapse, Progress, Spin, Tag, Typography } from "antd";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useEffect, useMemo, useState } from "react";
import {
  describeDatasetAPI,
  DescribeDatasetResponse,
} from "services/aiService";
import "./AiImportPanel.css";

const { Text } = Typography;
const { Panel } = Collapse;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiImportPanelProps {
  file: File;
  columns: string[];
  sampleRows: string[][];
}

type DetectedType = "string" | "number" | "date" | "boolean";

interface ColumnSchema {
  name: string;
  type: DetectedType;
  mixedTypes: boolean;
}

interface QualityResult {
  score: number;
  missingRatio: number;
  duplicates: number;
  mixedTypeCount: number;
}

// ---------------------------------------------------------------------------
// Type detection helpers (pure JS, offline)
// ---------------------------------------------------------------------------

const DATE_RE = /^\d{4}[-/]\d{2}[-/]\d{2}([ T].+)?$|^\d{2}[-/]\d{2}[-/]\d{4}$/;
const BOOL_RE = /^(true|false|yes|no|oui|non|1|0)$/i;

function detectCellType(value: string): DetectedType {
  const v = value.trim();
  if (BOOL_RE.test(v)) return "boolean";
  if (!isNaN(Number(v)) && v !== "") return "number";
  if (DATE_RE.test(v)) return "date";
  return "string";
}

function detectColumnType(
  colIndex: number,
  sampleRows: string[][]
): { type: DetectedType; mixedTypes: boolean } {
  const values = sampleRows
    .map((row) => (row[colIndex] ?? "").trim())
    .filter((v) => v !== "");

  if (values.length === 0) return { type: "string", mixedTypes: false };

  const typeCounts: Record<DetectedType, number> = {
    string: 0,
    number: 0,
    date: 0,
    boolean: 0,
  };

  for (const v of values) {
    typeCounts[detectCellType(v)]++;
  }

  const dominant = (
    Object.entries(typeCounts) as [DetectedType, number][]
  ).reduce((a, b) => (b[1] > a[1] ? b : a));

  const distinctTypeCount = (
    Object.values(typeCounts) as number[]
  ).filter((c) => c > 0).length;

  return {
    type: dominant[0],
    mixedTypes: distinctTypeCount > 1,
  };
}

// ---------------------------------------------------------------------------
// Quality computation (pure JS, offline)
// ---------------------------------------------------------------------------

function computeQuality(
  columns: string[],
  sampleRows: string[][]
): QualityResult {
  const totalCells = sampleRows.length * columns.length;
  const missingCount = sampleRows
    .flatMap((r) => r)
    .filter((v) => !v || v.trim() === "").length;
  const missingRatio = totalCells > 0 ? missingCount / totalCells : 0;

  const duplicates =
    sampleRows.length -
    new Set(sampleRows.map((r) => r.join("|"))).size;

  const schemas: ColumnSchema[] = columns.map((name, i) => {
    const { type, mixedTypes } = detectColumnType(i, sampleRows);
    return { name, type, mixedTypes };
  });

  const mixedTypeCount = schemas.filter((s) => s.mixedTypes).length;

  // Composite score:
  //   - completeness  (50 pts): 1 − missingRatio
  //   - uniqueness    (30 pts): 1 − min(duplicates / max(rows, 1), 1)
  //   - consistency   (20 pts): 1 − min(mixedTypeCount / max(cols, 1), 1)
  const completeness = 1 - missingRatio;
  const uniqueness = 1 - Math.min(duplicates / Math.max(sampleRows.length, 1), 1);
  const consistency =
    1 - Math.min(mixedTypeCount / Math.max(columns.length, 1), 1);

  const score = Math.round(
    completeness * 50 + uniqueness * 30 + consistency * 20
  );

  return { score, missingRatio, duplicates, mixedTypeCount };
}

// ---------------------------------------------------------------------------
// Score colour helper
// ---------------------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 80) return "#52c41a";
  if (score >= 50) return "#faad14";
  return "#ff4d4f";
}

// ---------------------------------------------------------------------------
// Type tag colours
// ---------------------------------------------------------------------------

const TYPE_TAG_COLOR: Record<DetectedType, string> = {
  string: "default",
  number: "blue",
  date: "green",
  boolean: "orange",
};

const TYPE_TAG_LABEL: Record<DetectedType, string> = {
  string: "texte",
  number: "numérique",
  date: "date",
  boolean: "booléen",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AiImportPanel: React.FC<AiImportPanelProps> = ({
  file,
  columns,
  sampleRows,
}) => {
  // Quality and schema are computed synchronously from props
  const quality = useMemo(
    () => computeQuality(columns, sampleRows),
    [columns, sampleRows]
  );

  const schemas: ColumnSchema[] = useMemo(
    () =>
      columns.map((name, i) => {
        const { type, mixedTypes } = detectColumnType(i, sampleRows);
        return { name, type, mixedTypes };
      }),
    [columns, sampleRows]
  );

  // Auto-description state (API call, optional)
  const [descState, setDescState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [description, setDescription] =
    useState<DescribeDatasetResponse | null>(null);
  const [descError, setDescError] = useState<string>("");

  // Reset when file changes
  useEffect(() => {
    setDescState("idle");
    setDescription(null);
    setDescError("");
  }, [file]);

  const handleAnalyse = async () => {
    setDescState("loading");
    setDescError("");
    try {
      const { data } = await describeDatasetAPI({
        fileName: file.name,
        columns,
        sampleRows: sampleRows.slice(0, 200),
      });
      setDescription(data);
      setDescState("done");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 503) {
        setDescError("Service IA temporairement indisponible (503).");
      } else {
        setDescError(
          err?.response?.data?.detail ??
            err?.message ??
            "Erreur lors de l'analyse."
        );
      }
      setDescState("error");
    }
  };

  return (
    <div className="ai-import-panel">
      <Collapse
        defaultActiveKey={["quality", "schema"]}
        bordered={false}
        style={{ background: "transparent" }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Section 1 — Auto-description (API)                               */}
        {/* ---------------------------------------------------------------- */}
        <Panel
          key="description"
          header={
            <span className="ai-import-panel__header">
              <RobotOutlined />
              Auto-description IA
            </span>
          }
        >
          <Card bordered={false} style={{ boxShadow: "none" }}>
            <div className="ai-import-panel__desc-section">
              {descState === "idle" && (
                <div className="ai-import-panel__analyse-btn-row">
                  <MtdButton intent="action" onClick={handleAnalyse}>
                    Analyser avec l'IA
                  </MtdButton>
                </div>
              )}

              {descState === "loading" && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <Spin size="small" />
                  <Text type="secondary">Analyse en cours…</Text>
                </div>
              )}

              {descState === "error" && (
                <Alert
                  type="error"
                  message="Erreur d'analyse"
                  description={descError}
                  showIcon
                />
              )}

              {descState === "done" && description && (
                <>
                  <div className="ai-import-panel__desc-field">
                    <span className="ai-import-panel__desc-label">
                      Nom suggéré
                    </span>
                    <span className="ai-import-panel__desc-value">
                      {description.name}
                    </span>
                  </div>
                  <div className="ai-import-panel__desc-field">
                    <span className="ai-import-panel__desc-label">
                      Description
                    </span>
                    <span className="ai-import-panel__desc-value">
                      {description.description}
                    </span>
                  </div>
                  <div className="ai-import-panel__desc-field">
                    <span className="ai-import-panel__desc-label">
                      Tags suggérés
                    </span>
                    <div className="ai-import-panel__tags-row">
                      {description.tags.map((tag) => (
                        <Tag key={tag} color="#24527a">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </Panel>

        {/* ---------------------------------------------------------------- */}
        {/* Section 2 — Qualité (JS offline)                                 */}
        {/* ---------------------------------------------------------------- */}
        <Panel
          key="quality"
          header={
            <span className="ai-import-panel__header">
              Qualité des données
            </span>
          }
        >
          <Card bordered={false} style={{ boxShadow: "none" }}>
            <div className="ai-import-panel__quality-row">
              {/* Score global */}
              <div className="ai-import-panel__quality-item">
                <span className="ai-import-panel__quality-label">
                  Score global
                </span>
                <Progress
                  percent={quality.score}
                  strokeColor={scoreColor(quality.score)}
                  size="small"
                  style={{ maxWidth: 320 }}
                />
              </div>

              {/* Valeurs manquantes */}
              <div className="ai-import-panel__quality-item">
                <span className="ai-import-panel__quality-label">
                  Valeurs manquantes
                </span>
                <span className="ai-import-panel__quality-value">
                  {(quality.missingRatio * 100).toFixed(1)}% des cellules vides
                </span>
              </div>

              {/* Doublons */}
              <div className="ai-import-panel__quality-item">
                <span className="ai-import-panel__quality-label">
                  Lignes dupliquées
                </span>
                <span className="ai-import-panel__quality-value">
                  {quality.duplicates} doublon
                  {quality.duplicates !== 1 ? "s" : ""} détecté
                  {quality.duplicates !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Types incohérents */}
              <div className="ai-import-panel__quality-item">
                <span className="ai-import-panel__quality-label">
                  Types incohérents
                </span>
                <span className="ai-import-panel__quality-value">
                  {quality.mixedTypeCount} colonne
                  {quality.mixedTypeCount !== 1 ? "s" : ""} avec types mélangés
                </span>
              </div>
            </div>
          </Card>
        </Panel>

        {/* ---------------------------------------------------------------- */}
        {/* Section 3 — Schéma (JS offline)                                  */}
        {/* ---------------------------------------------------------------- */}
        <Panel
          key="schema"
          header={
            <span className="ai-import-panel__header">
              Schéma détecté ({columns.length} colonne
              {columns.length !== 1 ? "s" : ""})
            </span>
          }
        >
          <Card bordered={false} style={{ boxShadow: "none" }}>
            <div className="ai-import-panel__schema-grid">
              {schemas.map((col) => (
                <div key={col.name} className="ai-import-panel__schema-item">
                  <span className="ai-import-panel__col-name" title={col.name}>
                    {col.name}
                  </span>
                  <Tag
                    color={TYPE_TAG_COLOR[col.type]}
                    style={{ marginRight: 0 }}
                  >
                    {TYPE_TAG_LABEL[col.type]}
                    {col.mixedTypes ? " ⚠" : ""}
                  </Tag>
                </div>
              ))}
            </div>
          </Card>
        </Panel>
      </Collapse>
    </div>
  );
};

export default AiImportPanel;
