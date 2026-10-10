import { Collapse, ColorPicker, Form, InputNumber, Select, Switch } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { updateCustomize } from "../../../../redux/actions/keplerActions";
import { KeplerConfig, chartConfig } from "../charts.config";
import { LabelCustomizer } from "./LabelCustomizer";

const { Panel } = Collapse;

interface ISeriesCustomizer {
  chartType: string;
}

export const SeriesCutomizer: React.FC<ISeriesCustomizer> = ({ chartType }) => {
  const defaultCustomize = useSelector(
    (state: RootState) => state.kepler.customize
  );
  const seriesCustomizeValue = defaultCustomize.seriesCustomize;
  const colorScheme = defaultCustomize.colorScheme;

  const querySkeleton = chartConfig[chartType];

  const dispatch = useDispatch();
  return (
    <Form.List name="seriesCustomize">
      {(fields) => (
        <>
          {fields?.map((field: any, index: number) => {
            const seriesCustomize = seriesCustomizeValue[index];

            if (seriesCustomize && seriesCustomize.seriesType) {
              return (
                <MtdCollapse
                  collapsible="HEADER"
                  header={
                    <div className="query_item__heading">
                      {querySkeleton?.customization?.header
                        ? getLanguageLabel(querySkeleton?.customization?.header)
                        : seriesCustomize?.seriesName}
                    </div>
                  }
                  key={`series-${index}_CustomizerPanel`}
                >
                  <>
                    <Form.Item name={[field.name, "seriesName"]} hidden>
                      <MtdInput />
                    </Form.Item>
                    <Form.Item name={[field.name, "seriesType"]} hidden>
                      <MtdInput />
                    </Form.Item>
                    <>
                      {/* LINE CHART OPTIONS */}
                      {chartType === "VerticalAxisChart" &&
                        seriesCustomize.seriesType === "lineChart" && (
                          <Form.Item
                            name={[field.name, "lineChartStyle"]}
                            label={getLanguageLabel("lineChartStyle")}
                          >
                            <Select
                              placeholder="Select a line Style"
                              options={[
                                {
                                  label: getLanguageLabel("linear"),
                                  value: "linear",
                                },
                                {
                                  label: "Smooth",
                                  value: "smooth",
                                },
                                {
                                  label: getLanguageLabel("stepBefore"),
                                  value: "start",
                                },
                                {
                                  label: getLanguageLabel("middle"),
                                  value: "middle",
                                },
                                {
                                  label: getLanguageLabel("stepAfter"),
                                  value: "end",
                                },
                              ]}
                            />
                          </Form.Item>
                        )}
                      {/* BAR CHART OPTIONS */}
                      {((chartType === "VerticalAxisChart" &&
                        seriesCustomize.seriesType === "barChart") ||
                        chartType === "horizontalBarChart") && (
                        <>
                          <Form.Item
                            name={[field.name, "stackedBars"]}
                            valuePropName="checked"
                            label={getLanguageLabel("stackedBars")}
                          >
                            <Switch size={"small"} />
                          </Form.Item>
                        </>
                      )}
                      {/* Scatter CHART OPTIONS */}
                      {chartType === "VerticalAxisChart" &&
                        seriesCustomize.seriesType === "scatterChart" && (
                          <>
                            <Form.Item
                              name={[field.name, "symbolSize"]}
                              label={getLanguageLabel("symbolSize")}
                            >
                              <InputNumber
                                placeholder="Input a number"
                                style={{ width: "100%" }}
                                min={1}
                              />
                            </Form.Item>
                            <Form.Item
                              name={[field.name, "symbol"]}
                              label={getLanguageLabel("symbol")}
                            >
                              <Select
                                options={[
                                  {
                                    label: getLanguageLabel("circle"),
                                    value: "circle",
                                  },
                                  {
                                    label: getLanguageLabel("rectangle"),
                                    value: "rect",
                                  },
                                  {
                                    label: getLanguageLabel("roundRectangle"),
                                    value: "roundRect",
                                  },
                                  {
                                    label: getLanguageLabel("triangle"),
                                    value: "triangle",
                                  },
                                  {
                                    label: getLanguageLabel("diamond"),
                                    value: "diamond",
                                  },
                                  {
                                    label: getLanguageLabel("pin"),
                                    value: "pin",
                                  },
                                  {
                                    label: getLanguageLabel("arrow"),
                                    value: "arrow",
                                  },
                                ]}
                              />
                            </Form.Item>
                          </>
                        )}

                      {/* Label Customizer */}
                      <LabelCustomizer series={field.name} />

                      {/* COLOR SCHEME PER SERIES */}
                      {colorScheme[seriesCustomize.id] && (
                        <div className="customizer-subHeader">
                          <MtdCollapse
                            collapsible="HEADER"
                            header={
                              <div className="query_item__heading">
                                {getLanguageLabel("colorAndLabels")}
                              </div>
                            }
                            key={`color${index}Panel`}
                          >
                            <>
                              {Object.keys(colorScheme[seriesCustomize.id]).map(
                                (item: string) => (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                    }}
                                  >
                                    <ColorPicker
                                      disabledAlpha
                                      value={
                                        colorScheme[seriesCustomize.id][item]
                                      }
                                      onChange={(value, hex) => {
                                        dispatch(
                                          updateCustomize({
                                            colorTheme: "custom",
                                            colorScheme: {
                                              ...colorScheme,
                                              [seriesCustomize.id]: {
                                                ...colorScheme[
                                                  seriesCustomize.id
                                                ],
                                                [item]: hex,
                                              },
                                            },
                                          })
                                        );
                                      }}
                                      format="rgb"
                                      presets={[
                                        {
                                          label:
                                            getLanguageLabel("recommended"),
                                          colors:
                                            KeplerConfig.colorPickerPreset,
                                        },
                                      ]}
                                    />
                                    <MtdInput
                                      defaultValue={
                                        defaultCustomize?.customLabel?.[item] ??
                                        item
                                      }
                                      debounceInterval={1000}
                                      onChange={(e) => {
                                        if (
                                          isDefined(e.target.value) &&
                                          e.target.value.length > 0
                                        ) {
                                          dispatch(
                                            updateCustomize({
                                              customLabel: {
                                                ...defaultCustomize.customLabel,
                                                [item]: e.target.value,
                                              },
                                            })
                                          );
                                        }
                                      }}
                                    />
                                  </div>
                                )
                              )}
                            </>
                          </MtdCollapse>
                        </div>
                      )}
                    </>
                  </>
                </MtdCollapse>
              );
            }
          })}
        </>
      )}
    </Form.List>
  );
};
