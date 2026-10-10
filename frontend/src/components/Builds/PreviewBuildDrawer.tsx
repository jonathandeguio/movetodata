import MtdTable from "Apps/Dataset/Table/MtdTable";
import { Col, Row, Typography } from "antd";
import { CommentState } from "assets/Illustrations/EmptyState";
import {
  DuplicateIcon,
  HistoricalRunsIcon,
} from "assets/icons/mtdActionIcons";
import { ZoomToFitIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import NoData from "components/CommonUI/NoData";
import { MtdTag } from "components/Tag/Tag";
import MtdLoader from "components/mtdLoader";
import React, { useState } from "react";
import {
  IsUUID,
  TimeCounter,
  copyToClipboard,
  getLanguageLabel,
  isDefined,
  isEmpty,
} from "utils/utilities";
import { fetchDetailedLogs } from "./Builds.api";
import DetailedBuildLogModal from "./DetailedBuildLogModal";

const { Text } = Typography;

interface IPreviewBuild {
  data: any;
  loading: boolean;
  error: any;
  previewId: string;
  showDetailedLogs: boolean;
}

const PreviewBuildData = ({
  previewId,
  data,
  loading,
  error,
  showDetailedLogs,
}: IPreviewBuild) => {
  const [detailedLogs, setDetailedLogs] = useState();
  const [detailedLogsLoading, setDetailedLogsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  let new_columns: any = [];
  if (data) {
    data?.schema?.map((column: any) => {
      let new_column = {
        accessorKey: "",
        header: "",
        id: "",
        cell: (info: any) => info.getValue(),
        footer: (props: any) => props.column.id,
        size: 200,
        type: "",
      };
      new_column.accessorKey = column.headerName;
      new_column.id = column.headerName;
      new_column.header = column.headerName;
      new_column.type = column.type;

      new_columns.push(new_column);
    });
  }

  const getDetailedLogs = () => {
    setDetailedLogsLoading(true);
    if (!!previewId) {
      fetchDetailedLogs(previewId)
        .then(({ data }) => {
          setDetailedLogs(data);
          setIsModalOpen(true);
        })
        .finally(() => {
          setDetailedLogsLoading(false);
        });
    }
  };

  function ErrorHighlighter(errorText: string) {
    const processErrorText = (text: string) => {
      const lines = text.split("\n");
      const processedLines = lines.map((line, index) => {
        // Check if the next line has ^^^^ indicating an error on this line
        if (lines[index + 1] && lines[index + 1].trim().endsWith("^^^")) {
          // Find the word directly above ^^^^
          const errorPosition = lines[index + 1].indexOf("^");
          const words = line.split(" ");
          const processedWords = words.map((word, wordIndex) => {
            const wordPosition = line.indexOf(
              word,
              wordIndex > 0
                ? line.indexOf(words[wordIndex - 1]) +
                    words[wordIndex - 1].length
                : 0
            );
            if (
              errorPosition >= wordPosition &&
              errorPosition < wordPosition + word.length
            ) {
              // Wrap the word in error in a span with style for red color
              return `<span style="color: red;">${word}</span>`;
            }
            return word;
          });
          return processedWords.join(" ");
        }
        return line;
      });

      return processedLines.join("\n").replace(/\n/g, "<br/>");
    };

    if (isDefined(errorText)) {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: processErrorText(errorText) }}
        />
      );
    } else {
      return errorText;
    }
  }

  return (
    <>
      {loading ? (
        <>
          <Row style={{ height: "100%", width: "100%" }}>
            <Row
              style={{ height: "10%", width: "100%", padding: "6px" }}
              justify="end"
            >
              <Col>
                <MtdTag
                  // color={loading ? "var(--movetodata-intent-danger)" : ""}
                  icon={
                    <HistoricalRunsIcon
                      size={11}
                      // color={loading ? "#fff" : ""}
                    />
                  }
                >
                  <TimeCounter nudge={loading ? "start" : "stop"} />
                </MtdTag>
              </Col>
            </Row>
            <Row
              style={{
                height: "90%",
                width: "100%",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "5px",
              }}
              justify="space-between"
            >
              <Col>
                <MtdLoader
                  content={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: "5px",
                      }}
                    >
                      <div>{getLanguageLabel("previewIsRunning")}</div>
                    </div>
                  }
                />
              </Col>
            </Row>
          </Row>
        </>
      ) : error ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            // top: "50%",
          }}
        >
          {/* <NoData
            heading={error.message}
            subHeading={error.debug}
            icon={<WarningState />}
          /> */}
          {error.status != "ABORTED" && (
            <>
              {IsUUID(error) && error.length == 36 ? (
                <MtdButton
                  icon={<ZoomToFitIcon />}
                  onClick={() => {
                    getDetailedLogs();
                  }}
                  intent={"primary"}
                  loading={detailedLogsLoading}
                >
                  {getLanguageLabel("detailedLogs")}
                </MtdButton>
              ) : (
                <>
                  <Row>
                    <Col>
                      <Text type="danger">Error in preview</Text>
                    </Col>
                    <Col>
                      <MtdButton
                        icon={<DuplicateIcon />}
                        minimal
                        icononly
                        onClick={() => {
                          copyToClipboard(error.debug);
                        }}
                      ></MtdButton>
                    </Col>
                  </Row>

                  <Row>
                    <Col>
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          maxWidth: "100%",
                          overflowX: "auto",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            wordWrap: "break-word",
                            flexWrap: "wrap",
                            // fontSize: "0.7rem",
                          }}
                        >
                          {!isEmpty(error.debug)
                            ? error.debug
                            : isEmpty(error)
                            ? "No error logs found"
                            : error}
                        </div>
                      </pre>
                    </Col>
                  </Row>
                </>
              )}
            </>
          )}
        </div>
      ) : data ? (
        <MtdTable
          isTableFromBottomBar={true}
          offlineData={{ rows: data?.data ?? [], cols: new_columns }}
        />
      ) : (
        <NoData
          heading={getLanguageLabel("startPreviewToResults")}
          icon={<CommentState />}
        />
      )}
      <DetailedBuildLogModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        content={detailedLogs}
      />
    </>
  );
};

export default PreviewBuildData;
