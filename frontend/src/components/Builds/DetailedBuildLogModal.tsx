import MtdModal from "components/CommonUI/MtdModalContainer";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

interface TProps {
  open: boolean;
  content: any;
  onCancel: any;
}

const DetailedBuildLogModal = ({ open, content, onCancel }: TProps) => {
  return (
    <MtdModal
      heading={getLanguageLabel("detailedLogs")}
      open={open}
      width="70vw"
      onCancel={onCancel}
    >
      <div
        style={{
          whiteSpace: "pre-wrap",
          width: "100%",
          height: "70vh",
          fontFamily:
            "Space Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace",
          padding: "1rem",
          overflow: "scroll",
        }}
      >
        {content}
      </div>
    </MtdModal>
  );
};

export default DetailedBuildLogModal;
