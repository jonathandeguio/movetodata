import React from "react";
import { MtdBottomBar } from "./MtdBottomBar";
import "./bottomBarLayout.scss";

export interface IBottomBarLayoutBody {}

export interface IBottomBarLayout {
  children: JSX.Element;
}

export const BottomBarLayout: React.FC<{ children: JSX.Element }> = ({
  children,
}) => {
  return <MtdBottomBar children={children} />;
};
