import { Form, Input, Typography } from "antd";
import { AddIcon, CrossIcon } from "assets/icons/mtdActionIcons";
import React from "react";
import { getLanguageLabel, openNotification } from "utils/utilities";
import ColumnSelect from "./ColumnSelect";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";

const { Text } = Typography;

export const ParameterController = () => {
  return (
    <Form.List name="parameters">
      {(fields, { add, remove }) => {
        return (
          <>
            {fields.map((field) => {
              return (
                <>
                  <MtdCollapse
                    collapsible="HEADER"
                    key="parameterController"
                    defaultCollpased={false}
                    header={
                      <div className="flex" style={{ alignItems: "center" }}>
                        <Form.Item
                          style={{ width: "100%" }}
                          name={[field.name, "label"]}
                        >
                          <MtdInput
                            editText
                            debounceInterval={1000}
                            variant={"borderless"}
                            style={{ borderRadius: 0 }}
                          />
                        </Form.Item>
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            remove(field.name);
                          }}
                        >
                          <CrossIcon />
                        </div>
                      </div>
                    }
                  >
                    <div
                      className="flex"
                      style={{ alignItems: "center", width: "100%" }}
                    >
                      <ColumnSelect
                        name={[field.name, "column"]}
                        listName={"series"}
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
                      />
                    </div>
                  </MtdCollapse>
                </>
              );
            })}
            <div className="flexEnd">
              <div
                className={`KeplerTransparentdiv text-and-icon-center ${
                  fields.length >= 5 ? "KeplerTransparentdiv--not_allowed" : ""
                }`}
                onClick={() => {
                  if (fields.length >= 5) {
                    openNotification(
                      getLanguageLabel("unsupported"),
                      getLanguageLabel("seriesLimitExceeded"),
                      "warning"
                    );
                  } else {
                    add({
                      label: "label",
                      column: undefined,
                      multiselect: undefined,
                    });
                  }
                }}
              >
                <AddIcon />
                {/* {getLanguageLabel("parameter")} */}
              </div>
            </div>
          </>
        );
      }}
    </Form.List>
  );
};
