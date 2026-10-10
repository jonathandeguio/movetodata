import { ResourceTypeEnum } from "Apps/explorer/explorer.utils";
import { Select, Typography } from "antd";
import { ApplicationIcon } from "assets/icons/mtdInterfaceIcons";
import { MonitorIcon } from "assets/icons/mtdMiscellaneousIcons";
import {
  ArrowRightIcon,
  SingleChevronRightIcon,
  TickIcon,
} from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  getLanguageLabel,
  isEmpty,
  notEmpty,
  openNotification,
} from "utils/utilities";
import { openFileExplorerModal } from "../../../redux/ModalSlice";
import {
  createTabElementAPI,
  getDashboardTabsAPI,
  manageChartOnDashboardAPI,
  manageChartOnTabAPI,
} from "../dashboard/Dashboard.api";
import { getDefaultMeasurementsOfElements } from "../dashboard/Dashboard.utils";

type AttachDashboardModalProps = {
  id: string | undefined;
  attachDashboardModal: boolean;
  setAttachDashboardModal: (state: boolean) => void;
  redirect?: boolean;
};
type SelectDashboardDataType = {
  label: string;
  value: number;
  dashboard: {
    id: string;
    tabs: Array<object>;
  };
}[];
type SelectTabDataType = {
  label: string;
  value: number;
  tab: {
    id: string;
  };
}[];

const { Text } = Typography;

export default ({
  id,
  attachDashboardModal,
  setAttachDashboardModal,
  redirect = true,
}: AttachDashboardModalProps) => {
  const defaultTabDetails = 0;
  const dispatch = useDispatch();
  const [selectedDashboardName, setSelectedDashboardName] = useState("");
  const [dashboardPath, setDashboardPath] = useState<any[]>();
  const [selectedDashboardId, setSelectedDashboardId] = useState("");

  const [tabDetails, setTabDetails] = useState<number>(defaultTabDetails);

  const [tabs, setTabs] = useState<SelectTabDataType | undefined>(undefined);
  const [attachmentLoading, setAttachmentLoading] = useState<boolean>(false);

  const onOk = async () => {
    if (isEmpty(selectedDashboardId) || tabDetails == -1) {
      openNotification(
        "Details Incomplete",
        "Please complete the details",
        "warning"
      );
      return;
    }

    setAttachmentLoading(true);
    const payload = {
      dashboardId: selectedDashboardId,
      chartIds: [id],
      action: "add",
    };
    manageChartOnDashboardAPI(payload)
      .then(
        () => {
          const payload = {
            dashboardId: selectedDashboardId,
            tabId: tabs![tabDetails].tab.id,
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
                dashboardId: selectedDashboardId,
                tabId: tabs![tabDetails].tab.id,
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
                () => {},
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
      )
      .finally(() => {
        setAttachDashboardModal(false);
        setAttachmentLoading(false);
      });
  };

  const getTabs = () => {
    // Right now its picking tabs from dashboard data, replace this with getTabsByDashboard
    getDashboardTabsAPI(selectedDashboardId).then((data) => {
      let _tabs: any[] = [];
      data.map((tab: any, _i: number) =>
        _tabs.push({
          label: tab.name,
          value: _i,
          tab: tab,
        })
      );
      setTabs(_tabs);
    });
  };

  useEffect(() => {
    if (notEmpty(selectedDashboardId)) {
      getTabs();
    }
  }, [selectedDashboardId]);

  return (
    <>
      <MtdModal
        headingIcon={<ApplicationIcon />}
        heading={getLanguageLabel("attachToADashboard")}
        open={attachDashboardModal}
        onOk={onOk}
        onCancel={() => setAttachDashboardModal(false)}
        footerButtonArea={
          <MtdButton
            intent={isEmpty(selectedDashboardId) ? "none" : "success"}
            // className="Button--primary"
            key="submit"
            onClick={onOk}
            icon={
              isEmpty(selectedDashboardId) ? <ArrowRightIcon /> : <TickIcon />
            }
            loading={attachmentLoading}
            disabled={isEmpty(selectedDashboardId) ? true : false}
          >
            {getLanguageLabel("attach")}
          </MtdButton>
        }
      >
        <MtdButton
          intent={isEmpty(selectedDashboardId) ? "action" : "success"}
          onClick={() => {
            dispatch(
              openFileExplorerModal({
                type: [ResourceTypeEnum.DASHBOARD],
                activeId: id ?? "",
                // activeProject: "",
                action: ({ name, path, id }) => {
                  setSelectedDashboardId(id);
                  setSelectedDashboardName(name);
                  setDashboardPath(path);
                },
              })
            );
          }}
          icon={
            isEmpty(selectedDashboardId) ? <ArrowRightIcon /> : <MonitorIcon />
          }
        >
          {isEmpty(selectedDashboardId)
            ? `${getLanguageLabel("selectDashboard")}`
            : selectedDashboardName}
        </MtdButton>
        {notEmpty(dashboardPath) && (
          <Text
            type="secondary"
            style={{
              marginTop: "2rem",
              fontSize: "0.9rem",
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
                  fontSize: "0.6rem",
                }}
              >
                {getLanguageLabel("selected")}:
              </div>
              {dashboardPath?.map((p, idx) => (
                <div style={{ display: "flex", fontSize: "0.6rem" }}>
                  <>{p.name}</>
                  {idx + 1 != dashboardPath.length && (
                    <SingleChevronRightIcon />
                  )}
                </div>
              ))}
            </div>
          </Text>
        )}
        {selectedDashboardId !== "" && (
          <>
            <div style={{ marginTop: "2rem" }}>{getLanguageLabel("tab")}</div>
            <Select
              placeholder={`${getLanguageLabel("select")} ${getLanguageLabel(
                "tab"
              )} `}
              style={{
                width: "100%",
                marginBottom: "0.5rem",
              }}
              onChange={(e) => {
                setTabDetails(e);
              }}
              defaultValue={0}
              options={tabs}
            />
          </>
        )}
      </MtdModal>
    </>
  );
};
