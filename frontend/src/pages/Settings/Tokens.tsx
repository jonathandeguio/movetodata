import { Switch, Table } from "antd";
import { SearchIcon } from "assets/icons/mtdActionIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { getLanguageLabel } from "utils/utilities";
import MtdLoader from "../../components/mtdLoader/MtdLoader";
import TokenButton from "../../components/buttons/TokenButton";
import GlobalSearch from "../../helpers/GlobalSearch";
import { listTokens } from "../../redux/actions/tokenActions";
import { ThunkAppDispatch } from "../../redux/types/store";

const Tokens = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const location = useLocation();
  const { tokens } = useSelector((state) => (state as $TSFixMe).tokenList);
  const [FilteredData, setFilteredData] = useState();

  useEffect(() => {
    dispatch(listTokens());
  }, [dispatch, location]);

  interface DataItem {
    key: string;
    status: boolean;
    name: string;
    createdAt: Date;
    expiration: Date;
  }

  const columns: Array<{
    title: string;
    dataIndex: string;
    align?: string;
    width?: string;
    render?: (value: any, record: DataItem) => React.ReactNode;
    sorter?: (a: DataItem, b: DataItem) => number;
  }> = [
    {
      title: getLanguageLabel("status"),
      dataIndex: "status",
      align: "center",
      width: "10%",
      render: (status: boolean) => <Switch defaultChecked={status} />,
      sorter: (a: DataItem, b: DataItem) => (a.status ? 1 : -1),
    },
    {
      title: getLanguageLabel("label"),
      dataIndex: "name",
      width: "30%",
      sorter: (a: DataItem, b: DataItem) => a.name.localeCompare(b.name),
    },
    {
      title: getLanguageLabel("createdOn"),
      dataIndex: "createdAt",
      render: (createdAt: Date) =>
        new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(createdAt),
      width: "30%",
      sorter: (a: DataItem, b: DataItem) =>
        a.createdAt.getTime() - b.createdAt.getTime(),
    },
    {
      title: getLanguageLabel("expiringOn"),
      dataIndex: "expiration",
      render: (expiration: Date) =>
        new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(expiration),
      sorter: (a: DataItem, b: DataItem) =>
        a.expiration.getTime() - b.expiration.getTime(),
      width: "30%",
    },
  ];

  function onChange(
    pagination: $TSFixMe,
    filters: $TSFixMe,
    sorter: $TSFixMe,
    extra: $TSFixMe
  ) {
    //
  }
  // rowSelection={rowSelection}

  return tokens === "" ? (
    <div className="settings-center-block">
      <MtdLoader />
    </div>
  ) : (
    <div className="settings-center-block">
      <TokenButton />
      <MtdInput
        placeholder={getLanguageLabel("searchTokenTable")}
        allowClear
        onChange={(e) => {
          setFilteredData(GlobalSearch(e.target.value, tokens, columns));
        }}
        suffix={<SearchIcon />}
      />

      <Table
        // @ts-expect-error TS(2322): Type '({ title: string; dataIndex: string; align: ... Remove this comment to see the full error message
        columns={columns}
        dataSource={FilteredData !== undefined ? FilteredData : tokens}
        onChange={onChange}
        className="interactive"
        pagination={false}
        scroll={{x:true}}
        // scroll={{ y: 320 }}
      />
    </div>
  );
};

export default Tokens;
