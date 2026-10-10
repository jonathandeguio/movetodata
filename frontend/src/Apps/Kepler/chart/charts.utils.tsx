import axios from "axios";
import React from "react";
import {
  ObjectKeys,
  generateUUID,
  getCurrentDateTime,
  getLanguageLabel,
  getUserLanguage,
  isDefined,
  isEmpty,
  openNotification,
} from "utils/utilities";
import {
  fetchDataError,
  fetchDataRequest,
  fetchDataSuccess,
  silentUpdateQuery,
  updateChart,
} from "../../../redux/actions/keplerActions";
import { createNewChart, getChartData } from "./charts.api";

import MtdTable from "Apps/Dataset/Table/MtdTable";
import { Files } from "Apps/Dataset/bottomBar/Files";
import Schema from "Apps/Dataset/bottomBar/Schema/Schema";
import { KeplerConfig } from "Apps/Kepler/chart/charts.config";
import { Typography } from "antd";
import {
  BooleanIcon,
  DatabaseViewIcon,
  NumberIcon,
  StringIcon,
  TreeIcon,
} from "assets/icons/mtdDataIcons";
import { DocsIcon } from "assets/icons/mtdFileIcons";
import { CalendarIcon } from "assets/icons/mtdInterfaceIcons";
import { HelpIcon } from "assets/icons/mtdMiscellaneousIcons";
import {
  SortAlphaHorizontalIcon,
  SortAscHorizontalIcon,
  SortDescHorizontalIcon,
  SortNumericAscHrizontalIcon,
  SortNumericDescHrizontalIcon,
  SortReverseAlphaHorizontalIcon,
} from "assets/icons/mtdSortIcons";
import { TableIcon } from "assets/icons/mtdTableIcons";
import { IMtdBottomBarItem } from "common/components/MtdLayout/type";
import DatasetSync from "components/bottomBar/sync/Sync.view";
import { ErrorResponse } from "global";
import { PRODUCT_ENUM } from "pages/Settings/PlatformConfig/License/License.utils";
import { RootState } from "redux/types/store";
import { NULL_UUID } from "utils/Common.constants";
import store from "../../../redux/store";
import { KeplerFilter } from "../kepler";
import { defaultSeriesCustomize } from "../utils/DefaultValues";
const { Text } = Typography;
const uuid = require("uuid");
export const getThreshold = (
  chartCustomization: any,
  value: any,
  color: any
) => {
  let finalThreshold = {
    name: undefined,
    color: color,
  };
  if (
    isDefined(chartCustomization.chartThreshold) &&
    chartCustomization.chartThreshold.length > 0
  ) {
    const sortedThresholds = [...chartCustomization.chartThreshold].sort(
      (a, b) => (a.thresholdValue > b.thresholdValue ? 1 : -1)
    );

    sortedThresholds.forEach((threshold) => {
      const tVal = Number(value);

      if (tVal >= threshold.thresholdValue) {
        finalThreshold = threshold;
        return finalThreshold;
      }
    });
  }

  return finalThreshold;
};

export const getChartBottombarItems = (
  id: string,
  branch: string,
  isBuildDataset: boolean,
  transactionId: string
): IMtdBottomBarItem[] => {
  return [
    {
      id: "chartDatasetPanel",
      icon: <TableIcon />,
      label: getLanguageLabel("dataset"),
      body: MtdTable,
      type: "TAB",
      props: {
        id,
        branch,
        isTableFromBottomBar: true,
      },
    },
    {
      id: "chartFilePanel",
      icon: <DocsIcon />,
      label: getLanguageLabel("files"),
      body: Files,
      type: "TAB",
      props: {
        id,
        branch,
        transactionId,
      },
    },
    {
      id: "chartSyncPanel",
      icon: <DatabaseViewIcon />,
      label: getLanguageLabel("sync"),
      body: DatasetSync,
      type: "TAB",
      props: {
        datasetId: id,
        branch,
      },
    },
    {
      id: "chartSchemaPanel",
      icon: <TreeIcon />,
      label: getLanguageLabel("schema"),
      body: Schema,
      type: "TAB",
      props: { id, branch, isBuildDataset },
    },
  ];
};

