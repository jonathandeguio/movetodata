import {
  Avatar,
  Badge,
  Col,
  Divider,
  List,
  notification,
  Popover,
  Row,
  Skeleton,
  Tooltip,
  Typography,
} from "antd";
import { fetchUserDetailsAPI } from "Apps/Dataset/Dataset.api";
import { useNavigateHelper } from "Apps/explorer/explorer.hooks";
import {
  CrossIcon,
  NotificationIcon,
  SparklesIcon,
} from "assets/icons/mtdActionIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import "./Notifications.scss";

import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { MtdInfiniteScroll } from "components/MtdInfiniteScroll/MtdInfiniteScroll.view";
import { fetchUsersDetailsAPI } from "components/Builds/Builds.api";
import MtdUserPopover from "components/UserPopover/userpopover";
import SBElement from "layouts/Sidebar/SBElement";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import {
  getLanguageLabel,
  getSocketClient,
  getTimeDisplay,
  isDefined,
  openNotification,
  timeConverter,
} from "utils/utilities";
import {
  deleteNotificationAPI,
  getAllNotificationAPI,
  readAllNotificationAPI,
  readNotificationAPI,
} from "./Notifications.api";
import {
  getNotificationPrefix,
  NOTIFICATION_TYPES,
} from "./utils/Notification.utils";
import { useNavigate } from "react-router";

interface TProps {
  iconSize?: number;
  showText?: any;
  selected?: boolean;
  onClick?: any;
  ref?: any;
}

