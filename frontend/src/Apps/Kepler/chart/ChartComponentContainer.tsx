import { Drawer, message, Switch, Tabs, Tooltip, Typography } from "antd";
import { ExperimentOutlined } from "@ant-design/icons";
import {
  HistoricalRunsIcon,
  RefreshIcon,
} from "assets/icons/mtdActionIcons";
import { DownloadIcon } from "assets/icons/mtdInterfaceIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import Filters from "components/Filters";
import FilterConfirmationPopup, {
  TFilterAddOperator,
  TPopupResultObj,
} from "components/Filters/FilterConfirmationPopup";
import { MtdTag } from "components/Tag/Tag";
import { useOnlyOnce } from "hooks/useEffectOnlyOnce";
import React, { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel, isDefined, TimeCounter } from "utils/utilities";
import { AnomalyBadge, AugmentedAnalyticsDrawer } from "../components/AugmentedAnalyticsDrawer";
import { addFiltersFromDataset } from "../../../redux/actions/filtersAction";
import { RootState } from "../../../redux/types/store";
import { getDatasetColumns } from "../dashboard/Dashboard.api";
import ChartComponent from "./ChartComponent/ParentChartComponent";
import { chartConfig } from "./charts.config";
import { fetchChartData } from "./charts.utils";
import ChartDatasetDetails from "./components/ChartDatasetDetails";
import EmptyChart from "./EmptyChart";
import KeplerChartDataTable from "./components/KeplerChartDataTable";

const { Text } = Typography;

