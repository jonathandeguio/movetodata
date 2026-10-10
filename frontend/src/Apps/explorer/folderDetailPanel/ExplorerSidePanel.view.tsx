import {
  Avatar,
  Col,
  Divider,
  Popover,
  Row,
  Skeleton,
  Tooltip,
  Typography,
} from "antd";
import { CrossIcon, MultiselectIcon } from "assets/icons/mtdActionIcons";
import { CopyIcon } from "assets/icons/mtdEditorIcons";
import { EyeOpenIcon, KeyIcon } from "assets/icons/mtdInterfaceIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { updateUserDataAPI } from "components/CommandPalette/CommandPalette.api";
import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import {
  fetchPermissionMappingAPI,
  fetchUserToResourcePermissionsAPI,
} from "components/Permissions/Permissions.api";
import { PermissionModel } from "components/Permissions/PermissionsModal";
import { MtdTag } from "components/Tag/Tag";
import MtdUserPopover from "components/UserPopover/userpopover";
import { User } from "global";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import { useToggleState } from "hooks/useToggleState";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  IsUUID,
  changeDesc,
  copyToClipboard,
  getLanguageLabel,
  getRandomNumber,
  isDefined,
  timeConverter,
} from "utils/utilities";
import { updateUserDetails } from "../../../redux/actions/userActions";
import { ThunkAppDispatch } from "../../../redux/types/store";
import { Resource } from "../explorer";
import { usePath } from "../explorer.hooks";
import { getNodeIcon } from "../explorer.utils";
import "./sidePanel.scss";
import { useUserHook } from "hooks/useUsers";

const { Text, Title } = Typography;

interface Props {
  selectedItems: string[];
  id: string | undefined;
  setIsSidePanelOpen: any;
}

