import {
  Avatar,
  Col,
  Divider,
  Row,
  Select,
  Table,
  Tabs,
  Tooltip,
  Typography,
} from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { getLanguageLabel, isDefined, openNotification } from "utils/utilities";
import {
  DisableIcon,
  LockIcon,
  RemoveIcon,
} from "../../assets/icons/mtdActionIcons";
import { AddUserIcon, UserIcon } from "../../assets/icons/mtdInterfaceIcons";
import {
  ArrowLeftIcon,
  TickIcon,
} from "../../assets/icons/mtdNavigationIcon";
import MtdButton from "../../components/MtdComponents/ButtonComponent/MtdButton";
import MtdUserPopover from "../../components/UserPopover/userpopover";
import {
  getAllUserDetails,
  isPlatformAdmin,
  isUserAdmin,
} from "../../redux/actions/userActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import {
  changeGroupMetaDataAPI,
  getGroupDetailsAPI,
  updateGroupDetailsAPI,
} from "./Groups/Groups.api";
import {
  ADMINISTRATORS_GROUPS,
  getChangeMetaDataPayload,
} from "./Groups/Groups.utils";
import { Group, TChangeMetaData } from "./Groups/Group";

const { Title, Text } = Typography;
const { Option } = Select;

const { TabPane } = Tabs;

