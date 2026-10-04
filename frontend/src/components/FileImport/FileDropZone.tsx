/**
 * FileDropZone.tsx — Drag-and-drop file import zone (F5).
 *
 * Usage:
 *   <FileDropZone onComplete={(sourceId) => console.log(sourceId)} />
 *
 * Flow:
 *   1. User drops or picks a file.
 *   2. Size + format validation (client-side).
 *   3. Upload via POST /api/files/upload.
 *   4. If Excel with multiple sheets → SheetSelector.
 *   5. AI analysis via POST /api/ai/analyze-file.
 *   6. FileAnalysisModal opens with results.
 */

import React, { useState } from "react";
import { Upload, Typography, Alert, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import {
  AnalyzeFileResponse,
  getFileSheetsAPI,
  uploadFileAPI,
  analyzeFileAPI,
} from "services/fileImportService";
import SheetSelector from "./SheetSelector";
import FileAnalysisModal from "./FileAnalysisModal";

const { Dragger } = Upload;
const { Text } = Typography;

// Accepted MIME types and extensions
const ACCEPTED_EXTENSIONS = [
  ".xlsx", ".xls", ".csv", ".tsv",
  ".json", ".jsonl", ".parquet", ".pdf",
];
const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

type Step = "idle" | "uploading" | "sheet-select" | "analyzing" | "done" | "error";

interface FileDropZoneProps {
  /** Called after the user creates a dataset from the analysis results. */
  onComplete?: (sourceId: string) => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [uploadedFileId, setUploadedFileId] = useState<string>("");
  const [uploadedFilename, setUploadedFilename] = useState<string>("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalyzeFileResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const reset = () => {
    setStep("idle");
    setErrorMsg("");
    setUploadedFileId("");
    setUploadedFilename("");
    setSheets([]);
    setAnalysis(null);
    setModalOpen(false);
  };

  const hasValidExtension = (filename: string): boolean => {
    const lower = filename.toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  };

  const isExcel = (filename: string): boolean =>
    filename.toLowerCase().endsWith(".xlsx") ||
    filename.toLowerCase().endsWith(".xls");

  // -------------------------------------------------------------------------
  // Main upload handler
  // -------------------------------------------------------------------------

  const handleUpload = async (file: File): Promise<void> => {
    setErrorMsg("");

    // Client-side validation
    if (!hasValidExtension(file.name)) {
      const msg = `Format non supporté. Formats acceptés : ${ACCEPTED_EXTENSIONS.join(", ")}`;
      setErrorMsg(msg);
      setStep("error");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      const msg = `Le fichier dépasse la limite de ${MAX_SIZE_BYTES / 1024 / 1024} MB.`;
      setErrorMsg(msg);
      setStep("error");
      return;
    }

    // Step 1 — Upload
    setStep("uploading");
    try {
      const uploadRes = await uploadFileAPI(file);
      const { fileId, filename } = uploadRes.data;
      setUploadedFileId(fileId);
      setUploadedFilename(filename);

      // Step 2 — Excel multi-sheet check
      if (isExcel(filename)) {
        const sheetsRes = await getFileSheetsAPI(fileId);
        if (sheetsRes.data.length > 1) {
          setSheets(sheetsRes.data);
          setStep("sheet-select");
          return;
        }
        // Single sheet — proceed directly
        await runAnalysis(fileId, filename, sheetsRes.data[0] || undefined);
      } else {
        await runAnalysis(fileId, filename);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Erreur lors de l'upload.";
      setErrorMsg(msg);
      setStep("error");
    }
  };

  // Step 3 — AI analysis
  const runAnalysis = async (
    fileId: string,
    filename: string,
    sheet?: string
  ): Promise<void> => {
    setStep("analyzing");
    setModalOpen(true);
    try {
      const res = await analyzeFileAPI(fileId, sheet);
      setAnalysis(res.data);
      setStep("done");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Erreur lors de l'analyse IA.";
      setErrorMsg(msg);
      setStep("error");
    }
  };

  // -------------------------------------------------------------------------
  // Ant Design Upload — prevent default upload behaviour, use our handler
  // -------------------------------------------------------------------------

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ACCEPTED_EXTENSIONS.join(","),
    showUploadList: false,
    beforeUpload: (file) => {
      handleUpload(file);
      return false; // prevent antd from uploading
    },
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (step === "sheet-select") {
    return (
      <SheetSelector
        filename={uploadedFilename}
        sheets={sheets}
        onSelect={(sheet) =>
          runAnalysis(uploadedFileId, uploadedFilename, sheet)
        }
        onCancel={reset}
      />
    );
  }

  return (
    <>
      {step === "error" && (
        <Alert
          type="error"
          message={errorMsg}
          closable
          onClose={() => setStep("idle")}
          style={{ marginBottom: 12 }}
        />
      )}

      <Dragger
        {...uploadProps}
        disabled={step === "uploading" || step === "analyzing"}
        style={{ borderRadius: 8 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Glissez un fichier ici ou cliquez pour parcourir
        </p>
        <p className="ant-upload-hint">
          <Text type="secondary">
            Formats supportés : xlsx, xls, csv, tsv, json, jsonl, parquet, pdf
            &nbsp;—&nbsp;Taille max : 200 MB
          </Text>
        </p>
      </Dragger>

      {/* Progress states */}
      {step === "uploading" && (
        <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
          Envoi du fichier...
        </Text>
      )}
      {step === "analyzing" && (
        <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
          Analyse en cours...
        </Text>
      )}

      {/* Results modal */}
      <FileAnalysisModal
        open={modalOpen}
        fileId={uploadedFileId}
        filename={uploadedFilename}
        analysis={analysis}
        loading={step === "analyzing"}
        onClose={() => {
          setModalOpen(false);
          reset();
        }}
        onDatasetCreated={(sourceId) => {
          onComplete?.(sourceId);
        }}
      />
    </>
  );
};

export default FileDropZone;
