import {
  nFormatter,
  parseCompactNumber,
} from "Apps/Kepler/utils/NumberFormatter";
import { Table } from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import {
  getLanguageLabel,
  isDefined,
  isEmpty,
  notEmpty,
  openNotification,
  timeConverter,
} from "utils/utilities";
import EmptyChart from "../EmptyChart";

const KeplerTableChart = ({
  chartData,
  onClickChart,
  chartCustomization,
  customizeForm,
  queryForm,
  darkTheme,
}: {
  chartData: any;
  onClickChart: any;
  chartCustomization: any;
  customizeForm?: any;
  queryForm?: any;
  darkTheme: any;
}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const bodyItems = document.querySelectorAll(".ant-table-body tr td") ?? [];
    const summaryItems =
      document.querySelectorAll(".ant-table-summary tr td") ?? [];

    [...bodyItems, ...summaryItems].forEach((item) => {
      (item as any).style.fontSize = `${
        chartCustomization.tableBodyFontSize ?? 14
      }px`;
      (item as any).style.color =
        chartCustomization.tableBodyFontColor == "#00000000"
          ? darkTheme
            ? "#e4e6ec"
            : "#000000"
          : chartCustomization.tableBodyFontColor;
      (item as any).style.fontWeight =
        chartCustomization.tableBodyFontWeight ?? 400;
    });
    const headerItems = document.querySelectorAll(".ant-table-thead tr th");
    headerItems.forEach((item) => {
      (item as any).style.fontSize = `${
        chartCustomization.tableHeaderFontSize ?? 14
      }px`;
      (item as any).style.color =
        chartCustomization.tableHeaderFontColor == "#00000000"
          ? darkTheme
            ? "#e4e6ec"
            : "#000000"
          : chartCustomization.tableHeaderFontColor;
      (item as any).style.fontWeight =
        chartCustomization.tableHeaderFontWeight ?? 800;
      (item as any).style.textAlign =
        chartCustomization.headerAlignment ?? "left";
    });
  }, [
    chartCustomization.tableHeaderFontSize,
    chartCustomization.tableBodyFontSize,
    chartCustomization.tableHeaderFontColor,
    chartCustomization.tableBodyFontColor,
    chartCustomization.tableHeaderFontWeight,
    chartCustomization.tableBodyFontWeight,
    chartCustomization.headerAlignment,
    chartData,
  ]);

  const columns = useMemo(() => {
    if (
      isDefined(chartData?.data?.columns) &&
      isDefined(chartData?.data?.tableData)
    ) {
      return chartData.data.columns.map(
        (column: { name: string; type: string; max: number }) => {
          const colName = notEmpty(chartCustomization[`${column.name}colName`])
            ? chartCustomization[`${column.name}colName`]
            : column.name;
          return {
            title: isDefined(customizeForm) ? (
              <MtdInput
                dynamicWidth
                style={{
                  fontWeight: chartCustomization.tableHeaderFontWeight ?? 800,
                  color:
                    chartCustomization.tableHeaderFontColor == "#00000000"
                      ? darkTheme
                        ? "#e4e6ec"
                        : "#000000"
                      : chartCustomization.tableHeaderFontColor,
                }}
                editText
                fontSize={chartCustomization.tableHeaderFontSize}
                debounceInterval={800}
                onChange={(e: any) => {
                  const body = {
                    [`${column.name}colName`]: e.target.value,
                  };
                  dispatch({
                    type: "UPDATE_CUSTOMIZE",
                    payload: body,
                  });

                  customizeForm.setFieldValue(
                    `${column.name}colName`,
                    e.target.value
                  );
                }}
                variant={"borderless"}
                value={colName}
                placeholder="Add the Name of the file"
              />
            ) : (
              colName
            ),
            dataIndex: column.name,
            sorter: false,
            render: (text: any, record: any, index: number) => {
              if (
                chartData.data.aggregateCols.includes(column.name) &&
                column.max
              ) {
                return (
                  <div
                    className="ant-table-cell-metric table-chart__aggregated-cell"
                    onClick={(e) => {
                      openNotification(
                        "Unable to add filter",
                        "Can not apply filter on aggregated column",
                        "info",
                        2
                      );
                    }}
                  >
                    <div
                      className="table-chart__aggregated-cell-formatter"
                      style={{
                        width: `${(1 - text / column.max) * 100}%`,
                      }}
                    ></div>
                    <div className="table-chart__aggregated-cell-text">
                      {nFormatter(
                        text,
                        chartCustomization.tablePrecision,
                        chartCustomization.tableMode,
                        chartCustomization.tableScale
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  onClick={(e) => {
                    onClickChart([
                      {
                        columnName: column.name,
                        operator: "equal",
                        FilterValue: text,
                        checked: true,
                      },
                    ]);
                  }}
                  className="ant-table-cell-custom"
                >
                  {column.type === "timestamp" || column.type === "date"
                    ? timeConverter(
                        text,
                        column.type === "timestamp",
                        column.type === "timestamp"
                      )
                    : nFormatter(
                        text,
                        chartCustomization.tablePrecision,
                        chartCustomization.tableMode,
                        chartCustomization.tableScale
                      )}
                </div>
              );
            },
          };
        }
      );
    }
    return [];
  }, [chartData, chartCustomization]);

  return (
    <div
      id="keplerChartTable"
      style={{ width: "100%", height: "100%", overflowY: "auto" }}
    >
      {columns.length === 0 ? (
        <EmptyChart data={getLanguageLabel("noDataFoundMatchingQuery")} />
      ) : (
        <Table
          columns={columns}
          sticky={true}
          dataSource={chartData.data.tableData}
          pagination={{
            defaultPageSize: 15,
            hideOnSinglePage: true,
            pageSizeOptions: [10, 15, 20, 50, 100],
          }}
          size={"small"}
          summary={(pageData) => {
            if (isEmpty(chartCustomization.summary)) return <></>;

            let columnData: {
              [key: string]: {
                min: number;
                max: number;
                PageMin: number;
                PageMax: number;
                avg: number;
                pageAvg: number;
                total: number;
                pageTotal: number;
                count: number;
                pageCount: number;
              };
            } = {};

            {
              chartData.data.columns.map(
                (column: {
                  name: string;
                  type: string;
                  max: number;
                  min: number;
                  sum: number;
                  avg: number;
                }) => {
                  let pageSum = 0;
                  let pageMinVal: number | undefined = undefined;
                  let pageMaxVal: number | undefined = undefined;

                  if (["double", "long", "integer"].includes(column.type)) {
                    pageData.forEach((values: any) => {
                      const cellVal = Number(values[column.name]);
                      pageSum += cellVal;

                      pageMinVal = isDefined(pageMinVal)
                        ? Math.min(pageMinVal, cellVal)
                        : cellVal;
                      pageMaxVal = isDefined(pageMaxVal)
                        ? Math.max(pageMaxVal, cellVal)
                        : cellVal;
                    });
                  }

                  columnData[column.name] = {
                    min: column.min,
                    max: column.max,
                    PageMin: pageMinVal ?? 0,
                    PageMax: pageMaxVal ?? 0,
                    avg: column.avg,
                    pageAvg: pageSum / (pageData.length ?? 1),
                    total: column.sum,
                    pageTotal: pageSum,
                    count: chartData.data.tableData.length,
                    pageCount: pageData.length,
                  };
                }
              );
            }

            return (
              <>
                {chartCustomization.summary.map((summaryType: string) => (
                  <Table.Summary.Row>
                    {chartData.data?.columns?.map(
                      (
                        column: { name: string; type: string; max?: number },
                        index: number
                      ) => {
                        return (
                          <Table.Summary.Cell index={index}>
                            <div className="flex" style={{ width: "100%" }}>
                              {index === 0 && (
                                <div style={{ width: "100%" }}>
                                  {summaryType.toUpperCase()} (Page | Table):{" "}
                                </div>
                              )}
                              {["double", "long", "integer"].includes(
                                column.type
                              ) && (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    width: "100%",
                                  }}
                                >
                                  {summaryType === "min" && (
                                    <>{`${nFormatter(
                                      columnData[column.name].min,
                                      chartCustomization.tablePrecision,
                                      chartCustomization.tableMode,
                                      chartCustomization.tableScale
                                    )} | ${nFormatter(
                                      columnData[column.name].PageMin,
                                      chartCustomization.tablePrecision,
                                      chartCustomization.tableMode,
                                      chartCustomization.tableScale
                                    )}`}</>
                                  )}
                                  {summaryType === "max" && (
                                    <>{`${nFormatter(
                                      columnData[column.name].max,
                                      chartCustomization.tablePrecision,
                                      chartCustomization.tableMode,
                                      chartCustomization.tableScale
                                    )} | ${nFormatter(
                                      columnData[column.name].PageMax,
                                      chartCustomization.tablePrecision,
                                      chartCustomization.tableMode,
                                      chartCustomization.tableScale
                                    )}`}</>
                                  )}
                                  {summaryType === "avg" && (
                                    <>{`${nFormatter(
                                      columnData[column.name].avg,
                                      chartCustomization.tablePrecision,
                                      chartCustomization.tableMode,
                                      chartCustomization.tableScale
                                    )} | ${nFormatter(
                                      columnData[column.name].pageAvg,
                                      chartCustomization.tablePrecision,
                                      chartCustomization.tableMode,
                                      chartCustomization.tableScale
                                    )}`}</>
                                  )}
                                  {summaryType === "sum" && (
                                    <>{`${nFormatter(
                                      columnData[column.name].total,
                                      chartCustomization.tablePrecision,
                                      chartCustomization.tableMode,
                                      chartCustomization.tableScale
                                    )} | ${nFormatter(
                                      columnData[column.name].pageTotal,
                                      chartCustomization.tablePrecision,
                                      chartCustomization.tableMode,
                                      chartCustomization.tableScale
                                    )}`}</>
                                  )}
                                  {summaryType === "count" && (
                                    <>{`${nFormatter(
                                      columnData[column.name].count,
                                      chartCustomization.tablePrecision,
                                      chartCustomization.tableMode,
                                      chartCustomization.tableScale
                                    )} | ${nFormatter(
                                      columnData[column.name].pageCount,
                                      chartCustomization.tablePrecision,
                                      chartCustomization.tableMode,
                                      chartCustomization.tableScale
                                    )}`}</>
                                  )}
                                </div>
                              )}
                            </div>
                          </Table.Summary.Cell>
                        );
                      }
                    )}
                  </Table.Summary.Row>
                ))}
              </>
            );
          }}
        />
      )}
    </div>
  );
};

export default KeplerTableChart;
