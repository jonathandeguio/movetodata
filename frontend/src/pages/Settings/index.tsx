// import { Outlet, Link } from "react-router-dom";
import { FromCacheIcon } from "assets/icons/mtdDataIcons";
import { CodeCellIcon, StylesIcon } from "assets/icons/mtdEditorIcons";
import { GitNewBranchIcon, PythonIcon } from "assets/icons/mtdExternalIcons";
import { EmailIcon } from "assets/icons/mtdFileIcons";
import { OpenIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { BTHInternal } from "components/CommonUI/MtdTypography";
import { getDefaultFavicon } from "components/mtdLoader/FavIconLoader";
import DebugInfoModal from "layouts/Sidebar/DebugInfoModal";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation } from "react-router";
import { Link } from "react-router-dom";
import { getLanguageLabel, isDefined } from "utils/utilities";
import {
  HistoricalRunsIcon,
  LockIcon,
  MoreMenuIcon,
  NotificationIcon,
  PreferencesIcon,
  SparklesIcon,
} from "../../assets/icons/mtdActionIcons";
import {
  ChangeLogIcon,
  ComponentIcon,
  DownloadIcon,
  GroupsIcon,
  KeyIcon,
  UploadIcon,
  UserIcon,
} from "../../assets/icons/mtdInterfaceIcons";
import {
  BugIcon,
  PulseIcon,
  TagsIcon,
  TimeZoneIcon,
} from "../../assets/icons/mtdMiscellaneousIcons";
import {
  isGroupAdmin,
  isPlatformAdmin,
  isUserAdmin,
} from "../../redux/actions/userActions";
import { ThunkAppDispatch } from "../../redux/types/store";

