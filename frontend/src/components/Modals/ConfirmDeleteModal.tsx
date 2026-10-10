import React from "react";

import { getLanguageLabel } from "utils/utilities";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";

import { reUploadDatasetAPI } from "Apps/Dataset/Table/MtdTable.api";
import { TableIcon } from "assets/icons/mtdTableIcons";
import MtdModal from "components/CommonUI/MtdModalContainer";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import { CrossIcon } from "../../assets/icons/mtdActionIcons";
import { TickIcon } from "../../assets/icons/mtdNavigationIcon";
import { ThunkAppDispatch } from "../../redux/types/store";

export default ({ isVisible, setIsVisible }: any) => {
  const { id, branch } = useParams();

  const dispatch = useDispatch<ThunkAppDispatch>();

  const handleOk = () => {
    setIsVisible(false);
    reUploadDatasetAPI(id as string, branch as string).then(() => {
      // dispatch(checkTransaction(id, branch, true));
    });
  };

  return (
    <MtdModal
      open={isVisible}
      onCancel={() => setIsVisible(false)}
      headingIcon={<TableIcon />}
      heading="Re-upload"
      footerButtonArea={
        <>
          <MtdButton
            icon={<TickIcon />}
            intent="dangerous"
            onClick={handleOk}
          >
            {getLanguageLabel("re-Upload")}
          </MtdButton>
          <MtdButton
            icon={<CrossIcon />}
            intent="primary"
            onClick={() => setIsVisible(false)}
          >
            {getLanguageLabel("cancel")}
          </MtdButton>
        </>
      }
    >
      Are you sure you want to Re-Upload?
    </MtdModal>
  );
};
