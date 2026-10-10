import { Col, Row, Switch, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";

import axios from "axios";
import MtdModal from "components/CommonUI/MtdModalContainer";
import {
  favIconLoading,
  getDefaultFavicon,
} from "components/mtdLoader/FavIconLoader";
import { ErrorResponse } from "global";
import { LicenseIncapableModal } from "pages/Settings/PlatformConfig/License/LicenseIncapableModal";
import { useDispatch, useSelector } from "react-redux";
import {
  getLanguageLabel,
  isDefined,
  notEmpty,
  openNotification,
} from "utils/utilities";
import { FolderIcon } from "../../../assets/icons/mtdFileIcons";
import {
  InfoIcon,
  MonitorIcon,
} from "../../../assets/icons/mtdMiscellaneousIcons";
import {
  SingleChevronRightIcon,
  TickIcon,
} from "../../../assets/icons/mtdNavigationIcon";
import { openFileExplorerModal } from "../../../redux/ModalSlice";
import { addNewResource } from "../../../redux/fileIndexSlice";
import { createnewDashboard, getPathApi } from "../chart/charts.api";
import { KEPLER_USE_CASES } from "../chart/charts.utils";
import {
  createTabElementAPI,
  manageChartOnDashboardAPI,
  manageChartOnTabAPI,
} from "../dashboard/Dashboard.api";
import { getDefaultMeasurementsOfElements } from "../dashboard/Dashboard.utils";

const { Text, Title } = Typography;

type CreateNewDashboardModalProps = {
  id: string;
  createDashboardModal: boolean;
  setCreateDashboardModal: (state: boolean) => void;
  redirect?: boolean;
  attachChart?: boolean;
};

export default ({
  id,
  createDashboardModal,
  setCreateDashboardModal,
  redirect = false,
  attachChart = false,
}: CreateNewDashboardModalProps) => {
  const defaultDashboardDetails: any = {
    name: "",
    description: "",
    parent: "",
  };

  const dispatch = useDispatch();

  const onCreateNew = (child: any) => {
    dispatch(addNewResource(child));
  };

  const navigate = useNavigate();

  const [path, setPath] = useState<any[] | undefined>(undefined);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(
    undefined
  );
  const [dashboardDetails, setDashboardDetails] = useState<any>(
    defaultDashboardDetails
  );
  const [creationLoading, setCreationLoading] = useState<boolean>(false);
  const [attachChartToDash, setAttachChartToDash] =
    useState<boolean>(attachChart);

  const { info } = useSelector((state) => (state as any).license);

  const onSelectParentFolder = ({ id, path, name }: any) => {
    setDashboardDetails({
      ...dashboardDetails,
      parent: id,
    });
    setPath(path);
    setSelectedFolder(name);
  };

  const onOk = async () => {
    setCreationLoading(true);

    try {
      if (!(dashboardDetails.name && dashboardDetails?.parent)) {
        openNotification(
          "Details Incomplete",
          "Please complete the details",
          "warning"
        );
        return;
      } else if (attachChartToDash == false) {
        createnewDashboard(dashboardDetails)
          .then(({ data }) => {
            setCreationLoading(false);

            if (data != null) {
              onCreateNew(data);
              const keplerUrl = `/portal/kepler/DASHBOARD/${data.id}`;
              if (redirect) navigate(keplerUrl);
            } else {
              openNotification(
                "Something went wrong. Please try again!",
                " ",
                "error"
              );
            }
          })
          .catch((err) => {
            if (axios.isAxiosError(err) && isDefined(err.response)) {
              const data = err?.response?.data as ErrorResponse;
              const error = data.error;
              const description = data.description;

              openNotification(error, description, "error");
            }
          })
          .finally(() => setCreateDashboardModal(false));
      } else if (attachChartToDash) {
        createnewDashboard(dashboardDetails)
          .then(({ data: dashData }) => {
            onCreateNew(dashData);

            const payload = {
              dashboardId: dashData.id,
              chartIds: [id],
              action: "add",
            };

            manageChartOnDashboardAPI(payload).then(
              () => {
                const payload = {
                  dashboardId: dashData.id,
                  tabId: dashData.tabs[0].id,
                  chartIds: [id],
                  action: "add",
                };
                manageChartOnTabAPI(payload).then(
                  () => {
                    const defaultMeasurements =
                      getDefaultMeasurementsOfElements("chart");
                    const chartH = defaultMeasurements.height;
                    const chartMinH = defaultMeasurements.minHeight;
                    const chartMaxH = defaultMeasurements.maxHeight;

                    const chartW = defaultMeasurements.width;
                    const chartMinW = defaultMeasurements.minWidth;
                    const chartMaxW = defaultMeasurements.maxWidth;
                    const payload = {
                      dashboardId: dashData.id,
                      tabId: dashData.tabs[0].id,
                      type: "chart",
                      position: JSON.stringify(
                        JSON.stringify({
                          x: 1,
                          y: 1,
                          h: chartH,
                          w: chartW,
                          minH: chartMinH,
                          minW: chartMinW,
                          maxH: chartMaxH,
                          maxW: chartMaxW,
                          type: "chart",
                        })
                      ),
                      data: id,
                    };

                    createTabElementAPI(payload).then(
                      () => {
                        setCreationLoading(false);
                        setCreateDashboardModal(false);

                        if (dashData != null) {
                          const keplerUrl = `/portal/kepler/DASHBOARD/${dashData.id}`;
                          if (redirect) navigate(keplerUrl);
                        } else {
                          openNotification(
                            "Something went wrong. Please try again!",
                            " ",
                            "error"
                          );
                        }
                      },
                      (error) => {
                        openNotification(error.response.data, " ", "error");
                      }
                    );
                  },
                  (error) => {
                    openNotification(error.response.data, " ", "error");
                  }
                );
              },
              (error) => {
                openNotification(error.response.data, " ", "error");
              }
            );
          })
          .catch((err) => {
            if (axios.isAxiosError(err) && isDefined(err.response)) {
              const data = err?.response?.data as ErrorResponse;
              const error = data.error;
              const description = data.description;

              openNotification(error, description, "error");
            }
          });
      }
    } catch (error) {
      setCreationLoading(false);
      throw error;
    }
  };

  const getParent = async () => {
    if (notEmpty(id)) {
      getPathApi(id).then(({ data }) => {
        const size = data.length;

        if (
          data[size - 1]?.type == "FOLDER" ||
          data[size - 1]?.type == "PROJECT"
        ) {
          setDashboardDetails({
            ...dashboardDetails,
            parent: data[size - 1]?.id,
          });
          setSelectedFolder(data[size - 1]?.name);
        } else {
          setDashboardDetails({
            ...dashboardDetails,
            parent: data[size - 2]?.id,
          });
          setSelectedFolder(data[size - 2]?.name);
        }
      });
    }
  };

  useEffect(() => {
    getParent();
  }, []);

  useEffect(() => {
    favIconLoading(creationLoading);
    return () => {
      let favicon = document.querySelector('link[rel="icon"]') as any;
      favicon.href = getDefaultFavicon();
    };
  }, [creationLoading]);

  if (!KEPLER_USE_CASES.includes(info.product))
    return (
      <LicenseIncapableModal
        type={"KEPLER"}
        isOpen={createDashboardModal}
        setIsOpen={setCreateDashboardModal}
      />
    );

  return (
    <>
      <MtdModal
        headingIcon={<MonitorIcon />}
        heading={getLanguageLabel("dashboard")}
        extraActionHeading={
          attachChart ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {getLanguageLabel("attach")}
              <Switch
                size="small"
                checked={attachChartToDash}
                onChange={() => setAttachChartToDash(!attachChartToDash)}
              />
            </div>
          ) : (
            <></>
          )
        }
        closable={false}
        open={createDashboardModal}
        onOk={onOk}
        onCancel={() => setCreateDashboardModal(false)}
        footerExtraText={getLanguageLabel("accessMessage")}
        footerButtonArea={
          <MtdButton intent="primary" onClick={onOk} icon={<TickIcon />}>
            {getLanguageLabel("create")}
          </MtdButton>
        }
        information={
          <div style={{ padding: "15px", width: "200px" }}>
            <div className="text-and-icon-align">
              <InfoIcon />
              <Text strong>Info</Text>
            </div>
            <div style={{ paddingTop: "2px", paddingLeft: "20px" }}>
              <Text style={{ fontSize: "0.8rem" }}>
                {getLanguageLabel("dashboardMessage")}
              </Text>
            </div>
          </div>
        }
      >
        <div className="MtdHeader1">{getLanguageLabel("name")}</div>
        <MtdInput
          bordered
          autofocus
          onChange={(e: any) =>
            setDashboardDetails({
              ...dashboardDetails,
              name: e.target.value,
            })
          }
          value={dashboardDetails.name}
          name="chartName"
          required
          placeholder={getLanguageLabel("name")}
          style={{ width: "20vw", minWidth: "300px" }}
        />
        <div className="MtdHeader1">{getLanguageLabel("description")}</div>
        <MtdInput
          onChange={(e: any) =>
            setDashboardDetails({
              ...dashboardDetails,
              description: e.target.value,
            })
          }
          required
          placeholder={getLanguageLabel("descriptionOpt")}
          style={{ width: "20vw", minWidth: "300px" }}
        />

        <Row
          justify={"space-between"}
          align="middle"
          style={{
            marginTop: "1.5rem",
          }}
        >
          <Col>{getLanguageLabel("parentFolder")}</Col>
          <Col>
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <MtdButton
                icon={<FolderIcon />}
                onClick={() =>
                  dispatch(
                    openFileExplorerModal({
                      type: ["FOLDER"],
                      action: (data) => {
                        if (isDefined(data)) {
                          onSelectParentFolder(data);
                        }
                      },
                      activeId: id,
                    })
                  )
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                intent={selectedFolder ? "success" : "warning"}
              >
                {selectedFolder
                  ? selectedFolder
                  : getLanguageLabel("parentFolder")}
              </MtdButton>
            </div>
          </Col>
        </Row>
        <Row>
          {notEmpty(path) ? (
            <Text
              type="secondary"
              style={{
                marginTop: "0.5rem",
              }}
            >
              <div
                style={{
                  flexDirection: "row",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginRight: "1rem",
                    fontSize: "0.7rem",
                  }}
                >
                  {getLanguageLabel("selected")}:
                </div>
                {path?.map((p, idx) => (
                  <div style={{ display: "flex", fontSize: "0.7rem" }}>
                    <>{p.name}</>
                    {idx + 1 != path.length && <SingleChevronRightIcon />}
                  </div>
                ))}
              </div>
            </Text>
          ) : (
            <Text
              type="secondary"
              style={{
                marginTop: "0.5rem",
              }}
            >
              {getLanguageLabel("dashboardFolderMessage")}
            </Text>
          )}
        </Row>
      </MtdModal>
    </>
  );
};
