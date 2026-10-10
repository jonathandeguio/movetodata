import MtdTable from "Apps/Dataset/Table/MtdTable";
import { SearchEmptyState } from "assets/Illustrations/EmptyState";
import NoData from "components/CommonUI/NoData";
import React from "react";

interface IProps {
  data: any;
}

const PreviewResultDataset = ({ data }: IProps) => {
  let new_columns: any = [];
  if (data) {
    data?.schema?.map((column: any) => {
      let new_column = {
        accessorKey: "",
        header: "",
        id: "",
        cell: (info: any) => info.getValue(),
        footer: (props: any) => props.column.id,
        size: 200,
        type: "",
      };
      new_column.accessorKey = column.headerName;
      new_column.id = column.headerName;
      new_column.header = column.headerName;
      new_column.type = column.type;

      new_columns.push(new_column);
    });
  }

  if (!data) {
    <NoData
      heading={"No data"}
      subHeading={"No result found the process"}
      icon={<SearchEmptyState />}
    />;
  }
  return (
    <MtdTable
      isTableFromBottomBar={true}
      offlineData={{ rows: data?.data ?? [], cols: new_columns }}
    />
  );
};

export default React.memo(PreviewResultDataset);
