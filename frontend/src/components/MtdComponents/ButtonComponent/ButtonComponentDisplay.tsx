import { MenuProps, Segmented, Select, Switch, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { SearchIcon } from "../../../assets/icons/mtdActionIcons";
import { PopOutIcon } from "../../../assets/icons/mtdNavigationIcon";
import "../ButtonComponent/ButtonComponentDisplay.scss";
import MtdButton from "./MtdButton";

const { Title, Text } = Typography;

const items: MenuProps["items"] = [
  {
    key: "1",
    label: (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://www.antgroup.com"
      >
        1st menu item
      </a>
    ),
  },
  {
    key: "2",
    label: (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://www.aliyun.com"
      >
        2nd menu item
      </a>
    ),
  },
  {
    key: "3",
    label: (
      <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://www.luohanacademy.com"
      >
        3rd menu item
      </a>
    ),
  },
];
const MtdComponentDisplay = () => {
  const DEFAULT_STATE = {};
  const [btnProps, setBtnProps] = useState<any>(DEFAULT_STATE);

  const SwitchProp = ({ name }: { name: string }) => {
    const key = name.toLowerCase();
    const isChecked = btnProps.hasOwnProperty(key) ? btnProps[key] : false;
    return (
      <div style={{ display: "flex", gap: "1rem" }}>
        <Switch
          checked={isChecked}
          onChange={(checked: boolean) => {
            setBtnProps({ ...btnProps, ...{ [key]: checked } });
          }}
        />
        <Text>{name}</Text>
      </div>
    );
  };

  useEffect(() => {}, [btnProps]);

  let buttonString = "<MtdButton icon={<SearchIcon />} ";
  let buttonStringWithActionIcon = `<MtdButton icon={<SearchIcon />} actionIcon={<PopOutIcon />}
  onClick={(e: any) => {
    
  }}
  onClickActionIcon={(e: any) => {
    e.stopPropagation();
    
  }}`;
  let buttonStringWithMenuItems =
    "<MtdButton icon={<SearchIcon />} menuItems={items} ";

  for (const prop in btnProps) {
    if (
      btnProps[prop] != false &&
      btnProps[prop] != "middle" &&
      btnProps[prop] != "center"
    ) {
      if (btnProps[prop] == true) {
        buttonString += `${prop}={${btnProps[prop]}} `;
        buttonStringWithActionIcon += `${prop}={${btnProps[prop]}} `;
        buttonStringWithMenuItems += `${prop}={${btnProps[prop]}} `;
      } else {
        buttonString += `${prop}="${btnProps[prop]}" `;
        buttonStringWithActionIcon += `${prop}="${btnProps[prop]}" `;
        buttonStringWithMenuItems += `${prop}="${btnProps[prop]}" `;
      }
    }
  }

  buttonString += "> Primary Button </MtdButton>";
  buttonStringWithActionIcon += "> Primary Button </MtdButton>";
  buttonStringWithMenuItems += "> Primary Button </MtdButton>";

  return (
    <div className="mtdComponents-buttonDisplay">
      <div className="mtdComponents-buttonDisplay-preview">
        <div className="mtdComponents-buttonDisplay-preview-screen">
          <MtdButton icon={<SearchIcon />} {...btnProps}>
            Primary
          </MtdButton>
          <MtdButton
            icon={<SearchIcon />}
            {...btnProps}
            actionIcon={<PopOutIcon />}
            onClick={(e: any) => {}}
            onClickActionIcon={(e: any) => {
              e.stopPropagation();
            }}
          >
            Primary Button
          </MtdButton>

          <MtdButton icon={<SearchIcon />} menuItems={items} {...btnProps}>
            Primary Button
          </MtdButton>
        </div>
        <Text
          code
          copyable
          className="mtdComponents-buttonDisplay-preview-code"
        >
          {buttonString}
        </Text>

        <Text
          code
          copyable
          className="mtdComponents-buttonDisplay-preview-code"
        >
          {buttonStringWithActionIcon}
        </Text>

        <Text
          code
          copyable
          className="mtdComponents-buttonDisplay-preview-code"
        >
          {buttonStringWithMenuItems}
        </Text>
      </div>
      <div className="mtdComponents-buttonDisplay-controller">
        <Title level={5}>Props</Title>
        <div className="mtdComponents-buttonDisplay-controller-items">
          {/* <SwitchProp name="Active" /> */}
          <SwitchProp name="Disabled" />
          <SwitchProp name="Loading" />
          <SwitchProp name="Minimal" />
          <SwitchProp name="Outlined" />
          <SwitchProp name="Dashed" />
          <SwitchProp name="Borderless" />
          <SwitchProp name="Fill" />
          <SwitchProp name="IconOnly" />
          <SwitchProp name="TrimIconOnlyPadding" />
        </div>
        <Title level={5}>Align Text</Title>
        <div className="mtdComponents-buttonDisplay-controller-items">
          <Segmented
            options={["left", "center", "right"]}
            value={
              btnProps.hasOwnProperty("alignText")
                ? btnProps["alignText"]
                : "center"
            }
            onChange={(value) =>
              setBtnProps({ ...btnProps, ...{ alignText: value } })
            }
          />
        </div>
        <Title level={5}>Size</Title>
        <div className="mtdComponents-buttonDisplay-controller-items">
          <Segmented
            options={["small", "middle", "large"]}
            value={
              btnProps.hasOwnProperty("size") ? btnProps["size"] : "middle"
            }
            onChange={(value) =>
              setBtnProps({ ...btnProps, ...{ size: value } })
            }
          />
        </div>
        <Title level={5}>Intent</Title>
        <Select
          defaultValue="none"
          style={{ width: 120 }}
          onChange={(value) => {
            setBtnProps({ ...btnProps, ...{ intent: value } });
          }}
          options={[
            { value: "none", label: "none" },
            { value: "primary", label: "primary" },
            { value: "action", label: "action" },
            { value: "success", label: "success" },
            { value: "dangerous", label: "dangerous" },
            { value: "warning", label: "warning" },
          ]}
        />
      </div>
    </div>
  );
};

export default MtdComponentDisplay;
