import MtdTable from "Apps/Dataset/Table/MtdTable";
import React from "react";

const PipelineTable = ({ id, branch }: $TSFixMe) => {
  return (
    <div
      style={{
        height: "95%",
        width: "100%",
      }}
    >
      <MtdTable
        onDataLoad={() => {}}
        isTableFromBottomBar={true}
        id={id}
        branch={branch}
      />
    </div>
  );
};

export default PipelineTable;
