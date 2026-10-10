import { AutoComplete, Select } from "antd";
import useEffectOnlyOnDependencyUpdate from "hooks/useEffectOnlyOnDependencyUpdate";
import React, { useState } from "react";
import { TFilterAddOperator } from "./FilterConfirmationPopup";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";

interface IProps {
  form: any;
  condition: any;
  filterValuesOptions: any[];
  getFilterValues: any;
  type: TFilterAddOperator;
}
const FilterAddPopoverInput = ({
  form,
  condition,
  filterValuesOptions,
  getFilterValues,
  type,
}: IProps) => {
  const [value, setValue] = useState(
    form.getFieldValue(["conditionCase", condition.name, "value"])
  );
  const onChange = (value: any) => {
    form.setFieldValue(["conditionCase", condition.name, "value"], value);
    setValue(value);
  };
  const parseValue = (value: any) => {
    let _value = undefined;
    try {
      _value = JSON.parse(value);
    } catch (e) {
      return undefined;
    }
    return _value;
  };

  useEffectOnlyOnDependencyUpdate(() => {
    onChange(undefined);
  }, [type]);

  if (type == "like") {
    return (
      <MtdInput
        placeholder="Input a value"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
      />
    );
  } else if (type == "in") {
    return (
      <Select
        // loading={loadingFilterValues}
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        placeholder={`Choose a value`}
        showSearch
        optionFilterProp="children"
        allowClear
        size="small"
        maxTagCount={2}
        getPopupContainer={(triggerNode: HTMLElement) =>
          triggerNode.parentNode as HTMLElement
        }
        mode={"tags"}
        value={parseValue(value)}
        onChange={(value: any[]) => {
          onChange(JSON.stringify(value));
        }}
        options={filterValuesOptions}
        onFocus={() => {
          const _field = form.getFieldValue("field");

          getFilterValues(_field.name, _field.type, _field.datasetId);
        }}
      />
    );
  }

  return (
    <AutoComplete
      filterOption={(input, option) =>
        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
      }
      placeholder={`Choose a value`}
      className=""
      size="small"
      maxTagCount={2}
      value={value}
      onChange={(value: any[]) => {
        onChange(value);
      }}
      options={filterValuesOptions}
      onFocus={() => {
        const _field = form.getFieldValue("field");

        getFilterValues(_field.name, _field.type, _field.datasetId);
      }}
    />
  );
};

export default FilterAddPopoverInput;
