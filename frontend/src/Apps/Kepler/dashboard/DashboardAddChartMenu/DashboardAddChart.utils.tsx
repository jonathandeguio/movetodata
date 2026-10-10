import {
  ChartIcon,
  GaugeIcon,
  GraphIcon,
  GroupedColumnIcon,
  HeatMapIcon,
  LineChartIcon,
  MapIcon,
  PieChartIcon,
  RadarIcon,
  ScatterIcon,
  SmallAreaChartIcon,
  SunburstIcon,
  TreeMapIcon,
} from "assets/icons/mtdChartIcons";
import { BigNumberIcon } from "assets/icons/mtdDataIcons";
import { TableCellIcon } from "assets/icons/mtdTableIcons";
import React from "react";

export type chartType = {
  id: string;
  name: string;
  description: string;
  parent: string;
  datasetId: string;
  branch: string;
  chartConfig: {
    datasetId: string;
    chartType: string;
  };
  createdAt: number;
  updatedAt: number | null;
  createdBy: string;
  updatedBy: string | null;
};

export const getChartIcon = (
  chartType: string,
  series: any,
  defaultSize: number = 30
) => {
  if (chartType == "pieChart") {
    return <PieChartIcon size={defaultSize} />;
  } else if (chartType == "bigNumber") {
    return <BigNumberIcon size={defaultSize} />;
  } else if (chartType == "table") {
    return <TableCellIcon size={defaultSize} />;
  } else if (chartType == "VerticalAxisChart") {
    if (series && series.length == 1) {
      const subChartType = series[0].seriesType;
      if (subChartType == "barChart")
        return <GroupedColumnIcon size={defaultSize} />;
      else if (subChartType == "lineChart")
        return <LineChartIcon size={defaultSize} />;
      else if (subChartType == "lineAreaChart")
        return <SmallAreaChartIcon size={defaultSize} />;
      else if (subChartType == "scatterChart")
        return <ScatterIcon size={defaultSize} />;
      return <ChartIcon size={defaultSize} />;
    }
    return <ChartIcon size={defaultSize} />;
  } else if (chartType == "mapChart") {
    return <MapIcon size={defaultSize} />;
  } else if (chartType == "gaugeChart") {
    return <GaugeIcon size={defaultSize} />;
  } else if (chartType == "radarChart") {
    return <RadarIcon size={defaultSize} />;
  } else if (chartType == "sunBurstChart") {
    return <SunburstIcon size={defaultSize} />;
  } else if (chartType == "funnelChart") {
    return <ChartIcon size={defaultSize} />;
  } else if (chartType == "heatmapChart") {
    return <HeatMapIcon size={defaultSize} />;
  } else if (chartType == "sankeyChart") {
    return <GraphIcon size={defaultSize} />;
  } else if (chartType == "treeChart") {
    return <TreeMapIcon size={defaultSize} />;
  } else if (chartType == "graphChart") {
    return <GraphIcon size={defaultSize} />;
  } else if (chartType == "boxplotChart") {
    return <ChartIcon size={defaultSize} />;
  } else if (chartType == "candlestickChart") {
    return <ChartIcon size={defaultSize} />;
  } else if (chartType == "parallelChart") {
    return <ChartIcon size={defaultSize} />;
  } else if (chartType == "themeRiverChart") {
    return <SmallAreaChartIcon size={defaultSize} />;
  } else if (chartType == "pictorialBarChart") {
    return <GroupedColumnIcon size={defaultSize} />;
  } else if (chartType == "chordChart") {
    return <ChartIcon size={defaultSize} />;
  } else return <GroupedColumnIcon size={defaultSize} />;
};

export const sortCharts = (
  filteredChartsLocal: any,
  beforeState: string,
  afterState: string
) => {
  const charts = [...filteredChartsLocal];
  charts.sort((a: chartType, b: chartType) => {
    if (afterState == "name") {
      const first = a.name.toLowerCase();
      const second = b.name.toLowerCase();
      if (beforeState == "DSC") {
        if (first > second) {
          return -1;
        } else if (first < second) {
          return 1;
        }
      } else {
        if (first < second) {
          return -1;
        } else if (first > second) {
          return 1;
        }
      }
    } else if (afterState == "chartType") {
      const first = a.id.toLowerCase();
      const second = b.id.toLowerCase();
      if (beforeState == "DSC") {
        if (first > second) {
          return -1;
        } else if (first < second) {
          return 1;
        }
      } else {
        if (first < second) {
          return -1;
        } else if (first > second) {
          return 1;
        }
      }
    } else if (afterState == "datasetId") {
      const first = a.chartConfig.datasetId.toLowerCase();
      const second = b.chartConfig.datasetId.toLowerCase();
      if (beforeState == "DSC") {
        if (first > second) {
          return -1;
        } else if (first < second) {
          return 1;
        }
      } else {
        if (first < second) {
          return -1;
        } else if (first > second) {
          return 1;
        }
      }
    } else if (afterState == "createdAt") {
      const first = a.createdAt;
      const second = b.createdAt;
      if (beforeState == "ASC") {
        return first - second;
      } else {
        return second - first;
      }
    } else if (afterState == "updatedAt") {
      const first = !a.updatedAt ? a.createdAt : a.updatedAt;
      const second = !b.updatedAt ? b.createdAt : b.updatedAt;

      if (beforeState == "ASC") {
        return first - second;
      } else {
        return second - first;
      }
    } else if (afterState == "chartType") {
      const first = a.chartConfig.chartType.toLowerCase();
      const second = b.chartConfig.chartType.toLowerCase();
      if (beforeState == "DSC") {
        if (first > second) {
          return -1;
        } else if (first < second) {
          return 1;
        }
      } else {
        if (first < second) {
          return -1;
        } else if (first > second) {
          return 1;
        }
      }
    }
    return 0;
  });
  return charts;
};

export const filterCharts = (
  allCharts: chartType[],
  afterState: string,
  searchText: string
) => {
  const filteredCharts = allCharts.filter((chart: any) => {
    if (afterState == "name")
      return chart.name.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
    else if (afterState == "chartType")
      return (
        (chart.chartConfig as any).chartType
          .toLowerCase()
          .indexOf(searchText.toLowerCase()) > -1
      );
    else if (afterState == "chartType")
      return chart.id.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
    else if (afterState == "datasetId")
      return (
        (chart.chartConfig as any).datasetId
          .toLowerCase()
          .indexOf(searchText.toLowerCase()) > -1
      );
    // else if (afterState == "")
    else return chart.name.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
  });
  return filteredCharts;
};
