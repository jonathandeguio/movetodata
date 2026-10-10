import React from "react";
import "./MtdEditText.scss";

const MtdEditText = (props: { children: any }) => {
  return (
    <div
      contentEditable="true"
      className="mtd_edit_text"
      onInput={(e) => {
        e.preventDefault();
      }}
    >
      {props.children}
    </div>
  );
};

export default MtdEditText;
