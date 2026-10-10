import React, { useState } from "react";
/** @jsxImportSource @emotion/react */

import { Typography } from "antd";
import { getLanguageLabel } from "utils/utilities";

import { DownloadIcon } from "../../assets/icons/mtdInterfaceIcons";
import Avatars from "../Avatars/Avatars";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import Comments from "../Comments/Comments.view";

import CustomBreadCrumb from "components/Nav/Manage/breadCrumb";
import { downloadBlobFile } from "./BlobViewer.utils";
import { MtdInfoPopover } from "components/CommonUI/MtdInfoPopover/MtdInfoPopover.view";

const { Text } = Typography;

const BlobHeader = ({ file, fileDetails }: any) => {
  return (
    <div className="blob-container-header">
      <CustomBreadCrumb />
      <div className="blob-container-header-btns">
        <MtdInfoPopover id={fileDetails.id} type={fileDetails.type} />
        <Comments id={fileDetails.id} />
        <Avatars link={`/topic/${fileDetails.id}`} />
        <MtdButton
          intent="action"
          icon={<DownloadIcon />}
          onClick={() =>
            downloadBlobFile(file, fileDetails.name, fileDetails.subType)
          }
        >
          {getLanguageLabel("download")}
        </MtdButton>
      </div>
    </div>
  );
};

export default BlobHeader;
