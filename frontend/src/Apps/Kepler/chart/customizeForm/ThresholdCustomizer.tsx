import { defaultThresholdCustomize } from "Apps/Kepler/utils/DefaultValues";
import { ColorPicker, Form, InputNumber, Select, Space, Switch } from "antd";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel, isDefined, isEmpty } from "utils/utilities";
import { KeplerTransparentButton } from "../components/KeplerTransparentButton";
import { KeplerConfig, chartConfig } from "../charts.config";
import { FontCustomizer } from "./FontCustomizer";

interface IThresholdCustomizer {
  name: string;
}
function getThresholdLabel(chartType: string, thresholdOperator: string) {
  if (chartType === "treeMapChart") {
    return thresholdOperator === "lte"
      ? `${getLanguageLabel("lessThanEqual")} (<=)`
      : `${getLanguageLabel("greaterThanEqual")} (>=)`;
  } else if (chartType === "gaugeChart") {
    return `${getLanguageLabel("lessThanEqual")} (<=)`;
  } else {
    return `${getLanguageLabel("greaterThanEqual")} (>=)`;
  }
}
const labelPositionOptions = [
  { label: getLanguageLabel("start"), value: "start" },
  { label: getLanguageLabel("middle"), value: "middle" },
  { label: getLanguageLabel("end"), value: "end" },
  { label: getLanguageLabel("insideStartTop"), value: "insideStartTop" },
  { label: getLanguageLabel("insideStartBottom"), value: "insideStartBottom" },
  { label: getLanguageLabel("insideMiddleTop"), value: "insideMiddleTop" },
  { label: getLanguageLabel("insideEndTop"), value: "insideEndTop" },
  { label: getLanguageLabel("insideEndBottom"), value: "insideEndBottom" },
];

