import "@blocknote/core/style.css";
import LexicalEditor from "Apps/LexicalEditor";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import React from "react";

interface Props {
  dashboardId: string;
  layout: any;
  element: any;
  editable: boolean;
  removeElement: any;
  tabId: string;
  updateTabElement: (
    elementId: string,
    elementType: string,
    data: string
  ) => void;
}

const EditorElement = (props: Props) => {
  const defaultData =
    props.element && props.element.data ? props.element.data : undefined;

  const handleChange = (editorState: any) => {
    props.updateTabElement(
      props.element.id,
      props.element.type,
      JSON.stringify(editorState)
    );
  };

  return (
    <div
      className={
        props.editable ? "editorElement editableElementBorder" : "editorElement"
      }
      style={{
        cursor: props.editable ? "move" : "pointer",
        color: "var(--PRIMARY_COLOR)",
      }}
    >
      <div
        style={{
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
        <LexicalEditor
          defaultData={defaultData}
          handleChange={handleChange}
          editable={props.editable}
        />
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
          <TrashIcon color="var(--movetodata-intent-danger)" />
        </div>
      )}
    </div>
  );
};
export default EditorElement;
