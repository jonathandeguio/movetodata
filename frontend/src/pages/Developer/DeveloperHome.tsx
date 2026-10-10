import React from "react";
import { Outlet, useLocation } from "react-router";
import { Link } from "react-router-dom";
import { AppIcon, HomeIcon } from "../../assets/icons/mtdInterfaceIcons";
import { PopOutIcon } from "../../assets/icons/mtdNavigationIcon";

import { Divider } from "antd";
import { getLanguageLabel } from "utils/utilities";
import {
    SettingsIcon,
    SparklesIcon,
    StopIcon,
} from "../../assets/icons/mtdActionIcons";
import { StylesIcon, TextIcon } from "../../assets/icons/mtdEditorIcons";
import "./DeveloperHome.scss";

function DeveloperHome() {
  const location = useLocation();
  const lastSlashIndex = location.pathname.lastIndexOf("/");
  const trimmedString = location.pathname.slice(lastSlashIndex + 1);

  return (
    <div className="portalHomePage-layout">
      <div className="portalHomePage-layout-sidebar">
        <div className="portalHomePage-layout-sidebar-classicgroup">
          <Link to={`home`}>
            <div
              className={
                trimmedString == "home"
                  ? "portalHomePage-layout-sidebar-classicgroup-item-selected"
                  : "portalHomePage-layout-sidebar-classicgroup-item"
              }
            >
              <div className="text-and-icon-center">
                <HomeIcon /> {getLanguageLabel("home")}
              </div>
            </div>
          </Link>
          <Link to={`components`}>
            <div
              className={
                trimmedString == ""
                  ? "portalHomePage-layout-sidebar-classicgroup-item-selected"
                  : "portalHomePage-layout-sidebar-classicgroup-item"
              }
            >
              <div className="text-and-icon-center">
                <AppIcon size={18} />
                {"Button & Input"}
              </div>
            </div>
          </Link>
          <Link to={`typography`}>
            <div
              className={
                trimmedString == ""
                  ? "portalHomePage-layout-sidebar-classicgroup-item-selected"
                  : "portalHomePage-layout-sidebar-classicgroup-item"
              }
            >
              <div className="text-and-icon-center">
                <TextIcon size={18} />
                {"Typhography"}
              </div>
            </div>
          </Link>
          <Link to={`uicomponents`}>
            <div
              className={
                trimmedString == ""
                  ? "portalHomePage-layout-sidebar-classicgroup-item-selected"
                  : "portalHomePage-layout-sidebar-classicgroup-item"
              }
            >
              <div className="text-and-icon-center">
                <SparklesIcon size={18} />
                {"UI Components"}
              </div>
            </div>
          </Link>
          <Link to={`icons`}>
            <div
              className={
                trimmedString == "home"
                  ? "portalHomePage-layout-sidebar-classicgroup-item-selected"
                  : "portalHomePage-layout-sidebar-classicgroup-item"
              }
            >
              <div className="text-and-icon-center">
                <StylesIcon size={18} /> {"Icons"}
              </div>
            </div>
          </Link>
          <Link to={`nodata`}>
            <div
              className={
                trimmedString == "home"
                  ? "portalHomePage-layout-sidebar-classicgroup-item-selected"
                  : "portalHomePage-layout-sidebar-classicgroup-item"
              }
            >
              <div className="text-and-icon-center">
                <StopIcon size={18} /> {"No Data"}
              </div>
            </div>
          </Link>
          <Divider />
          <Link to={`testingarea`}>
            <div
              className={
                "portalHomePage-layout-sidebar-classicgroup-item settingItem"
              }
            >
              <div className="text-and-icon-center">
                <SettingsIcon /> Testing Area
              </div>
              <PopOutIcon />
            </div>
          </Link>
          <Divider />
          <Link to={`/portal/settings/profile`}>
            <div
              className={
                "portalHomePage-layout-sidebar-classicgroup-item settingItem"
              }
            >
              <div className="text-and-icon-center">
                <SettingsIcon /> {getLanguageLabel("settings")}
              </div>
              <PopOutIcon />
            </div>
          </Link>
        </div>
      </div>
      <div className="portalHomePage-layout-outlet">
        <Outlet />
      </div>
    </div>
  );
}

export default DeveloperHome;
