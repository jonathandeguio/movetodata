import { Resizable } from "re-resizable";
import React from "react";

import MtdTable from "../../Apps/Dataset/Table/MtdTable";

const PipelineTable = ({ id, branch }: $TSFixMe) => {
  return (
    <>
      <Resizable
        style={{
          borderTop: "solid 0px black",
          backgroundColor: "var(--background-color)",

          position: "absolute",
          zIndex: "99",
          bottom: "0",
        }}
        defaultSize={{
          height: 200,
          width: 50,
        }}
        minWidth="100%"
        minHeight="50vh"
        maxHeight="50vh"
        enable={{
          top: true,
          right: false,
          bottom: false,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
      >
        <div
          style={{
            height: "95%",
            width: "100%",
          }}
        >
          <MtdTable isTableFromBottomBar={true} id={id} branch={branch} />
        </div>
      </Resizable>
    </>
  );
};

export default PipelineTable;
