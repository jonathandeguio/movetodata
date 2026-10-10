import { getDatasetMappingTransactionsAPI } from "Apps/Dataset/Dataset.api";
import { TDatasetMapping, TTransaction } from "Apps/Dataset/Dataset.contants";
import { Divider, Typography } from "antd";
import { SearchEmptyState } from "assets/Illustrations/EmptyState";
import NoData from "components/CommonUI/NoData";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateTransactionsDatasetMapping } from "../../redux/actions/datasetActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import DatasetHistoryListElement from "./DatasetHistoryListElement";
import DatasetHistoryStats from "./Stats/DatasetHistoryStats";
const { Text } = Typography;
interface TProps {
  datasetMapping: TDatasetMapping;
}

const DatasetHistoryContainer = ({ datasetMapping }: TProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const transactions = useSelector(
    (state) =>
      (state as $TSFixMe).datasetMappingTransactions[datasetMapping.datasetId]
  );

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getDatasetMappingTransactionsAPI(
      datasetMapping.datasetId,
      datasetMapping.branch,
      null
    )
      .then(({ data }) => {
        dispatch(
          updateTransactionsDatasetMapping(
            datasetMapping.datasetId,
            datasetMapping.branch,
            data
          )
        );
      })
      .finally(() => {
        setLoading(false);
      })
      .catch((error) => {});
  }, [datasetMapping]);

  if (loading) {
    return <MtdLoader />;
  }

  if (!transactions || transactions.length == 0) {
    return (
      <NoData
        heading={"No transactions found"}
        subHeading={"Create a transaction"}
        icon={<SearchEmptyState />}
      />
    );
  }
  return (
    <div style={{ padding: "10px" }}>
      <DatasetHistoryStats transactions={transactions} />
      <Divider />
      {transactions.map((transaction: TTransaction, _index: number) => (
        <>
          <DatasetHistoryListElement
            transaction={transaction}
            isSelected={datasetMapping?.currentTransaction == transaction.id}
            datasetMapping={datasetMapping}
          />
          <Divider
            style={{
              margin: 0,
              marginBottom: "5px",
            }}
          />
        </>
      ))}
    </div>
  );
};

export default DatasetHistoryContainer;
