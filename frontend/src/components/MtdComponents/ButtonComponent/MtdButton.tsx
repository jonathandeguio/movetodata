import { Button, Dropdown, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import { isDefined } from "utils/utilities";
import { SingleChevronDownIcon } from "../../../assets/icons/mtdNavigationIcon";
import "./ButtonComponent.scss";

const INTENT_COLOR = "var(--INTENT_COLOR)";
const INTENT_COLOR_FONT = "var(--INTENT_COLOR_FONT)";
const INTENT_COLOR_BORDER = "var(--movetodata-border-color-default)";

const PRIMARY_COLOR = "var(--PRIMARY_COLOR)";
const PRIMARY_COLOR_BORDER = "var(--PRIMARY_COLOR_BORDER)";
const PRIMARY_COLOR_FONT = "var(--PRIMARY_COLOR_FONT)";

const ACTION_COLOR = "var(--ACTION_COLOR)";
const ACTION_COLOR_BORDER = "var(--ACTION_COLOR_BORDER)";
const ACTION_COLOR_FONT = "var(--ACTION_COLOR_FONT)";

const SUCCESS_COLOR = "var(--SUCCESS_COLOR)";
const SUCCESS_COLOR_BORDER = "var(--SUCCESS_COLOR_BORDER)";
const SUCCESS_COLOR_FONT = "var(--SUCCESS_COLOR_FONT)";

const DANGEROUS_COLOR = "var(--DANGEROUS_COLOR)";
const DANGEROUS_COLOR_BORDER = "var(--DANGEROUS_COLOR_BORDER)";
const DANGEROUS_COLOR_FONT = "var(--DANGEROUS_COLOR_FONT)";

const WARNING_COLOR = "var(--WARNING_COLOR)";
const WARNING_COLOR_BORDER = "var(--WARNING_COLOR_BORDER)";
const WARNING_COLOR_FONT = "var(--WARNING_COLOR_FONT)";

export type TMtdButtonTextTransform =
  | "none"
  | "capitalize"
  | "uppercase"
  | "lowercase"
  | "full-width"
  | "full-size-kana";

export type TMtdButtonIntent =
  | "none"
  | "primary"
  | "action"
  | "warning"
  | "dangerous"
  | "success";
interface btnProps {
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  minimal?: boolean;
  outlined?: boolean;
  fill?: boolean;
  icononly?: boolean;
  dashed?: boolean;
  trimicononlypadding?: boolean;
  borderless?: boolean;
  alignText?: "left" | "center" | "right";
  size?: "small" | "middle" | "large";
  intent?: TMtdButtonIntent;
  actionIcon?: any;
  children?: any;
  icon?: any;
  onClickActionIcon?: any;
  onClick?: any;
  onClickMenuItem?: any;
  // For popover and tooltip
  onMouseEnter?: any;
  onMouseLeave?: any;
  // For tooltip incase of icononly
  parentOnMouseEnter?: any;
  parentOnMouseLeave?: any;
  // For form submit button
  htmlType?: any;
  menuItems?: any;
  style?: any;
  iconColor?: any;
  id?: string;
  textTransform?: TMtdButtonTextTransform;
  autoFocus?: boolean;
}
type buttonTypes =
  | "link"
  | "text"
  | "primary"
  | "ghost"
  | "default"
  | "dashed"
  | undefined;

const CustomButton = ({
  active = false,
  disabled = false,
  loading = false,
  minimal = false,
  outlined = false,
  fill = false,
  icononly = false,
  dashed = false,
  borderless = false,
  trimicononlypadding = false,
  alignText = "center",
  size = "middle",
  intent = "none",
  actionIcon,
  icon,
  children,
  onClickActionIcon,
  onClick,
  onClickMenuItem,
  onMouseEnter,
  onMouseLeave,
  parentOnMouseEnter,
  parentOnMouseLeave,
  htmlType,
  menuItems,
  style,
  iconColor,
  id,
  textTransform = "capitalize",
  autoFocus = false,
}: btnProps) => {
  const getType = () => {
    if (outlined) {
      return "default";
    } else if (minimal) {
      return "text";
    } else if (dashed) {
      return "dashed";
    } else {
      return "primary";
    }
    return undefined;
  };

  const getColor = () => {
    if (minimal || outlined || dashed) {
      if (intent == "none") {
        return INTENT_COLOR_FONT;
      } else if (intent == "primary") {
        return PRIMARY_COLOR;
      } else if (intent == "action") {
        return ACTION_COLOR;
      } else if (intent == "success") {
        return SUCCESS_COLOR;
      } else if (intent == "dangerous") {
        return DANGEROUS_COLOR;
      } else if (intent == "warning") {
        return WARNING_COLOR;
      }
    }
    if (intent == "none") {
      return INTENT_COLOR_FONT;
    } else if (intent == "primary") {
      return PRIMARY_COLOR_FONT;
    } else if (intent == "action") {
      return ACTION_COLOR_FONT;
    } else if (intent == "success") {
      return SUCCESS_COLOR_FONT;
    } else if (intent == "dangerous") {
      return DANGEROUS_COLOR_FONT;
    } else if (intent == "warning") {
      return WARNING_COLOR_FONT;
      // return "var(--movetodata-font-color-default)";
    }
  };

  const getBgColor = () => {
    if (autoFocus) return "var(--movetodata-hover-color)";
    if (minimal || outlined || dashed) return "";

    if (intent == "none") {
      return INTENT_COLOR;
    } else if (intent == "primary") {
      return PRIMARY_COLOR;
    } else if (intent == "action") {
      return ACTION_COLOR;
    } else if (intent == "success") {
      return SUCCESS_COLOR;
    } else if (intent == "dangerous") {
      return DANGEROUS_COLOR;
    } else if (intent == "warning") {
      return WARNING_COLOR;
    }
  };

  const getBorderColor = () => {
    if (minimal) {
      return "";
    } else if (borderless) {
      return "";
    }
    if (intent == "none") {
      return INTENT_COLOR_BORDER;
    } else if (intent == "primary") {
      return PRIMARY_COLOR_BORDER;
    } else if (intent == "action") {
      return ACTION_COLOR_BORDER;
    } else if (intent == "success") {
      return SUCCESS_COLOR_BORDER;
    } else if (intent == "dangerous") {
      return DANGEROUS_COLOR_BORDER;
    } else if (intent == "warning") {
      return WARNING_COLOR_BORDER;
    }
  };

  let padding = "0 10px";
  if (menuItems) {
    padding = "0 0 0 10px";
  }
  if (icononly && trimicononlypadding) {
    padding = "0";
  }

  return (
    // Hack: Added extra div to make tooltip appear on disabled button
    <div
      style={{
        width: fill ? "auto" : "fit-content",
        display: "flex",
        justifyContent: "center",
      }}
      onMouseEnter={parentOnMouseEnter ? parentOnMouseEnter : onMouseEnter}
      onMouseLeave={parentOnMouseLeave ? parentOnMouseLeave : onMouseLeave}
    >
      <Button
        type={getType()}
        loading={loading}
        size={size}
        className="mtdButton"
        style={{
          opacity: disabled ? "0.65" : "1",
          padding: padding, // icononly && trimicononlypadding ? "0" : "0 10px",
          // paddingRight: menuItems ? "0" : "auto",
          borderRadius: "3px",
          width: fill ? "100%" : "auto",
          textAlign: alignText,
          color: getColor(),
          background: getBgColor(),
          borderColor: getBorderColor(),
          justifyContent: alignText,
          textTransform: textTransform,
          ...style,
        }}
        onClick={onClick}
        disabled={disabled}
        icon={
          icon &&
          React.cloneElement(icon, {
            color: iconColor ? iconColor : getColor(),
          })
        }
        onMouseEnter={parentOnMouseEnter ? parentOnMouseEnter : onMouseEnter}
        onMouseLeave={parentOnMouseLeave ? parentOnMouseLeave : onMouseLeave}
        htmlType={htmlType}
        id={id}
      >
        {/* <div className="mtdButton-children"> */}
        {!icononly && (
          <div style={{ margin: "0 5px 0 0", overflow: "auto" }}>
            {children}
          </div>
        )}
        {actionIcon && (
          <div
            className="text-and-icon-center mtdButton-actionIcon"
            onClick={onClickActionIcon}
          >
            {React.cloneElement(actionIcon, {
              color: iconColor ? iconColor : getColor(),
            })}
          </div>
        )}
        {menuItems && (
          <div className="text-and-icon-center mtdButton-actionIcon">
            <Dropdown
              menu={{ items: menuItems, onClick: onClickMenuItem }}
              // placement="topLeft"
              arrow
              trigger={["click"]}
            >
              <MtdButton
                icononly={true}
                intent="none"
                minimal
                icon={<SingleChevronDownIcon />}
                iconColor={getColor()}
                trimicononlypadding={true}
                onClick={(e: any) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  backgroundColor: minimal ? "none" : "rgba(0, 0, 0, 0.025)",
                  border: "none",
                  borderRadius: "0",
                }}
              ></MtdButton>
            </Dropdown>
          </div>
        )}
        {/* </div> */}
      </Button>
    </div>
  );
};
const MtdButton: React.FC<btnProps> = ({
  active = false,
  disabled = false,
  loading = false,
  minimal = false,
  outlined = false,
  fill = false,
  icononly = false,
  dashed = false,
  borderless = false,
  trimicononlypadding = false,
  alignText = "center",
  size = "middle",
  intent = "none",
  actionIcon,
  icon,
  children,
  onClickActionIcon,
  onClick,
  onClickMenuItem,
  onMouseEnter,
  onMouseLeave,
  htmlType,
  menuItems,
  style,
  iconColor,
  id,
  textTransform = "capitalize",
  autoFocus = false,
}: btnProps) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (windowWidth < 1024 && isDefined(icon)) {
    icononly = true;
  }

  if (icononly && children) {
    let parentOnMouseEnter = onMouseEnter;
    let parentOnMouseLeave = onMouseLeave;

    return (
      <Tooltip title={children}>
        <CustomButton
          {...{
            active,
            disabled,
            loading,
            minimal,
            outlined,
            fill,
            icononly,
            dashed,
            borderless,
            trimicononlypadding,
            alignText,
            size,
            intent,
            actionIcon,
            icon,
            children,
            onClickActionIcon,
            onClick,
            onClickMenuItem,
            onMouseEnter,
            onMouseLeave,
            parentOnMouseEnter,
            parentOnMouseLeave,
            htmlType,
            menuItems,
            style,
            iconColor,
            id,
            textTransform,
            autoFocus,
          }}
        />
      </Tooltip>
    );
  }

  return (
    <CustomButton
      {...{
        active,
        disabled,
        loading,
        minimal,
        outlined,
        fill,
        icononly,
        dashed,
        borderless,
        trimicononlypadding,
        alignText,
        size,
        intent,
        actionIcon,
        icon,
        children,
        onClickActionIcon,
        onClick,
        onClickMenuItem,
        onMouseEnter,
        onMouseLeave,
        htmlType,
        menuItems,
        style,
        iconColor,
        id,
        textTransform,
        autoFocus,
      }}
    />
  );
};

export default MtdButton;
