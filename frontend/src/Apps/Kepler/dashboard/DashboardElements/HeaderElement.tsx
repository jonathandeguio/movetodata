import { Dropdown, Popover, Space, Tooltip } from "antd";
import React, { useState } from "react";

import { SettingsIcon } from "assets/icons/mtdActionIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { useAutoSaveReady } from "components/VersionHistory/hooks/setAutoSaveReady";

import { getLanguageLabel } from "utils/utilities";
import { TrashIcon } from "../../../../assets/icons/mtdMiscellaneousIcons";
import { SingleChevronDownIcon } from "../../../../assets/icons/mtdNavigationIcon";
import { updateTabElementAPI } from "../Dashboard.api";
import {
  fontBackgroundItems,
  fontWeightItems,
  getHeaderBackground,
  getHeaderFont,
} from "../Dashboard.utils";
// import { fontBackgroundItems, fontWeightItems } from "../Dashboard.utils";

const { EditText } = require("react-edit-text");
interface Props {
  dashboardId: string;
  layout: any;
  element: any;
  editable: boolean;
  removeElement: any;
  tabId: string;
}

const HeaderElement = (props: Props) => {
  /**
   * Configs
   */

  const defaultFontWeight = JSON.parse(JSON.parse(props.element.data)).fontSize;
  const defaultBackgroundColor = JSON.parse(
    JSON.parse(props.element.data)
  ).backgroundColor;
  const defaultHeading = JSON.parse(JSON.parse(props.element.data)).heading;

  const [headingText, setHeadingText] = useState(defaultHeading);
  const [fontWeight, setFontWeight] = useState(defaultFontWeight);
  const [backgroundColor, setBackgroundColor] = useState(
    defaultBackgroundColor
  );
  const setAutoSaveReady = useAutoSaveReady();
  const FONT_SIZE = getHeaderFont(fontWeight);
  const BACKGROUND_COLOR = getHeaderBackground(backgroundColor);
  const HEADING_TEXT =
    headingText === "" ? getLanguageLabel("editHeading") : headingText;

  const onClickUpdateHeader = (key: any, updateType: string) => {
    const payload = [
      {
        dashboardId: props.dashboardId,
        elementId: props.element.id,
        type: props.element.type,
        data: JSON.stringify(
          JSON.stringify({
            heading: headingText,
            fontSize: updateType == "font" ? key : fontWeight,
            backgroundColor: updateType == "background" ? key : backgroundColor,
          })
        ),
        tabId: props.tabId,
      },
    ];

    setAutoSaveReady(true);
    // updateTabElementAPI(props.dashboardId, props.tabId, payload).then(() => {
    //   if (updateType == "font") {
    //     setFontWeight(key);
    //   } else if (updateType == "background") {
    //     setBackgroundColor(key);
    //   }
    // });
  };

  const saveEditedHeading = (e: any) => {
    const payload = [
      {
        elementId: props.element.id,
        type: props.element.type,
        data: JSON.stringify(
          JSON.stringify({
            heading: e.target.value,
            fontSize: fontWeight,
            backgroundColor: backgroundColor,
          })
        ),
        tabId: props.tabId,
      },
    ];

    setAutoSaveReady(true);
    updateTabElementAPI(props.dashboardId, props.tabId, payload).then(() => {
      setHeadingText(e.target.value);
    });
  };

  return (
    <div
      className={
        props.editable ? "headerElement editableElementBorder" : "headerElement"
      }
      style={{
        fontSize: FONT_SIZE,
        backgroundColor: BACKGROUND_COLOR,
        cursor: props.editable ? "move" : "pointer",
        color: "var(--PRIMARY_COLOR)",
      }}
    >
      {props.editable ? (
        <>
          <Tooltip title={getLanguageLabel("clickToRename")}>
            <MtdInput
              style={{ fontSize: "22px", fontWeight: 500 }}
              editText
              className="editText"
              debounceInterval={1000}
              onChange={saveEditedHeading}
              variant={"borderless"}
              value={headingText}
              placeholder={getLanguageLabel("editHeading")}
            />
          </Tooltip>
          <div
            className="editableElementBorder-delete"
            // In both the functions stop propagation is required
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              props.removeElement(props.dashboardId, props.element.id);
            }}
          >
            <TrashIcon />
          </div>
          <Popover
            content={
              <div className="headerElementPopover cancelSelectorName">
                <Dropdown
                  menu={{
                    items: fontWeightItems,
                    onClick: (key) => onClickUpdateHeader(key.key, "font"),
                  }}
                >
                  <a onClick={(e) => e.stopPropagation()}>
                    <Space>
                      {(fontWeightItems[Number(fontWeight) - 1] as any).label}
                      <SingleChevronDownIcon />
                    </Space>
                  </a>
                </Dropdown>

                <Dropdown
                  menu={{
                    items: fontBackgroundItems,
                    onClick: (key) =>
                      onClickUpdateHeader(key.key, "background"),
                  }}
                >
                  <a onClick={(e) => e.stopPropagation()}>
                    <Space>
                      {
                        (
                          fontBackgroundItems[
                            Number(backgroundColor) - 1
                          ] as any
                        ).label
                      }
                      <SingleChevronDownIcon />
                    </Space>
                  </a>
                </Dropdown>
              </div>
            }
            trigger="click"
          >
            <div
              className="editableElementBorder-setting"
              // In both the functions stop propagation is required
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <SettingsIcon />
            </div>
          </Popover>
        </>
      ) : (
        <div>{HEADING_TEXT}</div>
      )}
    </div>
  );
};

export default HeaderElement;