const Setting = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );

  useEffect(() => {
    document.title = getLanguageLabel("settings");
    let favicon = document.querySelector('link[rel="icon"]') as any;
    favicon.href = getDefaultFavicon();

    return () => {
      document.title =
        isDefined(config) && isDefined(config.platformName)
          ? config.platformName
          : "MoveToData";
    };
  }, []);

  const location = useLocation();
  const pathSegments = location.pathname.split("/");

  const [isDebugInfoOpen, setIsDebugInfoOpen] = useState(false);

  const secondToLastSegment = pathSegments[pathSegments.length - 2];
  const lastSegment = pathSegments[pathSegments.length - 1];
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);
  const { user: platformAdmin } = useSelector(
    (state) => (state as any).platformAdmin
  );

  const notSSOUser = () => {
    return user.provider == "local";
  };

  useEffect(() => {
    dispatch(isPlatformAdmin());
    dispatch(isUserAdmin());
    dispatch(isGroupAdmin());
  }, []);

  return (
    <div className="settingpage-layout">

     <div className="settingpage-layout-sidebar">
        <div className="settingpage-layout-sidebar-menuContainer">
          {secondToLastSegment == "platform" ? (
            <>
              {" "}
              <div className="settingpage-layout-sidebar-menu">
                <Link
                  to={`/portal/settings/profile`}
                  className="text-and-icon-center"
                >
                  <div className="text-and-icon-center">
                    <OpenIcon size={24} />
                    {getLanguageLabel("settings")}
                  </div>
                </Link>
                <div className="settingpage-layout-sidebar-menu-head"></div>
              </div>
              <div className="settingpage-layout-sidebar-menu">
                <div className="settingpage-layout-sidebar-menu-head">
                  <BTHInternal>{getLanguageLabel("product")}</BTHInternal>
                </div>
                <Link to={`platform/license`}>
                  <div
                    className={
                      lastSegment == "license"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <KeyIcon />
                      {getLanguageLabel("license")}
                    </div>
                  </div>
                </Link>
              </div>
              <div className="settingpage-layout-sidebar-menu">
                <div className="settingpage-layout-sidebar-menu-head">
                  <BTHInternal>{getLanguageLabel("dataset")}</BTHInternal>
                </div>

                <Link to={`platform/cache`}>
                  <div
                    className={
                      lastSegment == "cache"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <FromCacheIcon />
                      {getLanguageLabel("caching")}
                    </div>
                  </div>
                </Link>

                <Link to={`platform/history`}>
                  <div
                    className={
                      lastSegment == "history"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <ComponentIcon />
                      {getLanguageLabel("history")}
                    </div>
                  </div>
                </Link>
                <Link to={`platform/upload`}>
                  <div
                    className={
                      lastSegment == "upload"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <UploadIcon /> {getLanguageLabel("upload")}
                    </div>
                  </div>
                </Link>
                <Link to={`platform/download`}>
                  <div
                    className={
                      lastSegment == "download"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <DownloadIcon /> {getLanguageLabel("download")}
                    </div>
                  </div>
                </Link>
              </div>
              <div className="settingpage-layout-sidebar-menu">
                <div className="settingpage-layout-sidebar-menu-head">
                  <BTHInternal>
                    {getLanguageLabel("personalization")}
                  </BTHInternal>
                </div>

                <Link to={`platform/timezone`}>
                  <div
                    className={
                      lastSegment == "timezone"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <TimeZoneIcon /> {getLanguageLabel("timezone")}
                    </div>
                  </div>
                </Link>
                <Link to={`platform/theme`}>
                  <div
                    className={
                      lastSegment == "theme"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <StylesIcon /> {getLanguageLabel("theme")}
                    </div>
                  </div>
                </Link>
              </div>
              <div className="settingpage-layout-sidebar-menu">
                <div className="settingpage-layout-sidebar-menu-head">
                  <BTHInternal>{getLanguageLabel("configuration")}</BTHInternal>
                </div>

                <Link to={`platform/smtp`}>
                  <div
                    className={
                      lastSegment == "smtp"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <EmailIcon /> SMTP
                    </div>
                  </div>
                </Link>
                <Link to={`platform/httpProxy`}>
                  <div
                    className={
                      lastSegment == "httpProxy"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <ChangeLogIcon /> HTTP Proxy
                    </div>
                  </div>
                </Link>
                <Link to={`platform/artifactory`}>
                  <div
                    className={
                      lastSegment == "artifactory"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <PythonIcon /> Python Artifactory
                    </div>
                  </div>
                </Link>
                <Link to={`platform/branch`}>
                  <div
                    className={
                      lastSegment == "branch"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <GitNewBranchIcon /> Branch
                    </div>
                  </div>
                </Link>
                <Link to={`platform/backingFs`}>
                  <div
                    className={
                      lastSegment == "backingFs"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <HistoricalRunsIcon /> BackingFs
                    </div>
                  </div>
                </Link>
                <Link to={`platform/git`}>
                  <div
                    className={
                      lastSegment == "git"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <CodeCellIcon /> Git
                    </div>
                  </div>
                </Link>
                <Link to={`platform/spark`}>
                  <div
                    className={
                      lastSegment == "spark"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <SparklesIcon /> Spark
                    </div>
                  </div>
                </Link>
              </div>
              <div className="settingpage-layout-sidebar-menu">
                <div className="settingpage-layout-sidebar-menu-head">
                  <BTHInternal>{getLanguageLabel("access")}</BTHInternal>
                </div>

                <Link to={`platform/bulkUserCreation`}>
                  <div
                    className={
                      lastSegment == "bulkUserCreation"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <GroupsIcon /> Bulk User Creation
                    </div>
                  </div>
                </Link>
              </div>
              {/* {
                // check if is platform Admin and is development
                isDev && (
                  <div className="settingpage-layout-sidebar-menu">
                    <div className="settingpage-layout-sidebar-menu-head">
                      {getLanguageLabel("developer")}{" "}
                      {getLanguageLabel("settings")}
                    </div>
                    <Link to={`platform/developerSettings`}>
                      <div
                        className={
                          lastSegment == "developerSettings"
                            ? "settingpage-layout-sidebar-menu-subHeadSelected"
                            : "settingpage-layout-sidebar-menu-subHead"
                        }
                      >
                        <div className="text-and-icon-center">
                          <VariablesIcon /> {getLanguageLabel("developer")}{" "}
                          {getLanguageLabel("space")}
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              } */}
            </>
          ) : (
            <>
              <div className="settingpage-layout-sidebar-menu"></div>
              <div className="settingpage-layout-sidebar-menu">
                <div className="settingpage-layout-sidebar-menu-head">
                  <BTHInternal>{getLanguageLabel("account")}</BTHInternal>
                </div>

                <Link to={`profile`}>
                  <div
                    className={
                      lastSegment == "profile"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <UserIcon /> {getLanguageLabel("profile")}
                    </div>
                  </div>
                </Link>
                <Link to={`preferences`}>
                  <div
                    className={
                      lastSegment == "preferences"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <PreferencesIcon /> {getLanguageLabel("preferences")}
                    </div>
                  </div>
                </Link>
                <Link to={`notifications`}>
                  <div
                    className={
                      lastSegment == "notifications"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <NotificationIcon /> {getLanguageLabel("notifications")}
                    </div>
                  </div>
                </Link>

                <Link to={`tokens`}>
                  <div
                    className={
                      lastSegment == "tokens"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <KeyIcon /> {getLanguageLabel("tokens")}
                    </div>
                  </div>
                </Link>
                <Link to={`userGroups`}>
                  <div
                    className={
                      lastSegment == "userGroups"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <GroupsIcon />
                      {getLanguageLabel("yourGroups")}
                    </div>
                  </div>
                </Link>
                <Link to={`loginActivity`}>
                  <div
                    className={
                      lastSegment == "loginActivity"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <PulseIcon /> {getLanguageLabel("loginActivity")}
                    </div>
                  </div>
                </Link>

                {notSSOUser() && (
                  <Link to={`changePassword`}>
                    <div
                      className={
                        lastSegment == "changePassword"
                          ? "settingpage-layout-sidebar-menu-subHeadSelected"
                          : "settingpage-layout-sidebar-menu-subHead"
                      }
                    >
                      <div className="text-and-icon-center">
                        <MoreMenuIcon /> {getLanguageLabel("changePassword")}
                      </div>
                    </div>
                  </Link>
                )}
                {notSSOUser() && (
                  <Link to={`security`}>
                    <div
                      className={
                        lastSegment == "security"
                          ? "settingpage-layout-sidebar-menu-subHeadSelected"
                          : "settingpage-layout-sidebar-menu-subHead"
                      }
                    >
                      <div className="text-and-icon-center">
                        <LockIcon /> Sécurité
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              <div className="settingpage-layout-sidebar-menu">
                <div className="settingpage-layout-sidebar-menu-head">
                  <BTHInternal>{getLanguageLabel("access")}</BTHInternal>
                </div>

                <Link to={`users`}>
                  <div
                    className={
                      lastSegment == "users"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <UserIcon /> {getLanguageLabel("users")}
                    </div>
                  </div>
                </Link>
                <Link to={`groups`}>
                  <div
                    className={
                      lastSegment == "groups"
                        ? "settingpage-layout-sidebar-menu-subHeadSelected"
                        : "settingpage-layout-sidebar-menu-subHead"
                    }
                  >
                    <div className="text-and-icon-center">
                      <GroupsIcon /> {getLanguageLabel("groups")}
                    </div>
                  </div>
                </Link>
                {
                  // check if is platform Admin
                  platformAdmin && (
                    <Link to={`sso`}>
                      <div
                        className={
                          lastSegment == "sso"
                            ? "settingpage-layout-sidebar-menu-subHeadSelected"
                            : "settingpage-layout-sidebar-menu-subHead"
                        }
                      >
                        <div className="text-and-icon-center">
                          <LockIcon /> SSO
                        </div>
                      </div>
                    </Link>
                  )
                }
              </div>
              {
                // check if is platform Admin
                platformAdmin && (
                  <div className="settingpage-layout-sidebar-menu">
                    <div className="settingpage-layout-sidebar-menu-head">
                      <BTHInternal>
                        {getLanguageLabel("environments")}
                      </BTHInternal>
                    </div>
                    <Link to={`tags`}>
                      <div
                        className={
                          lastSegment == "tags"
                            ? "settingpage-layout-sidebar-menu-subHeadSelected"
                            : "settingpage-layout-sidebar-menu-subHead"
                        }
                      >
                        <div className="text-and-icon-center">
                          <TagsIcon /> {getLanguageLabel("resource")}{" "}
                          {getLanguageLabel("tags")}
                        </div>
                      </div>
                    </Link>

                    <Link to={`platform/license`}>
                      <div
                        className={
                          lastSegment == "platform"
                            ? "settingpage-layout-sidebar-menu-subHeadSelected"
                            : "settingpage-layout-sidebar-menu-subHead"
                        }
                      >
                        <div className="text-and-icon-center">
                          <ComponentIcon /> Platform{" "}
                          {getLanguageLabel("settings")}
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              }
            </>
          )}
        </div>
        <MtdButton
          onClick={() => setIsDebugInfoOpen(true)}
          minimal
          icon={<BugIcon />}
          textTransform={"capitalize"}
        >
          {getLanguageLabel("information")}
        </MtdButton>
        {isDebugInfoOpen && (
          <DebugInfoModal
            isOpen={isDebugInfoOpen}
            setIsOpen={setIsDebugInfoOpen}
          />
        )}
      </div>

      <div className="settingpage-layout-outlet">
        <Outlet />
      </div>
    </div>
  );
};

export default Setting;
