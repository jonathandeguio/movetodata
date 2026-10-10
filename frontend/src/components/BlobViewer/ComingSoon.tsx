import { Card, Space } from "antd";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { DownloadIcon } from "../../assets/icons/mtdInterfaceIcons";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";

import { downloadBlobFile } from "./BlobViewer.utils";

const ComingSoon = ({ file, fileDetails }: any) => {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Card
        style={{
          textAlign: "center",
          height: "100%",
          width: "100%",
        }}
        cover={
          <Space style={{ marginTop: "1rem" }}>
            <img
              style={{ height: "50vh", width: "30vw" }}
              alt="example"
              src="https://i.pinimg.com/736x/79/cd/bd/79cdbd490251e750e5afce048532dec0.jpg"
            />
          </Space>
        }
      >
        <MtdButton
          intent="primary"
          icon={<DownloadIcon />}
          onClick={() =>
            downloadBlobFile(file, fileDetails.name, fileDetails.subType)
          }
        >
          {getLanguageLabel("download")}
        </MtdButton>
      </Card>
    </div>
  );
};
export default ComingSoon;
