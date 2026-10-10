import { DatePicker, Form, Select, Slider } from "antd";
import { useForm } from "antd/es/form/Form";
import { RefreshIcon, RemoveIcon } from "assets/icons/mtdActionIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useMemo } from "react";
import { ObjectKeys, getLanguageLabel, isDefined } from "utils/utilities";

export const ParameterChart = ({ chartOptions, onClickChart }: any) => {
  const chartData = useMemo(() => chartOptions?.chartData, [chartOptions]);

  const chartDataColumnMap: { [key: string]: any } = useMemo(() => {
    let cKm: { [key: string]: any } = {};
    ObjectKeys(chartData?.data).map((columnKey) => {
      cKm[columnKey] = chartData.data[columnKey];
    });
    return cKm;
  }, [chartData]);

  const [form] = useForm();

  return (
    <div style={{ width: "100%" }}>
      <Form
        layout={chartOptions?.chartCustomization?.layout}
        size={chartOptions?.chartCustomization?.parameterFormSize}
        onFinish={(values: any) => {
          let filters: any[] = [];

          ObjectKeys(values).forEach((valueKey) => {
            if (chartDataColumnMap[valueKey].type === "string") {
              if (Array.isArray(values[valueKey])) {
                filters.push({
                  columnName: valueKey,
                  FilterValue: values[valueKey],
                  operator: "in",
                  checked: true,
                  parameterFilter: true,
                });
              } else if (isDefined(values[valueKey])) {
                filters.push({
                  columnName: valueKey,
                  FilterValue: values[valueKey],
                  operator: "equal",
                  checked: true,
                  parameterFilter: true,
                });
              }
            } else {
              if (
                Array.isArray(values[valueKey]) &&
                values[valueKey].length == 2
              ) {
                if (isDefined(values[valueKey][0])) {
                  filters.push({
                    columnName: valueKey,
                    FilterValue: values[valueKey][0],
                    operator: "greaterThanEqual",
                    checked: true,
                    parameterFilter: true,
                  });
                }
                if (isDefined(values[valueKey][1])) {
                  filters.push({
                    columnName: valueKey,
                    FilterValue: values[valueKey][1],
                    operator: "lessThanEqual",
                    checked: true,
                    parameterFilter: true,
                  });
                }
              }
            }
          });
          console.log("FILTERS : ", filters);
          onClickChart(filters);
        }}
        form={form}
      >
        {ObjectKeys(chartData?.data).map((column: any) => {
          const colObject = chartData.data[column];
          if (colObject.type == "string") {
            return (
              <Form.Item
                style={{ width: "100%" }}
                label={
                  ["hidden", "placeholder"].includes(
                    chartOptions?.chartCustomization?.parameterLabelPosition
                  )
                    ? undefined
                    : colObject.label
                }
                name={column}
              >
                <Select
                  mode={
                    chartOptions?.chartCustomization?.allowMultiselect
                      ? "multiple"
                      : undefined
                  }
                  placeholder={
                    chartOptions?.chartCustomization?.parameterLabelPosition ===
                    "placeholder"
                      ? colObject.label
                      : "Select a value"
                  }
                  options={colObject.values.map((val: string) => ({
                    label: val,
                    value: val,
                  }))}
                />
              </Form.Item>
            );
          } else if (
            colObject.type == "date" ||
            colObject.type == "timestamp"
          ) {
            return (
              <>
                <Form.Item
                  style={{ width: "100%" }}
                  label={
                    ["hidden", "placeholder"].includes(
                      chartOptions?.chartCustomization?.parameterLabelPosition
                    )
                      ? undefined
                      : colObject.label
                  }
                  name={column}
                >
                  <DatePicker.RangePicker
                    placeholder={[
                      chartOptions?.chartCustomization
                        ?.parameterLabelPosition === "placeholder"
                        ? colObject.label + " "
                        : "" + "From Start",
                      "Till Now",
                    ]}
                    allowEmpty={[true, true]}
                  />
                </Form.Item>
              </>
            );
          } else {
            return (
              <>
                <Form.Item
                  style={{ width: "100%" }}
                  name={column}
                  label={
                    ["hidden", "placeholder"].includes(
                      chartOptions?.chartCustomization?.parameterLabelPosition
                    )
                      ? undefined
                      : colObject.label
                  }
                >
                  <Slider
                    // tooltip={{ open: true }}
                    min={colObject.min}
                    max={colObject.max}
                    range={{ draggableTrack: true }}
                  />
                </Form.Item>
              </>
            );
          }
          return <></>;
        })}
      </Form>
      <div style={{ display: "flex", marginTop: "1rem", gap: "0.7rem" }}>
        <MtdButton
          size={chartOptions?.chartCustomization?.parameterFormSize}
          onClick={() => {
            form.submit();
          }}
          intent="success"
          icon={<TickIcon />}
        >
          {getLanguageLabel("apply")}
        </MtdButton>
        <MtdButton
          size={chartOptions?.chartCustomization?.parameterFormSize}
          intent="primary"
          onClick={() => {
            form.resetFields();
          }}
          icon={<RemoveIcon />}
        >
          Clear
        </MtdButton>
        <MtdButton
          size={chartOptions?.chartCustomization?.parameterFormSize}
          onClick={() => {
            form.resetFields();
            // clear filters
          }}
          intent="none"
          icon={<RefreshIcon />}
        >
          {getLanguageLabel("reset")}
        </MtdButton>
      </div>
    </div>
  );
};
