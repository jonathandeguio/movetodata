import { Col, Divider, Form, Row, Select, Tooltip, Typography } from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useForm } from "antd/es/form/Form";
import {
  AddIcon,
  DuplicateIcon,
  SaveIcon,
} from "assets/icons/mtdActionIcons";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { BTH1 } from "components/CommonUI/MtdTypography";
import { copyToClipboard, getLanguageLabel } from "utils/utilities";
import { updatePlatformConfig } from "../../../redux/actions/platformSettingsActions";
import { ThunkAppDispatch } from "../../../redux/types/store";
import UploadLogoButton from "../UploadLogoButton.view";
import { MtdColorPallete } from "../components/MtdColorPallete";

const { Text, Title } = Typography;
const { Option } = Select;

export const ThemeSettings = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );

  const [isUpdateButtonActive, setIsUpdateButtonActive] = useState(false);

  const [colors, setColors] = useState<any>();

  const [display, setDisplay] = useState<any>();
  const [form] = useForm();

  return (
    <div className="settings-center-block">
      <p>
        <Row>
          <Col>
            <Title level={3}>Platform customization</Title>
            <Text type="secondary">
              User can select the platform icon and theme palette
            </Text>
          </Col>
        </Row>
        <Divider />
        <Row justify="space-between">
          <Col>
            <Text>Custom Platform Name</Text>
            <br />
            <Text type="secondary">
              This Name will replace the Platform Name at all the places.
            </Text>
          </Col>
          <Col>
            <MtdInput
              value={config.platformName}
              debounceInterval={2000}
              onChange={(e) => {
                dispatch(
                  updatePlatformConfig({
                    ...config,
                    platformName: e.target.value,
                  })
                );
              }}
            />
          </Col>
        </Row>
        <br />
        <Row justify="space-between">
          <Col>
            <Text>Custom logo</Text>
            <br />
            <Text type="secondary">
              This logo will replace the MoveToData logo at all the places.
            </Text>
          </Col>
          <Col>
            <UploadLogoButton />
          </Col>
        </Row>

        <br />
        <br />

        <div style={{ marginTop: "1rem" }}>
          <Form
            form={form}
            onValuesChange={() => {
              setIsUpdateButtonActive(true);
              setColors(form.getFieldValue(["customTheme"]));
            }}
            initialValues={{
              customTheme: config?.customTheme ?? [
                {
                  name: "Custom Theme",
                  color: ["#ff00ff"],
                },
              ],
            }}
          >
            <Form.List name="customTheme">
              {(themeFields, { add, remove }) => {
                return (
                  <>
                    <Row gutter={[16, 16]} justify="start" align="middle">
                      <Col span={20}>
                        <Title level={3}>{"Color Palette"}</Title>
                        {
                          "Create your own color palette to be applied in Kepler and other places"
                        }
                      </Col>
                      <Col span={4}>
                        <MtdButton
                          intent="success"
                          icon={<AddIcon />}
                          onClick={() => {
                            add({
                              name:
                                "New Custom Theme " + (themeFields.length + 1),
                              color: ["#ff00ff"],
                            });
                          }}
                          outlined
                          borderless
                        >
                          Add Palette
                        </MtdButton>
                      </Col>
                    </Row>
                    <div className="themeBody">
                      <Row
                        style={{
                          margin: "1px",
                          padding: "5px 7px 10px 7px",
                          borderBottom:
                            "1px solid var(--movetodata-border-color-default)",
                        }}
                      >
                        <Col span={8}>
                          <BTH1>{getLanguageLabel("name").toUpperCase()}</BTH1>
                        </Col>
                        <Col span={8}>
                          <BTH1>{getLanguageLabel("color").toUpperCase()}</BTH1>
                        </Col>
                        <Col span={8}></Col>
                      </Row>

                      {themeFields.map((themeField, index) => (
                        <div key={themeField.key}>
                          <Row
                            style={{
                              borderBottom:
                                index === themeFields.length - 1
                                  ? "none"
                                  : "1px solid var(--movetodata-border-color-default)",
                            }}
                          >
                            <Col
                              span={8}
                              style={{
                                padding: "0.3rem 1rem 0.3rem 0",
                              }}
                            >
                              <Tooltip
                                title={getLanguageLabel("clickToRename")}
                              >
                                <Form.Item name={[themeField.name, "name"]}>
                                  <MtdInput
                                    style={{
                                      fontSize: "22px",
                                      fontWeight: 400,
                                      width: "100%",
                                    }}
                                    editText
                                    debounceInterval={5000}
                                    variant={"borderless"}
                                    placeholder="Enter theme name"
                                  />
                                </Form.Item>
                              </Tooltip>
                            </Col>

                            <Form.List name={[themeField.name, "color"]}>
                              {(fields, { add, remove }) => {
                                return (
                                  <>
                                    <Col span={8}>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.4rem",
                                          marginTop: "7px",
                                        }}
                                      >
                                        {fields.map((field) => (
                                          <Tooltip
                                            title={
                                              <>
                                                <DuplicateIcon />
                                                {form.getFieldValue([
                                                  "customTheme",
                                                  themeField.name,
                                                  "color",
                                                  field.name,
                                                ]) ?? "#000000"}
                                              </>
                                            }
                                          >
                                            <div
                                              onClick={() => {
                                                copyToClipboard(
                                                  form.getFieldValue([
                                                    "customTheme",
                                                    themeField.name,
                                                    "color",
                                                    field.name,
                                                  ]) ?? "#000000"
                                                );
                                              }}
                                              key={field.key}
                                              style={{
                                                cursor: "pointer",
                                                borderRadius: "3px",
                                                height: "16px",
                                                minWidth: "16px",
                                                display: "block",
                                                backgroundColor:
                                                  form.getFieldValue([
                                                    "customTheme",
                                                    themeField.name,
                                                    "color",
                                                    field.name,
                                                  ]) ?? "#000000",
                                              }}
                                            ></div>
                                          </Tooltip>
                                        ))}

                                        {fields.length > 0 && (
                                          <Tooltip
                                            title={"Click to remove colors"}
                                          >
                                            <MtdButton
                                              onClick={() => {
                                                remove(themeField.name);
                                              }}
                                              intent={"dangerous"}
                                              minimal
                                              icon={<TrashIcon size={12} />}
                                              icononly
                                              trimicononlypadding
                                            />
                                          </Tooltip>
                                        )}
                                      </div>
                                    </Col>
                                  </>
                                );
                              }}
                            </Form.List>
                            <Col span={8} style={{ marginTop: "7px" }}>
                              <Row justify={"end"} gutter={[32, 32]}>
                                <Col>
                                  <MtdButton
                                    onClick={() => {
                                      setDisplay(themeField.name);
                                    }}
                                    icon={<EditIcon />}
                                    // className="text-and-icon-center"
                                  >
                                    {getLanguageLabel("edit")}
                                  </MtdButton>
                                </Col>
                                <Col>
                                  <MtdButton
                                    intent="dangerous"
                                    onClick={() => {
                                      remove(themeField.name);
                                    }}
                                    icon={<TrashIcon />}
                                  >
                                    {getLanguageLabel("delete")}
                                  </MtdButton>
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                          {display === themeField.name && (
                            <MtdColorPallete
                              display={display}
                              setDisplay={setDisplay}
                              name={themeField.name}
                              colorValues={colors}
                              form={form}
                              setColorValues={setColors}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                );
              }}
            </Form.List>
            <Form.Item wrapperCol={{ offset: 10, span: 14 }} className="--mt10">
              <MtdButton
                disabled={!isUpdateButtonActive}
                onClick={() => {
                  dispatch(
                    updatePlatformConfig({
                      ...config,
                      customTheme: form.getFieldValue("customTheme"),
                    })
                  ).then(() => setIsUpdateButtonActive(false));
                }}
                icon={<SaveIcon />}
                intent={"action"}
              >
                Save Changes
              </MtdButton>
            </Form.Item>
          </Form>
        </div>
      </p>
    </div>
  );
};
