import { Divider } from "antd";
import React, { useEffect, useState } from "react";
import { isDefined } from "utils/utilities";
import styles from "./MtdSwitch.module.scss";

type TOption = {
  label: any;
  icon?: any;
  value: string;
  children: any;
};
interface TProps {
  items: TOption[];
  value: string;
  onChange?: (e: any) => void;
  padding?: string;
  divider?: boolean;
  style?: any;
  isDisabled?: boolean;
}
const MtdSwitch = ({
  items,
  value,
  onChange,
  padding,
  divider = false,
  style,
  isDisabled = false,
}: TProps) => {
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

  const handleClick = (key: string) => {
    if (value != key && onChange && !isDisabled) {
      onChange(key);
    }
  };
  return (
    <div className={styles.wrapper} style={style}>
      <div
        className={styles.container}
        style={{
          padding: padding ? padding : "0px",
        }}
      >
        {items.map((item: TOption, _key: number) => {
          return (
            <div
              className={
                styles.common +
                " " +
                (value === item.value
                  ? styles.selected + (isDisabled ? " " + styles.disabled : "")
                  : styles.notselected)
              }
              onClick={() => handleClick(item.value)}
              key={_key}
            >
              {item.icon}
              {!(windowWidth < 1024 && isDefined(item.icon)) && item.label}
            </div>
          );
        })}
      </div>
      {divider && <Divider style={{ margin: 0 }} />}
      <div className={styles.body}>
        {items.map((item: TOption, _key) => {
          if (item.value == value) {
            return (
              <div className={styles.div} key={_key}>
                {item.children}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default MtdSwitch;