const { Text } = Typography;
export const NotificationBell = ({
  iconSize,
  showText,
  selected,
  onClick,
}: TProps) => {
  const pageSize = 10;
  const navigator = useNavigateHelper();
  const navigate = useNavigate();
  const ref = useRef(null);
  const buttonRef = useRef(null);

  const [showDot, setShowDot] = useState(false);

  const { user } = useSelector((state: RootState) => state.userDetails);
  const userId = user.id;
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [page, setPage] = useState(0);

  const [hasMoreDataToShow, setHasMoreDataToShow] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] =
    useState(false);

  const [userMap, setUserMap] = useState();

  const getUsersDetails = async (data: Notifications[]) => {
    const user_list: any[] = [];
    for (let i = 0; i < data.length; i++) {
      user_list.push(data[i].influencer);
    }

    const uniqueUSERIDList: string[] = user_list.filter(
      (item, index) => user_list.indexOf(item) === index
    );
    const { data: userDetails } = await fetchUsersDetailsAPI(uniqueUSERIDList);

    setUserMap(userDetails);
  };

  const resurfaceNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await getAllNotificationAPI(user.id, page, pageSize);
      if (data.content.length < pageSize) setHasMoreDataToShow(false);
      setPage((prev) => prev + 1);

      setNotifications((notifications) => {
        const newNotifications = isDefined(notifications)
          ? notifications.concat(data.content)
          : [].concat(data.content);

        return newNotifications;
      });

      await getUsersDetails([
        ...(notifications as Notifications[]),
        ...data.content,
      ]);
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        openNotification("Unable to fetch Notifications", "", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading]);

  useEffect(() => {
    const client = getSocketClient();

    client.activate();

    client.onConnect = (frame) => {
      client.subscribe(`/topic/notification/${userId}`, async function (mail) {
        const message = JSON.parse(mail.body).message;
        const newNotification: Notifications = JSON.parse(message);
        newNotification.timestamp = new Date().valueOf();

        setNotifications((notifications) => {
          const newNotifications = [newNotification, ...notifications];
          return newNotifications;
        });
        setShowDot(true);
        getUsersDetails([...notifications, newNotification]);
        fetchUserDetailsAPI(newNotification.influencer).then(({ data }) => {
          notification.info({
            key: "Notification",
            message: (
              <>
                <Row justify={"space-between"}>
                  <Col>{newNotification.type}</Col>
                </Row>
              </>
            ),
            onClick() {
              navigator(newNotification.resourceId);
            },
            closeIcon: <>{<CrossIcon />}</>,
            description: (
              <>
                <Row>
                  <Col>
                    {data.name} : {newNotification.message}
                  </Col>
                </Row>
              </>
            ),
            duration: 15,
            placement: "bottomRight",
          });
        });
      });
    };

    return () => {
      client.deactivate();
    };
  }, [userId]);

  useEffect(() => {
    resurfaceNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (
        ref.current &&
        !(ref.current as any).contains(event.target) &&
        buttonRef.current &&
        !(buttonRef.current as any).contains(event.target)
      ) {
        setIsNotificationPopoverOpen(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, buttonRef]);

  return (
    <Popover
      overlayStyle={{ width: "500px" }}
      placement={"right"}
      trigger={"click"}
      open={isNotificationPopoverOpen}
      onOpenChange={() => setShowDot(false)}
      content={
        <div ref={ref}>
          <Row
            justify={notifications.length > 0 ? "space-between" : "center"}
            align="middle"
          >
            <Col>
              <Text>
                <div className="text-and-icon-center">
                  <NotificationIcon />
                  {getLanguageLabel("notifications")}
                </div>
              </Text>
            </Col>
            {notifications.length > 0 && (
              <Col>
                <MtdButton
                  intent={"action"}
                  icon={<SparklesIcon />}
                  onClick={() =>
                    readAllNotificationAPI().then(() => {
                      setNotifications((notifications) => {
                        const newNotifications = notifications.map((ele) => {
                          return { ...ele, isRead: true };
                        });

                        return newNotifications;
                      });
                    })
                  }
                  outlined
                >
                  Mark as read
                </MtdButton>
              </Col>
            )}
          </Row>
          <Divider />
          <div
            id="scrollableDiv"
            style={{
              height: "65vh",
              overflowY: "auto",
              border: "1px solid var(--movetodata-border-color-default)",
            }}
          >
            {notifications.length == 0 && (
              <Row style={{ height: "100%" }} align="middle" justify={"center"}>
                <Col>{getLanguageLabel("noNewNotifications")}</Col>
              </Row>
            )}
            <MtdInfiniteScroll
              pageSize={pageSize}
              isLoading={isLoading}
              next={resurfaceNotifications}
              hasMore={hasMoreDataToShow}
              loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
              endMessage={
                <Divider plain>
                  All caught up! 🚀 Nothing new for now. Ready for more?
                </Divider>
              }
              scrollableTarget="scrollableDiv"
            >
              <List loading={!isDefined(notifications) && !isDefined(userMap)}>
                {notifications?.map((notification: Notifications) => {
                  return (
                    <List.Item
                      className="notification-row"
                      style={
                        notification.isRead
                          ? {
                              padding: "1rem",
                            }
                          : {
                              background: "var(--movetodata-bkg-color-muted)",
                              padding: "1rem",
                            }
                      }
                      actions={[
                        <Col>
                          <MtdButton
                            intent="dangerous"
                            onClick={() =>
                              deleteNotificationAPI(notification.id).then(() =>
                                setNotifications((notifications) => {
                                  const newNotifications = notifications.filter(
                                    (ele) => ele.id != notification.id
                                  );

                                  return newNotifications;
                                })
                              )
                            }
                            icon={<TrashIcon />}
                            icononly
                            minimal
                          />
                        </Col>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            src={
                              userMap != undefined &&
                              (userMap as any)[notification?.influencer] &&
                              (userMap as any)[notification?.influencer]
                                ?.profileImage != ""
                                ? (userMap as any)[notification?.influencer]
                                    ?.profileImage
                                : null
                            }
                            size="small"
                          >
                            {userMap != undefined &&
                            (userMap as any)[notification?.influencer] &&
                            (userMap as any)[notification?.influencer]?.name
                              ? (userMap as any)[notification?.influencer]?.name
                                  .charAt(0)
                                  .toUpperCase()
                              : "U"}
                          </Avatar>
                        }
                        description={
                          <Row
                            align="middle"
                            justify="space-between"
                            onClick={() => {
                              setIsNotificationPopoverOpen(false);
                              readNotificationAPI(notification.id).then(() => {
                                setNotifications((notifications) => {
                                  const newNotifications = notifications.map(
                                    (ele) => {
                                      return ele.id == notification.id
                                        ? { ...ele, isRead: true }
                                        : ele;
                                    }
                                  );

                                  return newNotifications;
                                });
                              });
                              switch (notification.type) {
                                case NOTIFICATION_TYPES.ACCESS_REQUEST:
                                  navigate(
                                    `/portal/accessManager/${notification.resourceId}`
                                  );
                                case NOTIFICATION_TYPES.MENTION:
                                  navigator(notification.resourceId);
                                default:
                                  return;
                              }
                            }}
                          >
                            <Col>
                              <MtdUserPopover
                                record={
                                  userMap != undefined &&
                                  (userMap as any)[notification?.influencer]
                                }
                              >
                                <strong>
                                  {userMap != undefined &&
                                    (userMap as any)[
                                      notification?.influencer
                                    ] &&
                                    (userMap as any)[notification?.influencer]
                                      ?.name}
                                </strong>
                              </MtdUserPopover>{" "}
                              {getNotificationPrefix(notification.type)}:{" "}
                              {notification.message}
                              <br />
                              {
                                <Tooltip
                                  title={timeConverter(notification.timestamp)}
                                >
                                  {getTimeDisplay(notification.timestamp)}
                                </Tooltip>
                              }
                            </Col>
                          </Row>
                        }
                      />
                    </List.Item>
                  );
                })}
              </List>
            </MtdInfiniteScroll>
          </div>{" "}
        </div>
      }
    >
      <div ref={buttonRef}>
        <Badge
          color={showDot ? "var(--movetodata-intent-danger)" : ""}
          text={""}
          count={showDot ? 1 : 0}
          // dot
          style={{ marginRight: "4px", marginTop: "5px" }}
        >
          <SBElement
            icon={
              <NotificationIcon
                size={iconSize}
                // color={showDot ? "var(--movetodata-intent-danger)" : ""}
              />
            }
            tooltip={getLanguageLabel("notifications")}
            onClick={() => {
              setIsNotificationPopoverOpen((prev) => !prev);
            }}
            showText={false}
          />
        </Badge>
      </div>
    </Popover>
  );
};
