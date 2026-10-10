import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { ObjectKeys, getLanguageLabel } from "utils/utilities";
import { updateCustomize } from "../../../../redux/actions/keplerActions";
import { ColorBlock } from "../components/legend/SubComponents";

export const ChartLabelCustomizer = () => {
  const { customize, query } = useSelector((state: RootState) => state.kepler);
  const dispatch = useDispatch();

  return (
    <MtdCollapse
      key={`customize_name`}
      collapsible="HEADER"
      header={getLanguageLabel("labels")}
    >
      {customize.seriesCustomize.map((series: any) => {
        const seriesId =
          query.chartType === "pieChart" ? "pieChart" : series.id;
        return (
          <>
            <MtdCollapse
              key={`customize_${series.id}`}
              collapsible="HEADER"
              header={series.seriesName}
            >
              <div
                className="flex"
                style={{
                  gap: "0.5rem",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                {ObjectKeys(customize.colorScheme[seriesId]).map(
                  (label: any) => (
                    <div
                      className="flex"
                      style={{ alignItems: "center", gap: "0.5rem" }}
                    >
                      <ColorBlock
                        color={customize.colorScheme[seriesId][label]}
                        dim="0.9rem"
                      />
                      <MtdInput
                        defaultValue={label}
                        debounceInterval={1000}
                        onChange={(e) => {
                          dispatch(
                            updateCustomize({
                              customLabel: {
                                ...customize.customLabel,
                                [label]: e.target.value,
                              },
                            })
                          );
                        }}
                      />
                    </div>
                  )
                )}
              </div>
            </MtdCollapse>
          </>
        );
      })}
    </MtdCollapse>
  );
};