export const syncCustomizeSeries = (querySeries: any, customizeSeries: any) => {
  const customizeSeriesObject: { [id: string]: any } = {};
  if (isDefined(customizeSeries)) {
    customizeSeries.forEach((cSeries: any) => {
      customizeSeriesObject[cSeries.id] = cSeries;
    });
  }

  const syncedCustomize = querySeries
    ? querySeries.map((qSeries: any) => {
        if (qSeries.id && customizeSeriesObject[qSeries.id] !== undefined) {
          return {
            ...defaultSeriesCustomize,
            ...customizeSeriesObject[qSeries.id],
            id: qSeries.id,
            seriesName: qSeries.seriesName,
            seriesType: qSeries.seriesType,
          };
        } else {
          return {
            ...defaultSeriesCustomize,
            id: qSeries.id,
            seriesName: qSeries.seriesName,
            seriesType: qSeries.seriesType,
          };
        }
      })
    : [];

  return syncedCustomize;
};

export const mapResponseToChartState = (data: any) => {
  if (data?.chartCustomize) {
    data.chartCustomize = JSON.parse(data?.chartCustomize);
  } else {
    data.chartCustomize = { seriesCustomize: [] };
  }

  let newData = {
    ...data,
    chartCustomize: {
      ...data.chartCustomize,
    },
  };

  return newData;
};

export const fetchChart = async (id: string, versionId?: number) => {
  if (id !== undefined || id !== null) {
    if (versionId !== undefined) {
      const { data } = await axios.get(
        `/kepler/charts/getById/${id}?v=${versionId}`
      );

      return mapResponseToChartState(data);
    } else {
      const { data } = await axios.get(`/kepler/charts/getById/${id}`);

      return mapResponseToChartState(data);
    }
  }
};

export const fetchChartData = async (
  fetchFromCache: boolean | undefined,
  chartUUID: any,
  query: any,
  dispatch: any,
  signal: any,
  transactionId: string
) => {
  let state: RootState = store.getState();

  const chartId = state.kepler.chart?.id;

  const lang = getUserLanguage(state.userDetails?.user);

  if (isDefined(query) && isDefined(chartId)) {
    const body: any = {
      ...query,
      transactionId: transactionId ?? NULL_UUID,
      chartUUID: chartId,
      userLocale: lang,
      fetchCachedData: fetchFromCache ?? state.kepler.isChartSaved,
      saveInCache: state.kepler.isChartSaved,
      mapSeries: undefined,
      // mapSeries: JSON.stringify(query.mapSeries),
    };

    dispatch(fetchDataRequest());

    // CHART DATA FETCHING (SINGLE POINT)
    await getChartData(body, signal)
      .then(async ({ data }) => {
        dispatch(fetchDataSuccess(data));
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          dispatch(fetchDataError(error));
        }
      });
  }
};

export const putChart = async ({
  chart,
  newQuery,
  newCustomize,
  currentTransaction,
  dispatch,
  getFileIndex,
}: {
  chart: any;
  newQuery: any;
  newCustomize: any;
  currentTransaction: string;
  dispatch: any;
  getFileIndex?: any;
}) => {
  const query = isDefined(newQuery) ? newQuery : chart?.chartConfig;
  const customize = { ...newCustomize, customTheme: undefined };

  let state: RootState = store.getState();

  try {
    const { data } = await axios.put(`/kepler/charts/update/${chart.id}`, {
      // SEND CHART IF AVAILABLE
      ...(isDefined(chart)
        ? { ...chart, chartCustomize: undefined, query: undefined }
        : {}),
      // SEND CUSTOMIZE IF AVAILABLE
      ...(isDefined(customize)
        ? {
            chartCustomize: customize,
          }
        : { chartCustomize: undefined }),
      // SEND QUERY IF AVAILABLE
      ...(isDefined(query)
        ? {
            chartConfig: {
              ...query,
              datasetId: chart.datasetId,
              branch: "master",
              mapSeries: null,
              transactionId: currentTransaction,
            },
          }
        : {
            chartConfig: undefined,
          }),
      // transactionId: currentTransaction,

      userLocale: getUserLanguage(state.userDetails?.user),
    });

    console.log("GET FILE INDEX");
    getFileIndex?.(chart.id, true);

    // const chartStateData = mapResponseToChartState(data);

    if (isDefined(dispatch)) {
      dispatch(
        silentUpdateQuery({
          chartUUID: data.id,
        })
      );
      dispatch(updateChart(mapResponseToChartState(data)));
      // dispatch(updateChart(chartStateData));
    }
  } catch (error) {
    if (isDefined(dispatch)) {
      dispatch(
        silentUpdateQuery({
          chartUUID: chart.id,
        })
      );
      console.error("Error while trying to save chart, try again");
    }
  }
};

