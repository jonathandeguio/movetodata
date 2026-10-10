import { ColumnSelectLabel } from "Apps/Kepler/chart/QueryForm/ColumnSelect";
import { getColumnUniqueValues } from "Apps/Kepler/chart/charts.api";
import { KeplerConfig } from "Apps/Kepler/chart/charts.config";
import { getFilterOperatorOptions } from "Apps/Kepler/chart/charts.utils";
import { Form, Select } from "antd";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import MtdDatePicker from "components/MtdComponents/MtdDatePicker";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import useForceRender from "hooks/useForceRender";
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { NULL_UUID } from "utils/Common.constants";
import { getLanguageLabel } from "utils/utilities";
import FilterAddPopoverInput from "./FilterAddPopoverInput";
import { TFilterAddOperator } from "./FilterConfirmationPopup";
import {
  ADD_CONDITION_TEXT,
  LOGICAL_OPERATOR_OPTIONS,
} from "./Filters.constants";
import styles from "./Filters.module.scss";
import { TDatasetColumn } from "./Filters.view";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";

interface IProps {
  editMode: boolean;
  fieldOptions: TDatasetColumn[];
  form: any;
  onFilterApply: any;
}

export interface TCondition {
  operator: TFilterAddOperator;
  value: any;
  key: any;
}

export type TLogicalOperator = "and" | "or";

