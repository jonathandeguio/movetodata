import { ColorPicker } from "antd";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { updateCustomize } from "../../../../redux/actions/keplerActions";
import { KeplerConfig } from "../charts.config";

export const ColorCustomizer = () => {
  const customize = useSelector((state: RootState) => state.kepler.customize);

  const dispatch = useDispatch();

  return (
    <>
      {customize?.colorScheme &&
        Object.keys(customize.colorScheme).map((cSeries: string) => (
          <div className="customizer-subHeader">
            <MtdCollapse
              collapsible="HEADER"
              header={
                <div className="query_item__heading">
                  {getLanguageLabel("colorAndLabels")}
                </div>
              }
              key={`color${cSeries}Panel`}
            >
              <>
                {Object.keys(customize.colorScheme[cSeries]).map(
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
                        value={customize.colorScheme[cSeries][item]}
                        onChange={(value, hex) => {
                          dispatch(
                            updateCustomize({
                              colorTheme: "custom",
                              colorScheme: {
                                ...customize.colorScheme,
                                [cSeries]: {
                                  ...customize.colorScheme[cSeries],
                                  [item]: hex,
                                },
                              },
                            })
                          );
                        }}
                        format="rgb"
                        presets={[
                          {
                            label: getLanguageLabel("recommended"),
                            colors: KeplerConfig.colorPickerPreset,
                          },
                        ]}
                      />

                      <MtdInput
                        defaultValue={customize?.customLabel?.[item] ?? item}
                        debounceInterval={1000}
                        onChange={(e) => {
                          if (
                            isDefined(e.target.value) &&
                            e.target.value.length > 0
                          ) {
                            dispatch(
                              updateCustomize({
                                customLabel: {
                                  ...customize.customLabel,
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
        ))}
    </>
  );
};
