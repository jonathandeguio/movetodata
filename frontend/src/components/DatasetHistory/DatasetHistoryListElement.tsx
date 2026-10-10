import { TDatasetMapping, TTransaction } from "Apps/Dataset/Dataset.contants";
import { Tooltip } from "antd";
import {
  BuildIcon,
  SyncIcon,
  WarningIcon,
} from "assets/icons/mtdActionIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import UserInfo from "common/components/UserInfo";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { BuildStatusEnum } from "components/Builds/Builds.constants";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  formatDuration,
  getLanguageLabel,
  getTimeDisplay,
  timeConverter,
} from "utils/utilities";
import { updateCurrentTransactionMapping } from "../../redux/actions/datasetActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import { abortDatasetTransactionAPI } from "./DatasetHistory.api";
import styles from "./DatasetHistory.module.scss";

interface TProps {
  transaction: TTransaction;
  isSelected: boolean;
  datasetMapping: TDatasetMapping;
}

const DATASET_TRANSACTION_ABORT_BTN = "DATASET_TRANSACTION_ABORT_BTN";

const DatasetHistoryListElement = ({
  transaction,
  isSelected,
  datasetMapping,
}: TProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const handleTransactionChange = (newLocalTID: string) => {
    dispatch(
      updateCurrentTransactionMapping(
        datasetMapping.datasetId,
        datasetMapping.branch,
        newLocalTID
      )
    );
  };

  const handleDatasetTransactionAbortCase = (
    datasetId: string,
    transactionId: string
  ) => {
    abortDatasetTransactionAPI(datasetId, transactionId)
      .then(() => {
        (window as any).makeButtonTemporarySuccess(
          DATASET_TRANSACTION_ABORT_BTN + transaction.id,
          300000
        );
        transaction.buildStatus = "ABORTED";
      })
      .catch(() => {
        (window as any).makeButtonTemporaryFailure(
          DATASET_TRANSACTION_ABORT_BTN + transaction.id,
          300000
        );
      });
  };

  const GetIcon = () => {
    let icon = <></>;

    switch (transaction.buildStatus) {
      case BuildStatusEnum.ACTIVE:
        icon = <SyncIcon color={"#08c"} spin />;
        break;
      case BuildStatusEnum.SUCCESS:
        icon = (
          <div className="success-tick-mini-circle text-and-icon-center">
            <TickIcon size={10} color="#ffffff" />
          </div>
        );
        break;
      case BuildStatusEnum.ABORTED:
      case BuildStatusEnum.FAILED:
      case BuildStatusEnum.ERROR:
        icon = (
          <div className="text-and-icon-center">
            <WarningIcon size={20} color="#FFA500" />
          </div>
        );
        break;
      case BuildStatusEnum.DELETED:
        icon = <TrashIcon size={10} />;
        break;
    }
    return icon;
  };

  useEffect(() => {}, [transaction]);

  return (
    <div
      className={
        styles.editRowContainer +
        (isSelected ? " selectedHeading" : "") +
        (transaction.buildStatus == BuildStatusEnum.DELETED
          ? " cut-through"
          : " ")
      }
      style={{
        padding: "15px",
      }}
    >
      <div
        className={styles.editRowHead}
        style={{
          cursor:
            transaction.buildStatus == BuildStatusEnum.SUCCESS
              ? "pointer"
              : "not-allowed",
          borderRight:
            transaction.buildStatus == BuildStatusEnum.SUCCESS
              ? "3px solid var(--SUCCESS_COLOR)"
              : "3px solid var(--DANGEROUS_COLOR)",
        }}
        onClick={() => {
          if (transaction.buildStatus == BuildStatusEnum.SUCCESS) {
            handleTransactionChange(transaction.id);
          }
        }}
      >
        <div
          className={styles.editRow}
          style={{
            marginBottom: "5px",
          }}
        >
          <div className={styles.editRow}>
            <div className={styles.icon}>
              <GetIcon />
            </div>
            <div className={styles.editRowTime}>
              <Tooltip title={timeConverter(transaction.createdAt)}>
                {getTimeDisplay(transaction.createdAt)}
              </Tooltip>
            </div>
          </div>
          <div className={styles.editRowTime}>
            {formatDuration(transaction.finishedAt - transaction.createdAt)}
          </div>
        </div>
        <div className={styles.editRow}>
          <div>
            {transaction.launchedBy == "UNKNOWN" ? (
              <></>
            ) : (
              <>
                {transaction.launchedBy}
                <BuildIcon size={12} />
              </>
            )}
          </div>
          <UserInfo userId={transaction.createdBy} />
        </div>
        {transaction.buildStatus == BuildStatusEnum.ACTIVE && (
          <div className={styles.editRow + " --mt10"}>
            <MtdButton
              onClick={() =>
                handleDatasetTransactionAbortCase(
                  transaction.datasetId,
                  transaction.id
                )
              }
              id={DATASET_TRANSACTION_ABORT_BTN + transaction.id}
            >
              {getLanguageLabel("abortTransaction")}
            </MtdButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetHistoryListElement;
