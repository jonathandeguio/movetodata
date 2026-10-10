import React, { useCallback, useEffect } from "react";

/** @jsxImportSource @emotion/react */
import { Col, Dropdown, MenuProps, Popover, Row } from "antd";
import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import {
    copyToClipboard,
    getLanguageLabel,
    isDefined,
    openNotification,
} from "utils/utilities";
import { editDashboard } from "../../../redux/actions/dashboardActions";
import { ThunkAppDispatch } from "../../../redux/types/store";

import {
    HistoryIcon,
    MoreMenuIcon,
    RefreshIcon,
    SharedIcon,
} from "assets/icons/mtdActionIcons";
import { GraphIcon } from "assets/icons/mtdChartIcons";
import { DownloadIcon } from "assets/icons/mtdInterfaceIcons";
import {
    PopOutIcon,
    ZoomToFitIcon,
} from "assets/icons/mtdNavigationIcon";
import Avatars from "components/Avatars/Avatars";

import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import Comments from "components/Comments/Comments.view";
import { MtdInfoPopover } from "components/CommonUI/MtdInfoPopover/MtdInfoPopover.view";
import DashboardExportModal from "components/Modals/DashboardExportModal";
import CustomBreadCrumb from "components/Nav/Manage/breadCrumb";
import { createVersionAPI } from "components/VersionHistory/VersionHistory.api";
import SourcesTargets from "helpers/SourcesTargets";
import { toPng } from "html-to-image";
import { useHotkeys } from "react-hotkeys-hook";
import generatePDF from "react-to-pdf";
import {
    resourceModeUpdate,
    TAllowedModes,
} from "../../../redux/actions/resourcePermissionActions";
import {
    changeVersionDash,
    versionUpdate,
} from "../../../redux/actions/versionActions";
import {
    VERSION_MODE,
    VIEWER_MODE,
} from "../../../redux/constants/resourcePermissionConstants";
import { getDashboardDataAPI } from "./Dashboard.api";
import { isAutoSaveTime } from "./Dashboard.utils";
import DashboardHeaderActionBtn from "./DashboardHeader/DashboardHeaderActionBtn";
import DashboardHeaderSubscribeBtn from "./DashboardHeader/DashboardHeaderSubscribeBtn";

type dashboardElement = {
  id: string;
  name: string;
  description: string;
  type: string;
  parent: string;
  tabs: Array<any>;
  charts: Array<any>;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
};