export const duplicateChartHandler = (chart: any, query: any) => {
  const newIDsMap: { [key: string]: string } = {};
  let seriesList: any[] = [];

  if (query.hasOwnProperty("series")) {
    query.series
      .filter((series: any) => isDefined(series?.id))
      .forEach((series: any, index: number) => {
        (newIDsMap[series.id] = generateUUID()),
          seriesList.push({
            ...series,
            seriesId: null,
            id: newIDsMap[series.id],
          });
      });
  }

  let newColorScheme = { ...chart.chartCustomize?.colorScheme };
  ObjectKeys(chart.chartCustomize?.colorScheme).forEach(
    (colorSeries: string) => {
      newColorScheme[newIDsMap[colorSeries]] =
        chart.chartCustomize?.colorScheme[colorSeries];
    }
  );

  const newSeriesCustomize = chart.chartCustomize?.seriesCustomize?.map(
    (seriesCustomize: any) => ({
      ...seriesCustomize,
      id: newIDsMap[seriesCustomize.id],
    })
  );

  const newChartPayload = {
    ...chart,
    id: undefined,
    name: `${chart.name} - ` + getCurrentDateTime("second"),
    chartCustomize: {
      ...chart.chartCustomize,
      id: undefined,
      colorScheme: newColorScheme,
      seriesCustomize: newSeriesCustomize,
    },
    chartConfig: {
      ...query,
      id: undefined,
      series: seriesList,
    },
  };

  createNewChart(newChartPayload)
    .then(({ data }) => {
      if (!isEmpty(data) && isDefined((data as any).id)) {
        window.open(`/portal/kepler/CHART/${(data as any).id}`, "_blank");
      } else {
        openNotification(
          "Something went wrong. Please try again!",
          " ",
          "error"
        );
      }
    })
    .catch((err) => {
      if (axios.isAxiosError(err) && isDefined(err.response)) {
        const data = err?.response?.data as ErrorResponse;
        const error = data.error;
        const description = data.description;

        openNotification(error, description, "error");
      }
    });
};

export const getAggregateOptionsValuesList = (
  columnType: string | undefined,
  chartType: string | undefined
) => {
  return getAggregateOptions(columnType, chartType).map(
    (option) => option.value
  );
};

