import { Form, InputNumber, Select } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { updateCustomize } from "../../../../redux/actions/keplerActions";

const numberFormatterList = [
  {
    label: "Thousand (K) [10^3]",
    value: "K",
  },
  {
    label: "Million (M) [10^6]",
    value: "M",
  },
  {
    label: "Billion (G) [10^9]",
    value: "G",
  },
  {
    label: "Trillion (T) [10^12]",
    value: "T",
  },
  {
    label: "Quadrillion (P) [10^15]",
    value: "P",
  },
  {
    label: "Quintillion (E) [10^18]",
    value: "E",
  },
];

type TFormatModes = "none" | "auto" | "manual";
interface INumberCustomizer {
  name: string;
  series?: string[];
}
interface IFormatterChildren {
  mode: TFormatModes;
  name: string;
  series?: string[];
}

const FormatterChildren = ({ mode, name, series }: IFormatterChildren) => {
  return (
    <>
      <Form.Item
        name={
          isDefined(series)
            ? [...series, `${name}Precision`]
            : `${name}Precision`
        }
        label={getLanguageLabel("decimalPrecision")}
      >
        <InputNumber min={0} max={5} style={{ width: "100%" }} />
      </Form.Item>
      {"manual" == mode && (
        <Form.Item
          label={"Format"}
          name={
            isDefined(series) ? [...series, `${name}Scale`] : `${name}Scale`
          }
          style={{ width: "100%" }}
        >
          <Select options={numberFormatterList} />
        </Form.Item>
      )}
    </>
  );
};

const NumberCustomizer = ({ name, series }: INumberCustomizer) => {
  const { customizeForm, customize } = useSelector(
    (state: RootState) => state.kepler
  );

  const dispatch = useDispatch();

  const [selectedMode, setSelectedMode] = useState(
    customizeForm.getFieldValue(
      isDefined(series)
        ? ["seriesCustomize", ...series, `${name}Mode`]
        : `${name}Mode`
    ) ?? "none"
  );
  return (
    <MtdCollapse
      defaultCollpased={true}
      collapsible="HEADER"
      header={
        <div className="query_item__heading">
          {getLanguageLabel("numberFormat")}
        </div>
      }
      key="numberOptions"
    >
      <>
        <div>
          <Form.Item
            style={{ display: "none" }}
            name={
              isDefined(series) ? [...series, `${name}Mode`] : `${name}Mode`
            }
          >
            <MtdInput />
          </Form.Item>
        </div>
        <MtdSwitch
          items={[
            {
              label: getLanguageLabel("none"),
              value: "none",
              children: (
                <FormatterChildren series={series} name={name} mode="none" />
              ),
            },
            {
              label: getLanguageLabel("auto"),
              value: "auto",
              children: (
                <FormatterChildren series={series} name={name} mode="auto" />
              ),
            },
            {
              label: getLanguageLabel("custom"),
              value: "manual",
              children: (
                <FormatterChildren series={series} name={name} mode="manual" />
              ),
            },
          ]}
          value={selectedMode}
          onChange={(value: string) => {
            setSelectedMode(value);
            customizeForm.setFieldValue(
              isDefined(series) ? [...series, `${name}Mode`] : `${name}Mode`,
              value
            );
            dispatch(updateCustomize({ [`${name}Mode`]: value })); // fixme
          }}
        />
      </>
    </MtdCollapse>
  );
};

export default NumberCustomizer;
