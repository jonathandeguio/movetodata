import "@blocknote/core/style.css";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import { useAutoSaveReady } from "components/VersionHistory/hooks/setAutoSaveReady";
import React from "react";

interface Props {
  layout: any;
  element: any;
  editable: boolean;
  removeElement: any;
  dashboardId: string;
  tabId: string;
}

const TextElement = (props: Props) => {
  const defaultData =
    props.element && props.element.data
      ? JSON.parse(JSON.parse(props.element.data))
      : undefined;
  const setAutoSaveReady = useAutoSaveReady();

  const editor = useBlockNote({
    onEditorContentChange: (editor) => {
      // Log the document to console on every update
      const payload = [
        {
          dashboardId: props.dashboardId,
          elementId: props.element.id,
          type: props.element.type,
          data: JSON.stringify(JSON.stringify(editor.topLevelBlocks)),
          tabId: props.tabId,
        },
      ];
      // // updateTabElementAPI(props.dashboardId, props.tabId, payload).then(
      //   () => {}
      // );
      setAutoSaveReady(true);
    },
    editable: props.editable,
    initialContent: defaultData ? defaultData : undefined,
  });

  return (
    <div
      className={
        props.editable ? "textElement editableElementBorder" : "textElement"
      }
      style={{
        cursor: props.editable ? "move" : "pointer",
        color: "var(--PRIMARY_COLOR)",
      }}
    >
      <div
        style={{
          position: "relative",
          height: "calc(100%)",
          width: "calc(100%)",
          // background: "var(--background-color)",
          cursor: !props.editable ? "move" : "pointer",
        }}
        onMouseDownCapture={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <BlockNoteView editor={editor} theme={"light"} />
      </div>
      {props.editable && (
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
      )}
    </div>
  );
};
export default TextElement;