export function shareLink() {
  const url = document.location.href;

  copyToClipboard(url);
  openNotification("Link Copied", "Link successfully copied", "success");
}
function DashboardHeader({ id, gridRef }: { id: string; gridRef: any }) {
  /**
   * Configs
   */

  const dispatch = useDispatch<ThunkAppDispatch>();

  /**
   * Static Info
   */

  const [isEditable, setIsEditable] = useState(false);
  const [dashboardData, setDashboardData] = useState<
    dashboardElement | undefined
  >(undefined);
  const [createdBy, setCreatedBy] = useState();
  const [updatedBy, setUpdatedBy] = useState();
  // A state to notify rerendering of dashboard data
  const [onChangeRerender, setOnChangeRerender] = useState<any>();
  const [openGridConfigModal, setOpenGridConfigModal] =
    useState<boolean>(false);
  const [confirmLoadingGridConfigModal, setConfirmLoadingGridConfigModal] =
    useState<boolean>(false);
  const [openExportModal, setOpenExportModal] = useState<boolean>(false);
  const [showPanel, setShowPanel] = useState(false);

  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[id]
  );

  const changeResourceMode = (mode: TAllowedModes) => {
    dispatch(resourceModeUpdate(mode, id));
  };

  const handleExportModal = () => {
    setOpenExportModal(true);
  };

  const donwloadImageCallback = (convertTo: "image" | "pdf") => {
    const url = window.location.href;
    let currentTabId = "";
    if (url.slice(-1) == "#") {
      currentTabId = window.location.href.slice(-37, -1);
    } else {
      currentTabId = window.location.href.slice(-36);
    }
    let tabName = "Untitled";
    // if (dashboardData && dashboardData.tabs) {
    //   tabName = dashboardData?.tabs.filter((obj) => obj.id === currentTabId)[0]
    //     .name;
    // }

    if (gridRef.current === null) {
      return;
    }
    const gridElement = gridRef.current;
    gridElement.cloneNode(true);
    gridElement.style.overflow = "visible";
    gridElement.style.height = "auto";

    if (convertTo == "image") {
      toPng(gridElement, { cacheBust: true })
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = tabName + ".png";
          link.href = dataUrl;
          link.click();
          gridElement.style.overflow = "hidden scroll";
          gridElement.style.height = "100%";
        })
        .catch((err) => {
          gridElement.style.overflow = "hidden scroll";
          gridElement.style.height = "100%";
        });
    } else {
      //
      generatePDF(gridRef, { filename: "page.pdf" });
    }
  };

  const items: MenuProps["items"] = [
    {
      label: (
        <>
          <div className="text-and-icon-center">
            <RefreshIcon /> {getLanguageLabel("refreshDashboard")}
          </div>
        </>
      ),
      key: "0",
      onClick: () => {
        window.location.reload();
      },
    },
    {
      label: (
        <>
          <div className="text-and-icon-center">
            <ZoomToFitIcon /> {getLanguageLabel("expand")}
          </div>
        </>
      ),
      key: "1",
      onClick: useCallback(() => {
        const chartDiv = gridRef.current as any;
        const elem = chartDiv;
        function openFullscreen() {
          if (elem.requestFullscreen) {
            elem.requestFullscreen();
          } else if (elem.webkitRequestFullscreen) {
            /* Safari */
            elem.webkitRequestFullscreen();
          } else if (elem.msRequestFullscreen) {
            /* IE11 */
            elem.msRequestFullscreen();
          }
        }
        openFullscreen();
      }, [gridRef]),
    },
    {
      type: "divider",
    },
    {
      label: (
        <>
          <div className="text-and-icon-center" onClick={handleExportModal}>
            <DownloadIcon /> {getLanguageLabel("export")}
          </div>
        </>
      ),
      key: "3",
      onClick: () => handleExportModal(),
    },
    {
      label: (
        <div className="text-and-icon-center">
          <SharedIcon /> {getLanguageLabel("share")}
        </div>
      ),
      key: "4",
      onClick: () => {
        shareLink();
      },
    },
    // {
    //   type: "divider",
    // },
    // {
    //   label: (
    //     <>
    //       <div className="text-and-icon-center">
    //         <SettingsIcon />
    //         {"Grid Settting"}
    //       </div>
    //     </>
    //   ),
    //   key: "6",
    //   onClick: () => {
    //     setOpenGridConfigModal(true);
    //   },
    // }
  ];

  const getDashboard = () => {
    getDashboardDataAPI(id)
      .then(({ data }) => {
        if (isAutoSaveTime(data.lastVersionedDate)) {
          createVersionAPI(
            id,
            "dashboard",
            `Auto saved version ${data.versionId + 1}`
          )?.then(({ data }: any) => {
            dispatch(versionUpdate());
          });
        }
        setDashboardData(data);
      })
      .catch(() => {
        openNotification("Dashboard not fetched", " ", "error");
      });
  };

  const getUsers = async (creator: $TSFixMe, updater: $TSFixMe) => {
    try {
      if (creator) {
        const { data: createdByData } = await axios.get(
          `/passport/users/${creator}`
        );
        setCreatedBy(createdByData);
      }

      if (updater) {
        const { data: updatedByData } = await axios.get(
          `/passport/users/${updater}`
        );
        setUpdatedBy(updatedByData);
      }
    } catch (err) {
      openNotification("Failed to fetch users", " ", "error");
    }
  };

  useEffect(() => {
    return () => {
      dispatch(editDashboard(false));
    };
  }, []);

  useEffect(() => {
    getDashboard();
  }, [onChangeRerender]);

  useEffect(() => {
    if (dashboardData != undefined) {
      getUsers(dashboardData.createdBy, dashboardData.updatedBy);
    }
  }, [dashboardData]);

  const toggleVersionViewMode = (): void => {
    const currentMode: boolean = resourcePermission.mode === VERSION_MODE;
    let newMode: TAllowedModes;

    if (currentMode) {
      newMode = VIEWER_MODE;
    } else {
      newMode = VERSION_MODE;
    }

    dispatch(resourceModeUpdate(newMode, id));
  };

  useHotkeys(
    "F",
    useCallback(
      (event: any) => {
        const chartDiv = gridRef.current as any;
        const elem = chartDiv;
        function openFullscreen() {
          if (elem.requestFullscreen) {
            elem.requestFullscreen();
          } else if (elem.webkitRequestFullscreen) {
            /* Safari */
            elem.webkitRequestFullscreen();
          } else if (elem.msRequestFullscreen) {
            /* IE11 */
            elem.msRequestFullscreen();
          }
        }
        openFullscreen();
      },
      [gridRef]
    )
  );

  useHotkeys("H", (event: any) => {
    event.preventDefault();
    dispatch(
      changeVersionDash({
        versionId: undefined,
      })
    );
    toggleVersionViewMode();
  });

  if (dashboardData == undefined) return <></>;

  return (
    <div
      className="kepler-container-header"
      onMouseEnter={() => setShowPanel(true)}
      onMouseLeave={() => setShowPanel(false)}
    >
      <CustomBreadCrumb />
      <div className="kepler-container-header-btns">
        {isDefined(dashboardData) && (
          <MtdInfoPopover id={dashboardData.id} type={dashboardData.type} />
        )}
        <Popover
          title={
            <>
              <Row justify="space-between" align="middle">
                <Col>
                  <div className="text-and-icon-center">
                    <HistoryIcon />
                    {getLanguageLabel("version")}
                  </div>
                </Col>
                <Col className="key-binding">
                  <div className="text-and-icon-center">H</div>
                </Col>
              </Row>
            </>
          }
          content={"Dashboard Versions"}
        >
          <MtdButton
            icononly
            icon={<HistoryIcon size={20} />}
            minimal
            trimicononlypadding
            onClick={() => {
              // Cleaning the redux
              dispatch(
                changeVersionDash({
                  versionId: undefined,
                })
              );
              dispatch(resourceModeUpdate(VERSION_MODE as TAllowedModes, id));
            }}
          />
        </Popover>

        <div className="text-and-icon-center">
          <Popover
            title={
              <Link to={`/portal/bezier/${dashboardData.id}/master`}>
                <div
                  className="text-and-icon-center"
                  style={{
                    justifyContent: "space-between",
                    width: "100%",
                    color: "var(--movetodata-font-color-muted)",
                  }}
                >
                  {getLanguageLabel("dataLineage")}
                  <PopOutIcon />
                </div>
              </Link>
            }
            content={
              <>
                <SourcesTargets id={dashboardData.id} branch={"master"} />
              </>
            }
            overlayStyle={{ width: "20rem" }}
            placement="bottom"
          >
            <Link to={`/portal/bezier/${dashboardData.id}/master`}>
              <MtdButton
                icononly
                icon={<GraphIcon />}
                minimal
                trimicononlypadding
              />
            </Link>
          </Popover>
        </div>

        <DashboardHeaderSubscribeBtn id={id} />

        <Comments id={dashboardData.id} />
        <Avatars link={`/topic/${dashboardData.id}`} />

        <DashboardHeaderActionBtn id={id} />

        <Dropdown menu={{ items }} trigger={["click"]}>
          <MtdButton
            icon={<MoreMenuIcon />}
            minimal
            icononly
            trimicononlypadding
          ></MtdButton>
        </Dropdown>
        <DashboardExportModal
          openExportModal={openExportModal}
          setOpenExportModal={setOpenExportModal}
          donwloadImageCallback={donwloadImageCallback}
          gridRef={gridRef}
        />
      </div>
    </div>
  );
}

export default DashboardHeader;
