import { KeplerSeries } from "Apps/Kepler/kepler";
import { Form, Radio, Select } from "antd";
import {
  CenterAlignIcon,
  LeftAlignIcon,
  RightAlignIcon,
} from "assets/icons/mtdFileIcons";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { FontCustomizer } from "./FontCustomizer";
import NumberCustomizer from "./NumberCustomizer";

export const TableCustomizer = () => {
  const query = useSelector((state: RootState) => state.kepler.query);
  return (
    <div className="radioButtonPadding">
      <div className="customizer-subHeader">
        <MtdCollapse
          key="additionSettings"
          collapsible={"HEADER"}
          header={
            <div className="query_item__heading">
              {getLanguageLabel("additional")}
            </div>
          }
        >
          <>
            <Form.Item
              name="headerAlignment"
              label={getLanguageLabel("header")}
              style={{ width: "100%" }}
            >
              <Radio.Group size="small">
                <Radio.Button value="left">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <LeftAlignIcon />
                  </div>
                </Radio.Button>
                <Radio.Button value="center">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <CenterAlignIcon />
                  </div>
                </Radio.Button>
                <Radio.Button value="right">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <RightAlignIcon />
                  </div>
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
            <FontCustomizer
              name="tableHeader"
              label={getLanguageLabel("header") + getLanguageLabel("font")}
            />
            <FontCustomizer
              name="tableBody"
              label={getLanguageLabel("body") + getLanguageLabel("font")}
            />
            {/* <Form.Item
              name="tableBodyFontSize"
              label={getLanguageLabel("bodyFont")}
            >
              <InputNumber changeOnWheel={true} min={6} max={100} />
            </Form.Item> */}
            <Form.Item name="summary" label={getLanguageLabel("summary")}>
              <Select
                showSearch={false}
                mode="multiple"
                placeholder={"Select option"}
                options={[
                  { label: "min", value: "min" },
                  { label: "max", value: "max" },
                  { label: "avg", value: "avg" },
                  { label: "sum", value: "sum" },
                  { label: "count", value: "count" },
                ]}
              />
            </Form.Item>
          </>
        </MtdCollapse>
      </div>

      <NumberCustomizer name="table" />

      <MtdCollapse
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("columnNames")}
          </div>
        }
        key="keplerTableChartNamesPanel"
      >
        <>
          {query.series.map((series: KeplerSeries) => {
            if (isDefined(series.columnName))
              return (
                <Form.Item
                  name={`${
                    series.aggregate !== "none"
                      ? `${series.aggregate}(${series.columnName})`
                      : series.columnName
                  }colName`}
                  label={
                    <div className="query_item__heading">{`${
                      series.aggregate !== "none"
                        ? `${series.aggregate}(${series.columnName})`
                        : series.columnName
                    }`}</div>
                  }
                >
                  <MtdInput
                    defaultValue={
                      series.aggregate !== "none"
                        ? `${series.aggregate}(${series.columnName})`
                        : series.columnName
                    }
                  />
                </Form.Item>
              );
          })}
        </>
      </MtdCollapse>
    </div>
  );
};
