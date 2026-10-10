import { ChartReload } from "Apps/Kepler/chart/charts.utils";
import { TooltipInfo } from "Apps/Kepler/kepler";
import FilterConfirmationPopup, {
  TFilterAddOperator,
  TPopupResultObj,
} from "components/Filters/FilterConfirmationPopup";
import MtdLoader from "components/mtdLoader";
import useEffectOnlyOnDependencyUpdate from "hooks/useEffectOnlyOnDependencyUpdate";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel, getUserLanguage, isDefined } from "utils/utilities";
import { addFiltersFromDataset } from "../../../../redux/actions/filtersAction";
import store from "../../../../redux/store";
import ChartComponent from "../../chart/ChartComponent/ParentChartComponent";
import { ITabConfig } from "../Dashboard";
import { getChartDataAPI } from "../Dashboard.api";
import ChartElementHeader from "./ChartElementHeader";
import styles from "./DashboardElements.module.scss";

interface Props {
  chartId: any;
  fetchCachedData: boolean;
  editable: boolean;
  layout: any;
  removeElement: any;
  fullScreenRef: any;
  datasetId: any;
  showChartMenuOptions: boolean;
  dashboardId: string;
  tabId: string;
  element: any;
  chartReload?: ChartReload;
  setTooltipInfo?: React.Dispatch<
    React.SetStateAction<TooltipInfo | undefined>
  >;
  tooltipInfo?: TooltipInfo;
}

type chartDataType = {
  error: any;
  chartState: any;
  chartData: any;
};

export type chartSetStateType = undefined | "ERROR" | chartDataType;

export const ChartElement: React.FC<Props> = (props) => {
  const dispatch = useDispatch();
  const { reloadDashboardElement } = useSelector(
    (state: RootState) => state.dashboardEdit
  );
  const [chartData, setChartData] = useState<chartSetStateType>();

  const [chartDataLoading, setChartDataLoading] = useState<boolean>(false);
  const [reloadChart, setReloadChart] = useState(1);
  const [fromCache, setFromCache] = useState(props.fetchCachedData);
  const gridConfig: ITabConfig = useSelector(
    (state: RootState) => state.dashboardEdit.gridConfig
  );
  const [showConfirmationPopup, setShowConfirmationPopup] = useState<any>({
    state: false,
    filters: undefined,
  });
  const [popupResult, setPopupResult] = useState<TPopupResultObj>({
    value: "cancel",
    filters: [],
  });

  const filtersDash = useSelector(
    (state) => (state as $TSFixMe).filters[props.tabId]
  );
  const [filtersData, setFiltersData] = useState<any>([]);

  useEffect(() => {
    if (filtersDash) {
      if (filtersDash.filters) {
        setFiltersData(filtersDash.filters);
      } else if (filtersDash.filter) {
        // Don't do any thing here, thats the latest filter coming after onCLick
      }
    } else {
      setFiltersData([]);
    }
  }, [filtersDash]);

  const getChartData = async () => {
    setChartDataLoading(true);

    const state = store.getState();

    const payload = {
      chartIds: [props.chartId],
      fetchCachedData: fromCache,
      saveInCache: false,
      filters: filtersData,

      userLocale: getUserLanguage(state.userDetails?.user),
    };

    getChartDataAPI(payload)
      .then(
        (chartData) => {
          let singleChartData = chartData[0];
          setChartData(singleChartData);
        },
        (error) => {
          setChartData("ERROR");
        }
      )
      .catch((err) => {
        setChartData("ERROR");
      })
      .finally(() => {
        if (!fromCache) {
          setFromCache(true);
        }
        setChartDataLoading(false);
      });
  };

  const handleAddFilterCase = (operator: TFilterAddOperator) => {
    const filters = popupResult.filters;
    const _currentFilters: any = [];
    filters.map((filter: any, _index: number) => {
      if (filter.checked == false) {
        return;
      }
      const columnName = filter.columnName;
      const columnType = "string";
      const filterValue = filter.FilterValue;
      const datasetId = (chartData as any).chartState.datasetId;

      if (columnName && columnType && filterValue)
        _currentFilters.push({
          field: {
            name: columnName,
            type: columnType,
            value: columnName,
            datasetId: datasetId,
          },
          conditionCase: [
            {
              key: `${"condition"}_${new Date().getTime() - _index - 1}`,
              operator: operator,
              value: filterValue,
            },
          ],
          key: `${"filter"}_${new Date().getTime() - _index - 1}`,
          logicalOperator: "AND",
        });
    });
    dispatch(addFiltersFromDataset(_currentFilters, props.tabId) as any);
  };

  useEffectOnlyOnDependencyUpdate(() => {
    if (chartData && chartData != "ERROR") {
      getChartData();
    } else if (!chartData || chartData == "ERROR") {
      getChartData();
    } else {
    }
  }, [reloadChart, filtersData]);

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

  useEffect(() => {}, [props.fullScreenRef]);

  useEffectOnlyOnDependencyUpdate(() => {
    const chartReloadThroughSockets = props.chartReload;

    if (
      isDefined(chartReloadThroughSockets) &&
      chartReloadThroughSockets?.chartId != "" &&
      chartReloadThroughSockets?.chartId == props.chartId
    )
      getChartData();
  }, [props.chartReload]);

  useEffectOnlyOnDependencyUpdate(() => {
    getChartData();
  }, [reloadDashboardElement]);

  if (!chartData || chartDataLoading) {
    return <MtdLoader content={getLanguageLabel("loading...")} />;
  }
  if (chartData === "ERROR" || isDefined(chartData?.error)) {
    throw "ERROR in chart";
  }

  return (
    <div id="chartelement" className={styles.chart_element}>
      {showConfirmationPopup.state && (
        <FilterConfirmationPopup
          setPopupResult={setPopupResult}
          filters={showConfirmationPopup.filters}
        />
      )}
      <ChartElementHeader
        showChartMenuOptions={props.showChartMenuOptions}
        editable={props.editable}
        layout={props.layout}
        chartData={chartData}
        setChartData={setChartData}
        reloadChart={reloadChart}
        setReloadChart={setReloadChart}
        fullScreenRef={props.fullScreenRef}
        removeElement={props.removeElement}
      />

      <div
        key={`${props.layout.i + 10}`}
        className={
          styles.chart_element__body +
          " " +
          (props.editable ? " editableElementBorder" : "")
        }
        style={{
          background: gridConfig.chartBodyBg
            ? gridConfig.chartBodyBg
            : "var(--background_primary)",
          cursor: props.editable ? "move" : "pointer",
        }}
      >
        <ChartComponent
          chartData={chartData.chartData}
          query={chartData.chartState.chartConfig}
          customization={chartData.chartState.chartCustomize}
          editMode={!props.editable}
          onClickChart={(filters: any) => {
            if (!filters || filters.length == 0) {
              return;
            }
            if (filters.filter((f: any) => f.parameterFilter).length > 0) {
              setPopupResult({ value: "keep", filters: filters });
            } else {
              setShowConfirmationPopup({ state: true, filters: filters });
            }
          }}
          tooltipInfo={props.tooltipInfo}
          setTooltip={props.setTooltipInfo}
        />
      </div>
    </div>
  );
};

export default ChartElement;
