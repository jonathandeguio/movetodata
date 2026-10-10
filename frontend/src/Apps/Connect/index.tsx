import { Divider } from "antd";
import { LinkIcon } from "assets/icons/mtdActionIcons";
import { DataAgentsIcon, DatabaseIcon } from "assets/icons/mtdDataIcons";
import { DocsIcon, DocumentationIcon } from "assets/icons/mtdFileIcons";
import { ChangeLogIcon } from "assets/icons/mtdInterfaceIcons";
import { HelpIcon } from "assets/icons/mtdMiscellaneousIcons";
import React from "react";
import { Outlet, useLocation } from "react-router";
import { Link } from "react-router-dom";
import { getLanguageLabel } from "utils/utilities";

const Connect = () => {
  const location = useLocation();
  const lastSlashIndex = location.pathname.lastIndexOf("/");
  const trimmedString = location.pathname.slice(lastSlashIndex + 1);

  return (
    <div className="settingpage-layout">
      <div className="settingpage-layout-sidebar">
        <div className="settingpage-layout-sidebar-menuContainer">
          <div className="settingpage-layout-sidebar-menu-head">
            {getLanguageLabel("connect")}
          </div>
          <div className="settingpage-layout-sidebar-menu">
            <Link to={`link`}>
              <div
                className={
                  trimmedString == "link"
                    ? "settingpage-layout-sidebar-menu-subHeadSelected"
                    : "settingpage-layout-sidebar-menu-subHead"
                }
              >
                <div className="text-and-icon-center">
                  <LinkIcon /> {getLanguageLabel("dataLink")}
                </div>
              </div>
            </Link>
            <Link to={`source`}>
              <div
                className={
                  trimmedString == "source"
                    ? "settingpage-layout-sidebar-menu-subHeadSelected"
                    : "settingpage-layout-sidebar-menu-subHead"
                }
              >
                <div className="text-and-icon-center">
                  <DatabaseIcon />
                  {getLanguageLabel("dataSource")}
                </div>
              </div>
            </Link>

            <Link to={`agent`}>
              <div
                className={
                  trimmedString == "agent"
                    ? "settingpage-layout-sidebar-menu-subHeadSelected"
                    : "settingpage-layout-sidebar-menu-subHead"
                }
              >
                <div className="text-and-icon-center">
                  <DataAgentsIcon /> {getLanguageLabel("agent")}
                </div>
              </div>
            </Link>
          </div>

          <Divider />
          <div className="settingpage-layout-sidebar-menu">
            <Link to={`#`}>
              <div
                className={
                  trimmedString == "docs"
                    ? "settingpage-layout-sidebar-menu-subHeadSelected"
                    : "settingpage-layout-sidebar-menu-subHead"
                }
              >
                <div className="text-and-icon-center">
                  <DocumentationIcon /> Documentation
                </div>
              </div>
            </Link>
            <Link to={`#`}>
              <div
                className={
                  trimmedString == "changeLog"
                    ? "settingpage-layout-sidebar-menu-subHeadSelected"
                    : "settingpage-layout-sidebar-menu-subHead"
                }
              >
                <div className="text-and-icon-center">
                  <ChangeLogIcon /> Change Log
                </div>
              </div>
            </Link>
          </div>
          <Divider />
          <div className="settingpage-layout-sidebar-menu">
            <Link to={`#`}>
              <div
                className={
                  trimmedString == "support"
                    ? "settingpage-layout-sidebar-menu-subHeadSelected"
                    : "settingpage-layout-sidebar-menu-subHead"
                }
              >
                <div className="text-and-icon-center">
                  <HelpIcon /> Contact Support
                </div>
              </div>
            </Link>
            <Link to={`#`}>
              <div
                className={
                  trimmedString == "log"
                    ? "settingpage-layout-sidebar-menu-subHeadSelected"
                    : "settingpage-layout-sidebar-menu-subHead"
                }
              >
                <div className="text-and-icon-center">
                  <DocsIcon /> Log
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="settingpage-layout-outlet">
        <Outlet />
      </div>
    </div>
  );
};

export default Connect;
