import { Tag } from "antd";
import React from "react";
import { isDefined } from "utils/utilities";
import sm from "./Tag.module.scss";

interface MtdTagProps {
  onClick?: any;
  icon?: JSX.Element;
  color?: string;
  children: any;
  onMouseEnter?: any;
  onMouseLeave?: any;
}

export const MtdTag = ({
  onClick,
  icon,
  color,
  children,
  onMouseEnter,
  onMouseLeave,
}: MtdTagProps) => {
  return (
    <Tag
      className={sm.mtdtag}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => (isDefined(onClick) ? onClick() : null)}
      icon={icon}
      color={color}
    >
      {children}
    </Tag>
  );
};