export const getAggregateOptions = (
  columnType: string | undefined,
  chartType: string | undefined
) => {
  let options = [
    {
      value: "count",
      title: getLanguageLabel("count"),
      label: (
        <>
          <div style={{ marginRight: "5px" }}>
            {getLanguageLabel("count")} <br />
          </div>
          <Text type="secondary">{getLanguageLabel("totalRowCount")}</Text>
        </>
      ),
    },
    // {
    //   value: "skewness",
    //   title: "Skewness",
    //   label: (
    //     <>
    //       <div style={{ marginRight: "5px" }}>
    //         Skewness <br />
    //       </div>
    //       <Text type="secondary">The total count of the rows</Text>
    //     </>
    //   ),
    // },
    {
      value: "approx_count_distinct",
      title: getLanguageLabel("countDistinct"),

      label: (
        <>
          <div style={{ marginRight: "5px" }}>
            {getLanguageLabel("countDistinct")} <br />
          </div>
          <Text type="secondary">{getLanguageLabel("distinctValueCount")}</Text>
        </>
      ),
    },
  ];
  if (isDefined(columnType) && isNumericDataType(columnType)) {
    options = [
      ...options,
      {
        value: "avg",
        title: getLanguageLabel("avg"),
        label: (
          <>
            <div style={{ marginRight: "5px" }}>
              {getLanguageLabel("avg")} <br />
            </div>
            <Text type="secondary">{getLanguageLabel("meanOfAllValues")}</Text>
          </>
        ),
      },
      {
        value: "sum",
        title: getLanguageLabel("sum"),
        label: (
          <>
            <div style={{ marginRight: "5px" }}>
              {getLanguageLabel("sum")} <br />
            </div>
            <Text type="secondary">{getLanguageLabel("sumOfAllValues")}</Text>
          </>
        ),
      },
      {
        value: "min",
        title: getLanguageLabel("min"),
        label: (
          <>
            <div style={{ marginRight: "5px" }}>
              {getLanguageLabel("min")} <br />
            </div>
            <Text type="secondary">{getLanguageLabel("minValue")}</Text>
          </>
        ),
      },
      {
        value: "max",
        title: getLanguageLabel("max"),
        label: (
          <>
            <div style={{ marginRight: "5px" }}>
              {getLanguageLabel("max")} <br />
            </div>
            <Text type="secondary">{getLanguageLabel("maximumValue")}</Text>
          </>
        ),
      },
      // {
      //   value: "median",
      //   title: getLanguageLabel("median"),
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         {getLanguageLabel("median")} <br />
      //       </div>
      //       <Text type="secondary">{getLanguageLabel("medianValue")}</Text>
      //     </>
      //   ),
      // },

      {
        value: "variance",
        title: "Variance",
        label: (
          <>
            <div style={{ marginRight: "5px" }}>
              Variance <br />
            </div>
            <Text type="secondary">{getLanguageLabel("sampleVariance")}</Text>
          </>
        ),
      },
      // {
      //   value: "var_pop",
      //   title: "Variance Population",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Variance Population <br />
      //       </div>
      //       <Text type="secondary">
      //         {getLanguageLabel("populationVariance")}
      //       </Text>
      //     </>
      //   ),
      // },
      // {
      //   value: "var_samp",
      //   title: "Variance",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Variance Sample <br />
      //       </div>
      //       <Text type="secondary">{getLanguageLabel("sampleVariance")}</Text>
      //     </>
      //   ),
      // },
      {
        value: "stddev",
        title: getLanguageLabel("standardDeviation"),
        label: (
          <>
            <div style={{ marginRight: "5px" }}>
              {getLanguageLabel("standardDeviation")} <br />
            </div>
            <Text type="secondary">
              {getLanguageLabel("dispersionRelativeToMean")}
            </Text>
          </>
        ),
      },
      // {
      //   value: "stddev_samp",
      //   title: "Standard Deviation Sample",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Standard Deviation Sample
      //         <br />
      //       </div>
      //       <Text type="secondary">
      //         Computes the cumulative sample standard deviation and returns the
      //         square root of the sample variance.
      //       </Text>
      //     </>
      //   ),
      // },
      // {
      //   value: "stddev_pop",
      //   title: "Standard Deviation Population",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Standard Deviation Population <br />
      //       </div>
      //       <Text type="secondary">
      //         Computes the population standard deviation and returns the square
      //         root of the population variance.
      //       </Text>
      //     </>
      //   ),
      // },
      // {
      //   value: "mean",
      //   title: getLanguageLabel("mean"),
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         mean <br />
      //       </div>
      //       <Text type="secondary">{getLanguageLabel("meanOfAllValues")}</Text>
      //     </>
      //   ),
      // },
      // {
      //   value: "sqrt",
      //   title: "Square root",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Square Root <br />
      //       </div>
      //       <Text type="secondary">Square root</Text>
      //     </>
      //   ),
      // },
      // {
      //   value: "ceil",
      //   title: "Ceil",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Ceil
      //         <br />
      //       </div>
      //       <Text type="secondary">Ceil</Text>
      //     </>
      //   ),
      // },
      // {
      //   value: "floor",
      //   title: "Floor",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Floor <br />
      //       </div>
      //       <Text type="secondary">Floor</Text>
      //     </>
      //   ),
      // },
      // {
      //   value: "log",
      //   title: "Log",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Log
      //         <br />
      //       </div>
      //       <Text type="secondary">log</Text>
      //     </>
      //   ),
      // },
      // {
      //   value: "log10",
      //   title: "Log base 10",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Log base 10 <br />
      //       </div>
      //       <Text type="secondary">log base 10</Text>
      //     </>
      //   ),
      // },
      // {
      //   value: "log2",
      //   title: "Log base 2",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Log base 2 <br />
      //       </div>
      //       <Text type="secondary">Log base 2</Text>
      //     </>
      //   ),
      // },
      // {
      //   value: "sum_distinct",
      //   title: "Sum Distinct",
      //   label: (
      //     <>
      //       <div style={{ marginRight: "5px" }}>
      //         Sum distinct <br />
      //       </div>
      //       <Text type="secondary">Sum of distinct values</Text>
      //     </>
      //   ),
      // },
    ];
  }

  if (chartType === "table") {
    options = [
      {
        value: "none",
        title: getLanguageLabel("none"),
        label: <>{getLanguageLabel("none")}</>,
      },
      ...options,
    ];
  }
  return options;
};

