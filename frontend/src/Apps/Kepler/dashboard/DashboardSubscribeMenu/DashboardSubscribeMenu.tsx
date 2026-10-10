import {
  Avatar,
  Badge,
  Card,
  Divider,
  Popconfirm,
  Popover,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { RootState } from "redux/types/store";

import Meta from "antd/es/card/Meta";
import { SearchEmptyState } from "assets/Illustrations/EmptyState";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import NoData from "components/CommonUI/NoData";
import MtdLoader from "components/mtdLoader";
import { JobStatusEnum } from "components/bottomBar/Schedules/SchedulesModal.constants";
import { actionScheduleAPI } from "components/bottomBar/Schedules/api";
import { DEFAULT_CRON_JOB } from "components/common/CronJob/CronJob.constants";
import cronstrue from "cronstrue";
import { useParams } from "react-router";
import { getLanguageLabel, isDefined, openNotification } from "utils/utilities";
import {
  AddIcon,
  HistoricalRunsIcon,
  PublishIcon,
  RunIcon,
  SearchIcon,
  StopIcon,
} from "../../../../assets/icons/mtdActionIcons";
import { EditIcon } from "../../../../assets/icons/mtdEditorIcons";
import { EmailIcon } from "../../../../assets/icons/mtdFileIcons";
import { TrashIcon } from "../../../../assets/icons/mtdMiscellaneousIcons";
import { EDIT_MODE } from "../../../../redux/constants/resourcePermissionConstants";
import "./DashboardSubscribeMenu.scss";
import DashboardSubscribeMenuPopover from "./DashboardSubscribeMenuPopover";
import {
  deleteSubscriptionAPI,
  getSubscriptions,
  updateSubscriptionAPI,
} from "./api";
import { useUserHook } from "hooks/useUsers";
import { User } from "global";
const { Text } = Typography;

function DashboardSubscribeMenu() {
  const { id: dashboardId } = useParams();
  if (!isDefined(dashboardId)) {
    throw new Error("Id is undefined, unable to load chart!");
  }
  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[dashboardId]
  );
  const editable = resourcePermission.mode == EDIT_MODE;
  const {
    subscribeMenu,
    subscribePopover,
  }: {
    subscribeMenu: boolean;
    subscribePopover: boolean;
  } = useSelector((state: RootState) => state.dashboardEdit);

  const [dashboardSubscriptions, setDashboardSubscriptions] = useState<any>([]);
  const [subscribeDataLoading, setSubscribeDataLoading] =
    useState<boolean>(false);
  const [initialPopoverData, setInitialPopoverData] = useState<any>();

  const [openSubscriptionModal, setOpenSubscriptionModal] =
    useState<boolean>(false);
  const [confirmLoadingSubscriptionModal, setConfirmLoadingSubscriptionModal] =
    useState<boolean>(false);

  const userMap = new Map();

  const getUser = useUserHook();

  const showModal = () => {
    setInitialPopoverData({
      id: null,
      jobId: null,
      runNow: false,
      body: "",
      name: getLanguageLabel("new"),
      subject: "",
      subscribers: [],
      dashboardTab: null,
      previewImageCheckBox: true,
      permissionCheckBox: true,
      cronExpression: DEFAULT_CRON_JOB,
    });
    setOpenSubscriptionModal(true);
  };

  const handleOkSubscriptionModal = () => {
    setConfirmLoadingSubscriptionModal(true);
    setTimeout(() => {
      setOpenSubscriptionModal(false);
      setConfirmLoadingSubscriptionModal(false);
    }, 2000);
  };

  const handleCancelSubscriptionModal = () => {
    setOpenSubscriptionModal(false);
  };

  const getSubscriptionUserDetails = async (subscriptions: any) => {
    subscriptions.map((subscription: any) => {
      subscription.sendTo &&
        JSON.parse(subscription.sendTo).map((user: any) => {
          if (!userMap.has(user)) {
            getUser(user).then((userData: User) => {
              userMap.set(user, userData);
            });
            // getUserById(user).then((result: any) => {
            //   userMap.set(user, result);
            // });
          }
        });
    });
  };
  const getSubscriptionsHelper = () => {
    if (dashboardId) {
      setSubscribeDataLoading(true);
      getSubscriptions(dashboardId)
        .then((subscriptions: any) => {
          getSubscriptionUserDetails(subscriptions).then(() => {
            setDashboardSubscriptions(subscriptions);
          });
        })
        .finally(() => {
          setSubscribeDataLoading(false);
        });
    } else {
      openNotification("No Dashboard Id Present", "", "error");
    }
  };

  const SubscribeHeader = () => {
    return (
      <div className="kepler-container-plane-subscribe-header">
        <MtdButton fill={true} icon={<AddIcon />} onClick={showModal}>
          Subscription
        </MtdButton>
        <MtdModal
          headingIcon={<PublishIcon />}
          heading={getLanguageLabel("new")}
          // extraActionHeading={
          //   <div className="text-and-icon-center" style={{ gap: "0.5rem" }}>
          //     <div className="MtdSubHeader1">
          //       {getLanguageLabel("onlineNow")}
          //     </div>

          //     <Form.Item
          //       name="runNow"
          //       style={{
          //         marginBottom: 0,
          //       }}
          //       valuePropName="checked"
          //     >
          //       <Switch size="small" />
          //     </Form.Item>
          //   </div>
          // }
          open={openSubscriptionModal}
          onOk={handleOkSubscriptionModal}
          confirmLoading={confirmLoadingSubscriptionModal}
          onCancel={handleCancelSubscriptionModal}
          // className="kepler-container-plane-subscribe-modal"
          // footerExtraText="Only editors and owners can view or edit this configuration."
          // footerButtonArea={
          //   <Form.Item style={{ marginBottom: 0 }}>
          //     <MtdButton
          //       onClick={() =>
          //         handleFinish(form.getFieldsValue(), initialPopoverData)
          //       }
          //       intent="action"
          //     >
          //       {initialPopoverData && initialPopoverData.dashboardTab
          //         ? "Update Subscription"
          //         : "Create subscription"}
          //     </MtdButton>
          //   </Form.Item>
          // }
          width={1000}
        >
          <DashboardSubscribeMenuPopover initialData={initialPopoverData} />
        </MtdModal>
        <MtdInput
          allowClear
          placeholder="Search filters"
          suffix={<SearchIcon />}
        />
        <Divider />
      </div>
    );
  };
  const runAndPause = (subscription: any) => {
    const handleRunAndPauseSubscription = () => {
      subscription.paused = !subscription.paused;

      actionScheduleAPI(
        subscription.jobId,
        subscription.paused ? JobStatusEnum.PAUSED : JobStatusEnum.RUNNING
      ).then(() => {
        updateSubscriptionAPI(subscription).then(() => {
          getSubscriptionsHelper();
        });
      });
    };

    return (
      <div onClick={handleRunAndPauseSubscription}>
        {subscription.paused ? (
          <RunIcon key="run" color={"var(--ACTION_COLOR)"} />
        ) : (
          <StopIcon key="stop" color={"var(--DANGEROUS_COLOR)"} />
        )}
      </div>
    );
  };
  useEffect(() => {
    getSubscriptionsHelper();
  }, [subscribeMenu]);

  useEffect(() => {
    if (openSubscriptionModal) {
      setOpenSubscriptionModal(false);
      getSubscriptionsHelper();
    }
  }, [subscribePopover]);

  if (!subscribeMenu || !editable) return <></>;

  if (subscribeDataLoading) {
    return (
      <div className="kepler-container-plane-subscribe">
        <SubscribeHeader />
        <div className="kepler-container-plane-subscribe-content">
          <MtdLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="kepler-container-plane-subscribe">
      <SubscribeHeader />
      <div className="kepler-container-plane-subscribe-content">
        {dashboardSubscriptions.length === 0 ? (
          <NoData
            heading="No subscription present"
            subHeading="Add subscription"
            icon={<SearchEmptyState />}
          />
        ) : (
          // <EmptyChart
          //   data={`No subscription present`}
          //   dataSecondary={"Add subscription"}
          //   icon={<EmailIcon size={116} />}
          // />
          dashboardSubscriptions.map((subscription: any) => {
            return (
              <div className="kepler-container-plane-subscribe-content-item">
                <Card
                  actions={[
                    <Popconfirm
                      title="Delete the schedule"
                      description="Are you sure to delete this schedule?"
                      onConfirm={() => {
                        actionScheduleAPI(
                          subscription.jobId,
                          JobStatusEnum.DELETED
                        ).then(() => {
                          deleteSubscriptionAPI(subscription).then(() => {
                            setDashboardSubscriptions(
                              dashboardSubscriptions.filter(
                                (_subscription: any) =>
                                  _subscription.id != subscription.id
                              )
                            );
                          });
                        });
                      }}
                      okText="Yes"
                      cancelText="No"
                    >
                      <div>
                        <TrashIcon
                          key="delete"
                          color="var(--DANGEROUS_COLOR)"
                        />
                      </div>
                    </Popconfirm>,
                    <div
                      onClick={() => {
                        setInitialPopoverData({
                          id: subscription.id,
                          jobId: subscription.jobId,
                          runNow: !subscription.paused,
                          previewImageCheckBox: subscription.previewImage,
                          permissionCheckBox: subscription.providePermission,
                          body: subscription.body,
                          name: subscription.name,
                          subject: subscription.subject,
                          cronExpression: subscription.cronExpression,
                          subscribers: subscription.sendTo
                            ? JSON.parse(subscription.sendTo)
                            : [],
                          dashboardTab: subscription.tabId,
                        });
                        setOpenSubscriptionModal(true);
                      }}
                    >
                      <EditIcon key="edit" />
                    </div>,
                    runAndPause(subscription),
                  ]}
                >
                  <Meta
                    avatar={
                      <Avatar.Group
                        maxCount={2}
                        maxStyle={{
                          color: "#f56a00",
                          backgroundColor: "#fde3cf",
                        }}
                      >
                        {subscription.sendTo &&
                          JSON.parse(subscription.sendTo).map((key: string) => {
                            if (userMap.has(key)) {
                              return (
                                <Popover
                                  title={
                                    <>
                                      <Text type="secondary" strong>
                                        <>
                                          <Avatar
                                            src={
                                              userMap.get(key).profileImage !=
                                              ""
                                                ? userMap.get(key).profileImage
                                                : null
                                            }
                                          >
                                            {userMap.get(key).name
                                              ? (
                                                  userMap.get(key) as $TSFixMe
                                                ).name
                                                  .charAt(0)
                                                  .toUpperCase()
                                              : "B"}
                                          </Avatar>
                                        </>{" "}
                                        &nbsp; {userMap.get(key).name}{" "}
                                      </Text>
                                      <Divider style={{ margin: "1px" }} />{" "}
                                      {userMap.get(key).email}
                                    </>
                                  }
                                  placement="bottom"
                                >
                                  {
                                    <Avatar
                                      src={
                                        userMap.get(key).profileImage != ""
                                          ? userMap.get(key).profileImage
                                          : null
                                      }
                                    >
                                      {userMap.get(key).name != null
                                        ? userMap
                                            .get(key)
                                            .name.charAt(0)
                                            .toUpperCase()
                                        : ""}
                                    </Avatar>
                                  }
                                </Popover>
                              );
                            } else {
                              return (
                                <Avatar style={{ backgroundColor: "#f56a00" }}>
                                  U
                                </Avatar>
                              );
                            }
                          })}
                      </Avatar.Group>
                    }
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            paddingTop: "5px",
                            color: "var(--movetodata-font-color-muted)",
                            textTransform: "uppercase",
                          }}
                        >
                          {subscription.name}
                        </div>
                        {!subscription.paused && (
                          <Badge
                            status="processing"
                            style={{ marginRight: "2px" }}
                          />
                        )}
                      </div>
                    }
                    description={
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                          justifyContent: "center",
                          alignItems: "flex-start",
                        }}
                      >
                        <div className="text-and-icon-center">
                          <EmailIcon />
                          {"Subject : "}
                          <div
                            style={{
                              color: "var(--movetodata-font-color-light-black)",
                            }}
                          >
                            {subscription.subject}
                          </div>
                        </div>
                        <div className="text-and-icon-center">
                          <HistoricalRunsIcon />
                          {"Schedule : "}
                          <div
                            style={{
                              color: "var(--movetodata-font-color-light-black)",
                            }}
                          >
                            {cronstrue.toString(subscription.cronExpression)}
                          </div>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DashboardSubscribeMenu;
