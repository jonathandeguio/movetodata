import { WarningState } from "assets/Illustrations/EmptyState";
import NoData from "components/CommonUI/NoData";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  decodeFromBase64,
  getLanguageLabel,
  getUserLanguage,
} from "utils/utilities";
import store from "../../../redux/store";
import { getChartDataAPI } from "../dashboard/Dashboard.api";
import {
  CHART_ERROR_ELEMENT_HEAD,
  CHART_ERROR_ELEMENT_SUBHEAD,
} from "../dashboard/Dashboard.contants";
import { chartSetStateType } from "../dashboard/DashboardElements/ChartElement";
import ParentChartComponent from "./ChartComponent/ParentChartComponent";

interface TProps {
  chartId: string;
}

const EmbeddedChart = ({ chartId }: TProps) => {
  const [chartData, setChartData] = useState<chartSetStateType>();
  const [chartDataLoading, setChartDataLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const getChartData = async () => {
    setChartDataLoading(true);
    let filters = [];
    if (searchParams.get("filter")) {
      filters = JSON.parse(
        decodeFromBase64(searchParams.get("filter") as string)
      );
    }
    const state = store.getState();

    const payload = {
      chartIds: [chartId],
      fetchCachedData: true,
      saveInCache: false,
      filters: filters,
      userLocale: getUserLanguage(state.userDetails?.user),
    };

    getChartDataAPI(payload)
      .then(
        (chartData) => {
          // chartData.map((chart: any) => {
          //   // Improve this
          //   const data = chart.chartState;
          //   if (data?.chartConfig.hasOwnProperty("sortBy")) {
          //     data.chartConfig["sort"] = data?.chartConfig.sortBy;
          //     delete data.chartConfig.sortBy;
          //   }
          //   if (data?.chartConfig.hasOwnProperty("metric")) {
          //     data?.chartConfig.metric.map((val: any) => {
          //       val["column"] = val.columnName;
          //       delete val.columnName;
          //     });
          //   }
          //   if (data?.chartConfig.hasOwnProperty("sortBy")) {
          //     data?.chartConfig.sortBy.map((val: any) => {
          //       val["column"] = val.columnName;
          //       delete val.columnName;
          //     });
          //   }
          //   // if (data?.chartConfig.hasOwnProperty("filter")) {
          //   //   data?.chartConfig.filter.map((val: any) => {
          //   //     val["column"] = val.columnName;
          //   //     delete val.columnName;
          //   //   });
          //   // }
          //   if (data?.chartConfig.hasOwnProperty("dimension")) {
          //     const new_dimension_arr: Array<any> = [];
          //     data?.chartConfig.dimension.map((val: any) => {
          //       const new_dimension_obj = { column: val };
          //       new_dimension_arr.push(new_dimension_obj);
          //     });
          //     data.chartConfig.dimension = new_dimension_arr;
          //   }

          //   if (data?.chartConfig.hasOwnProperty("time")) {
          //     const new_time_arr: Array<any> = [];
          //     const timeObj = data?.chartConfig.time;

          //     if (timeObj?.timeColumn != null) {
          //       const new_time_obj = { column: timeObj.timeColumn.toString() };
          //       new_time_arr.push(new_time_obj);
          //       data.chartConfig.time = new_time_arr;
          //     } else {
          //       data.chartConfig.time = [];
          //     }
          //   }
          // });

          let singleChartData = chartData[0];
          // singleChartData = {
          //   ...singleChartData,
          //   chartState: {
          //     ...singleChartData.chartState,
          //     chartCustomize: {
          //       ...singleChartData.chartState.chartCustomize,
          //       seriesCustomize:
          //         singleChartData.chartState.chartCustomize.seriesCustomize,
          //       colorScheme:
          //         singleChartData.chartState.chartCustomize.colorScheme,
          //     },
          //   },
          // };

          setChartData(singleChartData);
        },
        (error) => {
          setChartData("ERROR");
        }
      )
      .finally(() => {
        setChartDataLoading(false);
      });
  };

  useEffect(() => {
    getChartData();
  }, []);

  if (!chartData || chartDataLoading) {
    return <MtdLoader content={getLanguageLabel("loading...")} />;
  }

  if (chartData === "ERROR") {
    return (
      <NoData
        heading={CHART_ERROR_ELEMENT_HEAD}
        subHeading={CHART_ERROR_ELEMENT_SUBHEAD}
        icon={<WarningState />}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          flex: 1,
        }}
      >
        <ParentChartComponent
          chartData={chartData.chartData}
          query={chartData.chartState.chartConfig}
          customization={chartData.chartState.chartCustomize}
          onClickChart={(filters: any) => {}}
          editMode={false}
        />
      </div>
    </div>
  );
};

export default EmbeddedChart;