const ChartComponentContainer = () => {
  const { query, chart, data, dataForm, customize, customizeForm } =
    useSelector((state: RootState) => state.kepler);
  const allDatasetMapping = useSelector(
    (state: RootState) => state.datasetMapping
  );

  const queryMemo = useMemo(() => query, [query]);

  const [chartTableData, setChartTableData] = useState<any>([]);
  const [showDatasetDetailsPanel, setShowDatasetDetailsPanel] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [filterColumns, setFilterColumns] = useState<any>([]);
  const [filterColumnsLoading, setFilterColumnsLoading] =
    useState<boolean>(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState<any>({
    state: false,
    filters: undefined,
  });
  const [defaultFilters, setDefaultFilters] = useState<any[]>([]);
  const [popupResult, setPopupResult] = useState<TPopupResultObj>({
    value: "cancel",
    filters: [],
  });

  const fetchedFilters = () => {
    const _defaultFilters: any[] = [];
    query &&
      query.filter.map((filter: any) => {
        _defaultFilters.push({
          field: {
            datasetId: chart?.datasetId,
            name: filter.columnName,
            type: filter.columnType,
            value: filter.columnName,
          },
          conditionCase: filter.filters,
          logicalOperator: filter.logicalOperator,
          key: filter.key,
        });
      });

    setDefaultFilters(_defaultFilters);
    // return _defaultFilters;
  };

  const dispatch = useDispatch();

  const getFilterColumns = () => {
    setFilterColumnsLoading(true);
    const columns: any = [];
    const columnsMap: any = new Map();

    getDatasetColumns(
      chart?.datasetId,
      "master",
      allDatasetMapping[chart?.datasetId]?.datasetMapping?.currentTransaction
    ).then((cols) => {
      cols.map((column: any) => {
        // sync these with MtdTable and DashboardGridFetcher
        const columnObj = {
          name: column.headerName,
          value: column.headerName,
          type: column.type,
          datasetId: chart?.datasetId,
        };
        columns.push(columnObj);

        columnsMap.set(column.headerName, columnObj);
      });
      setFilterColumns({ columns: columns, columnsMap: columnsMap });
      setFilterColumnsLoading(false);
    });
  };

  const handleAddFilterCase = (defaultOperator: TFilterAddOperator) => {
    const filters = popupResult.filters;
    const _currentFilters: any = [];
    filters.map((filter: any, _index: number) => {
      if (filter.checked == true) {
        const columnName = filter.columnName;
        const columnType = "string";
        const filterValue = filter.FilterValue;

        if (columnName && columnType && filterValue)
          _currentFilters.push({
            field: {
              datasetId: chart?.datasetId,
              name: columnName,
              type: columnType,
              value: columnName,
            },
            conditionCase: [
              {
                key: `${"condition"}_${new Date().getTime() - _index - 1}`,
                operator: defaultOperator ? defaultOperator : filter.operator,
                value: filterValue,
              },
            ],
            key: `${"filter"}_${new Date().getTime() - _index - 1}`,
            logicalOperator: "AND",
          });
      }
    });

    dispatch(addFiltersFromDataset(_currentFilters, chart.id) as any);
  };

  useEffect(() => {
    const datasetMapping = allDatasetMapping[chart?.datasetId];
    if (
      chart &&
      datasetMapping &&
      datasetMapping.datasetMapping &&
      datasetMapping.datasetMapping.currentTransaction
    )
      getFilterColumns();
  }, [chart, allDatasetMapping]);

  useEffect(() => {
    if (showConfirmationPopup) {
      if (popupResult.value == "cancel") {
        // Do nothing
      } else if (popupResult.value == "keep") {
        handleAddFilterCase("equal");
      } else if (popupResult.value == "remove") {
        handleAddFilterCase("notEqual");
      }
      setShowConfirmationPopup({ state: false, filters: undefined });
    }
  }, [popupResult]);

  useOnlyOnce(
    () => {
      fetchedFilters();
    },
    () => isDefined(query)
  );

  if (!isDefined(queryMemo?.chartType))
    return <EmptyChart data="Sélectionnez un type de graphique" />;
  if (!isDefined(data))
    return <MtdLoader />;

  return (
    <div className="kepler-container-plane-right">
      <Tabs
        tabBarExtraContent={{
          left: (
            <div style={{ display: "flex", flexDirection: "row" }}>
              {isDefined(query) && (
                <Filters
                  page="kepler"
                  borderWidth="0px"
                  columns={filterColumns}
                  dataForm={dataForm}
                  defaultFilters={defaultFilters}
                />
              )}
              <div className="kepler-container-plane-right-head">
                <div style={{ marginRight: "0.5rem" }} className="text-and-icon-center">
                  <Tooltip title="Analytics IA (anomalies, prévision, segments, résumé)" placement="bottom">
                    <div style={{ position: "relative", display: "inline-flex" }}>
                      <MtdButton
                        icon={<ExperimentOutlined />}
                        minimal
                        icononly
                        trimicononlypadding
                        onClick={() => setShowAiDrawer(true)}
                      />
                      {anomalyCount > 0 && (
                        <span style={{ position: "absolute", top: -4, right: -4 }}>
                          <AnomalyBadge
                            count={anomalyCount}
                            onClick={() => setShowAiDrawer(true)}
                          />
                        </span>
                      )}
                    </div>
                  </Tooltip>
                </div>
                <div
                  style={{ marginRight: "1rem", gap: "0.5rem" }}
                  className="text-and-icon-center"
                >
                  {getLanguageLabel("columns")}
                  <Switch
                    size="small"
                    checked={showDatasetDetailsPanel}
                    onChange={() => {
                      // Show Columns Tab
                      setShowDatasetDetailsPanel(!showDatasetDetailsPanel);
                    }}
                  />
                </div>
                {chartTableData?.length > 0 && (
                  <div style={{ marginRight: "1rem" }}>
                    <CSVLink
                      filename={`${chart?.name ?? "unknown"}.csv`}
                      data={chartTableData}
                      className="btn btn-primary"
                      onClick={() => {
                        message.success(
                          getLanguageLabel("theFileIsDownloading")
                        );
                      }}
                    >
                      <MtdButton
                        icon={<DownloadIcon />}
                        intent="none"
                        size="small"
                        minimal
                        icononly
                        trimicononlypadding
                      ></MtdButton>
                    </CSVLink>
                  </div>
                )}
                {data.payload?.cachedData && (
                  <Tooltip title={getLanguageLabel("cachedDataMsg")}>
                    <MtdTag
                      onClick={() =>
                        fetchChartData(
                          false,
                          chart.id,
                          query,
                          dispatch,
                          undefined,
                          allDatasetMapping[chart?.datasetId]?.datasetMapping
                            ?.currentTransaction
                        )
                      }
                      icon={<RefreshIcon color={"#2D72D2"} size={8} />}
                    >
                      {getLanguageLabel("cached")}
                    </MtdTag>
                  </Tooltip>
                )}
                {data.payload?.rows !== undefined && (
                  <MtdTag>
                    {`${data.payload?.rows} ${getLanguageLabel("rows")}`}{" "}
                  </MtdTag>
                )}
                <MtdTag
                  color={
                    data.loading === true ? "var(--movetodata-intent-danger)" : ""
                  }
                  icon={
                    <HistoricalRunsIcon
                      size={11}
                      color={data.loading === true ? "#fff" : ""}
                    />
                  }
                >
                  <TimeCounter
                    nudge={data.loading === true ? "start" : "stop"}
                    poke={queryMemo}
                  />
                </MtdTag>
              </div>
            </div>
          ),
        }}
        className="tab"
        defaultActiveKey="1"
        // size="small"
        style={{ height: "100%" }}
        tabBarStyle={
          data.payload?.trimmedData
            ? { margin: "0" }
            : {
                padding: "0 2rem 0 0",
              }
        }
      >
        <Tabs.TabPane
          tab={
            <>
              <Text style={{ fontSize: "12px" }}>
                {getLanguageLabel("chart")}
              </Text>
            </>
          }
          key="1"
          style={{ height: "100%" }}
        >
          {data.payload?.trimmedData && (
            <div
              style={{
                background: "#137cbd",
                color: "#ffffff",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 2rem 0 0",
              }}
            >
              {getLanguageLabel("dataTrimmedForOptimalPerformance")}
            </div>
          )}
          <div className="kepler-container-plane-right-chart">
            {showConfirmationPopup.state && (
              <FilterConfirmationPopup
                setPopupResult={setPopupResult}
                filters={showConfirmationPopup.filters}
              />
            )}

            <ChartComponent
              query={queryMemo}
              loading={data.loading}
              error={data.error}
              chartData={data.payload}
              customization={customize}
              customizeForm={customizeForm}
              queryForm={dataForm}
              editMode={true}
              onClickChart={(filters: any) => {
                if (!filters || filters.length == 0) {
                  return;
                }
                if (filters.filter((f: any) => f.parameterFilter).length > 0) {
                  console.log("filters value", filters);
                  setPopupResult({ value: "keep", filters: filters });
                } else {
                  setShowConfirmationPopup({ state: true, filters: filters });
                }
              }}
            />
          </div>
        </Tabs.TabPane>
        {
          <Tabs.TabPane
            tab={
              <>
                <Text style={{ fontSize: "12px" }}>
                  {getLanguageLabel("data")}
                </Text>
              </>
            }
            key="2"
            style={{ height: "100%" }}
            disabled={!chartConfig[queryMemo?.chartType]?.meta.showData}
          >
            <KeplerChartDataTable
              setChartTableData={setChartTableData}
              data={data}
            />
          </Tabs.TabPane>
        }
      </Tabs>
      <Drawer
        title={getLanguageLabel("columns")}
        placement="right"
        onClose={() => setShowDatasetDetailsPanel(!showDatasetDetailsPanel)}
        open={showDatasetDetailsPanel}
        getContainer={false}
        styles={{
          mask: {
            backgroundColor: "rgba(248, 250, 251, 0.7)",
          },
        }}
      >
        <ChartDatasetDetails datasetId={chart?.datasetId} />
      </Drawer>

      {/* F2 — Augmented Analytics Drawer */}
      {chart?.datasetId && (
        <AugmentedAnalyticsDrawer
          datasetId={chart.datasetId}
          branch={query?.branch ?? "master"}
          availableColumns={[
            ...(query?.xaxis ? [query.xaxis] : []),
            ...(query?.series?.map((s: any) => s.columnName).filter(Boolean) ?? []),
            ...(query?.dimensions ?? []),
          ].filter((v, i, a) => v && a.indexOf(v) === i)}
          defaultColumnX={query?.xaxis}
          defaultColumnY={query?.series?.[0]?.columnName}
          open={showAiDrawer}
          onClose={() => setShowAiDrawer(false)}
          onAnomaliesDetected={(count) => setAnomalyCount(count)}
        />
      )}
    </div>
  );
};

export default ChartComponentContainer;