export const getFilterOperatorOptions = (columnType: string) => {
  const defaultOperators = [
    {
      value: "equal",
      label: getLanguageLabel("equal"),
    },
    {
      value: "notEqual",
      label: getLanguageLabel("notEqual"),
    },
    {
      value: "exists",
      label: getLanguageLabel("exists"),
    },
    {
      value: "does not exists",
      label: getLanguageLabel("doesNotExist"),
    },
  ];
  const numericOperators = [
    {
      value: "lessThan",
      label: getLanguageLabel("lessThan"),
    },
    {
      value: "lessThanEqual",
      label: getLanguageLabel("lessThanEqual"),
    },
    {
      value: "greaterThan",
      label: getLanguageLabel("greaterThan"),
    },
    {
      value: "greaterThanEqual",
      label: getLanguageLabel("greaterThanEqual"),
    },
  ];
  const categoricalOptions = [
    {
      value: "like",
      label: getLanguageLabel("like"),
    },
    {
      value: "in",
      label: getLanguageLabel("in"),
    },
  ];
  console.log("columnType", columnType);
  return KeplerConfig.nonStringDatatypes.includes(columnType)
    ? [...defaultOperators, ...numericOperators]
    : [...defaultOperators, ...categoricalOptions];
};

export const SortingIconAscending = ({ type }: { type: string }) => {
  if (isNumericDataType(type)) {
    return <SortNumericAscHrizontalIcon />;
  } else if (KeplerConfig.categoricalDataTypes.includes(type)) {
    return <SortAlphaHorizontalIcon />;
  } else {
    return <SortAscHorizontalIcon />;
  }
};

export const SortingIconDescending = ({ type }: { type: string }) => {
  if (isNumericDataType(type)) {
    return <SortNumericDescHrizontalIcon />;
  } else if (KeplerConfig.categoricalDataTypes.includes(type)) {
    return <SortReverseAlphaHorizontalIcon />;
  } else {
    return <SortDescHorizontalIcon />;
  }
};