export const ThresholdCustomizer: React.FC<IThresholdCustomizer> = ({
  name,
}) => {
  const { customizeForm, query, customize, data } = useSelector(
    (state: RootState) => state.kepler
  );

  const skeleton = useMemo(
    () => chartConfig[query?.chartType],
    [query?.chartType]
  );

  const seriesOptions: { label: string; value: any }[] = useMemo(() => {
    let options: { label: string; value: any }[] = [
      {
        label: "No Value",
        value: null,
      },
    ];

    data?.payload?.data?.series?.forEach((series: any) => {
      if (isDefined(series.seriesData)) {
        Object.keys(series.seriesData)
          .sort()
          .map((props) => {
            options.push({
              label: props,
              value: props,
            });
          });
      }
    });

    return options;
  }, [data]);

  if (!customize?.showSum && query?.chartType === "pieChart") {
    return <></>;
  }

  return (
    <MtdCollapse
      header={
        <div className="query_item__heading">
          {getLanguageLabel("threshold")}
        </div>
      }
      collapsible="HEADER"
      key="thresholdCustomizerCollapse"
    >
      <>
        {["treeMapChart", "pieChart", "bigNumber"] && (
          <Form.Item
            label={getLanguageLabel("operator")}
            name={"thresholdOperator"}
          >
            <Select
              options={[
                {
                  label: getLanguageLabel("lessThanEqual") + "<=",
                  value: "lte",
                },
                {
                  label: getLanguageLabel("greaterThanEqual") + " >=",
                  value: "gte",
                },
              ]}
              // style={{ width: "100%" }}
            />
          </Form.Item>
        )}
        <Form.List name={`${name}Threshold`}>
          {(fields, { add, remove }) => {
            const sortedFileds = [...fields].sort((a, b) =>
              customizeForm.getFieldValue([
                `${name}Threshold`,
                a.name,
                "thresholdValue",
              ]) >
              customizeForm.getFieldValue([
                `${name}Threshold`,
                b.name,
                "thresholdValue",
              ])
                ? 1
                : -1
            );

            return (
              <div className="thresHoldCustomizer">
                {sortedFileds?.map((field: any, index: number) => {
                  const currrentThreshold = customizeForm.getFieldValue([
                    `${name}Threshold`,
                    field.name,
                  ]);
                  let thresholdName =
                    getLanguageLabel("threshold") + ` ${fields.length - index}`;
                  if (
                    isDefined(currrentThreshold.thresholdType) &&
                    isDefined(currrentThreshold.series)
                  ) {
                    thresholdName = `${currrentThreshold.thresholdType.toUpperCase()} ( ${
                      currrentThreshold.series
                    } )`;
                  } else if (isDefined(currrentThreshold.thresholdValue)) {
                    thresholdName = `${getThresholdLabel(
                      query?.chartType,
                      customize.thresholdOperator
                    )} ${currrentThreshold.thresholdValue}`;
                  }

                  return (
                    <MtdCollapse
                      key={`${field.name}Threshold`}
                      collapsible="HEADER"
                      sections={
                        skeleton.meta.threshold !== "LABELED"
                          ? "BODY"
                          : "COLLAPSE"
                      }
                      defaultCollpased={false}
                      header={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>{thresholdName}</div>
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
                      <>
                        {skeleton.meta.threshold === "LABELED" && (
                          <>
                            <Form.Item
                              style={{ width: "100%" }}
                              label={"Preset Thresholds"}
                            >
                              <Space.Compact style={{ width: "100%" }}>
                                <Form.Item
                                  style={{ width: "100%" }}
                                  name={[field.name, "series"]}
                                >
                                  <Select options={seriesOptions} />
                                </Form.Item>
                                <Form.Item
                                  style={{ width: "100%" }}
                                  name={[field.name, "thresholdType"]}
                                >
                                  <Select
                                    options={[
                                      {
                                        label: getLanguageLabel("min"),
                                        value: "min",
                                      },
                                      {
                                        label: getLanguageLabel("avg"),
                                        value: "average",
                                      },
                                      {
                                        label: getLanguageLabel("median"),
                                        value: "median",
                                      },
                                      {
                                        label: getLanguageLabel("max"),
                                        value: "max",
                                      },
                                    ]}
                                  />
                                </Form.Item>
                              </Space.Compact>
                            </Form.Item>
                            <Form.Item
                              label={getLanguageLabel("lineWidth")}
                              style={{ width: "100%" }}
                              name={[field.name, "lineWidth"]}
                            >
                              <InputNumber min={0} />
                            </Form.Item>
                          </>
                        )}
                        <Form.Item
                          style={{ width: "100%" }}
                          label={getThresholdLabel(
                            query?.chartType,
                            customize.thresholdOperator
                          )}
                        >
                          <Space.Compact style={{ width: "100%" }}>
                            <Form.Item
                              style={{ width: "100%" }}
                              name={[field.name, "thresholdValue"]}
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                disabled={
                                  !isEmpty(currrentThreshold.series) &&
                                  !isEmpty(currrentThreshold.thresholdType)
                                }
                              />
                            </Form.Item>
                            <Form.Item
                              name={[field.name, "color"]}
                              getValueFromEvent={(color) => {
                                const hexColor = color.toHex();
                                return hexColor === "00000000"
                                  ? undefined
                                  : "#" + hexColor;
                              }}
                            >
                              <ColorPicker
                                disabledAlpha
                                format="rgb"
                                presets={[
                                  {
                                    label: getLanguageLabel("recommended"),
                                    colors: KeplerConfig.colorPickerPreset,
                                  },
                                ]}
                              />
                            </Form.Item>
                            {skeleton.meta.threshold !== "LABELED" && (
                              <div
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "start",
                                  paddingTop: "7px",
                                }}
                                className="seriesHeader-closeIcon"
                                onClick={() => {
                                  remove(field.name);
                                }}
                              >
                                <CrossIcon />
                              </div>
                            )}
                          </Space.Compact>
                        </Form.Item>
                        {skeleton.meta.threshold === "LABELED" && (
                          <MtdCollapse
                            collapsible={
                              currrentThreshold?.showThresholdLabel
                                ? "HEADER"
                                : "DISABLED"
                            }
                            header={
                              <Form.Item
                                name={[field.name, "showThresholdLabel"]}
                                valuePropName="checked"
                                label={getLanguageLabel("label")}
                              >
                                <Switch size={"small"} />
                              </Form.Item>
                            }
                            key="thresholdLabelCollapse"
                          >
                            <>
                              <Form.Item
                                label={getLanguageLabel("name")}
                                name={[field.name, "name"]}
                                style={{ width: "100%" }}
                              >
                                <MtdInput />
                              </Form.Item>
                              <Form.Item
                                label={"Position"}
                                name={[field.name, "thresholdLabelPosition"]}
                                style={{ width: "100%" }}
                              >
                                <Select options={labelPositionOptions} />
                              </Form.Item>
                              <Form.Item
                                label={"Distance"}
                                name={[field.name, "thresholdLabelDistance"]}
                              >
                                <InputNumber min={10} />
                              </Form.Item>
                              <FontCustomizer
                                series={[field.name]}
                                name={"threshold"}
                                hasFormatter={true}
                              />
                            </>
                          </MtdCollapse>
                        )}
                      </>
                    </MtdCollapse>
                  );
                })}
                <KeplerTransparentButton
                  label={getLanguageLabel("addThreshold")}
                  onClick={() =>
                    add({
                      ...defaultThresholdCustomize,
                    })
                  }
                  style={{ width: "100%" }}
                />
              </div>
            );
          }}
        </Form.List>
      </>
    </MtdCollapse>
  );
};
