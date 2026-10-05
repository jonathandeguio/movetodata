import React from "react";
import "./OrpheaEditText.scss";

const MoveToDataEditText = (props: { children: any }) => {
  return (
    <div
      contentEditable="true"
      className="movetodata_edit_text"
      onInput={(e) => {
        e.preventDefault();
      }}
    >
      {props.children}
    </div>
  );
};

export default MoveToDataEditText;
