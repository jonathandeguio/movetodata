import { NotificationBell } from "Apps/Notifications/NotificationBell.view";
import { Divider } from "antd";
import {
  BuildIcon,
  HistoryIcon
} from "assets/icons/mtdActionIcons";
import { BooleanIcon } from "assets/icons/mtdDataIcons";
import { FolderIcon } from "assets/icons/mtdFileIcons";
import {
  AppIcon,
  HomeIcon,
  ScheduledRunIcon
} from "assets/icons/mtdInterfaceIcons";
import { LibraryIcon, StarIcon } from "assets/icons/mtdMiscellaneousIcons";
import { getIsConnectAdmin } from "common/common.api";
import { AiAssistantButton } from "components/AiAssistant";
import MtdCommandPalette from "components/CommandPalette/CommandPalette.view";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getLanguageLabel, isLicenseKeyUsedValid } from "utils/utilities";
import { setIsConnectAdmin } from "../../redux/actions/userActions";
import { RootState } from "../../redux/types/store";
import SBElement from "./SBElement";
import SBElementAvatar from "./SBElementAvatar";
import SBElementLogo from "./SBElementLogo";
import SBElementSearch from "./SBElementSearch";
import styles from "./Sidebar.module.scss";
import { LayoutViewEnum, preventFilterLossOnReNavigate } from "./Sidebar.utils";

