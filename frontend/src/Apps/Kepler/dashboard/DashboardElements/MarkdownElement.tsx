import MDEditor from "@uiw/react-md-editor";
import { useAutoSaveReady } from "components/VersionHistory/hooks/setAutoSaveReady";
import React, { useEffect, useState } from "react";
import rehypeSanitize from "rehype-sanitize";
import { decodeFromBase64, encodeToBase64 } from "utils/utilities";
import { TrashIcon } from "../../../../assets/icons/mtdMiscellaneousIcons";
import { DEFAULT_MARKDOWN } from "../Dashboard.contants";
import styles from "./DashboardElements.module.scss";
interface Props {
  dashboardId: string;
  tabId: string;
  layout: any;
  element: any;
  editable: boolean;
  removeElement: any;
}
const MarkdownElement = (props: Props) => {
  /**
   * Configs
   */

  const [value, setValue] = useState<any>(
    props.element.data == ""
      ? decodeFromBase64(DEFAULT_MARKDOWN)
      : decodeFromBase64(props.element.data)
  );

  const setAutoSaveReady = useAutoSaveReady();
  const saveMarkdown = async () => {
    const payload = [
      {
        dashboardId: props.dashboardId,
        elementId: props.element.id,
        type: props.element.type,
        data: encodeToBase64(value),
      },
    ];
    setAutoSaveReady(true);
    // updateTabElementAPI(props.dashboardId, props.tabId, payload);
  };

  useEffect(() => {
    if (value != DEFAULT_MARKDOWN) saveMarkdown();
  }, [value]);

  function Markdown() {
    return (
      <div
        className={
          styles.markdownElement + props.editable
            ? " markdownElement editableElementBorder"
            : " markdownElement nonEditableElementBorder"
        }
        style={{
          cursor: props.editable ? "move" : "pointer",
        }}
      >
        {props.editable ? (
          <>
            <MDEditor
              value={value}
              onChange={setValue}
              style={{
                height: "100%",
                width: "100%",
                cursor: "pointer",
                background: "none !important",
              }}
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
              onMouseDownCapture={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
            <div
              className="editableElementBorder-delete"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                props.removeElement(props.dashboardId, props.element.id);
              }}
            >
              <TrashIcon />
            </div>
          </>
        ) : (
          <MDEditor.Markdown
            source={value}
            style={{
              whiteSpace: "pre-wrap",
              height: "100%",
              width: "100%",
              padding: "10px 20px",
              border: "1px solid #d0d7de",
              overflow: "scroll",
            }}
            className={"w-md-editor-preview "}
          />
        )}
      </div>
    );
  }
  return Markdown();
};

export default MarkdownElement;