const FiltersAddPopoverContent = ({
  editMode,
  fieldOptions,
  form,
  onFilterApply,
}: IProps) => {
  const forceRender = useForceRender();
  const selectFieldRef = useRef<any>(null);
  const [openFieldDropDown, setOpenFieldDropDown] = useState<boolean>(
    !form.getFieldValue("field")
  );
  const [loadingFilterValues, setLoadingFilterValues] =
    useState<boolean>(false);
  const [filterValuesOptions, setFilterValuesOptions] = useState<any[]>([]);

  const field = form.getFieldValue("field");

  const allDatasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping
  );

  const getFilterValues = async (
    columnName: string,
    columnType: string,
    datasetId: string
  ) => {
    setLoadingFilterValues(true);
    let type = "value";
    if (KeplerConfig.timeColumnDataTypes.includes(columnType)) type = "range";
    getColumnUniqueValues([
      {
        datasetID: datasetId,
        branch: "master",
        transactionId: allDatasetMapping[datasetId]
          ? allDatasetMapping[datasetId].datasetMapping?.currentTransaction
          : NULL_UUID,
        column: columnName,
        type: type,
      },
    ])
      .then(({ data }) => {
        data = data[datasetId + columnName + "master" + type];
        setFilterValuesOptions(
          data.map((val: string) => ({
            value: val,
            label: String(val),
          }))
        );
        setLoadingFilterValues(false);
      })
      .catch((err) => setLoadingFilterValues(false));
  };

  return (
    <div className={styles.popover}>
      <Form.Item name="field" className={styles.formItem}>
        <Select
          showSearch
          value={field?.value}
          ref={selectFieldRef}
          filterOption={(input, option) =>
            (option?.value ?? "").toLowerCase().includes(input.toLowerCase())
          }
          optionFilterProp="children"
          placeholder="Select a filter field"
          showAction={["click", "focus"]}
          onSelect={(e) => {
            setTimeout(() => setOpenFieldDropDown(false), 5);
          }}
          onClick={() => {
            setOpenFieldDropDown(true);
          }}
          getPopupContainer={(triggerNode: HTMLElement) =>
            triggerNode.parentNode as HTMLElement
          }
          open={openFieldDropDown}
          onChange={(e: any, option: any) => {
            const _conditionCase = [
              {
                operator: "equal",
                value: undefined,
                key: `${"Condition"}_${new Date().getTime()}`,
              },
            ];
            form.setFieldsValue({
              field: { value: option.value, ...option.children.props },
              conditionCase: _conditionCase,
            });
          }}
        >
          {fieldOptions.map((option: TDatasetColumn) => (
            <Select.Option value={option.value}>
              <ColumnSelectLabel
                name={option.name}
                type={option.type}
                datasetId={option.datasetId}
              />
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      {form.getFieldValue("conditionCase").length > 1 ? (
        <div className={styles.conditionWrapper}>
          <Form.Item name="logicalOperator" className={styles.formItem}>
            <Select
              optionFilterProp="children"
              options={LOGICAL_OPERATOR_OPTIONS}
              style={{
                width: 70,
                height: "fit-content",
              }}
              getPopupContainer={(triggerNode: HTMLElement) =>
                triggerNode.parentNode as HTMLElement
              }
            />
          </Form.Item>
          <div className={styles.groupIndicator}>
            <div className={styles.horizontalIndicator}></div>
          </div>
          <Form.List name="conditionCase">
            {(fields, { add, remove }) => {
              return (
                <div className={styles.conditionInputs}>
                  {fields.map((condition: any, _index: number) => (
                    <div className={styles.conditionInput}>
                      {!(field && field.type == "boolean") && (
                        <Form.Item
                          name={[_index, "operator"]}
                          className={styles.formItem}
                        >
                          <Select
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            placeholder="Select a operator"
                            options={getFilterOperatorOptions(
                              field?.type as string
                            )}
                            onChange={() => {
                              form.setFieldValue(
                                ["conditionCase", condition.name, "value"],
                                undefined
                              );
                              forceRender();
                            }}
                            getPopupContainer={(triggerNode: HTMLElement) =>
                              triggerNode.parentNode as HTMLElement
                            }
                            style={{
                              width: 200,
                            }}
                          />
                        </Form.Item>
                      )}
                      {!(
                        form.getFieldValue([
                          "conditionCase",
                          condition.name,
                          "operator",
                        ]) &&
                        ["exists", "doesNotExist"].includes(
                          form.getFieldValue([
                            "conditionCase",
                            condition.name,
                            "operator",
                          ])
                        )
                      ) &&
                        (KeplerConfig.timeColumnDataTypes.includes(
                          field?.type as string
                        ) ? (
                          <Form.Item
                            name={[_index, "value"]}
                            className={styles.formItem}
                          >
                            <MtdDatePicker
                              loading={loadingFilterValues}
                              disabledDates={filterValuesOptions}
                              value={
                                form.getFieldValue([
                                  "conditionCase",
                                  condition.name,
                                  "value",
                                ])
                                  ? new Date(
                                      form.getFieldValue([
                                        "conditionCase",
                                        condition.name,
                                        "value",
                                      ])
                                    )
                                  : undefined
                              }
                              onChange={(date: number, dateString: string) => {
                                form.setFieldValue(
                                  ["conditionCase", condition.name, "value"],
                                  dateString
                                );
                              }}
                            />
                          </Form.Item>
                        ) : form.getFieldValue([
                            "conditionCase",
                            condition.name,
                            "operator",
                          ]) === "like" ? (
                          <Form.Item
                            name={[_index, "value"]}
                            className={styles.formItem}
                          >
                            <MtdInput
                              placeholder="Input a value"
                              style={{
                                width: 200,
                              }}
                            />
                          </Form.Item>
                        ) : (
                          // <Form.Item
                          //   name={[_index, "value"]}
                          //   className={styles.formItem}
                          // >
                          <Select
                            loading={loadingFilterValues}
                            filterOption={(input, option) =>
                              (option?.label ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            placeholder={`Choose a value`}
                            className=""
                            showSearch
                            optionFilterProp="children"
                            allowClear
                            size="small"
                            maxTagCount={2}
                            {...(form.getFieldValue([
                              "conditionCase",
                              condition.name,
                              "operator",
                            ]) === "in"
                              ? {
                                  mode: "tags",
                                  value: form.getFieldValue([
                                    "conditionCase",
                                    condition.name,
                                    "value",
                                  ])
                                    ? JSON.parse(
                                        form.getFieldValue([
                                          "conditionCase",
                                          condition.name,
                                          "value",
                                        ])
                                      )
                                    : undefined,
                                  onChange: (value: any[]) => {
                                    form.setFieldValue(
                                      [
                                        "conditionCase",
                                        condition.name,
                                        "value",
                                      ],
                                      JSON.stringify(value)
                                    );
                                  },
                                }
                              : {
                                  value: form.getFieldValue([
                                    "conditionCase",
                                    condition.name,
                                    "value",
                                  ]),
                                  onChange: (value: any[]) => {
                                    form.setFieldValue(
                                      [
                                        "conditionCase",
                                        condition.name,
                                        "value",
                                      ],
                                      value
                                    );
                                  },
                                })}
                            options={filterValuesOptions}
                            onFocus={() => {
                              const _field = form.getFieldValue("field");

                              getFilterValues(
                                _field.name,
                                _field.type,
                                _field.datasetId
                              );
                            }}
                            style={{
                              width: 200,
                            }}
                            getPopupContainer={(triggerNode: HTMLElement) =>
                              triggerNode.parentNode as HTMLElement
                            }
                          />
                          // </Form.Item>
                        ))}
                      <div
                        className="MtdBtnHeading"
                        onClick={(e) => {
                          e.stopPropagation();
                          const _conditionCase: any[] = [];
                          const candidateKey = form.getFieldValue([
                            "conditionCase",
                            condition.name,
                            "key",
                          ]);

                          form
                            .getFieldValue("conditionCase")
                            .map((_condition: TCondition) => {
                              if (_condition.key != candidateKey) {
                                _conditionCase.push(_condition);
                              }
                            });

                          form.setFieldValue("conditionCase", _conditionCase);

                          if (_conditionCase.length == 1) {
                            forceRender();
                          }
                        }}
                      >
                        <CrossIcon />
                      </div>
                    </div>
                  ))}
                </div>
              );
            }}
          </Form.List>
        </div>
      ) : (
        <Form.List name="conditionCase">
          {(fields, { add, remove }) => {
            return (
              <>
                {fields.map((condition: any, _index: number) => (
                  <>
                    {!(field && field.type == "boolean") && (
                      <Form.Item
                        name={[_index, "operator"]}
                        className={styles.formItem}
                      >
                        <Select
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          placeholder="Select a operator"
                          options={getFilterOperatorOptions(
                            field?.type as string
                          )}
                          onChange={() => {
                            form.setFieldValue(
                              ["conditionCase", condition.name, "value"],
                              undefined
                            );
                            forceRender();
                          }}
                          getPopupContainer={(triggerNode: HTMLElement) =>
                            triggerNode.parentNode as HTMLElement
                          }
                          // style={{
                          //   width: 200,
                          // }}
                        />
                      </Form.Item>
                    )}
                    {!(
                      form.getFieldValue([
                        "conditionCase",
                        condition.name,
                        "operator",
                      ]) &&
                      ["exists", "doesNotExist"].includes(
                        form.getFieldValue([
                          "conditionCase",
                          condition.name,
                          "operator",
                        ])
                      )
                    ) &&
                      (KeplerConfig.timeColumnDataTypes.includes(
                        field?.type as string
                      ) ? (
                        <Form.Item
                          name={[_index, "value"]}
                          className={styles.formItem}
                        >
                          <MtdDatePicker
                            loading={loadingFilterValues}
                            disabledDates={filterValuesOptions}
                            value={
                              new Date(
                                form.getFieldValue([
                                  "conditionCase",
                                  condition.name,
                                  "value",
                                ])
                                  ? form.getFieldValue([
                                      "conditionCase",
                                      condition.name,
                                      "value",
                                    ])
                                  : undefined
                              )
                            }
                            onChange={(date: number, dateString: string) => {
                              form.setFieldValue(
                                ["conditionCase", condition.name, "value"],
                                dateString
                              );
                            }}
                          />
                        </Form.Item>
                      ) : (
                        <FilterAddPopoverInput
                          form={form}
                          condition={condition}
                          filterValuesOptions={filterValuesOptions}
                          getFilterValues={getFilterValues}
                          type={form.getFieldValue([
                            "conditionCase",
                            condition.name,
                            "operator",
                          ])}
                        />
                      ))}
                  </>
                ))}
              </>
            );
          }}
        </Form.List>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          className="MtdBtnHeading"
          onClick={() => {
            const conditionArr = form.getFieldValue("conditionCase")
              ? [...form.getFieldValue("conditionCase")]
              : [
                  {
                    operator: "equal",
                    value: undefined,
                    key: `${"Condition"}_${new Date().getTime()}`,
                  },
                ];
            const newCondition = {
              operator: "equal",
              value: undefined,
              key: `${"Condition"}_${new Date().getTime()}`,
            };

            conditionArr.push(newCondition);

            form.setFieldsValue({
              conditionCase: conditionArr,
            });

            forceRender();
          }}
        >
          {ADD_CONDITION_TEXT}
        </div>
        <MtdButton
          onClick={() => onFilterApply()}
          intent={"action"}
          icon={<TickIcon />}
          size="small"
          icononly
        >
          {getLanguageLabel("apply")}
        </MtdButton>
      </div>
    </div>
  );
};

export default FiltersAddPopoverContent;