const Sidebar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { info } = useSelector((state) => (state as any).license);
  const [sidebarAttributes, setSidebarAttributes] = useState({
    iconSize: 20,
    showText: false,
    width: "30px",
  });

  const { user } = useSelector((state: RootState) => state.userDetails);
  const [selectedSideBarTab, setSelectedSideBarTab] = useState<any>("None");
  const isEmbedded = searchParams.get("embedded");
  const dispatch = useDispatch();

  useEffect(() => {
    getIsConnectAdmin().then(({ data }) => {
      dispatch(setIsConnectAdmin(data));
    });
  }, []);

  useEffect(() => {
    if (user.preferences.layoutView == LayoutViewEnum.COMFORTABLE) {
      setSidebarAttributes({
        iconSize: 22,
        showText: true,
        width: "46px",
      });
    } else if (user.preferences.layoutView == LayoutViewEnum.COMPACT) {
      setSidebarAttributes({
        iconSize: 20,
        showText: false,
        width: "30px",
      });
    }
  }, [user.preferences]);

  if (isEmbedded || !isLicenseKeyUsedValid(info)) return <></>;

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.container}
        style={{ width: sidebarAttributes.width }}
      >
        <div className={styles.top}>
          <div className={styles.logo}>
            <SBElementLogo
              iconSize={sidebarAttributes.iconSize}
              showText={sidebarAttributes.showText}
            />
          </div>
          <Divider
            style={{
              marginTop: "10px",
              marginBottom: "10px",
            }}
          />

          <SBElement
            icon={
              <HomeIcon
                color={
                  selectedSideBarTab == "home"
                    ? "var(--PRIMARY_ICON)"
                    : "var(--icon-color-deafult)"
                }
                size={sidebarAttributes.iconSize}
              />
            }
            tooltip={getLanguageLabel("home")}
            text="home"
            showText={sidebarAttributes.showText}
            onClick={() => {
              navigate("/");
              setSelectedSideBarTab("home");
            }}
            selected={selectedSideBarTab == "home"}
          />

          <SBElementSearch
            iconSize={sidebarAttributes.iconSize}
            showText={sidebarAttributes.showText}
          />

          <SBElement
            icon={
              <FolderIcon
                color={
                  selectedSideBarTab == "projects"
                    ? "var(--PRIMARY_ICON)"
                    : "var(--icon-color-deafult)"
                }
                size={sidebarAttributes.iconSize}
              />
            }
            tooltip={getLanguageLabel("projects")}
            text="projects"
            showText={sidebarAttributes.showText}
            onClick={() => {
              if (
                preventFilterLossOnReNavigate(
                  location.pathname,
                  "/portal/projects"
                )
              )
                return;
              navigate("/portal/projects");
              setSelectedSideBarTab("projects");
            }}
            selected={selectedSideBarTab == "projects"}
          />

          <SBElement
            icon={
              <BuildIcon
                color={
                  selectedSideBarTab == "builds"
                    ? "var(--PRIMARY_ICON)"
                    : "var(--icon-color-deafult)"
                }
                size={sidebarAttributes.iconSize}
              />
            }
            tooltip={getLanguageLabel("builds")}
            text="builds"
            showText={sidebarAttributes.showText}
            onClick={() => {
              if (
                preventFilterLossOnReNavigate(
                  location.pathname,
                  "/portal/builds"
                )
              )
                return;
              navigate("/portal/builds");
              setSelectedSideBarTab("builds");
            }}
            selected={selectedSideBarTab == "builds"}
          />

          <SBElement
            icon={
              <ScheduledRunIcon
                color={
                  selectedSideBarTab == "schedules"
                    ? "var(--PRIMARY_ICON)"
                    : "var(--icon-color-deafult)"
                }
                size={sidebarAttributes.iconSize}
              />
            }
            tooltip={getLanguageLabel("schedules")}
            text="schedules"
            showText={sidebarAttributes.showText}
            onClick={() => {
              if (
                preventFilterLossOnReNavigate(
                  location.pathname,
                  "/portal/schedules"
                )
              )
                return;
              navigate("/portal/schedules");
              setSelectedSideBarTab("schedules");
            }}
            selected={selectedSideBarTab == "schedules"}
          />

          <Divider
            style={{
              marginTop: "10px",
              marginBottom: "10px",
            }}
          />

          <SBElement
            icon={
              <StarIcon
                color={"#ffc940"}
                stroke={"#ffc940"}
                size={sidebarAttributes.iconSize}
              />
            }
            tooltip={getLanguageLabel("favourites")}
            text="favs"
            showText={sidebarAttributes.showText}
            onClick={() => {
              navigate("/portal/favourites");
              setSelectedSideBarTab("favourites");
            }}
            selected={selectedSideBarTab == "favourites"}
          />

          <SBElement
            icon={
              <HistoryIcon
                color={
                  selectedSideBarTab == "recentlyViewed"
                    ? "var(--PRIMARY_ICON)"
                    : "var(--icon-color-deafult)"
                }
                size={sidebarAttributes.iconSize}
              />
            }
            tooltip={getLanguageLabel("recentlyViewed")}
            text="recentlyViewed"
            showText={sidebarAttributes.showText}
            onClick={() => {
              navigate("/portal/recentlyViewed");
              setSelectedSideBarTab("recentlyViewed");
            }}
            selected={selectedSideBarTab == "recentlyViewed"}
          />

          {/* <SBElement
            icon={
              <UserIcon
                color={
                  selectedSideBarTab == "createdByYou"
                    ? "var(--PRIMARY_ICON)"
                    : "var(--icon-color-deafult)"
                }
                size={sidebarAttributes.iconSize}
              />
            }
            tooltip={getLanguageLabel("createdByYou")}
            text="createdByYou"
            showText={sidebarAttributes.showText}
            onClick={() => {
              navigate("/portal/createdByYou");
              setSelectedSideBarTab("createdByYou");
            }}
            selected={selectedSideBarTab == "createdByYou"}
          /> */}

          {/* <SBElement
            icon={
              <RefreshIcon
                color={
                  selectedSideBarTab == "updatedByYou"
                    ? "var(--PRIMARY_ICON)"
                    : "var(--icon-color-deafult)"
                }
                size={sidebarAttributes.iconSize}
              />
            }
            tooltip={getLanguageLabel("updatedByYou")}
            text="updatedByYou"
            showText={sidebarAttributes.showText}
            onClick={() => {
              navigate("/portal/updatedByYou");
              setSelectedSideBarTab("updatedByYou");
            }}
            selected={selectedSideBarTab == "updatedByYou"}
          /> */}

          <Divider
            style={{
              marginTop: "10px",
              marginBottom: "10px",
            }}
          />
          <MtdCommandPalette
            iconSize={sidebarAttributes.iconSize}
            showText={sidebarAttributes.showText}
          />

          <SBElement
            icon={
              <BooleanIcon
                color={
                  selectedSideBarTab == "accessManager"
                    ? "var(--ACTION_COLOR)"
                    : "var(--ACTION_COLOR)"
                }
                size={sidebarAttributes.iconSize + 6}
              />
            }
            tooltip={getLanguageLabel("accessManager")}
            text={"accessManager"}
            showText={sidebarAttributes.showText}
            onClick={() => {
              if (
                preventFilterLossOnReNavigate(
                  location.pathname,
                  "/portal/accessManager"
                )
              )
                return;
              navigate("/portal/accessManager");
              setSelectedSideBarTab("accessManager");
            }}
            selected={selectedSideBarTab == "accessManager"}
          />
          <SBElement
            icon={
              <LibraryIcon
                size={sidebarAttributes.iconSize + 6}
              />
            }
            disabled
            tooltip={getLanguageLabel("dataCatalog")}
            text={"dataCatalog"}
            showText={sidebarAttributes.showText}
            onClick={() => {
              if (
                preventFilterLossOnReNavigate(
                  location.pathname,
                  "/portal/dataCatalog"
                )
              )
                return;
              navigate("/portal/dataCatalog");
              setSelectedSideBarTab("dataCatalog");
            }}
            selected={selectedSideBarTab == "dataCatalog"}
          />
          <SBElement
            icon={
              <AppIcon 
                size={sidebarAttributes.iconSize + 6}
              />
            }
            tooltip={getLanguageLabel("webApp")}
            text={"webApp"}
            showText={sidebarAttributes.showText}
            onClick={() => {
              if (
                preventFilterLossOnReNavigate(
                  location.pathname,
                  "/portal/webApp"
                )
              )
                return;
              navigate("/portal/webApp");
              setSelectedSideBarTab("webApp");
            }}
            disabled
            selected={selectedSideBarTab == "webApp"}
          />
        </div>

        <div className={styles.bottom}>
          {/* F3 — AI assistant toggle button */}
          <AiAssistantButton
            iconSize={sidebarAttributes.iconSize}
            showText={sidebarAttributes.showText}
          />
          <NotificationBell
            iconSize={sidebarAttributes.iconSize}
            showText={sidebarAttributes.showText}
          />
          <SBElementAvatar
            iconSize={sidebarAttributes.iconSize}
            showText={sidebarAttributes.showText}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
