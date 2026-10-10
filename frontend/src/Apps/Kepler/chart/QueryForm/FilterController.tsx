import { DatasetColumn } from "Apps/Kepler/kepler";
import { Collapse, Form, Select, Typography } from "antd";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { HelpIcon } from "assets/icons/mtdMiscellaneousIcons";
import MtdDatePicker from "components/MtdComponents/MtdDatePicker";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { isDefined, isEmpty } from "utils/utilities";
import { getColumnUniqueValues } from "../charts.api";
import { KeplerConfig } from "../charts.config";
import { getFilterOperatorOptions, labelMap } from "../charts.utils";
import ColumnSelect from "./ColumnSelect";

const { Panel } = Collapse;
const { Text } = Typography;

/**
 * @deprecated
 */
export const FilterComponent = ({
  field,
  index,
  remove,
  dataForm,
}: {
  field: any;
  index: number;
  dataForm: any;
  remove: any;
}) => {
  const filters = Form.useWatch("filter", dataForm);
  const [column, setColumn] = useState<DatasetColumn | undefined>(undefined);
  const [filterValuesOptions, setFilterValueOptions] = useState([]);
  const [loadingFilterValues, setLoadingFilterValues] =
    useState<boolean>(false);
  const datasetId = useSelector(
    (state: RootState) => state.kepler.chart.datasetId
  );

  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[datasetId]
  );

  useEffect(() => {
    if (isDefined(column) && isDefined(filters)) {
      getFilterValue(column.headerName, column.type);

      if (isEmpty(filters[index].operator)) {
        const filtersCopy: any = [...filters];
        filtersCopy[index] = {
          ...filtersCopy[index],
          operator: "equal",
        };

        setOperator("equal");
        dataForm.setFieldValue("filter", filtersCopy);
      } else {
        setOperator(filters[index].operator);
      }
    }
  }, [column, filters]);

  const getFilterValue = async (
    columnName: string | undefined,
    columnType: string | undefined
  ) => {
    if (isDefined(columnName) && isDefined(columnType)) {
      setLoadingFilterValues(true);
      let type = "value";
      if (KeplerConfig.timeColumnDataTypes.includes(columnType)) type = "range";
      getColumnUniqueValues([
        {
          datasetID: datasetId,
          branch: "master",
          column: columnName,
          transactionId: datasetMapping.datasetMapping?.currentTransaction,
          type: type,
        },
      ])
        .then(({ data }) => {
          data = data[datasetId + columnName + "master" + type];
          setFilterValueOptions(
            data.map((val: string) => ({
              value: val,
              label: String(val),
            }))
          );
          setLoadingFilterValues(false);
        })
        .catch((err) => setLoadingFilterValues(false));
    }
  };

  const [operator, setOperator] = useState<string | undefined>(undefined);

  const filterValue = isDefined(filters)
    ? filters[index].filterValue
    : undefined;

  let label = useMemo(() => {
    if (column?.headerName && isDefined(operator)) {
      if (["exists", "does not exists"].includes(operator)) {
        return `${column?.headerName}  ${operator}`;
      } else if (isDefined(filterValue)) {
        const fValue =
          isDefined(column) &&
          KeplerConfig.timeColumnDataTypes.includes(column.type)
            ? new Date(filterValue).toLocaleDateString("en-us", {
                weekday: "long",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : filterValue;

        return `${column?.headerName}  ${labelMap[operator]} [${fValue}]`;
      }
    }

    return `${"Filter"} ${index + 1}`;
  }, [column, operator, filterValue]);

  if (!datasetMapping) {
    return <MtdLoader />;
  }

  return (
    <Collapse
      className="chartCollapse"
      key={`filterCollapse${index}`}
      ghost
      defaultActiveKey={index}
    >
      <Panel
        key={index}
        header={
          <div className="seriesHeader text-and-icon-center width100">
            <div style={{ flex: 1 }}>{label}</div>
            <div
              style={{ cursor: "pointer" }}
              className="seriesHeader-closeIcon"
              onClick={() => {
                remove(field.name);
              }}
            >
              <CrossIcon />
            </div>
          </div>
        }
      >
        <div className="sideDivider">
          <div className="sideDivider-body">
            <div key={field.name}>
              <ColumnSelect
                name={[field.name, "columnName"]}
                listName={"filter"}
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
                onSelect={setColumn}
              />

              {isDefined(column) && column.type !== "boolean" && (
                <div
                  className="metric-subItem"
                  style={{ marginBottom: "0.25rem" }}
                >
                  <div className="metric-subItem-left">Operator</div>
                  <div className="metric-subItem-right">
                    <Form.Item
                      name={[field.name, "operator"]}
                      style={{ marginBottom: "0rem", width: "50%" }}
                    >
                      <Select
                        style={{ fontSize: "12px", width: 120 }}
                        variant={"borderless"}
                        onSelect={(value) => {
                          setOperator(value);
                        }}
                        options={getFilterOperatorOptions(column?.type)}
                      />
                    </Form.Item>
                  </div>
                </div>
              )}

              {/* FILTER VALUE SELECTORS */}

              {isDefined(column) &&
                isDefined(operator) &&
                !["exists", "doesNotExist"].includes(operator) && (
                  <>
                    {KeplerConfig.timeColumnDataTypes.includes(column.type) ? (
                      <div
                        style={{
                          marginTop: "0.25rem",
                          marginBottom: "0.25rem",
                          width: "100%",
                        }}
                      >
                        <Form.Item name={[field.name, "filterValue"]}>
                          <MtdDatePicker
                            loading={loadingFilterValues}
                            disabledDates={filterValuesOptions}
                          />
                        </Form.Item>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <Form.Item
                          name={
                            operator === "in"
                              ? [field.name, "filterValueMulti"]
                              : [field.name, "filterValue"]
                          }
                          style={{ marginBottom: "0", width: "100%" }}
                          rules={[
                            { required: true, message: "Value is required!" },
                          ]}
                        >
                          {operator === "like" ? (
                            <MtdInput
                              debounceInterval={1000}
                              placeholder="Enter filter values"
                            />
                          ) : (
                            <Select
                              loading={loadingFilterValues}
                              placeholder={`Choose a value`}
                              className=""
                              showSearch
                              optionFilterProp="children"
                              allowClear
                              size="small"
                              maxTagCount={2}
                              {...(operator === "in" ? { mode: "tags" } : {})}
                              options={filterValuesOptions}
                            />
                          )}
                        </Form.Item>
                        {operator === "like" && (
                          <div
                            onClick={() => {
                              window
                                .open(
                                  "https://learn.microsoft.com/en-us/sql/t-sql/language-elements/like-transact-sql?view=sql-server-ver16#pattern",
                                  "_blank"
                                )
                                ?.focus();
                            }}
                          >
                            <HelpIcon />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
            </div>
          </div>
        </div>
      </Panel>
    </Collapse>
  );
};
