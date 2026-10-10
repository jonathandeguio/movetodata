import { AddIcon } from "assets/icons/mtdActionIcons";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

interface IKeplerTransparentButton {
  disabled?: boolean;
  onClick?: () => void;
  label: string;
  style?: any;
}

export const KeplerTransparentButton: React.FC<IKeplerTransparentButton> = ({
  disabled,
  onClick,
  label,
  style,
}) => {
  return (
    <div
      className={`KeplerTransparentdiv text-and-icon-center ${
        !!disabled ? "KeplerTransparentdiv--not_allowed" : ""
      }`}
      onClick={() => onClick?.()}
      style={style}
    >
      <AddIcon size={10} />
      {label}
    </div>
  );
};