export const ExplorerSidePanel: React.FC<Props> = ({
  selectedItems,
  id,
  setIsSidePanelOpen,
}) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);
  const [resource, setResource] = useState<Resource>();
  const [resourcePath, setResourcePath] = useState<string>();

  const [createdBy, setCreatedBy] = useState<User>();
  const [updatedBy, setUpdatedBy] = useState<User>();

  const [userWithAcccess, setuserWithAcccess] = useState([]);

  const { getFileIndex } = useFileExplorerService();
  const [getPath] = usePath();

  const [isPermissionsModalOpen, openPermissionsModal, closePermissionsModal] =
    useToggleState(false);

  const [userPermissions, setUserPermissions] = useState<UserPermissions>();

  const [selectedTab, setSelectedTab] = useState<string>("info");
  const [tooltipTitle, setTooltipTitle] = useState(
    getLanguageLabel("clickToCopyIntoClipboard")
  );

  const getSidePanelId = (selectedItem: string[], activeId: string) => {
    if (selectedItem.length > 0) return selectedItem[0];
    return activeId;
  };

  useUserHook(resource?.createdBy, {
    resolveCallback: (data) => {
      setCreatedBy(data);
    },
  });
  useUserHook(resource?.updatedBy, {
    resolveCallback: (data) => {
      setUpdatedBy(data);
    },
  });

  useEffect(() => {
    if ((isDefined(id) && IsUUID(id)) || selectedItems.length > 0) {
      const sidePanelId = getSidePanelId(selectedItems, id as string);
      if (resource?.id != sidePanelId) {
        getFileIndex(sidePanelId).then((data) => {
          setResource(data);
          setResourcePath(
            ["/Projects", ...getPath(data).map((p) => p.name)].join("/")
          );
          // if (isDefined(data.createdBy)) {
          //   fetchUserDetailsAPI(data.createdBy).then(({ data: user }) => {
          //     setCreatedBy(user);
          //   });
          // }
          // if (isDefined(data.updatedBy)) {
          //   fetchUserDetailsAPI(data.updatedBy).then(({ data: user }) => {
          //     setUpdatedBy(user);
          //   });
          // }
        });

        fetchPermissionMappingAPI(sidePanelId).then(({ data }) => {
          setuserWithAcccess(data);
        });

        fetchUserToResourcePermissionsAPI(sidePanelId).then(({ data }) => {
          setUserPermissions(data);
        });
      }
    } else
      setIsSidePanelOpen((state: boolean) => {
        updateUserDataAPI({
          ...user,
          sidePanelOpen: !state,
        }).then(({ data }) => {
          dispatch(updateUserDetails(data));
        });
        return !state;
      });
  }, [id, selectedItems]);

  return (
    <div className="sidePanel">
      <Row
        align={"middle"}
        justify="space-between"
        className="sidePanel-header"
      >
        <Col className="text-and-icon-center">
          {selectedItems.length >= 2 ? (
            <>
              <MultiselectIcon />
              {selectedItems.length} items selected
            </>
          ) : (
            <>
              {resource &&
                getNodeIcon(
                  resource?.type,
                  resource?.subType,
                  false,
                  16,
                  resource?.metaData
                )}
              &nbsp;{resource?.name}
            </>
          )}
        </Col>
        <Col>
          <MtdButton
            onClick={() =>
              setIsSidePanelOpen((state: boolean) => {
                updateUserDataAPI({
                  ...user,
                  sidePanelOpen: !state,
                }).then(({ data }) => {
                  dispatch(updateUserDetails(data));
                });
                return !state;
              })
            }
            icon={<CrossIcon />}
            icononly
            trimicononlypadding
            minimal
          />
        </Col>
      </Row>
      <div className="sidePanel-body">
        {selectedItems.length < 2 && (
          <>
            <Row justify={"center"}>
              <Col>
                <Title level={4} type={"secondary"}>
                  {getLanguageLabel("whoHasAccess")}
                </Title>
              </Col>
            </Row>
            <Row justify={"center"}>
              <Col>
                {userWithAcccess ? (
                  <Avatar.Group
                    maxCount={3}
                    maxStyle={{
                      color: "#f56a00",
                      backgroundColor: "#fde3cf",
                    }}
                  >
                    {userWithAcccess?.map((user: any) => {
                      return (
                        user.identity && (
                          <Tooltip title={user.identity?.name}>
                            <Avatar src={user.identity?.profileImage}>
                              {user?.identity?.name?.charAt(0).toUpperCase()}
                            </Avatar>
                          </Tooltip>
                        )
                      );
                    })}
                  </Avatar.Group>
                ) : (
                  <>
                    <Skeleton.Button active size={"default"} shape={"circle"} />
                    <Skeleton.Button active size={"default"} shape={"circle"} />
                    <Skeleton.Button active size={"default"} shape={"circle"} />
                  </>
                )}
              </Col>
            </Row>
            <br />

            <Row justify={"space-evenly"}>
              <Col>
                <MtdButton
                  intent={userWithAcccess ? "primary" : "none"}
                  disabled={!userWithAcccess}
                  style={{ borderRadius: "1rem" }}
                  onClick={openPermissionsModal}
                  icon={<KeyIcon />}
                >
                  {getLanguageLabel("manageAccess")}
                </MtdButton>
              </Col>
            </Row>
            {isPermissionsModalOpen && (
              <PermissionModel
                id={getSidePanelId(selectedItems, id as string)}
                open={isPermissionsModalOpen}
                handleClose={closePermissionsModal}
              />
            )}

            <br />
            <Divider style={{ margin: "1rem 0" }} />

            <MtdSwitch
              items={[
                {
                  label: getLanguageLabel("info"),
                  value: "info",
                  children: (
                    <div className="sidePanel-details">
                      <div className="sidePanel-details-item">
                        <Row justify={"start"}>
                          <Col>{getLanguageLabel("description")}</Col>
                        </Row>
                        <Row>
                          <Col>
                            <Tooltip
                              title={getLanguageLabel(
                                "clickHereToEnterDesciption"
                              )}
                            >
                              <MtdInput
                                dynamicWidth
                                editText
                                className="editText"
                                debounceInterval={1000}
                                onChange={(e: any) => {
                                  changeDesc(id as string, e.target.value);
                                }}
                                variant={"borderless"}
                                value={resource?.description as string}
                                placeholder={getLanguageLabel("description")}
                              />
                            </Tooltip>
                          </Col>
                        </Row>
                      </div>

                      <div className="sidePanel-details-item">
                        <Row>
                          <Col>{getLanguageLabel("resource")}</Col>
                        </Row>
                        <Row>
                          <Col>
                            <Popover
                              title={tooltipTitle}
                              content={resource?.id}
                              style={{ display: "inline" }}
                            >
                              <div
                                className="text-and-icon-center"
                                onClick={() =>
                                  copyToClipboard(resourcePath, setTooltipTitle)
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  color: "var(--color)",
                                  width: "16vw",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                }}
                              >
                                <Text
                                  style={{
                                    flex: "1",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {resource?.id}
                                </Text>
                                <CopyIcon />
                              </div>
                            </Popover>
                          </Col>
                        </Row>
                      </div>
                      <div className="sidePanel-details-item">
                        <Row>
                          <Col>{getLanguageLabel("path")}</Col>
                        </Row>
                        <Row>
                          <Col>
                            <Popover
                              title={tooltipTitle}
                              content={resourcePath}
                              style={{ display: "inline" }}
                            >
                              <div
                                className="text-and-icon-center"
                                onClick={() =>
                                  copyToClipboard(resourcePath, setTooltipTitle)
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  color: "var(--color)",
                                  width: "16vw",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                }}
                              >
                                <Text
                                  style={{
                                    flex: "1",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {resourcePath}
                                </Text>
                                <CopyIcon />
                              </div>
                            </Popover>
                          </Col>
                        </Row>
                      </div>
                      <div className="sidePanel-details-item">
                        <Row>
                          <Col>{getLanguageLabel("type")}</Col>
                        </Row>
                        <Row>
                          <Col>
                            {resource?.type}{" "}
                            {resource?.subType !== "NONE" && resource?.subType}{" "}
                          </Col>
                        </Row>
                      </div>
                      <div className="sidePanel-details-item">
                        <Row>
                          <Col>{getLanguageLabel("createdBy")}</Col>
                        </Row>
                        <Row>
                          <Col>
                            <MtdUserPopover record={createdBy}>
                              {createdBy?.name}{" "}
                            </MtdUserPopover>
                            <Text type="secondary">
                              {timeConverter(resource?.createdAt)}
                            </Text>
                          </Col>
                        </Row>
                      </div>
                      <div className="sidePanel-details-item">
                        <Row>
                          <Col>{getLanguageLabel("updatedBy")}</Col>
                        </Row>
                        <Row>
                          <Col>
                            <MtdUserPopover record={updatedBy}>
                              {updatedBy?.name}{" "}
                            </MtdUserPopover>{" "}
                            <Text type="secondary">
                              {" "}
                              {resource?.updatedAt
                                ? timeConverter(resource?.updatedAt)
                                : "--"}
                            </Text>
                          </Col>
                        </Row>
                      </div>

                      <Divider style={{ margin: "1rem 0" }} />
                      <br />
                      <div className="sidePanel-details-item">
                        <Row justify={"space-between"}>
                          {userPermissions?.owner ? (
                            <>
                              <Col>
                                <Tooltip title="An owner has all the rights on the resource and it's security.">
                                  <Text
                                    type="secondary"
                                    className="pop-over-item"
                                  >
                                    {getLanguageLabel("yourAccessHere")}
                                  </Text>
                                </Tooltip>
                              </Col>
                              <Col>
                                <Tooltip title="An owner has all the rights on the resource and it's security.">
                                  <MtdTag color="#e74c3c">
                                    {getLanguageLabel("owner")}
                                  </MtdTag>
                                </Tooltip>
                              </Col>
                            </>
                          ) : userPermissions?.editor ? (
                            <>
                              <Col>
                                <Tooltip title="An editor can edit resources.">
                                  <Text type="secondary">
                                    {getLanguageLabel("yourAccessHere")}
                                  </Text>
                                </Tooltip>
                              </Col>
                              <Col>
                                <Tooltip title="An editor can edit resources.">
                                  <MtdTag color={"#3498db"}>
                                    {getLanguageLabel("editor")}
                                  </MtdTag>
                                </Tooltip>
                              </Col>
                            </>
                          ) : (
                            userPermissions?.viewer && (
                              <>
                                <Col>
                                  <Tooltip title="An viewer can only view resources and can not edit or change resource security.">
                                    <Text type="secondary">
                                      {getLanguageLabel("yourAccessHere")}
                                    </Text>
                                  </Tooltip>
                                </Col>
                                <Col>
                                  <Tooltip title="An viewer can only view resources and can not edit or change resource security.">
                                    <MtdTag color="#27ae60">
                                      {getLanguageLabel("viewer")}
                                    </MtdTag>
                                  </Tooltip>
                                </Col>
                              </>
                            )
                          )}
                        </Row>
                      </div>
                    </div>
                  ),
                },
                {
                  label: getLanguageLabel("activity"),
                  value: "activity",
                  children: (
                    <div className="sidePanel-details">
                      <div className="sidePanel-details-item">
                        <Row justify={"space-evenly"}>
                          <Col>
                            <Tooltip
                              title={
                                "Number of times the resource has been viewed."
                              }
                            >
                              <div className="text-and-icon-center">
                                <EyeOpenIcon />
                                {getRandomNumber()} Views
                              </div>
                            </Tooltip>
                          </Col>
                        </Row>
                      </div>
                      <Divider style={{ margin: "1rem 0" }} />
                      <div className="sidePanel-details-item">
                        <Avatar>P</Avatar> Platform Administrator created on{" "}
                        {timeConverter(resource?.createdAt)}
                      </div>
                    </div>
                  ),
                },
              ]}
              value={selectedTab}
              onChange={(newVal: string) => {
                setSelectedTab(newVal);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};
