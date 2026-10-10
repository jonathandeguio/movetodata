import { KeplerConfig } from "Apps/Kepler/chart/charts.config";
import { ColorPicker } from "antd";
import React, { useState } from "react";
import { getLanguageLabel } from "utils/utilities";
import { TrashIcon } from "../../../../assets/icons/mtdMiscellaneousIcons";
import styles from "./DashboardElements.module.scss";
interface Props {
  dashboardId: string;
  layout: any;
  element: any;
  editable: boolean;
  removeElement: any;
  tabId: string;
  updateTabElement: (
    elementId: string,
    elementType: string,
    data: string
  ) => void;
}

const DividerElement = (props: Props) => {
  const [dividerColor, setDividerColor] = useState(props.element.data);

  const updateDividerColor = (color: string) => {
    props.updateTabElement(props.element.id, props.element.type, color);
  };

  return (
    <div
      className={
        props.editable
          ? "dividerElement editableElementBorder"
          : "dividerElement nonEditableElementBorder"
      }
    >
      <div
        className={styles.dividerElement}
        style={{
          height: props.editable ? "100%" : "100%",
          background: dividerColor,
        }}
      ></div>
      {props.editable && (
        <>
          <div
            className="editableElementBorder-dividerdelete"
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
          <div
            className="editableElementBorder-dividerColor"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <ColorPicker
              disabledAlpha
              value={dividerColor}
              size="small"
              presets={[
                {
                  label: getLanguageLabel("recommended"),
                  colors: KeplerConfig.colorPickerPreset,
                },
              ]}
              onChange={(value: any, hex: string) => {
                updateDividerColor(hex);
                setDividerColor(hex);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DividerElement;