const ManageGroups = () => {
  const { id } = useParams();
  const dispatch = useDispatch<ThunkAppDispatch>();

  const [groupDetails, setGroupDetails] = useState<Group>();

  const { allusers } = useSelector(
    (state) => (state as $TSFixMe).allUserDetails
  );

  const { user: platformAdmin } = useSelector(
    (state) => (state as any).platformAdmin
  );
  const { user: groupAdmin } = useSelector(
    (state) => (state as any).groupAdmin
  );
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);
  const [activeTab, setActiveTab] = useState("members");
  const [addNewUsersToGroupDetails, setAddNewUsersToGroupDetails] = useState({
    id: id,
    action: "add",
    userIds: [],
    type: undefined,
  });
  const navigate = useNavigate();

  const checkOwnerManager = () => {
    let bool = false;
    if (isDefined(groupDetails)) {
      for (let i = 0; i < groupDetails?.owners?.length; i++) {
        if (groupDetails?.owners[i].id == user.id) bool = true;
      }

      for (let i = 0; i < groupDetails.managers.length; i++) {
        if (groupDetails.managers[i].id == user.id) bool = true;
      }
      return bool;
    }
    return false;
  };

  const columns = [
    {
      title: getLanguageLabel("name"),
      dataIndex: "name",
      sorter: (a: $TSFixMe, b: $TSFixMe) => a.name.localeCompare(b.name),
      key: "name",
      width: "30%",
      render: (e: $TSFixMe, row: $TSFixMe) => (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <MtdUserPopover record={row}>
            <div
              style={{
                display: "flex",
                marginRight: "1ev",
                alignItems: "center",
              }}
            >
              <Avatar
                style={{
                  height: "32px",
                  width: "32px",
                  border: "1px solid #ccc",
                  marginRight: "5px",
                }}
                icon={<UserIcon />}
                src={row.profileImage}
              />
              <div
                className="pop-over-item"
                onClick={(e) => navigate(`/portal/settings/user/${row.id}`)}
              >
                {e
                  || `${row.givenName ?? ""} ${row.familyName ?? ""}`.trim()
                  || row.username
                  || row.id}
              </div>
            </div>
          </MtdUserPopover>
          {canEditGroupDetails(false) && (
            <Tooltip title={getLanguageLabel("remove")} placement="right">
              <MtdButton
                icon={<RemoveIcon color={"var(--movetodata-intent-danger)"} />}
                onClick={() =>
                  updateGroupDetailsAPI({
                    id: groupDetails?.id,
                    action: "remove",
                    type: activeTab,
                    userIds: [row.id],
                  }).then(({ data }) => setGroupDetails(data))
                }
                icononly
                trimicononlypadding
                minimal
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const onClickRename = async (value: string, type: TChangeMetaData) => {
    if (isDefined(id)) {
      changeGroupMetaDataAPI(getChangeMetaDataPayload(id, type, value)).catch(
        ({ response: { data } }) => {
          openNotification("Cannot Edit Group Details", data, "error");
        }
      );
    }
  };

  const canEditGroupDetails = (applyNameCheck: boolean) => {
    let nameCheck = true;

    if (applyNameCheck)
      nameCheck = ADMINISTRATORS_GROUPS.find(
        (groupName) => groupName == groupDetails?.name
      )
        ? false
        : true;

    return nameCheck && (platformAdmin || groupAdmin || checkOwnerManager());
  };

  useEffect(() => {
    getGroupDetailsAPI(id as string).then(({ data }) => setGroupDetails(data));
    dispatch(isUserAdmin());
    dispatch(isPlatformAdmin());
  }, [id]);

  return (
    <Row style={{ height: "100%" }}>
      <Col span={14} style={{ padding: "3rem" }}>
        {groupDetails ? (
          <>
            <Row justify="start" align={"middle"}>
              <Col>
                <span
                  onClick={() => navigate(-1)}
                  style={{ cursor: "pointer" }}
                >
                  <ArrowLeftIcon size={"25px"} />
                </span>
              </Col>
              <Col>
                {canEditGroupDetails(true) ? (
                  <Tooltip title={getLanguageLabel("clickToRename")}>
                    <MtdInput
                      editText={true}
                      className={"editText"}
                      debounceInterval={1000}
                      onChange={(e: any) => {
                        onClickRename(e.target.value, "NAME");
                      }}
                      variant={"borderless"}
                      value={groupDetails.name}
                      placeholder="Add the Name of the file"
                    />
                  </Tooltip>
                ) : (
                  <Text>{groupDetails.name}</Text>
                )}
                {/* <Text>{groupDetails.name}</Text> */}
              </Col>
            </Row>
            <br />
            <Row justify={"center"}>
              {canEditGroupDetails(false) ? (
                <Tooltip title={getLanguageLabel("clickToChangeDescription")}>
                  <MtdInput
                    style={{ fontSize: "22px", fontWeight: 500 }}
                    editText={true}
                    className="editText"
                    debounceInterval={1000}
                    onChange={(e: any) => {
                      onClickRename(e.target.value, "DESCRIPTION");
                    }}
                    variant={"borderless"}
                    value={groupDetails.description}
                    placeholder={getLanguageLabel("clickToChangeDescription")}
                  />
                </Tooltip>
              ) : (
                <Text>{groupDetails.description}</Text>
              )}
            </Row>
            <Divider />
            <br />
            {canEditGroupDetails(false) && (
              <Row justify="start" gutter={[16, 16]} align="middle">
                <Col span={14}>
                  <Select
                    mode="multiple"
                    maxTagCount="responsive"
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    style={{
                      width: "100%",
                    }}
                    value={addNewUsersToGroupDetails.userIds}
                    onFocus={() => dispatch(getAllUserDetails())}
                    placeholder={getLanguageLabel("addNewMembers")}
                    onChange={(e) => {
                      setAddNewUsersToGroupDetails({
                        ...addNewUsersToGroupDetails,
                        userIds: e,
                      });
                    }}
                    filterOption={(input, option) => {
                      return (
                        option?.props.children.props.children[1]
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      );
                    }}
                  >
                    {allusers &&
                      allusers.map((i: $TSFixMe) => {
                        return (
                          <>
                            <Select.Option value={i.id}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-start",
                                }}
                              >
                                <Avatar
                                  style={{
                                    height: "22px",
                                    width: "22px",
                                    // border: "1px solid #ccc",
                                    marginRight: "5px",
                                  }}
                                  icon={<UserIcon />}
                                  src={i.profileImage}
                                />
                                {i.name
                                  || `${i.givenName ?? ""} ${i.familyName ?? ""}`.trim()
                                  || i.username
                                  || i.id} ({i.username})
                              </div>
                            </Select.Option>
                          </>
                        );
                      })}
                  </Select>
                </Col>
                <Col span={6}>
                  {" "}
                  <Select
                    style={{
                      paddingLeft: "2px",
                      borderRadius: "40px",
                      width: "100%",
                    }}
                    value={addNewUsersToGroupDetails.type}
                    placeholder="Role"
                    onChange={(e) =>
                      setAddNewUsersToGroupDetails({
                        ...addNewUsersToGroupDetails,
                        type: e,
                      })
                    }
                  >
                    <Option value="owners">{getLanguageLabel("owner")}</Option>
                    <Option value="managers">
                      {getLanguageLabel("manager")}
                    </Option>
                    <Option value="members">
                      {getLanguageLabel("member")}
                    </Option>
                  </Select>
                </Col>
                <Col>
                  <Tooltip title={getLanguageLabel("add")} placement={"right"}>
                    <MtdButton
                      icon={<AddUserIcon />}
                      disabled={addNewUsersToGroupDetails.userIds.length == 0}
                      onClick={() => {
                        updateGroupDetailsAPI(addNewUsersToGroupDetails).then(
                          ({ data }) => {
                            setActiveTab(addNewUsersToGroupDetails.type!);
                            setAddNewUsersToGroupDetails({
                              ...addNewUsersToGroupDetails,
                              userIds: [],
                              type: undefined,
                            });
                            setGroupDetails(data);
                          }
                        );
                      }}
                      minimal
                      icononly
                    ></MtdButton>
                  </Tooltip>
                </Col>
              </Row>
            )}
            <Divider />

            <Tabs
              activeKey={activeTab}
              // type="card"
              onChange={(e) => setActiveTab(e)}
              tabPosition="left"
              // style={{ height: "60vh" }}
            >
              <TabPane
                tab={<span>{getLanguageLabel("members")}</span>}
                key="members"
              >
                <Table
                  dataSource={groupDetails.members}
                  columns={columns}
                  pagination={false}
                />
              </TabPane>
              <TabPane
                tab={<span>{getLanguageLabel("managers")}</span>}
                key="managers"
              >
                <Table
                  dataSource={groupDetails.managers}
                  columns={columns}
                  // className="interactive"
                  pagination={false}
                />
              </TabPane>
              <TabPane
                tab={<span>{getLanguageLabel("owners")}</span>}
                key="owners"
              >
                <Table
                  dataSource={groupDetails.owners}
                  columns={columns}
                  // className="interactive"
                  pagination={false}
                />
              </TabPane>
            </Tabs>
          </>
        ) : (
          <MtdLoader />
        )}
      </Col>
      <Col
        span={9}
        style={{
          borderLeft: "1px solid var(--movetodata-border-color-default)",
          padding: "3rem",
        }}
      >
        <Title
          level={3}
          style={{
            marginTop: "5rem",
          }}
        >
          <LockIcon /> {getLanguageLabel("info")}
        </Title>

        <Row
          gutter={[16, 16]}
          style={{
            background: "var(--movetodata-bkg-color-muted)",
            borderRadius: "2px",
            boxShadow:
              "rgba(11, 14, 22, 0.02) 0px 0px 0px 1px, rgba(11, 14, 22, 0.04) 0px 4px 8px, rgba(11, 14, 22, 0.04) 0px 18px 46px 6px",
            padding: "2rem",
            border: "1px solid var(--movetodata-border-color-default)",
          }}
        >
          <Col span={10}>
            <strong>Access Level</strong>
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <strong>{getLanguageLabel("member")}</strong>
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <strong>{getLanguageLabel("manager")}</strong>
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <strong>{getLanguageLabel("owner")}</strong>
          </Col>

          <Col span={10}>{getLanguageLabel("addMembers")}</Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DisableIcon color="var(--movetodata-intent-danger)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TickIcon color="var(--SUCCESS_COLOR)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TickIcon color="var(--SUCCESS_COLOR)" />
          </Col>

          <Col span={10}>Remove Members</Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DisableIcon color="var(--movetodata-intent-danger)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TickIcon color="var(--SUCCESS_COLOR)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TickIcon color="var(--SUCCESS_COLOR)" />
          </Col>

          <Col span={10}>Add Managers</Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DisableIcon color="var(--movetodata-intent-danger)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DisableIcon color="var(--movetodata-intent-danger)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TickIcon color="var(--SUCCESS_COLOR)" />
          </Col>

          <Col span={10}>Remove Managers</Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DisableIcon color="var(--movetodata-intent-danger)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DisableIcon color="var(--movetodata-intent-danger)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TickIcon color="var(--SUCCESS_COLOR)" />
          </Col>

          <Col span={10}>{getLanguageLabel("deleteGroup")}</Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DisableIcon color="var(--movetodata-intent-danger)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DisableIcon color="var(--movetodata-intent-danger)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TickIcon color="var(--SUCCESS_COLOR)" />
          </Col>

          <Col span={10}>
            Grants access to resources <br />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TickIcon color="var(--SUCCESS_COLOR)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DisableIcon color="var(--movetodata-intent-danger)" />
          </Col>
          <Col
            span={4}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DisableIcon color="var(--movetodata-intent-danger)" />
          </Col>
        </Row>
        <Text style={{ fontSize: "0.8rem" }} type="secondary">
          Please Note : The group's members have access to resources assigned to
          the group.
        </Text>
      </Col>
    </Row>
  );
};

export default ManageGroups;
