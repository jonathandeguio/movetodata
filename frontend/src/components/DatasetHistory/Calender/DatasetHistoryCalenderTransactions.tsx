import { TDatasetMapping, TTransaction } from "Apps/Dataset/Dataset.contants";
import { SearchEmptyState } from "assets/Illustrations/EmptyState";
import { BuildStatusEnum } from "components/Builds/Builds.constants";
import NoData from "components/CommonUI/NoData";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { timeConverter } from "utils/utilities";
import { updateCurrentTransactionMapping } from "../../../redux/actions/datasetActions";
import styles from "../DatasetHistory.module.scss";

interface TProps {
  datasetMapping: TDatasetMapping;
}
interface TListElementProps {
  transaction: TTransaction;
  isSelected: boolean;
}
const handleTransactionChange = (
  dispatch: any,
  newLocalTID: string,
  datasetId: string,
  branch: string
) => {
  dispatch(updateCurrentTransactionMapping(datasetId, branch, newLocalTID));
};

const ListElement = ({ transaction, isSelected }: TListElementProps) => {
  const dispatch = useDispatch();
  return (
    <div
      className={
        styles.editRowContainer + (isSelected ? " selectedHeading" : "")
      }
      style={{
        padding: "15px",
        cursor: "pointer",
      }}
      onClick={() => {
        if (transaction.buildStatus == BuildStatusEnum.SUCCESS) {
          handleTransactionChange(
            dispatch,
            transaction.id,
            transaction.datasetId,
            transaction.branch
          );
        }
      }}
    >
      <div className={styles.editRowTime}>
        {"On " + timeConverter(transaction.createdAt)}
      </div>
    </div>
  );
};

const DatasetHistoryCalenderTransactions = ({ datasetMapping }: TProps) => {
  const transactions = useSelector(
    (state) =>
      (state as $TSFixMe).datasetMappingTransactions[datasetMapping.datasetId]
  );

  if (!transactions || transactions.length == 0) {
    return (
      <div className={styles.rightPanel}>
        <NoData
          heading={"No transactions found"}
          subHeading={"Create a transaction"}
          icon={<SearchEmptyState />}
        />
      </div>
    );
  }

  return (
    <div className={styles.rightPanel}>
      <div className={"MtdHeader1"}>Transactions</div>
      <div className={styles.rightPanelContent}>
        {transactions.map((transaction: TTransaction, _index: number) => {
          if (transaction.buildStatus == BuildStatusEnum.SUCCESS)
            return (
              <ListElement
                transaction={transaction}
                isSelected={datasetMapping?.currentTransaction == transaction.id}
              />
            );
        })}
      </div>
    </div>
  );
};

export default DatasetHistoryCalenderTransactions;
