import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useEffect, useState } from "react";
import { getLanguageLabel } from "utils/utilities";
import { abortDatasetWritingTransactionAPI } from "../Builds.api";
interface IProps {
  text: string;
  datasetId: string;
  branch: string;
}

const ALREADY_ACTIVE_TEXT = "There is a transaction already active";
const ABORT_TRANSACTION_BTN = "ABORT_TRANSACTION_BTN";

const BuildTableDatasetWritingTransactionActive = ({
  text,
  datasetId,
  branch,
}: IProps) => {
  const [showAbortTransactionBtn, setShowAbortTransactionBtn] =
    useState<boolean>(false);

  const performCheck = (text: string) => {
    if (text == ALREADY_ACTIVE_TEXT) {
      setShowAbortTransactionBtn(true);
    }
  };

  const handleTransactionAborting = () => {
    abortDatasetWritingTransactionAPI(datasetId, branch)
      .then(() => {
        (window as any).makeButtonTemporarySuccess(
          ABORT_TRANSACTION_BTN,
          300000
        );
      })
      .catch(() => {
        (window as any).makeButtonTemporaryFailure(
          ABORT_TRANSACTION_BTN,
          300000
        );
      })
      .finally(() => {});
  };

  useEffect(() => {
    performCheck(text);
  }, [text]);

  if (!showAbortTransactionBtn) {
    return <></>;
  }

  return (
    <div>
      <MtdButton
        intent="action"
        onClick={handleTransactionAborting}
        id={ABORT_TRANSACTION_BTN}
      >
        {getLanguageLabel("abortTransaction")}
      </MtdButton>
    </div>
  );
};

export default BuildTableDatasetWritingTransactionActive;
