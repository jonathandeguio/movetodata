import Filters from "components/Filters";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { RootState } from "redux/types/store";
import { NULL_UUID } from "utils/Common.constants";
import { decodeFromBase64 } from "utils/utilities";
import { EDIT_MODE } from "../../../redux/constants/resourcePermissionConstants";
import { getDatasetColumns, getTabDatasets } from "./Dashboard.api";
import DashboardGrid from "./DashboardGrid";
import DashboardRefreshBtn from "./DashboardRefreshBtn";

interface IProps {
  dashId: string;
  selectedTab: {
    id: string;
    key: string;
  };
  gridRef: any;
  dashboardId: string;
}
function DashboardGridDataFetcher({
  dashId,
  selectedTab,
  gridRef,
  dashboardId,
}: IProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[dashId]
  );

  const { isNewChartAdded } = useSelector(
    (state: RootState) => state.dashboardEdit
  );

  if (!resourcePermission) return <MtdLoader size="tiny" />;

  const editable = resourcePermission.mode == EDIT_MODE;

  const [filterColumns, setFilterColumns] = useState<any>({
    columns: [],
    columnsMap: new Map(),
  });
  const [filterColumnsLoading, setFilterColumnsLoading] =
    useState<boolean>(false);
  const [defaultFilterLoading, setDefaultFilterLoading] =
    useState<boolean>(true);

  const [defaultFilter, setDefaultFilter] = useState([]);

  const getFilterColumns = () => {
    setFilterColumnsLoading(true);
    getTabDatasets(selectedTab.id).then((datasets) => {
      const columns: any[] = [];
      const columnsMap: any = new Map();
      for (const [key, value] of Object.entries(datasets)) {
        getDatasetColumns(key, "master", NULL_UUID).then((cols) => {
          cols.map((column: any) => {
            // sync these with MtdTable and KeplerEChartContainer
            const columnObj = {
              name: column.headerName,
              value: column.headerName,
              type: column.type,
              datasetId: key,
            };
            columns.push(columnObj);

            columnsMap.set(column.header, columnObj);
          });
        });
      }

      setFilterColumns({ columns: columns, columnsMap: columnsMap });
      setFilterColumnsLoading(false);
    });
  };

  useEffect(() => {
    getFilterColumns();
  }, [selectedTab, isNewChartAdded]);

  useEffect(() => {
    if (searchParams.get("filter")) {
      const filterObj = JSON.parse(
        decodeFromBase64(searchParams.get("filter") as string)
      );

      if (filterObj[selectedTab.id]) {
        setDefaultFilter(filterObj[selectedTab.id]);
      }
    }
    setDefaultFilterLoading(false);
  }, [editable]);

  if (!editable && filterColumnsLoading && defaultFilterLoading) {
    return <MtdLoader />;
  }

  return (
    <>
      <div className={"--flex-row-space-between"}>
        <Filters
          borderWidth="0 0 1px 0"
          page={"dashboard"}
          columns={filterColumns}
          defaultFilters={defaultFilter}
          tabId={selectedTab.id}
        />
        <DashboardRefreshBtn />
      </div>
      <DashboardGrid
        editable={editable}
        dashboardId={dashboardId}
        tabId={selectedTab.id}
        gridRef={gridRef}
      />
    </>
  );
}

export default DashboardGridDataFetcher;
