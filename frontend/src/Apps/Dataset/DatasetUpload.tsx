import { ResourceSubTypeEnum } from "Apps/explorer/explorer.utils";
import {
  Button,
  Card,
  Col,
  Divider,
  Progress,
  Radio,
  Row,
  Typography,
} from "antd";
import { CrossIcon, PublishIcon } from "assets/icons/mtdActionIcons";
import { DocsIcon } from "assets/icons/mtdFileIcons";
import { UploadIcon } from "assets/icons/mtdInterfaceIcons";
import { TableIcon } from "assets/icons/mtdTableIcons";
import MtdLoader from "components/mtdLoader";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { autoFormatter } from "utils/AutoFormatter";
import {
  blobFileType,
  getLanguageLabel,
  openNotification,
} from "utils/utilities";
import * as XLSX from "xlsx";
import AiImportPanel from "./components/AiImportPanel/AiImportPanel";
import { importDataset } from "../../redux/actions/datasetActions";
import { ThunkAppDispatch } from "../../redux/types/store";
const { Title, Text } = Typography;
interface TProps {
  id: string;
  branch: string;
}
const DatasetUpload = ({ id, branch }: TProps) => {
  const navigate = useNavigate();
  const { config } = useSelector((state) => (state as any).platformConfig);

  const [selectedFile, setSelectedFile] = useState([]);
  const [isSelected, setIsSelected] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [readingFile, setReadingFile] = useState(false);
  const [uploadClicked, setUploadClicked] = useState(false);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [fileData, setFileData] = useState<{
    columns: string[];
    sampleRows: string[][];
  } | null>(null);

  const isFileReadyToUpload = isSelected && !readingFile;

  const showSheetSelector = isSelected && sheetNames.length > 0 && !readingFile;

  const dispatch = useDispatch<ThunkAppDispatch>();
  const acceptedFileTypes = {
    "text/csv": [".csv"],
    "application/vnd.ms-excel": [
      ".xls",
      ".xlt",
      ".xla",
      ".xlam",
      ".xll",
      ".xlw",
    ],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
      ".xlsm",
      ".xlsb",
      ".xltx",
      ".xltm",
    ],
    "text/tab-separated-values": [".tsv"],
  };

  // Parse CSV/TSV text preview (header + up to 200 rows) without loading full file
  const parseCSVPreview = (
    text: string,
    sep: string
  ): { columns: string[]; sampleRows: string[][] } => {
    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; }
        else if (ch === sep && !inQ) { result.push(cur.trim()); cur = ""; }
        else { cur += ch; }
      }
      result.push(cur.trim());
      return result;
    };
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { columns: [], sampleRows: [] };
    const columns = parseRow(lines[0]).map((c) => c.replace(/^"|"$/g, ""));
    const sampleRows = lines.slice(1, 201).map(parseRow);
    return { columns, sampleRows };
  };

  const onDrop = useCallback((acceptedFiles: any) => {
    if (acceptedFiles.length == 0) {
      openNotification("File rejected", "", "error");
      return;
    }
    const file = acceptedFiles[0];
    setIsSelected(true);
    setSelectedFile(file);
    setFileData(null);

    // For very large files (>50 MB) skip all client-side reading entirely:
    // even reading a small slice can cause Chrome to scan the full file.
    // Schema/columns will be unavailable but upload still works normally.
    const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024;
    if (file.size > LARGE_FILE_THRESHOLD) {
      setSheetNames([]);
      setSelectedSheet("");
      setReadingFile(false);
      return;
    }

    setReadingFile(true);

    const isCSV = /\.(csv|tsv)$/i.test(file.name) ||
      file.type === "text/csv" ||
      file.type === "text/tab-separated-values";

    if (isCSV) {
      // Read only first 100 KB — enough for header + ~200 rows
      const sep = /\.tsv$/i.test(file.name) ? "\t" : ",";
      const sliceReader = new FileReader();
      sliceReader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const { columns, sampleRows } = parseCSVPreview(text, sep);
          setFileData(columns.length > 0 ? { columns, sampleRows } : null);
        } catch {
          setFileData(null);
        }
        setSheetNames([]);
        setSelectedSheet("");
        setReadingFile(false);
      };
      sliceReader.readAsText(file.slice(0, 100 * 1024));
    } else {
      // Excel — use SheetJS (xlsx files are compressed, manageable in memory)
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });

          if (blobFileType(file.name, ResourceSubTypeEnum.XLS)) {
            const names = workbook.SheetNames;
            setSheetNames(names as any);
            setSelectedSheet(names[0] as string);
          } else {
            setSheetNames([]);
            setSelectedSheet("");
          }

          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          if (firstSheet) {
            const rows: string[][] = XLSX.utils.sheet_to_json(firstSheet, {
              header: 1,
              defval: "",
              raw: false,
            }) as string[][];

            if (rows.length > 0) {
              const columns = (rows[0] as string[]).map((c) =>
                c != null ? String(c) : ""
              );
              const sampleRows = rows
                .slice(1, 201)
                .map((row) =>
                  columns.map((_, i) => (row[i] != null ? String(row[i]) : ""))
                );
              setFileData({ columns, sampleRows });
            } else {
              setFileData(null);
            }
          } else {
            setFileData(null);
          }
        } catch {
          setFileData(null);
        }
        setReadingFile(false);
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      accept: acceptedFileTypes,
    });

  const uploadAPI = async () => {
    setUploadClicked(true);
    // message.loading(`Please wait uploading.`);
    navigate(-1);

    dispatch(
      importDataset(selectedFile, id, branch, setUploading, selectedSheet)
    ).then((data: $TSFixMe) => {
      //   dispatch(checkTransaction(id!, branch!)).finally(() => {
      setIsSelected(false);
      setUploadClicked(false);
      setSelectedFile([]);
      setSelectedSheet("");
      //   });
    });
  };

  if (!config.upload)
    return (
      <div className="dataset-upload-out">
        <Row align={"middle"} justify="center" style={{ padding: "1.5rem 0" }}>
          <div className="lock" />
        </Row>

        <Row align={"middle"} justify="center">
          <Text strong style={{ fontSize: "1.5rem" }}>
            Upload Disabled
          </Text>
        </Row>
        <Row align={"middle"} justify="center">
          {" "}
          <Text style={{ fontSize: "1rem" }}>
            Please Contact the Platform Admin to enable the Uploads on MoveToData.
          </Text>
        </Row>
      </div>
    );

  return (
    <>
      <div className="dataset-upload-out">
        {!isSelected ? (
          <>
            <div className="dataset-upload-out-head">
              {getLanguageLabel("noDataFoundPleaseUploadAFile")}
            </div>
            <div
              {...getRootProps({ className: "dropzone" })}
              className="dataset-upload"
              style={{ cursor: "pointer" }}
            >
              <input
                {...(getInputProps() as any)}
                className="dataset-upload-btn"
              />
              {isDragReject && <p>Files will be rejected</p>}
              <Row
                style={{
                  height: "40vh",
                  alignContent: "center",
                  border: "1px dashed var(--movetodata-border-color-default)",
                  alignItems: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  position: "relative",
                  textAlign: "center",
                  borderRadius: "3px",
                  margin: "7px",
                }}
              >
                <Title level={5}>
                  {getLanguageLabel("dragFile")}{" "}
                  {getLanguageLabel("or").toLowerCase()}{" "}
                  <span
                    style={{
                      color: "var(--movetodata-font-color-default)",
                    }}
                    className="link"
                  >
                    {getLanguageLabel("browseFiles")}{" "}
                  </span>
                </Title>
              </Row>
              {/* </p> */}
              <br />
              By uploading files, you agree to our Terms and Conditions and
              Privacy Policy.
            </div>
          </>
        ) : (
          <div className="dataset-upload">
            <div>
              {
                <>
                  {/* {!uploadClicked ? (
                        <Card
                          title={
                            <>
                              <span
                                style={{
                                  background: "#ff6600",
                                  color: "white",
                                  fontWeight: "",
                                }}
                              >
                                {" "}
                                <div className="text-and-icon-center">
                                  <WarningIcon color={"white"} size={30} />{" "}
                                  {getLanguageLabel(
                                    "dataUploadSecurityWarning"
                                  )}{" "}
                                </div>
                              </span>
                            </>
                          }
                          bordered={false}
                          className="scaled card"
                          style={{
                            textAlign: "left",
                            width: "72vw",
                            background: "#ff6600",
                            color: "white",
                          }}
                        >
                          {getLanguageLabel("dataUploadSecurityWarningText")}
                        </Card>
                      ) : (
                        <></>
                      )} */}

                  <Card
                    title={
                      <>
                        <div className="text-and-icon-center">
                          <DocsIcon /> {getLanguageLabel("files")}{" "}
                        </div>
                      </>
                    }
                    bordered={false}
                    // className="scaled-interactive card"
                    style={{ textAlign: "left" }}
                  >
                    <Row gutter={16} style={{ textAlign: "left" }}>
                      <Col className="gutter-row" span={6}>
                        {" "}
                        {getLanguageLabel("fileName")}
                      </Col>
                      <Col className="gutter-row" span={6}>
                        {(selectedFile as $TSFixMe).name}
                      </Col>
                    </Row>
                    <Row gutter={16} style={{ textAlign: "left" }}>
                      <Col className="gutter-row" span={6}>
                        {" "}
                        {getLanguageLabel("fileType")}
                      </Col>
                      <Col className="gutter-row" span={16}>
                        {(selectedFile as $TSFixMe).type}
                      </Col>
                    </Row>
                    <Row gutter={16} style={{ textAlign: "left" }}>
                      <Col className="gutter-row" span={6}>
                        {" "}
                        {getLanguageLabel("size")}
                      </Col>
                      <Col className="gutter-row" span={6}>
                        {autoFormatter(
                          (selectedFile as $TSFixMe).size,
                          "bytes"
                        )}
                      </Col>
                    </Row>
                  </Card>
                  <br />

                  {showSheetSelector && (
                    <>
                      <Card
                        title={
                          <>
                            <TableIcon /> {getLanguageLabel("selectSheet")}{" "}
                          </>
                        }
                        bordered={false}
                        // className="scaled-interactive card"
                        style={{ textAlign: "left" }}
                      >
                        <Radio.Group
                          name="Sheet"
                          onChange={(e) => {
                            setSelectedSheet(e.target.value);
                          }}
                          value={selectedSheet}
                          size="small"
                        >
                          {sheetNames.map((sheet) => {
                            return (
                              <Radio name="sheet" value={sheet}>
                                {sheet}
                              </Radio>
                            );
                          })}
                        </Radio.Group>
                      </Card>
                    </>
                  )}

                  {readingFile && (
                    <Card bordered={false}>
                      <Row
                        justify={"center"}
                        align={"middle"}
                        gutter={[16, 16]}
                      >
                        <Col>
                          <MtdLoader />
                        </Col>
                        <Col>Your file is getting ready...</Col>
                      </Row>
                    </Card>
                  )}
                  <br />
                </>
              }
              {uploadClicked ? (
                <Card bordered={false}>
                  {uploading < 100 ? (
                    <>
                      <Title>
                        <div className="text-and-icon-center">
                          <PublishIcon size={40} />
                          {getLanguageLabel("uploadWait")}
                        </div>
                        <Divider />
                        <Progress percent={uploading} />
                        <Text type="secondary">
                          {getLanguageLabel("uploadWaitDetail")}
                        </Text>
                      </Title>
                    </>
                  ) : (
                    <>
                      <Title>
                        <div className="text-and-icon-center">
                          <MtdLoader size="small" />
                          &nbsp;{" "}
                          <Text type="secondary">
                            {getLanguageLabel("processing")}
                          </Text>
                        </div>
                      </Title>
                      <Text type="secondary">
                        {getLanguageLabel("creatingDatasetDetail")}
                      </Text>
                    </>
                  )}
                </Card>
              ) : (
                ""
              )}
            </div>
          </div>
        )}
        {isFileReadyToUpload && fileData && fileData.columns.length > 0 && (
          <AiImportPanel
            file={selectedFile as unknown as File}
            columns={fileData.columns}
            sampleRows={fileData.sampleRows}
          />
        )}

        <div>
          {isFileReadyToUpload && (
            <>
              <br />
              <Button
                disabled={uploadClicked}
                size={"large"}
                onClick={() => {
                  setIsSelected(false);
                  setFileData(null);
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CrossIcon />
                  &nbsp;
                  {getLanguageLabel("cancel")}
                </div>
              </Button>
              &nbsp; &nbsp;
              <Button
                disabled={uploadClicked}
                size={"large"}
                onClick={uploadAPI}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <UploadIcon />
                  &nbsp;
                  {getLanguageLabel("upload")}
                </div>
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DatasetUpload;