export const getTimeGrainOptions = () => {
  return [
    {
      value: "year",
      label: (
        <div className="timeGrainOption">
          <span className="data-type-label">{getLanguageLabel("year")}</span>
          <span style={{ marginLeft: "1rem" }}>
            {getCurrentDateTime("year")}
          </span>
        </div>
      ),
    },
    {
      value: "quarter",
      label: (
        <div className="timeGrainOption">
          <span className="data-type-label">{getLanguageLabel("quarter")}</span>
          <span style={{ marginLeft: "1rem" }}>
            {getCurrentDateTime("quarter")}
          </span>
        </div>
      ),
    },
    {
      value: "month",
      label: (
        <div className="timeGrainOption">
          <span className="data-type-label">{getLanguageLabel("month")}</span>
          <span style={{ marginLeft: "1rem" }}>
            {getCurrentDateTime("month")}
          </span>
        </div>
      ),
    },
    {
      value: "week",
      label: (
        <div className="timeGrainOption">
          <span className="data-type-label">{getLanguageLabel("week")}</span>
          <span style={{ marginLeft: "1rem" }}>
            {getCurrentDateTime("week")}
          </span>
        </div>
      ),
    },
    {
      value: "day",
      label: (
        <div className="timeGrainOption">
          <span className="data-type-label">{getLanguageLabel("day")}</span>
          <span style={{ marginLeft: "1rem" }}>
            {getCurrentDateTime("day")}
          </span>
        </div>
      ),
    },
    {
      value: "date",
      label: (
        <div className="timeGrainOption">
          <span className="data-type-label">{getLanguageLabel("date")}</span>
          <span style={{ marginLeft: "1rem" }}>
            {getCurrentDateTime("date")}
          </span>
        </div>
      ),
    },
    {
      value: "hour",
      label: (
        <div className="timeGrainOption">
          <span className="data-type-label">{getLanguageLabel("hour")}</span>
          <span style={{ marginLeft: "1rem" }}>
            {getCurrentDateTime("hour")}
          </span>
        </div>
      ),
    },
    {
      value: "minute",
      label: (
        <div className="timeGrainOption">
          <span className="data-type-label">{getLanguageLabel("minute")}</span>
          <span style={{ marginLeft: "1rem" }}>
            {getCurrentDateTime("minute")}
          </span>
        </div>
      ),
    },
    {
      value: "second",
      label: (
        <div className="timeGrainOption">
          <span className="data-type-label">{getLanguageLabel("second")}</span>
          <span style={{ marginLeft: "1rem" }}>
            {getCurrentDateTime("second")}
          </span>
        </div>
      ),
    },
  ];
};

export const IconForColumnType = ({
  type,
  style,
}: {
  type: string;
  style?: any;
}) => {
  if (type == "string") {
    return <StringIcon />;
  } else if (
    type == "integer" ||
    type == "double" ||
    type == "decimal(10,2)" ||
    type == "long"
  ) {
    return <NumberIcon />;
  } else if (type == "date" || type == "timestamp") {
    return <CalendarIcon />;
  } else if (type == "boolean") {
    return <BooleanIcon />;
  } else {
    // return <QuestionOutlined style={style} />;
    return <HelpIcon />;
  }
};

export const isNumericDataType = (dType: string) => {
  dType = dType.toUpperCase();

  for (let type in KeplerConfig.numericDataTypes) {
    if (
      KeplerConfig.numericDataTypes[type].includes(dType) ||
      dType.includes(KeplerConfig.numericDataTypes[type])
    ) {
      return true;
    }
  }
  return false;
};

