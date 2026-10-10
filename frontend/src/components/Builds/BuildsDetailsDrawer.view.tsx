import { Resizable } from "re-resizable";
import React from "react";
import BuildDetailsTable from "./BuildDetailsTable.view";

const BuildLog = ({ id, visible, page }: $TSFixMe) => {
  // const { loading: loadingBuildSpec, data: dataBuildSpec } = useSelector(
  //   (state) => (state as any).datasetBuildSpec
  // );
  //
  // if (!dataBuildSpec) {
  //   return <MtdLoader />;
  // }

  return (
    <>
      {visible && (
        <Resizable
          style={{
            borderTop: "solid 1px var(--movetodata-border-color-default)",
            background: "var(--background-color)",
            position: "absolute",
            bottom: "0",
            zIndex: "199",
          }}
          defaultSize={{
            height: 200,
            width: "100%",
          }}
          minWidth="100%"
          minHeight="44vh"
          maxHeight="85vh"
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
          <BuildDetailsTable
            id={id}
            showHeader={
              page == "CONNECT" || page == "REPOSITORY" ? false : true
            }
            page={page}
          />
        </Resizable>
      )}
    </>
  );
};

export default BuildLog;
