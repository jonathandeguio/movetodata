import { DatasetColumn } from "Apps/Kepler/kepler";
import { Form, Select, Tooltip, Typography } from "antd";
import { HelpIcon } from "assets/icons/mtdMiscellaneousIcons";
import React, { useState } from "react";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { KeplerConfig } from "../charts.config";
import {
  SortingIconAscending,
  SortingIconDescending,
  getTimeGrainOptions,
} from "../charts.utils";
import ColumnSelect from "./ColumnSelect";
const { Title, Text } = Typography;

interface Props {
  Type: any;
  Columns: any;
  form: any;
  chartType: string;
}

const XAxisController: React.FC<Props> = (props) => {
  const [column, setColumn] = useState<DatasetColumn | undefined>(undefined);
  const isTimeColumn =
    isDefined(column) && KeplerConfig.timeColumnDataTypes.includes(column.type);

  return (
    <>
      {/* Column Value for X Axis*/}
      <ColumnSelect
        name={props.Type}
        rules={[
          {
            required: true,
            message: (
              <>
                <Text
                  type="danger"
                  style={{
                    fontSize: "10px",
                    color: "var(--movetodata-intent-danger)",
                  }}
                >
                  X-Axis is required!
                </Text>
              </>
            ),
          },
        ]}
        onSelect={setColumn}
      />

      {/* Time Grain */}
      {isTimeColumn && (
        <div className="metric-subItem">
          <div className="metric-subItem-left">
            <Tooltip title={getLanguageLabel("timeUnitsOption")}>
              <div className="text-and-icon-center">
                {getLanguageLabel("timeUnit")}
                <HelpIcon />
              </div>
            </Tooltip>
          </div>
          <div className="metric-subItem-right">
            <Form.Item
              name={`${props.Type}TimeGrain`}
              style={{ width: "100%" }}
            >
              <Select
                placeholder={`${getLanguageLabel("select")} ${getLanguageLabel(
                  "timeGrain"
                )}`}
                style={{
                  zIndex: "100",
                  fontSize: "12px",
                }}
                popupMatchSelectWidth={false}
                variant={"borderless"}
                options={getTimeGrainOptions()}
              />
            </Form.Item>
          </div>
        </div>
      )}

      {/* Sorting Value */}
      {isDefined(column) && (
        <div className="metric-subItem">
          <div className="metric-subItem-left">{getLanguageLabel("sort")}</div>
          <div className="metric-subItem-right">
            <Form.Item name={`${props.Type}Sort`}>
              <Select
                style={{ fontSize: "12px" }}
                variant={"borderless"}
                popupMatchSelectWidth={false}
                options={[
                  {
                    value: "asc",
                    label: (
                      <div
                        className="text-and-icon-center"
                        style={{
                          fontSize: "12px",
                          color: "rgb(113, 122, 148)",
                          height: "100%",
                        }}
                      >
                        <SortingIconAscending type={column.type} />{" "}
                        {getLanguageLabel("sortAscending")}
                      </div>
                    ),
                  },
                  {
                    value: "desc",
                    label: (
                      <div
                        className="text-and-icon-center"
                        style={{
                          fontSize: "12px",
                          color: "rgb(113, 122, 148)",
                          height: "100%",
                        }}
                      >
                        <SortingIconDescending type={column.type} />{" "}
                        {getLanguageLabel("sortDescending")}
                      </div>
                    ),
                  },
                ]}
              />
            </Form.Item>
          </div>
        </div>
      )}
    </>
  );
};

export default XAxisController;
