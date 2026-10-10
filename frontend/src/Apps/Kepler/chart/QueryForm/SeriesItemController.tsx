import { DatasetColumn } from "Apps/Kepler/kepler";
import { Form, Radio, Select, Tag, Typography } from "antd";
import {
  GroupedColumnIcon,
  LineChartIcon,
  ScatterIcon,
  SmallAreaChartIcon,
} from "assets/icons/mtdChartIcons";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel } from "utils/utilities";
import { chartConfig } from "../charts.config";
import {
  IconForColumnType,
  SortingIconAscending,
  SortingIconDescending,
  getAggregateOptions,
} from "../charts.utils";
import ColumnSelect from "./ColumnSelect";
import { RemoveIcon } from "assets/icons/mtdActionIcons";
const { Text } = Typography;

interface SeriesItemControllerProps {
  fieldName: any;
  chartType: string;
  groupBy: boolean;
}

const SeriesItemController = (props: SeriesItemControllerProps) => {
  const columns = useSelector((state: RootState) => state.kepler.columns);

  const [column, setColumn] = useState<DatasetColumn | undefined>(undefined);
  const columnType = useMemo(() => {
    const cDet = columns.filter((c: any) => c.headerName == column);

    return cDet.length > 0 ? cDet.columnType : "";
  }, [column]);
  const aggregateOptions = getAggregateOptions(column?.type, props.chartType);

  const options = [
    {
      label: (
        <div className="chartTypeLabel">
          <SmallAreaChartIcon size={17} color={"#4169E1"} />
          {/* Area */}
        </div>
      ),
      value: "lineAreaChart",
    },
    {
      label: (
        <div className="chartTypeLabel">
          <LineChartIcon size={17} color={"#2ECC71"} />
          {/* Line */}
        </div>
      ),
      value: "lineChart",
    },
    {
      label: (
        <div className="chartTypeLabel">
          <GroupedColumnIcon size={17} color={"#FFA500"} />
          {/* Column */}
        </div>
      ),
      value: "barChart",
    },
    {
      label: (
        <div className="chartTypeLabel">
          <ScatterIcon size={17} color={"#FF69B4"} />
          {/* Scatter */}
        </div>
      ),
      value: "scatterChart",
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          marginBottom: "0.25rem",
          width: "100%",
        }}
      >
        {props.chartType === "pieChart" && (
          <Tag
            style={{
              borderRadius: 0,
              margin: 0,
              borderRight: 0,
              lineHeight: 2,
              maxHeight: "32px",
              fontSize: "small",
              fontWeight: "bold",
            }}
          >
            {getLanguageLabel("sizeBy").toLocaleUpperCase()}
          </Tag>
        )}
        <div
          style={{
            display: "flex",
            width: "100%",
          }}
        >
          {props.chartType === "VerticalAxisChart" && (
            // chartConfig[props.chartType].isSingleSeries &&
            <Form.Item
              name={[props.fieldName, "seriesType"]}
              style={{ marginBottom: "0" }}
            >
              <Select
                style={{
                  borderRadius: 0,
                  margin: 0,
                  borderRight: 0,
                  fontSize: "small",
                  marginBottom: 0,
                }}
                placeholder={`type`}
                className=""
                options={[
                  {
                    label: (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <SmallAreaChartIcon size={17} color={"#4169E1"} />
                      </div>
                    ),
                    value: "lineAreaChart",
                  },
                  {
                    label: (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <LineChartIcon size={17} color={"#2ECC71"} />
                      </div>
                    ),
                    value: "lineChart",
                  },
                  {
                    label: (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <GroupedColumnIcon size={17} color={"#FFA500"} />
                      </div>
                    ),
                    value: "barChart",
                  },
                  {
                    label: (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <ScatterIcon size={17} color={"#FF69B4"} />
                      </div>
                    ),
                    value: "scatterChart",
                  },
                ]}
              />
            </Form.Item>
          )}
          <ColumnSelect
            dropdownListPrefix={
              props.chartType === "VerticalAxisChart" &&
              !chartConfig[props.chartType].isSingleSeries ? (
                <Form.Item
                  className="seriesItemControllerRadioButton"
                  style={{ width: "100%", margin: "0" }}
                  name={[props.fieldName, "seriesType"]}
                >
                  <Radio.Group
                    style={{ width: "100%" }}
                    size="middle"
                    options={options}
                    optionType="button"
                  />
                </Form.Item>
              ) : null
            }
            name={[props.fieldName, "columnName"]}
            listName={"series"}
            onSelect={setColumn}
            rules={[
              {
                required: true,
                message: (
                  <>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "10px",
                        color: "var(--movetodata-intent-danger)",
                      }}
                    >
                      Column Name is required!
                    </Text>
                  </>
                ),
              },
            ]}
          />
        </div>
      </div>

      <div className="metric-subItem" style={{ marginBottom: "0.25rem" }}>
        <div className="query_item__heading">
          {getLanguageLabel("aggregate")}
        </div>
        <div className="metric-subItem-right aggregate">
          <Form.Item required name={[props.fieldName, "aggregate"]}>
            <Select
              variant={"filled"}
              optionLabelProp={"title"}
              options={aggregateOptions}
              style={{ width: "200px" }}
              popupClassName={"aggregatePopup"}
            />
          </Form.Item>
        </div>
      </div>

      {props.chartType === "table" && (
        <div className="metric-subItem">
          <div className="metric-subItem-left">
            {
              <div className="query_item__heading">
                {getLanguageLabel("sort")}
              </div>
            }
          </div>
          <div className="metric-subItem-right aggregate">
            <Form.Item name={[props.fieldName, "sort"]}>
              <Select
                style={{ fontSize: "12px" }}
                variant={"borderless"}
                popupMatchSelectWidth={false}
                options={[
                  {
                    value: "asc",
                    label: (
                      <div
                        className="text-and-icon-center"
                        style={{
                          fontSize: "12px",
                          color: "rgb(113, 122, 148)",
                          height: "100%",
                        }}
                      >
                        <SortingIconAscending type={columnType} />{" "}
                        {getLanguageLabel("sortAscending")}
                      </div>
                    ),
                  },
                  {
                    value: "desc",
                    label: (
                      <div
                        className="text-and-icon-center"
                        style={{
                          fontSize: "12px",
                          color: "rgb(113, 122, 148)",
                          height: "100%",
                        }}
                      >
                        <SortingIconDescending type={columnType} />{" "}
                        {getLanguageLabel("sortDescending")}
                      </div>
                    ),
                  },
                  {
                    value: "",
                    label: (
                      <div
                        className="text-and-icon-center"
                        style={{
                          fontSize: "12px",
                          color: "rgb(113, 122, 148)",
                          height: "100%",
                        }}
                      >
                        <RemoveIcon /> {getLanguageLabel("none")}
                      </div>
                    ),
                  },
                ]}
              />
            </Form.Item>
          </div>
        </div>
      )}
      {props.groupBy && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "0.25rem",
            }}
          >
            <Tag
              style={{
                borderRadius: 0,
                margin: 0,
                borderRight: 0,
                lineHeight: 2,
                maxHeight: "32px",
                fontSize: "small",
                fontWeight: "bold",
              }}
            >
              {getLanguageLabel("groupBy").toLocaleUpperCase()}
            </Tag>

            <Form.Item
              name={[props.fieldName, "groupBy"]}
              style={{ marginBottom: "0", width: "100%" }}
            >
              <Select
                placeholder={`Choose a column`}
                className=""
                showSearch
                mode="multiple"
                optionLabelProp={"value"}
                maxTagCount={2}
                optionFilterProp="value"
                filterOption={(input, option) => {
                  return (option?.value as any)
                    .toLowerCase()
                    .includes(input.toLowerCase());
                }}
                allowClear
              >
                {columns.map((column: any) => (
                  <Select.Option value={column.headerName}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.4rem",
                        flexDirection: "row",
                        alignItems: "center",
                        height: "100%",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <span style={{ fontSize: "small" }}>
                          {column.headerName}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            marginLeft: "auto",
                          }}
                        >
                          <div className="text-and-icon-center">
                            <div className="data-type-label">{column.type}</div>
                            <IconForColumnType
                              type={column.type}
                              style={{ color: "#08c" }}
                            />
                          </div>
                        </span>
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </>
      )}
    </>
  );
};

export default SeriesItemController;