export const generateFilterOnLegendSelect = (
  params: any,
  query: any,
  seriesByName: any
): KeplerFilter[] => {
  if (["bigNumber"].includes(query.chartType)) return [];

  const columns: string[] = [];
  let filterArray: KeplerFilter[] = [];

  let value: string = "";
  let operator: string = "equal";

  if (query.chartType === "wordCloudChart") {
    if (isDefined(query?.series?.[0]?.groupBy?.[0])) {
      return [
        {
          columnName: query?.series?.[0]?.groupBy?.[0],
          FilterValue: params.name,
          operator: "equal",
          checked: true,
        },
      ];
    }
    return [];
  }

  if (
    query.chartType === "sunBurstChart" ||
    query.chartType === "treeMapChart"
  ) {
    return [
      {
        columnName: params.data.dimension,
        FilterValue: params.data.name,
        operator: "equal",
        checked: true,
      },
    ];
  }

  if (params.type === "legendselectchanged") {
    value = params.name;
    operator = "notEqual";
  }

  if (params.type === "click") {
    if (query.chartType === "pieChart") {
      value = params.name;
    } else {
      value = params.seriesName;
      filterArray = [
        {
          columnName: query.xaxis,
          operator: operator,
          FilterValue: params.name,
          checked: true,
        },
        ...filterArray,
      ];
    }
  }

  if (value !== "") {
    const groupBy = seriesByName[value];
    const seriesName = value.split(",").map((series: string) => series.trim());

    groupBy.forEach((group: any) => {
      group.forEach((gpName: any, index: number) => {
        if (columns.includes(gpName)) return;

        columns.push(gpName);
        filterArray.push({
          columnName: gpName,
          operator: operator,
          FilterValue: seriesName[index],
          checked: true,
        });
      });
    });
  }

  /*
    At max 2 filters can be there, and sometimes they both can have same column and its value.
    Hence removing one
  */

  if (
    filterArray.length == 2 &&
    filterArray[0].FilterValue == filterArray[1].FilterValue &&
    filterArray[0].columnName == filterArray[1].columnName
  ) {
    filterArray = [filterArray[0]];
  }

  return filterArray;
};

export const generateSeriesByName = (chartData: any) => {
  let seriesNameMap: { [key: string]: any } = {};
  if (
    chartData?.request?.chartType == "horizontalBarChart" ||
    chartData?.request?.chartType == "VerticalAxisChart"
  ) {
    if (Array.isArray(chartData?.data?.series)) {
      chartData?.data.series?.forEach((series: any) => {
        Object.keys(series.seriesData).map((name: string) => {
          seriesNameMap[name] = [
            ...(seriesNameMap[name] ?? []),
            series.groupBy,
          ];
        });
      });
    }
  } else if (chartData?.request?.chartType === "pieChart") {
    if (chartData?.request?.series?.[0]?.groupBy) {
      Object.keys(chartData.data).map((name: string) => {
        seriesNameMap[name] = [chartData.request.series?.[0]?.groupBy];
      });
    }
  }

  // else if(isDefined(chartData?.series)) {
  //   Object.keys(chartData?.series)?.forEach((seriesName: any) => {
  //     seriesNameMap[seriesName] = [...(seriesNameMap[seriesName] ?? []), series.groupBy];
  //   });
  // }

  return seriesNameMap;
};

export const labelMap: any = {
  equal: "=",
  notEqual: "!=",
  lessThan: "<",
  lessThanEqual: "<=",
  greaterThan: ">",
  greaterThanEqual: ">=",
  like: "LIKE",
  in: "in",
  exists: "exists",
  doesNotExist: "does not exist",
};

export interface ChartReload {
  chartId: string;
  reloadId: string;
}

export const KEPLER_USE_CASES = [
  PRODUCT_ENUM.DATA_PLATFORM,
  PRODUCT_ENUM.DATA_VIZ,
];

export const getItemStyle = (
  chartCustomization: any,
  name: any,
  value: any,
  chartType: string
) => {
  if (Array.isArray(chartCustomization.chartThreshold)) {
    for (const threshold of chartCustomization.chartThreshold) {
      if (chartCustomization.thresholdOperator === "gte") {
        const color =
          value >= threshold.thresholdValue
            ? threshold.color
            : chartCustomization?.colorScheme[chartType]?.[name];
        return {
          color: color,
        };
      } else if (chartCustomization.thresholdOperator === "lte") {
        const color =
          value <= threshold.thresholdValue
            ? threshold.color
            : chartCustomization?.colorScheme[chartType]?.[name];
        return {
          color: color,
        };
      }
    }
  }

  return {
    color: chartCustomization?.colorScheme[chartType]?.[name],
  };
};

export const sunBurstChartArrPrepare = (obj: any[], nameArr: string[]) => {
  for (let i = 0; i < obj.length; i += 1) {
    nameArr.push(obj[i].name);
    // sunBurstChartArrPrepare(obj[i].children, nameArr, depth + 1);
  }
};
